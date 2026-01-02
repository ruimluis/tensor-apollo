-- Create a new storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access controls for storage

-- 1. Allowed Public Access
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 2. Allow Authenticated Uploads
drop policy if exists "Anyone can upload an avatar" on storage.objects;
create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 3. Allow Authenticated Updates
drop policy if exists "Anyone can update their own avatar" on storage.objects;
create policy "Anyone can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
