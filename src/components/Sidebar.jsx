import React, { useState, useEffect, useRef } from 'react';
import { CalendarRange, Lightbulb, TrendingUp, CheckSquare, X, Zap, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats, mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('anonvault_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('anonvault_sidebar_collapsed', String(nextState));
  };

  const navItems = [
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
          {/* ── Overview stats ── */}
          {!isCollapsed && (
            <div className="mt-7 animate-in fade-in duration-200">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.18em] px-3 mb-3">
                Overview
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Today's tasks */}
                <div className={`stat-card transition-all duration-300 group/taskcard cursor-pointer ${
                  stats.pendingTasks > 0 ? 'stat-card-pending' : 'stat-card-completed'
                }`}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <CheckSquare 
                      size={11} 
                      className={`${
                        stats.pendingTasks > 0 
                          ? 'text-sky-400 group-hover/taskcard:animate-pulse' 
                          : 'text-emerald-400 group-hover/taskcard:scale-110 transition-transform'
                      }`} 
                    />
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wide select-none">Tasks</span>
                  </div>
                  <div className="flex items-end justify-between">
                    {stats.pendingTasks > 0 ? (
                      <>
                        <span className="text-[26px] font-extrabold tabular-nums tracking-tight leading-none text-sky-300">
                          {stats.pendingTasks}
                        </span>
                        <span className="text-[9px] text-slate-655 font-bold mb-0.5 select-none">rem</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[24px] font-black tracking-tight leading-none text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]">
                          ✓
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold mb-0.5 select-none bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-lg">
                          All Done
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hackathons */}
                <div className="stat-card">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <CalendarRange size={11} className={stats.totalApplications > 0 ? 'text-sky-400' : 'text-slate-600'} />
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wide">Events</span>
                  </div>
                  <span className={`text-[26px] font-extrabold tabular-nums tracking-tight leading-none ${
                    stats.totalApplications > 0 ? 'text-sky-300' : 'text-slate-500'
                  }`}>
                    {stats.totalApplications}
                  </span>
                </div>

                {/* Ideas */}
                <div className="stat-card">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TrendingUp size={11} className="text-amber-400" />
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wide">Ideas</span>
                  </div>
                  <span className="text-[26px] font-extrabold tabular-nums tracking-tight leading-none text-amber-300">
                    {stats.totalIdeas || 0}
                  </span>
                </div>

                {/* Project Ideas */}
                <div className="stat-card">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Rocket size={11} className="text-indigo-400" />
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wide">Projects</span>
                  </div>
                  <span className="text-[26px] font-extrabold tabular-nums tracking-tight leading-none text-indigo-300">
                    {stats.totalProjectIdeas || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!isCollapsed && (
          <div className="px-5 py-4 flex flex-col items-center justify-center shrink-0 animate-in fade-in duration-200">
            <div className="divider w-full mb-4" />
            <p className="text-[11px] text-slate-600 font-medium">
              Made with{' '}
              <span className="text-rose-500/80">♥</span>
              {' '}by{' '}
              <a
                href="https://link.minianon.in/tusharbhardwaj"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition-all duration-200 underline underline-offset-2 decoration-dotted"
                style={{ color: '#818cf8', textDecorationColor: 'rgba(129,140,248,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#818cf8'; }}
              >
                Mini Anon
              </a>
            </p>
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
        `}</style>
      </aside>
    </>
  );
}
