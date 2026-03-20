import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed_knots: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  source: z.string().optional(),
  session_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Validar sess\u00e3o do Supabase ao inv\u00e9s de token fixo
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
    }

    const dbClient = env.supabaseServiceRoleKey
      ? await createSupabaseAdminClient()
      : supabase;

    let sessionId = parsed.data.session_id;

    if (sessionId) {
      const { data: sessionData } = await dbClient
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();

      if (!sessionData) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
      }
    } else {
      const { data: sessionData } = await dbClient
        .from('sessions')
        .select('id')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sessionData) {
        return NextResponse.json({ error: 'Nenhuma sessão ao vivo encontrada' }, { status: 404 });
      }

      sessionId = sessionData.id;
    }

    const { data, error } = await dbClient
      .from('positions')
      .insert({
        session_id: sessionId,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        speed_knots: parsed.data.speed_knots ?? null,
        heading: parsed.data.heading ?? null,
        source: parsed.data.source ?? 'api',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, position: data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}