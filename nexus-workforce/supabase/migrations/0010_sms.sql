create table if not exists sms_settings(
  company_id uuid primary key references companies(id) on delete cascade,
  account_sid text not null,
  auth_token_enc text not null,
  from_number text not null,
  enabled boolean default true,
  updated_at timestamptz default now());
create table if not exists sms_log(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  call_id text, to_number text not null, body text not null,
  status text not null, error text, created_at timestamptz default now());
alter table sms_settings enable row level security;
alter table sms_log enable row level security;
drop policy if exists read_own_sms_settings on sms_settings;
create policy read_own_sms_settings on sms_settings for select using (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists read_own_sms_log on sms_log;
create policy read_own_sms_log on sms_log for select using (company_id in (select id from companies where owner_id = auth.uid()));
