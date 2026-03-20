# NumbatNET — Memória do Projeto

## Stack
- Next.js 15 / React 19 / TypeScript (strict: false)
- Supabase (auth + DB + Realtime)
- MapLibre GL v5 (dark-matter tile style)
- Bootstrap 5 + inline styles com tokens C
- Sem Tailwind

## Supabase — funções de client
- Browser: `createSupabaseBrowserClient()` de `@/lib/supabase`
- Server (SSR): `createSupabaseServerClient()` de `@/lib/supabase-server`
- Admin (service role): `createSupabaseAdminClient()` de `@/lib/supabase-server`

## Design tokens
Constante `C` definida em `AdminClientPage.tsx` e replicada nos novos componentes:
cyan=#00d4ff, green=#00ff88, orange=#ff8c00, red=#ff3b3b, bg=#080b12, surface=#0f1623

## Estrutura principal
- `app/admin/AdminClientPage.tsx` — dashboard admin (1200+ linhas, client, inline styles)
- `components/LiveMap.tsx` — MapLibre GL, agora suporta `groupMembers?: MemberWithLocation[]`
- `lib/types.ts` — tipos base + tipos sociais (Group, Profile, Invite, MemberLocation, etc)

## Camada social (MVP implementado — Março 2026)
### Arquivos novos criados:
- `sql/003_social.sql` — schema completo (groups, profiles, group_members, invites, member_locations, check_ins, activity_events)
- `lib/groups.ts` — CRUD de grupos (browser client)
- `lib/invites.ts` — criação/listagem de convites + buildWhatsAppLink
- `lib/social.ts` — events, locations, check-ins
- `hooks/useGeolocation.ts` — captureOnce + startWatching/stopWatching
- `app/api/invites/[token]/route.ts` — GET convite público
- `app/api/invites/[token]/accept/route.ts` — POST aceitar convite (service role)
- `app/join/[token]/page.tsx` + `JoinForm.tsx` — rota pública de entrada em grupo
- `app/admin/groups/GroupsPanel.tsx` — painel de grupos no admin
- `app/admin/groups/CreateGroupModal.tsx` — formulário de criação/edição
- `app/admin/groups/InviteMemberModal.tsx` — fluxo de convite por telefone
- `components/SocialFeedPanel.tsx` — feed social com Realtime

### Princípio arquitetural central:
**Telefone ≠ Localização.**
- Telefone = identificação + envio de convite
- Localização = só existe após abertura do link + permissão Geolocation API

## Integração no admin
- Nav item "Grupos" adicionado ao NAV_ITEMS (id: 'grupos', icon: 'groups')
- `activeSection === 'grupos'` → renderiza `<GroupsPanel />`
- EventsPanel mock substituído por `<SocialFeedPanel />` (Realtime)
- `adminEmail` capturado da sessão Supabase e passado ao GroupsPanel

## Profile persistence (join page)
- Após aceitar convite: `profile_id` e `group_id` salvos no localStorage
- Chaves: `nb_profile_id`, `nb_group_id`, `nb_name`

## Fluxo de convite
1. Admin cria convite → token gerado client-side (crypto.getRandomValues)
2. Link: `${NEXT_PUBLIC_SITE_URL}/join/${token}`
3. WhatsApp link automático: `wa.me/55{phone}?text=...`
4. Convidado acessa `/join/[token]` → preenche nome + telefone
5. POST `/api/invites/[token]/accept` (service role) → cria perfil, adiciona ao grupo, registra eventos
6. Opcional: compartilhar localização via Geolocation API

## Comandos para executar SQL
Execute `sql/003_social.sql` no SQL Editor do Supabase Dashboard.
