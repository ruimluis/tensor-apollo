-- 25_TASK_DEPENDENCIES.sql
-- Create table for task dependencies

create table public.task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.okrs(id) on delete cascade not null,
  dependency_id uuid references public.okrs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_dependency unique(task_id, dependency_id),
  constraint no_self_dependency check(task_id != dependency_id)
);

alter table public.task_dependencies enable row level security;

-- Policies
create policy "Org Members can view dependencies" on task_dependencies for select using (
  task_id in (select id from okrs where organization_id in (select organization_id from organization_members where user_id = auth.uid()))
);

create policy "Org Members can insert dependencies" on task_dependencies for insert with check (
  task_id in (select id from okrs where organization_id in (select organization_id from organization_members where user_id = auth.uid()))
);

create policy "Org Members can delete dependencies" on task_dependencies for delete using (
  task_id in (select id from okrs where organization_id in (select organization_id from organization_members where user_id = auth.uid()))
);
