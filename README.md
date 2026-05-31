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

## English Specification

AnonVault is a highly secure, privacy-first personal workspace engineered to centralize hackathon event tracking, manage daily milestone checklists, brainstorm comprehensive project ideas, and store creative thoughts in an encrypted, aesthetic environment.

### Core Modules
- **Daily Checklist**: A high-fidelity task and subtask manager that handles recurring daily, weekly, or weekday routines, synced directly with Supabase.
- **Hackathon Timeline**: Track critical registration milestones, onsite/remote statuses, PPI (Placement Interview) perks, travel reimbursements, and multiple reference links in a linear or month-grouped calendar view.
- **Idea Vault & Project Brainstorming**: Secure visual concept boards with tags, hyperlinks, and simulated image reference uploads.
- **Passcode Protection**: The workspace is locked behind an optimized 4-digit PIN screen to protect your metrics.

---

### Getting Started

#### 1. Database & Storage Configuration
This application is powered by Supabase. Create a free Supabase project and execute the following:
1. Open the **SQL Editor** in your Supabase dashboard and run the database creation query found in `supabase/schema.sql` (or `scripts/supabase_setup.sql`).
2. Go to the **Storage** panel, create a new public bucket, and name it exactly `idea-images` to enable uploading visual design attachments.

#### 2. Environment Configuration
Create a `.env` file in the root of the project and populate it with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_api_key
VITE_APP_PIN=your_four_digit_pin_here
```

#### 3. Launching Locally
Navigate to the project folder in your terminal and run:
```bash
# Install package dependencies
npm install

# Run local development server
npm run dev
```
Open http://localhost:5173 in your browser.

---

## Design Documentation & Links

| Document | Description | Link |
| --- | --- | --- |
| High-Level Design (HLD) | System architecture overview, navigation panels, and data flow. | [View HLD](docs/hld.md) |
| Low-Level Design (LLD) | Database schema models, component models, API calls, and logic routines. | [View LLD](docs/lld.md) |
| Project License | Standard MIT License terms of use and ownership. | [View License](LICENSE) |
