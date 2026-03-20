export type Session = {
  id: string;
  title: string;
  is_live: boolean;
  created_at: string;
  ended_at: string | null;
};

export type Position = {
  id: string;
  session_id: string;
  lat: number;
  lng: number;
  speed_knots: number | null;
  heading: number | null;
  source: string | null;
  created_at: string;
};

export type Livestream = {
  id: string;
  youtube_url: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

// ─── Social Layer ─────────────────────────────────────────────────────────────

export type Group = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  status: string | null;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  // Joined relations (opcionais)
  profile?: Profile;
  group?: Group;
};

export type Invite = {
  id: string;
  group_id: string;
  phone: string;
  channel: 'whatsapp' | 'sms';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  // Joined
  group?: Group;
};

export type MemberLocation = {
  id: string;
  profile_id: string;
  group_id: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  is_sharing: boolean;
  updated_at: string;
};

export type CheckIn = {
  id: string;
  profile_id: string;
  group_id: string;
  lat: number | null;
  lng: number | null;
  message: string | null;
  created_at: string;
};

export type ActivityEventType =
  | 'invite_created'
  | 'invite_accepted'
  | 'member_joined'
  | 'location_shared'
  | 'location_updated'
  | 'location_stopped'
  | 'check_in';

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  group_id: string | null;
  profile_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  group?: Group;
  profile?: Profile;
};

// Tipo unificado para exibição no mapa
export type MemberWithLocation = {
  profile: Profile;
  group: Group;
  location: MemberLocation;
};