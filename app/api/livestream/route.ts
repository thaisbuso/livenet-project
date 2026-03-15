import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Buscar livestream ativa
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('livestreams')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ livestream: data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar livestream' }, { status: 500 });
  }
}

// POST: Criar nova livestream
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { youtube_url } = body;

    if (!youtube_url || typeof youtube_url !== 'string') {
      return NextResponse.json({ error: 'URL do YouTube é obrigatória' }, { status: 400 });
    }

    // Verificar se já existe uma livestream ativa
    const { data: existingLive } = await supabase
      .from('livestreams')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    if (existingLive) {
      return NextResponse.json(
        { error: 'Já existe uma livestream ativa. Finalize a anterior antes de iniciar uma nova.' },
        { status: 400 }
      );
    }

    // Criar nova livestream
    const { data: newLivestream, error: insertError } = await supabase
      .from('livestreams')
      .insert({
        youtube_url,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ livestream: newLivestream }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar livestream' }, { status: 500 });
  }
}

// PATCH: Finalizar livestream ativa
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar livestream ativa
    const { data: activeLive } = await supabase
      .from('livestreams')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    if (!activeLive) {
      return NextResponse.json({ error: 'Nenhuma livestream ativa encontrada' }, { status: 404 });
    }

    // Finalizar livestream
    const { data: updatedLivestream, error: updateError } = await supabase
      .from('livestreams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', activeLive.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ livestream: updatedLivestream });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao finalizar livestream' }, { status: 500 });
  }
}
