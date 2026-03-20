import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// Função para calcular distância entre dois pontos usando fórmula de Haversine
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient();

    const sessionId = req.nextUrl.searchParams.get('session_id');

    let sessionQuery = supabase.from('sessions').select('*');
    if (sessionId) {
      sessionQuery = sessionQuery.eq('id', sessionId);
    } else {
      sessionQuery = sessionQuery.eq('is_live', true).order('created_at', { ascending: false }).limit(1);
    }

    const { data: session, error: sessionError } = await sessionQuery.maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Nenhuma sessão encontrada', stats: null }, { status: 404 });
    }

    // Buscar todas as posições da sessão, ordenadas por tempo
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (positionsError) {
      return NextResponse.json({ error: positionsError.message }, { status: 500 });
    }

    // Calcular distância total percorrida
    let totalDistance = 0;
    if (positions && positions.length > 1) {
      for (let i = 1; i < positions.length; i++) {
        totalDistance += calculateDistance(
          positions[i - 1].lat, positions[i - 1].lng,
          positions[i].lat, positions[i].lng,
        );
      }
    }

    const startTime = new Date(session.created_at).getTime();
    const endTime = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    const durationMs = endTime - startTime;

    // Busca livestreams associadas à sessão via session_id
    const { data: livestreams } = await supabase
      .from('livestreams')
      .select('*')
      .eq('session_id', session.id)
      .order('started_at', { ascending: true });

    const stats = {
      sessionId: session.id,
      sessionTitle: session.title,
      isLive: session.is_live,
      startedAt: session.created_at,
      endedAt: session.ended_at,
      distanceKm: parseFloat(totalDistance.toFixed(2)),
      durationDays: parseFloat((durationMs / (1000 * 60 * 60 * 24)).toFixed(2)),
      durationMs,
      positionsCount: positions?.length || 0,
      livestreamsCount: livestreams?.length || 0,
      livestreams: livestreams || [],
    };

    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: 'Erro interno ao calcular estatísticas' }, { status: 500 });
  }
}
