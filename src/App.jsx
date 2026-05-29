import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TimelineView from './components/TimelineView';
import IdeaVaultView from './components/IdeaVaultView';
import TasksView from './components/TasksView';
import { ToastProvider, useToast } from './components/Toast';
import { Lock, ShieldAlert, Cpu } from 'lucide-react';
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
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState(false);
  const [resisting, setResisting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [ripple, setRipple]     = useState(null); // { key, x, y }

  const correctPin = import.meta.env.VITE_APP_PIN;

  // Show "Don't know Mini Anon?" popup after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleKeyPress = (digit, e) => {
    if (unlocking || resisting) return;
    if (!correctPin) return;

    // Ripple effect
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({ key: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          setUnlocking(true);
          setTimeout(() => {
            sessionStorage.setItem('minianon_authorized', 'true');
            onAuthorize();
          }, 750);
        } else {
          setTimeout(() => {
            setResisting(true);
            setError(true);
            setPin('');
            setTimeout(() => setResisting(false), 600);
          }, 100);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (unlocking || resisting) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    if (unlocking) return;
    setPin('');
    setError(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape')    handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, unlocking, resisting]);

  const KeypadBtn = ({ label, onClick, ghost }) => (
    <button
      onClick={onClick}
      disabled={unlocking}
      className={`relative overflow-hidden h-[62px] rounded-2xl focus:outline-none transition-all duration-150 cursor-pointer
        ${ghost
          ? 'text-[11px] font-bold tracking-widest uppercase text-slate-700 hover:text-slate-400 hover:bg-white/[0.03]'
          : `bg-gradient-to-b from-white/[0.07] to-white/[0.03]
             border border-white/[0.08] hover:border-indigo-500/35
             text-[20px] font-semibold text-slate-200 hover:text-white
             shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.4)]
             hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(99,102,241,0.12)]
             hover:scale-[1.05] active:scale-[0.95] hover:bg-white/[0.09]`
        }`}
    >
      {/* Ripple */}
      {!ghost && ripple && (
        <span
          key={ripple.key}
          className="absolute rounded-full bg-indigo-400/20 pointer-events-none"
          style={{
            width: 80, height: 80,
            left: ripple.x - 40, top: ripple.y - 40,
            animation: 'keyRipple 0.5s ease-out forwards',
          }}
        />
      )}
      {label}
    </button>
  );

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none relative overflow-hidden font-sans">

      {/* ── Animated ambient background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Drifting orbs */}
        <div className="animate-orb absolute top-[-18%] left-[-12%] w-[65%] h-[65%] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)' }} />
        <div className="animate-orb-slow absolute bottom-[-20%] right-[-14%] w-[60%] h-[60%] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)' }} />
        <div className="animate-orb absolute top-[40%] left-[35%] w-[30%] h-[30%] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', animationDelay: '-4s' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.014]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Radial vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(2,4,14,0.55) 100%)' }} />
      </div>

      {/* ── Success flash overlay ── */}
      {unlocking && (
        <div className="absolute inset-0 z-20 bg-indigo-400/20 animate-success-flash pointer-events-none" />
      )}

      {/* ── Main content ── */}
      <div className={`relative z-10 w-full max-w-[340px] mx-auto px-5 flex flex-col items-center gap-8 transition-all duration-700
        ${unlocking ? 'animate-unlock' : ''}`}>

        {/* Brand */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            {/* Outer glow ring — pulses */}
            <div className="absolute -inset-4 rounded-[36px] border border-indigo-500/10 animate-pulse" />
            {/* Mid ring */}
            <div className="absolute -inset-2 rounded-[30px] border border-indigo-500/[0.07]" />
            {/* Icon card */}
            <div className="relative w-24 h-24 rounded-[26px] flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(167,139,250,0.07) 100%)',
                border: '1px solid rgba(99,102,241,0.22)',
                boxShadow: '0 0 60px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}>
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-30"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />
              <Lock size={34} className={`transition-all duration-500 ${unlocking ? 'text-emerald-300' : error ? 'text-rose-400' : 'text-indigo-300'}`} strokeWidth={1.4} />
            </div>
            {/* Glow blur */}
            <div className={`absolute -inset-2 rounded-[30px] blur-xl -z-10 transition-colors duration-500
              ${unlocking ? 'bg-emerald-500/15' : error ? 'bg-rose-500/12' : 'bg-indigo-500/12'}`} />
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-[24px] font-bold tracking-[0.2em] uppercase"
              style={{ background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 45%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AnonVault
            </h1>
            <p className="text-[9px] font-semibold tracking-[0.32em] uppercase"
              style={{ color: 'rgba(148,163,184,0.45)' }}>
              Private · Encrypted · Secure
            </p>
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex flex-col items-center gap-3">
          <div className={`flex justify-center gap-5 ${resisting ? 'animate-resist' : ''}`}>
            {[0,1,2,3].map(i => (
              <div key={i}
                className={`rounded-full transition-all duration-200 ${i < pin.length ? 'animate-dot-pop' : ''}`}
                style={{
                  width: 15, height: 15,
                  background: i < pin.length
                    ? error
                      ? 'rgba(239,68,68,0.9)'
                      : unlocking
                        ? 'rgba(52,211,153,0.9)'
                        : 'rgba(99,102,241,0.9)'
                    : error
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(255,255,255,0.06)',
                  boxShadow: i < pin.length
                    ? error
                      ? '0 0 16px rgba(239,68,68,0.75)'
                      : unlocking
                        ? '0 0 16px rgba(52,211,153,0.75)'
                        : '0 0 16px rgba(99,102,241,0.75)'
                    : 'none',
                  ring: '1px solid rgba(255,255,255,0.08)',
                  transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <p className={`text-[10px] font-semibold tracking-[0.2em] uppercase transition-all min-h-[13px] ${
            !correctPin   ? 'text-amber-400 animate-pulse'
            : error       ? 'text-rose-400'
            : unlocking   ? 'text-emerald-400'
            :               'text-slate-700'
          }`}>
            {!correctPin  ? 'PIN NOT CONFIGURED — CHECK .ENV'
            : error       ? '✕  Incorrect passcode'
            : unlocking   ? '✓  Unlocking…'
            :               'Enter your PIN to continue'}
          </p>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {['1','2','3','4','5','6','7','8','9'].map(num => (
            <KeypadBtn key={num} label={num} onClick={e => handleKeyPress(num, e)} />
          ))}
          <KeypadBtn label="Clear" ghost onClick={handleClear} />
          <KeypadBtn label="0" onClick={e => handleKeyPress('0', e)} />
          <button
            onClick={handleBackspace}
            disabled={unlocking}
            className="h-[62px] rounded-2xl text-[20px] text-slate-700 hover:text-slate-300 hover:bg-white/[0.04] focus:outline-none transition-all cursor-pointer active:scale-95"
          >⌫</button>
        </div>
      </div>

      {/* ── Footer — contact link ── */}
      <div className="absolute bottom-7 z-10 text-center">
        <p className="text-[11px] text-slate-700">
          Want the PIN? Contact{' '}
          <a
            href="https://link.minianon.in/tusharbhardwaj"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-all duration-200 underline underline-offset-2 decoration-dotted"
            style={{ color: '#818cf8', textDecorationColor: 'rgba(129,140,248,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.textDecorationColor = 'rgba(165,180,252,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.textDecorationColor = 'rgba(129,140,248,0.5)'; }}
          >
            Mini Anon
          </a>
        </p>
      </div>

      {/* ── "Don't know Mini Anon?" popup — appears after 3s — bottom-right corner ── */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-30 animate-popup">
          <div className="relative flex items-start gap-3 px-4 py-3.5 rounded-2xl max-w-[280px]"
            style={{
              background: 'linear-gradient(135deg, rgba(15,17,35,0.96) 0%, rgba(10,12,28,0.98) 100%)',
              border: '1px solid rgba(99,102,241,0.18)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
            }}>
            {/* Accent bar */}
            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-indigo-400 to-violet-500" />
            <div className="pl-1 flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-200 leading-snug">Don't know Mini Anon?</p>
              <a href="https://minianon.in" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors group">
                Click here to find out
                <span className="opacity-60 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
              </a>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all cursor-pointer text-[14px] leading-none mt-0.5"
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
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, ideas

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
      showToast('success', 'Vault Synced', 'All data loaded successfully.');
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
      await deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      showToast('warning', 'Hackathon Deleted', 'The entry has been permanently removed.');
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
              onClick={loadData}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-350 border border-rose-500/20 rounded font-medium transition-colors"
            >
              Retry Sync
            </button>
          </div>
        )}

        <ErrorBoundary>
          {activeTab === 'timeline' ? (
            <TimelineView 
              applications={applications}
              onAdd={handleAddApplication}
              onUpdate={handleUpdateApplication}
              onDelete={handleDeleteApplication}
              loading={loading}
              theme={theme}
              toggleTheme={toggleTheme}
              showToast={showToast}
            />
          ) : activeTab === 'ideas' ? (
            <IdeaVaultView 
              ideas={ideas}
              onAdd={handleAddIdea}
              onUpdate={handleUpdateIdea}
              onDelete={handleDeleteIdea}
              loading={loading}
              theme={theme}
              toggleTheme={toggleTheme}
              showToast={showToast}
            />
          ) : (
            <TasksView
              theme={theme}
              toggleTheme={toggleTheme}
              showToast={showToast}
              onTasksChange={refreshPendingTasks}
            />
          )}
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
