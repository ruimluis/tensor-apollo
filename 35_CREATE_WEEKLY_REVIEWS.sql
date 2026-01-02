-- 35_CREATE_WEEKLY_REVIEWS.sql
-- Create table to store history of AI Weekly Reviews

create table if not exists public.okr_weekly_reviews (
    id uuid default gen_random_uuid() primary key,
    okr_id uuid references public.okrs(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Review Data
    summary text,
    achievements jsonb,
    blockers jsonb,
    priorities jsonb
);

-- Index for fast lookup
create index if not exists idx_okr_weekly_reviews_okr_id on public.okr_weekly_reviews(okr_id);

-- RLS Policies
alter table public.okr_weekly_reviews enable row level security;

create policy "Users can view weekly reviews for visible OKRs"
    on public.okr_weekly_reviews for select
    using (
        exists (
            select 1 from public.okrs
            where okrs.id = okr_weekly_reviews.okr_id
        )
    );

create policy "Users can create weekly reviews"
    on public.okr_weekly_reviews for insert
    with check (auth.role() = 'authenticated');
