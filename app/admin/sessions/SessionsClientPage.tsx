'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import BrazilTimeClock from '@/components/BrazilTimeClock';
import type { Session } from '@/lib/types';

const C = {
  bg:        '#080b12',
  sidebar:   '#0b0f1a',
  surface:   '#0f1623',
  surfaceAlt:'#121926',
  border:    'rgba(0,212,255,0.10)',
  borderHov: 'rgba(0,212,255,0.30)',
  cyan:      '#00d4ff',
  cyanDim:   'rgba(0,212,255,0.12)',
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionsClientPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [creating,     setCreating]     = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [actionMsg,    setActionMsg]    = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSessions((data ?? []) as Session[]);
    } catch {
      setActionMsg('Erro ao carregar sessões.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ title: newTitle.trim(), is_live: true })
        .select()
        .single();
      if (error) throw error;
      setSessions(prev => [data as Session, ...prev]);
      setNewTitle('');
      setShowForm(false);
      setActionMsg(`Sessão "${(data as Session).title}" criada.`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      setActionMsg(err?.message ?? 'Erro ao criar sessão.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(session: Session) {
    const title = editingTitle.trim();
    if (!title || title === session.title) { setEditingId(null); return; }
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ title })
        .eq('id', session.id);
      if (error) throw error;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, title } : s));
      setEditingId(null);
    } catch (err: any) {
      setActionMsg(err?.message ?? 'Erro ao renomear sessão.');
    }
  }

  async function handleDelete(session: Session) {
    if (!confirm(`Excluir sessão "${session.title}"?\nTodas as posições, grupos e livestreams associados serão removidos.`)) return;
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== session.id));
      setActionMsg(`Sessão "${session.title}" excluída.`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      setActionMsg(err?.message ?? 'Erro ao excluir sessão.');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        .sess-input {
          background: #0a0f1c !important;
          border: 1px solid rgba(0,212,255,0.15) !important;
          color: #e8edf5 !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
          font-size: 14px !important;
          font-family: Rajdhani, sans-serif !important;
          width: 100% !important;
          outline: none !important;
          transition: border 0.2s !important;
          box-sizing: border-box !important;
        }
        .sess-input:focus { border-color: #00d4ff !important; }
        .sess-card { transition: all 0.2s; }
        .sess-card:hover { border-color: rgba(0,212,255,0.25) !important; background: #111827 !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: 'Rajdhani, Inter, sans-serif',
        backgroundImage: 'url(/assets/grid.svg)',
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
      }}>

        {/* ── Header ── */}
        <header style={{
          background: C.sidebar,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 32px',
          height: 64,
          gap: 16,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: C.cyanDim, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.7">
                <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
                <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
                <line x1="5" y1="19" x2="19" y2="19"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Audiowide, cursive', fontSize: 13, color: C.cyan, letterSpacing: 1 }}>NumbatNET</div>
              <div style={{ fontSize: 10, color: C.muted }}>NOC Console</div>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: C.border, margin: '0 8px' }} />

          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sessões
          </span>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 12, fontFamily: 'Roboto Mono, monospace', color: C.muted }}>
            <BrazilTimeClock />
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid rgba(255,59,59,0.25)`,
              borderRadius: 8,
              color: 'rgba(255,59,59,0.7)',
              fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim; (e.currentTarget as HTMLElement).style.color = C.red; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,59,59,0.7)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </header>

        {/* ── Content ── */}
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>

          {/* Page title + create btn */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{
                fontSize: 24, fontWeight: 700, color: C.text,
                margin: 0, letterSpacing: 0.5, textTransform: 'uppercase',
              }}>
                Gerenciar Sessões
              </h1>
              <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>
                Selecione uma sessão para entrar no painel de controle.
              </p>
            </div>
            <button
              onClick={() => { setShowForm(v => !v); setNewTitle(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: C.cyanDim,
                border: `1px solid rgba(0,212,255,0.3)`,
                borderRadius: 10,
                color: C.cyan,
                fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.cyanDim}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova Sessão
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <form
              onSubmit={handleCreate}
              style={{
                background: C.surface,
                border: `1px solid rgba(0,212,255,0.2)`,
                borderRadius: 12,
                padding: '20px 24px',
                marginBottom: 24,
                display: 'flex', gap: 12, alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Título da Sessão
                </div>
                <input
                  className="sess-input"
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Live São Paulo 2025, Trilha Mantiqueira..."
                  maxLength={80}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                style={{
                  padding: '10px 22px',
                  background: C.cyanDim,
                  border: `1px solid rgba(0,212,255,0.3)`,
                  borderRadius: 8,
                  color: C.cyan,
                  fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {creating ? 'Criando...' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.muted,
                  fontSize: 13, fontFamily: 'Rajdhani, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Action message */}
          {actionMsg && (
            <div style={{
              marginBottom: 16, padding: '10px 16px',
              background: C.cyanDim, border: `1px solid rgba(0,212,255,0.25)`,
              borderRadius: 8, fontSize: 13, color: C.cyan,
            }}>
              {actionMsg}
            </div>
          )}

          {/* Sessions list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 14 }}>
              Carregando sessões...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 24px',
              background: C.surface,
              border: `1px dashed ${C.border}`,
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Nenhuma sessão criada ainda
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Crie uma sessão para começar a transmitir sua localização.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="sess-card"
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: '18px 22px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: session.is_live ? C.green : C.muted,
                    boxShadow: session.is_live ? `0 0 8px ${C.green}` : 'none',
                    animation: session.is_live ? 'pulse 2s infinite' : 'none',
                  }} />

                  {/* Title area */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === session.id ? (
                      <form
                        onSubmit={e => { e.preventDefault(); handleRename(session); }}
                        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                      >
                        <input
                          className="sess-input"
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          maxLength={80}
                          autoFocus
                          style={{ maxWidth: 360 }}
                        />
                        <button type="submit" style={{ background: C.cyanDim, border: `1px solid rgba(0,212,255,0.3)`, borderRadius: 6, padding: '6px 12px', color: C.cyan, fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>
                          Salvar
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', color: C.muted, fontSize: 11, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </form>
                    ) : (
                      <>
                        <div style={{
                          fontSize: 15, fontWeight: 700, color: C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {session.title}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            color: session.is_live ? C.green : C.muted,
                          }}>
                            {session.is_live ? '● AO VIVO' : '○ Encerrada'}
                          </span>
                          <span>Criada: {formatDate(session.created_at)}</span>
                          {session.ended_at && (
                            <span>Encerrada: {formatDate(session.ended_at)}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== session.id && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {/* Entrar */}
                      <button
                        onClick={() => router.push(`/admin/${session.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px',
                          background: 'rgba(0,255,136,0.1)',
                          border: `1px solid rgba(0,255,136,0.3)`,
                          borderRadius: 8,
                          color: C.green,
                          fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: 0.3,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.1)'}
                        title="Entrar no painel desta sessão"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        Entrar
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => { setEditingId(session.id); setEditingTitle(session.title); }}
                        style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          color: C.muted,
                          fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: 0.3,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHov; (e.currentTarget as HTMLElement).style.color = C.text; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}
                        title="Renomear sessão"
                      >
                        Editar
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={() => handleDelete(session)}
                        style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          border: `1px solid rgba(255,59,59,0.2)`,
                          borderRadius: 8,
                          color: 'rgba(255,59,59,0.6)',
                          fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: 0.3,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.redDim; (e.currentTarget as HTMLElement).style.color = C.red; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,59,59,0.6)'; }}
                        title="Excluir sessão permanentemente"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
