
-- Add team_id to okrs table
ALTER TABLE public.okrs
ADD COLUMN team_id uuid references public.teams(id) on delete set null;
