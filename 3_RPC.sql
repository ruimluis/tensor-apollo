-- RPC: Create Organization (Idempotent)
-- Prevents duplicate orgs if called multiple times rapidly (Race Condition).

create or replace function create_organization_for_user(org_name text)
returns json as $$
declare
  new_org_id uuid;
  existing_org_id uuid;
  existing_org_name text;
begin
  -- 0. IDEMPOTENCY CHECK
  -- Check if user is already a member of ANY org
  select organization_id into existing_org_id 
  from organization_members 
  where user_id = auth.uid() 
  limit 1;

  if existing_org_id is not null then
     select name into existing_org_name from organizations where id = existing_org_id;
     return json_build_object('id', existing_org_id, 'name', existing_org_name, 'status', 'existing');
  end if;

  -- 1. Create Org
  insert into organizations (name) values (org_name) returning id into new_org_id;
  
  -- 2. Add Member (Current User as Admin)
  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'admin');
  
  return json_build_object('id', new_org_id, 'name', org_name, 'status', 'created');
end;
$$ language plpgsql security definer;
