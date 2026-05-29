# Low-Level Design (LLD): AnonVault

This document details the low-level component configurations, database schemas, function interfaces, and logic routines of **AnonVault**.

---

## 🛠️ UI Component Layout & Props

The application is structured into modular React components. Below is the specification of properties passed between files:

| Component | Props | Purpose | Description |
| :--- | :--- | :--- | :--- |
| **`App.jsx`** | *None (Root)* | State Manager | Houses the primary states (`applications`, `ideas`, `loading`, `isAuthorized`), performs initial fetching, and coordinates handlers. |
| **`LockScreen.jsx`** | `onAuthorize` | Security Layer | Displays the passcode keypad, intercepts keyboard entry, compares inputs against the env PIN, and runs `onAuthorize` upon success. |
| **`Sidebar.jsx`** | `activeTab`, `setActiveTab`, `stats` | Navigation | Renders the brand logo, aggregates statistics (high priority alerts, logged items), and lets users switch workspace views. |
| **`TimelineView.jsx`** | `applications`, `onAdd`, `onUpdate`, `onDelete`, `loading` | Application Timeline | Displays applications sorted by deadline. Includes filters, sort toggles, search bars, and the create/edit form drawers. |
| **`IdeaVaultView.jsx`** | `ideas`, `onAdd`, `onUpdate`, `onDelete`, `loading` | Category Vault | Renders ideas in a masonry grid. Integrates with the Supabase file uploader to save image attachments. |

---

## 🗄️ Database Tables Schema

AnonVault maps directly to the following relational PostgreSQL schemas in Supabase:

### 1. `applications` Table

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

| Field | SQL Type | Constraint | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | Primary Key | `gen_random_uuid()` | Unique card identity. |
| **`user_id`** | `uuid` | Foreign Key | `auth.uid()` | Binds to creator user. |
| **`title`** | `text` | `NOT NULL` | *None* | Creative header text. |
| **`content`** | `text` | Optional | *None* | Bullet points, details, write-ups. |
| **`image_url`** | `text` | Optional | *None* | Storage URL or external preview image. |
| **`tags`** | `text[]` | Array | `'{ }'` | Categories array for indexing. |
| **`created_at`** | `timestampz` | `NOT NULL` | `now()` | Time log captured. |

---

## 📡 API Services & Operations (`src/services/supabase.js`)

Our service layer maps direct asynchronous operations to Supabase endpoints:

* **`fetchApplications()`** / **`fetchIdeas()`**
  ```
  Endpoint: .from('table').select('*')
  Success: Returns Array (falling back to [] if dataset is null)
  Failure: Throws exception to error banner handler
  ```
* **`addApplication(item)`** / **`addIdea(item)`**
  ```
  Endpoint: .from('table').insert([payload])
  Returns: The newly created object confirm record
  ```
* **`uploadIdeaImage(file)`**
  ```
  Path: bucket('idea-images').upload(unique_filepath, file)
  Public URL: bucket('idea-images').getPublicUrl(unique_filepath)
  Returns: Public HTTPS web link to preview on masonry card
  ```

---

## ⚙️ Logic Routine: Passcode Keypad Interceptor

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
