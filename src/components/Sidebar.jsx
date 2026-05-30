import React from 'react';
import { CalendarRange, Lightbulb, Layers, TrendingUp, CheckSquare, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats, mobileOpen, setMobileOpen }) {
  const navItems = [
    {
      id: 'tasks',
      label: 'Daily Checklist',
      icon: CheckSquare,
      count: stats.pendingTasks,
      desc: 'Tasks & subtasks',
    },
    {
      id: 'timeline',
      label: 'Hackathon Timeline',
      icon: CalendarRange,
      count: stats.totalApplications,
      desc: 'Track deadlines',
    },
    {
      id: 'ideas',
      label: 'Idea Vault',
      icon: Lightbulb,
      count: stats.totalIdeas,
      desc: 'Capture thoughts',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`glass-sidebar w-72 h-screen flex flex-col shrink-0 select-none
        fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Mobile close trigger */}
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Brand */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-9 h-9 flex items-center justify-center filter drop-shadow-[0_4px_10px_rgba(99,102,241,0.25)] hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="sidebarLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <filter id="sidebarLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Star of Success (Premium 4-Point Sparkle) */}
                  <path d="M38 6C38 9.5 39.5 11 43 11C39.5 11 38 12.5 38 16C38 12.5 36.5 11 33 11C36.5 11 38 9.5 38 6Z" fill="url(#sidebarLogoGrad)" filter="url(#sidebarLogoGlow)" />

                  {/* Premium Floating Ascent Steps */}
                  <rect x="8" y="38" width="10" height="3" rx="1.5" fill="url(#sidebarLogoGrad)" opacity={0.4} />
                  <rect x="15" y="31" width="12" height="3" rx="1.5" fill="url(#sidebarLogoGrad)" opacity={0.6} />
                  <rect x="22" y="24" width="14" height="3" rx="1.5" fill="url(#sidebarLogoGrad)" opacity={0.8} />
                  <rect x="29" y="17" width="16" height="3" rx="1.5" fill="url(#sidebarLogoGrad)" filter="url(#sidebarLogoGlow)" />

                  {/* Fluid, Dynamic Ascending Figure */}
                  {/* Reaching Arm toward success */}
                  <path d="M28 11.5C31.5 10.5 34.5 9 37.5 7.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" filter="url(#sidebarLogoGlow)" />
                  {/* Graceful fluid body in motion (stepping up) */}
                  <path d="M19 28C21 21 24 16 27.5 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter="url(#sidebarLogoGlow)" />
                  {/* Back leg pushing off */}
                  <path d="M19 28C17.5 30.5 15.5 32 14.5 32.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
                  {/* Stepping front leg */}
                  <path d="M22 21C24.5 21.5 27 22.5 28.5 23.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" filter="url(#sidebarLogoGlow)" />
                  {/* Head (glowing sphere of vision/ambition) */}
                  <circle cx="28" cy="8.5" r="3.5" fill="#ffffff" filter="url(#sidebarLogoGlow)" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-none">AnonVault</h1>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5 tracking-widest uppercase">Private Space</p>
            </div>
          </div>
        </div>

        <div className="divider mx-4" />

        {/* Navigation */}
        <div className="px-3 pt-5 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Workspace</p>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon, count, desc }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setMobileOpen(false);
                }}
                className={`nav-item ${activeTab === id ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    activeTab === id
                      ? 'bg-indigo-500/15 text-indigo-400'
                      : 'bg-white/[0.04] text-slate-500'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <div className="text-left">
                    <span className={`block text-[13px] font-medium leading-snug ${
                      activeTab === id ? 'text-indigo-300' : 'text-slate-300'
                    }`}>{label}</span>
                    <span className="block text-[10px] text-slate-600 mt-0.5">{desc}</span>
                  </div>
                </div>
                {count > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums ${
                    activeTab === id
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-white/[0.05] text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

        {/* Stats */}
        <div className="mt-8">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Overview</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card col-span-2">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckSquare size={11} className={stats.pendingTasks > 0 ? 'text-indigo-400' : 'text-slate-600'} />
                <span className="text-[10px] text-slate-500 font-medium">Today's Tasks</span>
              </div>
              <div className="flex items-end justify-between">
                {stats.pendingTasks > 0 ? (
                  <>
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-indigo-300">
                      {stats.pendingTasks}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium mb-0.5">remaining</span>
                  </>
                ) : (
                  <>
                    <span className="text-[14px] font-bold tracking-tight text-emerald-400 flex items-center gap-1">
                      ✨ All Done!
                    </span>
                    <span className="text-[9px] text-emerald-500/80 font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      Completed
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarRange size={11} className={stats.totalApplications > 0 ? 'text-violet-400' : 'text-slate-600'} />
                <span className="text-[10px] text-slate-500 font-medium">Hackathons</span>
              </div>
              <span className={`text-2xl font-bold tabular-nums tracking-tight ${
                stats.totalApplications > 0 ? 'text-violet-300' : 'text-slate-400'
              }`}>
                {stats.totalApplications}
              </span>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={11} className="text-indigo-400" />
                <span className="text-[10px] text-slate-500 font-medium">Ideas</span>
              </div>
              <span className="text-2xl font-bold text-slate-300 tabular-nums tracking-tight">
                {stats.totalIdeas}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="divider mx-4" />
      <div className="px-6 py-4 flex items-center justify-center">
        <p className="text-[11px] text-slate-600 font-medium">
          Made with 💙 by{' '}
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
    </aside>
    </>
  );
}
