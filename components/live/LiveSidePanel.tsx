'use client';

import { useState } from 'react';
import LivePlayer from '@/components/LivePlayer';
import { Session, Livestream } from '@/lib/types';

type Stats = {
  distanceKm: number;
  durationMs: number;
  livestreamsCount: number;
};

interface Props {
  session: Session | null;
  stats: Stats | null;
  activeLivestream: Livestream | null;
  formatDuration: (ms: number) => string;
}

const PARTICIPANTS = ['Todos', 'Thaís', 'Ricardo', 'Carlos', 'Tonimek', 'Daiani'];

const MOCK_DAYS = [
  {
    day: 'DIA 01',
    date: '10 de mar',
    km: '374km',
    title: 'Saída · Centro histórico',
    desc: 'Primeiro streaming ao vivo. Clima favorável, sinal estável em toda a rota.',
    tags: ['CENTRO', 'ROTA A', 'LIVE #1'],
  },
  {
    day: 'DIA 02',
    date: '11 de mar',
    km: '218km',
    title: 'Zona Norte → Leste',
    desc: 'Travessia pelos bairros industriais. Alta densidade urbana, sinais de GPS com interferência.',
    tags: ['ZONA NORTE', 'ZONA LESTE', 'URBANO'],
  },
];

export default function LiveSidePanel({ session, stats, activeLivestream, formatDuration }: Props) {
  const [activeChip, setActiveChip] = useState('Todos');

  return (
    <>
      {/* ── Session title + metrics ── */}
      <div className="sp-card">
        <div className="session-block">
          <p className="session-name">
            {session?.title ?? 'NEXARI OS — LIVE'}
          </p>
          <p className="session-meta">
            Monitoramento GPS em tempo real · NumbatNET
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Distância</span>
            <span className="metric-value v-green">
              {stats ? `${stats.distanceKm.toFixed(0)} km` : '—'}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Duração</span>
            <span className="metric-value">
              {stats ? formatDuration(stats.durationMs) : '—'}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Vídeos</span>
            <span className="metric-value v-red">
              {stats?.livestreamsCount ?? '—'}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Status</span>
            <span className={`metric-value v-dim ${session ? 'v-green' : ''}`}>
              {session ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Participants / cameras ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-label">CÂMERAS / PARTICIPANTES</span>
        </div>
        <div className="chips-body">
          {PARTICIPANTS.map(p => (
            <button
              key={p}
              className={`p-chip ${activeChip === p ? 'on' : 'off'}`}
              onClick={() => setActiveChip(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Live player ── */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-label">TRANSMISSÃO</span>
          {activeLivestream && (
            <span style={{
              fontSize: '0.52rem',
              color: '#00FF88',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}>
              ● AO VIVO
            </span>
          )}
        </div>
        <div className="video-card-body">
          <LivePlayer youtubeUrl={activeLivestream?.youtube_url} />
        </div>
      </div>

      {/* ── Day cards ── */}
      <div className="day-cards-wrap">
        <div className="day-section-label">REGISTRO DE DIAS</div>
        {MOCK_DAYS.map(d => (
          <div key={d.day} className="day-card">
            <div className="day-card-top">
              <span className="day-tag-day">{d.day} · {d.date}</span>
              <span className="day-km">{d.km}</span>
            </div>
            <div className="day-card-body">
              <p className="day-title">{d.title}</p>
              <p className="day-desc">{d.desc}</p>
              <div className="day-tags">
                {d.tags.map(t => <span key={t} className="dtag">{t}</span>)}
              </div>
              <div className="day-thumbs">
                {[0, 1].map(i => (
                  <div key={i} className="day-thumb">
                    <span className="day-thumb-icon">▶</span>
                    <span className="day-thumb-caption">Vídeo {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
