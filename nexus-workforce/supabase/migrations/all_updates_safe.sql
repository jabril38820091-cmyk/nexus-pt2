-- Safe to run more than once. Covers updates 2 to 6.
create table if not exists tasks(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  agent_slug text not null, title text not null, instructions text,
  status text default 'queued', result text,
  created_at timestamptz default now(), updated_at timestamptz default now());
alter table tasks enable row level security;
drop policy if exists own_tasks on tasks;
create policy own_tasks on tasks for all using (company_id in (select id from companies where owner_id = auth.uid()));

create table if not exists email_log(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  call_id text, to_email text not null, subject text not null, body text not null,
  status text not null, error text, created_at timestamptz default now());
alter table email_log enable row level security;
drop policy if exists own_emails on email_log;
create policy own_emails on email_log for select using (company_id in (select id from companies where owner_id = auth.uid()));

alter table companies add column if not exists agent_mode text default 'full';
alter table companies add column if not exists chosen_agent text;

create table if not exists webhooks(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  url text not null, events text[] not null, secret text not null,
  active boolean default true, last_status text, last_at timestamptz,
  created_at timestamptz default now());
create table if not exists api_keys(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, key_prefix text not null, key_hash text not null unique,
  last_used_at timestamptz, created_at timestamptz default now());
alter table webhooks enable row level security;
alter table api_keys enable row level security;
drop policy if exists own_webhooks on webhooks;
create policy own_webhooks on webhooks for all using (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists read_own_keys on api_keys;
create policy read_own_keys on api_keys for select using (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists delete_own_keys on api_keys;
create policy delete_own_keys on api_keys for delete using (company_id in (select id from companies where owner_id = auth.uid()));

create table if not exists connections(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, description text, url text not null,
  method text not null default 'POST', headers jsonb, body_template text, response_path text,
  last_status text, last_at timestamptz, created_at timestamptz default now(),
  unique(company_id,name));
alter table connections enable row level security;
drop policy if exists own_connections on connections;
create policy own_connections on connections for all using (company_id in (select id from companies where owner_id = auth.uid()));
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
alter table companies add column if not exists timezone text;
alter table companies add column if not exists business_hours jsonb;
alter table companies add column if not exists notify_drafts boolean default true;
alter table companies add column if not exists goals text[] default '{}';
alter table companies add column if not exists agent_instructions text;
alter table companies add column if not exists track_revenue boolean default true;
