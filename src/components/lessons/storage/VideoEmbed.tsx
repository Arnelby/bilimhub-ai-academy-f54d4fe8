import { Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoEmbedProps {
  url?: string;
  title: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/shorts\/([^&?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  // Use privacy-enhanced + lighter domain; rel=0 to keep related videos minimal
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

export function VideoEmbed({ url, title }: VideoEmbedProps) {
  if (!url) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center" style={{ minHeight: '200px' }}>
        <Video className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-center">Video placeholder</p>
        <p className="text-sm text-muted-foreground/70 text-center mt-1">{title}</p>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // If URL doesn't match YouTube pattern, show a link
  return (
    <div className="bg-muted/50 border rounded-lg p-6 flex flex-col items-center justify-center">
      <Video className="h-10 w-10 text-primary mb-3" />
      <p className="text-foreground font-medium mb-2">{title}</p>
      <Button variant="outline" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Open Video
        </a>
      </Button>
    </div>
  );
}
