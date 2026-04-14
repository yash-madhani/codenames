import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSocket } from '../../lib/socket';
import GameBoard from '../../components/GameBoard';
import RoleSelection from '../../components/RoleSelection';
import Lobby from '../../components/Lobby';

export default function RoomPage() {
  const router = useRouter();
  const { code } = router.query;
  const [roomState, setRoomState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [notification, setNotification] = useState('');
  const [isDark, setIsDark] = useState(true);
  const socketRef = useRef(null);

  // Theme toggle — apply class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!code) return;

    const name = sessionStorage.getItem('playerName');
    const savedCode = sessionStorage.getItem('roomCode');

    if (!name || savedCode !== code) {
      router.push('/');
      return;
    }

    setPlayerName(name);

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit('get_state', {}, (res) => {
        if (res?.success) setRoomState(res.state);
      });
    };

    const onRoomUpdate = (state) => setRoomState(state);
    const onPlayerLeft = ({ name: leftName }) => showNotification(`${leftName} has left the operation`);

    socket.on('connect', onConnect);
    socket.on('room_update', onRoomUpdate);
    socket.on('player_left', onPlayerLeft);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('room_update', onRoomUpdate);
      socket.off('player_left', onPlayerLeft);
    };
  }, [code]);

  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }

  if (!code || !playerName) return null;

  const status = roomState?.status;

  return (
    <>
      <Head>
        <title>CODENAMES — Room {code}</title>
      </Head>

      <div style={styles.page}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.logo}>CODENAMES</div>

          <div style={styles.roomInfo}>
            <span style={styles.roomLabel}>ROOM</span>
            <span style={styles.roomCode}>{code}</span>
          </div>

          <div style={styles.topRight}>
            <div style={styles.playerTag}>
              <span style={styles.playerLabel}>AGENT</span>
              <span style={styles.playerName}>{playerName}</span>
            </div>

            {/* Theme toggle */}
            <button
              style={styles.themeToggle}
              onClick={() => setIsDark(d => !d)}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? '☀' : '☾'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div style={styles.notification}>{notification}</div>
        )}

        {/* Main content */}
        <div style={styles.content}>
          {!roomState && (
            <div style={styles.loading}>
              <div style={styles.loadingDot} />
              CONNECTING TO FIELD...
            </div>
          )}

          {roomState && status === 'lobby' && (
            <Lobby roomState={roomState} roomCode={code} playerName={playerName} />
          )}

          {roomState && status === 'role_selection' && (
            <RoleSelection
              roomState={roomState}
              playerName={playerName}
              socket={socketRef.current}
            />
          )}

          {roomState && (status === 'playing' || status === 'finished') && (
            <GameBoard
              roomState={roomState}
              playerName={playerName}
              socket={socketRef.current}
            />
          )}
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
    background: 'var(--bg)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    letterSpacing: '0.15em',
    background: 'linear-gradient(90deg, var(--red-light), var(--gold))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  roomLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
  },
  roomCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.2rem',
    color: 'var(--gold)',
    letterSpacing: '0.3em',
    background: 'var(--surface2)',
    padding: '0.2rem 0.6rem',
    border: '1px solid var(--border-light)',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  playerTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  playerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    color: 'var(--text-dim)',
  },
  playerName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text)',
    letterSpacing: '0.1em',
  },
  themeToggle: {
    background: 'var(--surface2)',
    border: '1px solid var(--border-light)',
    color: 'var(--text)',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  notification: {
    background: 'var(--surface2)',
    borderLeft: '3px solid var(--gold)',
    padding: '0.5rem 1.5rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    animation: 'slideIn 0.3s ease',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.2em',
    animation: 'pulse 1.5s ease infinite',
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--gold)',
  },
};
