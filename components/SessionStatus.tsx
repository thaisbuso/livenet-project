import { Session } from '@/lib/types';

export default function SessionStatus({ session }: { session: Session | null }) {
  if (!session) {
    return <div className="card">Nenhuma sessão ao vivo.</div>;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>STATUS</div>
          <h2 style={{ margin: '8px 0 0' }}>{session.title}</h2>
        </div>
        <div style={{
          background: '#16382e',
          color: '#83f0c7',
          padding: '8px 12px',
          borderRadius: 999,
          fontWeight: 700
        }}>
          AO VIVO
        </div>
      </div>
    </div>
  );
}