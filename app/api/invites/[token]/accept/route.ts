import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// POST /api/invites/[token]/accept
// Body: { name: string, phone: string }
// Cria ou recupera perfil → adiciona ao grupo → marca convite como aceito → registra evento.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const name: string  = (body.name  ?? '').toString().trim();
  const phone: string = (body.phone ?? '').toString().replace(/\D/g, '');

  if (!name)  return NextResponse.json({ error: 'Nome é obrigatório.' },  { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Telefone é obrigatório.' }, { status: 400 });

  const supabase = await createSupabaseAdminClient();

  // 1. Valida o convite
  const { data: invite, error: inviteErr } = await supabase
    .from('invites')
    .select('id, group_id, status, expires_at, phone')
    .eq('token', token)
    .maybeSingle();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este convite expirou.' }, { status: 410 });
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Convite inválido ou já utilizado.' }, { status: 409 });
  }

  // 2. Cria ou recupera perfil (upsert por telefone)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .upsert({ name, phone }, { onConflict: 'phone', ignoreDuplicates: false })
    .select()
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 });
  }

  // 3. Adiciona ao grupo (ignora se já for membro)
  await supabase
    .from('group_members')
    .upsert(
      { group_id: invite.group_id, profile_id: profile.id, role: 'member' },
      { onConflict: 'group_id,profile_id', ignoreDuplicates: true },
    );

  // 4. Marca o convite como aceito
  await supabase
    .from('invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  // 5. Registra eventos no feed social
  await supabase.from('activity_events').insert([
    {
      type:       'invite_accepted',
      group_id:   invite.group_id,
      profile_id: profile.id,
      metadata:   { channel: 'link', phone: phone.slice(0, 4) + '****' },
    },
    {
      type:       'member_joined',
      group_id:   invite.group_id,
      profile_id: profile.id,
      metadata:   { name },
    },
  ]);

  return NextResponse.json({
    profile_id: profile.id,
    group_id:   invite.group_id,
    name:       profile.name,
  });
}
