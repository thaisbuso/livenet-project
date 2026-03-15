'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LivePlayer from '@/components/LivePlayer';
import SessionStatus from '@/components/SessionStatus';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Position, Session } from '@/lib/types';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSession(sessionData ?? null);

      if (sessionData) {
        const { data: positionsData } = await supabase
          .from('positions')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('created_at', { ascending: false })
          .limit(100);

        setPositions(positionsData ?? []);
      }
    }

    loadData();
  }, []);

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
                <Link href="/" className="nav-link">Início</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-4">
        {/* Status da sessão */}
        <div className="row mb-4">
          <div className="col-12">
            <SessionStatus session={session} />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className={`card h-100 ${activeCard === 'video' ? 'active' : ''}`} onClick={() => toggleCard('video')}>
              <div className="card-header">
                <h2 className="card-title">📺 Transmissão</h2>
              </div>
              <div className="card-body p-0">
                <LivePlayer />
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className={`card h-100 ${activeCard === 'map' ? 'active' : ''}`} onClick={() => toggleCard('map')}>
              <div className="card-header">
                <h2 className="card-title">🗺️ Mapa ao Vivo</h2>
              </div>
              <div className="card-body p-0">
                <LiveMap positions={positions} />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        {!session && (
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <strong>⏳ Aguardando transmissão...</strong>
                <br />
                A transmissão será iniciada quando o painel admin começar a enviar dados.
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}