import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Lock, Loader2, ChevronRight, BookOpen, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TEST_CONFIG } from '@/lib/mathTestConfig';

interface LessonRow {
  id: string;
  title: string;
  title_ru: string | null;
  topic_id: string | null;
  content: any;
  topic?: { title: string; title_ru: string | null } | null;
}

const VARIANT_CONFIG = [
  { variantKey: 'variant1', testConfigId: 1, label: 'Математика тест вариант 1' },
  { variantKey: 'variant2', testConfigId: 2, label: 'Математика тест вариант 2' },
  { variantKey: 'variant3', testConfigId: 3, label: 'Математика тест вариант 3' },
  { variantKey: 'variant4', testConfigId: 4, label: 'Математика тест вариант 4' },
];

function testIdToVariantKey(testId: string): string | null {
  const match = testId.match(/^math_test_(\d+)$/);
  if (match) return `variant${match[1]}`;
  for (const [num, cfg] of Object.entries(TEST_CONFIG)) {
    if (cfg.uuid === testId) return `variant${num}`;
  }
  return null;
}

export default function Lessons() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [completedVariants, setCompletedVariants] = useState<Set<string>>(new Set());
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'videos' | 'lessons'>('lessons');
  const [playingLesson, setPlayingLesson] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);

    // Fetch lessons (always)
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, title_ru, topic_id, content')
      .order('title_ru');

    setLessons((lessonsData as LessonRow[]) || []);

    if (!user) {
      setLoading(false);
      return;
    }

    const [videosRes, testsRes, answersRes, progressRes] = await Promise.all([
      supabase.from('video_solutions').select('test_id'),
      supabase.from('user_tests').select('test_id').eq('user_id', user.id).not('completed_at', 'is', null),
      supabase.from('user_answers').select('test_id').eq('user_id', user.id),
      supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', user.id).eq('completed', true),
    ]);

    // Video counts
    const counts: Record<string, number> = {};
    for (const v of (videosRes.data || [])) {
      counts[v.test_id] = (counts[v.test_id] || 0) + 1;
    }
    setVideoCounts(counts);

    // Completed test variants
    const completed = new Set<string>();
    for (const t of (testsRes.data || [])) {
      const vk = testIdToVariantKey(t.test_id);
      if (vk) completed.add(vk);
    }
    const answerTestIds = new Set((answersRes.data || []).map(a => a.test_id));
    for (const tid of answerTestIds) {
      const vk = testIdToVariantKey(tid);
      if (vk) completed.add(vk);
    }
    setCompletedVariants(completed);

    // Completed lessons
    const completedSet = new Set<string>();
    for (const p of (progressRes.data || [])) {
      completedSet.add(p.lesson_id);
    }
    setCompletedLessons(completedSet);

    setLoading(false);
  }

  const markLessonWatched = async (lessonId: string) => {
    if (!user) return;
    const { error } = await supabase.from('user_lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    }, { onConflict: 'user_id,lesson_id' });

    if (!error) {
      setCompletedLessons(prev => new Set(prev).add(lessonId));
    }
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return match ? match[1] : '';
  };
  const getYoutubeEmbedUrl = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1` : '';
  };
  const getYoutubeThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === 'ru' ? 'Уроки' : language === 'kg' ? 'Сабактар' : 'Lessons'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ru'
              ? 'Видеоуроки и видеоразборы тестов'
              : 'Video lessons and test solutions'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'lessons' ? 'default' : 'outline'}
            onClick={() => setActiveTab('lessons')}
            className="gap-2"
            size="sm"
          >
            <BookOpen className="h-4 w-4" />
            <span className="truncate">Базовые уроки</span>
          </Button>
          <Button
            variant={activeTab === 'videos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('videos')}
            className="gap-2"
            size="sm"
          >
            <Video className="h-4 w-4" />
            <span className="truncate">Видеоразборы тестов</span>
          </Button>
        </div>

        {/* Section 1: Basic Lessons */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {lessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Уроки скоро появятся</p>
            ) : (
              lessons.map((lesson) => {
                const youtubeUrl = lesson.content?.youtube_url || '';
                const isWatched = completedLessons.has(lesson.id);
                const title = language === 'ru' ? (lesson.title_ru || lesson.title) : lesson.title;

                return (
                  <Card key={lesson.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            {isWatched ? (
                              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <Play className="h-5 w-5 text-accent shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold">{title}</p>
                              {isWatched && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  ✔ Просмотрено
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!isWatched && user && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markLessonWatched(lesson.id)}
                            >
                              Отметить просмотренным
                            </Button>
                          )}
                        </div>
                        {youtubeUrl && (
                          <div className="aspect-video w-full">
                            <iframe
                              src={getYoutubeEmbedUrl(youtubeUrl)}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={title}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Section 2: Test Video Solutions */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            {VARIANT_CONFIG.map(({ variantKey, label }) => {
              const isUnlocked = completedVariants.has(variantKey);
              const count = videoCounts[variantKey] || 0;

              return (
                <Card
                  key={variantKey}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${!isUnlocked ? 'opacity-60' : ''}`}
                  onClick={() => navigate(`/lessons/video/${variantKey}`)}
                >
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      {isUnlocked ? (
                        <Video className="h-6 w-6 text-accent shrink-0" />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-base">{label}</p>
                        <Badge variant={isUnlocked ? 'secondary' : 'outline'} className="text-xs mt-1">
                          {isUnlocked
                            ? (count > 0 ? `${count} видеоразборов` : 'Скоро')
                            : (language === 'ru' ? 'Пройдите тест' : 'Complete test')}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
