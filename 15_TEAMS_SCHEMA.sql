-- 1. Create Teams Table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  mission text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Team Members Table (Junction)
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, user_id)
);

-- 3. Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- 4. RLS Policies for Teams
-- "Users can CRUD Teams" -> All org members can view, insert, update, delete teams in their org.

create policy "Org Members can view teams" on teams for select using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);

create policy "Org Members can insert teams" on teams for insert with check (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);

create policy "Org Members can update teams" on teams for update using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);

create policy "Org Members can delete teams" on teams for delete using (
  organization_id in (select organization_id from organization_members where user_id = auth.uid())
);

-- 5. RLS Policies for Team Members
-- Logic: If you can view the team (Org Member), you can see who is in it.
-- Logic: If you can edit the team (Org Member), you can add/remove people.

create policy "Org Members can view team members" on team_members for select using (
  team_id in (
    select id from teams 
    where organization_id in (select organization_id from organization_members where user_id = auth.uid())
  )
);

create policy "Org Members can manage team members" on team_members for all using (
  team_id in (
    select id from teams 
    where organization_id in (select organization_id from organization_members where user_id = auth.uid())
  )
);
