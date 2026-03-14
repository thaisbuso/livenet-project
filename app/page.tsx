import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Nautimar Live MVP</h1>
        <p>Hub inicial de live + geolocalização.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/live"><button>Ver live</button></Link>
          <Link href="/admin"><button>Painel admin</button></Link>
        </div>
      </div>
    </main>
  );
}