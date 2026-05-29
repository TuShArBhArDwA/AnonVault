-- ============================================================
-- AnonVault: Tasks & Task Completions tables
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Tasks table
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  priority        text not null default 'medium' check (priority in ('high','medium','low')),
  is_recurring    boolean not null default false,
  recurrence      text default 'daily' check (recurrence in ('daily','weekdays','weekends','weekly')),
  recurrence_days integer[] default '{}',
  date            date,           -- null for recurring tasks
  subtasks        jsonb default '[]',
  completed       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Index for date lookups
create index if not exists idx_tasks_date on tasks(date);

-- Enable RLS (optional — remove if you don't use auth)
alter table tasks enable row level security;

-- Allow all operations without auth (public access — adjust as needed)
create policy "Allow all on tasks" on tasks
  for all using (true) with check (true);


-- 2. Task Completions table (for recurring tasks, one row per task×date)
create table if not exists task_completions (
  id        uuid primary key default gen_random_uuid(),
  task_id   uuid not null references tasks(id) on delete cascade,
  date      date not null,
  completed boolean not null default true,
  unique (task_id, date)
);

-- Enable RLS
alter table task_completions enable row level security;

create policy "Allow all on task_completions" on task_completions
  for all using (true) with check (true);
