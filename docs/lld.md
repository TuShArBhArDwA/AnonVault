# Low-Level Design (LLD): AnonVault

This document details the low-level component configurations, database schemas, function interfaces, and logic routines of AnonVault.

---

## UI Component Layout & Props

| Component | Props | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **`App.jsx`** | *None (Root)* | State Manager & Data Sync | Houses primary states (`applications`, `ideas`, `tasks`, `projectIdeas`, `quotes`), coordinates LocalStorage fallback reads/writes, and handles fetch actions on unlocking. |
| **`Sidebar.jsx`** | `activeTab`, `setActiveTab`, `stats`, `mobileOpen`, `setMobileOpen` | Navigation & Social Links | Renders brand logo, nav tabs with per-section color accents (sky for Dashboard, indigo for Timeline, amber for Ideas, etc.). Dashboard icon has a glowing sky-blue pin badge. Footer includes X, GitHub, and LinkedIn links with hover tooltips. Supports collapsed/expanded states saved to `localStorage`. |
| **`DashboardView.jsx`** | `tasks`, `applications`, `ideas`, `projectIdeas`, `quotes`, `setActiveTab`, `onMenuToggle` | Workspace Dashboard | The pinned home view. Header shows gradient title on the left and a unified date+time pill on the right (`HH:MM · SS` with current date and weekday). Panels: (1) Daily Quote card with rotating serif quote; (2) Today's Checklist with progress bar; (3) Starred/Closest Hackathon; (4) Pinned Concepts; (5) Pinned Project Drafts. |
| **`TasksView.jsx`** | `tasks`, `onAddTask`, `onUpdateTask`, `onDeleteTask`, `loading`, `onLock`, `onMenuToggle`, `selectedDate`, `setSelectedDate` | Daily Checklist | Manages single and recurring weekday checklist items, priority tags, and dynamic subtask logs. |
| **`TimelineView.jsx`** | `applications`, `onAdd`, `onUpdate`, `onDelete`, `loading`, `onLock`, `onMenuToggle` | Hackathon Timeline | Displays applications sorted by deadline. Includes filters, sort toggles, search, and create/edit form modals. |
| **`IdeaVaultView.jsx`** | `ideas`, `onAdd`, `onUpdate`, `onDelete`, `loading`, `theme`, `onLock`, `onMenuToggle` | Concept Vault | Renders ideas in a masonry grid with Supabase image uploader (max 1.5MB). |
| **`ProjectIdeasView.jsx`** | `ideas`, `onAdd`, `onUpdate`, `onDelete`, `onReorder`, `loading`, `theme`, `showToast`, `onMenuToggle` | Project Sandbox | Drag-to-reorder concept cards with tag autocomplete, links, and image attachments. |
| **`QuotesView.jsx`** | `quotes`, `onAdd`, `onUpdate`, `onDelete`, `loading`, `onMenuToggle` | Quotes Vault | CRUD for personal quote library. Quotes are consumed by the Dashboard for daily rotation. |

---

## Dashboard Component: Key Logic

### Daily Quote Selection (`getDailyQuote`)
```js
const getDailyQuote = () => {
  if (!quotes || quotes.length === 0) return null;
  const d = new Date();
  const dayHash = d.getFullYear() * 1000 + (d.getMonth() + 1) * 32 + d.getDate();
  return quotes[dayHash % quotes.length];
};
```
- Deterministic: same quote all day, different each day.
- Automatically cycles across the full quote library — no repetition until all quotes are shown.

### Header Time Widget
- Displays `HH:MM` (24-hour, bold white) and `SS` (same size, 20% opacity) separated by a thin divider.
- Also shows `Month DD, YYYY` date and full weekday name in a two-line block on the left of the divider.
- All rendered from `currentTime` state, updated via `setInterval` every second.

### Checklist Progress Bar
- Turns sky-blue while tasks remain; switches to emerald green at 100% completion.
- Width animates over 700ms ease-out on each state change.

---

## Database Tables Schema

### 1. `applications` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to Supabase user. |
| **`name`** | `text` | `NOT NULL` | — | Event/company name. |
| **`link`** | `text` | Optional | — | Hyperlink to listing. |
| **`deadline`** | `timestampz` | `NOT NULL` | — | Milestone date. |
| **`priority`** | `text` | `low`\|`medium`\|`high` | `'medium'` | Urgency grouping. |
| **`status`** | `text` | `pending`\|`applied`\|... | `'pending'` | Stage in process. |
| **`notes`** | `text` | Optional | — | Prep notes. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation timestamp. |

### 2. `ideas` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique card identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to creator. |
| **`title`** | `text` | `NOT NULL` | — | Card header. |
| **`content`** | `text` | Optional | — | Body text / bullet points. |
| **`image_url`** | `text` | Optional | — | Primary preview image URL. |
| **`images`** | `jsonb` | JSON List | `'[]'::jsonb` | Multiple images with captions. |
| **`links`** | `jsonb` | JSON List | `'[]'::jsonb` | Hyperlink attachments. |
| **`tags`** | `text[]` | Array | `'{}'` | Category tags. |
| **`pinned`** | `boolean` | `NOT NULL` | `false` | Shown on dashboard when pinned. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation timestamp. |

### 3. `tasks` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique task identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to task creator. |
| **`title`** | `text` | `NOT NULL` | — | Task header. |
| **`priority`** | `text` | `low`\|`medium`\|`high` | `'medium'` | Priority grouping. |
| **`is_recurring`** | `boolean` | `NOT NULL` | `false` | Recurrence flag. |
| **`recurrence`** | `text` | `daily`\|`weekdays`\|... | `'daily'` | Frequency type. |
| **`recurrence_days`** | `text[]` | Array | `'{}'` | Weekday index array. |
| **`date`** | `text` | Optional | — | Single date (YYYY-MM-DD). |
| **`subtasks`** | `jsonb` | JSON List | `'[]'::jsonb` | Child subtask objects. |
| **`completed`** | `boolean` | `NOT NULL` | `false` | Completion flag. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation timestamp. |

### 4. `task_completions` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique completion entry. |
| **`task_id`** | `uuid` | Foreign Key | — | References `tasks.id`. |
| **`date`** | `text` | `NOT NULL` | — | Execution date (YYYY-MM-DD). |
| **`completed`** | `boolean` | `NOT NULL` | `true` | Completion status. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Log timestamp. |

### 5. `project_ideas` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique concept identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to creator. |
| **`title`** | `text` | `NOT NULL` | — | Concept header. |
| **`content`** | `text` | Optional | — | Tech spec / description. |
| **`images`** | `jsonb` | JSON List | `'[]'::jsonb` | Multiple images with captions. |
| **`links`** | `jsonb` | JSON List | `'[]'::jsonb` | Reference URLs. |
| **`tags`** | `text[]` | Array | `'{}'` | Category tags. |
| **`pinned`** | `boolean` | `NOT NULL` | `false` | Shown on dashboard when pinned. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation timestamp. |

### 6. `quotes` Table
| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique quote identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to creator. |
| **`text`** | `text` | `NOT NULL` | — | Quote body. |
| **`author`** | `text` | Optional | — | Attribution. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation timestamp. |

---

## API Services & Operations (`src/services/supabase.js`)

- **Applications**: `fetchApplications()`, `addApplication(app)`, `updateApplication(id, updates)`, `deleteApplication(id)`
- **Ideas**: `fetchIdeas()`, `addIdea(idea)`, `updateIdea(id, updates)`, `deleteIdea(id)`
- **Tasks**: `fetchTasks()`, `addTaskToSupabase(task)`, `updateTaskInSupabase(id, updates)`, `deleteTaskFromSupabase(id)`
- **Task Completions**: `fetchTaskCompletions()`, `upsertTaskCompletion(taskId, dateStr, completed)`
- **Project Ideas**: `fetchProjectIdeas()`, `addProjectIdea(idea)`, `updateProjectIdea(id, updates)`, `deleteProjectIdea(id)`
- **Quotes**: `fetchQuotes()`, `addQuote(quote)`, `updateQuote(id, updates)`, `deleteQuote(id)`
- **Storage**: `uploadIdeaImage(filePath, file)`, `deleteIdeaImage(filePath)`

---

## Logic Routine: Passcode Keypad Interceptor

```
[Keydown / Click Event]
         |
         v
  Is it numeric (0-9)?
         |
         +---> YES: Pin length < 4?
         |             |
         |             +---> YES: Append digit. Length === 4?
         |             |             |
         |             |             +---> YES: Matches VITE_APP_PIN?
         |             |             |            |
         |             |             |            +--> YES: onAuthorize() + SessionStorage.
         |             |             |            +--> NO:  Shake animation + clear pin.
         |             |             +---> NO:  Wait for next keypress.
         |             +---> NO:  Ignore key.
         |
         +---> BACKSPACE: Remove last digit.
         |
         +---> ESCAPE: Clear pin completely.
```
