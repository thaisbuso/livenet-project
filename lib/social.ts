import { createSupabaseBrowserClient } from '@/lib/supabase';
import type { ActivityEvent, ActivityEventType, CheckIn, MemberWithLocation } from '@/lib/types';

// ─── Activity Events ──────────────────────────────────────────────────────────

export async function logEvent(
  type: ActivityEventType,
  groupId: string | null,
  profileId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase.from('activity_events').insert({
    type,
    group_id:  groupId,
    profile_id: profileId,
    metadata:  metadata ?? null,
  });
}

export async function listActivityEvents(limit = 30, sessionId?: string): Promise<ActivityEvent[]> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from('activity_events')
    .select('*, group:groups(id,name,color,session_id), profile:profiles(id,name,phone)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (sessionId) {
    const { data: groups } = await supabase.from('groups').select('id').eq('session_id', sessionId);
    const groupIds = (groups ?? []).map((g: { id: string }) => g.id);
    if (groupIds.length === 0) return [];
    query = query.in('group_id', groupIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ActivityEvent[];
}

// ─── Member Locations ─────────────────────────────────────────────────────────
// Localização só existe após consentimento explícito do usuário.
// Telefone e localização são sempre entidades separadas.

export async function upsertMemberLocation(
  profileId: string,
  groupId: string,
  lat: number,
  lng: number,
  accuracy: number | null,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from('member_locations')
    .upsert(
      {
        profile_id: profileId,
        group_id:   groupId,
        lat,
        lng,
        accuracy,
        is_sharing: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' },
    );

  if (error) throw error;

  // Registra evento de atualização de localização no feed social
  await logEvent('location_updated', groupId, profileId, { lat, lng });
}

export async function startSharingLocation(
  profileId: string,
  groupId: string,
  lat: number,
  lng: number,
  accuracy: number | null,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from('member_locations')
    .upsert(
      {
        profile_id: profileId,
        group_id:   groupId,
        lat,
        lng,
        accuracy,
        is_sharing: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' },
    );

  if (error) throw error;
  await logEvent('location_shared', groupId, profileId, { lat, lng });
}

export async function stopSharingLocation(profileId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('member_locations')
    .update({ is_sharing: false, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId);
  if (error) throw error;
  await logEvent('location_stopped', null, profileId);
}

export async function listMembersWithLocation(groupId?: string): Promise<MemberWithLocation[]> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from('member_locations')
    .select('*, profile:profiles(*), group:groups(*)')
    .eq('is_sharing', true);
  if (groupId) query = query.eq('group_id', groupId);
  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    profile:  row.profile,
    group:    row.group,
    location: {
      id:         row.id,
      profile_id: row.profile_id,
      group_id:   row.group_id,
      lat:        row.lat,
      lng:        row.lng,
      accuracy:   row.accuracy,
      is_sharing: row.is_sharing,
      updated_at: row.updated_at,
    },
  }));
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function createCheckIn(input: {
  profile_id: string;
  group_id:   string;
  lat?:       number;
  lng?:       number;
  message?:   string;
}): Promise<CheckIn> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      profile_id: input.profile_id,
      group_id:   input.group_id,
      lat:        input.lat    ?? null,
      lng:        input.lng    ?? null,
      message:    input.message ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await logEvent('check_in', input.group_id, input.profile_id, { message: input.message });
  return data as CheckIn;
}
