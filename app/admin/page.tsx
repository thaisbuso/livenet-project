'use client';

import { useCallback, useEffect, useState } from 'react';

export default function AdminPage() {
  const [lat, setLat] = useState('-23.6207');
  const [lng, setLng] = useState('-45.4138');
  const [speed, setSpeed] = useState('12');
  const [heading, setHeading] = useState('90');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [autoSending, setAutoSending] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState('5');
  const normalizedToken = token.replace(/^Bearer\s+/i, '').trim();

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
    <main className="grid">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Painel Admin</h1>
        <p>Enviar coordenadas para o mapa ao vivo.</p>
      </div>

      <div className="card grid">
        <div>
          <label>Token admin</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token igual ao ADMIN_SHARED_TOKEN"
          />
        </div>

        <div>
          <label>Intervalo do GPS automático (segundos)</label>
          <input
            type="number"
            min="1"
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(e.target.value)}
          />
        </div>

        <div className="grid grid-2">
          <div>
            <label>Latitude</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>

          <div>
            <label>Longitude</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>

          <div>
            <label>Velocidade (nós)</label>
            <input value={speed} onChange={(e) => setSpeed(e.target.value)} />
          </div>

          <div>
            <label>Heading</label>
            <input value={heading} onChange={(e) => setHeading(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={sendManual}>Enviar posição manual</button>
          <button onClick={sendBrowserPosition}>Usar GPS do navegador</button>
          <button onClick={toggleAutoSending}>
            {autoSending ? 'Pausar envio automático' : 'Iniciar envio automático'}
          </button>
        </div>

        <div>{status}</div>
      </div>
    </main>
  );
}
