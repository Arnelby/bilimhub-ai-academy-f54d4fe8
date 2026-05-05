import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { basicVideoById, basicVideoForTopic, toYouTubeEmbed } from '@/lib/basicVideos';

/**
 * Stable per-video page so the rest of the app can deep-link straight into a
 * single basic lesson (e.g. from a wrong practice answer) instead of dumping
 * users on a long list. Route: /video/:videoId
 *
 * If the videoId is unknown, we DO NOT render an empty page — we either fall
 * back to a topic-based lookup (when ?topic=... is present) or send the user
 * straight to the AI tutor for that topic.
 */
export default function BasicVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fromTopic = params.get('topic');
  const video = basicVideoById(videoId) ?? basicVideoForTopic(fromTopic);

  // No video resolved → never show an empty page. Redirect to AI tutor
  // (or the lessons hub if no topic is known) using effect to avoid render-time nav.
  useEffect(() => {
    if (!video) {
      console.warn('[VIDEO_MAPPING_FAILED]', { videoId, topic: fromTopic });
      const target = fromTopic
        ? `/ai-tutor?topic=${encodeURIComponent(fromTopic)}`
        : '/lessons';
      navigate(target, { replace: true });
    }
  }, [video, videoId, fromTopic, navigate]);

  if (!video) return null;

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Базовый урок
          </p>
          <h1 className="text-2xl font-bold">{video.title}</h1>
          {fromTopic && (
            <p className="text-sm text-muted-foreground mt-1">
              Рекомендован после ошибки в теме «{fromTopic}»
            </p>
          )}
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={toYouTubeEmbed(video.url)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/practice')}>
            <BookOpen className="mr-2 h-4 w-4" />
            К практике
          </Button>
          <Button variant="outline" onClick={() => navigate('/lessons')}>
            Все уроки
          </Button>
        </div>
      </div>
    </Layout>
  );
}
