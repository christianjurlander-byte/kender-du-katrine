-- =============================================================================
-- "Kender du Katrine?" — Supabase database schema
--
-- HOW TO USE:
-- 1. Open your Supabase project.
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the ENTIRE contents of this file, and click "Run".
-- That's it — this single script creates all tables, security rules and
-- realtime settings needed by the app. It is safe to run more than once.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'finished')),
  question_state text not null default 'idle' check (question_state in ('idle', 'answering', 'revealed')),
  current_question_index int not null default 0,
  katrine_player_id uuid,
  host_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  -- When the current question was opened for answering. Used to compute
  -- the (purely visual) countdown ring and "fastest answer" fun facts.
  question_started_at timestamptz
);

alter table public.games add column if not exists question_started_at timestamptz;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  is_katrine boolean not null default false,
  score int not null default 0,
  connected boolean not null default true,
  player_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  -- A single emoji the player picked when joining. Purely cosmetic.
  avatar text
);

alter table public.players add column if not exists avatar text;

-- Only one Katrine per game.
create unique index if not exists one_katrine_per_game
  on public.players (game_id)
  where is_katrine;

alter table public.games
  drop constraint if exists games_katrine_player_id_fkey;
alter table public.games
  add constraint games_katrine_player_id_fkey
  foreign key (katrine_player_id) references public.players (id) on delete set null;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  index int not null,
  text text not null,
  options jsonb not null,
  -- Optional image shown alongside the question, on both players' phones
  -- and the shared screen. Points at a file in the "question-images"
  -- storage bucket (see below).
  image_url text,
  unique (game_id, index)
);

alter table public.questions add column if not exists image_url text;

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  unique (question_id, player_id)
);

-- Lightweight "someone answered" receipts with NO option info, so the host
-- can show a live "3 af 6 har svaret" counter over realtime without
-- revealing anyone's actual choice before the question is closed.
create table if not exists public.answer_receipts (
  question_id uuid not null references public.questions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, player_id)
);

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- Design: the browser only ever talks to Supabase directly for READS
-- (and realtime subscriptions), using the public "anon" key. All WRITES
-- (creating games, joining, answering, host actions) go through this app's
-- server-side API routes, which use the secret "service role" key and
-- therefore bypass RLS entirely. So below we only need to define what the
-- anonymous, public key is allowed to SELECT.
-- -----------------------------------------------------------------------------

alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.answer_receipts enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.games, public.players, public.questions, public.answers, public.answer_receipts
  to anon, authenticated;

drop policy if exists "games are publicly readable" on public.games;
create policy "games are publicly readable"
  on public.games for select
  using (true);

drop policy if exists "players are publicly readable" on public.players;
create policy "players are publicly readable"
  on public.players for select
  using (true);

drop policy if exists "questions are publicly readable" on public.questions;
create policy "questions are publicly readable"
  on public.questions for select
  using (true);

drop policy if exists "answer receipts are publicly readable" on public.answer_receipts;
create policy "answer receipts are publicly readable"
  on public.answer_receipts for select
  using (true);

-- The important one: nobody can read another player's answer until the
-- host has revealed the current question (question_state = 'revealed').
drop policy if exists "answers are readable only once revealed" on public.answers;
create policy "answers are readable only once revealed"
  on public.answers for select
  using (
    exists (
      select 1
      from public.questions q
      join public.games g on g.id = q.game_id
      where q.id = public.answers.question_id
        and g.question_state = 'revealed'
        and g.current_question_index = q.index
    )
  );

-- -----------------------------------------------------------------------------
-- Storage: a public bucket for question images. Uploads happen through this
-- app's server-side API route (service role key), so no anon write policy
-- is needed — the bucket's "public" flag alone makes uploaded images
-- viewable by anyone with the link, same trust level as the rest of the
-- game data in this party-game app.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do update set public = true;

-- -----------------------------------------------------------------------------
-- Realtime: let the browser subscribe to live changes.
-- -----------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.games;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.questions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.answers;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.answer_receipts;
exception when duplicate_object then null;
end $$;
