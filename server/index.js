const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createGame, applyGuess, applyClue, endTurn } = require('../lib/gameEngine');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname + '/..' });
const handle = app.getRequestHandler();

// In-memory store
const rooms = {}; // roomCode -> { players, game, status }

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getRoomState(room, socketId) {
  const player = room.players.find(p => p.id === socketId);
  const isSpymaster = player && player.role === 'spymaster';

  if (!room.game) {
    return { players: room.players, game: null, status: room.status, allReady: !!room.allReady };
  }

  // Hide card teams from operatives
  const cards = room.game.cards.map(card => ({
    ...card,
    team: (isSpymaster || card.revealed || room.game.winner) ? card.team : undefined,
  }));

  return {
    players: room.players,
    status: room.status,
    allReady: !!room.allReady,
    game: { ...room.game, cards },
  };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create room
    socket.on('create_room', ({ playerName }, callback) => {
      let code;
      do { code = generateCode(); } while (rooms[code]);

      rooms[code] = {
        code,
        players: [],
        game: null,
        status: 'lobby', // lobby | role_selection | playing | finished
      };

      callback({ success: true, code });
    });

    // Join room
    socket.on('join_room', ({ code, playerName }, callback) => {
      const room = rooms[code];
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.status === 'playing') return callback({ success: false, error: 'Game already in progress' });
      if (room.players.find(p => p.name === playerName)) {
        return callback({ success: false, error: 'Name already taken in this room' });
      }

      const player = {
        id: socket.id,
        name: playerName,
        team: null,
        role: null,
      };

      room.players.push(player);
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.playerName = playerName;

      // Move to role selection if 4+ players
      if (room.players.length >= 4 && room.status === 'lobby') {
        room.status = 'role_selection';
      }

      callback({ success: true });
      io.to(code).emit('room_update', { players: room.players, status: room.status, allReady: !!room.allReady, game: null });
    });

    // Select role
    socket.on('select_role', ({ team, role }, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room) return callback({ success: false, error: 'Room not found' });

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return callback({ success: false, error: 'Player not found' });

      // Enforce one spymaster per team
      if (role === 'spymaster') {
        const existing = room.players.find(p => p.team === team && p.role === 'spymaster' && p.id !== socket.id);
        if (existing) return callback({ success: false, error: `${team} team already has a spymaster` });
      }

      player.team = team;
      player.role = role;

      // Check if all 4 roles are filled: red spymaster, red operative, blue spymaster, blue operative
      const redSpy = room.players.find(p => p.team === 'red' && p.role === 'spymaster');
      const redOp = room.players.find(p => p.team === 'red' && p.role === 'operative');
      const blueSpy = room.players.find(p => p.team === 'blue' && p.role === 'spymaster');
      const blueOp = room.players.find(p => p.team === 'blue' && p.role === 'operative');

      const allReady = redSpy && redOp && blueSpy && blueOp;

      // Mark allReady but don't auto-start — wait for start_game event
      if (allReady) room.allReady = true;
      else room.allReady = false;

      callback({ success: true });
      io.to(code).emit('room_update', { players: room.players, status: room.status, game: null, allReady: room.allReady });
    });

    // Start game (host triggers when all ready)
    socket.on('start_game', (_, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room) return callback?.({ success: false, error: 'Room not found' });
      if (!room.allReady) return callback?.({ success: false, error: 'Not all roles filled yet' });
      if (room.status !== 'role_selection') return callback?.({ success: false, error: 'Not in role selection' });

      room.status = 'playing';
      room.game = createGame();

      for (const p of room.players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.emit('room_update', getRoomState(room, p.id));
      }
      callback?.({ success: true });
    });

    // Give clue
    socket.on('give_clue', ({ clue, count }, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room || !room.game) return callback({ success: false });

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.role !== 'spymaster') return callback({ success: false, error: 'Not a spymaster' });
      if (room.game.currentTurn !== player.team) return callback({ success: false, error: 'Not your turn' });
      if (room.game.phase !== 'giving_clue') return callback({ success: false, error: 'Not clue phase' });

      room.game = applyClue(room.game, clue.toUpperCase(), parseInt(count));
      callback({ success: true });

      for (const p of room.players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.emit('room_update', getRoomState(room, p.id));
      }
    });

    // Make guess
    socket.on('make_guess', ({ cardIndex }, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room || !room.game) return callback({ success: false });

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.role !== 'operative') return callback({ success: false, error: 'Only operatives can guess' });
      if (room.game.currentTurn !== player.team) return callback({ success: false, error: 'Not your turn' });
      if (room.game.phase !== 'guessing') return callback({ success: false, error: 'Not guessing phase' });

      room.game = applyGuess(room.game, cardIndex, player.team);
      if (room.game.winner) room.status = 'finished';

      callback({ success: true });

      for (const p of room.players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.emit('room_update', getRoomState(room, p.id));
      }
    });

    // End turn voluntarily
    socket.on('end_turn', (_, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room || !room.game) return callback?.({ success: false });

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.role !== 'operative') return callback?.({ success: false });
      if (room.game.currentTurn !== player.team) return callback?.({ success: false });
      if (room.game.phase !== 'guessing') return callback?.({ success: false });

      room.game = endTurn(room.game);
      callback?.({ success: true });

      for (const p of room.players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.emit('room_update', getRoomState(room, p.id));
      }
    });

    // Restart game
    socket.on('restart_game', (_, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room) return;

      room.game = createGame();
      room.status = 'playing';

      for (const p of room.players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.emit('room_update', getRoomState(room, p.id));
      }
      callback?.({ success: true });
    });

    // Get current state (on reconnect/refresh)
    socket.on('get_state', (_, callback) => {
      const code = socket.data.roomCode;
      const room = rooms[code];
      if (!room) return callback?.({ success: false });
      callback?.({ success: true, state: getRoomState(room, socket.id) });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const code = socket.data.roomCode;
      if (!code || !rooms[code]) return;

      const room = rooms[code];
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[code];
        return;
      }

      io.to(code).emit('room_update', getRoomState(room, null));
      io.to(code).emit('player_left', { name: socket.data.playerName });
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Codenames running at http://localhost:${PORT}`);
  });
});
