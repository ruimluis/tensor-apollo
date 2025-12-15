-- 1. Add status column to organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'deactivated'));

-- 2. Allow Admins to update member status and role
-- We need a specific policy for UPDATING members, often missing or too restrictive
CREATE POLICY "Admins can update organization members"
ON organization_members
FOR UPDATE
USING (
  is_org_admin(organization_id)
);

-- 3. RPC to safely update member status/role (eases RLS complexity for complex checks)
CREATE OR REPLACE FUNCTION update_org_member(
  target_member_id uuid,
  new_role text DEFAULT NULL,
  new_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requester_org_id uuid;
  target_org_id uuid;
BEGIN
  -- Get requester's org (and verify they are admin)
  SELECT organization_id INTO requester_org_id
  FROM organization_members
  WHERE user_id = auth.uid() AND role = 'admin'
  LIMIT 1;

  IF requester_org_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get target's org
  SELECT organization_id INTO target_org_id
  FROM organization_members
  WHERE id = target_member_id;

  -- Verify they are in the same org
  IF requester_org_id != target_org_id THEN
    RAISE EXCEPTION 'Target user not in your organization';
  END IF;

  -- Update
  UPDATE organization_members
  SET 
    role = COALESCE(new_role, role),
    status = COALESCE(new_status, status)
  WHERE id = target_member_id;
END;
$$;
