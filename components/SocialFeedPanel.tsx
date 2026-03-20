'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { listActivityEvents } from '@/lib/social';
import type { ActivityEvent, ActivityEventType } from '@/lib/types';

const C = {
  surface:   '#0f1623',
  border:    'rgba(0,212,255,0.10)',
  cyan:      '#00d4ff',
  cyanDim:   'rgba(0,212,255,0.10)',
  green:     '#00ff88',
  greenDim:  'rgba(0,255,136,0.10)',
  orange:    '#ff8c00',
  orangeDim: 'rgba(255,140,0,0.10)',
  red:       '#ff3b3b',
  text:      '#e8edf5',
  muted:     'rgba(232,237,245,0.40)',
  subtle:    'rgba(232,237,245,0.18)',
};

type EventConfig = {
  icon:  string;
  label: string;
  color: string;
  dim:   string;
};

const EVENT_CONFIG: Record<ActivityEventType, EventConfig> = {
  invite_created:  { icon: '✉️',  label: 'Convite enviado',       color: C.orange, dim: C.orangeDim },
  invite_accepted: { icon: '✅',  label: 'Convite aceito',        color: C.green,  dim: C.greenDim  },
  member_joined:   { icon: '👤',  label: 'Membro entrou',         color: C.cyan,   dim: C.cyanDim   },
  location_shared: { icon: '📍',  label: 'Localização ativada',   color: C.cyan,   dim: C.cyanDim   },
  location_updated:{ icon: '🔄',  label: 'Posição atualizada',    color: C.subtle, dim: 'transparent'},
  location_stopped:{ icon: '📵',  label: 'Localização encerrada', color: C.orange, dim: C.orangeDim },
  check_in:        { icon: '📌',  label: 'Check-in realizado',    color: C.green,  dim: C.greenDim  },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60)  return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

// Filtra eventos muito frequentes (location_updated) para não poluir o feed
function shouldShow(event: ActivityEvent): boolean {
  return event.type !== 'location_updated';
}

export default function SocialFeedPanel() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof createSupabaseBrowserClient>['channel'] extends ((...args: any[]) => infer R) ? R : never | null>(null);

  // Carga inicial
  useEffect(() => {
    listActivityEvents(40)
      .then(evs => setEvents(evs.filter(shouldShow)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Supabase Realtime — ouve novos eventos sociais em tempo real
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('social-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events' },
        (payload) => {
          const newEvent = payload.new as ActivityEvent;
          if (shouldShow(newEvent)) {
            setEvents(prev => [newEvent, ...prev].slice(0, 50));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalShown = events.length;

  return (
    <div style={{
      width: 300, minWidth: 280,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📡</span>
          <span style={{
            fontSize: 13, fontWeight: 700, color: C.cyan,
            fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Feed Social
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Indicador live */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: C.green,
              boxShadow: `0 0 6px ${C.green}`,
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>LIVE</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: C.cyanDim, color: C.cyan,
            border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '1px 7px',
          }}>
            {totalShown}
          </span>
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
            Carregando eventos...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '40px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: 13, color: C.muted }}>
              Nenhum evento ainda. Os eventos aparecerão aqui assim que membros interagirem nos grupos.
            </p>
          </div>
        ) : (
          events.map((ev, i) => {
            const cfg = EVENT_CONFIG[ev.type] ?? {
              icon: '•', label: ev.type, color: C.muted, dim: 'transparent',
            };

            return (
              <div
                key={ev.id}
                style={{
                  padding: '11px 18px',
                  borderBottom: i < events.length - 1 ? `1px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Ícone do evento */}
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: cfg.dim,
                  border: `1px solid ${cfg.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {cfg.icon}
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: cfg.color,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: C.subtle, flexShrink: 0, fontFamily: 'Roboto Mono, monospace' }}>
                      {timeAgo(ev.created_at)}
                    </span>
                  </div>

                  {/* Linha secundária */}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.profile?.name && <span>{ev.profile.name}</span>}
                    {ev.profile?.name && ev.group?.name && <span> · </span>}
                    {ev.group && (
                      <span style={{ color: ev.group.color ?? C.cyan }}>
                        {ev.group.icon ? `${ev.group.icon} ` : ''}{ev.group.name}
                      </span>
                    )}
                    {!ev.profile?.name && !ev.group?.name && (
                      <span>{ev.type}</span>
                    )}
                  </div>

                  {/* Metadata extra (check-in message, etc) */}
                  {ev.type === 'check_in' && ev.metadata?.message && (
                    <div style={{
                      fontSize: 11, color: C.muted,
                      marginTop: 4, padding: '3px 6px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 4, fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      "{String(ev.metadata.message)}"
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
