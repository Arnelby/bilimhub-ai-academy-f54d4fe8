import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Lock, Loader2, ChevronRight, BookOpen, CheckCircle, Play, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TEST_CONFIG } from '@/lib/mathTestConfig';
import { getLearningState, updateLearningState, markLessonWatched as markLessonWatchedState, type LearningState } from '@/lib/learningState';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

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
  const [learningState, setLearningState] = useState<LearningState | null>(null);
  const [recommendedLesson, setRecommendedLesson] = useState<LessonRow | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, title_ru, topic_id, content, topic:topics(title, title_ru)')
      .order('title_ru');

    const allLessons = (lessonsData as LessonRow[]) || [];
    setLessons(allLessons);

    if (!user) {
      setLoading(false);
      return;
    }

    const [videosRes, testsRes, answersRes, progressRes, state] = await Promise.all([
      supabase.from('video_solutions').select('test_id'),
      supabase.from('user_tests').select('test_id').eq('user_id', user.id).not('completed_at', 'is', null),
      supabase.from('user_answers').select('test_id').eq('user_id', user.id),
      supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', user.id).eq('completed', true),
      // Force recompute so the recommended lesson always reflects the latest practice/tests.
      updateLearningState(user.id),
    ]);

    const counts: Record<string, number> = {};
    for (const v of (videosRes.data || [])) {
      counts[v.test_id] = (counts[v.test_id] || 0) + 1;
    }
    setVideoCounts(counts);

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

    const completedSet = new Set<string>();
    for (const p of (progressRes.data || [])) {
      completedSet.add(p.lesson_id);
    }
    setCompletedLessons(completedSet);

    setLearningState(state);

    // Resolve recommended lesson from learning state.
    // Priority: next_action_type === 'watch_lesson' AND next_target is a lesson_id.
    let recommended: LessonRow | null = null;
    if (state?.next_action_type === 'watch_lesson' && state.next_target) {
      recommended = allLessons.find(l => l.id === state.next_target) || null;
    }
    // Fallback: lesson of the first weak topic (worst-first, already sorted in state)
    const weakTopics: string[] = Array.isArray((state as any)?.weak_topics)
      ? ((state as any).weak_topics as string[])
      : [];
    if (!recommended && weakTopics.length > 0) {
      const weakNorm = weakTopics.map(t => normalizeAnalyticsTopic(t));
      recommended = allLessons.find(l => {
        const t = normalizeAnalyticsTopic(l.topic?.title_ru || l.topic?.title || '');
        return t && weakNorm.includes(t);
      }) || null;
    }
    // Fallback: first lesson of current_topic
    if (!recommended && state?.current_topic) {
      const cur = normalizeAnalyticsTopic(state.current_topic);
      recommended = allLessons.find(l => {
        const t = normalizeAnalyticsTopic(l.topic?.title_ru || l.topic?.title || '');
        return t && cur && (t.includes(cur) || cur.includes(t));
      }) || null;
    }
    // Fallback: first non-watched lesson
    if (!recommended) {
      recommended = allLessons.find(l => !completedSet.has(l.id)) || null;
    }
    setRecommendedLesson(recommended);

    // Reorder the global list: weak-topic lessons first (worst topic first),
    // then everything else. This makes the page visibly “lead” the student.
    const weakTopicsForSort: string[] = weakTopics.map(t => normalizeAnalyticsTopic(t));
    const lessonWeakRank = (l: LessonRow) => {
      const t = normalizeAnalyticsTopic(l.topic?.title_ru || l.topic?.title || '');
      const idx = weakTopicsForSort.indexOf(t);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    const sorted = [...allLessons].sort((a, b) => lessonWeakRank(a) - lessonWeakRank(b));
    setLessons(sorted);

    setLoading(false);
  }

  const markLessonWatched = async (lessonId: string) => {
    if (!user) return;
    // Single source of truth — markLessonWatchedState handles upsert + state recompute.
    const newState = await markLessonWatchedState({ userId: user.id, lessonId });
    setCompletedLessons(prev => new Set(prev).add(lessonId));
    if (newState) setLearningState(newState);
    // After watching, the engine should have moved next_action to 'practice:<topic>'.
    // Surface a clear toast-like CTA via state — refetch lessons mapping is unnecessary.
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

  // Lessons of the same topic as the recommended one (excluding the recommended itself)
  const otherSameTopic = recommendedLesson
    ? lessons.filter(l => l.id !== recommendedLesson.id && l.topic_id === recommendedLesson.topic_id)
    : [];
  // Other topics (everything else)
  const otherLessons = recommendedLesson
    ? lessons.filter(l => l.id !== recommendedLesson.id && l.topic_id !== recommendedLesson.topic_id)
    : lessons;

  const renderLessonCard = (lesson: LessonRow, opts?: { highlight?: boolean }) => {
    const youtubeUrl = lesson.content?.youtube_url || '';
    const isWatched = completedLessons.has(lesson.id);
    const title = language === 'ru' ? (lesson.title_ru || lesson.title) : lesson.title;
    const topicName = language === 'ru'
      ? (lesson.topic?.title_ru || lesson.topic?.title || '')
      : (lesson.topic?.title || '');

    return (
      <Card key={lesson.id} className={`overflow-hidden ${opts?.highlight ? 'border-2 border-accent shadow-lg' : ''}`}>
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex items-center gap-3 min-w-0">
                {isWatched ? (
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <Play className="h-5 w-5 text-accent shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold break-words">{title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {topicName && (
                      <Badge variant="outline" className="text-xs">{topicName}</Badge>
                    )}
                    {isWatched && (
                      <Badge variant="secondary" className="text-xs">✔ Просмотрено</Badge>
                    )}
                  </div>
                </div>
              </div>
              {!isWatched && user && (
                <Button
                  size="sm"
                  variant={opts?.highlight ? 'accent' : 'outline'}
                  className="shrink-0"
                  onClick={() => markLessonWatched(lesson.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Я посмотрел
                </Button>
              )}
            </div>
            {youtubeUrl && (
              playingLesson === lesson.id ? (
                <div className="aspect-video w-full bg-muted">
                  <iframe
                    src={getYoutubeEmbedUrl(youtubeUrl)}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={title}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlayingLesson(lesson.id)}
                  className="relative aspect-video w-full bg-muted overflow-hidden group"
                  aria-label={`Воспроизвести: ${title}`}
                >
                  <img
                    src={getYoutubeThumbnail(youtubeUrl)}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/90 shadow-lg">
                      <Play className="h-8 w-8 text-accent-foreground ml-1" fill="currentColor" />
                    </span>
                  </span>
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <div className="space-y-6">
            {lessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Уроки скоро появятся</p>
            ) : (
              <>
                {/* Recommended lesson (driven by learning state) */}
                {recommendedLesson && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <h2 className="text-lg font-bold">Рекомендованный урок</h2>
                    </div>
                    {learningState?.next_reason && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {learningState.next_reason}
                      </p>
                    )}
                    {renderLessonCard(recommendedLesson, { highlight: true })}
                  </section>
                )}

                {/* Other lessons of the same topic */}
                {otherSameTopic.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold mb-3">Другие уроки по теме</h2>
                    <div className="space-y-3">
                      {otherSameTopic.map(l => renderLessonCard(l))}
                    </div>
                  </section>
                )}

                {/* All other lessons */}
                {otherLessons.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold mb-3">
                      {recommendedLesson ? 'Все остальные уроки' : 'Все уроки'}
                    </h2>
                    <div className="space-y-3">
                      {otherLessons.map(l => renderLessonCard(l))}
                    </div>
                  </section>
                )}
              </>
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
