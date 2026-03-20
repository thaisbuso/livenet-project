import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// GET /api/invites/[token]
// Retorna dados públicos do convite para a página de aceite.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, status, expires_at, channel, group:groups(id, name, description, color, icon)')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 });
  }

  // Valida expiração
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este convite expirou.' }, { status: 410 });
  }

  if (invite.status === 'cancelled') {
    return NextResponse.json({ error: 'Este convite foi cancelado.' }, { status: 410 });
  }

  if (invite.status === 'accepted') {
    return NextResponse.json({ error: 'Este convite já foi aceito.', already_accepted: true }, { status: 409 });
  }

  // Retorna apenas o necessário para a página pública
  return NextResponse.json({ invite });
}
