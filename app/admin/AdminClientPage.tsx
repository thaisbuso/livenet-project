'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function AdminClientPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [lat, setLat] = useState('-23.6207');
  const [lng, setLng] = useState('-45.4138');
  const [speed, setSpeed] = useState('12');
  const [heading, setHeading] = useState('90');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [autoSending, setAutoSending] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState('5');
  const normalizedToken = token.replace(/^Bearer\s+/i, '').trim();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function sendManual() {
    if (!normalizedToken) {
      setStatus('Preencha o token admin (sem "Bearer").');
      return;
    }

    try {
      setStatus('Enviando...');

      const res = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalizedToken}`,
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
    if (!normalizedToken) {
      setStatus('Preencha o token admin (sem "Bearer").');
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
              Authorization: `Bearer ${normalizedToken}`,
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
  }, [normalizedToken]);

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
            🚐 NAUTIMAR LIVE
          </a>
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
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <span className={`badge ${autoSending ? 'badge-success' : 'badge-warning'}`}>
                  {autoSending ? '🔴 GPS ativo' : '⏸️ GPS pausado'}
                </span>
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
        <div className="card mb-4">
          <div className="card-body">
            <h1 className="card-title mb-2">🎯 Painel de Controle</h1>
            <p className="text-muted mb-0">Transmita sua localização em tempo real para o mapa ao vivo</p>
          </div>
        </div>

        <div className="row">
          {/* Coluna esquerda - Formulário */}
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">⚙️ Configurações</h2>
              </div>
              <div className="card-body">
                {/* Token */}
                <div className="mb-3">
                  <label htmlFor="tokenInput" className="form-label">Token Admin</label>
                  <input
                    id="tokenInput"
                    type="password"
                    className="form-control"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Cole seu token ADMIN_SHARED_TOKEN"
                  />
                  <small className="text-muted">Sem o prefixo 'Bearer'</small>
                </div>

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
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📊 Status</h2>
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