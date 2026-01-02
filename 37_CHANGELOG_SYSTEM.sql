-- Create changelog_items table
create table if not exists changelog_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text not null,
  publish_date timestamp with time zone not null,
  type text not null, -- 'New Feature', 'Improvement', 'Fix'
  icon text not null -- lucide icon name
);

-- Enable RLS
alter table changelog_items enable row level security;

-- Policies
-- Everyone can read
drop policy if exists "Enable read access for all users" on changelog_items;
create policy "Enable read access for all users"
on changelog_items for select
using (true);

-- Only specific admin can insert/update/delete
drop policy if exists "Enable write access for admin" on changelog_items;
create policy "Enable write access for admin"
on changelog_items for all
using (
  auth.jwt() ->> 'email' = 'ruimluis7@gmail.com'
)
with check (
  auth.jwt() ->> 'email' = 'ruimluis7@gmail.com'
);
