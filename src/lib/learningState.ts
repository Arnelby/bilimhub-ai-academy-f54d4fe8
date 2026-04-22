import { supabase } from '@/integrations/supabase/client';
import { checkInDaily, DEFAULT_DAILY_GOAL } from '@/lib/userActivity';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';
import {
  selectForcedTopic,
  computeProgress,
  getMasteryForTopic,
  type MasteryProgress,
  type TopicMasteryRow,
} from '@/lib/masteryEngine';

/**
 * Learning State Engine — ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ.
 * Детерминированно. БЕЗ AI.
 *
 * Все экраны (Index/Dashboard/Practice/Plan) обязаны читать только из
 * `user_learning_state`. Никаких параллельных расчётов на фронте.
 *
 * Состояние пересчитывается из:
 *  - user_tests              (тесты сегодня + completed_tests)
 *  - practice_responses      (topic_stats + ошибки)
 *  - spaced_repetition       (due → review_mistakes)
 *  - user_lesson_progress    (completed_lessons + watched_videos)
 *  - user_activity           (streak, daily progress)
 *  - lessons + topics        (mapping topic → lesson_id для watch_lesson)
 *
 * Вызывается ПОСЛЕ каждого действия:
 *  - ответа на вопрос (Practice.tsx)
 *  - завершения теста (TestTaking/MathTestTaking)
 *  - просмотра урока (markLessonWatched)
 */

export type NextActionType =
  | 'review_mistakes'
  | 'watch_lesson'
  | 'practice'
  | 'take_test'
  | 'done';

// Legacy alias — used by Index.tsx / NextStep.tsx step indicator
export type NextAction = 'test' | 'practice' | 'review_errors' | 'completed';
export type CurrentStep = 'test' | 'practice' | 'review' | 'done';

export interface TopicStat {
  total_attempts: number;
  correct_answers: number;
  accuracy: number; // 0..1
}

export interface PlanItem {
  type: 'lesson' | 'practice' | 'review';
  topic?: string;
  source?: 'mistakes';
  lesson_id?: string;
  done?: boolean;
}

export interface LearningState {
  user_id: string;
  // Single source of truth fields
  topic_stats: Record<string, TopicStat>;
  weak_topics: string[];
  strong_topics: string[];
  completed_lessons: string[];
  watched_videos: string[];
  completed_tests: number;
  current_plan: PlanItem[];
  next_action: NextAction; // legacy enum for backward compat
  next_action_type: NextActionType; // new richer enum
  next_target?: string | null; // topic or lesson_id depending on action
  next_reason: string;
  // Motivation
  daily_goal: number;
  daily_progress: number;
  streak: number;
  last_activity_date: string | null;
  last_activity_at: string | null;
  // Derived helpers used by UI
  current_step: CurrentStep;
  current_topic: string | null;
  errors_count: number;
  /** Mastery progress for current_topic, if any. UI shows X/10 + accuracy% + sessions left. */
  current_topic_progress?: MasteryProgress | null;
  /** True when ANY topic is unmastered → user is locked into the forced topic. */
  mastery_lock?: boolean;
}

const WEAK_THRESHOLD = 0.6;
const MIN_ATTEMPTS = 1; // legacy fallback; mastery engine takes precedence

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface Snapshot {
  topic_stats: Record<string, TopicStat>;
  weak_topics: string[];
  strong_topics: string[];
  completed_lessons: string[];
  watched_videos: string[];
  completed_tests: number;
  test_done_today: boolean;
  due_review_count: number;
  errors_count: number;
  streak: number;
  daily_progress: number;
  daily_goal: number;
  topic_to_lesson: Record<string, string>; // normalized topic title → lesson_id
  /** Topic of the most recent unresolved mistakes (≤24h) — drives "watch lesson" priority. */
  recent_mistake_topic: string | null;
}

async function buildTopicLessonMap(): Promise<Record<string, string>> {
  // lessons.topic_id → topics.title; map normalized topic title → first lesson_id
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, topic_id, topics:topic_id (title, title_ru)');

  const map: Record<string, string> = {};
  for (const l of (lessons ?? []) as any[]) {
    const titleEn = l.topics?.title;
    const titleRu = l.topics?.title_ru;
    const lessonId = l.id;
    if (!lessonId) continue;
    for (const t of [titleEn, titleRu]) {
      if (!t) continue;
      const norm = normalizeAnalyticsTopic(t);
      if (norm && !map[norm]) map[norm] = lessonId;
    }
  }
  return map;
}

async function computeSnapshot(userId: string): Promise<Snapshot> {
  const last24hISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    testsTodayRes,
    testsTotalRes,
    responsesRes,
    recentMistakesRes,
    spacedRes,
    lessonProgressRes,
    activityRow,
    topicLessonMap,
  ] = await Promise.all([
    supabase
      .from('user_tests')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startOfTodayISO())
      .not('completed_at', 'is', null)
      .limit(1),
    supabase
      .from('user_tests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    supabase
      .from('practice_responses')
      .select('topic, is_correct')
      .eq('user_id', userId),
    // Recent (≤24h) wrong answers — used to prioritise "watch lesson" CTA
    supabase
      .from('practice_responses')
      .select('topic, created_at')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .gte('created_at', last24hISO),
    supabase
      .from('spaced_repetition' as any)
      .select('id, next_review_date')
      .eq('user_id', userId)
      .lte('next_review_date', new Date().toISOString()),
    supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .eq('completed', true),
    checkInDaily(userId).catch(() => null),
    buildTopicLessonMap(),
  ]);

  // Aggregate topic_stats from practice_responses
  const stats: Record<string, TopicStat> = {};
  let errors_count = 0;
  for (const r of (responsesRes.data ?? []) as any[]) {
    const t = normalizeAnalyticsTopic(r.topic || '');
    if (!t) continue;
    const cur = stats[t] || { total_attempts: 0, correct_answers: 0, accuracy: 0 };
    cur.total_attempts += 1;
    if (r.is_correct) cur.correct_answers += 1;
    cur.accuracy = cur.total_attempts > 0 ? cur.correct_answers / cur.total_attempts : 0;
    stats[t] = cur;
    if (r.is_correct === false) errors_count += 1;
  }

  // Top recent-mistake topic (last 24h) → highest priority for "watch lesson" CTA.
  const recentByTopic: Record<string, number> = {};
  for (const r of (recentMistakesRes.data ?? []) as any[]) {
    const t = normalizeAnalyticsTopic(r.topic || '');
    if (!t) continue;
    recentByTopic[t] = (recentByTopic[t] || 0) + 1;
  }
  let recent_mistake_topic: string | null = null;
  let recentMax = 0;
  for (const [t, n] of Object.entries(recentByTopic)) {
    if (n > recentMax) { recentMax = n; recent_mistake_topic = t; }
  }

  const weak_topics: string[] = [];
  const strong_topics: string[] = [];
  for (const [topic, s] of Object.entries(stats)) {
    if ((s.total_attempts ?? 0) < MIN_ATTEMPTS) continue;
    if (s.accuracy < WEAK_THRESHOLD) weak_topics.push(topic);
    else strong_topics.push(topic);
  }
  // Sort weak by accuracy ASC (worst first)
  weak_topics.sort((a, b) => (stats[a].accuracy ?? 0) - (stats[b].accuracy ?? 0));
  strong_topics.sort((a, b) => (stats[b].accuracy ?? 0) - (stats[a].accuracy ?? 0));

  // completed_lessons & watched_videos derived from user_lesson_progress
  const completed_lessons: string[] = [];
  const watched_videos: string[] = [];
  for (const row of (lessonProgressRes.data ?? []) as any[]) {
    const lid = row.lesson_id as string;
    if (!lid) continue;
    if (lid.startsWith('video_')) watched_videos.push(lid);
    else completed_lessons.push(lid);
  }

  return {
    topic_stats: stats,
    weak_topics,
    strong_topics,
    completed_lessons,
    watched_videos,
    completed_tests: testsTotalRes.count ?? 0,
    test_done_today: (testsTodayRes.data?.length ?? 0) > 0,
    due_review_count: (spacedRes.data?.length ?? 0),
    errors_count,
    streak: activityRow?.streak ?? 0,
    daily_progress: activityRow?.tasks_completed_today ?? 0,
    daily_goal: activityRow?.daily_goal ?? DEFAULT_DAILY_GOAL,
    topic_to_lesson: topicLessonMap,
    recent_mistake_topic,
  };
}

interface NextResolved {
  next_action: NextAction;
  next_action_type: NextActionType;
  next_target: string | null;
  next_reason: string;
  current_step: CurrentStep;
  current_topic: string | null;
}

function topicHasWatchedLesson(topic: string, snap: Snapshot): boolean {
  const lessonId = snap.topic_to_lesson[topic];
  if (!lessonId) return true; // if no lesson exists → skip the watch step
  return snap.completed_lessons.includes(lessonId);
}

function resolveNext(snap: Snapshot, forced: TopicMasteryRow | null): NextResolved {
  // ===== PRIORITY 0: MASTERY LOCK =====
  // If there is ANY unmastered topic → user MUST work on it.
  // No free choice, no jumping themes.
  if (forced) {
    const topic = forced.topic;
    const acc = forced.accuracy;
    const pct = Math.round(acc * 100);
    const lessonId = snap.topic_to_lesson[topic] || null;

    // Lesson trigger: low accuracy or 3 wrong in a row → force watch first.
    if (forced.needs_lesson && lessonId && !forced.last_lesson_watched_at) {
      return {
        next_action: 'practice',
        next_action_type: 'watch_lesson',
        next_target: lessonId,
        next_reason: `Ты не понимаешь тему «${topic}» (точность ${pct}%). Сначала посмотри урок.`,
        current_step: 'practice',
        current_topic: topic,
      };
    }

    return {
      next_action: 'practice',
      next_action_type: 'practice',
      next_target: topic,
      next_reason:
        forced.total_attempts < 10
          ? `Тема «${topic}»: ${forced.total_attempts}/10 попыток. Точность ${pct}%.`
          : `Тема «${topic}»: подними точность до 80% (сейчас ${pct}%).`,
      current_step: 'practice',
      current_topic: topic,
    };
  }

  // ===== Below applies only when EVERYTHING is mastered =====

  // 1. Spaced repetition due → review
  if (snap.due_review_count > 0) {
    return {
      next_action: 'review_errors',
      next_action_type: 'review_mistakes',
      next_target: null,
      next_reason: `У тебя ${snap.due_review_count} задач на повторение`,
      current_step: 'review',
      current_topic: null,
    };
  }

  // 3. Слабые темы (исторические) → видео или практика
  if (snap.weak_topics.length > 0) {
    const topic = snap.weak_topics[0];
    const acc = snap.topic_stats[topic]?.accuracy ?? 0;
    const pct = Math.round(acc * 100);
    if (!topicHasWatchedLesson(topic, snap)) {
      const lessonId = snap.topic_to_lesson[topic] || null;
      return {
        next_action: 'practice',
        next_action_type: 'watch_lesson',
        next_target: lessonId || topic,
        next_reason: `Сначала посмотри урок по теме «${topic}» (точность ${pct}%)`,
        current_step: 'practice',
        current_topic: topic,
      };
    }
    return {
      next_action: 'practice',
      next_action_type: 'practice',
      next_target: topic,
      next_reason: `Тренируй тему «${topic}» (точность ${pct}%)`,
      current_step: 'practice',
      current_topic: topic,
    };
  }

  // 4. Тест сегодня? (запрет: НЕ показывать тест если уже проходил сегодня)
  if (!snap.test_done_today) {
    return {
      next_action: 'test',
      next_action_type: 'take_test',
      next_target: null,
      next_reason: 'Сегодня ты ещё не проходил тест',
      current_step: 'test',
      current_topic: null,
    };
  }

  // 5. Всё сделано
  return {
    next_action: 'completed',
    next_action_type: 'done',
    next_target: null,
    next_reason: 'Все задачи на сегодня выполнены — отличная работа!',
    current_step: 'done',
    current_topic: null,
  };
}

function buildPlan(snap: Snapshot, next: NextResolved): PlanItem[] {
  const plan: PlanItem[] = [];

  // Pull review on top if there are due items
  if (snap.due_review_count > 0) {
    plan.push({ type: 'review', source: 'mistakes' });
  }

  // Up to 3 weak topics: lesson (if not watched) + practice each
  const top = snap.weak_topics.slice(0, 3);
  for (const topic of top) {
    const lessonId = snap.topic_to_lesson[topic];
    const watched = lessonId ? snap.completed_lessons.includes(lessonId) : true;
    if (lessonId && !watched) {
      plan.push({ type: 'lesson', topic, lesson_id: lessonId });
    }
    plan.push({ type: 'practice', topic });
  }

  // If nothing weak — at least one practice or test
  if (plan.length === 0 && next.next_action_type === 'take_test') {
    plan.push({ type: 'practice' } as PlanItem);
  }

  return plan;
}

export async function updateLearningState(userId: string): Promise<LearningState | null> {
  if (!userId) return null;

  try {
    const [snap, forced] = await Promise.all([
      computeSnapshot(userId),
      selectForcedTopic(userId),
    ]);
    const next = resolveNext(snap, forced);
    const plan = buildPlan(snap, next);
    const currentProgress = forced ? computeProgress(forced) : null;

    const payload = {
      user_id: userId,
      topic_stats: snap.topic_stats as any,
      weak_topics: snap.weak_topics as any,
      strong_topics: snap.strong_topics as any,
      completed_lessons: snap.completed_lessons as any,
      watched_videos: snap.watched_videos as any,
      completed_tests: snap.completed_tests,
      current_plan: plan as any,
      next_action: next.next_action,
      next_reason: next.next_reason,
      current_step: next.current_step,
      current_topic: next.current_topic,
      daily_goal: snap.daily_goal,
      daily_progress: snap.daily_progress,
      streak: snap.streak,
      errors_count: snap.errors_count,
      last_activity_date: todayDate(),
      last_activity_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_learning_state' as any)
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[STATE_UPDATED] upsert failed', error);
      return null;
    }

    console.log('[STATE_UPDATED]', {
      user_id: userId,
      forced_topic: forced?.topic ?? null,
      mastery_lock: !!forced,
      next_action: next.next_action_type,
      target: next.next_target,
    });
    console.log('[PLAN_UPDATED]', { plan });
    console.log('[NEXT_ACTION]', next.next_action_type);

    const row = data as any;
    return {
      ...row,
      next_action_type: next.next_action_type,
      next_target: next.next_target,
      current_topic_progress: currentProgress,
      mastery_lock: !!forced,
    } as LearningState;
  } catch (e) {
    console.error('[STATE_UPDATED] failed', e);
    return null;
  }
}

export async function getLearningState(userId: string): Promise<LearningState | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_learning_state' as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('[STATE_FETCH] failed', error);

  if (!data) return updateLearningState(userId);
  const row = data as any;
  if (!row.next_action_type) return updateLearningState(userId);

  // Hydrate mastery progress + lock so UI always shows X/10 + accuracy%.
  let current_topic_progress: MasteryProgress | null = null;
  let mastery_lock = false;
  try {
    const forced = await selectForcedTopic(userId);
    mastery_lock = !!forced;
    if (forced) current_topic_progress = computeProgress(forced);
    else if (row.current_topic) {
      const r = await getMasteryForTopic(userId, row.current_topic);
      if (r) current_topic_progress = computeProgress(r);
    }
  } catch (e) {
    console.error('[STATE_FETCH] mastery hydrate failed', e);
  }

  return { ...row, current_topic_progress, mastery_lock } as LearningState;
}

/**
 * Event: пользователь посмотрел/завершил урок (или видео-разбор).
 * Обновляет user_lesson_progress + пересчитывает state.
 */
export async function markLessonWatched(params: {
  userId: string;
  lessonId: string;
}): Promise<LearningState | null> {
  const { userId, lessonId } = params;
  if (!userId || !lessonId) return null;

  await supabase
    .from('user_lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
      },
      { onConflict: 'user_id,lesson_id' },
    );

  console.log('[LESSON_WATCHED]', { user_id: userId, lesson_id: lessonId });
  return updateLearningState(userId);
}

// ===== Legacy helpers (back-compat for existing UI) =====
export function nextActionLabel(a: NextAction): string {
  switch (a) {
    case 'test':
      return 'тест';
    case 'practice':
      return 'практика';
    case 'review_errors':
      return 'повтор ошибок';
    case 'completed':
      return 'завершено';
  }
}

export function nextActionRoute(state: LearningState): string {
  // Prefer rich type when available
  switch (state.next_action_type) {
    case 'review_mistakes':
      return '/practice?mode=review';
    case 'watch_lesson':
      if (state.next_target) return `/lessons/${state.next_target}`;
      return '/lessons';
    case 'practice':
      return state.next_target
        ? `/practice?topic=${encodeURIComponent(state.next_target)}`
        : '/practice';
    case 'take_test':
      return '/tests';
    case 'done':
      return '/dashboard';
  }
  // fallback to legacy
  switch (state.next_action) {
    case 'test':
      return '/tests';
    case 'practice':
      return state.current_topic
        ? `/practice?topic=${encodeURIComponent(state.current_topic)}`
        : '/practice';
    case 'review_errors':
      return '/practice?mode=review';
    case 'completed':
      return '/dashboard';
  }
}
