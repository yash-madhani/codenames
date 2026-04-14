import { useState } from 'react';

const ROLES = [
  { team: 'red', role: 'spymaster', label: 'RED SPYMASTER', desc: 'You see the key. Give one-word clues to guide your operatives.', color: 'var(--red)', accentColor: '#e74c3c' },
  { team: 'red', role: 'operative', label: 'RED OPERATIVE', desc: 'Listen to clues. Guess which cards belong to Red.', color: 'var(--red-light)', accentColor: '#e74c3c' },
  { team: 'blue', role: 'spymaster', label: 'BLUE SPYMASTER', desc: 'You see the key. Give one-word clues to guide your operatives.', color: 'var(--blue-light)', accentColor: '#2980b9' },
  { team: 'blue', role: 'operative', label: 'BLUE OPERATIVE', desc: 'Listen to clues. Guess which cards belong to Blue.', color: 'var(--blue-light)', accentColor: '#2980b9' },
];

export default function RoleSelection({ roomState, playerName, socket }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const players = roomState?.players || [];
  const allReady = roomState?.allReady;

  const me = players.find(p => p.name === playerName);
  const myTeam = me?.team;
  const myRole = me?.role;

  function getOccupant(team, role) {
    return players.filter(p => p.team === team && p.role === role);
  }

  function selectRole(team, role) {
    if (loading) return;
    setError('');
    setLoading(true);
    socket.emit('select_role', { team, role }, (res) => {
      setLoading(false);
      if (!res.success) setError(res.error || 'Failed to select role');
    });
  }

  function startGame() {
    if (!allReady || starting) return;
    setStarting(true);
    setError('');
    socket.emit('start_game', {}, (res) => {
      setStarting(false);
      if (!res?.success) setError(res?.error || 'Failed to start game');
    });
  }

  const redSpy = getOccupant('red', 'spymaster');
  const redOp = getOccupant('red', 'operative');
  const blueSpy = getOccupant('blue', 'spymaster');
  const blueOp = getOccupant('blue', 'operative');

  return (
    <div style={styles.container}>
      <div style={styles.header} className="animate-fade">
        <div style={styles.title}>CHOOSE YOUR ROLE</div>
        <div style={styles.subtitle}>
          Each team needs at least 1 Spymaster and 1 Operative. Once all roles are filled, anyone can start the operation.
        </div>
      </div>

      <div style={styles.grid} className="animate-fade">
        {ROLES.map(({ team, role, label, desc, color, accentColor }) => {
          const occupants = getOccupant(team, role);
          const isMine = myTeam === team && myRole === role;
          const isSpymasterTaken = role === 'spymaster' && occupants.length > 0 && !isMine;

          return (
            <button
              key={`${team}-${role}`}
              style={{
                ...styles.card,
                ...(isMine ? { borderColor: accentColor, background: 'var(--surface2)', boxShadow: `0 0 16px ${accentColor}25` } : {}),
                ...(isSpymasterTaken ? styles.cardDisabled : {}),
              }}
              onClick={() => !isSpymasterTaken && selectRole(team, role)}
              disabled={isSpymasterTaken || loading}
            >
              <div style={{ ...styles.cardAccent, background: accentColor }} />
              <div style={{ ...styles.teamBadge, color: accentColor }}>{team.toUpperCase()}</div>
              <div style={styles.roleName}>{label}</div>
              <div style={styles.roleDesc}>{desc}</div>
              <div style={styles.occupants}>
                {occupants.length === 0 ? (
                  <span style={styles.emptySlot}>— VACANT —</span>
                ) : (
                  occupants.map(p => (
                    <span key={p.id} style={{ ...styles.occupant, color }}>
                      {p.name}{p.name === playerName ? ' (YOU)' : ''}
                    </span>
                  ))
                )}
              </div>
              {isMine && (
                <div style={{ ...styles.selectedBadge, background: accentColor }}>✓ SELECTED</div>
              )}
              {isSpymasterTaken && <div style={styles.takenBadge}>TAKEN</div>}
            </button>
          );
        })}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Status checklist */}
      <div style={styles.checklist}>
        <CheckItem label="Red Spymaster" filled={redSpy.length > 0} names={redSpy.map(p => p.name)} color="var(--red-light)" />
        <CheckItem label="Red Operative" filled={redOp.length > 0} names={redOp.map(p => p.name)} color="var(--red-light)" />
        <CheckItem label="Blue Spymaster" filled={blueSpy.length > 0} names={blueSpy.map(p => p.name)} color="var(--blue-light)" />
        <CheckItem label="Blue Operative" filled={blueOp.length > 0} names={blueOp.map(p => p.name)} color="var(--blue-light)" />
      </div>

      {/* Start Game button */}
      <div style={styles.startSection}>
        {allReady ? (
          <button
            style={{
              ...styles.startBtn,
              ...(starting ? styles.startBtnDisabled : {}),
            }}
            onClick={startGame}
            disabled={starting}
          >
            {starting ? 'LAUNCHING...' : '⚡ START OPERATION'}
          </button>
        ) : (
          <div style={styles.startBtnGhost}>
            WAITING FOR ALL ROLES TO BE FILLED
          </div>
        )}
        <div style={styles.startHint}>
          {allReady
            ? 'All roles assigned — any player can start the game.'
            : 'Fill all 4 roles before starting.'}
        </div>
      </div>

      {/* Players list */}
      <div style={styles.playerList}>
        {players.map(p => (
          <div key={p.id} style={styles.playerChip}>
            <span style={{
              ...styles.playerTeamDot,
              background: p.team === 'red' ? 'var(--red)' : p.team === 'blue' ? 'var(--blue-light)' : 'var(--text-dim)',
            }} />
            <span style={styles.playerChipName}>{p.name}</span>
            {p.role
              ? <span style={styles.playerChipRole}>{p.team?.toUpperCase()} {p.role?.toUpperCase()}</span>
              : <span style={styles.playerChipUnassigned}>NO ROLE YET</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckItem({ label, filled, names, color }) {
  return (
    <div style={checkStyles.item}>
      <div style={{
        ...checkStyles.icon,
        background: filled ? color : 'transparent',
        border: filled ? `1px solid ${color}` : '1px solid var(--border-light)',
        color: filled ? '#fff' : 'var(--text-dim)',
      }}>
        {filled ? '✓' : '○'}
      </div>
      <span style={{ ...checkStyles.label, color: filled ? 'var(--text)' : 'var(--text-muted)' }}>
        {label}
      </span>
      {filled && names.length > 0 && (
        <span style={{ ...checkStyles.names, color }}>
          {names.join(', ')}
        </span>
      )}
    </div>
  );
}

const checkStyles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  icon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.05em',
    transition: 'color 0.2s',
  },
  names: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.03em',
    marginLeft: '0.25rem',
  },
};

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.15em',
    color: 'var(--text)',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
    letterSpacing: '0.03em',
    lineHeight: 1.7,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    width: '100%',
    maxWidth: '860px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
  },
  teamBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.25em',
  },
  roleName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    letterSpacing: '0.1em',
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  roleDesc: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: '0.5rem',
  },
  occupants: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    minHeight: '1.4rem',
  },
  emptySlot: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
  },
  occupant: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.03em',
  },
  selectedBadge: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    letterSpacing: '0.1em',
    color: 'white',
    padding: '0.2rem 0.5rem',
  },
  takenBadge: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    border: '1px solid var(--border)',
    padding: '0.2rem 0.5rem',
  },
  error: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--red-light)',
    borderLeft: '2px solid var(--red)',
    paddingLeft: '0.75rem',
    letterSpacing: '0.05em',
  },
  checklist: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '1rem 1.5rem',
    maxWidth: '860px',
    width: '100%',
  },
  startSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
  },
  startBtn: {
    background: 'linear-gradient(135deg, var(--red), var(--blue))',
    border: 'none',
    color: 'white',
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    letterSpacing: '0.2em',
    padding: '0.75rem 3rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  startBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  startBtnGhost: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
    border: '1px dashed var(--border-light)',
    padding: '0.75rem 2rem',
    animation: 'pulse 2s ease infinite',
  },
  startHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.03em',
  },
  playerList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    maxWidth: '860px',
    width: '100%',
  },
  playerChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '0.35rem 0.75rem',
  },
  playerTeamDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  playerChipName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text)',
    letterSpacing: '0.05em',
  },
  playerChipRole: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  playerChipUnassigned: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.05em',
  },
};
