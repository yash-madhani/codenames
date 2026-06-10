const WORDS = [
  "APPLE", "BRIDGE", "CASTLE", "PIRATE", "DOCTOR",
  "EAGLE", "ROBOT", "DESERT", "FOREST", "RIVER",
  "MOUNTAIN", "SATELLITE", "DIAMOND", "SHADOW", "ENGINE",
  "CLOCK", "BOTTLE", "WINDOW", "GARDEN", "ISLAND",
  "KNIGHT", "QUEEN", "KING", "PRINCESS", "DRAGON",
  "WIZARD", "NINJA", "SPY", "AGENT", "THIEF",
  "CROWN", "SWORD", "SHIELD", "ARROW", "HAMMER",
  "ANCHOR", "SHIP", "SUBMARINE", "AIRPORT", "TRAIN",
  "TUNNEL", "ROAD", "MARKET", "BANK", "LIBRARY",
  "SCHOOL", "MUSEUM", "TEMPLE", "THEATER", "STADIUM",
  "JUNGLE", "OCEAN", "VOLCANO", "GLACIER", "CANYON",
  "MOON", "SUN", "STAR", "PLANET", "COMET",
  "GALAXY", "ALIEN", "ASTRONAUT", "LABORATORY", "MICROSCOPE",
  "TELESCOPE", "BATTERY", "LASER", "RADAR", "COMPUTER",
  "KEYBOARD", "PHONE", "CAMERA", "HEADPHONES", "SPEAKER",
  "PENGUIN", "TIGER", "WHALE", "DOLPHIN", "WOLF",
  "FOX", "BEAR", "OWL", "RABBIT", "SNAKE",
  "CHOCOLATE", "PIZZA", "BURGER", "COFFEE", "HONEY",
  "TREASURE", "MAP", "CAVE", "TORCH", "LANTERN",
  "CLOUD", "STORM", "THUNDER", "RAINBOW", "MIRROR"
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createGame() {
  const selectedWords = shuffle(WORDS).slice(0, 25);
  
  // Red goes first: 9 red, 8 blue, 1 assassin, 7 neutral
  const assignments = [
    ...Array(9).fill('red'),
    ...Array(8).fill('blue'),
    ...Array(1).fill('assassin'),
    ...Array(7).fill('neutral'),
  ];
  const shuffledAssignments = shuffle(assignments);

  const cards = selectedWords.map((word, i) => ({
    word,
    team: shuffledAssignments[i],
    revealed: false,
  }));

  return {
    cards,
    currentTurn: 'red', // red starts
    phase: 'giving_clue', // giving_clue | guessing
    clue: null,
    clueCount: 0,
    guessesLeft: 0,
    winner: null,
    log: [],
    redRemaining: 9,
    blueRemaining: 8,
  };
}

function applyGuess(game, cardIndex, playerTeam) {
  const card = game.cards[cardIndex];
  if (card.revealed || game.winner) return game;

  const newGame = JSON.parse(JSON.stringify(game));
  newGame.cards[cardIndex].revealed = true;

  const entry = { type: 'guess', word: card.word, team: playerTeam, result: card.team };
  newGame.log.push(entry);

  if (card.team === 'assassin') {
    newGame.winner = playerTeam === 'red' ? 'blue' : 'red';
    newGame.log.push({ type: 'system', text: `💀 ${playerTeam.toUpperCase()} hit the ASSASSIN! ${newGame.winner.toUpperCase()} wins!` });
    return newGame;
  }

  if (card.team === 'red') newGame.redRemaining--;
  if (card.team === 'blue') newGame.blueRemaining--;

  if (newGame.redRemaining === 0) {
    newGame.winner = 'red';
    newGame.log.push({ type: 'system', text: '🔴 RED team found all their agents! RED wins!' });
    return newGame;
  }
  if (newGame.blueRemaining === 0) {
    newGame.winner = 'blue';
    newGame.log.push({ type: 'system', text: '🔵 BLUE team found all their agents! BLUE wins!' });
    return newGame;
  }

  // Wrong team or neutral — end turn
  if (card.team !== playerTeam) {
    newGame.phase = 'giving_clue';
    newGame.currentTurn = playerTeam === 'red' ? 'blue' : 'red';
    newGame.clue = null;
    newGame.clueCount = 0;
    newGame.guessesLeft = 0;
    newGame.log.push({ type: 'system', text: `Turn passes to ${newGame.currentTurn.toUpperCase()}` });
    return newGame;
  }

  // Correct guess
  newGame.guessesLeft--;
  if (newGame.guessesLeft <= 0) {
    newGame.phase = 'giving_clue';
    newGame.currentTurn = playerTeam === 'red' ? 'blue' : 'red';
    newGame.clue = null;
    newGame.clueCount = 0;
    newGame.log.push({ type: 'system', text: `Turn passes to ${newGame.currentTurn.toUpperCase()}` });
  }

  return newGame;
}

function applyClue(game, clue, count) {
  const newGame = JSON.parse(JSON.stringify(game));
  newGame.clue = clue;
  newGame.clueCount = count;
  newGame.guessesLeft = count === 0 ? Infinity : count + 1; // +1 bonus guess
  newGame.phase = 'guessing';
  newGame.log.push({ type: 'clue', team: newGame.currentTurn, clue, count });
  return newGame;
}

function endTurn(game) {
  const newGame = JSON.parse(JSON.stringify(game));
  newGame.currentTurn = game.currentTurn === 'red' ? 'blue' : 'red';
  newGame.phase = 'giving_clue';
  newGame.clue = null;
  newGame.clueCount = 0;
  newGame.guessesLeft = 0;
  newGame.log.push({ type: 'system', text: `Turn passes to ${newGame.currentTurn.toUpperCase()}` });
  return newGame;
}

module.exports = { createGame, applyGuess, applyClue, endTurn };
