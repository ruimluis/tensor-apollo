-- v2: Multi-Tenancy Migration

-- 1. Create Organizations Table
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.organizations enable row level security;

-- 2. Create Organization Members Table
create table public.organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- Enable RLS
alter table public.organization_members enable row level security;

-- Policies for Organization Members
-- Users can see memberships for organizations they belong to
create policy "Users can view members of their organizations"
  on organization_members for select
  using (
    auth.uid() = user_id 
    or 
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

-- Only Admins can insert/update/delete members (Simplified for now: Open invite or strict admin?)
-- Let's stick to: Users can insert themselves if creating an org (handled via trigger/function usually or client side logic secured by policy)
-- Actually, for "Create Org", the user inserts the Org, then inserts themselves as Admin.

create policy "Users can insert organizations"
  on organizations for insert
  with check ( true ); 

create policy "Users can view their organizations"
  on organizations for select
  using (
    id in (
        select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Users can insert their own membership"
  on organization_members for insert
  with check ( auth.uid() = user_id );

-- 3. Modify OKRs Table
-- We need to add organization_id. 
-- For existing data, this is tricky. We'll make it nullable first, then enforce.
-- Since this is a dev env, we can just clear data or default to a dummy if needed, 
-- but simpler to just add column.

alter table public.okrs 
add column organization_id uuid references public.organizations(id) on delete cascade;

-- UPDATE RLS for OKRs
-- Old policy: "Users can CRUD their own OKRs" (user_id = auth.uid())
-- New policy: "Users can CRUD OKRs belonging to their Organization"

drop policy "Users can CRUD their own OKRs." on okrs;

create policy "Org Members can view OKRs"
  on okrs for select
  using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Org Members can insert OKRs"
  on okrs for insert
  with check (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Org Members can update OKRs"
  on okrs for update
  using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Org Members can delete OKRs"
  on okrs for delete
  using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );
