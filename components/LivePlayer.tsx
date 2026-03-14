export default function LivePlayer() {
  const embedUrl = process.env.NEXT_PUBLIC_STREAM_EMBED_URL;

  return (
    <div>
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
              borderRadius: 12
            }}
          />
        </div>
      ) : (
        <div className="alert alert-warning mb-0">
          <strong>⚠️ Configuração necessária</strong>
          <br />
          Defina <code>NEXT_PUBLIC_STREAM_EMBED_URL</code> para exibir a transmissão ao vivo.
        </div>
      )}
    </div>
  );
}