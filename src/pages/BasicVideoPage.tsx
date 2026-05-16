import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { basicVideoById, basicVideoForTopic, basicVideoTitle, toYouTubeEmbed } from '@/lib/basicVideos';
import { useTopicName } from '@/hooks/useTopicName';

export default function BasicVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fromTopic = params.get('topic');
  const video = basicVideoById(videoId) ?? basicVideoForTopic(fromTopic);
  const localizedTopic = useTopicName(fromTopic);
  const title = basicVideoTitle(video);

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
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
        </Button>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {t('basicVideoPage.kicker', { defaultValue: 'Basic lesson' })}
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          {fromTopic && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('basicVideoPage.recommendedAfter', {
                defaultValue: 'Recommended after a mistake in «{{topic}}»',
                topic: localizedTopic || fromTopic,
              })}
            </p>
          )}
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={toYouTubeEmbed(video.url)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/practice')}>
            <BookOpen className="mr-2 h-4 w-4" />
            {t('basicVideoPage.toPractice', { defaultValue: 'To practice' })}
          </Button>
          <Button variant="outline" onClick={() => navigate('/lessons')}>
            {t('basicVideoPage.allLessons', { defaultValue: 'All lessons' })}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
