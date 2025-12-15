-- STEP 1: CLEANUP
-- Run this first. If it errors saying "does not exist", that is GOOD. It means it's already gone.

drop table if exists public.okrs cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;

-- Also drop the trigger function just in case
drop function if exists public.handle_new_user() cascade;
