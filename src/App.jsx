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

/* ================= lock screen component ================= */
function LockScreen({ onAuthorize }) {
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState(false);
  const [resisting, setResisting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [ripples, setRipples]     = useState([]);    // [{id,x,y,label}]
  const [activeKey, setActiveKey] = useState(null);
  const [mounted, setMounted]     = useState(false);

  const correctPin = import.meta.env.VITE_APP_PIN;

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  // Popup after 3 s
  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(t);
  }, []);

  /* ── helpers ── */
  const addRipple = (label, x = 50, y = 32) => {
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { id, x, y, label }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };

  const handleKeyPress = (digit, e) => {
    if (unlocking || resisting) return;
    if (!correctPin) return;

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      addRipple(digit, e.clientX - rect.left, e.clientY - rect.top);
    } else {
      addRipple(digit);
    }
    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 140);

    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === correctPin) {
          setUnlocking(true);
          setTimeout(() => {
            sessionStorage.setItem('minianon_authorized', 'true');
            onAuthorize();
          }, 3200);
        } else {
          setTimeout(() => {
            setResisting(true);
            setError(true);
            setPin('');
            setTimeout(() => setResisting(false), 650);
          }, 90);
        }
      }
    }
  };

  const handleBackspace = (fromKeyboard = false) => {
    if (unlocking || resisting) return;
    if (fromKeyboard) { addRipple('⌫'); setActiveKey('⌫'); setTimeout(() => setActiveKey(null), 140); }
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = (fromKeyboard = false) => {
    if (unlocking) return;
    if (fromKeyboard) { addRipple('C'); setActiveKey('C'); setTimeout(() => setActiveKey(null), 140); }
    setPin('');
    setError(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (unlocking || resisting) return;
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleBackspace(true);
      else if (e.key === 'Escape') handleClear(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin, unlocking, resisting]);

  /* ── Status state ── */
  const statusColor = unlocking ? '#34d399' : error ? '#f87171' : 'rgba(148,163,184,0.5)';
  const statusText  = !correctPin ? 'PIN NOT CONFIGURED — CHECK .ENV'
                    : error       ? 'Incorrect passcode'
                    : unlocking   ? 'Access granted…'
                    :               'Enter your passcode';

  /* ── Keypad button ── */
  const KeypadBtn = ({ label, sub, onClick, variant = 'digit' }) => {
    const isActive = activeKey === label;
    const myRipples = ripples.filter(r => r.label === label);
    const isGhost = variant === 'ghost';
    const isDanger = variant === 'danger';

    return (
      <button
        onClick={onClick}
        disabled={unlocking}
        className="relative overflow-hidden focus:outline-none cursor-pointer select-none"
        style={{
          height: 66,
          borderRadius: 18,
          transition: 'transform 0.13s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease',
          transform: isActive ? 'scale(0.91)' : 'scale(1)',
          background: isGhost || isDanger
            ? isActive
              ? isDanger ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.08)'
              : 'transparent'
            : isActive
              ? 'linear-gradient(145deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.16) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.022) 100%)',
          border: isGhost || isDanger
            ? `1px solid ${isActive ? (isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)') : 'transparent'}`
            : `1px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
          boxShadow: isActive
            ? isGhost || isDanger ? 'none' : '0 0 28px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.12)'
            : isGhost || isDanger ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.055), 0 4px 12px rgba(0,0,0,0.45)',
        }}
      >
        {/* Ripple bursts */}
        {myRipples.map(r => (
          <span key={r.id} className="absolute rounded-full pointer-events-none"
            style={{
              width: 90, height: 90,
              left: r.x - 45, top: r.y - 45,
              background: isDanger ? 'rgba(239,68,68,0.18)' : 'rgba(139,92,246,0.18)',
              animation: 'keyRipple 0.55s ease-out forwards',
            }}
          />
        ))}

        {/* Label */}
        {variant === 'digit' ? (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span style={{ fontSize: 22, fontWeight: 300, color: isActive ? '#fff' : 'rgba(226,232,240,0.92)', lineHeight: 1, letterSpacing: '-0.01em' }}>{label}</span>
            {sub && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: isActive ? 'rgba(165,180,252,0.7)' : 'rgba(148,163,184,0.3)' }}>{sub}</span>}
          </div>
        ) : variant === 'ghost' ? (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: isActive ? '#a5b4fc' : 'rgba(100,116,139,0.65)' }}>{label}</span>
        ) : (
          <Delete size={15} style={{ color: isActive ? '#f87171' : 'rgba(100,116,139,0.65)', margin: 'auto' }} />
        )}
      </button>
    );
  };

  /* ── Phone-style keypad labels ── */
  const keyDefs = ['1','2','3','4','5','6','7','8','9'];

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center select-none relative overflow-hidden"
      style={{ background: '#04050e', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Deep space background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Aurora blob 1 */}
        <div className="animate-orb absolute" style={{
          top: '-10%', left: '-10%', width: '70%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(79,58,180,0.28) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(72px)',
        }} />
        {/* Aurora blob 2 */}
        <div className="animate-orb-slow absolute" style={{
          bottom: '-15%', right: '-10%', width: '65%', height: '65%',
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.22) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)',
        }} />
        {/* Cyan accent */}
        <div className="animate-orb absolute" style={{
          top: '55%', left: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%',
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', animationDelay: '-6s',
        }} />
        {/* Fine dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.55,
        }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(4,5,14,0.72) 100%)',
        }} />
        {/* Top edge fade */}
        <div className="absolute inset-x-0 top-0 h-32" style={{ background: 'linear-gradient(to bottom, rgba(4,5,14,0.7) 0%, transparent 100%)' }} />
        {/* Bottom edge fade */}
        <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: 'linear-gradient(to top, rgba(4,5,14,0.7) 0%, transparent 100%)' }} />
      </div>

      {/* ── Success radial burst ── */}
      {unlocking && (
        <div className="absolute inset-0 z-20 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 42%, rgba(99,102,241,0.22) 0%, transparent 70%)',
          animation: 'successFlash 3.2s cubic-bezier(0.25,1,0.5,1) forwards',
        }} />
      )}

      {/* ── Main panel — entry animation ── */}
      <div
        className={`relative z-10 w-full flex flex-col items-center ${unlocking ? 'animate-unlock' : ''}`}
        style={{
          maxWidth: 360,
          padding: '0 24px',
          gap: 36,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Brand header ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

          {/* Icon with concentric rings */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer pulse ring */}
            <div style={{
              position: 'absolute', inset: -22, borderRadius: 48,
              border: '1px solid rgba(99,102,241,0.12)',
              animation: 'ringPulse 3s ease-in-out infinite',
            }} />
            {/* Mid ring */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: 38,
              border: '1px solid rgba(99,102,241,0.08)',
            }} />
            {/* Icon card */}
            <div style={{
              width: 92, height: 92, borderRadius: 28,
              background: 'linear-gradient(145deg, rgba(18,20,44,0.9) 0%, rgba(10,12,28,0.95) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: [
                '0 24px 48px rgba(0,0,0,0.7)',
                '0 0 0 1px rgba(255,255,255,0.04)',
                'inset 0 1px 0 rgba(255,255,255,0.07)',
                unlocking ? '0 0 40px rgba(52,211,153,0.25)' : error ? '0 0 40px rgba(239,68,68,0.18)' : '0 0 40px rgba(99,102,241,0.15)',
              ].join(', '),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              transition: 'box-shadow 0.5s ease',
            }}>
              {/* Inner gloss */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 28,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
                pointerEvents: 'none',
              }} />
              <div style={{ width: 52, height: 52, filter: 'drop-shadow(0 4px 14px rgba(99,102,241,0.45))' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="100%" height="100%">
                  <defs>
                    <linearGradient id="llg" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <filter id="llglow">
                      <feGaussianBlur stdDeviation="1.6" result="b" />
                      <feComposite in="SourceGraphic" in2="b" operator="over" />
                    </filter>
                  </defs>
                  <path d="M38 6C38 9.5 39.5 11 43 11C39.5 11 38 12.5 38 16C38 12.5 36.5 11 33 11C36.5 11 38 9.5 38 6Z" fill="url(#llg)" filter="url(#llglow)" />
                  <rect x="8" y="38" width="10" height="3" rx="1.5" fill="url(#llg)" opacity={0.4} />
                  <rect x="15" y="31" width="12" height="3" rx="1.5" fill="url(#llg)" opacity={0.6} />
                  <rect x="22" y="24" width="14" height="3" rx="1.5" fill="url(#llg)" opacity={0.8} />
                  <rect x="29" y="17" width="16" height="3" rx="1.5" fill="url(#llg)" filter="url(#llglow)" />
                  <path d="M28 11.5C31.5 10.5 34.5 9 37.5 7.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" filter="url(#llglow)" />
                  <path d="M19 28C21 21 24 16 27.5 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" filter="url(#llglow)" />
                  <path d="M19 28C17.5 30.5 15.5 32 14.5 32.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
                  <path d="M22 21C24.5 21.5 27 22.5 28.5 23.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" filter="url(#llglow)" />
                  <circle cx="28" cy="8.5" r="3.5" fill="#fff" filter="url(#llglow)" />
                </svg>
              </div>
            </div>
            {/* Glow halo */}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: 34,
              background: unlocking ? 'rgba(52,211,153,0.12)' : error ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
              filter: 'blur(20px)', zIndex: -1,
              transition: 'background 0.5s ease',
            }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 26, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0,
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 40%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>AnonVault</h1>
            <p style={{
              margin: '6px 0 0', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(148,163,184,0.38)',
            }}>Private · Encrypted · Secure</p>
          </div>
        </div>

        {/* ── PIN indicator row ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className={resisting ? 'animate-resist' : ''} style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
            {[0,1,2,3].map(i => {
              const filled = i < pin.length;
              const dotColor = filled
                ? (error ? '#f87171' : unlocking ? '#34d399' : '#818cf8')
                : (error ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.08)');
              const dotGlow = filled
                ? (error ? '0 0 14px rgba(248,113,113,0.8)' : unlocking ? '0 0 14px rgba(52,211,153,0.8)' : '0 0 14px rgba(129,140,248,0.8)')
                : 'none';
              return (
                <div key={i}
                  className={filled ? 'animate-dot-pop' : ''}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: dotColor,
                    boxShadow: dotGlow,
                    border: `1px solid ${filled ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    transform: filled ? 'scale(1.18)' : 'scale(1)',
                    transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Status text */}
          <div style={{ minHeight: 16, textAlign: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: statusColor,
              transition: 'color 0.3s ease',
              animation: !correctPin ? 'pulse 1.5s infinite' : 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {unlocking && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'beacon 1s infinite' }} />}
              {error && <span style={{ fontSize: 11 }}>✕</span>}
              {statusText}
            </span>
          </div>
        </div>

        {/* ── Keypad ── */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(160deg, rgba(14,16,36,0.85) 0%, rgba(8,10,24,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 28,
          padding: '20px 16px 16px',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          {/* Number grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {keyDefs.map(d => (
              <KeypadBtn key={d} label={d} onClick={e => handleKeyPress(d, e)} variant="digit" />
            ))}
          </div>
          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <KeypadBtn label="C" variant="ghost" onClick={() => handleClear()} />
            <KeypadBtn label="0" onClick={e => handleKeyPress('0', e)} variant="digit" />
            <KeypadBtn label="⌫" variant="danger" onClick={() => handleBackspace()} />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="absolute bottom-7 z-10 text-center" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.5s' }}>
        <p style={{ fontSize: 11, color: 'rgba(71,85,105,0.8)', margin: 0 }}>
          Want the PIN?{' '}
          <a
            href="https://link.minianon.in/tusharbhardwaj"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none', borderBottom: '1px dotted rgba(99,102,241,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6366f1'; }}
          >Contact Mini Anon</a>
        </p>
      </div>

      {/* ── "Don't know Mini Anon?" popup ── */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-30 animate-popup">
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 16px', borderRadius: 18, maxWidth: 280,
            background: 'linear-gradient(135deg, rgba(12,14,30,0.97) 0%, rgba(8,10,22,0.99) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 99, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
            <div style={{ paddingLeft: 6, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Don't know Mini Anon?</p>
              <a href="https://minianon.in" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, fontWeight: 500, color: '#818cf8', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color='#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#818cf8'; }}
              >
                Click here to find out <span style={{ opacity: 0.6 }}>→</span>
              </a>
            </div>
            <button onClick={() => setShowPopup(false)}
              style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(100,116,139,0.7)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
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
