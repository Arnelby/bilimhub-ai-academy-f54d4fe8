import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Lock, Loader2, Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VideoEmbed } from '@/components/lessons/storage/VideoEmbed';
import { TEST_CONFIG } from '@/lib/mathTestConfig';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { translateTopic } from '@/lib/topicTranslations';

interface VideoSolution {
  id: string;
  test_id: string;
  question_number: number;
  youtube_url: string;
}

const VARIANT_MAP: Record<string, { label: string; testConfigId: number }> = {
  variant1: { label: 'Математика тест вариант 1', testConfigId: 1 },
  variant2: { label: 'Математика тест вариант 2', testConfigId: 2 },
  variant3: { label: 'Математика тест вариант 3', testConfigId: 3 },
  variant4: { label: 'Математика тест вариант 4', testConfigId: 4 },
};

export default function LessonVariant() {
  const { variantId } = useParams<{ variantId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoSolution[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollQuestion = searchParams.get('question');
  const config = variantId ? VARIANT_MAP[variantId] : null;

  useEffect(() => {
    if (!user || !variantId || !config) { setLoading(false); return; }

    async function fetchData() {
      const [videosRes, testsRes, answersRes] = await Promise.all([
        supabase.from('video_solutions').select('*').eq('test_id', variantId!).order('question_number'),
        supabase.from('user_tests').select('test_id').eq('user_id', user!.id).not('completed_at', 'is', null),
        supabase.from('user_answers').select('test_id').eq('user_id', user!.id),
      ]);

      setVideos((videosRes.data as VideoSolution[]) || []);

      // Check if unlocked via user_tests (UUID) or user_answers (math_test_X)
      let unlocked = false;
      const uuid = TEST_CONFIG[config!.testConfigId]?.uuid;
      if (uuid && (testsRes.data || []).some(t => t.test_id === uuid)) unlocked = true;
      const mathTestId = `math_test_${config!.testConfigId}`;
      if ((answersRes.data || []).some(a => a.test_id === mathTestId)) unlocked = true;

      setIsUnlocked(unlocked);
      setLoading(false);
    }

    fetchData();
  }, [user, variantId]);

  // Auto-scroll to question
  useEffect(() => {
    if (scrollQuestion && !loading && isUnlocked) {
      const qNum = parseInt(scrollQuestion, 10);
      if (!isNaN(qNum)) {
        setTimeout(() => {
          questionRefs.current[qNum]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [scrollQuestion, loading, isUnlocked]);

  if (!config) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Вариант не найден</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/lessons')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="container py-12 text-center max-w-lg mx-auto">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{config.label}</h1>
          <p className="text-muted-foreground mb-6">
            Сначала пройдите этот тест, чтобы открыть видеоразборы.
          </p>
          <Button onClick={() => navigate('/tests')}>Перейти к тестам</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/lessons')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Все видеоразборы
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">{config.label}</h1>
          <p className="text-muted-foreground mt-1">
            {videos.length} {videos.length === 1 ? 'видеоразбор' : 'видеоразборов'}
          </p>
        </div>

        {videos.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            defaultValue={scrollQuestion ? `q-${scrollQuestion}` : undefined}
            className="space-y-3"
          >
            {videos.map((video) => (
              <AccordionItem
                key={video.id}
                value={`q-${video.question_number}`}
                className="border rounded-lg overflow-hidden"
              >
                <div ref={(el) => { questionRefs.current[video.question_number] = el; }}>
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Play className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-medium">Разбор задачи {video.question_number}</span>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="px-5 pb-5">
                  <VideoEmbed
                    url={video.youtube_url}
                    title={`${config.label} — Задача ${video.question_number}`}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Видеоразборы скоро будут добавлены</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
