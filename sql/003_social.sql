-- ============================================================
-- NumbatNET Social Layer — Migration 003
-- grupos, perfis, membros, convites, localizações, check-ins, eventos
-- ============================================================
--
-- ATENÇÃO: telefone ≠ localização
-- O número de celular identifica o usuário e serve para envio de convite.
-- Localização só existe após abertura do link + consentimento explícito
-- via Geolocation API do navegador. São entidades completamente separadas.
-- ============================================================

-- ─── GRUPOS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  color       text        NOT NULL DEFAULT '#00d4ff',
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_all"  ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "groups_update_auth" ON groups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "groups_delete_auth" ON groups FOR DELETE USING (auth.role() = 'authenticated');

-- ─── PERFIS ──────────────────────────────────────────────────────────────────
-- O telefone é identificador social, não localizador.
-- Não há campo de localização aqui — localização é entidade separada.

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text        NOT NULL,
  avatar     text,
  status     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_anon" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_anon" ON profiles FOR UPDATE USING (true);

-- ─── MEMBROS DE GRUPO ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid        NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_select_all"  ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_anon" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "group_members_delete_auth" ON group_members FOR DELETE USING (auth.role() = 'authenticated');

-- ─── CONVITES ────────────────────────────────────────────────────────────────
-- O convite registra o canal (whatsapp/sms) e gera um token único.
-- O telefone é usado APENAS para enviar o link — não para rastrear.

CREATE TABLE IF NOT EXISTS invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  phone       text        NOT NULL,
  channel     text        NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','sms')),
  token       text        NOT NULL UNIQUE,
  status      text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','cancelled')),
  invited_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at timestamptz
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_all"  ON invites FOR SELECT USING (true);
CREATE POLICY "invites_insert_auth" ON invites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "invites_update_anon" ON invites FOR UPDATE USING (true);

-- ─── LOCALIZAÇÕES DOS MEMBROS ────────────────────────────────────────────────
-- Entidade completamente separada do perfil/telefone.
-- Só existe após consentimento explícito: abertura do link + permissão
-- de geolocalização via browser Geolocation API.

CREATE TABLE IF NOT EXISTS member_locations (
  id         uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  group_id   uuid             REFERENCES groups(id) ON DELETE SET NULL,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  accuracy   double precision,
  is_sharing boolean          NOT NULL DEFAULT false,
  updated_at timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE member_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_locations_select_all"  ON member_locations FOR SELECT USING (true);
CREATE POLICY "member_locations_insert_anon" ON member_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "member_locations_update_anon" ON member_locations FOR UPDATE USING (true);

-- ─── CHECK-INS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS check_ins (
  id         uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id   uuid             NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
  lat        double precision,
  lng        double precision,
  message    text,
  created_at timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "check_ins_select_all"  ON check_ins FOR SELECT USING (true);
CREATE POLICY "check_ins_insert_anon" ON check_ins FOR INSERT WITH CHECK (true);

-- ─── EVENTOS DE ATIVIDADE ────────────────────────────────────────────────────
-- Feed social do painel lateral do admin.
-- Tipos: invite_created | invite_accepted | member_joined |
--        location_shared | location_updated | location_stopped | check_in

CREATE TABLE IF NOT EXISTS activity_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text        NOT NULL,
  group_id   uuid        REFERENCES groups(id)   ON DELETE CASCADE,
  profile_id uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_events_select_all"  ON activity_events FOR SELECT USING (true);
CREATE POLICY "activity_events_insert_anon" ON activity_events FOR INSERT WITH CHECK (true);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_group_members_group    ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_profile  ON group_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_invites_token          ON invites (token);
CREATE INDEX IF NOT EXISTS idx_invites_group          ON invites (group_id);
CREATE INDEX IF NOT EXISTS idx_member_locations_group ON member_locations (group_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_group  ON activity_events (group_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_time   ON activity_events (created_at DESC);
