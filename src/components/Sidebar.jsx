import React from 'react';
import { CalendarRange, Lightbulb, CheckSquare, Layers } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats }) {
  return (
    <aside className="w-80 h-screen border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col flex-1 p-6 space-y-8 overflow-y-auto">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">AnonVault</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Dashboard</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3 mb-2">Workspace</h3>
          
          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarRange size={18} />
              <span className="text-sm">Timeline Tracker</span>
            </div>
            {stats.totalApplications > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                activeTab === 'timeline' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-400'
              }`}>
                {stats.totalApplications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ideas'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Lightbulb size={18} />
              <span className="text-sm">Idea Vault</span>
            </div>
            {stats.totalIdeas > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                activeTab === 'ideas' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-400'
              }`}>
                {stats.totalIdeas}
              </span>
            )}
          </button>
        </nav>

        {/* Quick Stats Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-900">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3">Performance Overview</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Urgent Deadlines</span>
              <span className={`text-lg font-bold ${stats.highPriorityCount > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}`}>
                {stats.highPriorityCount}
              </span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Total Ideas</span>
              <span className="text-lg font-bold text-slate-300">
                {stats.totalIdeas}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding info */}
      <div className="p-6 border-t border-slate-900/80 bg-slate-950/80 text-[10px] text-slate-600 flex justify-between items-center">
        <span>© 2026 AnonVault</span>
        <span className="text-slate-650 tracking-wider">SECURE CANVAS</span>
      </div>
    </aside>
  );
}
