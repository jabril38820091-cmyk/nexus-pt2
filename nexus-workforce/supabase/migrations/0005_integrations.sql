create table webhooks(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  url text not null,
  events text[] not null,
  secret text not null,
  active boolean default true,
  last_status text,
  last_at timestamptz,
  created_at timestamptz default now()
);
create table api_keys(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz default now()
);
alter table webhooks enable row level security;
alter table api_keys enable row level security;
create policy own_webhooks on webhooks for all
  using (company_id in (select id from companies where owner_id = auth.uid()));
create policy read_own_keys on api_keys for select
  using (company_id in (select id from companies where owner_id = auth.uid()));
create policy delete_own_keys on api_keys for delete
  using (company_id in (select id from companies where owner_id = auth.uid()));
