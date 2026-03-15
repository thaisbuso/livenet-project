'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import BrazilTimeClock from '@/components/BrazilTimeClock';
import SessionStats from '@/components/SessionStats';
import type { Livestream } from '@/lib/types';

export default function AdminClientPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [lat, setLat] = useState('-23.6207');
  const [lng, setLng] = useState('-45.4138');
  const [speed, setSpeed] = useState('12');
  const [heading, setHeading] = useState('90');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [autoSending, setAutoSending] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState('5');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeLivestream, setActiveLivestream] = useState<Livestream | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [liveStatus, setLiveStatus] = useState('');
  const [liveDuration, setLiveDuration] = useState('');

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  // Obter token de sessão do Supabase
  useEffect(() => {
    async function getSessionToken() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
        fetchActiveLivestream();
      } else {
        setStatus('Erro: Sessão não encontrada. Faça login novamente.');
        router.push('/login');
      }
    }
    getSessionToken();
  }, [router, supabase.auth]);

  // Buscar livestream ativa
  async function fetchActiveLivestream() {
    try {
      const res = await fetch('/api/livestream');
      const json = await res.json();
      setActiveLivestream(json.livestream || null);
      // Se há uma live ativa, iniciar captura automática de GPS
      if (json.livestream) {
        setAutoSending(true);
      }
    } catch {
      console.error('Erro ao buscar livestream ativa');
    }
  }

  // Iniciar livestream
  async function startLivestream() {
    if (!sessionToken) {
      setLiveStatus('Erro: Não autenticado.');
      return;
    }

    if (!youtubeUrl.trim()) {
      setLiveStatus('Erro: URL do YouTube é obrigatória.');
      return;
    }

    try {
      setLiveStatus('Iniciando livestream...');
      const res = await fetch('/api/livestream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      const json = await res.json();
      if (res.ok) {
        setActiveLivestream(json.livestream);
        setYoutubeUrl('');
        setLiveStatus('Livestream iniciada com sucesso!');
        // Iniciar captura automática de GPS
        setAutoSending(true);
      } else {
        setLiveStatus(json.error || 'Erro ao iniciar livestream');
      }
    } catch {
      setLiveStatus('Erro ao iniciar livestream.');
    }
  }

  // Finalizar livestream
  async function endLivestream() {
    if (!sessionToken) {
      setLiveStatus('Erro: Não autenticado.');
      return;
    }

    try {
      setLiveStatus('Finalizando livestream...');
      const res = await fetch('/api/livestream', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const json = await res.json();
      if (res.ok) {
        setActiveLivestream(null);
        setLiveStatus('Livestream finalizada com sucesso!');
        // Parar captura automática de GPS
        setAutoSending(false);
      } else {
        setLiveStatus(json.error || 'Erro ao finalizar livestream');
      }
    } catch {
      setLiveStatus('Erro ao finalizar livestream.');
    }
  }

  // Atualizar duração da live
  useEffect(() => {
    if (!activeLivestream) {
      setLiveDuration('');
      return;
    }

    function updateDuration() {
      const startTime = new Date(activeLivestream.started_at).getTime();
      const now = Date.now();
      const diffMs = now - startTime;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setLiveDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    updateDuration();
    const intervalId = setInterval(updateDuration, 1000);

    return () => clearInterval(intervalId);
  }, [activeLivestream]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function sendManual() {
    if (!sessionToken) {
      setStatus('Erro: Não autenticado. Faça login novamente.');
      return;
    }

    try {
      setStatus('Enviando...');

      const res = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          lat: Number(lat),
          lng: Number(lng),
          speed_knots: Number(speed),
          heading: Number(heading),
          source: 'manual-admin',
        }),
      });

      const json = await res.json();
      setStatus(res.ok ? 'Posição enviada com sucesso.' : json.error || 'Erro ao enviar');
    } catch {
      setStatus('Erro ao enviar posição.');
    }
  }

  const sendBrowserPosition = useCallback(() => {
    if (!sessionToken) {
      setStatus('Erro: Não autenticado. Faça login novamente.');
      return;
    }

    if (!navigator.geolocation) {
      setStatus('Geolocalização não suportada neste dispositivo.');
      return;
    }

    setStatus('Capturando posição...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed_knots: position.coords.speed ?? null,
              heading: position.coords.heading ?? null,
              source: 'browser-gps',
            }),
          });

          const json = await res.json();
          setStatus(res.ok ? 'GPS enviado com sucesso.' : json.error || 'Erro ao enviar GPS');
        } catch {
          setStatus('Erro ao enviar GPS.');
        }
      },
      () => {
        setStatus('Não foi possível capturar o GPS.');
      }
    );
  }, [sessionToken]);

  useEffect(() => {
    if (!autoSending) return;

    const parsedSeconds = Number(intervalSeconds);
    const safeIntervalMs =
      Number.isFinite(parsedSeconds) && parsedSeconds > 0 ? parsedSeconds * 1000 : 5000;

    sendBrowserPosition();
    const intervalId = window.setInterval(sendBrowserPosition, safeIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoSending, intervalSeconds, sendBrowserPosition]);

  function toggleAutoSending() {
    setAutoSending((current) => !current);
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            Nexari OS
          </a>
          <span style={{ color: '#ffffff4d', fontFamily: 'Rajdhani', marginLeft: '8px' }}>by numbatNET</span>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <span className={`badge ${autoSending ? 'badge-success' : 'badge-warning'}`}>
                  {autoSending ? 'GPS ativo' : 'GPS pausado'}
                </span>
              </li>
              {activeLivestream && (
                <li className="nav-item ms-3">
                  <span className="badge badge-danger">
                    🔴 AO VIVO {liveDuration && `• ${liveDuration}`}
                  </span>
                </li>
              )}
              <li className="nav-item ms-3">
                <BrazilTimeClock />
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm ms-3">
                  Sair
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-4">
        {/* Header */}
        <div className={`card mb-4 ${activeCard === 'header' ? 'active' : ''}`} onClick={() => toggleCard('header')}>
          <div className="card-body">
            <h1 className="card-title mb-2">Painel de Controle</h1>
            <p className="text-muted mb-0">Transmita sua localização em tempo real para o mapa ao vivo</p>
          </div>
        </div>

        {/* Estatísticas da sessão */}
        <div className="row mb-4">
          <div className="col-12">
            <SessionStats />
          </div>
        </div>

        <div className="row">
          {/* Livestream Card */}
          <div className="col-lg-12 mb-4">
            <div className={`card ${activeCard === 'livestream' ? 'active' : ''}`} onClick={() => toggleCard('livestream')}>
              <div className="card-header">
                <h2 className="card-title">🎥 Livestream do YouTube</h2>
              </div>
              <div className="card-body">
                {!activeLivestream ? (
                  <>
                    <div className="mb-3">
                      <label htmlFor="youtubeUrlInput" className="form-label">URL do YouTube (embed ou watch)</label>
                      <input
                        id="youtubeUrlInput"
                        type="url"
                        className="form-control"
                        placeholder="https://www.youtube.com/watch?v=...  ou  https://www.youtube.com/embed/..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />
                      <small className="form-text text-muted">
                        Cole a URL da sua live do YouTube aqui
                      </small>
                    </div>
                    <button onClick={startLivestream} className="btn btn-danger btn-lg w-100">
                      🔴 Iniciar Livestream
                    </button>
                  </>
                ) : (
                  <>
                    <div className="alert alert-success mb-3">
                      <strong>✅ Livestream Ativa</strong>
                      <br />
                      <span className="text-muted">Iniciada há {liveDuration}</span>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">URL da Live:</label>
                      <div className="form-control-plaintext">
                        <code>{activeLivestream.youtube_url}</code>
                      </div>
                    </div>
                    <button onClick={endLivestream} className="btn btn-dark btn-lg w-100">
                      ⏹️ Finalizar Livestream
                    </button>
                  </>
                )}
                {liveStatus && (
                  <div className={`alert mt-3 mb-0 ${
                    liveStatus.includes('sucesso') ? 'alert-success' : 'alert-warning'
                  }`}>
                    {liveStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna esquerda - Formulário */}
          <div className="col-lg-6 mb-4">
            <div className={`card ${activeCard === 'config' ? 'active' : ''}`} onClick={() => toggleCard('config')}>
              <div className="card-header">
                <h2 className="card-title">Configurações</h2>
              </div>
              <div className="card-body">
                {/* Intervalo */}
                <div className="mb-3">
                  <label htmlFor="intervalInput" className="form-label">Intervalo de envio (segundos)</label>
                  <input
                    id="intervalInput"
                    type="number"
                    min="1"
                    className="form-control"
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(e.target.value)}
                  />
                </div>

                {/* Coordenadas */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label htmlFor="latInput" className="form-label">Latitude</label>
                    <input
                      id="latInput"
                      type="number"
                      step="0.0001"
                      className="form-control"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="lngInput" className="form-label">Longitude</label>
                    <input
                      id="lngInput"
                      type="number"
                      step="0.0001"
                      className="form-control"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>

                {/* Velocidade e Heading */}
                <div className="row mb-4">
                  <div className="col-6">
                    <label htmlFor="speedInput" className="form-label">Velocidade (nós)</label>
                    <input
                      id="speedInput"
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={speed}
                      onChange={(e) => setSpeed(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="headingInput" className="form-label">Heading (°)</label>
                    <input
                      id="headingInput"
                      type="number"
                      step="1"
                      min="0"
                      max="360"
                      className="form-control"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="d-grid gap-2">
                  <button onClick={sendManual} className="btn btn-primary btn-lg mb-2">
                    📍 Enviar Posição Manual
                  </button>
                  <button onClick={sendBrowserPosition} className="btn btn-secondary btn-lg mb-2">
                    📡 Capturar GPS do Navegador
                  </button>
                  <button onClick={toggleAutoSending} className={`btn btn-lg ${autoSending ? 'btn-danger' : 'btn-primary'}`}>
                    {autoSending ? '⏹️ Parar Envio Automático' : '▶️ Iniciar Envio Automático'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita - Status */}
          <div className="col-lg-6 mb-4">
            <div className={`card ${activeCard === 'status' ? 'active' : ''}`} onClick={() => toggleCard('status')}>
              <div className="card-header">
                <h2 className="card-title">Status</h2>
              </div>
              <div className="card-body">
                {/* Dados atuais */}
                <div className="mb-4">
                  <h5>Dados Atuais:</h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-dark">
                      <tbody>
                        <tr>
                          <td><strong>Latitude</strong></td>
                          <td><code>{lat}</code></td>
                        </tr>
                        <tr>
                          <td><strong>Longitude</strong></td>
                          <td><code>{lng}</code></td>
                        </tr>
                        <tr>
                          <td><strong>Velocidade</strong></td>
                          <td><code>{speed} nós</code></td>
                        </tr>
                        <tr>
                          <td><strong>Heading</strong></td>
                          <td><code>{heading}°</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mensagem de status */}
                {status && (
                  <div className={`alert ${
                    status.includes('sucesso') || status.includes('sucesso com sucesso') || status.includes('enviado')
                      ? 'alert-success'
                      : status.includes('Enviando') || status.includes('Capturando')
                      ? 'alert-info'
                      : 'alert-warning'
                  }`} role="alert">
                    {status}
                  </div>
                )}

                {/* Info */}
                <div className="alert alert-info">
                  <strong>💡 Dica:</strong> Use o navegador do celular para capturar GPS automático enquanto se move.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}