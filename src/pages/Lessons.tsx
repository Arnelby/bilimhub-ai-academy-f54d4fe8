import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Lock, Loader2, ChevronRight, BookOpen, CheckCircle, Play, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';
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
  { variantKey: 'variant1', testConfigId: 1, n: 1 },
  { variantKey: 'variant2', testConfigId: 2, n: 2 },
  { variantKey: 'variant3', testConfigId: 3, n: 3 },
  { variantKey: 'variant4', testConfigId: 4, n: 4 },
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
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());

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
    // (final ordering is applied below once we know weak topics)

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

  // Build topic → lessons map (excluding the recommended lesson, which is shown on top).
  // Hierarchy: Topic (group) → Lessons → Video. Hooks declared before any early return.
  const weakTopicsNorm = useMemo(() => {
    const w = Array.isArray((learningState as any)?.weak_topics)
      ? ((learningState as any).weak_topics as string[])
      : [];
    return new Set(w.map(t => normalizeAnalyticsTopic(t)).filter(Boolean));
  }, [learningState]);

  const allTopics = useMemo(() => {
    const map = new Map<string, { name: string; isWeak: boolean }>();
    for (const l of lessons) {
      const name = (language === 'ru' ? (l.topic?.title_ru || l.topic?.title) : l.topic?.title) || 'Без темы';
      if (!map.has(name)) {
        const norm = normalizeAnalyticsTopic(l.topic?.title_ru || l.topic?.title || '');
        map.set(name, { name, isWeak: norm ? weakTopicsNorm.has(norm) : false });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.isWeak && !b.isWeak) return -1;
      if (!a.isWeak && b.isWeak) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [lessons, language, weakTopicsNorm]);

  const lessonsByTopic = useMemo(() => {
    const map = new Map<string, LessonRow[]>();
    for (const l of lessons) {
      if (recommendedLesson && l.id === recommendedLesson.id) continue;
      const name = (language === 'ru' ? (l.topic?.title_ru || l.topic?.title) : l.topic?.title) || 'Без темы';
      if (topicFilter !== 'all' && topicFilter !== 'weak' && topicFilter !== name) continue;
      if (topicFilter === 'weak') {
        const norm = normalizeAnalyticsTopic(l.topic?.title_ru || l.topic?.title || '');
        if (!norm || !weakTopicsNorm.has(norm)) continue;
      }
      const arr = map.get(name) || [];
      arr.push(l);
      map.set(name, arr);
    }
    return map;
  }, [lessons, recommendedLesson, language, topicFilter, weakTopicsNorm]);

  const toggleTopic = (name: string) => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
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

                {/* Topic filter chips */}
                {allTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={topicFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setTopicFilter('all')}
                    >
                      Все темы
                    </Button>
                    {weakTopicsNorm.size > 0 && (
                      <Button
                        size="sm"
                        variant={topicFilter === 'weak' ? 'default' : 'outline'}
                        onClick={() => setTopicFilter('weak')}
                      >
                        ⚠ Мои слабые темы
                      </Button>
                    )}
                    {allTopics.map(t => (
                      <Button
                        key={t.name}
                        size="sm"
                        variant={topicFilter === t.name ? 'default' : 'outline'}
                        onClick={() => setTopicFilter(t.name)}
                        className={t.isWeak ? 'border-destructive/40' : ''}
                      >
                        {t.isWeak && '⚠ '}{t.name}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Lessons grouped by topic — collapsed by default */}
                {Array.from(lessonsByTopic.entries()).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Нет уроков по выбранной теме.
                  </p>
                ) : (
                  Array.from(lessonsByTopic.entries()).map(([topicName, topicLessons]) => {
                    const isOpen = openTopics.has(topicName) || topicFilter !== 'all';
                    const norm = normalizeAnalyticsTopic(topicName);
                    const isWeak = norm ? weakTopicsNorm.has(norm) : false;
                    const watchedCount = topicLessons.filter(l => completedLessons.has(l.id)).length;
                    return (
                      <Collapsible key={topicName} open={isOpen} onOpenChange={() => toggleTopic(topicName)}>
                        <CollapsibleTrigger className="w-full">
                          <div className={`flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 ${isWeak ? 'border-destructive/40 bg-destructive/5' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className="h-4 w-4 shrink-0 text-accent" />
                              <span className="font-semibold truncate">{isWeak && '⚠ '}{topicName}</span>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {watchedCount}/{topicLessons.length}
                              </Badge>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 pl-2">
                          {topicLessons.map(l => renderLessonCard(l))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
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
