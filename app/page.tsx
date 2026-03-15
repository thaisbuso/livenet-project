'use client';

import Link from 'next/link';
import { useState } from 'react';
import BrazilTimeClock from '@/components/BrazilTimeClock';

export default function HomePage() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };
  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            DUCKLING LIVE NET
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
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <Link href="/live" className="nav-link">Ver Live</Link>
              </li>
              <li className="nav-item">
                <Link href="/admin" className="nav-link">Painel Admin</Link>
              </li>
              <li className="nav-item ms-3">
                <BrazilTimeClock />
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-5">
        {/* Hero Section */}
        <div className="row mb-5">
          <div className="col-lg-8 offset-lg-2">
            <div className={`card text-center ${activeCard === 'hero' ? 'active' : ''}`} onClick={() => toggleCard('hero')}>
              <div className="card-body py-5">
                <h1 className="display-4 mb-3">DUCKLING LIVE MVP</h1>
                <p className="lead text-muted mb-4">
                  Transmita sua localização em tempo real com GPS para seu público
                </p>
                <hr className="border-warning" />
                <p className="mb-4">
                  Acompanhe movimentações ao vivo no mapa interativo. Perfeito para livestreaming na rua!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="row mb-5">
          <div className="col-md-6 mb-4">
            <div className={`card h-100 border-2 border-warning ${activeCard === 'live' ? 'active' : ''}`} onClick={() => toggleCard('live')}>
              <div className="card-body">
                <h2 className="card-title mb-3">Ver Live</h2>
                <p className="text-muted mb-4">
                  Acompanhe o transmissor em tempo real através do mapa interativo. Veja sua localização, velocidade e trajetória atualizar ao vivo.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">✅ Mapa interativo com Leaflet</li>
                  <li className="mb-2">✅ Atualização em tempo real</li>
                  <li className="mb-2">✅ Histórico de posições</li>
                  <li className="mb-2">✅ Sem autenticação necessária</li>
                </ul>
                <Link href="/live">
                  <button className="btn btn-primary btn-lg w-100 mt-3">Abrir Live →</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className={`card h-100 border-2 border-warning ${activeCard === 'admin' ? 'active' : ''}`} onClick={() => toggleCard('admin')}>
              <div className="card-body">
                <h2 className="card-title mb-3">Painel Admin</h2>
                <p className="text-muted mb-4">
                  Transmita suas coordenadas GPS. Configure o intervalo de envio e envie dados manualmente ou capture automaticamente.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">✅ Captura de GPS automática</li>
                  <li className="mb-2">✅ Envio manual de coordenadas</li>
                  <li className="mb-2">✅ Iniciar/pausar transmissão</li>
                  <li className="mb-2">✅ Protegido com token</li>
                </ul>
                <Link href="/admin">
                  <button className="btn btn-primary btn-lg w-100 mt-3">Acessar Painel →</button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="row mb-5">
          <div className="col-lg-8 offset-lg-2">
            <div className={`card bg-dark ${activeCard === 'info' ? 'active' : ''}`} onClick={() => toggleCard('info')}>
              <div className="card-body">
                <h3 className="card-title mb-3">Como usar:</h3>
                <ol className="list-styled">
                  <li className="mb-3">
                    <strong>No seu celular:</strong> Acesse o <Link href="/admin" className="text-warning">Painel Admin</Link> para transmitir sua localização
                  </li>
                  <li className="mb-3">
                    <strong>Para o público:</strong> Compartilhe o link da <Link href="/live" className="text-warning">página ao vivo</Link> para que todos acompanhem
                  </li>
                  <li className="mb-3">
                    <strong>Em tempo real:</strong> Conforme você se move, o mapa atualiza automaticamente mostrando sua posição
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <div className="text-center text-muted border-top pt-4">
              <p className="mb-0">
                🌐 DUCKLING Live MVP - Livestreaming com GPS em tempo real
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}