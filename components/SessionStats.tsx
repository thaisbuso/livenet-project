'use client';

import { useEffect, useState } from 'react';

type SessionStats = {
  sessionId: string;
  sessionTitle: string;
  isLive: boolean;
  startedAt: string;
  endedAt: string | null;
  distanceKm: number;
  durationDays: number;
  durationMs: number;
  positionsCount: number;
  livestreamsCount: number;
  livestreams: any[];
};

export default function SessionStats() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/session/stats');
        const data = await res.json();

        if (res.ok && data.stats) {
          setStats(data.stats);
          setError(null);
        } else {
          setError(data.error || 'Nenhuma sessão ativa');
          setStats(null);
        }
      } catch (err) {
        setError('Erro ao carregar estatísticas');
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Formatar duração de forma legível
  const formatDuration = (durationMs: number) => {
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-warning mb-0">
            <strong>Aguardando sessão</strong>
            <br />
            {error || 'Nenhuma sessão ativa no momento'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card session-stats-card">
      <div className="card-header">
        <h2 className="card-title mb-0">Estatísticas da Sessão</h2>
      </div>
      <div className="card-body">
        {/* Título da sessão */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{stats.sessionTitle}</h5>
            {stats.isLive && (
              <span className="badge badge-danger">
                AO VIVO
              </span>
            )}
          </div>
        </div>

        {/* Grid de estatísticas */}
        <div className="row g-3">
          {/* Distância percorrida */}
          <div className="col-md-6 col-lg-3">
            <div className="p-3 bg-dark rounded text-center stat-box">
              <small className="text-muted text-uppercase d-block mb-2">Distância</small>
              <div className="h4 mb-0 stat-distance">
                {stats.distanceKm.toFixed(2)} km
              </div>
            </div>
          </div>

          {/* Duração */}
          <div className="col-md-6 col-lg-3">
            <div className="p-3 bg-dark rounded text-center stat-box">
              <small className="text-muted text-uppercase d-block mb-2">Duração</small>
              <div className="h4 mb-0 stat-duration">
                {stats.durationDays >= 1 
                  ? `${stats.durationDays.toFixed(1)} dias`
                  : formatDuration(stats.durationMs)
                }
              </div>
            </div>
          </div>

          {/* Livestreams */}
          <div className="col-md-6 col-lg-3">
            <div className="p-3 bg-dark rounded text-center stat-box">
              <small className="text-muted text-uppercase d-block mb-2">Vídeos</small>
              <div className="h4 mb-0 stat-videos">
                {stats.livestreamsCount}
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-3">
          <small className="text-muted">
            <strong>Início:</strong> {new Date(stats.startedAt).toLocaleString('pt-BR')}
            {stats.endedAt && (
              <>
                <br />
                <strong>Fim:</strong> {new Date(stats.endedAt).toLocaleString('pt-BR')}
              </>
            )}
          </small>
        </div>
      </div>
    </div>
  );
}
