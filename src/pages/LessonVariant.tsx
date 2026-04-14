import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Lock, Loader2, Play, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
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
  const { isAI, loading: groupLoading } = useUserGroup();

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoSolution[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userResults, setUserResults] = useState<Record<number, boolean>>({});
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [savingVideo, setSavingVideo] = useState<string | null>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollQuestion = searchParams.get('question');
  const config = variantId ? VARIANT_MAP[variantId] : null;

  useEffect(() => {
    if (!user || !variantId || !config) { setLoading(false); return; }

    async function fetchData() {
      const mathTestId = `math_test_${config!.testConfigId}`;
      const [videosRes, testsRes, answersRes, progressRes] = await Promise.all([
        supabase.from('video_solutions').select('*').eq('test_id', variantId!).order('question_number'),
        supabase.from('user_tests').select('test_id').eq('user_id', user!.id).not('completed_at', 'is', null),
        supabase.from('user_answers').select('test_id, question_id, is_correct').eq('user_id', user!.id).eq('test_id', mathTestId),
        supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', user!.id).eq('completed', true),
      ]);

      setVideos((videosRes.data as VideoSolution[]) || []);

      // Check watched videos from user_lesson_progress (lesson_id = "video_{variantId}_{questionNumber}")
      const watched = new Set<string>();
      for (const p of (progressRes.data || [])) {
        if (p.lesson_id.startsWith('video_')) {
          watched.add(p.lesson_id);
        }
      }
      setWatchedVideos(watched);

      let unlocked = false;
      const uuid = TEST_CONFIG[config!.testConfigId]?.uuid;
      if (uuid && (testsRes.data || []).some(t => t.test_id === uuid)) unlocked = true;
      if ((answersRes.data || []).length > 0) unlocked = true;

      const results: Record<number, boolean> = {};
      for (const a of (answersRes.data || [])) {
        const match = a.question_id?.match(/^mq_\d+_(\d+)$/);
        if (match) {
          results[parseInt(match[1], 10)] = a.is_correct;
        }
      }
      setUserResults(results);

      setIsUnlocked(unlocked);
      setLoading(false);
    }

    fetchData();
  }, [user, variantId]);

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

  const markVideoWatched = async (videoId: string, questionNumber: number) => {
    if (!user || !variantId) return;
    const lessonId = `video_${variantId}_${questionNumber}`;
    const { error } = await supabase.from('user_lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    }, { onConflict: 'user_id,lesson_id' });

    if (!error) {
      setWatchedVideos(prev => new Set(prev).add(lessonId));
    }
  };

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
            {watchedVideos.size > 0 && ` · ${watchedVideos.size} просмотрено`}
          </p>
        </div>

        {videos.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            defaultValue={scrollQuestion ? `q-${scrollQuestion}` : undefined}
            className="space-y-3"
          >
            {videos.map((video) => {
              const hasResult = video.question_number in userResults;
              const isCorrect = userResults[video.question_number];
              const lessonId = `video_${variantId}_${video.question_number}`;
              const isWatched = watchedVideos.has(lessonId);
              return (
                <AccordionItem
                  key={video.id}
                  value={`q-${video.question_number}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <div ref={(el) => { questionRefs.current[video.question_number] = el; }}>
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        {isWatched ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Play className="h-4 w-4 text-accent shrink-0" />
                        )}
                        <span className="font-medium">Разбор задачи {video.question_number}</span>
                        {isWatched && (
                          <Badge variant="secondary" className="text-xs ml-1">✔ Просмотрено</Badge>
                        )}
                        {hasResult && !isWatched && (
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                            isCorrect
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {isCorrect ? 'Правильно ✓' : 'Ошибка — смотрите разбор'}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="px-5 pb-5">
                    <VideoEmbed
                      url={video.youtube_url}
                      title={`${config.label} — Задача ${video.question_number}`}
                    />
                    {!isWatched && user && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => markVideoWatched(video.id, video.question_number)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Отметить просмотренным
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
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
