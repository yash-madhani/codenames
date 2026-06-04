const WORDS = [
  "AFRICA","AGENT","AIR","ALIEN","ALPS","AMAZON","AMBULANCE","AMERICA","ANGEL","ANTARCTICA",
  "APPLE","ARM","ATLANTIS","AUSTRALIA","AZTEC","BACK","BALL","BAND","BANK","BAR",
  "BARK","BAT","BEACH","BEAR","BEAT","BED","BELL","BERLIN","BERRY","BILL",
  "BLOCK","BOARD","BOLT","BOMB","BOND","BOOM","BOOT","BOTTLE","BOTTOM","BOW",
  "BOX","BRIDGE","BRUSH","BUCK","BUFFALO","BUG","BURN","BUTT","BUTTON","CALF",
  "CANADA","CAPITAL","CAR","CARD","CARROT","CAST","CAT","CELL","CHAIR","CHANGE",
  "CHARGE","CHECK","CHEST","CHICK","CHINA","CHOCOLATE","CHURCH","CIRCLE","CLIFF","CLOAK",
  "CLUB","CODE","COLD","COLUMN","COMIC","COMPOUND","CONTRACT","COOK","COPPER","COTTON",
  "COURT","COVER","CRANE","CRASH","CRICKET","CROSS","CROWN","CYCLE","DAM","DATE",
  "DAY","DEATH","DECK","DEGREE","DIAMOND","DICE","DINOSAUR","DISEASE","DOCTOR","DOG",
  "DRAFT","DRAGON","DRILL","DROP","DRUM","DUCK","EGYPT","ENGINE","EUROPE","EYE",
  "FACE","FALL","FENCE","FIELD","FIGHTER","FIRE","FISH","FIX","FLAG","FLAT",
  "FLY","FOOT","FORCE","FOREST","FORK","FRANCE","GAME","GAS","GENIUS","GERMANY",
  "GHOST","GIANT","GLASS","GLOVE","GOLD","GRACE","GREECE","GREEN","GROUND","GUITAR",
  "GUN","HAMMER","HEAD","HEART","HELICOPTER","HOOK","HORSE","HOSPITAL","HOTEL","ICE",
  "INDIA","IRON","IVORY","JACK","JAM","JET","JUDGE","JUPITER","KANGAROO","KING",
  "KNIFE","LAB","LAWYER","LEAD","LEMON","LIFE","LIGHT","LIMOUSINE","LINE","LION",
  "LOCK","LOG","LOCH","LONDON","LUCK","MAIL","MAMMOTH","MAPLE","MARBLE","MARCH",
  "MATCH","MERCURY","MEXICO","MINE","MINT","MIRROR","MISS","MOON","MOUNT","MOUSE",
  "MOUTH","NAIL","NET","NIGHT","NOTE","NOVEL","NUT","OAR","OIL","OLIVE",
  "OLYMPUS","OPERA","ORANGE","PALM","PAN","PARK","PASS","PASTE","PAW","PENGUIN",
  "PIANO","PIE","PILOT","PIN","PIPE","PISTOL","PIT","PIZZA","PLANE","PLASTIC",
  "PLATE","POINT","POLAR","POOL","PORT","POST","POT","POUND","PRESS","PRINCE",
  "PUMPKIN","PYRAMID","QUEEN","RABBIT","RACK","RANGE","RAY","REVOLUTION","RING","ROCK",
  "ROME","ROOT","ROSE","ROUND","ROULETTE","RUSSIA","SAIL","SATELLITE","SCALE","SCHOOL",
  "SCORPION","SCREEN","SEAL","SHADOW","SHAKESPEARE","SHARK","SHOT","SINK","SLIP","SLUG",
  "SOLDIER","SOUL","SPACE","SPELL","SPIDER","SPIKE","SPINE","SPOT","SPRING","SPY",
  "STAFF","STAR","STATE","STEEL","STICK","STOCK","STRAW","STRETCH","STRIKE","SUIT",
  "SUPER","SWING","SWITCH","TABLET","TANK","TAP","TEACHER","TEMPLE","THUMB","TICK",
  "TIE","TIME","TIP","TOAD","TOE","TOKYO","TOOTH","TORCH","TOWER","TRACK",
  "TRIP","TRUNK","TUBE","TURKEY","UMBRELLA","UNICORN","VACUUM","VAN","VAULT","VICTORIA",
  "VIRUS","VULTURE","WALL","WAND","WASHER","WATCH","WATER","WAVE","WEB","WELL",
  "WHALE","WHIP","WIND","WITCH","WOLF","WORM","YARD","YEW","ZEBRA","ZEUS"
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
