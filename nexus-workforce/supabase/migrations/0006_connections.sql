create table connections(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  description text,
  url text not null,
  method text not null default 'POST',
  headers jsonb,
  body_template text,
  response_path text,
  last_status text,
  last_at timestamptz,
  created_at timestamptz default now(),
  unique(company_id,name)
);
alter table connections enable row level security;
create policy own_connections on connections for all
  using (company_id in (select id from companies where owner_id = auth.uid()));
