import { createSupabaseBrowserClient } from '@/lib/supabase';
import type { Group, GroupMember } from '@/lib/types';

export type CreateGroupInput = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
};

export async function listGroups(): Promise<Group[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Group[];
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color || '#00d4ff',
      icon: input.icon || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Group;
}

export async function updateGroup(id: string, input: Partial<CreateGroupInput>): Promise<Group> {
  const supabase = createSupabaseBrowserClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined)        patch.name        = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.color !== undefined)       patch.color       = input.color;
  if (input.icon !== undefined)        patch.icon        = input.icon || null;

  const { data, error } = await supabase
    .from('groups')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Group;
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) throw error;
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return data as GroupMember[];
}

export async function removeMember(groupId: string, profileId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', profileId);
  if (error) throw error;
}
