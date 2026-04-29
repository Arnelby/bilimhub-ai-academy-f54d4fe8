import { supabase } from '@/integrations/supabase/client';

/**
 * Deterministic Adaptive Task Engine (v2 — hybrid).
 *
 * Source of truth for the *phase* of the active topic:
 *   `user_learning_state.mastery_phase` + `phase_topic`
 *   (computed by RPC `recompute_learning_state`).
 *
 * Source of truth for *available content*:
 *   `lessons` table — a topic is shown ONLY if it has a base video lesson.
 *
 * Strict order per weak topic:
 *   1. lesson  (must be marked completed in user_lesson_progress)
 *   2. practice easy (5 questions, scoped to that topic)
 *   3. practice medium (5 questions)
 *   4. validation handled by RPC after good streak.
 *
 * NO advice, NO AI text. NO topics without a lesson.
 */

export type TaskType = 'lesson' | 'practice' | 'repeat' | 'test';

export interface PlanTask {
  id: string;
  type: TaskType;
  topic: string | null;
  lesson_id?: string;       // UUID for lesson tasks
  count: number;
  difficulty?: 'easy' | 'medium';
  status: 'pending' | 'active' | 'done' | 'locked';
  label: string;
}

export interface Plan {
  user_id: string;
  generated_at: string;
  tasks: PlanTask[];
  total: number;
  done: number;
  active_index: number;
}

function labelFor(type: TaskType, topic: string | null, count: number, diff?: 'easy' | 'medium'): string {
  const t = topic ?? 'общее';
  switch (type) {
    case 'lesson':   return `Видео-урок: ${t}`;
    case 'practice': return `Практика (${diff === 'medium' ? 'средняя' : 'лёгкая'}): ${count} задач · ${t}`;
    case 'repeat':   return `Повтор ошибок: ${count} задач`;
    case 'test':     return `Контрольный тест: ${count} задач`;
  }
}

interface SourceData {
  weak_topics: string[];                        // ONLY topics that have a lesson
  topic_to_lesson: Record<string, string>;      // canonical topic → lesson UUID
  completed_lesson_ids: Set<string>;            // user_lesson_progress.lesson_id where completed
  topic_progress: Record<string, { correct: number; total: number }>;
  due_repeats: number;
  active_phase: 'idle' | 'lesson' | 'practice' | 'validation';
  active_topic: string | null;
}

/** Build map: weak_topic → lesson UUID (only topics that ACTUALLY have a video lesson). */
async function buildLessonMap(weakCandidates: string[]): Promise<Record<string, string>> {
  if (weakCandidates.length === 0) return {};
  // Fetch all lessons once (small table)
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, topic_id, topics:topic_id (title, title_ru)');

  const map: Record<string, string> = {};
  const norm = (s: string | null | undefined) => (s || '').trim().toLowerCase();
  const wantSet = new Set(weakCandidates.map(norm));

  for (const l of (lessons ?? []) as any[]) {
    const candidates = [l.title, l.topics?.title, l.topics?.title_ru].filter(Boolean) as string[];
    for (const c of candidates) {
      const k = norm(c);
      if (wantSet.has(k)) {
        // Find original casing key
        const original = weakCandidates.find(w => norm(w) === k);
        if (original && !map[original]) map[original] = l.id;
      }
    }
  }
  return map;
}

async function loadSources(userId: string): Promise<SourceData> {
  // 1. Trigger fresh recompute via RPC and read mastery_phase/phase_topic + weak_topics
  const { data: rpcRes } = await supabase.rpc('recompute_learning_state', { _user_id: userId });
  const r = (rpcRes ?? {}) as any;
  const weak: string[] = Array.isArray(r.weak_topics) ? r.weak_topics : [];

  // 2. Build lesson map (weak topic → lesson UUID); drop topics without a lesson
  const lessonMap = await buildLessonMap(weak);
  const filteredWeak = weak.filter(t => !!lessonMap[t]);

  // 3. Lesson progress
  const { data: lp } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);
  const completedLessonIds = new Set<string>((lp || []).map(x => x.lesson_id));

  // 4. Practice progress per topic (last 200)
  const { data: recent } = await supabase
    .from('practice_responses')
    .select('topic, is_correct, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  const progress: Record<string, { correct: number; total: number }> = {};
  for (const x of recent || []) {
    if (!x.topic) continue;
    const e = progress[x.topic] || { correct: 0, total: 0 };
    e.total++; if (x.is_correct) e.correct++;
    progress[x.topic] = e;
  }

  // 5. Due spaced repetition
  const { count: dueCount } = await supabase
    .from('spaced_repetition')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', new Date().toISOString());

  return {
    weak_topics: filteredWeak,
    topic_to_lesson: lessonMap,
    completed_lesson_ids: completedLessonIds,
    topic_progress: progress,
    due_repeats: dueCount ?? 0,
    active_phase: (['idle','lesson','practice','validation'].includes(r.mastery_phase) ? r.mastery_phase : 'idle') as any,
    active_topic: r.phase_topic ?? null,
  };
}

function buildQueue(src: SourceData): PlanTask[] {
  const tasks: PlanTask[] = [];

  // Optional: spaced repetition first (small batch)
  if (src.due_repeats > 0) {
    const cnt = Math.min(src.due_repeats, 3);
    tasks.push({
      id: 'sr:repeat',
      type: 'repeat', topic: null, count: cnt,
      status: 'pending',
      label: labelFor('repeat', null, cnt),
    });
  }

  // Weak topics with lessons (top 2 max)
  const weakSlice = src.weak_topics.slice(0, 2);
  for (const topic of weakSlice) {
    const lessonId = src.topic_to_lesson[topic];
    if (!lessonId) continue; // safety — should already be filtered

    tasks.push({
      id: `${topic}:lesson`,
      type: 'lesson', topic, lesson_id: lessonId, count: 1,
      status: 'pending',
      label: labelFor('lesson', topic, 1),
    });
    tasks.push({
      id: `${topic}:practice-easy`,
      type: 'practice', topic, count: 5, difficulty: 'easy',
      status: 'pending',
      label: labelFor('practice', topic, 5, 'easy'),
    });
    tasks.push({
      id: `${topic}:practice-medium`,
      type: 'practice', topic, count: 5, difficulty: 'medium',
      status: 'pending',
      label: labelFor('practice', topic, 5, 'medium'),
    });
  }

  // No weak topics with lessons → suggest test
  if (weakSlice.length === 0 && tasks.length === 0) {
    tasks.push({
      id: 'global:test',
      type: 'test', topic: null, count: 30,
      status: 'pending',
      label: labelFor('test', null, 30),
    });
  }

  return tasks;
}

/**
 * Apply derived statuses with the STRICT rule:
 *   For a given topic, practice tasks are 'locked' until the lesson task is 'done'.
 */
function applyStatuses(tasks: PlanTask[], src: SourceData): PlanTask[] {
  const result = tasks.map(t => ({ ...t }));

  // Mark done where applicable
  for (const t of result) {
    if (t.type === 'lesson' && t.lesson_id) {
      if (src.completed_lesson_ids.has(t.lesson_id)) t.status = 'done';
    } else if (t.type === 'practice' && t.topic) {
      const p = src.topic_progress[t.topic];
      if (p && p.total >= t.count && (p.correct / p.total) >= 0.6) t.status = 'done';
    }
  }

  // Track which topic's lesson is done
  const lessonDoneByTopic = new Set<string>();
  for (const t of result) {
    if (t.type === 'lesson' && t.topic && t.status === 'done') lessonDoneByTopic.add(t.topic);
  }

  // Lock practice tasks whose lesson is not done
  for (const t of result) {
    if (t.type === 'practice' && t.topic && !lessonDoneByTopic.has(t.topic) && t.status !== 'done') {
      t.status = 'locked';
    }
  }

  // Pick first not-done, not-locked as active
  let activeSet = false;
  for (const t of result) {
    if (t.status === 'done' || t.status === 'locked') continue;
    if (!activeSet) { t.status = 'active'; activeSet = true; }
    else { t.status = 'pending'; }
  }
  return result;
}

export async function buildPlan(userId: string): Promise<Plan> {
  const src = await loadSources(userId);
  const raw = buildQueue(src);
  const tasks = applyStatuses(raw, src);
  const done = tasks.filter(t => t.status === 'done').length;
  const active_index = tasks.findIndex(t => t.status === 'active');
  const plan: Plan = {
    user_id: userId,
    generated_at: new Date().toISOString(),
    tasks,
    total: tasks.length,
    done,
    active_index,
  };
  console.log('[PLAN_CREATED]', {
    user_id: userId,
    weak_topics: src.weak_topics,
    active_phase: src.active_phase,
    active_topic: src.active_topic,
    tasks: tasks.map(t => ({ type: t.type, topic: t.topic, status: t.status })),
  });
  return plan;
}

export function getNextTask(plan: Plan): PlanTask | null {
  const t = plan.tasks.find(x => x.status === 'active') ?? null;
  if (t) console.log('[NEXT_TASK]', { task_type: t.type, topic: t.topic, lesson_id: t.lesson_id });
  return t;
}

export function routeForTask(task: PlanTask): string {
  switch (task.type) {
    case 'lesson':
      // Direct UUID route — guarantees the real video opens
      return task.lesson_id ? `/lessons/${task.lesson_id}` : '/lessons';
    case 'practice':
      // Forced loop scoped to the weak topic
      return '/learn';
    case 'repeat':
      return '/practice?mode=review';
    case 'test':
      return '/tests';
  }
}
