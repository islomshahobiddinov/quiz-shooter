-- Tic Tac Toe tables

create table public.ttt_lobbies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default '',
  status text not null default 'waiting',         -- waiting | playing | finished
  board jsonb default '["","","","","","","","",""]', -- 9 cells: '' | 'X' | 'O'
  current_symbol text not null default 'X',        -- whose turn: 'X' | 'O'
  winner text default null,                        -- 'X' | 'O' | 'draw'
  created_at timestamptz default now(),
  started_at timestamptz default null,
  finished_at timestamptz default null
);

create table public.ttt_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.ttt_lobbies(id) on delete cascade,
  username text not null,
  is_host boolean default false,
  symbol text not null default 'X',               -- 'X' | 'O'
  joined_at timestamptz default now()
);

-- Enable realtime
alter publication supabase_realtime add table public.ttt_lobbies;
alter publication supabase_realtime add table public.ttt_players;

-- RLS
alter table public.ttt_lobbies enable row level security;
alter table public.ttt_players enable row level security;

create policy "anyone can read ttt lobbies"   on public.ttt_lobbies for select using (true);
create policy "anyone can insert ttt lobbies" on public.ttt_lobbies for insert with check (true);
create policy "anyone can update ttt lobbies" on public.ttt_lobbies for update using (true);

create policy "anyone can read ttt players"   on public.ttt_players for select using (true);
create policy "anyone can insert ttt players" on public.ttt_players for insert with check (true);
create policy "anyone can update ttt players" on public.ttt_players for update using (true);
create policy "anyone can delete ttt players" on public.ttt_players for delete using (true);

-- Auto-generate 6-digit lobby code
create or replace function public.generate_ttt_code()
returns trigger language plpgsql as $$
declare
  new_code text;
  attempts integer := 0;
begin
  loop
    new_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    exit when not exists (select 1 from public.ttt_lobbies where code = new_code);
    attempts := attempts + 1;
    if attempts > 100 then
      raise exception 'Could not generate unique ttt lobby code';
    end if;
  end loop;
  new.code := new_code;
  return new;
end;
$$;

create trigger set_ttt_code
  before insert on public.ttt_lobbies
  for each row
  execute function public.generate_ttt_code();

-- Atomic move: update board cell and flip current_symbol
create or replace function public.make_ttt_move(
  p_lobby_id uuid,
  p_cell_index integer,
  p_symbol text,
  p_next_symbol text,
  p_winner text   -- null | 'X' | 'O' | 'draw'
)
returns void language plpgsql security definer as $$
declare
  v_board jsonb;
begin
  select board into v_board
  from public.ttt_lobbies
  where id = p_lobby_id
  for update;

  if (v_board ->> p_cell_index) != '' then
    raise exception 'Cell already taken';
  end if;

  v_board := jsonb_set(v_board, array[p_cell_index::text], to_jsonb(p_symbol));

  if p_winner is not null then
    update public.ttt_lobbies
    set board          = v_board,
        current_symbol = p_next_symbol,
        status         = 'finished',
        winner         = p_winner,
        finished_at    = now()
    where id = p_lobby_id;
  else
    update public.ttt_lobbies
    set board          = v_board,
        current_symbol = p_next_symbol
    where id = p_lobby_id;
  end if;
end;
$$;
