-- FIX: The previous policy caused infinite recursion by querying table within its own policy.
-- We must use the security definer function `get_my_org_ids()` to break the loop.

-- 1. Fix organization_members visibility
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members; -- clean up old ones

CREATE POLICY "Users can view members of their organizations"
ON organization_members FOR SELECT
USING (
    organization_id IN (
        SELECT get_my_org_ids() -- Calls the security definer function
    )
);

-- 2. Ensure Profiles are visible (re-applying to be safe, no recursion here usually but good to keep)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);
