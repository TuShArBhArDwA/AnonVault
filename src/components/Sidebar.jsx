import React from 'react';
import { CalendarRange, Lightbulb, Layers, TrendingUp, CheckSquare } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats }) {
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
    <aside className="glass-sidebar w-72 h-screen flex flex-col shrink-0 select-none">

      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers size={17} className="text-white" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-20 blur-sm -z-10" />
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
              onClick={() => setActiveTab(id)}
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
                <span className={`text-2xl font-bold tabular-nums tracking-tight ${
                  stats.pendingTasks > 0 ? 'text-indigo-300' : 'text-slate-400'
                }`}>
                  {stats.pendingTasks}
                </span>
                <span className="text-[10px] text-slate-600 font-medium mb-0.5">remaining</span>
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
  );
}
