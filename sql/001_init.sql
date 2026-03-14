create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_live boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed_knots double precision,
  heading double precision,
  source text default 'manual',
  created_at timestamptz not null default now()
);

insert into public.sessions (title, is_live)
select 'Sessão inicial Nautimar Live', true
where not exists (
  select 1 from public.sessions where is_live = true
);

alter table public.sessions enable row level security;
alter table public.positions enable row level security;

create policy "public can read live sessions"
on public.sessions
for select
using (true);

create policy "public can read positions"
on public.positions
for select
using (true);