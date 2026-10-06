create table if not exists playbooks(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  key text not null,
  enabled boolean default false,
  created_at timestamptz default now(),
  unique(company_id,key)
);
alter table playbooks enable row level security;
drop policy if exists own_playbooks on playbooks;
create policy own_playbooks on playbooks for all
  using (company_id in (select id from companies where owner_id = auth.uid()));
