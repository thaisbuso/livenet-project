'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import type { Session } from '@/lib/types';
import BrazilTimeClock from '@/components/BrazilTimeClock';

export default function LiveIndexPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();

      // Try to redirect to the most recent active session
      const { data: activeSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        router.replace(`/live/${activeSession.id}`);
        return;
      }

      // No active session — show all sessions so user can pick one
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setSessions((allSessions ?? []) as Session[]);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080b12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Rajdhani, sans-serif', color: '#00d4ff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>CARREGANDO...</div>
          <div style={{ width: 40, height: 2, background: '#00d4ff', margin: '0 auto', animation: 'none' }} />
        </div>
      </div>
    );
  }

  const C = {
    bg: '#080b12', surface: '#0f1623', border: 'rgba(0,212,255,0.10)',
    cyan: '#00d4ff', cyanDim: 'rgba(0,212,255,0.12)', green: '#00ff88',
    text: '#e8edf5', muted: 'rgba(232,237,245,0.40)',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Rajdhani, sans-serif' }}>
      <header style={{
        background: '#0b0f1a', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, gap: 16,
      }}>
        <span style={{ fontFamily: 'Audiowide, cursive', fontSize: 14, color: C.cyan, letterSpacing: 1 }}>NexariOS</span>
        <span style={{ fontSize: 11, color: C.muted }}>by NumbatNET</span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, fontFamily: 'Roboto Mono, monospace', color: C.muted }}>
          <BrazilTimeClock />
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Nenhuma sessão disponível</div>
            <div style={{ fontSize: 13 }}>Aguarde o início de uma sessão ao vivo.</div>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sessões Disponíveis
            </h1>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
              Selecione uma sessão para assistir ao vivo ou revisar o trajeto.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/live/${s.id}`)}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.25)'; (e.currentTarget as HTMLElement).style.background = '#111827'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surface; }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: s.is_live ? C.green : C.muted,
                    boxShadow: s.is_live ? `0 0 8px ${C.green}` : 'none',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                      {s.is_live ? '● AO VIVO' : '○ Encerrada'} · {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

