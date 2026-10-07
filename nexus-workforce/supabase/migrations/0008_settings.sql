alter table companies add column if not exists timezone text;
alter table companies add column if not exists business_hours jsonb;
alter table companies add column if not exists notify_drafts boolean default true;
