'use client';

import React, { useState } from 'react';
import { createGroup, updateGroup, type CreateGroupInput } from '@/lib/groups';
import type { Group } from '@/lib/types';

// Tokens de design do admin (compatível com AdminClientPage)
const C = {
  bg:        '#080b12',
  surface:   '#0f1623',
  surfaceAlt:'#121926',
  border:    'rgba(0,212,255,0.10)',
  cyan:      '#00d4ff',
  text:      '#e8edf5',
  muted:     'rgba(232,237,245,0.40)',
  input:     '#0b0f1a',
  red:       '#ff3b3b',
};

const PRESET_COLORS = [
  '#00d4ff', '#00ff88', '#ff8c00', '#ff3b3b',
  '#a855f7', '#ec4899', '#3b82f6', '#f59e0b',
];

const PRESET_ICONS = ['👥', '📍', '🏔️', '🌊', '🏕️', '🎯', '🔥', '⚡', '🌙', '🚀'];

type Props = {
  onClose:   () => void;
  onSuccess: (group: Group) => void;
  editing?:  Group | null;
};

export default function CreateGroupModal({ onClose, onSuccess, editing }: Props) {
  const [name,        setName]        = useState(editing?.name        ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [color,       setColor]       = useState(editing?.color       ?? '#00d4ff');
  const [icon,        setIcon]        = useState(editing?.icon        ?? '👥');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError('');

    const input: CreateGroupInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
    };

    try {
      let group: Group;
      if (editing) {
        group = await updateGroup(editing.id, input);
      } else {
        group = await createGroup(input);
      }
      onSuccess(group);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar grupo.');
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {editing ? 'Editar Grupo' : 'Novo Grupo'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome do grupo *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Família, Trilha 2025..."
              required
              maxLength={60}
              style={inputStyle}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o grupo brevemente"
              maxLength={120}
              style={inputStyle}
            />
          </div>

          {/* Cor */}
          <div>
            <label style={labelStyle}>Cor do grupo</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c,
                    border: color === c ? `3px solid ${C.text}` : '3px solid transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                title="Cor personalizada"
              />
            </div>
          </div>

          {/* Ícone */}
          <div>
            <label style={labelStyle}>Ícone</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    width: 36, height: 36,
                    background: icon === ic ? C.surfaceAlt : 'transparent',
                    border: `1px solid ${icon === ic ? C.border : 'transparent'}`,
                    borderRadius: 8,
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: color + '12',
            border: `1px solid ${color}30`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{name || 'Nome do grupo'}</div>
              {description && <div style={{ fontSize: 11, color: C.muted }}>{description}</div>}
            </div>
            <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: color }} />
          </div>

          {error && <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px',
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.muted,
                fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                flex: 2, padding: '10px',
                background: 'rgba(0,212,255,0.12)',
                border: `1px solid rgba(0,212,255,0.3)`,
                borderRadius: 8,
                color: C.cyan,
                fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Salvando...' : (editing ? 'Salvar alterações' : 'Criar grupo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(232,237,245,0.40)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  display: 'block',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0b0f1a',
  border: '1px solid rgba(0,212,255,0.10)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#e8edf5',
  fontSize: 13,
  fontFamily: 'Rajdhani, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};
