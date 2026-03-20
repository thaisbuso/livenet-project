'use client';

import React, { useState } from 'react';
import { createInvite, validatePhone, normalizePhone, buildInviteLink, buildWhatsAppLink } from '@/lib/invites';
import { logEvent } from '@/lib/social';
import type { Group, Invite } from '@/lib/types';

const C = {
  surface:   '#0f1623',
  border:    'rgba(0,212,255,0.10)',
  cyan:      '#00d4ff',
  green:     '#00ff88',
  text:      '#e8edf5',
  muted:     'rgba(232,237,245,0.40)',
  input:     '#0b0f1a',
  red:       '#ff3b3b',
  orange:    '#ff8c00',
};

type Props = {
  group:     Group;
  invitedBy: string;
  onClose:   () => void;
  onSuccess: (invite: Invite) => void;
};

type Step = 'form' | 'created';

export default function InviteMemberModal({ group, invitedBy, onClose, onSuccess }: Props) {
  const [step,     setStep]    = useState<Step>('form');
  const [phone,    setPhone]   = useState('');
  const [channel,  setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [sending,  setSending] = useState(false);
  const [error,    setError]   = useState('');
  const [invite,   setInvite]  = useState<Invite | null>(null);
  const [copied,   setCopied]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePhone(phone)) {
      setError('Informe um número válido (com DDD, 10-15 dígitos).');
      return;
    }

    setSending(true);
    setError('');

    try {
      const created = await createInvite({
        group_id:   group.id,
        phone:      normalizePhone(phone),
        channel,
        invited_by: invitedBy,
      });

      await logEvent('invite_created', group.id, null, {
        phone: normalizePhone(phone).slice(0, 4) + '****',
        channel,
      });

      setInvite(created);
      setStep('created');
      onSuccess(created);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar convite.');
      setSending(false);
    }
  }

  async function copyLink() {
    if (!invite) return;
    const link = buildInviteLink(invite.token);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inviteLink = invite ? buildInviteLink(invite.token) : '';
  const waLink     = invite ? buildWhatsAppLink(invite.phone, group.name, inviteLink) : '';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '24px 20px',
        fontFamily: 'Rajdhani, sans-serif',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Convidar membro
            </span>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {group.icon} {group.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>
            ✕
          </button>
        </div>

        {/* ─── FORM ─────────────────────────────────────── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={labelStyle}>Número de celular *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: 11999998888 (com DDD)"
                required
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                O número será usado apenas para envio do convite.
                Localização requer consentimento do convidado.
              </p>
            </div>

            {/* Canal */}
            <div>
              <label style={labelStyle}>Canal de envio</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['whatsapp', 'sms'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: 8,
                      border: `1px solid ${channel === ch ? C.cyan + '50' : C.border}`,
                      background: channel === ch ? 'rgba(0,212,255,0.1)' : 'transparent',
                      color: channel === ch ? C.cyan : C.muted,
                      fontSize: 12,
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: channel === ch ? 700 : 400,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      cursor: 'pointer',
                    }}
                  >
                    {ch === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                style={{
                  flex: 2, padding: '10px',
                  background: 'rgba(0,212,255,0.12)',
                  border: `1px solid rgba(0,212,255,0.3)`,
                  borderRadius: 8,
                  color: C.cyan,
                  fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'Criando...' : 'Gerar link de convite'}
              </button>
            </div>
          </form>
        )}

        {/* ─── CREATED ──────────────────────────────────── */}
        {step === 'created' && invite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.green, margin: '0 0 4px' }}>
                Convite criado!
              </p>
              <p style={{ fontSize: 12, color: C.muted }}>
                Compartilhe o link abaixo com o convidado.
              </p>
            </div>

            {/* Link */}
            <div style={{
              background: '#0b0f1a',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', margin: '0 0 4px' }}>
                Link do convite
              </p>
              <p style={{
                fontSize: 12,
                color: C.cyan,
                fontFamily: 'Roboto Mono, monospace',
                margin: 0,
                wordBreak: 'break-all',
              }}>
                {inviteLink}
              </p>
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={copyLink} style={{
                padding: '10px',
                borderRadius: 8,
                border: `1px solid rgba(0,212,255,0.3)`,
                background: copied ? 'rgba(0,255,136,0.12)' : 'rgba(0,212,255,0.1)',
                color: copied ? C.green : C.cyan,
                fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
                cursor: 'pointer',
              }}>
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </button>

              {channel === 'whatsapp' && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: 8,
                    border: `1px solid rgba(37,211,102,0.35)`,
                    background: 'rgba(37,211,102,0.1)',
                    color: '#25d166',
                    fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    textDecoration: 'none',
                  }}
                >
                  Abrir no WhatsApp
                </a>
              )}
            </div>

            <p style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
              Válido por 7 dias. Convidado decide se compartilha localização ao aceitar.
            </p>

            <button onClick={onClose} style={cancelBtnStyle}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'rgba(232,237,245,0.40)',
  textTransform: 'uppercase', letterSpacing: 0.5,
  display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0b0f1a',
  border: '1px solid rgba(0,212,255,0.10)',
  borderRadius: 8, padding: '9px 12px',
  color: '#e8edf5', fontSize: 13,
  fontFamily: 'Rajdhani, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px',
  background: 'transparent',
  border: `1px solid rgba(0,212,255,0.10)`,
  borderRadius: 8, color: 'rgba(232,237,245,0.40)',
  fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
  cursor: 'pointer',
};
