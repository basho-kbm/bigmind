create extension if not exists pgcrypto;

create table if not exists public.daily_sleep_content (
  id uuid primary key default gen_random_uuid(),
  date_key text not null,
  content_kind text not null check (content_kind in ('spoken', 'soundscape')),
  content_key text not null,
  title text not null,
  summary text,
  duration_minutes integer,
  opening_line text,
  structure jsonb,
  description text,
  texture jsonb,
  mood_tags jsonb not null default '[]'::jsonb,
  primary_angle text,
  variation_profile text,
  raw_payload jsonb not null default '{}'::jsonb,
  llm_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date_key, content_kind, content_key)
);

create index if not exists daily_sleep_content_date_idx
  on public.daily_sleep_content (date_key);

create index if not exists daily_sleep_content_lookup_idx
  on public.daily_sleep_content (date_key, content_kind, content_key);

create or replace function public.set_daily_sleep_content_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_sleep_content_updated_at on public.daily_sleep_content;

create trigger trg_daily_sleep_content_updated_at
before update on public.daily_sleep_content
for each row execute function public.set_daily_sleep_content_updated_at();
