import { createSupabaseBrowserClient } from '@/lib/supabase';
import type { Invite } from '@/lib/types';

// Validação básica de telefone: apenas dígitos, 10-15 caracteres
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Normaliza para somente dígitos
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Gera token aleatório de 32 caracteres hex (client-side)
export function generateToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constrói o link público de aceite de convite
export function buildInviteLink(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/join/${token}`;
}

// Monta link de WhatsApp com mensagem pré-preenchida
export function buildWhatsAppLink(phone: string, groupName: string, inviteLink: string): string {
  const digits = normalizePhone(phone);
  const text = encodeURIComponent(
    `Você foi convidado para o grupo "${groupName}" no NumbatNET!\n\nAcesse o link para entrar: ${inviteLink}`,
  );
  return `https://wa.me/55${digits}?text=${text}`;
}

export type CreateInviteInput = {
  group_id: string;
  phone: string;
  channel: 'whatsapp' | 'sms';
  invited_by?: string;
};

export async function createInvite(input: CreateInviteInput): Promise<Invite> {
  const supabase = createSupabaseBrowserClient();
  const token = generateToken();
  const phone = normalizePhone(input.phone);

  const { data, error } = await supabase
    .from('invites')
    .insert({
      group_id:   input.group_id,
      phone,
      channel:    input.channel,
      token,
      invited_by: input.invited_by || null,
      status:     'pending',
    })
    .select('*, group:groups(*)')
    .single();

  if (error) throw error;
  return data as Invite;
}

export async function listInvites(groupId?: string): Promise<Invite[]> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from('invites')
    .select('*, group:groups(*)')
    .order('created_at', { ascending: false });
  if (groupId) query = query.eq('group_id', groupId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Invite[];
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('invites')
    .select('*, group:groups(*)')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function cancelInvite(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('invites')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}
