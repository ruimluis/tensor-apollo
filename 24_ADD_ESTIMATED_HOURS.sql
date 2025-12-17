-- Add estimated_hours column to okrs table
alter table public.okrs 
add column if not exists estimated_hours numeric default null;

-- Refresh schema cache (optional but good practice)
notify pgrst, 'reload schema';
