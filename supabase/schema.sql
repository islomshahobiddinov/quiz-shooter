-- Quiz Shooter — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_user_id_idx on public.quizzes (user_id);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quizzes_updated_at on public.quizzes;
create trigger set_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

-- Row Level Security: each user can only access their own quizzes
alter table public.quizzes enable row level security;

drop policy if exists "Users select own quizzes" on public.quizzes;
create policy "Users select own quizzes"
  on public.quizzes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own quizzes" on public.quizzes;
create policy "Users insert own quizzes"
  on public.quizzes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own quizzes" on public.quizzes;
create policy "Users update own quizzes"
  on public.quizzes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own quizzes" on public.quizzes;
create policy "Users delete own quizzes"
  on public.quizzes for delete
  using (auth.uid() = user_id);
