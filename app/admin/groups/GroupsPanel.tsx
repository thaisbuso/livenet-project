'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  listGroups, deleteGroup,
  listGroupMembers, removeMember,
} from '@/lib/groups';
import { listInvites, cancelInvite } from '@/lib/invites';
import type { Group, GroupMember, Invite } from '@/lib/types';
import CreateGroupModal from './CreateGroupModal';
import InviteMemberModal from './InviteMemberModal';

// Tokens de design compatíveis com AdminClientPage
const C = {
  bg:        '#080b12',
  surface:   '#0f1623',
  surfaceAlt:'#121926',
  border:    'rgba(0,212,255,0.10)',
  borderHov: 'rgba(0,212,255,0.25)',
  cyan:      '#00d4ff',
  cyanDim:   'rgba(0,212,255,0.10)',
  green:     '#00ff88',
  greenDim:  'rgba(0,255,136,0.10)',
  orange:    '#ff8c00',
  red:       '#ff3b3b',
  redDim:    'rgba(255,59,59,0.10)',
  text:      '#e8edf5',
  muted:     'rgba(232,237,245,0.40)',
  subtle:    'rgba(232,237,245,0.18)',
};

type GroupWithMeta = Group & {
  memberCount: number;
  pendingInvites: number;
};

export default function GroupsPanel({ adminName }: { adminName?: string }) {
  const [groups,         setGroups]         = useState<GroupWithMeta[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedGroup,  setSelectedGroup]  = useState<Group | null>(null);
  const [members,        setMembers]        = useState<GroupMember[]>([]);
  const [invites,        setInvites]        = useState<Invite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modais
  const [showCreate,  setShowCreate]  = useState(false);
  const [editingGroup,setEditingGroup]= useState<Group | null>(null);
  const [inviteTarget,setInviteTarget]= useState<Group | null>(null);

  // ── Carrega grupos ────────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const gs = await listGroups();

      // Para cada grupo, conta membros e convites pendentes em paralelo
      const enriched = await Promise.all(
        gs.map(async g => {
          const [mems, invs] = await Promise.all([
            listGroupMembers(g.id),
            listInvites(g.id),
          ]);
          return {
            ...g,
            memberCount:    mems.length,
            pendingInvites: invs.filter(i => i.status === 'pending').length,
          };
        }),
      );

      setGroups(enriched);
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Seleciona grupo (detalhe de membros) ─────────────────────────────────
  async function selectGroup(group: Group) {
    setSelectedGroup(group);
    setLoadingMembers(true);
    try {
      const [mems, invs] = await Promise.all([
        listGroupMembers(group.id),
        listInvites(group.id),
      ]);
      setMembers(mems);
      setInvites(invs);
    } catch { /* silent */ } finally {
      setLoadingMembers(false);
    }
  }

  async function handleDeleteGroup(group: Group) {
    if (!confirm(`Excluir o grupo "${group.name}"? Esta ação removerá todos os membros e convites.`)) return;
    try {
      await deleteGroup(group.id);
      setGroups(prev => prev.filter(g => g.id !== group.id));
      if (selectedGroup?.id === group.id) setSelectedGroup(null);
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao excluir grupo.');
    }
  }

  async function handleRemoveMember(member: GroupMember) {
    if (!selectedGroup) return;
    if (!confirm(`Remover ${member.profile?.name ?? 'este membro'} do grupo?`)) return;
    try {
      await removeMember(selectedGroup.id, member.profile_id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao remover membro.');
    }
  }

  async function handleCancelInvite(invite: Invite) {
    if (!confirm('Cancelar este convite?')) return;
    try {
      await cancelInvite(invite.id);
      setInvites(prev => prev.map(i => i.id === invite.id ? { ...i, status: 'cancelled' as const } : i));
    } catch { /* silent */ }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const inviteStatusColor = (status: string) => ({
    pending:   C.orange,
    accepted:  C.green,
    expired:   C.muted,
    cancelled: C.red,
  }[status] ?? C.muted);

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 0, flex: 1 }}>

      {/* ─── Lista de grupos ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GroupIcon size={15} color={C.cyan} />
            <span style={headerLabel}>Grupos</span>
            <span style={countBadge}>{groups.length}</span>
          </div>
          <button
            onClick={() => { setEditingGroup(null); setShowCreate(true); }}
            style={primaryBtn}
          >
            + Novo grupo
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: C.muted }}>
              Carregando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>
                Nenhum grupo criado ainda.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                style={primaryBtn}
              >
                Criar primeiro grupo
              </button>
            </div>
          ) : (
            groups.map(g => (
              <div
                key={g.id}
                onClick={() => selectGroup(g)}
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: selectedGroup?.id === g.id ? C.cyanDim : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (selectedGroup?.id !== g.id)
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                }}
                onMouseLeave={e => {
                  if (selectedGroup?.id !== g.id)
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Avatar do grupo */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: g.color + '20',
                  border: `1px solid ${g.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {g.icon || '👥'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.name}
                    </span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2, display: 'flex', gap: 10 }}>
                    <span>{g.memberCount} membro{g.memberCount !== 1 ? 's' : ''}</span>
                    {g.pendingInvites > 0 && (
                      <span style={{ color: C.orange }}>{g.pendingInvites} convite{g.pendingInvites !== 1 ? 's' : ''} pendente{g.pendingInvites !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Ações rápidas */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <ActionBtn
                    label="Convidar"
                    color={C.cyan}
                    onClick={() => setInviteTarget(g)}
                  />
                  <ActionBtn
                    label="Editar"
                    color={C.muted}
                    onClick={() => { setEditingGroup(g); setShowCreate(true); }}
                  />
                  <ActionBtn
                    label="Excluir"
                    color={C.red}
                    onClick={() => handleDeleteGroup(g)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Painel de membros do grupo selecionado ──────────────────────── */}
      <div style={{
        width: 320, minWidth: 280,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {!selectedGroup ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: 24 }}>
            <div style={{ fontSize: 28 }}>←</div>
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
              Selecione um grupo para ver membros e convites
            </p>
          </div>
        ) : (
          <>
            {/* Header do grupo */}
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: selectedGroup.color + '20',
                border: `1px solid ${selectedGroup.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {selectedGroup.icon || '👥'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedGroup.name}
                </div>
                {selectedGroup.description && (
                  <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedGroup.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => setInviteTarget(selectedGroup)}
                style={{ ...primaryBtn, padding: '5px 10px', fontSize: 11 }}
              >
                + Convidar
              </button>
            </div>

            {/* Membros */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingMembers ? (
                <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 13 }}>
                  Carregando...
                </div>
              ) : (
                <>
                  {members.length > 0 && (
                    <section>
                      <div style={{ padding: '10px 18px 6px', fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Membros · {members.length}
                      </div>
                      {members.map((m, i) => (
                        <div key={m.id} style={{
                          padding: '10px 18px',
                          borderBottom: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: C.cyanDim,
                            border: `1px solid ${C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: C.cyan, fontWeight: 700, flexShrink: 0,
                          }}>
                            {m.profile?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.profile?.name ?? '—'}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              {m.role === 'owner' ? '👑 Dono' : m.role === 'admin' ? '⭐ Admin' : '· membro'}
                              {' · '}
                              {formatTime(m.joined_at)}
                            </div>
                          </div>
                          {m.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(m)}
                              style={{
                                background: 'none', border: 'none',
                                color: C.subtle, cursor: 'pointer',
                                fontSize: 14, padding: '2px 4px',
                              }}
                              title="Remover membro"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Convites */}
                  {invites.length > 0 && (
                    <section>
                      <div style={{ padding: '10px 18px 6px', fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Convites · {invites.length}
                      </div>
                      {invites.map(inv => (
                        <div key={inv.id} style={{
                          padding: '10px 18px',
                          borderBottom: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: C.text, fontFamily: 'Roboto Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {inv.phone.slice(0, 4)}****{inv.phone.slice(-2)}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: inviteStatusColor(inv.status), fontWeight: 700 }}>
                                {inv.status}
                              </span>
                              <span>·</span>
                              <span>{inv.channel}</span>
                              <span>·</span>
                              <span>{formatTime(inv.created_at)}</span>
                            </div>
                          </div>
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleCancelInvite(inv)}
                              style={{ background: 'none', border: 'none', color: C.subtle, cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
                              title="Cancelar convite"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </section>
                  )}

                  {members.length === 0 && invites.length === 0 && (
                    <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                      <p style={{ color: C.muted, fontSize: 13 }}>Nenhum membro ainda.</p>
                      <button
                        onClick={() => setInviteTarget(selectedGroup)}
                        style={{ ...primaryBtn, marginTop: 12 }}
                      >
                        Convidar primeiro membro
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Modais ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateGroupModal
          editing={editingGroup}
          onClose={() => { setShowCreate(false); setEditingGroup(null); }}
          onSuccess={(group) => {
            setShowCreate(false);
            setEditingGroup(null);
            loadGroups();
          }}
        />
      )}

      {inviteTarget && (
        <InviteMemberModal
          group={inviteTarget}
          invitedBy={adminName ?? 'Admin'}
          onClose={() => setInviteTarget(null)}
          onSuccess={(invite) => {
            // Atualiza contagem de convites pendentes
            setGroups(prev => prev.map(g =>
              g.id === inviteTarget.id
                ? { ...g, pendingInvites: g.pendingInvites + 1 }
                : g,
            ));
            // Se o grupo atual está selecionado, atualiza lista de convites
            if (selectedGroup?.id === inviteTarget.id) {
              setInvites(prev => [invite, ...prev]);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function GroupIcon({ size = 16, color = '#00d4ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: `1px solid ${color}30`,
        borderRadius: 6,
        color: color,
        fontSize: 10,
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = color + '18'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      {label}
    </button>
  );
}

const headerLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 700,
  color: '#00d4ff',
  fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: 0.5,
};

const countBadge: React.CSSProperties = {
  fontSize: 10, fontWeight: 700,
  background: 'rgba(0,212,255,0.10)',
  color: '#00d4ff',
  border: '1px solid rgba(0,212,255,0.10)',
  borderRadius: 10, padding: '1px 7px',
};

const primaryBtn: React.CSSProperties = {
  padding: '7px 14px',
  background: 'rgba(0,212,255,0.10)',
  border: '1px solid rgba(0,212,255,0.25)',
  borderRadius: 8,
  color: '#00d4ff',
  fontSize: 12,
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
