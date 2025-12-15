-- ALLOW ADMINS TO UPDATE THEIR ORGANIZATION (Name, etc.)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is admin of the org they are trying to update
-- We can reuse the `is_org_admin` function from 10_VISIBILITY_AND_PERMISSIONS.sql
-- But we need to use the `id` of the row being updated.

CREATE POLICY "Admins can update their organization"
ON organizations FOR UPDATE
USING (
  is_org_admin(id) -- 'id' refers to organizations.id
);

-- Ensure we don't break the "View" policy (already exists as "Users can view their organizations")
-- That policy uses get_my_org_ids().

-- Note: is_org_admin is a SECURITY DEFINER function so it bypasses RLS on organization_members
-- This allows it to verify admin status even if the user can't "see" the member row via standard select (though they should be able to).
