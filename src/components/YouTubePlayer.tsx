"use client";

interface YouTubePlayerProps {
  videoUrl: string | null;
  title: string;
}

export function YouTubePlayer({ videoUrl, title }: YouTubePlayerProps) {
  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-black/50 rounded-lg flex items-center justify-center border border-white/10">
        <p className="text-white/50 text-center">Trailer não disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
      <iframe
        width="100%"
        height="100%"
        src={videoUrl}
        title={`Trailer de ${title}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
