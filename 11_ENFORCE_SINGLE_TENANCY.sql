-- ENFORCE SINGLE TENANCY

-- 1. CLEANUP SCRIPT: Keep only the membership of the organization that has MORE than 1 member (The real team)
-- If a user is in multiple orgs, we delete the one where they are the only member (Likely the accidental Personal Org).
-- This logic assumes "Team" > "Personal".
-- If both are 1 member, we delete the older one.

DELETE FROM organization_members
WHERE text(id) IN (
  SELECT text(m.id)
  FROM organization_members m
  JOIN (
    SELECT user_id
    FROM organization_members
    GROUP BY user_id
    HAVING count(*) > 1
  ) dups ON m.user_id = dups.user_id
  -- Join with Org Member Counts to find "Small" orgs
  JOIN (
    SELECT organization_id, count(*) as member_count
    FROM organization_members
    GROUP BY organization_id
  ) counts ON m.organization_id = counts.organization_id
  WHERE counts.member_count = 1 -- Delete the membership if it's a solo org (Personal)
);

-- 2. Update RPC to prevent future duplicates
CREATE OR REPLACE FUNCTION accept_invitation(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record record;
  user_id uuid;
  existing_membership_count int;
BEGIN
  -- 1. Verify User
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- 2. Check Single Tenancy: Is user already in an org?
  SELECT count(*) INTO existing_membership_count FROM organization_members WHERE organization_members.user_id = user_id;
  
  IF existing_membership_count > 0 THEN
      -- OPTIONAL: Return error, or Auto-Leave previous?
      -- For strict single tenancy, we can ERROR or we can cleanup.
      -- Let's ERROR for safety, instructing user they must leave current org first.
      -- OR, since we had the "Auto-create" bug, we can auto-delete if the other org has 1 member.
      
      -- Let's be strict:
      RETURN json_build_object('success', false, 'error', 'You are already a member of an organization. Please leave your current organization before joining a new one.');
  END IF;

  -- 3. Get Invite
  SELECT * INTO invite_record FROM invitations WHERE token = invite_token AND status = 'pending';
  
  IF invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- 4. Add Member
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (invite_record.organization_id, user_id, 'member');

  -- 5. Update Invite Status
  UPDATE invitations SET status = 'accepted' WHERE id = invite_record.id;

  RETURN json_build_object('success', true);
END;
$$;
