<p align="center">
  <img src="public/favicon.svg" alt="AnonVault Logo" width="100" height="100" />
</p>

<h1 align="center">AnonVault</h1>

<p align="center">
  <strong>A Premium Private Workspace & Personal Productivity Dashboard</strong>
</p>

<p align="center">
  <a href="README.hi.md">हिन्दी (Hindi)</a>
</p>

---

## Overview

AnonVault is a highly secure, privacy-first personal workspace engineered to centralize hackathon event tracking, manage daily milestone checklists, brainstorm comprehensive project ideas, and store creative thoughts — all behind a 4-digit PIN lock screen.

The workspace features a **glassmorphic dark UI** with per-section color-coded accents, animated rotating glow borders, a live clock widget, and a daily quote system.

---

## Core Modules

| Module | Description |
| :--- | :--- |
| **Workspace Dashboard** | The pinned home view — shows today's rotating daily quote, a live task checklist snapshot, your starred/closest hackathon, pinned concepts, and pinned project drafts. Includes a live `HH:MM:SS` clock with the current date. |
| **Daily Checklist** | A high-fidelity task and subtask manager handling recurring daily, weekly, or weekday routines, synced with Supabase. |
| **Hackathon Timeline** | Track registration deadlines, onsite/remote status, PPI perks, travel reimbursements, and reference links in a calendar view. |
| **Idea Vault** | Secure visual concept boards with tags, hyperlinks, and image reference uploads. |
| **Project Ideas** | Sandbox brainstorm cards with manual drag-to-reorder, tags, links, and image attachments. |
| **Quotes Vault** | Add and manage a personal library of quotes — one rotates daily on the dashboard using a deterministic date-hash algorithm. |

---

## Dashboard UI Highlights

- **Header**: Gradient title on the left. Right side shows a unified pill with date (`Jun 11, 2026`), weekday, a divider, and a live `HH:MM · SS` clock — all same size and weight.
- **Quote Card**: Serif font (`Georgia`) quote with a large decorative `"` watermark. Changes every day automatically.
- **Checklist Widget**: Progress bar turns green at 100%. Scrollable task list with sky-blue accent.
- **Right Panel**: Hackathons (indigo), Pinned Concepts (amber), Pinned Projects (sky) — each with their own colored border and glow.
- **Sidebar**: Dashboard nav item has a glowing sky-blue **pin badge** to mark it as the primary view. Footer includes X, GitHub, and LinkedIn links with hover tooltips.

---

## Getting Started

### 1. Database & Storage Configuration
This application is powered by Supabase. Create a free Supabase project and execute the following:
1. Open the **SQL Editor** in your Supabase dashboard and run the schema found in [supabase/schema.sql](supabase/schema.sql) (or [scripts/supabase_setup.sql](scripts/supabase_setup.sql)).
2. Go to the **Storage** panel, create a new public bucket named exactly `idea-images`.

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_api_key
VITE_APP_PIN=your_four_digit_pin_here
```

### 3. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Design Documentation & Links

| Document | Description | Link |
| :--- | :--- | :--- |
| High-Level Design (HLD) | System architecture, navigation panels, and data flow. | [View HLD](docs/hld.md) |
| Low-Level Design (LLD) | Database schemas, component props, API calls, and logic routines. | [View LLD](docs/lld.md) |
| Project License | MIT License terms of use. | [View License](LICENSE) |
