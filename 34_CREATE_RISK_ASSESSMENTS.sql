-- 34_CREATE_RISK_ASSESSMENTS.sql
-- Create table to store history of Risk Analyses

create table if not exists public.okr_risk_assessments (
    id uuid default gen_random_uuid() primary key,
    okr_id uuid references public.okrs(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Analysis Data
    status text check (status in ('On Track', 'At Risk', 'Off Track')),
    summary text,
    factors jsonb,
    recommendations jsonb,
    score integer -- Optional quality score if we want to store that too
);

-- Index for fast lookup by OKR
create index if not exists idx_okr_risk_assessments_okr_id on public.okr_risk_assessments(okr_id);

-- RLS Policies
alter table public.okr_risk_assessments enable row level security;

create policy "Users can view risk assessments for visible OKRs"
    on public.okr_risk_assessments for select
    using (
        exists (
            select 1 from public.okrs
            where okrs.id = okr_risk_assessments.okr_id
            -- Add organization check if strictly needed, but OKR visibility usually implies access
        )
    );

create policy "Users can create risk assessments"
    on public.okr_risk_assessments for insert
    with check (auth.role() = 'authenticated');
