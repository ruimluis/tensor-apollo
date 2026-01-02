-- 33_ADD_RISK_ANALYSIS_FIELDS.sql
-- Add fields to store Risk Analysis results in okrs table

alter table public.okrs
add column if not exists risk_status text check (risk_status in ('On Track', 'At Risk', 'Off Track')),
add column if not exists risk_summary text,
add column if not exists risk_factors jsonb,
add column if not exists risk_recommendations jsonb,
add column if not exists risk_last_updated timestamp with time zone;

comment on column public.okrs.risk_status is 'AI-assessed risk status: On Track, At Risk, Off Track';
comment on column public.okrs.risk_summary is 'Brief summary of the risk analysis';
comment on column public.okrs.risk_factors is 'List of identified risk factors';
comment on column public.okrs.risk_recommendations is 'List of actionable recommendations';
