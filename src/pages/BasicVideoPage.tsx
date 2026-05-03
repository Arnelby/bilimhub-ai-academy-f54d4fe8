import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { basicVideoById, toYouTubeEmbed } from '@/lib/basicVideos';

/**
 * Stable per-video page so the rest of the app can deep-link straight into a
 * single basic lesson (e.g. from a wrong practice answer) instead of dumping
 * users on a long list. Route: /video/:videoId
 */
export default function BasicVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const video = basicVideoById(videoId);
  const fromTopic = params.get('topic');

  if (!video) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-xl font-bold mb-2">Видео не найдено</h1>
          <p className="text-muted-foreground mb-6">
            Запрошенный базовый урок недоступен.
          </p>
          <Button onClick={() => navigate('/lessons')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> К урокам
          </Button>
        </div>
      </Layout>
    );
  }

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
