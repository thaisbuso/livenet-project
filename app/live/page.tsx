'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LivePlayer from '@/components/LivePlayer';
import SessionStatus from '@/components/SessionStatus';
import SessionStats from '@/components/SessionStats';
import BrazilTimeClock from '@/components/BrazilTimeClock';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Position, Session, Livestream } from '@/lib/types';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeLivestream, setActiveLivestream] = useState<Livestream | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      // Buscar sessão ativa
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

      // Buscar livestream ativa
      const { data: livestreamData } = await supabase
        .from('livestreams')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveLivestream(livestreamData ?? null);
    }

    loadData();

    // Atualizar dados a cada 30 segundos
    const intervalId = setInterval(() => {
      loadData();
    }, 30000);

    // Realtime subscription para livestreams
    const supabase = createSupabaseBrowserClient();
    const livestreamChannel = supabase
      .channel('livestreams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livestreams' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      livestreamChannel.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            NEXARI OS 
          </a>
          <span style={{ color: '#ffffff4d', fontFamily: 'Rajdhani', marginLeft: '8px' }}>by NumbatNET</span>
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
                <Link href="/" className="nav-link">Início</Link>
              </li>
              <li className="nav-item ms-3">
                <BrazilTimeClock />
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

        {/* Estatísticas da sessão */}
        <div className="row mb-4">
          <div className="col-12">
            <SessionStats />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className={`card h-100 ${activeCard === 'video' ? 'active' : ''}`} onClick={() => toggleCard('video')}>
              <div className="card-header">
                <h2 className="card-title">Transmissão</h2>
              </div>
              <div className="card-body p-0">
                <LivePlayer youtubeUrl={activeLivestream?.youtube_url} />
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className={`card h-100 ${activeCard === 'map' ? 'active' : ''}`} onClick={() => toggleCard('map')}>
              <div className="card-header">
                <h2 className="card-title">Mapa ao Vivo</h2>
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