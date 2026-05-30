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

/* ================= access-granted overlay ================= */
function AccessGranted({ onComplete }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Start active phase immediately after mount to trigger animations
    const raf = requestAnimationFrame(() => setActive(true));
    
    // Complete success sequence and hand over to parent transition
    const t = setTimeout(() => {
      onComplete();
    }, 1300);
    
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(10, 18, 34, 0.96) 0%, rgba(3, 5, 10, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        
        {/* Animated Ripple circles */}
        <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Animated concentric shockwave rings */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1.5px solid rgba(56, 189, 248, ${0.4 - i * 0.1})`,
              width: 60,
              height: 60,
              opacity: active ? 0 : 0.8,
              transform: active ? 'scale(2.8)' : 'scale(0.8)',
              transition: `transform ${0.95 + i * 0.15}s cubic-bezier(0.1, 0.8, 0.2, 1) 0.1s, opacity ${0.9 + i * 0.15}s cubic-bezier(0.1, 0.8, 0.2, 1) 0.1s`,
              boxShadow: i === 1 ? '0 0 24px rgba(56, 189, 248, 0.15)' : 'none',
            }} />
          ))}

          {/* Central target check badge */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(56, 189, 248, 0.1) 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.6)',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s, opacity 0.5s ease',
            transform: active ? 'scale(1)' : 'scale(0.5)',
            opacity: active ? 1 : 0,
            zIndex: 2,
          }}>
            <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
              <polyline
                points="11,23 19,31 34,15"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 40,
                  strokeDashoffset: active ? 0 : 40,
                  transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
                  filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.85))',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Access status labels */}
        <div style={{
          textAlign: 'center',
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(12px)',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, opacity 0.6s ease 0.15s'
        }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 800,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: '#38bdf8',
            textShadow: '0 0 24px rgba(56, 189, 248, 0.5)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>Access Granted</p>
          <p style={{
            margin: '8px 0 0', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.18em', color: 'rgba(148, 163, 184, 0.5)',
            textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            decrypting secure vault...
          </p>
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
            setErrorCount(c => {
              const nextErr = c + 1;
              if (nextErr >= 2) {
                setShowPopup(true);
              }
              return nextErr;
            });
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
            ? isActive ? (isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(56,189,248,0.10)') : 'rgba(255,255,255,0.02)'
            : isActive
              ? 'linear-gradient(145deg,rgba(56,189,248,0.22) 0%,rgba(14,165,233,0.16) 100%)'
              : 'linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.025) 100%)',
          border: isGhost || isDanger
            ? `1px solid ${isActive ? (isDanger ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.35)') : 'rgba(255,255,255,0.05)'}`
            : `1px solid ${isActive ? 'rgba(56,189,248,0.50)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isActive
            ? (isGhost || isDanger ? 'none' : '0 0 0 1px rgba(56,189,248,0.25), 0 0 28px rgba(56,189,248,0.20), inset 0 1px 0 rgba(255,255,255,0.14)')
            : (isGhost || isDanger ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.5)'),
        }}>
        {myRipples.map(r => (
          <span key={r.id} className="absolute rounded-full pointer-events-none"
            style={{ width: 100, height: 100, left: r.x - 50, top: r.y - 50,
              background: isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.18)',
              animation: 'keyRipple 0.6s ease-out forwards' }} />
        ))}
        {variant === 'digit' ? (
          <div className="flex flex-col items-center justify-center" style={{ gap: 3 }}>
            <span style={{ fontSize: 24, fontWeight: 200, color: isActive ? '#fff' : 'rgba(226,232,240,0.9)', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>{label}</span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', color: isActive ? 'rgba(125,211,252,0.9)' : 'rgba(148,163,184,0.28)', textTransform: 'uppercase' }}>{sub}</span>
          </div>
        ) : variant === 'ghost' ? (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: isActive ? '#7dd3fc' : 'rgba(100,116,139,0.55)' }}>CLR</span>
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
        pointerEvents: unlocking ? 'none' : 'auto',
      }}>

      {/* ── BRAND HEADER ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        opacity: unlocking ? 0 : mounted ? 1 : 0,
        transform: unlocking ? 'scale(0.92) translateY(-10px)' : mounted ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
      }}>
        {/* Logo badge */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer animated ring */}
          <div className="lock-ring-outer" style={{
            position: 'absolute', inset: -28, borderRadius: 52,
            border: '1px solid rgba(56,189,248,0.14)',
          }} />
          {/* Mid ring */}
          <div style={{
            position: 'absolute', inset: -16, borderRadius: 42,
            border: '1px solid rgba(56,189,248,0.07)',
            background: 'radial-gradient(ellipse,rgba(56,189,248,0.03) 0%,transparent 70%)',
          }} />
          {/* Badge */}
          <div style={{
            width: 96, height: 96, borderRadius: 30,
            background: 'linear-gradient(145deg,rgba(10,18,34,0.95) 0%,rgba(6,11,22,0.98) 100%)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.25)'}`,
            boxShadow: [
              '0 28px 56px rgba(0,0,0,0.8)',
              '0 0 0 1px rgba(255,255,255,0.04)',
              'inset 0 1px 0 rgba(255,255,255,0.07)',
              error ? '0 0 48px rgba(239,68,68,0.2)' : '0 0 40px rgba(56,189,248,0.15)',
            ].join(','),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 30,
              background: 'linear-gradient(145deg,rgba(255,255,255,0.05) 0%,transparent 55%)',
              pointerEvents: 'none',
            }} />
            <div style={{ width: 54, height: 54, filter: 'drop-shadow(0 4px 16px rgba(56,189,248,0.4))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="100%" height="100%">
                <defs>
                  <linearGradient id="lg1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#7dd3fc" />
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
            background: error ? 'rgba(239,68,68,0.12)' : 'rgba(56,189,248,0.10)',
            filter: 'blur(22px)', zIndex: -1,
            transition: 'background 0.4s ease',
          }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0,
            background: 'linear-gradient(135deg,#ffffff 0%,#e0f2fe 35%,#7dd3fc 65%,#38bdf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            textShadow: '0 0 40px rgba(56,189,248,0.15)',
          }}>AnonVault</h1>
          <p style={{
            margin: '7px 0 0',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(56, 189, 248, 0.75)',
            textShadow: '0 0 16px rgba(56, 189, 248, 0.3)',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}>AUTHORIZED GATEWAY FOR MINI ANON</p>
        </div>
      </div>

      {/* ── PIN DOTS ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        opacity: unlocking ? 0 : mounted ? 1 : 0,
        transform: unlocking ? 'scale(0.92) translateY(-10px)' : mounted ? 'translateY(0)' : 'translateY(15px)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.22s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.22s',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
          {[0,1,2,3].map(i => {
            const filled = i < pin.length;
            return (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: filled
                  ? (error ? 'linear-gradient(135deg,#f87171,#ef4444)' : 'linear-gradient(135deg,#38bdf8,#0ea5e9)')
                  : 'rgba(255,255,255,0.07)',
                border: `1px solid ${filled ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: filled
                  ? (error ? '0 0 12px rgba(248,113,113,0.75)' : '0 0 12px rgba(56,189,248,0.70)')
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
        opacity: unlocking ? 0 : mounted ? 1 : 0,
        transform: unlocking ? 'scale(0.9) translateY(15px)' : mounted ? 'translateY(0)' : 'translateY(35px)',
        transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
      }}>
        {/* Inner top sheen */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom,rgba(56,189,248,0.03) 0%,transparent 100%)',
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
      style={{ background: 'radial-gradient(ellipse 120% 120% at 50% -10%, #08101e 0%, #05080f 55%, #020408 100%)',
               fontFamily: "'Plus Jakarta Sans',system-ui,-apple-system,sans-serif" }}>

      {/* ═══ CINEMATIC BACKGROUND ═══ */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>

        {/* Aurora orbs — sky blue */}
        <div className="lock-orb" style={{
          top: '-15%', left: '-10%', width: '75%', height: '75%',
          background: 'radial-gradient(ellipse,rgba(14,116,194,0.35) 0%,rgba(7,89,133,0.15) 45%,transparent 70%)',
          filter: 'blur(90px)',
        }} />
        <div className="lock-orb lock-orb--slow" style={{
          bottom: '-18%', right: '-12%', width: '70%', height: '70%',
          background: 'radial-gradient(ellipse,rgba(56,189,248,0.22) 0%,rgba(14,165,233,0.10) 45%,transparent 70%)',
          filter: 'blur(100px)',
        }} />
        <div className="lock-orb" style={{
          top: '30%', right: '-8%', width: '45%', height: '55%',
          background: 'radial-gradient(ellipse,rgba(99,102,241,0.12) 0%,rgba(56,189,248,0.05) 55%,transparent 75%)',
          filter: 'blur(70px)', animationDelay: '-5s',
        }} />

        {/* Perspective grid floor — sky blue */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          width: '260%', height: '50%',
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(56,189,248,0.07) 0px, transparent 1px, transparent 80px, rgba(56,189,248,0.07) 81px),
            repeating-linear-gradient(0deg,  rgba(56,189,248,0.05) 0px, transparent 1px, transparent 60px, rgba(56,189,248,0.05) 61px)
          `,
          transformOrigin: 'bottom center',
          transform: 'translateX(-50%) perspective(500px) rotateX(58deg)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 80%)',
          opacity: 0.55,
        }} />


        {/* Left data stream — sky blue tones */}
        <div style={{
          position: 'absolute', left: 20, top: 0, bottom: 0, width: 72,
          display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 40,
          maskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.5) 18%,rgba(0,0,0,0.5) 82%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.5) 18%,rgba(0,0,0,0.5) 82%,transparent 100%)',
          opacity: unlocking ? 0 : 1,
          transform: unlocking ? 'translateX(-24px)' : 'translateX(0)',
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {STREAM_LEFT.map((t, i) => (
            <div key={i} style={{
              fontSize: 8, fontFamily: "'JetBrains Mono','Courier New',monospace",
              color: i % 3 === 0 ? 'rgba(56,189,248,0.22)' : 'rgba(56,189,248,0.11)',
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
          maskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.5) 18%,rgba(0,0,0,0.5) 82%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.5) 18%,rgba(0,0,0,0.5) 82%,transparent 100%)',
          opacity: unlocking ? 0 : 1,
          transform: unlocking ? 'translateX(24px)' : 'translateX(0)',
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {STREAM_RIGHT.map((t, i) => (
            <div key={i} style={{
              fontSize: 8, fontFamily: "'JetBrains Mono','Courier New',monospace",
              color: i % 3 === 0 ? 'rgba(125,211,252,0.22)' : 'rgba(125,211,252,0.11)',
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
      {/* ═══ ACCESS GRANTED OVERLAY ═══ */}
      {unlocking && (
        <AccessGranted onComplete={() => { sessionStorage.setItem('minianon_authorized','true'); onAuthorize(); }} />
      )}

      {/* ═══ MAIN CONTENT (no vault door split) ═══ */}
      <div className="relative z-10" style={{ pointerEvents: unlocking ? 'none' : 'auto' }}>
        {mainPanelContent}
      </div>

      {/* ── FOOTER ── */}
      <div className="absolute bottom-6 z-10 text-center"
        style={{ opacity: unlocking ? 0 : mounted ? 1 : 0, transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 20px',
          borderRadius: 99,
          background: 'linear-gradient(135deg, rgba(10, 15, 30, 0.55) 0%, rgba(5, 7, 14, 0.75) 100%)',
          border: errorCount >= 2 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(56, 189, 248, 0.12)',
          boxShadow: errorCount >= 2
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
            : '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.28)';
          e.currentTarget.style.boxShadow = errorCount >= 2
            ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
            : '0 12px 40px rgba(56, 189, 248, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.12)';
          e.currentTarget.style.boxShadow = errorCount >= 2
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
            : '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.02)';
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: errorCount >= 2 ? '#f59e0b' : '#38bdf8',
            boxShadow: errorCount >= 2 ? '0 0 8px #f59e0b' : '0 0 8px #38bdf8',
            animation: 'lockSweep 3s infinite ease-in-out',
          }} />
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(148, 163, 184, 0.8)',
            margin: 0,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Need the lock status passcode?
            <a href="https://link.minianon.in/tusharbhardwaj" target="_blank" rel="noopener noreferrer"
              style={{
                color: errorCount >= 2 ? '#f59e0b' : '#38bdf8',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                marginLeft: 2,
                borderBottom: '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = errorCount >= 2 ? '#f59e0b' : '#38bdf8';
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}>
              Contact Mini Anon <span style={{ fontSize: 10 }}>→</span>
            </a>
          </p>
        </div>
      </div>

      {/* ── MINI ANON POPUP ── */}
      {showPopup && !unlocking && (
        <div className="fixed bottom-6 right-6 z-30 animate-popup"
             style={{ width: 288, transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column', gap: 12,
            padding: '18px 18px', borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(10,15,30,0.92) 0%, rgba(6,10,20,0.96) 100%)',
            border: errorCount >= 2 ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(56,189,248,0.18)',
            boxShadow: errorCount >= 2
              ? '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(245,158,11,0.05)'
              : '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(56,189,248,0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245,158,11,0.45)' : 'rgba(56,189,248,0.35)';
            e.currentTarget.style.boxShadow = errorCount >= 2
              ? '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(245,158,11,0.12)'
              : '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(56,189,248,0.08)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245,158,11,0.28)' : 'rgba(56,189,248,0.18)';
            e.currentTarget.style.boxShadow = errorCount >= 2
              ? '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(245,158,11,0.05)'
              : '0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(56,189,248,0.03)';
            e.currentTarget.style.transform = 'none';
          }}>
            <div style={{
              position: 'absolute', top: -10, left: 10, width: 60, height: 60,
              background: errorCount >= 2 
                ? 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
              filter: 'blur(10px)', pointerEvents: 'none'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: errorCount >= 2
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(14,165,233,0.05) 100%)',
                  border: errorCount >= 2 ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(56,189,248,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: errorCount >= 2 ? '0 0 12px rgba(245,158,11,0.1)' : '0 0 12px rgba(56,189,248,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={errorCount >= 2 ? '#f59e0b' : '#38bdf8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    {errorCount >= 2 ? (
                      <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </>
                    )}
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: errorCount >= 2 ? '#f59e0b' : '#38bdf8', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", transition: 'color 0.3s ease' }}>
                    {errorCount >= 2 ? 'RESTRICTED' : 'VAULT NODE'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    {errorCount >= 2 ? 'Key Requested' : 'Secure Environment'}
                  </span>
                </div>
              </div>
              
              <button onClick={() => setShowPopup(false)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(148,163,184,0.6)',
                  cursor: 'pointer',
                  width: 24, height: 24, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(148,163,184,0.6)';
                }}>✕</button>
            </div>

            <p style={{ margin: '4px 0 4px', fontSize: 11.5, color: 'rgba(148,163,184,0.85)', lineHeight: 1.5, fontWeight: 400 }}>
              {errorCount >= 2 ? (
                <>
                  It looks like you've entered the wrong passcode. Contact the <strong style={{ color: '#fff', fontWeight: 600 }}>Orchestrator</strong> to obtain a custom credentials token.
                </>
              ) : (
                <>
                  Don't know <strong style={{ color: '#fff', fontWeight: 600 }}>Mini Anon</strong>? This workspace is secure, sandboxed, and optimized for private task orchestration.
                </>
              )}
            </p>

            <a href={errorCount >= 2 ? 'https://link.minianon.in/tusharbhardwaj' : 'https://minianon.in'} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 12,
                background: errorCount >= 2
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(14,165,233,0.05) 100%)',
                border: errorCount >= 2 ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(56,189,248,0.22)',
                fontSize: 11, fontWeight: 600, color: errorCount >= 2 ? '#f59e0b' : '#38bdf8', textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: errorCount >= 2 ? '0 4px 12px rgba(245,158,11,0.03)' : '0 4px 12px rgba(56,189,248,0.03)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = errorCount >= 2
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(14,165,233,0.1) 100%)';
                e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245,158,11,0.45)' : 'rgba(56,189,248,0.4)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = errorCount >= 2 ? '0 4px 16px rgba(245,158,11,0.15)' : '0 4px 16px rgba(56,189,248,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = errorCount >= 2
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(14,165,233,0.05) 100%)';
                e.currentTarget.style.borderColor = errorCount >= 2 ? 'rgba(245,158,11,0.22)' : 'rgba(56,189,248,0.22)';
                e.currentTarget.style.color = errorCount >= 2 ? '#f59e0b' : '#38bdf8';
                e.currentTarget.style.boxShadow = errorCount >= 2 ? '0 4px 12px rgba(245,158,11,0.03)' : '0 4px 12px rgba(56,189,248,0.03)';
              }}>
              {errorCount >= 2 ? 'Contact Mini Anon' : 'Discover Mini Anon'} <span style={{ transition: 'transform 0.2s ease' }}>→</span>
            </a>
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
  const [showLockScreen, setShowLockScreen] = useState(() => {
    return sessionStorage.getItem('minianon_authorized') !== 'true';
  });
  const [lockFadeOut, setLockFadeOut] = useState(false);
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
    setLockFadeOut(false);
    setShowLockScreen(true);
  };

  const handleUnlockComplete = () => {
    setIsAuthorized(true);
    setLockFadeOut(true);
    setTimeout(() => {
      setShowLockScreen(false);
    }, 850);
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


  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-950 font-sans relative">
      
      {/* Dashboard Wrapper with zoom-in entry transition */}
      <div className="flex w-full h-full overflow-hidden"
        style={{
          opacity: lockFadeOut || !showLockScreen ? 1 : 0,
          transform: lockFadeOut || !showLockScreen ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1), transform 0.95s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: showLockScreen && !lockFadeOut ? 'none' : 'auto',
        }}>
        
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

      {showLockScreen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          opacity: lockFadeOut ? 0 : 1,
          transform: lockFadeOut ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: lockFadeOut ? 'none' : 'auto',
        }}>
          <LockScreen onAuthorize={handleUnlockComplete} />
        </div>
      )}
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
