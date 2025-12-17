
-- Add metric_asc column to okrs table to store direction for Value metrics
-- Default to true (Ascending)
ALTER TABLE public.okrs
ADD COLUMN metric_asc boolean DEFAULT true;
