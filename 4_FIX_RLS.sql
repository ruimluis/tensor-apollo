-- FIX RLS RECURSION
-- We use a "Security Definer" function to bypass RLS when looking up membership.
-- This breaks the infinite loop of "Check Policy -> Select Table -> Check Policy".

-- 1. Create Helper Function (Bypasses RLS)
create or replace function get_my_org_ids()
returns setof uuid
language sql
security definer
set search_path = public -- Secure the search path
stable
as $$
  select organization_id 
  from organization_members 
  where user_id = auth.uid();
$$;

-- 2. Drop Old Recursive Policies
drop policy if exists "Users can view members of their organizations" on organization_members;
drop policy if exists "Users can view their organizations" on organizations;
drop policy if exists "Org Members can view OKRs" on okrs;
drop policy if exists "Org Members can insert OKRs" on okrs;
drop policy if exists "Org Members can update OKRs" on okrs;
drop policy if exists "Org Members can delete OKRs" on okrs;

-- 3. Re-Create Policies using the Helper Function

-- Organizations: View if I am a member
create policy "Users can view their organizations" on organizations 
for select using (
  id in (select get_my_org_ids())
);

-- Organization Members: View if I am in the same org
create policy "Users can view members of their organizations" on organization_members
for select using (
  organization_id in (select get_my_org_ids())
);

-- OKRs: View/Edit if I am in the org
create policy "Org Members can view OKRs" on okrs
for select using (
  organization_id in (select get_my_org_ids())
);

create policy "Org Members can insert OKRs" on okrs
for insert with check (
  organization_id in (select get_my_org_ids())
);

create policy "Org Members can update OKRs" on okrs
for update using (
  organization_id in (select get_my_org_ids())
);

create policy "Org Members can delete OKRs" on okrs
for delete using (
  organization_id in (select get_my_org_ids())
);
