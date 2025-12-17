
-- Add metrics columns to okrs table
ALTER TABLE public.okrs
ADD COLUMN metric_type text CHECK (metric_type IN ('boolean', 'percentage', 'value', 'checklist')),
ADD COLUMN metric_start numeric,
ADD COLUMN metric_target numeric,
ADD COLUMN metric_unit text,
ADD COLUMN checklist jsonb;
