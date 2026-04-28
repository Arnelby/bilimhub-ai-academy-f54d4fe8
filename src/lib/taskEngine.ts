import { supabase } from '@/integrations/supabase/client';
import { recomputeMasteryState, getMasteryLoopState } from '@/lib/masteryLoop';
import { topicToLessonSlug } from '@/lib/topicTranslations';

/**
 * Deterministic Task Engine.
 *
 * Builds a STRICTLY ORDERED queue of atomic tasks for the user from:
 *   - user_learning_state.weak_topics (accuracy < 0.6)
 *   - user_learning_state.watched_videos / completed_lessons
 *   - spaced_repetition (status='due' OR next_review_date <= now)
 *
 * NO AI. NO advice. NO "why this matters" copy.
 * One task at a time. User cannot jump or pick.
 *
 * Status transitions are derived per-load, not persisted:
 *   - first task with unmet completion criteria = 'active'
 *   - everything before it = 'done'
 *   - everything after = 'pending'
 */

export type TaskType = 'lesson' | 'practice' | 'repeat' | 'test';

export interface PlanTask {
  id: string;             // stable id within plan (e.g. "fractions:lesson")
  type: TaskType;
  topic: string | null;   // canonical topic name; null for global tasks
  count: number;          // questions / videos
  difficulty?: 'easy' | 'medium';
  status: 'pending' | 'active' | 'done';
  /** Human label (Russian, no advice) */
  label: string;
}

export interface Plan {
  user_id: string;
  generated_at: string;
  tasks: PlanTask[];
  total: number;
  done: number;
  active_index: number; // -1 if none
}

const REPEAT_INTERVAL = 3; // insert a repeat task every N tasks if there are mistakes

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
  weak_topics: string[];
  watched_videos: Set<string>;
  due_repeats: number;          // count of due spaced_repetition rows
  topic_stats: Record<string, { total_attempts: number; correct_answers: number; accuracy: number }>;
  /** correct_count of last `count` answered tasks per topic — used to mark "done" */
  topic_progress: Record<string, { correct: number; total: number }>;
}

async function loadSources(userId: string): Promise<SourceData> {
  // mastery state (weak_topics, topic_stats)
  const mastery = await getMasteryLoopState(userId);
  const weak = (mastery?.weak_topics ?? []).slice(0, 2); // top 2 weak

  // watched videos
  const { data: lp } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);
  const watched = new Set<string>((lp || []).map(r => r.lesson_id));

  // due repeats
  const nowIso = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from('spaced_repetition')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', nowIso);

  // recent practice/attempts per topic, to compute "done" status of practice tasks
  const { data: recent } = await supabase
    .from('practice_responses')
    .select('topic, is_correct, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  const progress: Record<string, { correct: number; total: number }> = {};
  for (const r of recent || []) {
    if (!r.topic) continue;
    const e = progress[r.topic] || { correct: 0, total: 0 };
    e.total++; if (r.is_correct) e.correct++;
    progress[r.topic] = e;
  }

  return {
    weak_topics: weak,
    watched_videos: watched,
    due_repeats: dueCount ?? 0,
    topic_stats: mastery?.topic_stats ?? {},
    topic_progress: progress,
  };
}

function videoIdForTopic(topic: string): string {
  // Stored as `video_<slug>` in user_lesson_progress per learningState.ts convention.
  return `video_${topicToLessonSlug(topic) || topic}`;
}

function buildQueue(src: SourceData): PlanTask[] {
  const tasks: PlanTask[] = [];

  // 1) Spaced repetition first if anything is due
  if (src.due_repeats > 0) {
    const cnt = Math.min(src.due_repeats, 3);
    tasks.push({
      id: 'sr:repeat',
      type: 'repeat', topic: null, count: cnt,
      status: 'pending',
      label: labelFor('repeat', null, cnt),
    });
  }

  // 2) Top 2 weak topics
  for (const topic of src.weak_topics) {
    const videoSeen = src.watched_videos.has(videoIdForTopic(topic));
    if (!videoSeen) {
      tasks.push({
        id: `${topic}:lesson`,
        type: 'lesson', topic, count: 1,
        status: 'pending',
        label: labelFor('lesson', topic, 1),
      });
    }
    tasks.push({
      id: `${topic}:practice-easy`,
      type: 'practice', topic, count: 5, difficulty: 'easy',
      status: 'pending',
      label: labelFor('practice', topic, 5, 'easy'),
    });
    // Insert mistake-repeat only if user actually has mistakes in that topic
    const stat = src.topic_stats[topic];
    if (stat && stat.total_attempts >= 3 && stat.correct_answers < stat.total_attempts) {
      tasks.push({
        id: `${topic}:repeat`,
        type: 'repeat', topic, count: 2,
        status: 'pending',
        label: labelFor('repeat', topic, 2),
      });
    }
    tasks.push({
      id: `${topic}:practice-medium`,
      type: 'practice', topic, count: 5, difficulty: 'medium',
      status: 'pending',
      label: labelFor('practice', topic, 5, 'medium'),
    });
  }

  // Insert a periodic global repeat every REPEAT_INTERVAL tasks if more due items exist
  if (src.due_repeats > 3 && tasks.length > REPEAT_INTERVAL) {
    tasks.splice(REPEAT_INTERVAL, 0, {
      id: 'sr:repeat-2',
      type: 'repeat', topic: null, count: 3,
      status: 'pending',
      label: labelFor('repeat', null, 3),
    });
  }

  // 3) If nothing weak left → contribution test
  if (src.weak_topics.length === 0 && tasks.length === 0) {
    tasks.push({
      id: 'global:test',
      type: 'test', topic: null, count: 30,
      status: 'pending',
      label: labelFor('test', null, 30),
    });
  }

  return tasks;
}

/** Mark each task done if completion criteria met, then mark first not-done as active. */
function applyStatuses(tasks: PlanTask[], src: SourceData): PlanTask[] {
  const result = tasks.map(t => ({ ...t }));
  for (const t of result) {
    if (t.type === 'lesson' && t.topic) {
      if (src.watched_videos.has(videoIdForTopic(t.topic))) t.status = 'done';
    } else if (t.type === 'practice' && t.topic) {
      const p = src.topic_progress[t.topic];
      // crude: consider done if there are at least `count` recent answers AND accuracy >= 0.6
      if (p && p.total >= t.count && (p.correct / p.total) >= 0.6) t.status = 'done';
    }
    // repeat/test: only marked done after explicit completion (not derivable here) → stays pending
  }
  let activeSet = false;
  for (const t of result) {
    if (t.status === 'done') continue;
    if (!activeSet) { t.status = 'active'; activeSet = true; }
    else { t.status = 'pending'; }
  }
  return result;
}

/**
 * Build (or rebuild) the plan for a user. Pure derivation — no DB writes.
 * Logs [PLAN_CREATED].
 */
export async function buildPlan(userId: string): Promise<Plan> {
  // Always recompute mastery first so weak_topics reflect latest answers
  await recomputeMasteryState(userId);
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
  console.log('[PLAN_CREATED]', { user_id: userId, tasks: tasks.map(t => ({ type: t.type, topic: t.topic, status: t.status })) });
  return plan;
}

/** Returns the next pending/active task, or null. Logs [NEXT_TASK]. */
export function getNextTask(plan: Plan): PlanTask | null {
  const t = plan.tasks.find(x => x.status === 'active') ?? plan.tasks.find(x => x.status === 'pending') ?? null;
  if (t) console.log('[NEXT_TASK]', { task_type: t.type, topic: t.topic });
  return t;
}

/** Route to navigate when starting a task. */
export function routeForTask(task: PlanTask): string {
  switch (task.type) {
    case 'lesson':
      return task.topic ? `/lessons/topic/${encodeURIComponent(topicToLessonSlug(task.topic) || task.topic)}` : '/lessons';
    case 'practice':
      // Forced loop is the executor for practice
      return '/learn';
    case 'repeat':
      return '/practice?mode=review';
    case 'test':
      return '/tests';
  }
}
