-- FIXED RESET SCRIPT
-- Separates Table Creation from Policy Creation to avoid "relation does not exist" errors.

-- 1. DROP EVERYTHING
drop table if exists okrs cascade;
drop table if exists organization_members cascade;
drop table if exists organizations cascade;
drop table if exists profiles cascade;
drop function if exists handle_new_user() cascade;

-- 2. CREATE TABLES (No Policies yet)

create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

create table okrs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  type text not null check (type in ('GOAL', 'OBJECTIVE', 'KEY_RESULT', 'TASK')),
  title text not null,
  description text,
  parent_id uuid references okrs(id),
  organization_id uuid references organizations(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
  progress int default 0,
  expanded boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE RLS & CREATE POLICIES

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Organizations
alter table organizations enable row level security;
create policy "Users can insert organizations" on organizations for insert with check ( true ); 
create policy "Users can view their organizations" on organizations for select using (
  id in (select organization_id from organization_members where user_id = auth.uid())
);

-- Organization Members
alter table organization_members enable row level security;
create policy "Users can view members of their organizations" on organization_members for select using (
  auth.uid() = user_id or organization_id in (select organization_id from organization_members where user_id = auth.uid())
);
create policy "Users can insert their own membership" on organization_members for insert with check ( auth.uid() = user_id );

-- OKRs
alter table okrs enable row level security;
create policy "Org Members can view OKRs" on okrs for select using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);
create policy "Org Members can insert OKRs" on okrs for insert with check (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);
create policy "Org Members can update OKRs" on okrs for update using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);
create policy "Org Members can delete OKRs" on okrs for delete using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);

-- 4. TRIGGERS
create or replace function handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
