import { useState, useRef, useEffect } from 'react';

export default function GameBoard({ roomState, playerName, socket }) {
  const { game, players, status } = roomState;
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);
  const [error, setError] = useState('');
  const logRef = useRef(null);

  const me = players.find(p => p.name === playerName);
  const isSpymaster = me?.role === 'spymaster';
  const isOperative = me?.role === 'operative';
  const myTeam = me?.team;

  const isMyTurn = game.currentTurn === myTeam;
  const canGiveClue = isSpymaster && isMyTurn && game.phase === 'giving_clue' && !game.winner;
  const canGuess = isOperative && isMyTurn && game.phase === 'guessing' && !game.winner;
  const canEndTurn = isOperative && isMyTurn && game.phase === 'guessing' && !game.winner;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [game.log]);

  function handleGuess(index) {
    if (!canGuess) return;
    setError('');
    socket.emit('make_guess', { cardIndex: index }, (res) => {
      if (!res.success) setError(res.error || 'Cannot guess');
    });
  }

  function handleClue() {
    if (!clueWord.trim()) return setError('Enter a clue word');
    if (clueWord.trim().split(' ').length > 1) return setError('Clue must be one word');
    setError('');
    socket.emit('give_clue', { clue: clueWord.trim(), count: clueCount }, (res) => {
      if (res.success) { setClueWord(''); setClueCount(1); }
      else setError(res.error || 'Failed to give clue');
    });
  }

  function handleEndTurn() {
    socket.emit('end_turn', {}, () => {});
  }

  function handleRestart() {
    socket.emit('restart_game', {}, () => {});
  }

  const turnTeam = game.currentTurn;
  const turnColor = turnTeam === 'red' ? 'var(--red)' : 'var(--blue)';
  const turnColorLight = turnTeam === 'red' ? 'var(--red-light)' : 'var(--blue-light)';

  return (
    <div style={styles.layout}>
      {/* ── LEFT: Board Area ── */}
      <div style={styles.boardArea}>

        {/* Score + turn bar */}
        <div style={styles.scoreBar}>
          <div style={styles.scoreTeam}>
            <div style={{ ...styles.scorePill, background: 'var(--red)', color: '#fff' }}>
              <span style={styles.scoreNum}>{game.redRemaining}</span>
              <span style={styles.scoreLabel}>RED</span>
            </div>
          </div>

          <div style={{
            ...styles.turnBadge,
            background: turnColor,
            boxShadow: `0 2px 12px ${turnTeam === 'red' ? 'var(--red-glow)' : 'var(--blue-glow)'}`,
          }}>
            {game.winner
              ? `${game.winner.toUpperCase()} WINS!`
              : `${turnTeam.toUpperCase()} · ${game.phase === 'giving_clue' ? 'SPYMASTER' : 'OPERATIVES'}`
            }
          </div>

          <div style={{ ...styles.scoreTeam, justifyContent: 'flex-end' }}>
            <div style={{ ...styles.scorePill, background: 'var(--blue)', color: '#fff' }}>
              <span style={styles.scoreNum}>{game.blueRemaining}</span>
              <span style={styles.scoreLabel}>BLUE</span>
            </div>
          </div>
        </div>

        {/* Active clue display */}
        {game.clue && !game.winner && (
          <div style={{
            ...styles.clueDisplay,
            borderColor: turnTeam === 'red' ? 'var(--red)' : 'var(--blue-light)',
          }}>
            <span style={styles.clueDisplayLabel}>CLUE</span>
            <span style={{ ...styles.clueDisplayWord, color: turnColorLight }}>
              {game.clue}
            </span>
            <span style={styles.clueDisplayCount}>× {game.clueCount === 0 ? '∞' : game.clueCount}</span>
            {game.phase === 'guessing' && (
              <span style={styles.guessesLeft}>
                {game.guessesLeft === Infinity ? '∞' : game.guessesLeft} guess{game.guessesLeft !== 1 ? 'es' : ''} left
              </span>
            )}
          </div>
        )}

        {/* 5×5 Board */}
        <div style={styles.board}>
          {game.cards.map((card, i) => (
            <CardTile
              key={i}
              card={card}
              isSpymaster={isSpymaster}
              canGuess={canGuess}
              onClick={() => handleGuess(i)}
            />
          ))}
        </div>

        {/* Legend for spymasters */}
        {isSpymaster && (
          <div style={styles.legend}>
            <LegendItem bg="var(--red-card-bg)" border="var(--red-card-border)" label="RED" />
            <LegendItem bg="var(--blue-card-bg)" border="var(--blue-card-border)" label="BLUE" />
            <LegendItem bg="var(--neutral-card-bg)" border="var(--neutral-card-border)" label="NEUTRAL" />
            <LegendItem bg="var(--assassin-card-bg)" border="var(--assassin-card-border)" label="ASSASSIN" />
          </div>
        )}
      </div>

      {/* ── RIGHT: Sidebar ── */}
      <div style={styles.sidebar}>

        {/* My role + restart button row */}
        <div style={styles.sidebarHeader}>
          <div style={styles.myRole}>
            <span style={{
              fontWeight: 600,
              color: myTeam === 'red' ? 'var(--red-light)' : 'var(--blue-light)',
            }}>
              {myTeam?.toUpperCase()}
            </span>
            {' '}{me?.role?.toUpperCase()}
            {isSpymaster && <span style={styles.spymasterBadge}>👁 KEY</span>}
          </div>
          {/* Small restart button — always visible mid-game */}
          {!game.winner && (
            <button
              style={styles.smallRestartBtn}
              onClick={handleRestart}
              title="Restart with new words"
            >
              ↺ NEW WORDS
            </button>
          )}
        </div>

        {/* Win banner */}
        {game.winner && (
          <div style={{
            ...styles.winBanner,
            background: game.winner === 'red' ? 'rgba(192,57,43,0.15)' : 'rgba(26,82,118,0.15)',
            borderColor: game.winner === 'red' ? 'var(--red)' : 'var(--blue-light)',
          }}>
            <div style={{
              ...styles.winTitle,
              color: game.winner === 'red' ? 'var(--red-light)' : 'var(--blue-light)',
            }}>
              {game.winner.toUpperCase()} WINS
            </div>
            <div style={styles.winSub}>Operation complete</div>
            <button style={styles.restartBtn} onClick={handleRestart}>
              NEW OPERATION
            </button>
          </div>
        )}

        {/* Clue input */}
        {canGiveClue && (
          <div style={styles.cluePanel}>
            <div style={styles.panelTitle}>TRANSMIT CLUE</div>
            <input
              style={styles.clueInput}
              placeholder="ONE WORD"
              value={clueWord}
              onChange={e => setClueWord(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleClue()}
              maxLength={30}
              autoFocus
            />
            <div style={styles.countRow}>
              <span style={styles.countLabel}>HOW MANY CARDS?</span>
              <div style={styles.countBtns}>
                {[0,1,2,3,4,5,6,7,8].map(n => (
                  <button
                    key={n}
                    style={{ ...styles.countBtn, ...(clueCount === n ? styles.countBtnActive : {}) }}
                    onClick={() => setClueCount(n)}
                  >
                    {n === 0 ? '∞' : n}
                  </button>
                ))}
              </div>
            </div>
            <button style={styles.submitClue} onClick={handleClue}>
              SEND →
            </button>
          </div>
        )}

        {/* Waiting for spymaster */}
        {!isSpymaster && isMyTurn && game.phase === 'giving_clue' && !game.winner && (
          <div style={styles.waitPanel}>
            <div style={styles.waitPulse}>⏳ Waiting for your Spymaster...</div>
          </div>
        )}

        {/* Enemy turn */}
        {!isMyTurn && !game.winner && (
          <div style={styles.waitPanel}>
            <div style={{ ...styles.waitLabel, color: turnColorLight }}>ENEMY TURN</div>
            <div style={styles.waitDesc}>
              {game.phase === 'giving_clue'
                ? `${turnTeam.toUpperCase()} Spymaster is thinking...`
                : game.clue
                  ? `"${game.clue}" × ${game.clueCount === 0 ? '∞' : game.clueCount} — ${turnTeam.toUpperCase()} guessing`
                  : `${turnTeam.toUpperCase()} team is playing`
              }
            </div>
          </div>
        )}

        {/* End turn button */}
        {canEndTurn && (
          <button style={styles.endTurnBtn} onClick={handleEndTurn}>
            PASS TURN →
          </button>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {/* Operation log */}
        <div style={styles.log} ref={logRef}>
          <div style={styles.logTitle}>OPERATION LOG</div>
          {game.log.length === 0 && <div style={styles.logEmpty}>No events yet…</div>}
          {[...game.log].reverse().map((entry, i) => (
            <LogEntry key={i} entry={entry} />
          ))}
        </div>

        {/* Players list */}
        <div style={styles.playersList}>
          {players.map(p => (
            <div key={p.id} style={styles.playerItem}>
              <div style={{
                ...styles.playerDot,
                background: p.team === 'red' ? 'var(--red-light)' : 'var(--blue-light)',
              }} />
              <span style={styles.playerItemName}>
                {p.name}{p.name === playerName ? ' (you)' : ''}
              </span>
              <span style={styles.playerItemRole}>{p.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardTile({ card, isSpymaster, canGuess, onClick }) {
  const { word, team, revealed } = card;

  // Determine visual state
  let bg, border, textColor, opacity = 1, cursor = 'default', strikethrough = false;

  if (revealed) {
    strikethrough = true;
    opacity = 0.6;
    if (team === 'red') {
      bg = 'var(--red-card-bg)'; border = 'var(--red-card-border)'; textColor = 'var(--red-card-text)';
    } else if (team === 'blue') {
      bg = 'var(--blue-card-bg)'; border = 'var(--blue-card-border)'; textColor = 'var(--blue-card-text)';
    } else if (team === 'assassin') {
      bg = 'var(--assassin-card-bg)'; border = 'var(--assassin-card-border)'; textColor = 'var(--assassin-card-text)';
    } else {
      bg = 'var(--neutral-card-bg)'; border = 'var(--neutral-card-border)'; textColor = 'var(--neutral-card-text)';
    }
  } else if (isSpymaster && team) {
    // Spymaster preview — full color but slightly dimmer
    if (team === 'red') {
      bg = 'var(--spy-red-bg)'; border = 'var(--red-card-border)'; textColor = 'var(--red-card-text)';
    } else if (team === 'blue') {
      bg = 'var(--spy-blue-bg)'; border = 'var(--blue-card-border)'; textColor = 'var(--blue-card-text)';
    } else if (team === 'assassin') {
      bg = 'var(--assassin-card-bg)'; border = 'var(--assassin-card-border)'; textColor = 'var(--assassin-card-text)';
    } else {
      bg = 'var(--neutral-card-bg)'; border = 'var(--neutral-card-border)'; textColor = 'var(--neutral-card-text)'; opacity = 0.7;
    }
  } else {
    bg = 'var(--card-unrevealed-bg)'; border = 'var(--card-unrevealed-border)'; textColor = 'var(--card-unrevealed-text)';
    if (canGuess) cursor = 'pointer';
  }

  const fontSize = word.length > 8 ? '0.72rem' : word.length > 6 ? '0.82rem' : '0.92rem';

  return (
    <button
      style={{
        ...cardStyles.tile,
        background: bg,
        border: `2px solid ${border}`,
        color: textColor,
        opacity,
        cursor,
      }}
      onClick={canGuess && !revealed ? onClick : undefined}
      disabled={!canGuess || revealed}
    >
      {revealed && team === 'assassin' && <div style={cardStyles.skull}>☠</div>}
      <span style={{ ...cardStyles.word, fontSize, textDecoration: strikethrough ? 'line-through' : 'none' }}>
        {word}
      </span>
      {/* Spymaster dot indicator */}
      {isSpymaster && !revealed && team && (
        <div style={{
          ...cardStyles.spyDot,
          background:
            team === 'red' ? 'var(--red-light)' :
            team === 'blue' ? 'var(--blue-light)' :
            team === 'assassin' ? '#888' : 'var(--neutral-light)',
        }} />
      )}
    </button>
  );
}

function LegendItem({ bg, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ width: '14px', height: '14px', background: bg, border: `2px solid ${border}`, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        {label}
      </span>
    </div>
  );
}

function LogEntry({ entry }) {
  let color = 'var(--text-muted)', text = '';

  if (entry.type === 'clue') {
    color = entry.team === 'red' ? 'var(--red-light)' : 'var(--blue-light)';
    text = `${entry.team.toUpperCase()} CLUE: "${entry.clue}" × ${entry.count === 0 ? '∞' : entry.count}`;
  } else if (entry.type === 'guess') {
    const correct = entry.result === entry.team;
    color = entry.result === 'assassin' ? '#e74c3c' : correct ? '#2ecc71' : '#e67e22';
    text = `${entry.team.toUpperCase()} → ${entry.word} (${entry.result === 'assassin' ? '☠ ASSASSIN' : entry.result.toUpperCase()})`;
  } else if (entry.type === 'system') {
    color = 'var(--gold)';
    text = entry.text;
  }

  return (
    <div style={{ ...logStyles.entry, color }}>
      <span style={logStyles.bullet}>▸</span>
      <span>{text}</span>
    </div>
  );
}

const cardStyles = {
  tile: {
    position: 'relative',
    padding: '0.4rem 0.3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '58px',
    outline: 'none',
    overflow: 'hidden',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    borderRadius: '2px',
  },
  word: {
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.06em',
    lineHeight: 1.1,
    textAlign: 'center',
  },
  skull: {
    position: 'absolute',
    top: '3px',
    right: '5px',
    fontSize: '0.65rem',
    opacity: 0.7,
  },
  spyDot: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
};

const logStyles = {
  entry: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    lineHeight: 1.5,
    display: 'flex',
    gap: '0.35rem',
    letterSpacing: '0.01em',
  },
  bullet: { flexShrink: 0, opacity: 0.4 },
};

const styles = {
  layout: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 290px',
    minHeight: 0,
    overflow: 'hidden',
  },
  boardArea: {
    padding: '1rem 1rem 1rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    overflow: 'auto',
    background: 'var(--bg)',
  },
  scoreBar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '0.75rem',
  },
  scoreTeam: {
    display: 'flex',
    alignItems: 'center',
  },
  scorePill: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.4rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '2px',
  },
  scoreNum: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    lineHeight: 1,
  },
  scoreLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    opacity: 0.8,
  },
  turnBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    color: '#fff',
    padding: '0.4rem 1rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderRadius: '2px',
  },
  clueDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'var(--surface)',
    border: '2px solid',
    padding: '0.5rem 0.875rem',
    borderRadius: '2px',
  },
  clueDisplayLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
  },
  clueDisplayWord: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    letterSpacing: '0.1em',
    lineHeight: 1,
  },
  clueDisplayCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    color: 'var(--text-muted)',
  },
  guessesLeft: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--gold)',
    letterSpacing: '0.08em',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '7px',
    flex: 1,
  },
  legend: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },

  /* Sidebar */
  sidebar: {
    borderLeft: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 1rem',
    borderBottom: '1px solid var(--border)',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  myRole: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    flexWrap: 'wrap',
  },
  spymasterBadge: {
    fontSize: '0.58rem',
    color: 'var(--gold)',
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    padding: '0.1rem 0.35rem',
  },
  smallRestartBtn: {
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    letterSpacing: '0.12em',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  winBanner: {
    padding: '1.25rem',
    borderBottom: '1px solid',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    alignItems: 'center',
    borderRadius: '0',
  },
  winTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.2em',
  },
  winSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.2em',
  },
  restartBtn: {
    marginTop: '0.25rem',
    background: 'var(--gold)',
    border: 'none',
    color: '#111',
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem',
    letterSpacing: '0.15em',
    padding: '0.5rem 1.25rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  cluePanel: {
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  panelTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
  },
  clueInput: {
    background: 'var(--surface2)',
    border: '2px solid var(--border-light)',
    color: 'var(--text)',
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    letterSpacing: '0.15em',
    padding: '0.5rem 0.75rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  countRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  countLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
  },
  countBtns: {
    display: 'flex',
    gap: '3px',
    flexWrap: 'wrap',
  },
  countBtn: {
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    width: '27px',
    height: '27px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  countBtnActive: {
    background: 'var(--gold)',
    color: '#111',
    border: '1px solid var(--gold)',
  },
  submitClue: {
    background: 'var(--red)',
    border: 'none',
    color: 'white',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    padding: '0.55rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  waitPanel: {
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  waitPulse: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.03em',
    animation: 'pulse 1.8s ease infinite',
    lineHeight: 1.6,
  },
  waitLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
  },
  waitDesc: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    letterSpacing: '0.02em',
  },
  endTurnBtn: {
    margin: '0.75rem 1rem',
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.12em',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  error: {
    margin: '0 1rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--red-light)',
    borderLeft: '2px solid var(--red)',
    paddingLeft: '0.5rem',
    letterSpacing: '0.02em',
  },
  log: {
    flex: 1,
    overflow: 'auto',
    padding: '0.75rem 1rem',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    minHeight: '100px',
    maxHeight: '260px',
  },
  logTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
    marginBottom: '0.3rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.35rem',
  },
  logEmpty: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--text-dim)',
    fontStyle: 'italic',
  },
  playersList: {
    padding: '0.75rem 1rem',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.28rem',
  },
  playerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  playerDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  playerItemName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.67rem',
    color: 'var(--text-muted)',
    flex: 1,
    letterSpacing: '0.02em',
  },
  playerItemRole: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.04em',
  },
};
