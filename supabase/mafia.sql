-- Mafia game tables

create table public.mafia_lobbies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default '',
  host_id text not null,
  status text not null default 'waiting',      -- waiting | playing | finished
  phase text default null,                      -- night | day_reveal | day_vote
  round integer default 0,
  roles jsonb default '{}',                     -- { playerId: role }
  night_actions jsonb default '{}',             -- { mafiaTarget, doctorTarget, sheriffTarget }
  day_votes jsonb default '{}',                 -- { voterId: targetId }
  last_event jsonb default '{}',                -- { killed, eliminated, sheriffTarget, sheriffIsMafia }
  winner text default null,                     -- 'mafia' | 'town'
  created_at timestamptz default now(),
  started_at timestamptz default null,
  finished_at timestamptz default null
);

create table public.mafia_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.mafia_lobbies(id) on delete cascade,
  username text not null,
  is_host boolean default false,
  is_alive boolean default true,
  joined_at timestamptz default now()
);

-- Enable realtime
alter publication supabase_realtime add table public.mafia_lobbies;
alter publication supabase_realtime add table public.mafia_players;

-- RLS
alter table public.mafia_lobbies enable row level security;
alter table public.mafia_players enable row level security;

create policy "anyone can read mafia lobbies"   on public.mafia_lobbies for select using (true);
create policy "anyone can insert mafia lobbies" on public.mafia_lobbies for insert with check (true);
create policy "anyone can update mafia lobbies" on public.mafia_lobbies for update using (true);

create policy "anyone can read mafia players"   on public.mafia_players for select using (true);
create policy "anyone can insert mafia players" on public.mafia_players for insert with check (true);
create policy "anyone can update mafia players" on public.mafia_players for update using (true);
create policy "anyone can delete mafia players" on public.mafia_players for delete using (true);

-- Auto-generate 6-digit lobby code
create or replace function public.generate_mafia_code()
returns trigger language plpgsql as $$
declare
  new_code text;
  attempts integer := 0;
begin
  loop
    new_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    exit when not exists (select 1 from public.mafia_lobbies where code = new_code);
    attempts := attempts + 1;
    if attempts > 100 then
      raise exception 'Could not generate unique mafia lobby code';
    end if;
  end loop;
  new.code := new_code;
  return new;
end;
$$;

create trigger set_mafia_code
  before insert on public.mafia_lobbies
  for each row
  execute function public.generate_mafia_code();

-- Atomic JSONB merge for night actions (avoids race conditions)
create or replace function public.merge_mafia_night_action(p_lobby_id uuid, p_patch jsonb)
returns void language sql security definer as $$
  update public.mafia_lobbies
  set night_actions = night_actions || p_patch
  where id = p_lobby_id;
$$;

-- Atomic day vote cast
create or replace function public.cast_mafia_day_vote(p_lobby_id uuid, p_voter_id text, p_target_id text)
returns void language sql security definer as $$
  update public.mafia_lobbies
  set day_votes = day_votes || jsonb_build_object(p_voter_id, p_target_id)
  where id = p_lobby_id;
$$;
