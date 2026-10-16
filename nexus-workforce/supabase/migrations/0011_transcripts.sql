alter table calls add column if not exists transcript_text text;
alter table companies add column if not exists save_transcripts boolean default true;
alter table companies add column if not exists transcript_retention_days int default 90;
