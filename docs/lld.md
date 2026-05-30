# Low-Level Design (LLD): AnonVault

This document details the low-level component configurations, database schemas, function interfaces, and logic routines of AnonVault.

---

## UI Component Layout & Props

The application is structured into modular React components. Below is the specification of properties passed between files:

| Component | Props | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **`App.jsx`** | *None (Root)* | State Manager & Data Sync | Houses the primary states (`applications`, `ideas`, `tasks`, `projectIdeas`), coordinates fallback LocalStorage reads/writes, and handles fetch actions on unlocking. |
| **`Sidebar.jsx`** | `activeTab`, `setActiveTab`, `stats`, `mobileOpen`, `setMobileOpen` | Navigation & Stats | Renders the Private Space brand logo, navigation tabs with dynamic color accents (indigo for Project Ideas), and an Overview panel with a dynamic green state checklist card. |
| **`TasksView.jsx`** | `tasks`, `onAddTask`, `onUpdateTask`, `onDeleteTask`, `loading`, `onLock`, `onMenuToggle`, `selectedDate`, `setSelectedDate` | Daily Checklist | Manages single and recurring weekday checklist items, priority tags, and dynamic subtasks logs. |
| **`TimelineView.jsx`** | `applications`, `onAdd`, `onUpdate`, `onDelete`, `loading`, `onLock`, `onMenuToggle` | Hackathon Timeline | Displays applications sorted by deadline. Includes filters, sort toggles, search bars, and the create/edit form modals. |
| **`IdeaVaultView.jsx`** | `ideas`, `onAdd`, `onUpdate`, `onDelete`, `loading`, `theme`, `onLock`, `onMenuToggle` | Category Vault | Renders ideas in a masonry grid. Integrates with the Supabase file uploader to save image attachments under 1.5MB. |
| **`ProjectIdeasView.jsx`** | `ideas`, `onAdd`, `onUpdate`, `onDelete`, `onReorder`, `loading`, `theme`, `onLock`, `showToast`, `onMenuToggle` | Project Sandbox | Renders manual drag-and-drop sortable concept cards. Shares tag autocompletes, backspace removals, and form layouts with standard Idea Vault. |

---

## Database Tables Schema

AnonVault maps directly to the following relational PostgreSQL schemas in Supabase:

### 1. `applications` Table
Stores chronological deadlined applications.

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique task identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to Supabase authenticated user. |
| **`name`** | `text` | `NOT NULL` | *None* | Company or Project name. |
| **`link`** | `text` | Optional | *None* | Hyperlink to listing. |
| **`deadline`** | `timestampz` | `NOT NULL` | *None* | Milestone target date. |
| **`priority`** | `text` | Check (`low`, `medium`, `high`) | `'medium'` | Urgency grouping parameter. |
| **`status`** | `text` | Check (`pending`, `applied`, ... ) | `'pending'` | Stage in application process. |
| **`notes`** | `text` | Optional | *None* | Text description prep notes. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Log creation timestamp. |

### 2. `ideas` Table
Stores masonry card text captures and files.

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique card identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to creator user. |
| **`title`** | `text` | `NOT NULL` | *None* | Creative header text. |
| **`content`** | `text` | Optional | *None* | Bullet points, details, write-ups. |
| **`image_url`** | `text` | Optional | *None* | Storage URL or external preview image. |
| **`images`** | `jsonb` | JSON List | `'[]'::jsonb` | Multiple images with custom text captions. |
| **`links`** | `jsonb` | JSON List | `'[]'::jsonb` | Hyperlink attachments with custom labels. |
| **`tags`** | `text[]` | Array | `'{ }'` | Categories array for indexing. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Time log captured. |

### 3. `tasks` Table
Stores checklist tasks parameters.

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique task identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to task creator. |
| **`title`** | `text` | `NOT NULL` | *None* | Actionable task header. |
| **`priority`** | `text` | Check (`low`, `medium`, `high`) | `'medium'` | Checklist priority grouping. |
| **`is_recurring`** | `boolean` | `NOT NULL` | `false` | Recurrent frequency indicator. |
| **`recurrence`** | `text` | Check (`daily`, `weekdays`, ... ) | `'daily'` | Recurrent frequency type. |
| **`recurrence_days`** | `text[]` | Array | `'{ }'` | Selected weekday index array. |
| **`date`** | `text` | Optional | *None* | Single execution date string (YYYY-MM-DD). |
| **`subtasks`** | `jsonb` | JSON List | `'[]'::jsonb` | Child checklist subtask objects. |
| **`completed`** | `boolean` | `NOT NULL` | `false` | Completion status flag. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Task creation timestamp. |

### 4. `task_completions` Table
Saves logging events for recurrent checklist tasks.

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique completion entry id. |
| **`task_id`** | `uuid` | Foreign Key | *None* | Binds to reference checklist task. |
| **`date`** | `text` | `NOT NULL` | *None* | Logged execution date string (YYYY-MM-DD). |
| **`completed`** | `boolean` | `NOT NULL` | `true` | Log execution status. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Completion log time. |

### 5. `project_ideas` Table
Stores sandbox project concept cards.

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique concept identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to concept creator. |
| **`title`** | `text` | `NOT NULL` | *None* | Concept header text. |
| **`content`** | `text` | Optional | *None* | Technical specifications, description. |
| **`images`** | `jsonb` | JSON List | `'[]'::jsonb` | Multiple images with captions. |
| **`links`** | `jsonb` | JSON List | `'[]'::jsonb` | Reference URLs with custom labels. |
| **`tags`** | `text[]` | Array | `'{ }'` | Category tags array. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Creation log timestamp. |

---

## API Services & Operations (`src/services/supabase.js`)

Our service layer maps direct asynchronous operations to Supabase endpoints, managing client credentials dynamically:

* **Applications Operations**:
  * `fetchApplications()`: `.from('applications').select('*').order('deadline')`
  * `addApplication(app)`: `.from('applications').insert([payload])`
  * `updateApplication(id, updates)`: `.from('applications').update(updates).eq('id', id)`
  * `deleteApplication(id)`: `.from('applications').delete().eq('id', id)`
* **Ideas Operations**:
  * `fetchIdeas()`, `addIdea(idea)`, `updateIdea(id, updates)`, `deleteIdea(id)`
* **Checklist Operations**:
  * `fetchTasks()`, `addTaskToSupabase(task)`, `updateTaskInSupabase(id, updates)`, `deleteTaskFromSupabase(id)`
  * `fetchTaskCompletions()`, `upsertTaskCompletion(taskId, dateStr, completed)`
* **Project Concept Operations**:
  * `fetchProjectIdeas()`, `addProjectIdea(idea)`, `updateProjectIdea(id, updates)`, `deleteProjectIdea(id)`
* **Storage Actions**:
  * `uploadIdeaImage(filePath, file)`: uploads to public storage bucket `idea-images`.
  * `deleteIdeaImage(filePath)`: cleans obsolete images.

---

## Logic Routine: Passcode Keypad Interceptor

The flow below details the character input logic inside the `LockScreen` component:

```
[Keydown / Click Event]
         |
         v
  Is it numeric (0-9)? 
         |
         +---> YES: Pin length < 4?
         |             |
         |             +---> YES: Append to pin state.
         |             |          Is new pin length === 4?
         |             |             |
         |             |             +---> YES: Matches env PIN?
         |             |             |            |
         |             |             |            +---> YES: Trigger onAuthorize(), save to SessionStorage.
         |             |             |            +---> NO:  Trigger shake animation, flash error, clear pin.
         |             |             +---> NO:  Wait for next keypress.
         |             +---> NO:  Ignore key.
         |
         +---> BACKSPACE: Remove last digit from pin state.
         |
         +---> ESCAPE: Clear pin state completely.
```
