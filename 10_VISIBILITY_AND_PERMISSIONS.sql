-- 1. Helper: Get IDs of orgs I belong to (Bypass RLS)
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid();
$$;

-- 2. Helper: Check if I am admin of an org (Bypass RLS)
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 3. Reset Policies on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- SELECT: If I am in the org, I can see ALL members
CREATE POLICY "See all members"
ON organization_members FOR SELECT
USING (
  organization_id IN (SELECT get_my_org_ids())
);

-- INSERT/UPDATE/DELETE: Only Admins
CREATE POLICY "Admins can insert members"
ON organization_members FOR INSERT
WITH CHECK (
  is_org_admin(organization_id)
);

CREATE POLICY "Admins can update members"
ON organization_members FOR UPDATE
USING (
  is_org_admin(organization_id)
);

CREATE POLICY "Admins can delete members"
ON organization_members FOR DELETE
USING (
  is_org_admin(organization_id)
);

-- 4. Reset Policies on Profiles (PUBLIC VISIBILITY)
-- Essential for "Seeing everyone" (names/avatars)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 5. Reset Policies on Invitations (Admins only see/manage invites)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

-- View: Admins OR the invitee (via token RPC, handled separately, but standard Select needs this)
CREATE POLICY "Admins view invites"
ON invitations FOR SELECT
USING (
  is_org_admin(organization_id)
);

CREATE POLICY "Admins manage invites"
ON invitations FOR ALL
USING (
  is_org_admin(organization_id)
);
