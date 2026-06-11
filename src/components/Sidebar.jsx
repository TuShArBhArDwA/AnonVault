import React, { useState, useEffect, useRef } from 'react';
import { CalendarRange, Lightbulb, TrendingUp, CheckSquare, X, Zap, ChevronLeft, ChevronRight, Rocket, Quote, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats, mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('anonvault_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('anonvault_sidebar_collapsed', String(nextState));
  };

  const pending = stats.pendingTasks || 0;
  const total = stats.totalTasks || 0;
  const completed = stats.completedTasks || 0;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Summary Workspace',
      accent: '#0ea5e9',
    },
    {
      id: 'tasks',
      label: 'Daily Checklist',
      icon: CheckSquare,
      count: stats.pendingTasks,
      desc: 'Tasks & subtasks',
      accent: '#38bdf8',
    },
    {
      id: 'timeline',
      label: 'Hackathon Timeline',
      icon: CalendarRange,
      count: stats.totalApplications,
      desc: 'Track deadlines',
      accent: '#34d399',
    },
    {
      id: 'ideas',
      label: 'Idea Vault',
      icon: Lightbulb,
      count: stats.totalIdeas,
      desc: 'Capture thoughts',
      accent: '#fbbf24',
    },
    {
      id: 'project-ideas',
      label: 'Project Ideas',
      icon: Rocket,
      count: stats.totalProjectIdeas,
      desc: 'Brainstorm concepts',
      accent: '#818cf8',
    },
    {
      id: 'quotes',
      label: 'Quotes Vault',
      icon: Quote,
      count: stats.totalQuotes,
      desc: 'Inspirational wisdom',
      accent: '#f43f5e',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
          style={{ animation: 'fadeIn 0.2s ease forwards' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`glass-sidebar h-screen flex flex-col shrink-0 select-none
        fixed lg:static top-0 bottom-0 left-0 z-50 transition-all duration-300
        ${isCollapsed ? 'w-[72px]' : 'w-[268px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* ── Brand header ── */}
        <div className={`px-4 pt-7 pb-5 flex items-center justify-between relative group/brandheader shrink-0`}>
          <div className="flex items-center gap-3">
            {/* Animated logo badge */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(56,189,248,0.15) 0%, rgba(14,165,233,0.08) 100%)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  boxShadow: '0 0 18px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {/* Shimmer sweep */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
                    animation: 'shimmerSweep 3s ease-in-out infinite',
                  }}
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-6 h-6">
                  <defs>
                    <linearGradient id="sbGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#7dd3fc" />
                    </linearGradient>
                    <filter id="sbGlow">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <path d="M38 6C38 9.5 39.5 11 43 11C39.5 11 38 12.5 38 16C38 12.5 36.5 11 33 11C36.5 11 38 9.5 38 6Z" fill="url(#sbGrad)" filter="url(#sbGlow)" />
                  <rect x="8" y="38" width="10" height="3" rx="1.5" fill="url(#sbGrad)" opacity={0.4} />
                  <rect x="15" y="31" width="12" height="3" rx="1.5" fill="url(#sbGrad)" opacity={0.6} />
                  <rect x="22" y="24" width="14" height="3" rx="1.5" fill="url(#sbGrad)" opacity={0.8} />
                  <rect x="29" y="17" width="16" height="3" rx="1.5" fill="url(#sbGrad)" filter="url(#sbGlow)" />
                  <path d="M28 11.5C31.5 10.5 34.5 9 37.5 7.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" filter="url(#sbGlow)" />
                  <path d="M19 28C21 21 24 16 27.5 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter="url(#sbGlow)" />
                  <path d="M19 28C17.5 30.5 15.5 32 14.5 32.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity={0.8} />
                  <path d="M22 21C24.5 21.5 27 22.5 28.5 23.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" filter="url(#sbGlow)" />
                  <circle cx="28" cy="8.5" r="3.5" fill="#ffffff" filter="url(#sbGlow)" />
                </svg>
              </div>
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: '0 0 14px rgba(56,189,248,0.25)',
                  animation: 'pulseRing 3s ease-in-out infinite',
                }}
              />
            </div>

            {!isCollapsed && (
              <div className="transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
                <h1 className="text-[15px] font-extrabold tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #e0f2fe 60%, #7dd3fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AnonVault
                </h1>
                <p className="text-[10px] font-semibold mt-0.5 tracking-[0.2em] uppercase"
                  style={{ color: 'rgba(125,211,252,0.5)' }}>
                  Private Space
                </p>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleCollapse}
            className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.09] text-slate-550 hover:text-white cursor-pointer transition-all ${
              isCollapsed 
                ? 'absolute left-1/2 -translate-x-1/2 top-20 border-white/[0.09]' 
                : 'hover:scale-105'
            }`}
            title={isCollapsed ? "Maximize Sidebar" : "Minimize Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        <div className={`divider ${isCollapsed ? 'mx-2 mt-9' : 'mx-4'}`} />

        {/* ── Navigation ── */}
        <div className={`pt-5 flex-1 overflow-y-auto min-h-0 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
          
          {/* ── Remaining Tasks stat panel (Focus Progress) ── */}
          {!isCollapsed && (
            <div 
              onClick={() => setActiveTab('tasks')}
              className="group/taskwidget cursor-pointer relative rounded-2xl p-[1px] transition-all duration-300 select-none overflow-hidden mb-6"
              style={{
                boxShadow: pending > 0 
                  ? '0 0 15px -3px rgba(56, 189, 248, 0.08)' 
                  : '0 0 15px -3px rgba(52, 211, 153, 0.08)'
              }}
            >
              {/* Rotating background light beam (moving border light) */}
              <div 
                className="absolute inset-[-150%] opacity-20 group-hover/taskwidget:opacity-50 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: pending > 0 
                    ? 'conic-gradient(from 0deg at 50% 50%, transparent 40%, #38bdf8 50%, transparent 60%)'
                    : 'conic-gradient(from 0deg at 50% 50%, transparent 40%, #34d399 50%, transparent 60%)',
                  animation: 'rotateGlow 4s linear infinite',
                }}
              />

              {/* Inner Content Card */}
              <div className="relative rounded-[15px] p-3.5 bg-slate-950/92 backdrop-blur-xl transition-all duration-300 group-hover/taskwidget:bg-slate-900/80">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      pending > 0 
                        ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)] animate-pulse' 
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                    }`} />
                    <span className="text-[9px] font-bold text-slate-550 tracking-[0.2em] uppercase">Focus Progress</span>
                  </div>
                  <span className={`text-[10px] font-extrabold font-mono tracking-tight ${
                    pending > 0 ? 'text-sky-400' : 'text-emerald-400'
                  }`}>
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-[3px] bg-white/[0.04] rounded-full overflow-hidden mb-3.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-550 cubic-bezier(0.16, 1, 0.3, 1) ${
                      pending > 0 
                        ? 'bg-gradient-to-r from-sky-500 to-sky-400' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Status Detail Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={12} className={pending > 0 ? 'text-sky-400' : 'text-emerald-400'} />
                    <span className="text-[11px] font-semibold text-slate-300">
                      {pending > 0 
                        ? `${pending} task${pending > 1 ? 's' : ''} left` 
                        : 'All tasks clear'
                      }
                    </span>
                  </div>
                  <span className="text-[9.5px] text-slate-655 font-bold group-hover/taskwidget:text-slate-400 transition-colors">
                    Checklist →
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.18em] px-3 mb-3 animate-in fade-in duration-200">
              Workspace
            </p>
          )}

          <nav className="flex flex-col gap-1.5">
            {navItems.map(({ id, label, icon: Icon, count, desc, accent }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                  className={`nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? label : ''}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${accent}22 0%, ${accent}14 100%)`
                          : 'rgba(255,255,255,0.04)',
                        border: isActive
                          ? `1px solid ${accent}40`
                          : '1px solid rgba(255,255,255,0.05)',
                        color: isActive ? accent : '#64748b',
                        boxShadow: isActive ? `0 0 12px ${accent}30` : 'none',
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left animate-in fade-in duration-200">
                        <span
                          className="block text-[13px] font-semibold leading-snug"
                          style={{ color: isActive ? '#bae6fd' : '#cbd5e1' }}
                        >
                          {label}
                        </span>
                        <span className="block text-[10px] text-slate-600 mt-0.5 font-medium">{desc}</span>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && count > 0 && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums shrink-0"
                      style={{
                        background: isActive ? `${accent}28` : 'rgba(255,255,255,0.05)',
                        color: isActive ? accent : '#475569',
                        border: `1px solid ${isActive ? `${accent}38` : 'transparent'}`,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Footer ── */}
        {!isCollapsed ? (
          <div className="px-5 py-4 flex flex-col items-center justify-center shrink-0 animate-in fade-in duration-200 w-full">
            <div className="divider w-full mb-3" />
            
            {/* Social Links Row */}
            <div className="flex items-center gap-3 mb-3.5">
              <a
                href="https://x.com/Tusharab2004"
                target="_blank"
                rel="noopener noreferrer"
                title="X (formerly Twitter)"
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-slate-400 hover:text-white transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/bhardwajtushar2004/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn (Bhardwaj Tushar)"
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 transition-all duration-200 relative group/ln1"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span className="absolute -top-7 px-2 py-0.5 bg-slate-900 border border-white/10 text-[9px] text-slate-350 rounded-md opacity-0 group-hover/ln1:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">LinkedIn (Tushar)</span>
              </a>
              <a
                href="https://www.linkedin.com/in/tusharbhardwaj2004ab/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn (Tushar Bhardwaj)"
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 transition-all duration-200 relative group/ln2"
              >
                <svg className="w-3.5 h-3.5 fill-current scale-95" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span className="absolute -top-7 px-2 py-0.5 bg-slate-900 border border-white/10 text-[9px] text-slate-355 rounded-md opacity-0 group-hover/ln2:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">LinkedIn (Mini Anon)</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center shrink-0 w-full gap-2">
            <div className="divider w-full px-2 mb-1" />
            <a
              href="https://x.com/Tusharab2004"
              target="_blank"
              rel="noopener noreferrer"
              title="X"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        )}

        {/* CSS-in-JSX keyframes needed for sidebar-specific effects */}
        <style>{`
          @keyframes shimmerSweep {
            0%   { transform: translateX(-200%); }
            100% { transform: translateX(200%); }
          }
          @keyframes pulseRing {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes rotateGlow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </aside>
    </>
  );
}
