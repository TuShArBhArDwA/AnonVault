import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TimelineView from './components/TimelineView';
import IdeaVaultView from './components/IdeaVaultView';
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
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const correctPin = import.meta.env.VITE_APP_PIN;

  const handleKeyPress = (digit) => {
    if (!correctPin) return; // block input if not configured
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          setTimeout(() => {
            sessionStorage.setItem('minianon_authorized', 'true');
            onAuthorize();
          }, 300);
        } else {
          setTimeout(() => {
            setShake(true);
            setError(true);
            setPin('');
            setTimeout(() => setShake(false), 400);
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  // Keyboard support for convenience
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none relative overflow-hidden font-sans">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8 z-10 px-6">
        
        {/* Branding */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-xl shadow-indigo-650/5 animate-pulse">
            <Lock size={26} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-widest uppercase">ANONVAULT</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Personal Space Security</p>
          </div>
        </div>

        {/* Visual bubbles line */}
        <div className="space-y-4">
          <div className={`flex justify-center gap-4 py-2 ${shake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  index < pin.length 
                    ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                    : error 
                      ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                      : 'border-slate-800 bg-slate-900/40'
                }`}
              ></div>
            ))}
          </div>

          <p className={`text-[10.5px] font-semibold tracking-wide transition-all ${
            !correctPin
              ? 'text-amber-400 animate-pulse'
              : error 
                ? 'text-rose-455 animate-bounce' 
                : 'text-slate-400'
          }`}>
            {!correctPin 
              ? 'VITE_APP_PIN NOT CONFIGURED IN .env (RESTART DEV SERVER)' 
              : error 
                ? 'Passcode incorrect. Try again.' 
                : 'ENTER PIN CODE TO UNLOCK SPACE'}
          </p>
        </div>

        {/* Dynamic Keypad Matrix */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full border border-slate-900 hover:border-slate-800 bg-slate-900/25 hover:bg-slate-900/60 active:bg-slate-900 text-lg font-bold text-slate-200 focus:outline-none transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full border border-slate-900 hover:border-slate-800 bg-slate-900/25 hover:bg-slate-900/60 active:bg-slate-900 text-lg font-bold text-slate-200 focus:outline-none transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-350 focus:outline-none cursor-pointer transition-colors"
            title="Backspace"
          >
            ⌫
          </button>
        </div>

      </div>

      {/* Footer information details */}
      <div className="absolute bottom-6 text-[10px] text-slate-650 flex items-center gap-1.5 uppercase tracking-widest">
        <Cpu size={10} className="text-slate-700" />
        <span>Hardware encrypted // V.2004</span>
      </div>

    </div>
  );
}

/* ================= main app dashboard component ================= */
function App() {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('minianon_authorized') === 'true');
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, ideas

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
        })
      ]);

      setApplications(appsData);
      setIdeas(ideasData);
    } catch (err) {
      console.error('Fail to load data from Supabase:', err);
      setErrorMsg('Failed to synchronize data with Supabase. Check your tables, RLS policies, and console logs.');
    } finally {
      setLoading(false);
    }
  };

  // --- Application Handlers ---
  
  const handleAddApplication = async (newApp) => {
    try {
      const added = await addApplication(newApp);
      setApplications(prev => [...prev, added].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
    } catch (err) {
      console.error('Failed to add application:', err);
      alert('Error creating application. Make sure the table "applications" exists in Supabase.');
    }
  };

  const handleUpdateApplication = async (id, updates) => {
    try {
      const updated = await updateApplication(id, updates);
      setApplications(prev => prev.map(app => app.id === id ? updated : app).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
    } catch (err) {
      console.error('Failed to update application:', err);
      alert('Error updating application. Please check your network and configuration.');
    }
  };

  const handleDeleteApplication = async (id) => {
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Error deleting application.');
    }
  };

  // --- Idea Handlers ---

  const handleAddIdea = async (newIdea) => {
    try {
      const added = await addIdea(newIdea);
      setIdeas(prev => [added, ...prev]);
    } catch (err) {
      console.error('Failed to add idea:', err);
      alert('Error creating idea. Make sure the table "ideas" exists in Supabase.');
    }
  };

  const handleUpdateIdea = async (id, updates) => {
    try {
      const updated = await updateIdea(id, updates);
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea));
    } catch (err) {
      console.error('Failed to update idea:', err);
      alert('Error updating idea.');
    }
  };

  const handleDeleteIdea = async (id) => {
    try {
      await deleteIdea(id);
      setIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (err) {
      console.error('Failed to delete idea:', err);
      alert('Error deleting idea.');
    }
  };

  // --- Dynamic Stats calculation ---
  const stats = {
    totalApplications: (applications || []).length,
    highPriorityCount: (applications || []).filter(app => app && app.priority === 'high' && app.status !== 'rejected').length,
    totalIdeas: (ideas || []).length
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
            />
          ) : (
            <IdeaVaultView 
              ideas={ideas}
              onAdd={handleAddIdea}
              onUpdate={handleUpdateIdea}
              onDelete={handleDeleteIdea}
              loading={loading}
            />
          )}
        </ErrorBoundary>
      </main>

    </div>
  );
}

export default App;
