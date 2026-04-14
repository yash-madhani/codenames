export default function Lobby({ roomState, roomCode, playerName }) {
  const players = roomState?.players || [];
  const needed = Math.max(0, 4 - players.length);

  return (
    <div style={styles.container}>
      <div style={styles.panel} className="animate-fade">
        {/* Code display */}
        <div style={styles.codeSection}>
          <div style={styles.codeLabel}>OPERATION CODE — SHARE WITH YOUR TEAM</div>
          <div style={styles.codeDisplay}>{roomCode}</div>
          <button
            style={styles.copyBtn}
            onClick={() => navigator.clipboard?.writeText(roomCode)}
          >
            COPY CODE
          </button>
        </div>

        <div style={styles.divider} />

        {/* Players */}
        <div style={styles.playersSection}>
          <div style={styles.sectionLabel}>
            AGENTS IN FIELD
            <span style={styles.count}>{players.length}/4+</span>
          </div>

          <div style={styles.playerList}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                ...styles.playerRow,
                animationDelay: `${i * 0.05}s`,
              }} className="animate-slide">
                <div style={styles.playerDot} />
                <span style={styles.playerName}>{p.name}</span>
                {p.name === playerName && (
                  <span style={styles.youTag}>YOU</span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: needed }).map((_, i) => (
              <div key={`empty-${i}`} style={styles.emptyRow}>
                <div style={styles.emptyDot} />
                <span style={styles.emptyText}>AWAITING AGENT...</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Status */}
        <div style={styles.statusSection}>
          {needed > 0 ? (
            <>
              <div style={styles.statusPulse}>
                <div style={styles.pulseDot} />
                WAITING FOR {needed} MORE AGENT{needed > 1 ? 'S' : ''}
              </div>
              <p style={styles.statusHint}>
                Share the operation code above. Once 4 agents join, role selection begins automatically.
              </p>
            </>
          ) : (
            <div style={styles.statusReady}>
              ✓ MINIMUM AGENTS REACHED — PROCEEDING TO ROLE SELECTION
            </div>
          )}
        </div>
      </div>

      {/* Rules brief */}
      <div style={styles.brief} className="animate-fade">
        <div style={styles.briefTitle}>MISSION BRIEFING</div>
        <div style={styles.rules}>
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>🔴</span>
            <span>Red Spymaster gives one-word clues for Red operatives to find Red agents on the board.</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>🔵</span>
            <span>Blue Spymaster does the same for their team.</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>💀</span>
            <span>Reveal the Assassin and your team instantly loses.</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>🏆</span>
            <span>First team to reveal all their agents wins.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1.5rem',
  },
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  codeSection: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  codeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
  },
  codeDisplay: {
    fontFamily: 'var(--font-mono)',
    fontSize: '3.5rem',
    letterSpacing: '0.5em',
    color: 'var(--gold)',
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    padding: '0.5rem 1.5rem',
    fontWeight: 700,
  },
  copyBtn: {
    background: 'none',
    border: '1px solid var(--border-light)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
  },
  playersSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    color: 'var(--text-muted)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: 'var(--gold)',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
  },
  playerDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#2ecc71',
    flexShrink: 0,
  },
  playerName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--text)',
    letterSpacing: '0.1em',
    flex: 1,
  },
  youTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    letterSpacing: '0.15em',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    padding: '0.1rem 0.4rem',
  },
  emptyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    border: '1px dashed var(--border)',
    opacity: 0.4,
  },
  emptyDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    border: '1px solid var(--text-dim)',
    flexShrink: 0,
  },
  emptyText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  statusPulse: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    animation: 'pulse 2s ease infinite',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--gold)',
    flexShrink: 0,
  },
  statusHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    letterSpacing: '0.02em',
  },
  statusReady: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: '#2ecc71',
    letterSpacing: '0.1em',
  },
  brief: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '480px',
  },
  briefTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    letterSpacing: '0.2em',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.5rem',
  },
  rules: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  ruleItem: {
    display: 'flex',
    gap: '0.75rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  ruleIcon: {
    flexShrink: 0,
    fontSize: '0.8rem',
  },
};
