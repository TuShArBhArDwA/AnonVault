-- ============================================================
-- AnonVault: Supabase Storage Bucket Setup
-- Run this in your Supabase SQL Editor to configure the "idea-images" bucket and its policies
-- ============================================================

-- 1. Create the "idea-images" bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('idea-images', 'idea-images', true)
on conflict (id) do update
set public = true;

-- 2. Enable Row Level Security (RLS) on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- 3. Policy to allow anyone to read/download images from "idea-images" public bucket
create policy "Allow public read access to idea-images"
on storage.objects for select
using ( bucket_id = 'idea-images' );

-- 4. Policy to allow anyone to upload images to "idea-images" bucket
create policy "Allow public upload access to idea-images"
on storage.objects for insert
with check ( bucket_id = 'idea-images' );

-- 5. Policy to allow anyone to update images in "idea-images" bucket
create policy "Allow public update access to idea-images"
on storage.objects for update
using ( bucket_id = 'idea-images' )
with check ( bucket_id = 'idea-images' );

-- 6. Policy to allow anyone to delete images from "idea-images" bucket
create policy "Allow public delete access to idea-images"
on storage.objects for delete
using ( bucket_id = 'idea-images' );
