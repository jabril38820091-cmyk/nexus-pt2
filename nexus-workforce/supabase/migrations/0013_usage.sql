alter table companies add column if not exists current_period_start timestamptz;
alter table companies add column if not exists usage_alert_level int default 0;
alter table companies add column if not exists usage_alert_period timestamptz;
create index if not exists calls_company_created on calls(company_id,created_at);
