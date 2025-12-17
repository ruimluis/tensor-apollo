
-- Add start_date and end_date to okrs table
ALTER TABLE public.okrs
ADD COLUMN start_date timestamp with time zone,
ADD COLUMN end_date timestamp with time zone;
