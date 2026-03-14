export default function LivePlayer() {
  const embedUrl = process.env.NEXT_PUBLIC_STREAM_EMBED_URL;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Transmissão ao vivo</h2>
      {embedUrl ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          <iframe
            src={embedUrl}
            title="Live"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              borderRadius: 16
            }}
          />
        </div>
      ) : (
        <div>
          Defina <code>NEXT_PUBLIC_STREAM_EMBED_URL</code> para exibir a live.
        </div>
      )}
    </div>
  );
}