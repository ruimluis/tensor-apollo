-- Function to allow anonymous users to fetch invite details via token
-- This is necessary because the 'invitations' table is RLS-protected and anon users can't read it directly.
CREATE OR REPLACE FUNCTION get_invite_details(lookup_token text)
RETURNS TABLE (
    email text,
    name text,
    org_name text
) 
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.email, 
    i.name, 
    o.name as org_name
  FROM invitations i
  JOIN organizations o ON i.organization_id = o.id
  WHERE i.token = lookup_token
  AND i.status = 'pending';
END;
$$;
