import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Edit3, X, ChevronDown,
  Check, Sun, Moon, RotateCcw,
  ChevronLeft, ChevronRight as ChevronRightIcon, Repeat2,
  ListChecks, Sparkles, Minus, ArrowDown, EyeOff, Lock
} from 'lucide-react';
import {
  getTasksForDate, addTask, updateTask, deleteTask,
  toggleTaskCompletion, toggleSubtaskCompletion
} from '../services/tasks';

/* ── helpers ───────────────────────────────────────────── */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function todayStr() { return toDateStr(new Date()); }

function formatDisplayDate(dateStr) {
  const today     = todayStr();
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const tomorrow  = toDateStr(new Date(Date.now() + 86400000));
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow)  return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatDayFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_META  = {
  high:   { label: 'High',   color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/25',  dot: 'bg-rose-400',   cardBorder: 'border-rose-500/40'   },
  medium: { label: 'Medium', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25', dot: 'bg-amber-400',  cardBorder: 'border-amber-500/35'  },
  low:    { label: 'Low',    color: 'text-slate-400',  bg: 'bg-white/[0.04]',  border: 'border-white/[0.06]', dot: 'bg-slate-600',  cardBorder: 'border-white/[0.07]'  },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RECUR_OPTS = [
  { value: 'daily',    label: 'Every Day'         },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekends', label: 'Weekends (Sat & Sun)' },
  { value: 'weekly',   label: 'Custom Days'        },
];

/* ── Checkbox ────────────────────────────────────────────── */
function Checkbox({ checked, onChange, size = 'md' }) {
  const sz = size === 'sm' ? 'w-[15px] h-[15px]' : 'w-[18px] h-[18px]';
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`${sz} rounded-[5px] border-2 flex items-center justify-center flex-shrink-0
        transition-all duration-200 cursor-pointer
        ${checked
          ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
          : 'border-slate-700 hover:border-emerald-500/60'
        }`}
    >
      {checked && <Check size={size === 'sm' ? 8 : 10} className="text-white stroke-[3]" />}
    </button>
  );
}

/* ── Task card with linktree thread ─────────────────────── */
function TaskCard({ task, onToggle, onToggleSub, onEdit, onDelete, onCancel }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasSubtasks  = task.subtasks && task.subtasks.length > 0;
  const completedSubs = hasSubtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const allSubsDone  = hasSubtasks && completedSubs === task.subtasks.length;
  const p            = PRIORITY_META[task.priority] || PRIORITY_META.low;
  const showThread   = hasSubtasks && !collapsed;

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 group
      glass-card border ${p.cardBorder} ${task.completed ? 'opacity-55' : ''}`}>

      {/* ── Main task row ── */}
      <div className="flex items-start gap-0 p-4 pb-0">

        {/* Left: checkbox */}
        <div className="mr-3 shrink-0 mt-0.5">
          <Checkbox
            checked={task.completed}
            onChange={() => onToggle(task)}
          />
        </div>

        {/* Right: task title + meta + actions */}
        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className={`block text-[14px] font-semibold leading-snug transition-all ${
                task.completed ? 'line-through text-slate-600' : 'text-white'
              }`}>
                {task.title}
              </span>
              {/* Subtask progress summary */}
              {hasSubtasks && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-20 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allSubsDone ? 'bg-emerald-500' : p.dot.replace('bg-', 'bg-')
                      }`}
                      style={{ width: `${(completedSubs / task.subtasks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium tabular-nums">
                    {completedSubs}/{task.subtasks.length} subtasks
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setCollapsed(c => !c); }}
                    className="text-slate-700 hover:text-slate-400 transition-colors cursor-pointer"
                    title={collapsed ? 'Expand' : 'Collapse'}
                  >
                    <ChevronDown size={11} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Badges + Action buttons — always show badges, actions appear on hover */}
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {/* Priority badge */}
              {task.priority !== 'low' && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                  text-[9px] font-bold border ${p.bg} ${p.border} ${p.color}`}>

                  {p.label}
                </span>
              )}
              {/* Recurring badge */}
              {task.is_recurring && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                  text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Repeat2 size={8} />
                  {task.recurrence === 'daily'    ? 'Daily'    :
                   task.recurrence === 'weekdays' ? 'Weekdays' :
                   task.recurrence === 'weekends' ? 'Weekends' : 'Weekly'}
                </span>
              )}
              {/* Edit / Delete — visible on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); onCancel(task); }}
                  className="p-1.5 text-slate-650 hover:text-amber-400 rounded-lg hover:bg-amber-500/[0.08] transition-all cursor-pointer"
                  title="Cancel for today"
                >
                  <EyeOff size={12} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onEdit(task); }}
                  className="p-1.5 text-slate-600 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/[0.08] transition-all cursor-pointer"
                  title="Edit"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(task); }}
                  className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/[0.08] transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subtask list ── */}
      {showThread && (
        <div className="pb-3 pl-9 pr-4 space-y-1.5">
          {task.subtasks.map(st => (
            <div key={st.id} className="flex items-center gap-2">
              <Checkbox
                checked={st.completed}
                onChange={() => onToggleSub(task, st.id)}
                size="sm"
              />
              <span className={`text-[12.5px] flex-1 leading-snug transition-all ${
                st.completed ? 'line-through text-slate-600' : 'text-slate-300'
              }`}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Priority selector ───────────────────────────────────── */
function PrioritySelector({ value, onChange }) {
  const opts = [
    { value: 'high',   label: 'High',   icon: null,                active: 'bg-rose-500/15 border-rose-500/40 text-rose-300',   base: 'text-slate-500 border-white/[0.07] hover:border-rose-500/25 hover:text-rose-400'   },
    { value: 'medium', label: 'Medium', icon: <Minus size={11} />,    active: 'bg-amber-500/15 border-amber-500/40 text-amber-300', base: 'text-slate-500 border-white/[0.07] hover:border-amber-500/25 hover:text-amber-400' },
    { value: 'low',    label: 'Low',    icon: <ArrowDown size={11} />, active: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300', base: 'text-slate-500 border-white/[0.07] hover:border-indigo-500/25 hover:text-indigo-400' },
  ];
  return (
    <div className="flex gap-2">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
            text-[12px] font-semibold transition-all cursor-pointer border
            ${value === o.value ? o.active : `bg-white/[0.025] ${o.base}`}`}
        >
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Task Form Modal ─────────────────────────────────────── */
function TaskFormModal({ isOpen, onClose, onSave, editingTask, defaultDate, showToast }) {
  const [title,         setTitle]         = useState('');
  const [priority,      setPriority]      = useState('medium');
  const [isRecurring,   setIsRecurring]   = useState(false);
  const [recurrence,    setRecurrence]    = useState('daily');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [taskDate,      setTaskDate]      = useState(defaultDate || todayStr());
  const [subtasks,      setSubtasks]      = useState([]);
  const [stInput,       setStInput]       = useState('');
  const stInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setPriority(editingTask.priority || 'medium');
      setIsRecurring(editingTask.is_recurring);
      setRecurrence(editingTask.recurrence || 'daily');
      setRecurrenceDays(editingTask.recurrence_days || []);
      setTaskDate(editingTask.date || defaultDate || todayStr());
      setSubtasks(editingTask.subtasks?.map(s => ({ id: s.id, title: s.title })) || []);
    } else {
      setTitle(''); setPriority('medium'); setIsRecurring(false);
      setRecurrence('daily'); setRecurrenceDays([]);
      setTaskDate(defaultDate || todayStr()); setSubtasks([]);
    }
    setStInput('');
  }, [isOpen, editingTask, defaultDate]);

  const addSubtask = () => {
    const t = stInput.trim();
    if (!t) return;
    setSubtasks(prev => [...prev, { id: Date.now().toString(), title: t }]);
    setStInput('');
    stInputRef.current?.focus();
  };

  const toggleDay = day =>
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleSave = () => {
    if (!title.trim()) { showToast?.('error', 'Title Required', 'Please enter a task title.'); return; }
    if (!isRecurring && !taskDate) { showToast?.('error', 'Date Required', 'Please select a date.'); return; }
    if (isRecurring && recurrence === 'weekly' && recurrenceDays.length === 0) {
      showToast?.('error', 'Select Days', 'Choose at least one day for weekly recurrence.'); return;
    }
    onSave({ title, priority, is_recurring: isRecurring, recurrence, recurrence_days: recurrenceDays,
             date: isRecurring ? null : taskDate, subtasks: subtasks.filter(s => s.title.trim()) });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="modal-surface w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[92vh]"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-white">{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{editingTask ? 'Update task details' : 'Add to your checklist'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg cursor-pointer"><X size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input autoFocus type="text" placeholder="e.g. Review pull requests"
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl" />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.025] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Repeat2 size={14} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">Recurring Task</p>
                <p className="text-[11px] text-slate-500">Repeats on a schedule</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsRecurring(p => !p)}
              className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${isRecurring ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isRecurring ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Recurring / date options */}
          {isRecurring ? (
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {RECUR_OPTS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setRecurrence(opt.value)}
                    className={`px-3 py-2.5 rounded-xl text-[12px] font-semibold text-left transition-all cursor-pointer border ${
                      recurrence === opt.value
                        ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300'
                        : 'bg-white/[0.025] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.1]'
                    }`}>{opt.label}
                  </button>
                ))}
              </div>
              {recurrence === 'weekly' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">On these days</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_LABELS.map((label, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        className={`w-10 h-10 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                          recurrenceDays.includes(i)
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300'
                        }`}>{label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Date <span className="text-rose-400">*</span>
              </label>
              <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)}
                className="input-premium w-full px-3.5 py-2.5 text-[13px] rounded-xl" />
            </div>
          )}

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subtasks</label>
            <div className="space-y-1.5">
              {subtasks.map((st, i) => (
                <div key={st.id || i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.025]
                  border border-white/[0.06] rounded-xl group/strow">
                  {/* mini thread dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                  <span className="text-[12.5px] text-slate-300 flex-1 min-w-0 truncate">{st.title}</span>
                  <button type="button"
                    onClick={() => setSubtasks(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-slate-700 hover:text-rose-400 rounded-lg hover:bg-rose-500/[0.08] transition-all cursor-pointer shrink-0"
                    title="Delete subtask">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input ref={stInputRef} type="text" placeholder="Add subtask… (press Enter)"
                value={stInput} onChange={e => setStInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="input-premium flex-1 px-3 py-2 text-[12.5px] rounded-xl" />
              <button type="button" onClick={addSubtask}
                className="btn-ghost px-3 py-2 rounded-xl text-[12px] font-semibold cursor-pointer shrink-0">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="btn-ghost flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSave}
            className="btn-primary flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">
            {editingTask ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm modal ────────────────────────────────── */
function DeleteModal({ task, onConfirm, onClose }) {
  if (!task) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-surface w-full max-w-sm rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Trash2 size={16} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white">Delete Task</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">This cannot be undone</p>
          </div>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed">
          Delete <span className="text-white font-semibold">"{task.title}"</span>?
          {task.is_recurring && ' This removes the recurring task and all its history.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="btn-ghost flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Keep It</button>
          <button onClick={onConfirm}
            className="btn-danger flex-1 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Section heading ─────────────────────────────────────── */
function SectionLabel({ label, count, color = 'text-slate-600' }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <p className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${color}`}>{label} · {count}</p>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN VIEW
══════════════════════════════════════════════════════════ */
export default function TasksView({ theme, toggleTheme, showToast, onTasksChange, onLock }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [tasks,        setTasks]        = useState([]);
  const [isFormOpen,   setIsFormOpen]   = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy,         setBusy]         = useState(false);

  const [cancelledMap, setCancelledMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('anonvault_task_cancelled') || localStorage.getItem('anonvault_task_ignored') || '{}');
    } catch {
      return {};
    }
  });

  const handleCancel = useCallback(async task => {
    const updated = { ...cancelledMap };
    if (!updated[task.id]) updated[task.id] = {};
    updated[task.id][selectedDate] = true;
    setCancelledMap(updated);
    localStorage.setItem('anonvault_task_cancelled', JSON.stringify(updated));
    showToast?.('warning', 'Task Cancelled', `"${task.title}" cancelled for today.`);
  }, [cancelledMap, selectedDate, showToast]);

  const handleUncancel = useCallback(async taskId => {
    const updated = { ...cancelledMap };
    if (updated[taskId]) {
      delete updated[taskId][selectedDate];
      if (Object.keys(updated[taskId]).length === 0) {
        delete updated[taskId];
      }
    }
    setCancelledMap(updated);
    localStorage.setItem('anonvault_task_cancelled', JSON.stringify(updated));
    showToast?.('success', 'Task Restored', 'Task is visible again.');
  }, [cancelledMap, selectedDate, showToast]);

  const refresh = useCallback(async () => {
    const fetched = await getTasksForDate(selectedDate);
    setTasks(fetched);
    onTasksChange?.();
  }, [selectedDate, onTasksChange]);


  useEffect(() => { refresh(); }, [refresh]);


  const shiftDate = delta => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  const handleToggle    = useCallback(async task => {
    // Optimistic Update
    const isCompleted = !task.completed;
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return { ...t, completed: isCompleted };
      }
      return t;
    }));

    try {
      await toggleTaskCompletion(task, selectedDate);
      await refresh();
    } catch (err) {
      console.error('Failed to toggle task:', err);
      showToast?.('error', 'Error', 'Failed to update task state. Rolling back.');
      await refresh();
    }
  }, [selectedDate, refresh, showToast]);

  const handleToggleSub = useCallback(async (task, sid) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        const updatedSubs = (t.subtasks || []).map(st => {
          if (st.id === sid) {
            return { ...st, completed: !st.completed };
          }
          return st;
        });
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    }));

    try {
      await toggleSubtaskCompletion(task, sid, selectedDate);
      await refresh();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      showToast?.('error', 'Error', 'Failed to update subtask state. Rolling back.');
      await refresh();
    }
  }, [selectedDate, refresh, showToast]);

  const handleSave = async task => {
    setBusy(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, task);
        showToast?.('success', 'Task Updated', `"${task.title}" has been saved.`);
      } else {
        await addTask(task);
        showToast?.('success', task.is_recurring ? 'Recurring Task Added' : 'Task Added',
          `"${task.title}" added to your checklist.`);
      }
    } catch (err) {
      showToast?.('error', 'Save Failed', 'Could not save task. Check console.');
      console.error(err);
    }
    setIsFormOpen(false); setEditingTask(null);
    await refresh();
    setBusy(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteTask(deleteTarget.id);
      showToast?.('warning', 'Task Deleted', `"${deleteTarget.title}" has been removed.`);
    } catch (err) {
      showToast?.('error', 'Delete Failed', 'Could not remove task. Check console.');
      console.error(err);
    }
    setDeleteTarget(null);
    await refresh();
    setBusy(false);
  };

  // ── sort pending: high → medium → low ──
  const sortByPriority = arr =>
    [...arr].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

  const activeTasks    = tasks.filter(t => !cancelledMap[t.id]?.[selectedDate]);
  const cancelledToday = tasks.filter(t => !!cancelledMap[t.id]?.[selectedDate]);

  const allPending     = sortByPriority(activeTasks.filter(t => !t.completed));
  const completedTasks = activeTasks.filter(t => t.completed);
  const totalCount     = activeTasks.length;
  const doneCount      = completedTasks.length;
  const progress       = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isToday        = selectedDate === todayStr();

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-slate-950">

      {/* Header */}
      <header className="glass-header px-7 py-4 flex items-center justify-between shrink-0">
         <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Daily Checklist</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{formatDayFull(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={onLock} className="btn-ghost p-2.5 rounded-xl cursor-pointer flex items-center justify-center"
            title="Lock workspace">
            <Lock size={14} className="text-slate-400 hover:text-rose-400 transition-colors" />
          </button>
          <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl cursor-pointer">
            <Plus size={14} /> New Task
          </button>
        </div>
      </header>

      {/* Date nav + progress */}
      <div className="px-7 py-3 border-b border-white/[0.04] flex items-center justify-between gap-4 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="btn-ghost p-2 rounded-xl cursor-pointer">
            <ChevronLeft size={14} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className={`text-[14px] font-bold tracking-tight ${isToday ? 'text-indigo-300' : 'text-white'}`}>
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          <button onClick={() => shiftDate(1)} className="btn-ghost p-2 rounded-xl cursor-pointer">
            <ChevronRightIcon size={14} />
          </button>

          {!isToday && (
            <button onClick={() => setSelectedDate(todayStr())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold
                text-indigo-400 border border-indigo-500/25 bg-indigo-500/[0.06]
                hover:bg-indigo-500/[0.12] rounded-xl transition-all cursor-pointer">
              <RotateCcw size={10} /> Today
            </button>
          )}
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }} />
            </div>
            <span className={`text-[11px] font-bold tabular-nums ${progress === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {doneCount}/{totalCount}
            </span>
            {progress === 100 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 animate-pulse">
                <Sparkles size={10} /> All done!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <ListChecks size={24} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No tasks for this day</h3>
            <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
              Add a one-off task or create recurring ones to see them here.
            </p>
            <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
              className="btn-primary mt-5 px-5 py-2 text-[13px] font-semibold rounded-xl cursor-pointer">
              Add First Task
            </button>
          </div>
        ) : (
          <>
            {/* Pending tasks — single unified list */}
            {allPending.length > 0 && (
              <div className="space-y-3">
                <SectionLabel label="To Do" count={allPending.length} />
                {allPending.map(task => (
                  <TaskCard key={task.id} task={task}
                    onToggle={handleToggle} onToggleSub={handleToggleSub}
                    onEdit={t => { setEditingTask(t); setIsFormOpen(true); }}
                    onDelete={setDeleteTarget}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <SectionLabel label="Completed" count={completedTasks.length} />
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task}
                    onToggle={handleToggle} onToggleSub={handleToggleSub}
                    onEdit={t => { setEditingTask(t); setIsFormOpen(true); }}
                    onDelete={setDeleteTarget}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}

            {/* Cancelled Today */}
            {cancelledToday.length > 0 && (
              <div className="space-y-3 opacity-40 hover:opacity-75 transition-opacity">
                <SectionLabel label="Cancelled Today" count={cancelledToday.length} />
                {cancelledToday.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl">
                    <span className="text-[13px] text-slate-500 line-through truncate font-medium">{task.title}</span>
                    <button
                      onClick={() => handleUncancel(task.id)}
                      className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                      title="Restore Task"
                    >
                      <RotateCcw size={10} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fix the high priority edit handler missing setIsFormOpen */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        editingTask={editingTask}
        defaultDate={selectedDate}
        showToast={showToast}
      />
      <DeleteModal
        task={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
