-- ADDREA Leadership DNA — initial schema + RLS
create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  access_token uuid not null unique default gen_random_uuid(),
  current_step integer not null default 0,
  draft jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists participants_session_id_idx on participants(session_id);
create index if not exists participants_access_token_idx on participants(access_token);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  code text not null unique,
  title text not null,
  description text,
  type text not null,
  max_choices integer,
  sort_order integer not null default 0
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  left_label text,
  right_label text,
  sort_order integer not null default 0,
  unique(question_id, code)
);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  question_code text not null,
  option_code text,
  response_type text not null,
  numeric_value numeric,
  text_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, question_code, option_code, response_type)
);

create index if not exists responses_participant_id_idx on responses(participant_id);
create index if not exists responses_question_code_idx on responses(question_code);

alter table sessions enable row level security;
alter table participants enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table responses enable row level security;

-- Public can read active sessions by code (needed for welcome page metadata via server;
-- still safe: no PII). Anon policies are intentionally minimal.
create policy "sessions_select_active"
  on sessions for select
  to anon, authenticated
  using (active = true);

create policy "questions_select_all"
  on questions for select
  to anon, authenticated
  using (true);

create policy "options_select_all"
  on options for select
  to anon, authenticated
  using (true);

-- Participants: no direct anon access to other people's data.
-- All participant/response reads & writes go through server with service role.
-- Keep RLS enabled with no anon write policies on responses.

create policy "participants_no_anon_select"
  on participants for select
  to anon
  using (false);

create policy "participants_no_anon_insert"
  on participants for insert
  to anon
  with check (false);

create policy "participants_no_anon_update"
  on participants for update
  to anon
  using (false);

create policy "responses_no_anon_all"
  on responses for all
  to anon
  using (false)
  with check (false);
