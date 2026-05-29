# AnonVault

AnonVault is a secure personal workspace designed to organize application processes chronologically and dump creative ideas in a visual repository.

---

## What is AnonVault?

This project is a utility built to address the common problem of forgetting things after applying for jobs, internships, grants, or projects. It helps you manage your upcoming deadlines, keep track of process statuses (like applied, interviewing, offered, or rejected), and prioritize critical tasks. 

Additionally, it provides a dedicated visual workspace where you can dump creative thoughts, drafts, and side-project concepts in a searchable card board that supports tags and image uploads.

---

## Accessing the Dashboard

This workspace is locked by default behind a 4-digit entry passcode to protect personal deadlines and records. 

If you want to access this dashboard, contact mini anon for the PIN.

---

## Setting Up the Project

Follow these simple steps to run the application locally:

### Step 1: Database and Storage Configuration

This application runs on Supabase. Create a free project on Supabase and perform the following:
1. Open the SQL Editor in your Supabase dashboard and run the database creation query found in the Low-Level Design document.
2. Go to the Storage panel, create a new public bucket, and name it exactly `idea-images` to enable uploading visual design attachments.

### Step 2: Environment Parameters

Create a file named `.env` in the root of the project directory and populate it with your project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_api_key
VITE_APP_PIN=your_four_digit_pin_here
```

### Step 3: Run the Application

In your terminal, navigate to this project folder and execute:
```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```
Open the local address shown in your terminal (usually http://localhost:5173) in your browser.

---

## Documentation and License Links

For a deeper look into the systems and rules of this project, you can read the documents linked below:

* **[High-Level Design (HLD)](docs/hld.md)**: Simplified overview of the system architecture, navigation panels, and data flow.
* **[Low-Level Design (LLD)](docs/lld.md)**: Detailed schema models of the database tables, component properties, API calls, and logic routines.
* **[Project License](LICENSE)**: Released under the MIT License copyright of Tushar Bhardwaj.
