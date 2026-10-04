create table email_log(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  call_id text,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null,
  error text,
  created_at timestamptz default now()
);
alter table email_log enable row level security;
create policy own_emails on email_log for select
  using (company_id in (select id from companies where owner_id = auth.uid()));
