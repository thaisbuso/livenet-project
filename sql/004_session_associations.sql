-- 003_session_associations.sql
-- Associa grupos e livestreams a sessões, e permite o admin gerenciar sessões

-- 1. Adiciona session_id à tabela groups
alter table public.groups
  add column if not exists session_id uuid references public.sessions(id) on delete cascade;

-- 2. Adiciona session_id à tabela livestreams
alter table public.livestreams
  add column if not exists session_id uuid references public.sessions(id) on delete cascade;

-- 3. Índices para performance
create index if not exists idx_groups_session_id on public.groups(session_id);
create index if not exists idx_livestreams_session_id on public.livestreams(session_id);

-- 4. Permite que usuários autenticados criem sessões
create policy "authenticated can insert sessions"
  on public.sessions for insert
  with check (auth.role() = 'authenticated');

-- 5. Permite que usuários autenticados editem sessões
create policy "authenticated can update sessions"
  on public.sessions for update
  using (auth.role() = 'authenticated');

-- 6. Permite que usuários autenticados excluam sessões
create policy "authenticated can delete sessions"
  on public.sessions for delete
  using (auth.role() = 'authenticated');

-- 7. Permite que usuários autenticados criem grupos
create policy "authenticated can insert groups"
  on public.groups for insert
  with check (auth.role() = 'authenticated');

-- 8. Permite que usuários autenticados editem grupos
create policy "authenticated can update groups"
  on public.groups for update
  using (auth.role() = 'authenticated');

-- 9. Permite que usuários autenticados excluam grupos
create policy "authenticated can delete groups"
  on public.groups for delete
  using (auth.role() = 'authenticated');
