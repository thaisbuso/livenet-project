interface LivePlayerProps {
  youtubeUrl?: string | null;
}

export default function LivePlayer({ youtubeUrl }: LivePlayerProps) {
  // Extrair ID do vídeo da URL do YouTube
  const getEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      
      // Já é uma URL de embed
      if (url.includes('youtube.com/embed/')) {
        const embedUrl = new URL(url);
        embedUrl.searchParams.set('autoplay', '1');
        return embedUrl.toString();
      }
      
      // URL do tipo watch?v=
      if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
        const videoId = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      
      // URL curta youtu.be
      if (urlObj.hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const embedUrl = youtubeUrl ? getEmbedUrl(youtubeUrl) : null;

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
          <strong>⏳ Aguardando transmissão...</strong>
          <br />
          Nenhuma live ativa no momento. A transmissão aparecerá aqui quando o admin iniciar uma live.
        </div>
      )}
    </div>
  );
}