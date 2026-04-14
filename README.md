# CODENAMES — Multiplayer Web Game

A full-stack multiplayer Codenames implementation built with **Next.js** and **Socket.io**.

## Stack
- **Frontend**: Next.js 14 (Pages Router) + React 18
- **Backend**: Socket.io on a custom Node.js HTTP server (same process as Next.js)
- **Realtime**: Socket.io WebSockets (no external services needed)
- **Styling**: Inline CSS with CSS variables — spy-thriller dark aesthetic

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# 3. Open http://localhost:3000
```

## How to Play

1. **Player 1** clicks **Create Room** → enters their codename → gets a 4-digit code
2. **Players 2–4** click **Join Room** → enter the same 4-digit code
3. Once 4+ players join, **Role Selection** begins automatically
4. Each player picks one of 4 roles:
   - 🔴 Red Spymaster
   - 🔴 Red Operative
   - 🔵 Blue Spymaster
   - 🔵 Blue Operative
5. Once all 4 roles have at least 1 player → game starts!
6. **Spymasters** see the color key and give one-word clues + a number
7. **Operatives** click cards to guess based on their Spymaster's clue
8. First team to reveal all their agents wins. Hit the Assassin = instant loss.

## Game Rules
- Red team starts (9 agents), Blue has 8 agents
- 7 neutral cards, 1 assassin
- Spymaster gives: ONE WORD + a number (how many cards it relates to)
- Operatives get (number + 1) guesses per turn
- Wrong guess (neutral/enemy) ends your turn
- Hit the assassin = you lose immediately
- Unlimited players per room, multiple operatives per team supported

## Project Structure
```
codenames/
├── server/index.js        # Socket.io + Next.js custom server
├── lib/
│   ├── gameEngine.js      # Core game logic (pure functions)
│   └── socket.js          # Client socket singleton
├── pages/
│   ├── index.js           # Landing page (create/join)
│   └── room/[code].js     # Room orchestrator
├── components/
│   ├── Lobby.js           # Waiting room
│   ├── RoleSelection.js   # Team/role picker
│   └── GameBoard.js       # Main game UI
└── styles/globals.css     # Global styles + CSS variables
```

## Deployment

**Railway / Render / Fly.io** (recommended for WebSockets):
```bash
npm run build
npm start
```

**Vercel**: Not recommended — Vercel doesn't support persistent WebSocket connections. Use Railway or Render instead.

Set `PORT` environment variable if needed (defaults to 3000).
