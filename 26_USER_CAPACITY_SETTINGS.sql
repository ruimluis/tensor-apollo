-- Create User Capacity Settings Table
create table if not exists public.user_capacity_settings (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    weekly_capacity integer default 40,
    daily_limit integer default 8,
    okr_allocation integer default 20, -- Percentage 0-100
    exceptions jsonb default '[]'::jsonb, -- Array of { date, hours, reason }
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.user_capacity_settings enable row level security;

-- Policy: Everyone (authenticated) can view everyone's capacity (needed for Scheduling Page)
create policy "Everyone can view capacity settings"
    on public.user_capacity_settings for select
    using ( auth.role() = 'authenticated' );

-- Policy: Users can only update their own settings
create policy "Users can update own capacity settings"
    on public.user_capacity_settings for update
    using ( auth.uid() = user_id );

-- Policy: Users can insert their own settings
create policy "Users can insert own capacity settings"
    on public.user_capacity_settings for insert
    with check ( auth.uid() = user_id );

-- Auto-create settings for existing users (Migration Helper)
insert into public.user_capacity_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
