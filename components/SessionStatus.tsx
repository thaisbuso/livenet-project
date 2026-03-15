'use client';

import { Session } from '@/lib/types';
import { useState } from 'react';

export default function SessionStatus({ session }: { session: Session | null }) {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  if (!session) {
    return (
      <div className={`card ${activeCard === 'no-session' ? 'active' : ''}`} onClick={() => toggleCard('no-session')}>
        <div className="card-body text-center py-4">
          <h5 className="text-muted">⏳ Nenhuma sessão ao vivo</h5>
          <p className="text-muted mb-0">Aguardando transmissão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card border-2 border-success ${activeCard === 'session' ? 'active' : ''}`} onClick={() => toggleCard('session')}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted text-uppercase">🔴 Status</small>
            <h3 className="mb-0 mt-2">{session.title}</h3>
          </div>
          <span className="badge badge-success" style={{ fontSize: '1rem', padding: '12px 16px' }}>
            AO VIVO
          </span>
        </div>
      </div>
    </div>
  );
}