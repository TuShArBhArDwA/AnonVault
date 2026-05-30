import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TimelineView from './components/TimelineView';
import IdeaVaultView from './components/IdeaVaultView';
import TasksView from './components/TasksView';
import { ToastProvider, useToast } from './components/Toast';
import { Lock, ShieldAlert, Cpu, Delete } from 'lucide-react';
import { 
  fetchApplications, 
  addApplication, 
  updateApplication, 
  deleteApplication,
  fetchIdeas,
  addIdea,
  updateIdea,
  deleteIdea 
} from './services/supabase';
import { getTasksForDateSync, loadAllTasks } from './services/tasks';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-xl p-8 rounded-2xl glass-panel border border-rose-500/20 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">Section Render Crash</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An error occurred while compiling or rendering this view. This is usually due to missing database relations or mismatched properties.
            </p>
            <pre className="p-4 text-[10px] font-mono text-rose-350 bg-rose-950/40 rounded-xl overflow-x-auto text-left border border-rose-500/10 whitespace-pre-wrap leading-normal">
              {this.state.error ? this.state.error.toString() + "\n" + this.state.error.stack : 'Unknown crash'}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="py-2.5 px-6 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/10"
            >
              Restart Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================= hacker terminal overlay ================= */
const TERMINAL_LINES = [
  { text: 'AnonVault OS v3.14.159 — kernel boot sequence initiated', color: '#64748b' },
  { text: 'Loading encrypted partition table... [OK]', color: '#475569' },
  { text: 'Mounting /dev/vault0 with AES-256-GCM... [OK]', color: '#475569' },
  { text: 'Verifying HMAC signature... checksum: 8f3a2b91e7c04d5f', color: '#64748b' },
  { text: 'Decrypting identity manifest... [OK]', color: '#475569' },
  { text: 'auth_layer::verify_pin() → PASS ✓', color: '#34d399' },
  { text: 'Establishing secure tunnel to Supabase vault...', color: '#64748b' },
  { text: 'TLS handshake complete. Session: 0x8a3f...c2d9', color: '#475569' },
  { text: 'Loading user profile: t.bhardwaj@minianon.priv', color: '#64748b' },
  { text: 'Checking access permissions... GRANTED', color: '#34d399' },
  { text: 'Decrypting /vaults/ideas.enc ... [OK]', color: '#475569' },
  { text: 'Decrypting /vaults/hackathons.enc ... [OK]', color: '#475569' },
  { text: 'Decrypting /vaults/tasks.enc ... [OK]', color: '#475569' },
  { text: 'Spinning up secure memory sandbox...', color: '#64748b' },
  { text: 'NOTICE: This system is private property of Mini Anon', color: '#f59e0b' },
  { text: 'Unauthorized access is monitored and prosecuted.', color: '#f59e0b' },
  { text: 'run vault_auth --identity=minianon --level=root', color: '#818cf8' },
  { text: 'Scanning biometric fingerprint... skipped (PIN mode)', color: '#64748b' },
  { text: 'Validating session token TTL: 3600s', color: '#475569' },
  { text: 'Allocating secure heap: 128MB ... [OK]', color: '#475569' },
  { text: 'Starting encrypted sync daemon...', color: '#64748b' },
  { text: 'Zero-knowledge proof verified ✓', color: '#34d399' },
  { text: 'Audit log: session_start @ ' + new Date().toISOString(), color: '#475569' },
  { text: '──────────────────────────────────────────────────────', color: '#1e293b' },
  { text: '▶  Mini Anon\'s Restricted Space', color: '#34d399', isHighlight: true },
  { text: '──────────────────────────────────────────────────────', color: '#1e293b' },
];

function HackerTerminal({ onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState('streaming');
  const containerRef = useRef(null);
  const highlightIdx = TERMINAL_LINES.findIndex(l => l.isHighlight);

  useEffect(() => {
    let i = 0;
    const streamInterval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
      if (i >= TERMINAL_LINES.length) {
        clearInterval(streamInterval);
        setTimeout(() => setPhase('highlight'), 300);
        setTimeout(() => setPhase('zoom'), 1400);
        setTimeout(() => setPhase('flash'), 2600);
        setTimeout(() => onComplete(), 3000);
      }
    }, 60);
    return () => clearInterval(streamInterval);
  }, []);

  return (
    <div className="terminal-overlay fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#000', fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}>
      <div className="terminal-scanline absolute inset-x-0 pointer-events-none"
        style={{ height: 3, background: 'linear-gradient(to bottom,transparent,rgba(52,211,153,0.04),transparent)', zIndex: 10 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(52,211,153,0.04) 0%,transparent 70%)' }} />
      {phase === 'flash' && (
        <div className="terminal-flash absolute inset-0 pointer-events-none" style={{ background: 'rgba(52,211,153,0.15)', zIndex: 20 }} />
      )}
      <div className={phase === 'zoom' ? 'terminal-zoom' : ''}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 60px',
          transformOrigin: highlightIdx >= 0 ? `50% ${((highlightIdx + 0.5) / TERMINAL_LINES.length) * 100}%` : '50% 50%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, opacity: 0.5 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ marginLeft: 16, fontSize: 11, color: '#334155', letterSpacing: '0.1em' }}>
            minianon@vault:~$ ./unlock --auth PIN --user minianon
          </span>
        </div>
        <div ref={containerRef} style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TERMINAL_LINES.slice(0, visibleCount).map((line, idx) => {
            const isHL = line.isHighlight;
            const isHLPhase = phase === 'highlight' || phase === 'zoom' || phase === 'flash';
            return (
              <div key={idx} className={`terminal-line ${isHL && isHLPhase ? 'terminal-highlight' : ''}`}
                style={{ animationDelay: '0ms', padding: isHL ? '10px 16px' : '1px 0', borderRadius: isHL ? 8 : 0, transition: 'all 0.4s ease' }}>
                {isHL ? (
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em',
                    textShadow: isHLPhase ? '0 0 20px rgba(52,211,153,0.9),0 0 60px rgba(52,211,153,0.5),0 0 120px rgba(52,211,153,0.3)' : 'none',
                    transition: 'text-shadow 0.5s ease', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>▶</span>{line.text.replace('▶  ', '')}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: line.color, lineHeight: 1.6 }}>
                    <span style={{ color: '#1e3a2f', marginRight: 12, userSelect: 'none' }}>{String(idx + 1).padStart(3, '0')}</span>
                    {line.text}
                  </span>
                )}
              </div>
            );
          })}
          {visibleCount < TERMINAL_LINES.length && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
              <span style={{ fontSize: 12, color: '#1e3a2f', marginRight: 12 }}>{String(visibleCount + 1).padStart(3, '0')}</span>
              <span className="terminal-cursor" style={{ display: 'inline-block', width: 8, height: 16, background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #0f2318', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.4 }}>
          <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.12em' }}>AnonVault OS · RESTRICTED ACCESS · ENCRYPTED</span>
          <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.08em' }}>{new Date().toLocaleTimeString()} · SESSION ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

/* ================= lock screen component ================= */
const STREAM_LEFT  = ['0x8F3A','auth::','[ENC]','0xB21C','SHA512','vault::','0xD4F1','priv::','[LOCK]','0x2A7E','HMAC✓','0xF93B','RSA::','[SIG]'];
const STREAM_RIGHT = ['RSA-4096','0x1C9F','[SEALED]','TLS-1.3','0xA83D','ECDSA','0x7E2A','SECURE','[AUTH]','0x5F14','CRYPT::','0xE6C2','AES::','[OK]'];

function LockScreen({ onAuthorize }) {
  const [pin, setPin]               = useState('');
  const [error, setError]           = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [resisting, setResisting]   = useState(false);
  const [unlocking, setUnlocking]   = useState(false);
  const [showPopup, setShowPopup]   = useState(false);
  const [ripples, setRipples]       = useState([]);
  const [activeKey, setActiveKey]   = useState(null);
  const [mounted, setMounted]       = useState(false);
  const [crtGlitch, setCrtGlitch]   = useState(false);
  const [laserActive, setLaserActive] = useState(false);

  const correctPin = import.meta.env.VITE_APP_PIN;

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);
  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const addRipple = (label, x = 50, y = 33) => {
    const id = Date.now() + Math.random();
    setRipples(p => [...p, { id, x, y, label }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 700);
  };

  const handleKeyPress = (digit, e) => {
    if (unlocking || resisting) return;
    if (!correctPin) return;
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      addRipple(digit, e.clientX - rect.left, e.clientY - rect.top);
    } else { addRipple(digit); }
    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 160);
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === correctPin) {
          setUnlocking(true);
        } else {
          setTimeout(() => {
            setResisting(true);
            setError(true);
            setErrorFlash(true);
            setCrtGlitch(true);
            setLaserActive(true);
            setErrorCount(c => c + 1);
            setPin('');
            setTimeout(() => setResisting(false), 720);
            setTimeout(() => {
              setErrorFlash(false);
              setCrtGlitch(false);
              setLaserActive(false);
            }, 1000);
          }, 90);
        }
      }
    }
  };

  const handleBackspace = (fromKb = false) => {
    if (unlocking || resisting) return;
    if (fromKb) { addRipple('⌫'); setActiveKey('⌫'); setTimeout(() => setActiveKey(null), 160); }
    setPin(p => p.slice(0, -1)); setError(false);
  };
  const handleClear = (fromKb = false) => {
    if (unlocking) return;
    if (fromKb) { addRipple('C'); setActiveKey('C'); setTimeout(() => setActiveKey(null), 160); }
    setPin(''); setError(false);
  };

  useEffect(() => {
    const onKey = e => {
      if (unlocking || resisting) return;
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleBackspace(true);
      else if (e.key === 'Escape') handleClear(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin, unlocking, resisting]);

  const statusColor = error ? '#f87171' : 'rgba(148,163,184,0.45)';
  const statusText  = !correctPin ? 'PIN NOT CONFIGURED'
                    : error       ? `ACCESS DENIED  [${errorCount}]`
                    :               'Enter passcode';

  /* ── Keypad button ── */
  const KeypadBtn = ({ label, sub, onClick, variant = 'digit' }) => {
    const isActive  = activeKey === label;
    const myRipples = ripples.filter(r => r.label === label);
    const isGhost   = variant === 'ghost';
    const isDanger  = variant === 'danger';

    return (
      <button onClick={onClick} disabled={unlocking}
        className="pin-key relative overflow-hidden focus:outline-none cursor-pointer select-none"
        data-active={isActive ? 'true' : undefined}
        data-variant={variant}
        style={{
          height: 68, borderRadius: 20,
          transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, background 0.15s ease',
          transform: isActive ? 'scale(0.88)' : 'scale(1)',
          background: isGhost || isDanger
            ? isActive ? (isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.1)') : 'rgba(255,255,255,0.02)'
            : isActive
              ? 'linear-gradient(145deg,rgba(99,102,241,0.3) 0%,rgba(139,92,246,0.22) 100%)'
              : 'linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.025) 100%)',
          border: isGhost || isDanger
            ? `1px solid ${isActive ? (isDanger ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)') : 'rgba(255,255,255,0.05)'}`
            : `1px solid ${isActive ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isActive
            ? (isGhost || isDanger ? 'none' : '0 0 0 1px rgba(99,102,241,0.3), 0 0 32px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)')
            : (isGhost || isDanger ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.5)'),
        }}>
        {myRipples.map(r => (
          <span key={r.id} className="absolute rounded-full pointer-events-none"
            style={{ width: 100, height: 100, left: r.x - 50, top: r.y - 50,
              background: isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)',
              animation: 'keyRipple 0.6s ease-out forwards' }} />
        ))}
        {variant === 'digit' ? (
          <div className="flex flex-col items-center justify-center" style={{ gap: 3 }}>
            <span style={{ fontSize: 24, fontWeight: 200, color: isActive ? '#fff' : 'rgba(226,232,240,0.9)', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>{label}</span>
            {sub && <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', color: isActive ? 'rgba(165,180,252,0.8)' : 'rgba(148,163,184,0.28)', textTransform: 'uppercase' }}>{sub}</span>}
          </div>
        ) : variant === 'ghost' ? (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: isActive ? '#a5b4fc' : 'rgba(100,116,139,0.55)' }}>CLR</span>
        ) : (
          <Delete size={16} style={{ color: isActive ? '#f87171' : 'rgba(100,116,139,0.6)', margin: 'auto' }} />
        )}
      </button>
    );
  };

  const keyDefs = ['1','2','3','4','5','6','7','8','9'];

  const mainPanelContent = (
    <div className={`w-full flex flex-col items-center ${resisting ? 'animate-slam-back' : ''}`}
      style={{
        maxWidth: 348, padding: '0 20px',
        gap: 32,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.4s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: unlocking ? 'none' : 'auto',
      }}>

      {/* ── BRAND HEADER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {/* Logo badge */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer animated ring */}
          <div className="lock-ring-outer" style={{
            position: 'absolute', inset: -28, borderRadius: 52,
            border: '1px solid rgba(99,102,241,0.15)',
          }} />
          {/* Mid ring */}
          <div style={{
            position: 'absolute', inset: -16, borderRadius: 42,
            border: '1px solid rgba(99,102,241,0.08)',
            background: 'radial-gradient(ellipse,rgba(99,102,241,0.03) 0%,transparent 70%)',
          }} />
          {/* Badge */}
          <div style={{
            width: 96, height: 96, borderRadius: 30,
            background: 'linear-gradient(145deg,rgba(22,24,52,0.95) 0%,rgba(12,14,32,0.98) 100%)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.28)'}`,
            boxShadow: [
              '0 28px 56px rgba(0,0,0,0.8)',
              '0 0 0 1px rgba(255,255,255,0.04)',
              'inset 0 1px 0 rgba(255,255,255,0.08)',
              error ? '0 0 48px rgba(239,68,68,0.2)' : '0 0 48px rgba(99,102,241,0.18)',
            ].join(','),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 30,
              background: 'linear-gradient(145deg,rgba(255,255,255,0.06) 0%,transparent 55%)',
              pointerEvents: 'none',
            }} />
            <div style={{ width: 54, height: 54, filter: 'drop-shadow(0 4px 16px rgba(99,102,241,0.5))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="100%" height="100%">
                <defs>
                  <linearGradient id="lg1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <filter id="glow1"><feGaussianBlur stdDeviation="1.4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
                </defs>
                <path d="M38 6C38 9.5 39.5 11 43 11C39.5 11 38 12.5 38 16C38 12.5 36.5 11 33 11C36.5 11 38 9.5 38 6Z" fill="url(#lg1)" filter="url(#glow1)"/>
                <rect x="8" y="38" width="10" height="3" rx="1.5" fill="url(#lg1)" opacity="0.4"/>
                <rect x="15" y="31" width="12" height="3" rx="1.5" fill="url(#lg1)" opacity="0.6"/>
                <rect x="22" y="24" width="14" height="3" rx="1.5" fill="url(#lg1)" opacity="0.8"/>
                <rect x="29" y="17" width="16" height="3" rx="1.5" fill="url(#lg1)" filter="url(#glow1)"/>
                <path d="M28 11.5C31.5 10.5 34.5 9 37.5 7.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow1)"/>
                <path d="M19 28C21 21 24 16 27.5 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" filter="url(#glow1)"/>
                <path d="M19 28C17.5 30.5 15.5 32 14.5 32.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
                <path d="M22 21C24.5 21.5 27 22.5 28.5 23.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow1)"/>
                <circle cx="28" cy="8.5" r="3.5" fill="#fff" filter="url(#glow1)"/>
              </svg>
            </div>
          </div>
          {/* Halo glow */}
          <div style={{
            position: 'absolute', inset: -6, borderRadius: 36,
            background: error ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
            filter: 'blur(22px)', zIndex: -1,
            transition: 'background 0.4s ease',
          }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0,
            background: 'linear-gradient(135deg,#ffffff 0%,#c7d2fe 35%,#a5b4fc 65%,#818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>AnonVault</h1>
          <p style={{
            margin: '5px 0 0', fontSize: 9, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'rgba(148,163,184,0.32)',
          }}>Private · Encrypted · Secure</p>
        </div>
      </div>

      {/* ── PIN DOTS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
          {[0,1,2,3].map(i => {
            const filled = i < pin.length;
            return (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: filled
                  ? (error ? 'linear-gradient(135deg,#f87171,#ef4444)' : 'linear-gradient(135deg,#818cf8,#6366f1)')
                  : 'rgba(255,255,255,0.07)',
                border: `1px solid ${filled ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: filled
                  ? (error ? '0 0 12px rgba(248,113,113,0.75)' : '0 0 12px rgba(99,102,241,0.75)')
                  : 'none',
                transform: filled ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            );
          })}
        </div>
        {/* Status */}
        <div style={{ minHeight: 14, textAlign: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: statusColor, transition: 'color 0.3s ease',
            fontFamily: error ? "'JetBrains Mono','Courier New',monospace" : 'inherit',
          }}>{statusText}</span>
        </div>
      </div>

      {/* ── KEYPAD ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(170deg,rgba(10,12,28,0.92) 0%,rgba(6,8,20,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 32,
        padding: '22px 18px 18px',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Inner top sheen */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom,rgba(99,102,241,0.04) 0%,transparent 100%)',
          borderRadius: '32px 32px 0 0', pointerEvents: 'none',
        }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginBottom: 11 }}>
          {keyDefs.map(d => <KeypadBtn key={d} label={d} onClick={e => handleKeyPress(d, e)} variant="digit" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11 }}>
          <KeypadBtn label="C" variant="ghost" onClick={() => handleClear()} />
          <KeypadBtn label="0" onClick={e => handleKeyPress('0', e)} variant="digit" />
          <KeypadBtn label="⌫" variant="danger" onClick={() => handleBackspace()} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center select-none relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 120% at 50% -10%, #0d0a1f 0%, #04050e 55%, #020308 100%)',
               fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>

      {/* ═══ CINEMATIC BACKGROUND ═══ */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>

        {/* Aurora layers */}
        <div className="lock-orb" style={{
          top: '-15%', left: '-10%', width: '75%', height: '75%',
          background: 'radial-gradient(ellipse,rgba(67,46,196,0.5) 0%,rgba(79,58,180,0.2) 45%,transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div className="lock-orb lock-orb--slow" style={{
          bottom: '-18%', right: '-12%', width: '70%', height: '70%',
          background: 'radial-gradient(ellipse,rgba(124,58,237,0.42) 0%,rgba(109,40,217,0.18) 45%,transparent 70%)',
          filter: 'blur(90px)',
        }} />
        <div className="lock-orb" style={{
          top: '30%', right: '-8%', width: '45%', height: '55%',
          background: 'radial-gradient(ellipse,rgba(168,85,247,0.22) 0%,rgba(236,72,153,0.08) 55%,transparent 75%)',
          filter: 'blur(70px)', animationDelay: '-5s',
        }} />
        <div className="lock-orb lock-orb--slow" style={{
          bottom: '10%', left: '5%', width: '40%', height: '40%',
          background: 'radial-gradient(ellipse,rgba(34,211,238,0.07) 0%,transparent 70%)',
          filter: 'blur(55px)', animationDelay: '-11s',
        }} />

        {/* Perspective grid floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          width: '260%', height: '50%',
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(99,102,241,0.09) 0px, transparent 1px, transparent 80px, rgba(99,102,241,0.09) 81px),
            repeating-linear-gradient(0deg,  rgba(99,102,241,0.07) 0px, transparent 1px, transparent 60px, rgba(99,102,241,0.07) 61px)
          `,
          transformOrigin: 'bottom center',
          transform: 'translateX(-50%) perspective(500px) rotateX(58deg)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 80%)',
          opacity: 0.65,
        }} />

        {/* Sweeping horizontal beam */}
        <div className="lock-sweep-beam absolute inset-x-0" style={{
          height: '1px',
          background: 'linear-gradient(90deg,transparent 0%,rgba(99,102,241,0.5) 25%,rgba(168,85,247,0.6) 50%,rgba(99,102,241,0.5) 75%,transparent 100%)',
        }} />

        {/* Left data stream */}
        <div style={{
          position: 'absolute', left: 20, top: 0, bottom: 0, width: 72,
          display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 40,
          maskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 18%,rgba(0,0,0,0.6) 82%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 18%,rgba(0,0,0,0.6) 82%,transparent 100%)',
        }}>
          {STREAM_LEFT.map((t, i) => (
            <div key={i} style={{
              fontSize: 8, fontFamily: "'JetBrains Mono','Courier New',monospace",
              color: i % 3 === 0 ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.16)',
              letterSpacing: '0.05em',
              animation: `lockStream ${12 + i * 0.5}s linear infinite`,
              animationDelay: `${-(i * 0.9)}s`,
            }}>{t}</div>
          ))}
        </div>

        {/* Right data stream */}
        <div style={{
          position: 'absolute', right: 20, top: 0, bottom: 0, width: 72,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, paddingTop: 80,
          maskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 18%,rgba(0,0,0,0.6) 82%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 18%,rgba(0,0,0,0.6) 82%,transparent 100%)',
        }}>
          {STREAM_RIGHT.map((t, i) => (
            <div key={i} style={{
              fontSize: 8, fontFamily: "'JetBrains Mono','Courier New',monospace",
              color: i % 3 === 0 ? 'rgba(139,92,246,0.28)' : 'rgba(139,92,246,0.16)',
              letterSpacing: '0.05em',
              animation: `lockStream ${14 + i * 0.45}s linear infinite`,
              animationDelay: `${-(i * 1.1)}s`,
            }}>{t}</div>
          ))}
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)',
          backgroundSize: '30px 30px', opacity: 0.8,
        }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%,transparent 28%,rgba(2,3,8,0.88) 100%)',
        }} />
        <div className="absolute inset-x-0 top-0 h-44"
          style={{ background: 'linear-gradient(to bottom,rgba(2,3,8,0.95) 0%,transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-44"
          style={{ background: 'linear-gradient(to top,rgba(2,3,8,0.95) 0%,transparent 100%)' }} />
      </div>

      {/* ═══ WRONG PIN EFFECTS (CRT, LASER, VIGNETTE) ═══ */}
      {crtGlitch && <div className="crt-noise-overlay animate-crt-flicker" />}
      {laserActive && <div className="lock-laser-line" />}
      {errorFlash && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="lock-error-vignette absolute inset-0" style={{
            background: 'radial-gradient(ellipse 110% 110% at 50% 50%,transparent 25%,rgba(239,68,68,0.32) 100%)',
          }} />
          <div className="lock-error-border absolute inset-0" style={{
            boxShadow: 'inset 0 0 0 2px rgba(239,68,68,0.6), inset 0 0 60px rgba(239,68,68,0.12)',
          }} />
          <div className="lock-denied-badge" style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 22px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: 6,
              backdropFilter: 'blur(12px)',
            }}>
              <span style={{ fontSize: 14, color: '#f87171' }}>✕</span>
              <span className="lock-warning-glitch" style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.4em',
                color: '#f87171', textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                textShadow: '0 0 16px rgba(239,68,68,0.8),0 0 40px rgba(239,68,68,0.3)',
              }}>Access Denied</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HACKER TERMINAL (BEHIND SPLITTING VAULT DOORS) ═══ */}
      {unlocking && (
        <HackerTerminal onComplete={() => { sessionStorage.setItem('minianon_authorized','true'); onAuthorize(); }} />
      )}

      {/* ═══ VAULT DOORS (SPLITTING 3D WINGS) ═══ */}
      <div className="vault-door-container absolute inset-0 z-10 pointer-events-none">
        <div className={`vault-wing-left absolute inset-0 flex items-center justify-center pointer-events-auto ${unlocking ? 'vault-open-left' : ''}`}>
          {mainPanelContent}
        </div>
        <div className={`vault-wing-right absolute inset-0 flex items-center justify-center pointer-events-auto ${unlocking ? 'vault-open-right' : ''}`}>
          {mainPanelContent}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="absolute bottom-6 z-10 text-center"
        style={{ opacity: unlocking ? 0 : mounted ? 1 : 0, transition: 'opacity 1.2s ease 0.6s' }}>
        <p style={{ fontSize: 11, color: 'rgba(71,85,105,0.75)', margin: 0 }}>
          Want the PIN?{' '}
          <a href="https://link.minianon.in/tusharbhardwaj" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none', borderBottom: '1px dotted rgba(99,102,241,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6366f1'; }}>
            Contact Mini Anon
          </a>
        </p>
      </div>

      {/* ── MINI ANON POPUP ── */}
      {showPopup && !unlocking && (
        <div className="fixed bottom-6 right-6 z-30 animate-popup">
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 16px', borderRadius: 18, maxWidth: 280,
            background: 'linear-gradient(135deg,rgba(12,14,30,0.97) 0%,rgba(8,10,22,0.99) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 99, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)' }} />
            <div style={{ paddingLeft: 6, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Don't know Mini Anon?</p>
              <a href="https://minianon.in" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, fontWeight: 500, color: '#818cf8', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#818cf8'; }}>
                Click here to find out <span style={{ opacity: 0.6 }}>→</span>
              </a>
            </div>
            <button onClick={() => setShowPopup(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(148,163,184,0.4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Compute pending task count (reads from localStorage cache) ── */
function computePendingTasks() {
  try {
    // Use local date (not UTC) to match how tasks store their dates
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return getTasksForDateSync(today).filter(t => !t.completed).length;
  } catch { return 0; }
}

/* ================= main app dashboard component ================= */
function AppInner() {
  const showToast = useToast();
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('minianon_authorized') === 'true');
  const [activeTab, setActiveTab] = useState('tasks'); // daily checklist as default
  const didSyncRef = useRef(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('anonvault_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('anonvault_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast('info', next === 'light' ? 'Light Mode' : 'Dark Mode', `Switched to ${next} theme.`, 2200);
  };

  const handleLock = () => {
    sessionStorage.removeItem('minianon_authorized');
    setIsAuthorized(false);
  };

  // Data states
  const [applications, setApplications] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load initial data if PIN authorized
  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [appsData, ideasData] = await Promise.all([
        fetchApplications().catch(err => {
          console.error('Error fetching applications:', err);
          return [];
        }),
        fetchIdeas().catch(err => {
          console.error('Error fetching ideas:', err);
          return [];
        }),
        // Eagerly populate the tasks cache so the sidebar count is correct immediately
        loadAllTasks().catch(err => {
          console.warn('Could not pre-fetch tasks for sidebar count:', err);
        }),
      ]);

      setApplications(appsData);
      setIdeas(ideasData);
      // Refresh pending task count now that the cache is warm
      setPendingTasks(computePendingTasks());
      
      if (!didSyncRef.current) {
        showToast('success', 'Vault Synced', 'All data loaded successfully.');
        didSyncRef.current = true;
      }
    } catch (err) {
      console.error('Fail to load data from Supabase:', err);
      setErrorMsg('Failed to synchronize data with Supabase. Check your tables, RLS policies, and console logs.');
      showToast('error', 'Sync Failed', 'Could not load data from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // --- Application Handlers ---
  
  const handleAddApplication = async (newApp) => {
    try {
      const added = await addApplication(newApp);
      setApplications(prev => [...prev, added].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      showToast('success', 'Hackathon Added', `"${added.name}" has been tracked.`);
    } catch (err) {
      console.error('Failed to add application:', err);
      showToast('error', 'Add Failed', 'Could not create hackathon. Check your Supabase table.');
    }
  };

  const handleUpdateApplication = async (id, updates) => {
    try {
      const updated = await updateApplication(id, updates);
      setApplications(prev => prev.map(app => app.id === id ? updated : app).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      showToast('success', 'Hackathon Updated', `"${updated.name}" has been saved.`);
    } catch (err) {
      console.error('Failed to update application:', err);
      showToast('error', 'Update Failed', 'Could not save changes. Check your connection.');
    }
  };

  const handleDeleteApplication = async (id) => {
    try {
      const targetApp = applications.find(app => app.id === id);
      const appName = targetApp ? targetApp.name : 'Hackathon';
      await deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      showToast('warning', 'Hackathon Removed', `"${appName}" has been removed.`);
    } catch (err) {
      console.error('Failed to delete application:', err);
      showToast('error', 'Delete Failed', 'Could not remove the hackathon.');
    }
  };

  // --- Idea Handlers ---

  const handleAddIdea = async (newIdea) => {
    try {
      const added = await addIdea(newIdea);
      setIdeas(prev => [added, ...prev]);
      showToast('success', 'Idea Captured', `"${added.title}" has been saved to the vault.`);
    } catch (err) {
      console.error('Failed to add idea:', err);
      showToast('error', 'Capture Failed', 'Could not save idea. Check your Supabase table.');
    }
  };

  const handleUpdateIdea = async (id, updates) => {
    try {
      const updated = await updateIdea(id, updates);
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea));
      showToast('success', 'Idea Updated', `"${updated.title}" has been saved.`);
    } catch (err) {
      console.error('Failed to update idea:', err);
      showToast('error', 'Update Failed', 'Could not update the idea.');
    }
  };

  const handleDeleteIdea = async (id) => {
    try {
      await deleteIdea(id);
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      showToast('warning', 'Idea Deleted', 'The idea has been permanently removed.');
    } catch (err) {
      console.error('Failed to delete idea:', err);
      showToast('error', 'Delete Failed', 'Could not remove the idea.');
    }
  };

  // --- Dynamic Stats calculation ---
  const [pendingTasks, setPendingTasks] = useState(computePendingTasks);

  const refreshPendingTasks = useCallback(() => {
    setPendingTasks(computePendingTasks());
  }, []);

  const stats = {
    totalApplications: (applications || []).length,
    highPriorityCount: (applications || []).filter(app => app && app.priority === 'high' && app.status !== 'rejected').length,
    totalIdeas: (ideas || []).length,
    pendingTasks,
  };


  // Render LockScreen if unauthorized
  if (!isAuthorized) {
    return <LockScreen onAuthorize={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      
      {/* Sidebar Navigation Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main View Container */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {errorMsg && (
          <div className="px-8 py-3 bg-rose-500/10 border-b border-rose-500/20 text-xs font-semibold text-rose-400 flex items-center justify-between shrink-0">
            <span>{errorMsg}</span>
            <button 
              onClick={() => { didSyncRef.current = false; loadData(); }}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-350 border border-rose-500/20 rounded font-medium transition-colors"
            >
              Retry Sync
            </button>
          </div>
        )}

        <ErrorBoundary>
          <div className="relative flex-1 h-full w-full overflow-hidden">
            {/* Hackathon Timeline Workspace */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'timeline'
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-4 scale-[0.985] pointer-events-none'
            }`}>
              <TimelineView 
                applications={applications}
                onAdd={handleAddApplication}
                onUpdate={handleUpdateApplication}
                onDelete={handleDeleteApplication}
                loading={loading}
                theme={theme}
                onLock={handleLock}
                showToast={showToast}
                onMenuToggle={() => setMobileMenuOpen(true)}
              />
            </div>

            {/* Idea Vault Workspace */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'ideas'
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-4 scale-[0.985] pointer-events-none'
            }`}>
              <IdeaVaultView 
                ideas={ideas}
                onAdd={handleAddIdea}
                onUpdate={handleUpdateIdea}
                onDelete={handleDeleteIdea}
                loading={loading}
                theme={theme}
                onLock={handleLock}
                showToast={showToast}
                onMenuToggle={() => setMobileMenuOpen(true)}
              />
            </div>

            {/* Daily Checklist Workspace */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'tasks'
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-4 scale-[0.985] pointer-events-none'
            }`}>
              <TasksView
                showToast={showToast}
                onTasksChange={refreshPendingTasks}
                onLock={handleLock}
                onMenuToggle={() => setMobileMenuOpen(true)}
              />
            </div>
          </div>
        </ErrorBoundary>
      </main>

    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;
