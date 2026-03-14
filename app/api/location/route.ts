import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { supabaseAdmin, supabaseBrowser } from '@/lib/supabase';

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed_knots: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  source: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();

    if (!env.adminSharedToken || token !== env.adminSharedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = supabaseAdmin || supabaseBrowser;

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: 'Nenhuma sessão ao vivo encontrada' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('positions')
      .insert({
        session_id: session.id,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        speed_knots: parsed.data.speed_knots ?? null,
        heading: parsed.data.heading ?? null,
        source: parsed.data.source ?? 'api'
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