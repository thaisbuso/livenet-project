'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import GpsPanel from '@/components/GpsPanel';
import { upsertMemberLocation, stopSharingLocation } from '@/lib/social';
import { createSupabaseBrowserClient } from '@/lib/supabase';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#080b12',
  surface: '#0f1623',
  border:  'rgba(0,212,255,0.10)',
  cyan:    '#00d4ff',
  cyanDim: 'rgba(0,212,255,0.12)',
  green:   '#00ff88',
  red:     '#ff3b3b',
  redDim:  'rgba(255,59,59,0.12)',
  text:    '#e8edf5',
  muted:   'rgba(232,237,245,0.40)',
};

type MemberData = {
  profileId:  string;
  groupId:    string;
  name:       string;
  groupName:  string;
  groupIcon:  string;
  groupColor: string;
};

export default function MemberPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // ── Member data ────────────────────────────────────────────────────────────
  const [member,       setMember]       = useState<MemberData | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [ready,        setReady]        = useState(false);

  // ── GPS state ──────────────────────────────────────────────────────────────
  const [lat,             setLat]             = useState('');
  const [lng,             setLng]             = useState('');
  const [speed,           setSpeed]           = useState('0');
  const [heading,         setHeading]         = useState('0');
  const [intervalSeconds, setIntervalSeconds] = useState('30');
  const [autoSending,     setAutoSending]     = useState(false);
  const [status,          setStatus]          = useState('');

  const autoSendingRef   = useRef(autoSending);
  const memberRef        = useRef<MemberData | null>(null);
  autoSendingRef.current = autoSending;

  // ── Load member from localStorage ─────────────────────────────────────────
  useEffect(() => {
    const profileId  = localStorage.getItem('nb_profile_id');
    const groupId    = localStorage.getItem('nb_group_id');
    const name       = localStorage.getItem('nb_name');
    const groupName  = localStorage.getItem('nb_group_name');
    const groupIcon  = localStorage.getItem('nb_group_icon') ?? '';
    const groupColor = localStorage.getItem('nb_group_color') ?? C.cyan;

    if (!profileId || !groupId || !name) {
      setReady(true); // will show empty state
      return;
    }

    const data: MemberData = { profileId, groupId, name, groupName: groupName ?? '', groupIcon, groupColor };
    setMember(data);
    memberRef.current = data;
    setReady(true);

    // Fetch session title
    void fetchSessionTitle(groupId);
  }, []);

  async function fetchSessionTitle(groupId: string) {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('session_id')
        .eq('id', groupId)
        .maybeSingle();

      if (group?.session_id) {
        const { data: session } = await supabase
          .from('sessions')
          .select('title')
          .eq('id', group.session_id)
          .maybeSingle();

        if (session?.title) setSessionTitle(session.title);
      }
    } catch { /* session title is optional */ }
  }

  // ── GPS helpers ────────────────────────────────────────────────────────────
  const sendBrowserPosition = useCallback(() => {
    const m = memberRef.current;
    if (!m) return;
    if (!navigator.geolocation) {
      setStatus('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setStatus('Capturando posição GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          await upsertMemberLocation(
            m.profileId, m.groupId,
            pos.coords.latitude, pos.coords.longitude,
            pos.coords.accuracy,
          );
          setStatus('GPS enviado com sucesso.');
        } catch {
          setStatus('Erro ao enviar GPS.');
        }
      },
      () => setStatus('Não foi possível capturar o GPS. Verifique as permissões.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, []);

  async function handleSendManual() {
    const m = memberRef.current;
    if (!m) return;
    const latitude  = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      setStatus('Insira coordenadas válidas antes de enviar.');
      return;
    }
    setStatus('Enviando posição manual...');
    try {
      await upsertMemberLocation(m.profileId, m.groupId, latitude, longitude, null);
      setStatus('Posição enviada com sucesso.');
    } catch {
      setStatus('Erro ao enviar posição.');
    }
  }

  // ── Auto-send ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSending) return;
    const ms = Math.max((Number(intervalSeconds) || 30) * 1000, 5000);
    sendBrowserPosition();
    const id = window.setInterval(sendBrowserPosition, ms);
    return () => window.clearInterval(id);
  }, [autoSending, intervalSeconds, sendBrowserPosition]);

  // ── Stop sharing on unmount if auto is active ──────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSendingRef.current && memberRef.current) {
        void stopSharingLocation(memberRef.current.profileId).catch(() => {});
      }
    };
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  function handleLogout() {
    const keys = ['nb_profile_id', 'nb_group_id', 'nb_name', 'nb_group_name', 'nb_group_icon', 'nb_group_color'];
    keys.forEach(k => localStorage.removeItem(k));
    router.push('/');
  }

  // ── Empty / loading ────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Rajdhani, Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${C.border}`, borderTopColor: C.cyan,
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', fontFamily: 'Rajdhani, Inter, sans-serif',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 380,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '32px 24px',
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Nenhum membro identificado
          </p>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>
            Use o link de convite enviado para você para entrar em um grupo.
          </p>
          <a
            href="/"
            style={{
              display: 'block', padding: '10px 20px',
              borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.cyanDim, color: C.cyan,
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif', textDecoration: 'none',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            Ir para o início
          </a>
        </div>
      </div>
    );
  }

  const { name, groupName, groupIcon, groupColor } = member;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: 'Rajdhani, Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ── Top color strip ── */}
        <div style={{ height: 4, background: groupColor, boxShadow: `0 0 20px ${groupColor}80` }} />

        {/* ── Header ── */}
        <header style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Logo */}
          <div style={{
            fontFamily: 'Audiowide, cursive',
            fontSize: 16, color: C.cyan, letterSpacing: 2,
          }}>
            NumbatNET
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              borderRadius: 7, cursor: 'pointer',
              border: `1px solid rgba(255,59,59,0.30)`,
              background: C.redDim, color: C.red,
              fontSize: 11, fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase', letterSpacing: 0.5,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,59,0.22)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.redDim}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </header>

        {/* ── Main content ── */}
        <main style={{
          flex: 1,
          padding: '24px 20px',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>

          {/* ── Member card ── */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Group color top accent */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${groupColor}, transparent)` }} />

            <div style={{ padding: '20px 20px 18px' }}>
              {/* Group row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: groupColor + '20',
                  border: `2px solid ${groupColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {groupIcon || '👥'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                    {groupName || 'Grupo'}
                  </div>
                  {sessionTitle && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                      Sessão: <span style={{ color: groupColor }}>{sessionTitle}</span>
                    </div>
                  )}
                </div>
                {/* GPS indicator */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 6,
                  background: autoSending ? 'rgba(0,255,136,0.1)' : 'rgba(255,140,0,0.1)',
                  border: `1px solid ${autoSending ? 'rgba(0,255,136,0.3)' : 'rgba(255,140,0,0.3)'}`,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: autoSending ? C.green : '#ff8c00',
                    boxShadow: autoSending ? `0 0 6px ${C.green}` : `0 0 6px #ff8c00`,
                    animation: autoSending ? 'pulse 2s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: autoSending ? C.green : '#ff8c00', fontFamily: 'Rajdhani', whiteSpace: 'nowrap' }}>
                    {autoSending ? 'GPS ATIVO' : 'GPS OFF'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 14 }} />

              {/* Member name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: groupColor + '18',
                  border: `1.5px solid ${groupColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: groupColor,
                  fontFamily: 'Rajdhani, sans-serif',
                  flexShrink: 0,
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Membro
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                    {name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── GPS Panel ── */}
          <GpsPanel
            lat={lat} lng={lng} speed={speed} heading={heading}
            intervalSeconds={intervalSeconds}
            autoSending={autoSending} status={status}
            onLat={setLat} onLng={setLng}
            onSpeed={setSpeed} onHeading={setHeading}
            onInterval={setIntervalSeconds}
            onSendManual={handleSendManual}
            onSendBrowser={sendBrowserPosition}
            onToggleAuto={() => setAutoSending(v => !v)}
          />

          {/* ── Footer ── */}
          <p style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>
            NumbatNET — Rede social geolocalizada em tempo real
          </p>
        </main>
      </div>
    </>
  );
}
