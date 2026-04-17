create extension if not exists pgcrypto;

create table if not exists public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_key text not null,
  date_label text not null,
  focus text not null,
  focus_label text not null,
  sound text not null,
  sound_label text not null,
  length_minutes integer not null check (length_minutes > 0),
  speech_enabled boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists sleep_sessions_user_completed_idx
  on public.sleep_sessions (user_id, completed_at desc);

create index if not exists sleep_sessions_date_idx
  on public.sleep_sessions (date_key);
