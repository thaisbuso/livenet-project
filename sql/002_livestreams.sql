-- Tabela para gerenciar livestreams do YouTube
create table if not exists public.livestreams (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Índice para buscar live ativa rapidamente
create index idx_livestreams_status on public.livestreams(status) where status = 'active';

-- RLS policies
alter table public.livestreams enable row level security;

-- Público pode ler livestreams
create policy "public can read livestreams"
on public.livestreams
for select
using (true);

-- Apenas usuários autenticados podem criar/atualizar livestreams
create policy "authenticated users can insert livestreams"
on public.livestreams
for insert
with check (auth.role() = 'authenticated');

create policy "authenticated users can update livestreams"
on public.livestreams
for update
using (auth.role() = 'authenticated');
