'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Design tokens (compatível com a identidade NumbatNET) ───────────────────
const C = {
  bg:      '#080b12',
  surface: '#0f1623',
  border:  'rgba(0,212,255,0.12)',
  cyan:    '#00d4ff',
  green:   '#00ff88',
  red:     '#ff3b3b',
  text:    '#e8edf5',
  muted:   'rgba(232,237,245,0.45)',
  input:   '#121926',
};

type InviteData = {
  id: string;
  status: string;
  channel: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
  };
};

type Step = 'loading' | 'error' | 'form';

export default function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const [step,       setStep]       = useState<Step>('loading');
  const [invite,     setInvite]     = useState<InviteData | null>(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Busca dados do convite na API pública
  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || 'Convite inválido.');
          setStep('error');
          return;
        }
        setInvite(json.invite);
        setStep('form');
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.');
        setStep('error');
      }
    }
    fetchInvite();
  }, [token]);

  // Aceita o convite
  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Informe um telefone válido (com DDD).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleanPhone }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || 'Erro ao aceitar convite.');
        setSubmitting(false);
        return;
      }

      // Persiste no localStorage para uso no painel do membro
      localStorage.setItem('nb_profile_id',   json.profile_id);
      localStorage.setItem('nb_group_id',     json.group_id);
      localStorage.setItem('nb_name',         json.name);
      localStorage.setItem('nb_group_name',   invite!.group.name);
      localStorage.setItem('nb_group_icon',   invite!.group.icon ?? '');
      localStorage.setItem('nb_group_color',  invite!.group.color);

      router.push('/member');
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.');
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Rajdhani, Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Audiowide, cursive',
            fontSize: 20,
            color: C.cyan,
            letterSpacing: 2,
            marginBottom: 4,
          }}>
            NumbatNET
          </div>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 0.5 }}>
            Rede Social Geolocalizada
          </div>
        </div>

        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '28px 24px',
        }}>

          {/* ─── LOADING ─────────────────────────────────────── */}
          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: `3px solid ${C.border}`,
                borderTopColor: C.cyan,
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: C.muted, fontSize: 14 }}>Carregando convite...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ─── ERROR ───────────────────────────────────────── */}
          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'rgba(255,59,59,0.12)',
                border: `1px solid rgba(255,59,59,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22,
              }}>✕</div>
              <p style={{ color: C.red, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                Convite inválido
              </p>
              <p style={{ color: C.muted, fontSize: 13 }}>{errorMsg}</p>
            </div>
          )}

          {/* ─── FORM ────────────────────────────────────────── */}
          {step === 'form' && invite && (
            <>
              {/* Badge do grupo */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: invite.group.color + '14',
                border: `1px solid ${invite.group.color}35`,
                borderRadius: 10,
                marginBottom: 24,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: invite.group.color + '25',
                  border: `1px solid ${invite.group.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {invite.group.icon || '👥'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {invite.group.name}
                  </div>
                  {invite.group.description && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {invite.group.description}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
                Você foi convidado para participar deste grupo. Preencha seus dados para entrar.
              </p>

              <form onSubmit={handleAccept}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div>
                    <label style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Seu nome *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Como você quer ser conhecido"
                      required
                      maxLength={60}
                      style={{
                        width: '100%',
                        background: C.input,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '10px 14px',
                        color: C.text,
                        fontSize: 14,
                        fontFamily: 'Rajdhani, sans-serif',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Seu celular (com DDD) *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex: 11999998888"
                      required
                      style={{
                        width: '100%',
                        background: C.input,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '10px 14px',
                        color: C.text,
                        fontSize: 14,
                        fontFamily: 'Rajdhani, sans-serif',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      Usado apenas para identificação. Não localizamos você pelo telefone.
                    </p>
                  </div>

                  {errorMsg && (
                    <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: `1px solid ${invite.group.color}60`,
                      background: invite.group.color + '20',
                      color: invite.group.color,
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'Rajdhani, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                      transition: 'all 0.18s',
                    }}
                  >
                    {submitting ? 'Entrando...' : `Entrar no grupo ${invite.group.name}`}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

        {/* Rodapé */}
        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 20 }}>
          NumbatNET — Rede social geolocalizada em tempo real
        </p>
      </div>
    </div>
  );
}
