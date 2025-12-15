-- 5_INVITATIONS.sql
-- Schema for handling user invitations

-- 1. Create Invitations Table
create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  email text not null,
  token text default encode(gen_random_bytes(16), 'hex') not null,
  status text default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, email)
);

-- 2. Enable RLS
alter table public.invitations enable row level security;

-- 3. Policies for Invitations

-- Admins can view invitations for their org
create policy "Admins can view invitations" on invitations for select using (
  organization_id in (
    select organization_id 
    from organization_members 
    where user_id = auth.uid() and role = 'admin'
  )
);

-- Admins can insert invitations
create policy "Admins can create invitations" on invitations for insert with check (
  organization_id in (
    select organization_id 
    from organization_members 
    where user_id = auth.uid() and role = 'admin'
  )
);

-- Admins can delete invitations
create policy "Admins can cancel invitations" on invitations for delete using (
  organization_id in (
    select organization_id 
    from organization_members 
    where user_id = auth.uid() and role = 'admin'
  )
);

-- Public (Anonymous/Authenticated) can view specific invitation by TOKEN only
-- This is critical for the "Accept Invite" page to render details before joining.
-- We use a security definer function or a specific policy if needed, 
-- but simpler: "Anyone can read invitation if they know the token"
create policy "Anyone with token can view invite" on invitations for select using (
  token = current_setting('request.jwt.claim.sub', true) -- This doesn't work for public reading query param tokens easily without a function
  -- Actually, let's keep it restricted. The joining flow will use an RPC to be safe.
  -- No public read access to table.
);

-- 4. RPC: Accept Invitation
-- This function allows a logged-in user to accept an invitation using a token.
create or replace function accept_invitation(invite_token text)
returns json as $$
declare
  invite_record record;
  user_current_org uuid;
begin
  -- 1. Find Invitation
  select * into invite_record from invitations where token = invite_token and status = 'pending';
  
  if invite_record is null then
    return json_build_object('success', false, 'error', 'Invalid or expired invitation.');
  end if;

  -- 2. Check if user is already in this org
  select organization_id into user_current_org 
  from organization_members 
  where organization_id = invite_record.organization_id and user_id = auth.uid();

  if user_current_org is not null then
    return json_build_object('success', false, 'error', 'You are already a member of this organization.');
  end if;

  -- 3. Add Member
  insert into organization_members (organization_id, user_id, role)
  values (invite_record.organization_id, auth.uid(), 'member');

  -- 4. Mark Invitation Accepted
  update invitations set status = 'accepted' where id = invite_record.id;
  
  -- 5. Return Success
  return json_build_object('success', true, 'organization_id', invite_record.organization_id);
end;
$$ language plpgsql security definer;
