-- FIX AMBIGUOUS COLUMN REFERENCE
-- Renaming variable user_id to auth_user_id to prevent collision with column names

CREATE OR REPLACE FUNCTION accept_invitation(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record record;
  auth_user_id uuid; -- Renamed from user_id
  existing_membership_count int;
BEGIN
  -- 1. Verify User
  auth_user_id := auth.uid();
  IF auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- 2. Check Single Tenancy: Is user already in an org?
  SELECT count(*) INTO existing_membership_count 
  FROM organization_members 
  WHERE organization_members.user_id = auth_user_id;
  
  IF existing_membership_count > 0 THEN
      RETURN json_build_object('success', false, 'error', 'You are already a member of an organization. Please leave your current organization before joining a new one.');
  END IF;

  -- 3. Get Invite
  SELECT * INTO invite_record FROM invitations WHERE token = invite_token AND status = 'pending';
  
  IF invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- 4. Add Member
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (invite_record.organization_id, auth_user_id, 'member', 'active');

  -- 5. Update Invite Status
  UPDATE invitations SET status = 'accepted' WHERE id = invite_record.id;

  RETURN json_build_object('success', true);
END;
$$;
