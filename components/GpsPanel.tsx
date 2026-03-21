'use client';

import React, { useState } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#080b12',
  surface:   '#0f1623',
  surfaceAlt:'#121926',
  border:    'rgba(0,212,255,0.10)',
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
};

const CSS_ID = 'gpspanel-styles';

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 } as React.CSSProperties;
  const icons: Record<string, React.ReactElement> = {
    gps:  <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
    stop: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
    play: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    send: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    pin:  <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  };
  return icons[name] ?? <span style={{ width: size, height: size, display: 'block' }} />;
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

// ─── GpsPanel ─────────────────────────────────────────────────────────────────
export interface GpsPanelProps {
  lat: string;
  lng: string;
  speed: string;
  heading: string;
  intervalSeconds: string;
  autoSending: boolean;
  status: string;
  onLat: (v: string) => void;
  onLng: (v: string) => void;
  onSpeed: (v: string) => void;
  onHeading: (v: string) => void;
  onInterval: (v: string) => void;
  onSendManual: () => void;
  onSendBrowser: () => void;
  onToggleAuto: () => void;
}

export default function GpsPanel({
  lat, lng, speed, heading, intervalSeconds, autoSending, status,
  onLat, onLng, onSpeed, onHeading, onInterval,
  onSendManual, onSendBrowser, onToggleAuto,
}: GpsPanelProps) {
  const inputStyle: React.CSSProperties = {
    background: '#0a0f1c',
    border: `1px solid ${C.border}`,
    color: C.text,
    borderRadius: 7,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'Roboto Mono, monospace',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 10,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 500,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = C.cyan;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,212,255,0.10)';
  };

  const statusColor = status.includes('sucesso') || status.includes('enviado')
    ? C.green
    : status.includes('Enviando') || status.includes('Capturando')
    ? C.cyan
    : C.orange;

  const statusBg = status.includes('sucesso') || status.includes('enviado')
    ? C.greenDim
    : status.includes('Enviando') || status.includes('Capturando')
    ? C.cyanDim
    : C.orangeDim;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon name="gps" size={15} color={C.cyan} />
        <span style={{
          fontSize: 13, fontWeight: 700, color: C.cyan,
          fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
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

      {/* Body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Interval */}
        <div>
          <label style={labelStyle}>Intervalo (s)</label>
          <input
            type="number" min="5" value={intervalSeconds}
            onChange={e => onInterval(e.target.value)}
            onFocus={handleFocus} onBlur={handleBlur}
            style={inputStyle}
          />
        </div>

        {/* Coords */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input
              type="number" step="0.000001" value={lat}
              onChange={e => onLat(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input
              type="number" step="0.000001" value={lng}
              onChange={e => onLng(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Velocidade (nós)</label>
            <input
              type="number" step="0.1" value={speed}
              onChange={e => onSpeed(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Heading (°)</label>
            <input
              type="number" step="1" min="0" max="360" value={heading}
              onChange={e => onHeading(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ActionBtn icon="pin"  label="Enviar Posição Manual"       onClick={onSendManual} variant="default" />
          <ActionBtn icon="gps"  label="Capturar GPS do Navegador"   onClick={onSendBrowser} variant="default" />
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
            background: statusBg,
            color: statusColor,
            border: `1px solid ${statusColor}50`,
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
