'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import BrazilTimeClock from '@/components/BrazilTimeClock';
import TelemetryOverlay from '@/components/live/TelemetryOverlay';
import LiveSidePanel from '@/components/live/LiveSidePanel';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Position, Session, Livestream } from '@/lib/types';
import '../live.css';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });
const PROFILE_IMAGE_URL = process.env.NEXT_PUBLIC_PROFILE_IMAGE_URL ?? '/assets/numbat.png';

type Stats = {
  distanceKm: number;
  durationMs: number;
  livestreamsCount: number;
};

function formatDuration(ms: number): string {
  const totalHours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (totalHours > 0) return `${totalHours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function LiveSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession]               = useState<Session | null>(null);
  const [positions, setPositions]           = useState<Position[]>([]);
  const [activeLivestream, setActiveLivestream] = useState<Livestream | null>(null);
  const [stats, setStats]                   = useState<Stats | null>(null);
  const [darkMap, setDarkMap]               = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      // Load the specific session by ID
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      setSession(sessionData ?? null);

      // Load positions for this session
      const { data: positionsData } = await supabase
        .from('positions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(100);
      setPositions(positionsData ?? []);

      // Load active livestream for this session
      const { data: livestreamData } = await supabase
        .from('livestreams')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveLivestream(livestreamData ?? null);
    }

    async function loadStats() {
      try {
        const res = await fetch(`/api/session/stats?session_id=${sessionId}`);
        const data = await res.json();
        if (res.ok && data.stats) setStats(data.stats);
      } catch { /* silently ignore */ }
    }

    loadData();
    loadStats();

    const interval = setInterval(() => { loadData(); loadStats(); }, 30000);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`livestreams-${sessionId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'livestreams', filter: `session_id=eq.${sessionId}` },
        loadData,
      )
      .subscribe();

    return () => { clearInterval(interval); channel.unsubscribe(); };
  }, [sessionId]);

  const latestPos = positions[0];
  const avgSpeed = latestPos?.speed_knots
    ? `${(latestPos.speed_knots * 1.852).toFixed(1)} km/h`
    : '0 km/h';

  return (
    <div className="live-dashboard">

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <header className="live-header">
        <span className="live-header-logo">NexariOS</span>
        <span className="live-header-sub">by NumbatNET</span>

        <div className="live-header-sep" />

        {session && (
          <span style={{ fontSize: 12, color: 'rgba(232,237,245,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>
            {session.title}
          </span>
        )}

        <div className="live-header-pills">
          {session?.is_live && (
            <span className="h-pill h-pill-cyan">
              <span className="h-pill-dot" />
              AO VIVO
            </span>
          )}
          {stats && (
            <>
              <span className="h-pill h-pill-cyan">
                {stats.distanceKm.toFixed(0)} km
              </span>
              <span className="h-pill h-pill-cyan">
                {formatDuration(stats.durationMs)}
              </span>
            </>
          )}
        </div>

        <div className="live-header-right">
          <span className={`h-badge ${session?.is_live ? 'h-badge-live' : 'h-badge-offline'}`}>
            {session?.is_live ? '● AO VIVO' : '○ OFFLINE'}
          </span>
          <button className="h-btn">GPS</button>
          <div className="h-clock">
            <BrazilTimeClock />
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          BODY
      ════════════════════════════════════════ */}
      <div className="live-body">

        {/* ── LEFT: MAP ── */}
        <div className="live-map-col">
          <div className="map-panel">

            {/* Floating top strip */}
            <div className="map-panel-header">
              <span className="map-chip">MAPA GLOBAL</span>
              <button className="map-toggle" onClick={() => setDarkMap(d => !d)}>
                {darkMap ? '☾ Noturno' : '☀ Diurno'}
              </button>
            </div>

            {/* Telemetry overlay */}
            <TelemetryOverlay
              duration={stats ? formatDuration(stats.durationMs) : '—'}
              avgSpeed={avgSpeed}
              cams={stats?.livestreamsCount ?? 0}
              viewers={0}
            />

            {/* Map fills the panel */}
            <div className="map-inner">
              <LiveMap
                positions={positions}
                darkMap={darkMap}
                profileImageUrl={PROFILE_IMAGE_URL}
              />
            </div>

          </div>
        </div>

        {/* ── RIGHT: SIDE PANEL ── */}
        <div className="live-side-col">
          <LiveSidePanel
            session={session}
            stats={stats}
            activeLivestream={activeLivestream}
            formatDuration={formatDuration}
          />
        </div>

      </div>
    </div>
  );
}
