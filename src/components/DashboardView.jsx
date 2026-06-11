import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, CheckSquare, Star, Quote, Calendar, AlertTriangle, 
  MapPin, Clock, ExternalLink, ChevronRight, Tag, Lightbulb, Code2, LinkIcon,
  Circle, CheckCircle2
} from 'lucide-react';
import { getTasksForDate, toggleTaskCompletion, toggleSubtaskCompletion } from '../services/tasks';

export default function DashboardView({ 
  applications, 
  ideas, 
  projectIdeas, 
  quotes,
  onTasksChange,
  setActiveTab,
  onMenuToggle 
}) {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [todayStr, setTodayStr] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Get today's date string & start clock timer
  useEffect(() => {
    const d = new Date();
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setTodayStr(formatted);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Load today's tasks
  const loadTodayTasks = useCallback(async () => {
    if (!todayStr) return;
    setTasksLoading(true);
    try {
      const list = await getTasksForDate(todayStr);
      setTasks(list);
    } catch (err) {
      console.error('Failed to load today tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadTodayTasks();
  }, [loadTodayTasks]);

  // 3. Handle task toggles
  const handleToggleTask = async (task) => {
    try {
      const nextVal = await toggleTaskCompletion(task, todayStr);
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        completed: nextVal,
        subtasks: (t.subtasks || []).map(st => ({ ...st, completed: nextVal }))
      } : t));
      onTasksChange?.();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleToggleSubtask = async (task, subtask) => {
    try {
      const nextVal = await toggleSubtaskCompletion(task.id, subtask.id, todayStr);
      setTasks(prev => prev.map(t => {
        if (t.id !== task.id) return t;
        const nextSubs = (t.subtasks || []).map(st => st.id === subtask.id ? { ...st, completed: nextVal } : st);
        const allDone = nextSubs.length > 0 && nextSubs.every(s => s.completed);
        return { ...t, subtasks: nextSubs, completed: allDone };
      }));
      onTasksChange?.();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  // 4. Deterministic Daily Quote
  const getDailyQuote = () => {
    if (!quotes || quotes.length === 0) return null;
    const d = new Date();
    const dayHash = d.getFullYear() * 1000 + (d.getMonth() + 1) * 32 + d.getDate();
    return quotes[dayHash % quotes.length];
  };
  const dailyQuote = getDailyQuote();

  // 5. Pinned / Upcoming Hackathons
  const getDashboardHackathons = () => {
    const active = (applications || []).filter(app => app.status !== 'rejected');
    const pinned = active.filter(app => app.priority === 'high');
    if (pinned.length > 0) return pinned.slice(0, 2);
    
    // Fallback: Closest upcoming deadline
    const sorted = [...active].sort((a, b) => {
      const daysA = parseInt(a.days_left, 10) || 999;
      const daysB = parseInt(b.days_left, 10) || 999;
      return daysA - daysB;
    });
    return sorted.slice(0, 1);
  };
  const summaryHackathons = getDashboardHackathons();

  // 6. Pinned Ideas
  const getPinnedIdeas = () => {
    const pinnedIds = JSON.parse(localStorage.getItem('anonvault_ideas_pinned') || '[]');
    return (ideas || []).filter(idea => pinnedIds.includes(idea.id)).slice(0, 3);
  };
  const pinnedIdeas = getPinnedIdeas();

  // 7. Pinned Project Ideas
  const getPinnedProjects = () => {
    const pinnedIds = JSON.parse(localStorage.getItem('anonvault_project_ideas_pinned') || '[]');
    return (projectIdeas || []).filter(proj => pinnedIds.includes(proj.id)).slice(0, 3);
  };
  const pinnedProjects = getPinnedProjects();

  // Helper date text formatter
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return currentTime.toLocaleDateString(undefined, options);
  };

  const getFormattedTime = () => {
    return currentTime.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/40">
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all">
            <LayoutDashboard size={20} />
          </button>
          <div>
            <h1 className="text-[17px] font-extrabold text-white tracking-tight flex items-center gap-2 mb-1.5">
              <LayoutDashboard size={16} className="text-sky-400" />
              <span>Workspace Dashboard</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-sky-450 bg-sky-500/10 border border-sky-500/15 rounded-md px-2 py-0.5 select-none">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long' })}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {currentTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Premium live time & stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] min-w-[110px] h-[36px]">
            <span className="text-[13px] font-bold text-white tracking-wider font-mono tabular-nums leading-none">
              {getFormattedTime()}
            </span>
          </div>

          {tasks.length > 0 && (
            <div className="px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase bg-sky-500/10 border border-sky-500/20 text-sky-400 tracking-wider h-[36px] flex items-center">
              {pendingCount === 0 ? 'All Tasks Completed' : `${pendingCount} Tasks Remaining`}
            </div>
          )}
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        
        {/* Welcome Block + Daily Quote */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-white/[0.05] flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
            {/* Background glowing gradient */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-all duration-700" />
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome back to AnonVault</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
                Your private dashboard summarizes your workspace. Pin items in the Timeline, Idea Vault, and Project Ideas tabs to highlight them here.
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setActiveTab('tasks')} className="btn-primary px-4 py-2 text-[12px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                <CheckSquare size={13} /> Manage Tasks
              </button>
              <button onClick={() => setActiveTab('ideas')} className="btn-ghost px-4 py-2 text-[12px] font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 border border-white/[0.06] hover:bg-white/[0.04]">
                <Lightbulb size={13} /> Brainstorm Ideas
              </button>
            </div>
          </div>

          {/* Daily Quote Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/15 via-slate-900/50 to-slate-950/70 border border-rose-500/10 flex flex-col justify-between relative overflow-hidden group">
            <Quote className="absolute -top-4 -left-4 w-16 h-16 text-rose-500/[0.02] rotate-180" />
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10.5px] uppercase tracking-wider mb-3">
                <Quote size={11} />
                <span>Quote of the Day</span>
              </div>
              {dailyQuote ? (
                <div>
                  <p className="text-[13px] font-medium text-slate-100 italic leading-relaxed whitespace-pre-wrap break-words Lora">
                    "{dailyQuote.text}"
                  </p>
                  {dailyQuote.author && (
                    <p className="text-[10px] font-extrabold text-rose-350 mt-2.5">— {dailyQuote.author}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Add quotes in the Quotes Vault section to see them rotate here daily.</p>
              )}
            </div>
            {dailyQuote && (
              <button onClick={() => setActiveTab('quotes')} className="text-[9.5px] text-rose-400/70 hover:text-rose-455 font-bold uppercase tracking-wider mt-4 flex items-center gap-0.5 hover:underline cursor-pointer">
                Quotes Vault <ChevronRight size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Side: Daily Checklist */}
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/[0.05] flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CheckSquare size={14} className="text-sky-400" />
                <span>Today's Checklist</span>
              </h3>
              <button onClick={() => setActiveTab('tasks')} className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer">
                Manage <ChevronRight size={11} />
              </button>
            </div>

            {/* Checklist Progress Bar */}
            {tasks.length > 0 && (() => {
              const totalChecklist = tasks.length;
              const completedChecklist = tasks.filter(t => t.completed).length;
              const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
              return (
                <div className="mb-4 bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 mb-1.5">
                    <span>Today's Progress</span>
                    <span className="text-sky-400 font-mono">{checklistPercent}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-550 ease-out"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {tasksLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  Loading checklist…
                </div>
              ) : tasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <CheckSquare size={24} className="text-slate-700 animate-pulse mb-2.5" />
                  <p className="text-xs font-semibold text-slate-400">No tasks for today</p>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Create daily schedules or one-off tasks in Checklist tab.</p>
                </div>
              ) : (
                [...tasks]
                  .sort((a, b) => {
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;
                    return 0;
                  })
                  .map(task => (
                    <div key={task.id} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-all">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-slate-500 hover:text-sky-400 transition-colors cursor-pointer shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 size={16} className="text-sky-400 fill-sky-500/10" />
                          ) : (
                            <Circle size={16} className="text-slate-600 hover:text-slate-500" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12.5px] font-semibold break-words leading-tight ${task.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                            {task.title}
                          </p>
                          {task.priority && (
                            <span className={`inline-block text-[8.5px] font-extrabold uppercase mt-1 px-1.5 py-0.5 rounded ${
                              task.priority === 'high' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {task.priority}
                            </span>
                          )}

                        {/* Subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3.5 space-y-2 pl-1.5 border-l border-white/[0.06]">
                            {task.subtasks.map(st => (
                              <div key={st.id} className="flex items-center gap-2.5">
                                <button 
                                  onClick={() => handleToggleSubtask(task, st)}
                                  className="text-slate-600 hover:text-sky-400 transition-colors cursor-pointer shrink-0"
                                >
                                  {st.completed ? (
                                    <CheckCircle2 size={13} className="text-sky-400/80" />
                                  ) : (
                                    <Circle size={13} className="text-slate-700 hover:text-slate-600" />
                                  )}
                                </button>
                                <span className={`text-[11.5px] truncate font-medium ${st.completed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Hackathons, Ideas, and Projects */}
          <div className="space-y-6 flex flex-col h-[480px] overflow-y-auto pr-1">
            
            {/* Hackathons Panel */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>Starred / Closest Hackathon</span>
                </h4>
                <button onClick={() => setActiveTab('timeline')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer">
                  Timeline <ChevronRight size={10} />
                </button>
              </div>

              {summaryHackathons.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No active hackathons tracked.</p>
              ) : (
                <div className="space-y-3">
                  {summaryHackathons.map(app => {
                    const days = parseInt(app.days_left, 10);
                    const isOverdue = days < 0;
                    return (
                      <div key={app.id} className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/[0.08] transition-all relative group/hcard">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-[13px] font-bold text-white tracking-tight leading-tight">{app.name}</h5>
                            {app.company && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{app.company}</p>}
                          </div>
                          {app.priority === 'high' && (
                            <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/[0.03] text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-indigo-400" />
                            <span className={isOverdue ? 'text-rose-400' : days <= 3 ? 'text-amber-400' : 'text-slate-400'}>
                              {isOverdue ? 'Deadline Passed' : `${days} ${days === 1 ? 'day' : 'days'} left`}
                            </span>
                          </span>
                          {app.status && (
                            <span className="capitalize">{app.status}</span>
                          )}
                        </div>

                        {app.link && (
                          <a href={app.link} target="_blank" rel="noreferrer" className="absolute top-3.5 right-3.5 opacity-0 group-hover/hcard:opacity-100 p-1 text-slate-500 hover:text-white rounded transition-all">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pinned Ideas Panel */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-amber-400" />
                  <span>Pinned Concepts (Vault)</span>
                </h4>
                <button onClick={() => setActiveTab('ideas')} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer">
                  Ideas <ChevronRight size={10} />
                </button>
              </div>

              {pinnedIdeas.length === 0 ? (
                <p className="text-[11.5px] text-slate-600 italic py-1">Pin important thoughts in the Idea Vault to display them here.</p>
              ) : (
                <div className="divide-y divide-white/[0.03] -my-1">
                  {pinnedIdeas.map(idea => (
                    <div key={idea.id} className="py-2.5 flex items-center justify-between gap-4 group/item">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-200 truncate">{idea.title}</p>
                        {idea.category && <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">#{idea.category}</p>}
                      </div>
                      <ChevronRight size={12} className="text-slate-600 group-hover/item:text-slate-400 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned Projects Panel */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 size={13} className="text-sky-400" />
                  <span>Pinned Project Drafts</span>
                </h4>
                <button onClick={() => setActiveTab('project-ideas')} className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer">
                  Projects <ChevronRight size={10} />
                </button>
              </div>

              {pinnedProjects.length === 0 ? (
                <p className="text-[11.5px] text-slate-600 italic py-1">Pin your active project blueprints to feature them here.</p>
              ) : (
                <div className="divide-y divide-white/[0.03] -my-1">
                  {pinnedProjects.map(proj => (
                    <div key={proj.id} className="py-2.5 flex items-center justify-between gap-4 group/item">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-200 truncate">{proj.title}</p>
                        {proj.category && <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">#{proj.category}</p>}
                      </div>
                      <ChevronRight size={12} className="text-slate-600 group-hover/item:text-slate-400 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
