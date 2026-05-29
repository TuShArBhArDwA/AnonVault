# ChronoKeep & IdeaVault

A highly-styled, modern web application designed to help you track applications (jobs, internships, grants, projects) on a visual timeline, and capture your creative thoughts and design mockups in a visual Idea Vault. Built with **React 18**, **Tailwind CSS v4**, and **Supabase**.

---

## Key Features

1. **Application Timeline Tracker**
   - **Chronological Sorting**: See what deadlines are coming up first.
   - **Custom Grouping**: Toggle between a month-wise accordion grouped board and a clean date-wise list.
   - **Priority & Status Badges**: Urgent tasks stand out with subtle glowing border micro-animations.
   - **Interactive Filters**: Search by terms, filter by priority scales, and filter by process statuses.
   - **Full CRUD operations**: Add, edit, and delete application logs easily.

2. **Creative Idea Vault**
   - **Visual Card Deck**: Masonry grid of ideas.
   - **Rich Media Support**: Upload local design images or paste external image web URLs.
   - **Dynamic Tag Indexing**: Group your ideas with category tags, and click tag badges to instantly filter the deck.
   - **Text Descriptions**: Complete support for detailed descriptions.

3. **Supabase Synchronized Back-End**
   - Stores all application and idea records in a remote PostgreSQL database on Supabase.
   - Saves idea attachments directly to Supabase Public Storage buckets.
   - **Dynamic Client Setup**: If you run the app without `.env` config variables, a beautiful dynamic setup modal guides you to paste credentials and persist them directly inside your browser.

---

## Getting Started

### 1. Database & Storage Configuration on Supabase

Create a new project on [Supabase](https://supabase.com).

#### Step A: Database Tables
Open the **SQL Editor** in your Supabase dashboard, create a new query, paste the following SQL, and click **Run**:

```sql
-- 1. Create applications table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid default auth.uid(),
  name text not null,
  link text,
  deadline timestamp with time zone not null,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  status text check (status in ('applied', 'interviewing', 'offered', 'rejected', 'pending')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create ideas table
create table public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid default auth.uid(),
  title text not null,
  content text,
  image_url text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS) for public access or quick prototyping
alter table public.applications enable row level security;
alter table public.ideas enable row level security;

create policy "Allow all read" on public.applications for select using (true);
create policy "Allow all insert" on public.applications for insert with check (true);
create policy "Allow all update" on public.applications for update using (true);
create policy "Allow all delete" on public.applications for delete using (true);

create policy "Allow all read" on public.ideas for select using (true);
create policy "Allow all insert" on public.ideas for insert with check (true);
create policy "Allow all update" on public.ideas for update using (true);
create policy "Allow all delete" on public.ideas for delete using (true);
```

#### Step B: Storage Bucket (For Idea Images)
1. Go to **Storage** in the left sidebar of your Supabase dashboard.
2. Click **New Bucket**.
3. Set the name to exactly **`idea-images`**.
4. Make sure to toggle **Public** to **Enabled** (so that image URLs are accessible publicly).
5. Click **Create bucket**.

---

### 2. Running the Application Locally

#### Install Dependencies
In your terminal, navigate to the project directory and run:
```bash
npm install
```

#### Configure Environment Variables (Optional but Recommended)
To hardcode your database connections, create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```
*(If you omit this, you can easily enter these credentials dynamically in the app sidebar's **Setup** button)*

#### Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view and use the dashboard.
