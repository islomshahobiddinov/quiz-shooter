-- Checkers (shashka) tables

create table public.checkers_lobbies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default '',
  status text not null default 'waiting',   -- waiting | playing | finished
  board jsonb not null default '[]',         -- Board: 64-element array
  current_color text not null default 'red', -- red | blue
  winner text default null,                  -- red | blue
  created_at timestamptz default now(),
  started_at timestamptz default null,
  finished_at timestamptz default null
);

create table public.checkers_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.checkers_lobbies(id) on delete cascade,
  username text not null,
  is_host boolean default false,
  color text not null default 'red',         -- red | blue
  joined_at timestamptz default now()
);

-- Enable realtime
alter publication supabase_realtime add table public.checkers_lobbies;
alter publication supabase_realtime add table public.checkers_players;

-- RLS
alter table public.checkers_lobbies enable row level security;
alter table public.checkers_players enable row level security;

create policy "anyone can read checkers lobbies"   on public.checkers_lobbies for select using (true);
create policy "anyone can insert checkers lobbies" on public.checkers_lobbies for insert with check (true);
create policy "anyone can update checkers lobbies" on public.checkers_lobbies for update using (true);

create policy "anyone can read checkers players"   on public.checkers_players for select using (true);
create policy "anyone can insert checkers players" on public.checkers_players for insert with check (true);
create policy "anyone can update checkers players" on public.checkers_players for update using (true);
create policy "anyone can delete checkers players" on public.checkers_players for delete using (true);

-- Auto-generate 6-digit lobby code
create or replace function public.generate_checkers_code()
returns trigger language plpgsql as $$
declare
  new_code text;
  attempts integer := 0;
begin
  loop
    new_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    exit when not exists (select 1 from public.checkers_lobbies where code = new_code);
    attempts := attempts + 1;
    if attempts > 100 then
      raise exception 'Could not generate unique checkers lobby code';
    end if;
  end loop;
  new.code := new_code;
  return new;
end;
$$;

create trigger set_checkers_code
  before insert on public.checkers_lobbies
  for each row
  execute function public.generate_checkers_code();

-- Atomic move: update full board state and switch current_color
create or replace function public.make_checkers_move(
  p_lobby_id uuid,
  p_board jsonb,
  p_next_color text,
  p_winner text   -- null | 'red' | 'blue'
)
returns void language plpgsql security definer as $$
begin
  if p_winner is not null then
    update public.checkers_lobbies
    set board         = p_board,
        current_color = p_next_color,
        status        = 'finished',
        winner        = p_winner,
        finished_at   = now()
    where id = p_lobby_id;
  else
    update public.checkers_lobbies
    set board         = p_board,
        current_color = p_next_color
    where id = p_lobby_id;
  end if;
end;
$$;
