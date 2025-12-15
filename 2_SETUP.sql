-- STEP 2: SETUP
-- Run this AFTER 1_RESET.sql

-- 1. Profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- 2. Organizations
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.organizations enable row level security;
create policy "Users can insert organizations" on organizations for insert with check ( true ); 
create policy "Users can view their organizations" on organizations for select using (
  id in (select organization_id from organization_members where user_id = auth.uid())
);

-- 3. Organization Members
create table public.organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

alter table public.organization_members enable row level security;
create policy "Users can view members of their organizations" on organization_members for select using (
  auth.uid() = user_id or organization_id in (select organization_id from organization_members where user_id = auth.uid())
);
create policy "Users can insert their own membership" on organization_members for insert with check ( auth.uid() = user_id );

-- 4. OKRs
create table public.okrs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null check (type in ('GOAL', 'OBJECTIVE', 'KEY_RESULT', 'TASK')),
  title text not null,
  description text,
  parent_id uuid references public.okrs(id),
  organization_id uuid references public.organizations(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
  progress int default 0,
  expanded boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.okrs enable row level security;
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

-- 5. User Handling Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger (Drop first if exists to avoid error)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
