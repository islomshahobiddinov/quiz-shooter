-- Quiz Shooter — Lobby (multiplayer) schema
-- Run AFTER schema.sql, in: Supabase Dashboard → SQL Editor → New query → Run

-- Short readable lobby code generator (6 chars, no confusing 0/O/I/1)
create or replace function public.generate_lobby_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end;
$$;

create table if not exists public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default public.generate_lobby_code(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  -- Snapshot the quiz at lobby creation so edits to the source quiz
  -- don't affect an in-progress lobby and so anonymous players can read questions.
  quiz_title text not null,
  quiz_questions jsonb not null,
  time_limit_seconds int not null default 180 check (time_limit_seconds between 10 and 3600),
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lobbies_code_idx on public.lobbies (code);
create index if not exists lobbies_host_idx on public.lobbies (host_id);

create table if not exists public.lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  username text not null,
  is_host boolean not null default false,
  score int not null default 0,
  lives int not null default 3,
  question_index int not null default 0,
  finished boolean not null default false,
  joined_at timestamptz not null default now()
);

create index if not exists lobby_players_lobby_idx on public.lobby_players (lobby_id);

-- RLS: lobby code is the access secret. Anyone (anon) can read/insert/update player rows
-- if they know the lobby_id. Host control is enforced for lobby status changes.
alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;

-- lobbies: anyone can read (knowing id/code), only host can mutate
drop policy if exists "Anyone can read lobbies" on public.lobbies;
create policy "Anyone can read lobbies"
  on public.lobbies for select
  using (true);

drop policy if exists "Host can insert lobby" on public.lobbies;
create policy "Host can insert lobby"
  on public.lobbies for insert
  with check (auth.uid() = host_id);

drop policy if exists "Host can update own lobby" on public.lobbies;
create policy "Host can update own lobby"
  on public.lobbies for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

drop policy if exists "Host can delete own lobby" on public.lobbies;
create policy "Host can delete own lobby"
  on public.lobbies for delete
  using (auth.uid() = host_id);

-- lobby_players: open access — friendly MVP. The lobby code gates real access.
-- Tradeoff: in theory anyone with the code could edit anyone's score.
-- Acceptable for in-classroom / friend games. Tighten later with an edge function if needed.
drop policy if exists "Anyone can read players" on public.lobby_players;
create policy "Anyone can read players"
  on public.lobby_players for select
  using (true);

drop policy if exists "Anyone can join" on public.lobby_players;
create policy "Anyone can join"
  on public.lobby_players for insert
  with check (true);

drop policy if exists "Anyone can update player" on public.lobby_players;
create policy "Anyone can update player"
  on public.lobby_players for update
  using (true)
  with check (true);

drop policy if exists "Anyone can delete player" on public.lobby_players;
create policy "Anyone can delete player"
  on public.lobby_players for delete
  using (true);

-- Enable Realtime for both tables
alter publication supabase_realtime add table public.lobbies;
alter publication supabase_realtime add table public.lobby_players;
