-- 36_ADD_PERIOD_TO_WEEKLY_REVIEWS.sql
-- Add period_start and period_end to track which week the review covers

alter table public.okr_weekly_reviews
add column if not exists period_start date,
add column if not exists period_end date;

-- Add index for querying by period
create index if not exists idx_okr_weekly_reviews_period on public.okr_weekly_reviews(period_start);
