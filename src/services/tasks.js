/* ─────────────────────────────────────────────────────────
   tasks.js  –  Supabase-first task service (localStorage fallback)

   Task shape (Supabase 'tasks' table):
   {
     id:              uuid (auto)
     title:           string
     is_recurring:    boolean
     recurrence:      'daily' | 'weekdays' | 'weekends' | 'weekly'
     recurrence_days: number[]   // 0=Sun…6=Sat
     date:            'YYYY-MM-DD' | null   // null for recurring
     subtasks:        [{ id, title, completed }]   // jsonb column
     completed:       boolean   // for one-off tasks
     created_at:      auto
   }

   Completions shape (Supabase 'task_completions' table):
   { id, task_id, date 'YYYY-MM-DD', completed boolean }

   localStorage keys (fallback / cache):
     anonvault_tasks
     anonvault_task_completions   → { '<taskId>': { '<date>': true } }
     anonvault_subtask_completions
───────────────────────────────────────────────────────── */

import {
  getSupabaseClient,
  fetchTasks as sbFetchTasks,
  addTaskToSupabase,
  updateTaskInSupabase,
  deleteTaskFromSupabase,
  fetchTaskCompletions,
  upsertTaskCompletion,
  fetchSubtaskCompletions,
  upsertSubtaskCompletion,
} from './supabase';

const TASKS_KEY    = 'anonvault_tasks';
const COMPLETE_KEY = 'anonvault_task_completions';
const SUBTASK_KEY  = 'anonvault_subtask_completions';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── localStorage helpers ────────────────────────────────────
function loadLS(key, def) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
}
function saveLS(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function loadLocalTasks()       { return loadLS(TASKS_KEY, []); }
function saveLocalTasks(t)      { saveLS(TASKS_KEY, t); }
function loadCompletions()      { return loadLS(COMPLETE_KEY, {}); }
function saveCompletions(c)     { saveLS(COMPLETE_KEY, c); }
function loadSubCompletions()   { return loadLS(SUBTASK_KEY, {}); }
function saveSubCompletions(c)  { saveLS(SUBTASK_KEY, c); }

const useSupabase = () => !!getSupabaseClient();

// ── recurrence check ────────────────────────────────────────
function taskAppliesOnDate(task, dateStr) {
  if (!task.is_recurring) return task.date === dateStr;
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  switch (task.recurrence) {
    case 'daily':    return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekends': return dow === 0 || dow === 6;
    case 'weekly':   return (task.recurrence_days || []).includes(dow);
    default:         return false;
  }
}

// ── enrich tasks with completion state (local completions map) ──
function enrichTasks(rawTasks, completions, subComp, dateStr) {
  return rawTasks
    .filter(t => taskAppliesOnDate(t, dateStr))
    .map(t => {
      const completed = t.is_recurring
        ? !!(completions[t.id]?.[dateStr])
        : !!t.completed;

      const subtasks = (t.subtasks || []).map(st => {
        const key = `${t.id}__${st.id}`;
        const stCompleted = t.is_recurring
          ? !!(subComp[key]?.[dateStr])
          : !!st.completed;
        return { ...st, completed: stCompleted };
      });

      return { ...t, completed, subtasks };
    });
}

// ── convert Supabase completions rows → local map format ────
function rowsToCompletionsMap(rows) {
  const map = {};
  for (const r of rows) {
    if (!map[r.task_id]) map[r.task_id] = {};
    map[r.task_id][r.date] = r.completed;
  }
  return map;
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC API (all async)
// ══════════════════════════════════════════════════════════════

/** Load all tasks + build completions cache from Supabase (or localStorage) */
export async function loadAllTasks() {
  if (useSupabase()) {
    try {
      let fetchedSubCompSuccessfully = false;
      const [tasks, compRows, subCompRows] = await Promise.all([
        sbFetchTasks(),
        fetchTaskCompletions(),
        fetchSubtaskCompletions()
          .then(rows => {
            fetchedSubCompSuccessfully = true;
            return rows;
          })
          .catch(err => {
            console.warn('[tasks] subtask_completions table may not exist yet, falling back to localStorage for recurring subtasks:', err);
            return [];
          })
      ]);
      // sync to localStorage as cache
      saveLocalTasks(tasks);
      const compMap = rowsToCompletionsMap(compRows);
      saveCompletions(compMap);

      if (fetchedSubCompSuccessfully) {
        const subCompMap = {};
        for (const r of subCompRows) {
          const key = `${r.task_id}__${r.subtask_id}`;
          if (!subCompMap[key]) subCompMap[key] = {};
          subCompMap[key][r.date] = r.completed;
        }
        saveSubCompletions(subCompMap);
      }

      return { tasks, completions: compMap };
    } catch (err) {
      console.warn('[tasks] Supabase fetch failed, falling back to localStorage:', err);
    }
  }
  // localStorage fallback
  return { tasks: loadLocalTasks(), completions: loadCompletions() };
}

/** Get all tasks visible on a given date, enriched with completion state */
export async function getTasksForDate(dateStr) {
  const { tasks, completions } = await loadAllTasks();
  const subComp = loadSubCompletions();
  return enrichTasks(tasks, completions, subComp, dateStr);
}

/** Sync version used by computePendingTasks in App.jsx (stays local) */
export function getTasksForDateSync(dateStr) {
  const tasks = loadLocalTasks();
  const completions = loadCompletions();
  const subComp = loadSubCompletions();
  return enrichTasks(tasks, completions, subComp, dateStr);
}

/** Add a new task */
export async function addTask(task) {
  const newTask = {
    title: task.title.trim(),
    is_recurring: !!task.is_recurring,
    recurrence: task.recurrence || 'daily',
    recurrence_days: task.recurrence_days || [],
    date: task.is_recurring ? null : (task.date || null),
    subtasks: (task.subtasks || [])
      .map(st => ({ id: uid(), title: st.title.trim(), completed: false }))
      .filter(st => st.title),
    completed: false,
    priority: task.priority || 'medium',
  };

  if (useSupabase()) {
    try {
      const saved = await addTaskToSupabase(newTask);
      // update local cache
      const local = loadLocalTasks();
      local.push(saved);
      saveLocalTasks(local);
      return saved;
    } catch (err) {
      console.warn('[tasks] Supabase addTask failed, saving locally:', err);
    }
  }

  // localStorage fallback
  newTask.id = uid();
  newTask.created_at = new Date().toISOString();
  const tasks = loadLocalTasks();
  tasks.push(newTask);
  saveLocalTasks(tasks);
  return newTask;
}

/** Edit a task's definition (not completion state) */
export async function updateTask(id, updates) {
  const merged = {
    title: updates.title?.trim(),
    is_recurring: updates.is_recurring,
    recurrence: updates.recurrence,
    recurrence_days: updates.recurrence_days,
    date: updates.date,
    subtasks: (updates.subtasks || [])
      .map(st => ({ id: st.id || uid(), title: st.title.trim(), completed: st.completed || false }))
      .filter(st => st.title),
    priority: updates.priority,
  };

  if (useSupabase()) {
    try {
      const saved = await updateTaskInSupabase(id, merged);
      // update local cache
      const tasks = loadLocalTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks[idx] = { ...tasks[idx], ...saved };
      saveLocalTasks(tasks);
      return saved;
    } catch (err) {
      console.warn('[tasks] Supabase updateTask failed, updating locally:', err);
    }
  }

  // localStorage fallback
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...merged };
  saveLocalTasks(tasks);
  return tasks[idx];
}

/** Delete a task entirely */
export async function deleteTask(id) {
  if (useSupabase()) {
    try {
      await deleteTaskFromSupabase(id);
    } catch (err) {
      console.warn('[tasks] Supabase deleteTask failed, removing locally:', err);
    }
  }

  // always clean up local cache
  const tasks = loadLocalTasks().filter(t => t.id !== id);
  saveLocalTasks(tasks);
  const c = loadCompletions();
  delete c[id];
  saveCompletions(c);
  const sc = loadSubCompletions();
  Object.keys(sc).forEach(k => { if (k.startsWith(id + '__')) delete sc[k]; });
  saveSubCompletions(sc);
}

/** Toggle task completion for a given date */
export async function toggleTaskCompletion(task, dateStr) {
  if (task.is_recurring) {
    const c = loadCompletions();
    if (!c[task.id]) c[task.id] = {};
    const next = !c[task.id][dateStr];
    c[task.id][dateStr] = next;
    saveCompletions(c);

    // If unchecking parent, uncheck all subtasks for this date
    if (!next) {
      const sc = loadSubCompletions();
      (task.subtasks || []).forEach(st => {
        const stKey = `${task.id}__${st.id}`;
        if (sc[stKey]) delete sc[stKey][dateStr];
      });
      saveSubCompletions(sc);

      if (useSupabase()) {
        try {
          const client = getSupabaseClient();
          if (client) {
            await client
              .from('subtask_completions')
              .delete()
              .eq('task_id', task.id)
              .eq('date', dateStr);
          }
        } catch (err) {
          console.warn('[tasks] Supabase bulk subtask uncompletion failed:', err);
        }
      }
    }

    if (useSupabase()) {
      try {
        await upsertTaskCompletion(task.id, dateStr, next);
      } catch (err) {
        console.warn('[tasks] Supabase upsertCompletion failed:', err);
      }
    }
    return next;
  } else {
    // one-off task: update completed field on the task itself
    const tasks = loadLocalTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      const next = !tasks[idx].completed;
      tasks[idx].completed = next;

      // If unchecking parent, uncheck all subtasks
      if (!next) {
        tasks[idx].subtasks = (tasks[idx].subtasks || []).map(st => ({
          ...st,
          completed: false
        }));
      }

      saveLocalTasks(tasks);

      if (useSupabase()) {
        try {
          await updateTaskInSupabase(task.id, tasks[idx]);
        } catch (err) {
          console.warn('[tasks] Supabase toggleCompletion failed:', err);
        }
      }
      return next;
    }
    return false;
  }
}

/** Toggle subtask completion for a given date */
export async function toggleSubtaskCompletion(task, subtaskId, dateStr) {
  const key = `${task.id}__${subtaskId}`;

  if (task.is_recurring) {
    const sc = loadSubCompletions();
    if (!sc[key]) sc[key] = {};
    const next = !sc[key][dateStr];
    sc[key][dateStr] = next;
    saveSubCompletions(sc);

    if (useSupabase()) {
      try {
        await upsertSubtaskCompletion(task.id, subtaskId, dateStr, next);
      } catch (err) {
        console.warn('[tasks] Supabase upsertSubtaskCompletion failed:', err);
      }
    }

    // Auto-check parent task if all subtasks are complete
    const allCompleted = task.subtasks.every(st => {
      const stKey = `${task.id}__${st.id}`;
      const isCompleted = st.id === subtaskId ? next : !!(sc[stKey]?.[dateStr]);
      return isCompleted;
    });

    if (allCompleted) {
      const c = loadCompletions();
      if (!c[task.id]) c[task.id] = {};
      if (!c[task.id][dateStr]) {
        c[task.id][dateStr] = true;
        saveCompletions(c);
        if (useSupabase()) {
          try {
            await upsertTaskCompletion(task.id, dateStr, true);
          } catch (err) {
            console.warn('[tasks] Supabase auto-completion failed:', err);
          }
        }
      }
    } else {
      const c = loadCompletions();
      if (c[task.id] && c[task.id][dateStr]) {
        delete c[task.id][dateStr];
        saveCompletions(c);
        if (useSupabase()) {
          try {
            await upsertTaskCompletion(task.id, dateStr, false);
          } catch (err) {
            console.warn('[tasks] Supabase auto-uncompletion failed:', err);
          }
        }
      }
    }

    return next;
  } else {
    const tasks = loadLocalTasks();
    const tIdx = tasks.findIndex(t => t.id === task.id);
    if (tIdx !== -1) {
      const stIdx = tasks[tIdx].subtasks.findIndex(s => s.id === subtaskId);
      if (stIdx !== -1) {
        const next = !tasks[tIdx].subtasks[stIdx].completed;
        tasks[tIdx].subtasks[stIdx].completed = next;

        // Auto-check parent task if all subtasks are complete
        const allCompleted = tasks[tIdx].subtasks.every(st => st.completed);
        tasks[tIdx].completed = allCompleted;

        saveLocalTasks(tasks);

        if (useSupabase()) {
          try {
            await updateTaskInSupabase(task.id, tasks[tIdx]);
          } catch (err) {
            console.warn('[tasks] Supabase subtask toggle failed:', err);
          }
        }
        return next;
      }
    }
    return false;
  }
}
