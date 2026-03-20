'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import BrazilTimeClock from '@/components/BrazilTimeClock';
import SessionStats from '@/components/SessionStats';
import SocialFeedPanel from '@/components/SocialFeedPanel';
import dynamic from 'next/dynamic';
import type { Livestream, Position } from '@/lib/types';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });
const GroupsPanel = dynamic(() => import('@/app/admin/groups/GroupsPanel'), { ssr: false });

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:        '#080b12',
  sidebar:   '#0b0f1a',
  surface:   '#0f1623',
  surfaceAlt:'#121926',
  border:    'rgba(0,212,255,0.10)',
  borderHov: 'rgba(0,212,255,0.30)',
  cyan:      '#00d4ff',
  cyanDim:   'rgba(0,212,255,0.12)',
  cyanGlow:  '0 0 18px rgba(0,212,255,0.25)',
  green:     '#00ff88',
  greenDim:  'rgba(0,255,136,0.12)',
  orange:    '#ff8c00',
  orangeDim: 'rgba(255,140,0,0.12)',
  red:       '#ff3b3b',
  redDim:    'rgba(255,59,59,0.12)',
  text:      '#e8edf5',
  muted:     'rgba(232,237,245,0.40)',
  subtle:    'rgba(232,237,245,0.18)',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  { id: 1, type: 'alert',   severity: 'high',   msg: 'Sinal fraco detectado',     sub: 'Dispositivo #NB-047 • Região Sul',       time: '2m atrás' },
  { id: 2, type: 'info',    severity: 'low',    msg: 'Nova região conectada',      sub: 'Região Norte — Pará',                    time: '8m atrás' },
  { id: 3, type: 'alert',   severity: 'medium', msg: 'Latência elevada',           sub: 'Nó #NB-012 • 340ms avg',                 time: '15m atrás' },
  { id: 4, type: 'success', severity: 'low',    msg: 'Dispositivo reconectado',    sub: '#NB-091 • Uptime restaurado',             time: '22m atrás' },
  { id: 5, type: 'alert',   severity: 'high',   msg: 'Falha de autenticação',      sub: '3 tentativas • IP 177.82.xx.xx',         time: '34m atrás' },
  { id: 6, type: 'info',    severity: 'low',    msg: 'Livestream encerrada',       sub: 'Duração: 1h 22m • 847 views',            time: '1h atrás' },
  { id: 7, type: 'success', severity: 'low',    msg: 'Backup concluído',           sub: 'Snapshot #4821 • 2.3 GB',                time: '2h atrás' },
];

const MOCK_METRICS = [
  { label: 'Dispositivos Online', value: '128',    unit: '',    color: C.cyan,   icon: 'device' },
  { label: 'Alertas Ativos',      value: '7',      unit: '',    color: C.orange, icon: 'alert'  },
  { label: 'Regiões Monitoradas', value: '12',     unit: '',    color: C.green,  icon: 'globe'  },
  { label: 'Uptime da Rede',      value: '99.92',  unit: '%',   color: C.cyan,   icon: 'pulse'  },
  { label: 'Eventos Hoje',        value: '23',     unit: '',    color: C.muted,  icon: 'log'    },
  { label: 'Sinal Fraco',         value: '4',      unit: 'disp',color: C.red,    icon: 'signal' },
];

const MOCK_ACTIVITY = [
  { id: 1, user: 'Admin',    action: 'GPS enviado',               detail: '-23.6207, -45.4138',  time: '14:32:01' },
  { id: 2, user: 'Sistema',  action: 'Livestream iniciada',        detail: 'YouTube • 1080p',     time: '14:28:44' },
  { id: 3, user: 'Admin',    action: 'Posição manual enviada',     detail: 'Fonte: browser-gps',  time: '14:21:10' },
  { id: 4, user: 'Sistema',  action: 'Sessão de monitoramento',    detail: 'Intervalo: 5s',       time: '14:15:00' },
  { id: 5, user: 'Admin',    action: 'Login autenticado',          detail: 'Supabase Auth',       time: '14:14:52' },
];

// ─── Icon registry (inline SVG) ───────────────────────────────────────────────
function Icon({ name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  const icons: Record<string, React.ReactElement> = {
    dashboard: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    map:       <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    network:   <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/><line x1="5" y1="19" x2="19" y2="19"/></svg>,
    alert:     <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    users:     <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings:  <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logout:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    bell:      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    device:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    globe:     <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    pulse:     <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    log:       <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    signal:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="6" x2="1" y2="18"/><line x1="6" y1="3" x2="6" y2="18"/><line x1="11" y1="8" x2="11" y2="18"/><line x1="16" y1="12" x2="16" y2="18"/><line x1="21" y1="15" x2="21" y2="18"/></svg>,
    live:      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
    gps:       <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
    stop:      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
    play:      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    send:      <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    pin:       <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    groups:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return icons[name] ?? <span style={{ width: size, height: size, display: 'block' }} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',   icon: 'dashboard' },
  { id: 'map',       label: 'Mapa ao Vivo', icon: 'map'       },
  { id: 'grupos',    label: 'Grupos',       icon: 'groups'    },
  { id: 'network',   label: 'Rede',        icon: 'network'   },
  { id: 'alerts',    label: 'Alertas',     icon: 'alert',    badge: 7 },
  { id: 'users',     label: 'Usuários',    icon: 'users'     },
  { id: 'settings',  label: 'Config',      icon: 'settings'  },
];

function Sidebar({ active, onNavigate, onLogout }: {
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: '100vh',
      background: C.sidebar,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 8,
            background: C.cyanDim,
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="network" size={18} color={C.cyan} />
          </div>
          <div>
            <div style={{
              fontFamily: 'Audiowide, cursive',
              fontSize: 13,
              color: C.cyan,
              letterSpacing: 1,
              lineHeight: 1.2,
            }}>NumbatNET</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>NOC Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, color: C.subtle, letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>
          Navegação
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: isActive ? `1px solid rgba(0,212,255,0.25)` : '1px solid transparent',
                background: isActive ? C.cyanDim : 'transparent',
                color: isActive ? C.cyan : C.muted,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: 0.3,
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.18s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = C.text;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = C.muted;
                }
              }}
            >
              <Icon name={item.icon} size={16} color={isActive ? C.cyan : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: C.orange, color: '#000',
                  borderRadius: 10, padding: '1px 5px',
                  lineHeight: 1.4,
                }}>{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'rgba(255,59,59,0.7)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 500,
            width: '100%',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = C.redDim;
            (e.currentTarget as HTMLElement).style.color = C.red;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,59,59,0.7)';
          }}
        >
          <Icon name="logout" size={16} color="currentColor" />
          Sair
        </button>
      </div>
    </aside>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────
function TopHeader({ autoSending, activeLivestream, liveDuration }: {
  autoSending: boolean;
  activeLivestream: Livestream | null;
  liveDuration: string;
}) {
  return (
    <header style={{
      height: 60,
      background: C.sidebar,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: C.text,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          Dashboard Admin
        </span>
        <span style={{ marginLeft: 10, fontSize: 11, color: C.muted }}>
          Central de Controle
        </span>
      </div>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '6px 12px',
      }}>
        <Icon name="search" size={14} color={C.muted} />
        <input
          className="admin-search-input"
          placeholder="Buscar dispositivo, região..."
          style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontFamily: 'Rajdhani, sans-serif', width: 180, padding: 0 }}
        />
      </div>

      {/* GPS badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: autoSending ? 'rgba(0,255,136,0.1)' : C.orangeDim,
        border: `1px solid ${autoSending ? 'rgba(0,255,136,0.3)' : 'rgba(255,140,0,0.3)'}`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: autoSending ? C.green : C.orange,
          boxShadow: autoSending ? `0 0 6px ${C.green}` : `0 0 6px ${C.orange}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: autoSending ? C.green : C.orange, fontFamily: 'Rajdhani' }}>
          {autoSending ? 'GPS ATIVO' : 'GPS PARADO'}
        </span>
      </div>

      {/* Live badge */}
      {activeLivestream && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: C.redDim,
          border: `1px solid rgba(255,59,59,0.35)`,
          animation: 'pulse 2s infinite',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.red, fontFamily: 'Rajdhani' }}>
            AO VIVO {liveDuration && `• ${liveDuration}`}
          </span>
        </div>
      )}

      {/* Bell */}
      <button style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '7px', cursor: 'pointer',
        display: 'flex', position: 'relative',
        transition: 'all 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.borderHov}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
      >
        <Icon name="bell" size={16} color={C.muted} />
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 7, height: 7, borderRadius: '50%',
          background: C.orange, border: '1px solid #080b12',
        }} />
      </button>

      {/* Clock */}
      <div style={{
        fontSize: 12, fontFamily: 'Roboto Mono, monospace',
        color: C.muted, whiteSpace: 'nowrap',
      }}>
        <BrazilTimeClock />
      </div>
    </header>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, color, icon }: {
  label: string; value: string; unit: string; color: string; icon: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: C.surface,
        border: `1px solid ${hovered ? color + '44' : C.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'all 0.2s',
        boxShadow: hovered ? `0 0 20px ${color}1a` : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Rajdhani' }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28,
          borderRadius: 7,
          background: color + '18',
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 700,
          fontFamily: 'Rajdhani, sans-serif',
          color: color,
          lineHeight: 1,
          textShadow: hovered ? `0 0 20px ${color}80` : 'none',
        }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─── Events Panel ─────────────────────────────────────────────────────────────
const SEVERITY = {
  high:   { color: C.red,    bg: C.redDim    },
  medium: { color: C.orange, bg: C.orangeDim },
  low:    { color: C.green,  bg: C.greenDim  },
};

function EventsPanel() {
  return (
    <div style={{
      width: 300, minWidth: 280,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert" size={15} color={C.cyan} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Eventos Recentes
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: C.cyanDim, color: C.cyan,
          border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '1px 7px',
        }}>
          {MOCK_EVENTS.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {MOCK_EVENTS.map((ev, i) => {
          const sev = SEVERITY[ev.severity as keyof typeof SEVERITY];
          return (
            <div
              key={ev.id}
              style={{
                padding: '12px 18px',
                borderBottom: i < MOCK_EVENTS.length - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'background 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4, flex: 1 }}>
                  {ev.msg}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: sev.bg, color: sev.color,
                  border: `1px solid ${sev.color}40`,
                  borderRadius: 4, padding: '1px 5px',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {ev.severity}
                </span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{ev.sub}</span>
              <span style={{ fontSize: 10, color: C.subtle }}>{ev.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GPS Control Panel ────────────────────────────────────────────────────────
function GpsPanel({
  lat, lng, speed, heading, intervalSeconds, autoSending, status,
  onLat, onLng, onSpeed, onHeading, onInterval,
  onSendManual, onSendBrowser, onToggleAuto,
}: {
  lat: string; lng: string; speed: string; heading: string;
  intervalSeconds: string; autoSending: boolean; status: string;
  onLat: (v: string) => void; onLng: (v: string) => void;
  onSpeed: (v: string) => void; onHeading: (v: string) => void;
  onInterval: (v: string) => void;
  onSendManual: () => void; onSendBrowser: () => void; onToggleAuto: () => void;
}) {
  return (
    <div style={{
      flex: 1,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon name="gps" size={15} color={C.cyan} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Controle GPS
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          background: autoSending ? C.greenDim : C.orangeDim,
          color: autoSending ? C.green : C.orange,
          border: `1px solid ${autoSending ? 'rgba(0,255,136,0.3)' : 'rgba(255,140,0,0.3)'}`,
          borderRadius: 4, padding: '2px 7px',
        }}>
          {autoSending ? 'ENVIANDO' : 'PARADO'}
        </span>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Interval */}
        <div>
          <label>Intervalo (s)</label>
          <input className="admin-input" type="number" min="1" value={intervalSeconds} onChange={e => onInterval(e.target.value)}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
          />
        </div>

        {/* Coords */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label>Latitude</label>
            <input className="admin-input" type="number" step="0.0001" value={lat} onChange={e => onLat(e.target.value)}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
            />
          </div>
          <div>
            <label>Longitude</label>
            <input className="admin-input" type="number" step="0.0001" value={lng} onChange={e => onLng(e.target.value)}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
            />
          </div>
          <div>
            <label>Velocidade (nós)</label>
            <input className="admin-input" type="number" step="0.1" value={speed} onChange={e => onSpeed(e.target.value)}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
            />
          </div>
          <div>
            <label>Heading (°)</label>
            <input className="admin-input" type="number" step="1" min="0" max="360" value={heading} onChange={e => onHeading(e.target.value)}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ActionBtn icon="pin" label="Enviar Posição Manual" onClick={onSendManual} variant="default" />
          <ActionBtn icon="gps" label="Capturar GPS do Navegador" onClick={onSendBrowser} variant="default" />
          <ActionBtn
            icon={autoSending ? 'stop' : 'play'}
            label={autoSending ? 'Parar Envio Automático' : 'Iniciar Envio Automático'}
            onClick={onToggleAuto}
            variant={autoSending ? 'danger' : 'primary'}
          />
        </div>

        {/* Status */}
        {status && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: status.includes('sucesso') || status.includes('enviado')
              ? C.greenDim : status.includes('Enviando') || status.includes('Capturando')
              ? C.cyanDim : C.orangeDim,
            color: status.includes('sucesso') || status.includes('enviado')
              ? C.green : status.includes('Enviando') || status.includes('Capturando')
              ? C.cyan : C.orange,
            border: `1px solid currentColor`,
            borderColor: 'currentColor',
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Livestream Panel ─────────────────────────────────────────────────────────
function LivestreamPanel({
  activeLivestream, youtubeUrl, liveStatus, liveDuration,
  onUrlChange, onStart, onEnd,
}: {
  activeLivestream: Livestream | null;
  youtubeUrl: string; liveStatus: string; liveDuration: string;
  onUrlChange: (v: string) => void;
  onStart: () => void; onEnd: () => void;
}) {
  return (
    <div style={{
      flex: 1,
      background: C.surface,
      border: `1px solid ${activeLivestream ? 'rgba(255,59,59,0.25)' : C.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: activeLivestream ? '0 0 24px rgba(255,59,59,0.08)' : 'none',
      transition: 'all 0.3s',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${activeLivestream ? 'rgba(255,59,59,0.2)' : C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon name="live" size={15} color={activeLivestream ? C.red : C.cyan} />
        <span style={{ fontSize: 13, fontWeight: 700, color: activeLivestream ? C.red : C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Livestream YouTube
        </span>
        {activeLivestream && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: C.redDim, color: C.red,
            border: '1px solid rgba(255,59,59,0.35)',
            borderRadius: 4, padding: '2px 7px',
          }}>
            AO VIVO • {liveDuration}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!activeLivestream ? (
          <>
            <div>
              <label>URL do YouTube</label>
              <input
                className="admin-input"
                type="url"
                value={youtubeUrl}
                onChange={e => onUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.10)'}
              />
              <span style={{ fontSize: 10, color: C.muted, marginTop: 4, display: 'block' }}>
                Cole a URL da sua live do YouTube aqui
              </span>
            </div>
            <ActionBtn icon="live" label="Iniciar Livestream" onClick={onStart} variant="danger" />
          </>
        ) : (
          <>
            <div style={{
              background: C.redDim, border: '1px solid rgba(255,59,59,0.25)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4 }}>Livestream Ativa</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Duração: {liveDuration}</div>
              <code style={{ fontSize: 11, color: 'rgb(168,85,247)', wordBreak: 'break-all' }}>{activeLivestream.youtube_url}</code>
            </div>
            <ActionBtn icon="stop" label="Finalizar Livestream" onClick={onEnd} variant="danger" />
          </>
        )}

        {liveStatus && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: liveStatus.includes('sucesso') ? C.greenDim : C.cyanDim,
            color: liveStatus.includes('sucesso') ? C.green : C.cyan,
            border: '1px solid currentColor',
          }}>
            {liveStatus}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, variant = 'default' }: {
  icon: string; label: string; onClick: () => void; variant?: 'default' | 'primary' | 'danger';
}) {
  const [hov, setHov] = useState(false);
  type BtnStyle = { bg: string; color: string; borderColor: string };
  const styles: Record<string, BtnStyle> = {
    default: { bg: hov ? 'rgba(255,255,255,0.07)' : C.surfaceAlt, color: hov ? C.text : C.muted,  borderColor: C.border },
    primary: { bg: hov ? 'rgba(0,212,255,0.2)'   : C.cyanDim,     color: C.cyan,                  borderColor: 'rgba(0,212,255,0.35)' },
    danger:  { bg: hov ? 'rgba(255,59,59,0.22)'  : C.redDim,      color: C.red,                   borderColor: 'rgba(255,59,59,0.35)' },
  };
  const st = styles[variant];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '9px 16px', borderRadius: 8,
        background: st.bg, color: st.color,
        border: `1px solid ${st.borderColor}`,
        cursor: 'pointer', width: '100%',
        fontSize: 12, fontWeight: 700,
        fontFamily: 'Rajdhani, sans-serif',
        textTransform: 'uppercase', letterSpacing: 0.5,
        transition: 'all 0.18s',
      }}
    >
      <Icon name={icon} size={14} color="currentColor" />
      {label}
    </button>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
function ActivityLog({ lat, lng, speed, heading }: {
  lat: string; lng: string; speed: string; heading: string;
}) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="log" size={15} color={C.cyan} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Atividade Recente
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'LAT', val: lat },
            { label: 'LNG', val: lng },
            { label: 'SPD', val: `${speed}kn` },
            { label: 'HDG', val: `${heading}°` },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: C.cyan, fontFamily: 'Roboto Mono, monospace', fontWeight: 600 }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', overflow: 'hidden' }}>
        {MOCK_ACTIVITY.map((a, i) => (
          <div
            key={a.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '11px 18px',
              borderBottom: i < MOCK_ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.15s', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: C.cyan, boxShadow: C.cyanGlow, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: C.subtle, fontFamily: 'Roboto Mono, monospace', width: 60, flexShrink: 0 }}>
              {a.time}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, width: 60, flexShrink: 0 }}>
              {a.user}
            </span>
            <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{a.action}</span>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: 'Roboto Mono, monospace' }}>{a.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminClientPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // GPS state
  const [lat,             setLat]             = useState('-23.6207');
  const [lng,             setLng]             = useState('-45.4138');
  const [speed,           setSpeed]           = useState('12');
  const [heading,         setHeading]         = useState('90');
  const [sessionToken,    setSessionToken]    = useState<string | null>(null);
  const [status,          setStatus]          = useState('');
  const [autoSending,     setAutoSending]     = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState('5');

  // Livestream state
  const [activeLivestream, setActiveLivestream] = useState<Livestream | null>(null);
  const [youtubeUrl,       setYoutubeUrl]       = useState('');
  const [liveStatus,       setLiveStatus]       = useState('');
  const [liveDuration,     setLiveDuration]     = useState('');

  // Map positions
  const [positions, setPositions] = useState<Position[]>([]);

  // Nav state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminEmail,    setAdminEmail]    = useState('');

  // ── Auth & init ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
        setAdminEmail(session.user?.email ?? 'Admin');
        fetchActiveLivestream();
        fetchPositions();
      } else {
        router.push('/login');
      }
    }
    init();

    // Poll positions every 10s to keep map fresh
    const pollId = setInterval(fetchPositions, 10000);
    return () => clearInterval(pollId);
  }, [router, supabase.auth]);

  async function fetchPositions() {
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sessionData) return;

      const { data: positionsData } = await supabase
        .from('positions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (positionsData) setPositions(positionsData as Position[]);
    } catch { /* silent */ }
  }

  async function fetchActiveLivestream() {
    try {
      const res = await fetch('/api/livestream');
      const json = await res.json();
      setActiveLivestream(json.livestream || null);
      if (json.livestream) setAutoSending(true);
    } catch { /* silent */ }
  }

  // ── Livestream ─────────────────────────────────────────────────────────────
  async function startLivestream() {
    if (!sessionToken) { setLiveStatus('Erro: Não autenticado.'); return; }
    if (!youtubeUrl.trim()) { setLiveStatus('Erro: URL do YouTube é obrigatória.'); return; }
    try {
      setLiveStatus('Iniciando livestream...');
      const res = await fetch('/api/livestream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });
      const json = await res.json();
      if (res.ok) { setActiveLivestream(json.livestream); setYoutubeUrl(''); setLiveStatus('Livestream iniciada com sucesso!'); setAutoSending(true); }
      else setLiveStatus(json.error || 'Erro ao iniciar livestream');
    } catch { setLiveStatus('Erro ao iniciar livestream.'); }
  }

  async function endLivestream() {
    if (!sessionToken) { setLiveStatus('Erro: Não autenticado.'); return; }
    try {
      setLiveStatus('Finalizando livestream...');
      const res = await fetch('/api/livestream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      });
      const json = await res.json();
      if (res.ok) { setActiveLivestream(null); setLiveStatus('Livestream finalizada com sucesso!'); setAutoSending(false); }
      else setLiveStatus(json.error || 'Erro ao finalizar livestream');
    } catch { setLiveStatus('Erro ao finalizar livestream.'); }
  }

  // ── Live duration ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeLivestream) { setLiveDuration(''); return; }
    function update() {
      const diff = Date.now() - new Date(activeLivestream!.started_at).getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2,'0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2,'0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2,'0');
      setLiveDuration(`${h}:${m}:${s}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeLivestream]);

  // ── GPS ────────────────────────────────────────────────────────────────────
  async function sendManual() {
    if (!sessionToken) { setStatus('Erro: Não autenticado.'); return; }
    try {
      setStatus('Enviando...');
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ lat: Number(lat), lng: Number(lng), speed_knots: Number(speed), heading: Number(heading), source: 'manual-admin' }),
      });
      const json = await res.json();
      setStatus(res.ok ? 'Posição enviada com sucesso.' : json.error || 'Erro ao enviar');
      if (res.ok) fetchPositions();
    } catch { setStatus('Erro ao enviar posição.'); }
  }

  const sendBrowserPosition = useCallback(() => {
    if (!sessionToken) { setStatus('Erro: Não autenticado.'); return; }
    if (!navigator.geolocation) { setStatus('Geolocalização não suportada.'); return; }
    setStatus('Capturando posição...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, speed_knots: pos.coords.speed ?? null, heading: pos.coords.heading ?? null, source: 'browser-gps' }),
          });
          const json = await res.json();
          setStatus(res.ok ? 'GPS enviado com sucesso.' : json.error || 'Erro ao enviar GPS');
          if (res.ok) fetchPositions();
        } catch { setStatus('Erro ao enviar GPS.'); }
      },
      () => setStatus('Não foi possível capturar o GPS.'),
    );
  }, [sessionToken]);

  useEffect(() => {
    if (!autoSending) return;
    const ms = Math.max((Number(intervalSeconds) || 5) * 1000, 1000);
    sendBrowserPosition();
    const id = window.setInterval(sendBrowserPosition, ms);
    return () => window.clearInterval(id);
  }, [autoSending, intervalSeconds, sendBrowserPosition]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        .admin-scroll::-webkit-scrollbar { width: 5px; }
        .admin-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.25); border-radius: 3px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,212,255,0.5); }

        /* Override global input styles scoped to admin layout */
        .admin-input {
          background: #0a0f1c !important;
          border: 1px solid rgba(0,212,255,0.10) !important;
          color: #e8edf5 !important;
          border-radius: 7px !important;
          padding: 8px 10px !important;
          font-size: 13px !important;
          font-family: 'Roboto Mono', monospace !important;
          width: 100% !important;
          outline: none !important;
          transition: border 0.2s !important;
        }
        .admin-input:focus {
          border-color: #00d4ff !important;
          box-shadow: none !important;
        }
        .admin-search-input {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          outline: none !important;
          color: #e8edf5 !important;
          font-size: 12px !important;
          font-family: Rajdhani, sans-serif !important;
          width: 180px !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .admin-search-input:focus {
          box-shadow: none !important;
          border: none !important;
        }
        .admin-layout h1,.admin-layout h2,.admin-layout h3,.admin-layout h4,.admin-layout h5,.admin-layout h6 {
          font-size: unset !important;
        }
        .admin-layout .mb-4 { color: unset !important; }
        .admin-layout .mb-2 { color: unset !important; }
        .admin-layout .card { background: unset !important; cursor: default !important; }
        .admin-layout .card:hover { border-color: unset !important; box-shadow: none !important; }
        .admin-layout .card.active { box-shadow: none !important; border-color: unset !important; }
        .admin-layout label { display: block; margin-bottom: 6px; font-size: 10px; color: rgba(232,237,245,0.40); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
        .admin-layout .alert { margin-bottom: 0; }
        .admin-layout .session-stats-card { border: none !important; }

        /* ── GPS avatar marker (LiveMap creates these via JS) ── */
        .gps-avatar-marker {
          position: relative;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
        }
        .gps-avatar-image {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 2px solid #00d4ff;
          object-fit: cover;
          background: #0a0f14;
          box-shadow: 0 0 0 1px rgba(10,15,20,0.85), 0 6px 18px rgba(0,0,0,0.45);
          position: relative;
          z-index: 2;
        }
        .gps-avatar-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 2px solid rgba(0,212,255,0.40);
          background: rgba(0,212,255,0.10);
          animation: gpsPulse 1.9s ease-out infinite;
          z-index: 1;
        }
        @keyframes gpsPulse {
          0%   { transform: scale(0.65); opacity: 0.85; }
          70%  { transform: scale(1.24); opacity: 0; }
          100% { transform: scale(1.24); opacity: 0; }
        }

        /* ── MapLibre controls inside admin map ── */
        .maplibregl-ctrl-group {
          background: rgba(10,15,20,0.9) !important;
          border: 1px solid rgba(0,212,255,0.18) !important;
          border-radius: 5px !important;
          box-shadow: none !important;
        }
        .maplibregl-ctrl-group button {
          background-color: transparent !important;
          color: rgba(0,212,255,0.7) !important;
          border-color: rgba(0,212,255,0.12) !important;
        }
        .maplibregl-ctrl-group button:hover {
          background: rgba(0,212,255,0.12) !important;
        }
        .maplibregl-ctrl-group button span {
          filter: invert(1) sepia(1) saturate(4) hue-rotate(155deg) brightness(1.5);
        }
        .maplibregl-ctrl-attrib {
          background: rgba(10,15,20,0.75) !important;
          color: rgba(127,149,168,0.5) !important;
          font-size: 9px !important;
        }
      `}</style>

      <div className="admin-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg, fontFamily: 'Rajdhani, Inter, sans-serif' }}>

        {/* ── Sidebar ── */}
        <Sidebar
          active={activeSection}
          onNavigate={setActiveSection}
          onLogout={handleLogout}
        />

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Header */}
          <TopHeader
            autoSending={autoSending}
            activeLivestream={activeLivestream}
            liveDuration={liveDuration}
          />

          {/* Scrollable content */}
          <main className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 'none', margin: 0 }}>

            {/* ── Vista: Grupos ── */}
            {activeSection === 'grupos' ? (
              <GroupsPanel adminName={adminEmail} />
            ) : (
              <>

            {/* ── Row 1: Metric cards ── */}
            <div style={{ display: 'flex', gap: 14 }}>
              {MOCK_METRICS.map(m => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>

            {/* ── Row 2: Map + Events ── */}
            <div style={{ display: 'flex', gap: 16, minHeight: 440 }}>

              {/* Map */}
              <div style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                minHeight: 440,
              }}>
                <div style={{
                  padding: '12px 18px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                }}>
                  <Icon name="map" size={15} color={C.cyan} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Mapa ao Vivo
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                    <span style={{ fontSize: 11, color: C.green }}>TEMPO REAL</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>
                      {positions.length} pontos
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <LiveMap positions={positions} darkMap profileImageUrl="/assets/numbat.png" />
                </div>
              </div>

              {/* Events panel — feed social em tempo real */}
              <SocialFeedPanel />
            </div>

            {/* ── Row 3: GPS + Livestream ── */}
            <div style={{ display: 'flex', gap: 16 }}>
              <GpsPanel
                lat={lat} lng={lng} speed={speed} heading={heading}
                intervalSeconds={intervalSeconds}
                autoSending={autoSending} status={status}
                onLat={setLat} onLng={setLng}
                onSpeed={setSpeed} onHeading={setHeading}
                onInterval={setIntervalSeconds}
                onSendManual={sendManual}
                onSendBrowser={sendBrowserPosition}
                onToggleAuto={() => setAutoSending(v => !v)}
              />
              <LivestreamPanel
                activeLivestream={activeLivestream}
                youtubeUrl={youtubeUrl} liveStatus={liveStatus} liveDuration={liveDuration}
                onUrlChange={setYoutubeUrl}
                onStart={startLivestream}
                onEnd={endLivestream}
              />
            </div>

            {/* ── Row 4: Session Stats ── */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="pulse" size={15} color={C.cyan} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Estatísticas da Sessão
                </span>
              </div>
              <div style={{ padding: '4px 18px 18px' }}>
                <SessionStats />
              </div>
            </div>

            {/* ── Row 5: Activity Log ── */}
            <ActivityLog lat={lat} lng={lng} speed={speed} heading={heading} />

              </>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
