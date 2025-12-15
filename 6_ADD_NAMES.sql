-- 6_ADD_NAMES.sql
-- Add name support for invitations

-- 1. Add name column to invitations
alter table public.invitations 
add column name text;

-- 2. Update RLS (just in case, existing policies should cover new columns automatically)
-- No changes needed for column addition usually if policy is on row.
