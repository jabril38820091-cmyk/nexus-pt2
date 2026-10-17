create table if not exists booking_settings(
  company_id uuid primary key references companies(id) on delete cascade,
  calendar_id text not null,
  verify_code text,
  verified boolean default false,
  duration_minutes int default 30,
  buffer_minutes int default 0,
  min_notice_hours int default 2,
  max_days_ahead int default 30,
  enabled boolean default true,
  updated_at timestamptz default now());
create table if not exists bookings(
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  call_id text, start_at timestamptz not null, end_at timestamptz not null,
  name text not null, phone text, reason text, event_id text,
  status text default 'confirmed', created_at timestamptz default now());
create unique index if not exists bookings_one_per_slot on bookings(company_id,start_at) where status='confirmed';
alter table booking_settings enable row level security;
alter table bookings enable row level security;
drop policy if exists read_own_booking_settings on booking_settings;
create policy read_own_booking_settings on booking_settings for select using (company_id in (select id from companies where owner_id = auth.uid()));
drop policy if exists read_own_bookings on bookings;
create policy read_own_bookings on bookings for select using (company_id in (select id from companies where owner_id = auth.uid()));
