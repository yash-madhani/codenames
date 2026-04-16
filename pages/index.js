import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSocket } from '../lib/socket';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const socket = getSocket();

  useEffect(() => {
    if (!socket.connected) socket.connect();
    return () => {};
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return setError('Enter your codename');
    setLoading(true);
    setError('');

    socket.emit('create_room', { playerName: name.trim() }, (res) => {
      if (res.success) {
        const roomCode = res.code;
        socket.emit('join_room', { code: roomCode, playerName: name.trim() }, (joinRes) => {
          if (joinRes.success) {
            sessionStorage.setItem('playerName', name.trim());
            sessionStorage.setItem('roomCode', roomCode);
            router.push(`/room/${roomCode}`);
          } else {
            setError(joinRes.error);
            setLoading(false);
          }
        });
      } else {
        setError('Failed to create room');
        setLoading(false);
      }
    });
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Enter your codename');
    if (code.length !== 4) return setError('Enter a valid 4-digit code');
    setLoading(true);
    setError('');

    socket.emit('join_room', { code: code.trim(), playerName: name.trim() }, (res) => {
      if (res.success) {
        sessionStorage.setItem('playerName', name.trim());
        sessionStorage.setItem('roomCode', code.trim());
        router.push(`/room/${code.trim()}`);
      } else {
        setError(res.error || 'Failed to join');
        setLoading(false);
      }
    });
  };

  return (
    <>
      <Head>
        <title>CODENAMES — Field Operations</title>
        <meta name="description" content="Multiplayer Codenames game" />
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.eyebrow}>CLASSIFIED — EYES ONLY</div>
          <h1 style={styles.title}>CODENAMES</h1>
          <div style={styles.subtitle}>FIELD OPERATIONS DIVISION</div>
          <div style={styles.divider} />
          <p style={styles.tagline}>
            Two spymasters know the secrets. Their operatives must piece together the clues.<br />
            One wrong word, and everyone dies.
          </p>
        </div>

        {/* Cards */}
        {!mode && (
          <div style={styles.modeGrid} className="animate-fade">
            <button style={{...styles.modeCard, ...styles.modeCardRed}} onClick={() => setMode('create')}>
              <div style={styles.modeIcon}>⊕</div>
              <div style={styles.modeTitle}>CREATE ROOM</div>
              <div style={styles.modeDesc}>Start a new operation. Share your 4-digit code with your team.</div>
            </button>
            <button style={{...styles.modeCard, ...styles.modeCardBlue}} onClick={() => setMode('join')}>
              <div style={styles.modeIcon}>→</div>
              <div style={styles.modeTitle}>JOIN ROOM</div>
              <div style={styles.modeDesc}>Enter an operation code to join your team in the field.</div>
            </button>
          </div>
        )}

        {/* Form */}
        {mode && (
          <div style={styles.form} className="animate-fade">
            <button style={styles.back} onClick={() => { setMode(null); setError(''); }}>
              ← BACK
            </button>

            <div style={styles.formTitle}>
              {mode === 'create' ? 'INITIATE OPERATION' : 'JOIN OPERATION'}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>YOUR CODENAME</label>
              <input
                style={styles.input}
                placeholder="e.g. FALCON"
                value={name}
                onChange={e => setName(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
                maxLength={20}
                autoFocus
              />
            </div>

            {mode === 'join' && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>OPERATION CODE</label>
                <input
                  style={{...styles.input, ...styles.codeInput}}
                  placeholder="0000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,4))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button
              style={{
                ...styles.cta,
                ...(mode === 'create' ? styles.ctaRed : styles.ctaBlue),
                ...(loading ? styles.ctaDisabled : {})
              }}
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
            >
              {loading ? 'CONNECTING...' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </button>

            <div style={styles.hint}>
              {mode === 'create'
                ? 'Requires minimum 4 players to start. Share your code with teammates.'
                : 'Get the 4-digit code from the room creator.'}
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <span style={styles.footerText}>4+ PLAYERS • VOICE CHAT RECOMMENDED • SPYMASTERS VS OPERATIVES • Developed by Yash Madhani</span>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '2.5rem',
  },
  header: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    letterSpacing: '0.25em',
    color: 'var(--gold)',
    marginBottom: '0.5rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(4rem, 12vw, 8rem)',
    letterSpacing: '0.1em',
    lineHeight: 1,
    background: 'linear-gradient(135deg, var(--red-light) 0%, var(--gold) 40%, var(--blue-light) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: 'none',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.4em',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  divider: {
    width: '60px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
    margin: '1.5rem auto',
  },
  tagline: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: 1.8,
    letterSpacing: '0.02em',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '520px',
  },
  modeCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    padding: '2rem 1.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    position: 'relative',
    overflow: 'hidden',
  },
  modeCardRed: {
    borderTop: '3px solid var(--red)',
  },
  modeCardBlue: {
    borderTop: '3px solid var(--blue-light)',
  },
  modeIcon: {
    fontSize: '1.5rem',
    color: 'var(--gold)',
  },
  modeTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    letterSpacing: '0.1em',
    color: 'var(--text)',
  },
  modeDesc: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    lineHeight: 1.7,
  },
  form: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  back: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    padding: 0,
    transition: 'color 0.2s',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    letterSpacing: '0.1em',
    color: 'var(--text)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    color: 'var(--text-muted)',
  },
  input: {
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    width: '100%',
    letterSpacing: '0.1em',
    transition: 'border-color 0.2s',
  },
  codeInput: {
    fontSize: '1.8rem',
    letterSpacing: '0.5em',
    textAlign: 'center',
  },
  error: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--red-light)',
    letterSpacing: '0.05em',
    borderLeft: '2px solid var(--red)',
    paddingLeft: '0.75rem',
  },
  cta: {
    border: 'none',
    padding: '0.9rem 1.5rem',
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  ctaRed: {
    background: 'var(--red)',
    color: 'white',
  },
  ctaBlue: {
    background: 'var(--blue)',
    color: 'white',
  },
  ctaDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  hint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    letterSpacing: '0.03em',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    paddingTop: '1.5rem',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
  },
};
