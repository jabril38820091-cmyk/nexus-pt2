create table if not exists demo_requests(
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, business text not null, email text not null, phone text,
  business_type text not null, message text, source text,
  status text default 'new', ip_hash text);
create index if not exists demo_requests_created on demo_requests(created_at desc);
-- No policies: only the server (service role) can read or write these.
alter table demo_requests enable row level security;
