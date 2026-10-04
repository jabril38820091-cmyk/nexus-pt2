create table tasks(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  agent_slug text not null,
  title text not null,
  instructions text,
  status text default 'queued',
  result text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks enable row level security;
create policy own_tasks on tasks for all
  using (company_id in (select id from companies where owner_id = auth.uid()));
