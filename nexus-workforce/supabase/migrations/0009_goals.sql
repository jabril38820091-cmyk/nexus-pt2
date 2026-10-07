alter table companies add column if not exists goals text[] default '{}';
alter table companies add column if not exists agent_instructions text;
alter table companies add column if not exists track_revenue boolean default true;
