import { Play, ExternalLink, Film } from 'lucide-react';
import { useState } from 'react';
import { youtubeEmbedUrl, isYoutubeShorts } from '@/lib/utils';

interface VerticalVideoPlayerProps {
  url: string | null | undefined;
  title?: string;
  className?: string;
}

export function VerticalVideoPlayer({ url, title, className = '' }: VerticalVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = youtubeEmbedUrl(url);
  const isShort = isYoutubeShorts(url);

  if (!embedUrl) {
    return (
      <div
        className={`flex aspect-[9/16] w-full items-center justify-center rounded-2xl bg-ink-100 text-ink-400 ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <Film className="h-8 w-8" />
          <p className="text-xs font-medium">Sem vídeo</p>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div
        className={`overflow-hidden rounded-2xl bg-black shadow-lg ${isShort ? 'aspect-[9/16]' : 'aspect-video'} ${className}`}
      >
        <iframe
          src={`${embedUrl}&autoplay=1&loop=1&playlist=${embedUrl.split('/embed/')[1].split('?')[0]}`}
          title={title ?? 'Vídeo do exercício'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={embedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block overflow-hidden rounded-2xl bg-ink-900 shadow-lg ${isShort ? 'aspect-[9/16]' : 'aspect-video'} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        setPlaying(true);
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 transition-all group-hover:scale-110 group-hover:bg-white/25">
          <Play className="h-7 w-7 translate-x-0.5 fill-white" />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
          <ExternalLink className="h-3.5 w-3.5" />
          {isShort ? 'Shorts' : 'YouTube'}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </a>
  );
}
