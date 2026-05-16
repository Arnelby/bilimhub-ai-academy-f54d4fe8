/**
 * Single source of truth for achievements.
 * Used by both Profile.tsx and AchievementsPanel.tsx so the two
 * always show the SAME unlocked count and the SAME progress.
 *
 * Data-driven (no AI): everything is derived from real DB tables:
 *   - user_tests       → test count, perfect score
 *   - user_answers     → correct answers count
 *   - practice_responses → practice correct count (counts toward correctness too)
 *   - user_sessions    → study hours
 *   - profiles         → streak
 *   - user_achievements → admin/legacy unlocked overrides
 */
import { supabase } from '@/integrations/supabase/client';

export type AchievementId =
  | 'first_test'
  | 'tests_5'
  | 'tests_10'
  | 'correct_50'
  | 'correct_100'
  | 'correct_500'
  | 'study_1h'
  | 'study_5h'
  | 'study_10h'
  | 'perfect_score'
  | 'streak_3'
  | 'streak_7';

export interface AchievementMeta {
  id: AchievementId;
  /** i18n key (under `achievementsPanel.items.<id>.title`). */
  titleKey: string;
  /** i18n key (under `achievementsPanel.items.<id>.description`). */
  descriptionKey: string;
}

export interface AchievementProgress extends AchievementMeta {
  unlocked: boolean;
  progress: number;        // 0..target
  target: number;          // 1 if boolean
  pct: number;             // 0..100
  unlockedAt?: string | null;
}

const IDS: AchievementId[] = [
  'first_test', 'tests_5', 'tests_10',
  'correct_50', 'correct_100', 'correct_500',
  'study_1h', 'study_5h', 'study_10h',
  'perfect_score', 'streak_3', 'streak_7',
];

const META: AchievementMeta[] = IDS.map(id => ({
  id,
  titleKey: `achievementsPanel.items.${id}.title`,
  descriptionKey: `achievementsPanel.items.${id}.description`,
}));

function compute(
  id: AchievementId,
  data: { tests: number; correct: number; hours: number; perfect: boolean; streak: number }
): { progress: number; target: number; unlocked: boolean } {
  switch (id) {
    case 'first_test':    return { progress: Math.min(data.tests, 1),   target: 1,   unlocked: data.tests >= 1 };
    case 'tests_5':       return { progress: Math.min(data.tests, 5),   target: 5,   unlocked: data.tests >= 5 };
    case 'tests_10':      return { progress: Math.min(data.tests, 10),  target: 10,  unlocked: data.tests >= 10 };
    case 'correct_50':    return { progress: Math.min(data.correct, 50),  target: 50,  unlocked: data.correct >= 50 };
    case 'correct_100':   return { progress: Math.min(data.correct, 100), target: 100, unlocked: data.correct >= 100 };
    case 'correct_500':   return { progress: Math.min(data.correct, 500), target: 500, unlocked: data.correct >= 500 };
    case 'study_1h':      return { progress: Math.min(data.hours, 1),   target: 1,   unlocked: data.hours >= 1 };
    case 'study_5h':      return { progress: Math.min(data.hours, 5),   target: 5,   unlocked: data.hours >= 5 };
    case 'study_10h':     return { progress: Math.min(data.hours, 10),  target: 10,  unlocked: data.hours >= 10 };
    case 'perfect_score': return { progress: data.perfect ? 1 : 0,      target: 1,   unlocked: data.perfect };
    case 'streak_3':      return { progress: Math.min(data.streak, 3),  target: 3,   unlocked: data.streak >= 3 };
    case 'streak_7':      return { progress: Math.min(data.streak, 7),  target: 7,   unlocked: data.streak >= 7 };
  }
}

export async function loadAchievementsForUser(userId: string): Promise<AchievementProgress[]> {
  const [testsRes, answersRes, practiceRes, sessionsRes, profileRes, unlockedRes] = await Promise.all([
    supabase.from('user_tests').select('id, score, total_questions, completed_at').eq('user_id', userId).not('completed_at', 'is', null),
    supabase.from('user_answers').select('is_correct').eq('user_id', userId),
    supabase.from('practice_responses').select('is_correct').eq('user_id', userId),
    supabase.from('user_sessions').select('duration_seconds').eq('user_id', userId),
    supabase.from('profiles').select('streak').eq('id', userId).maybeSingle(),
    supabase.from('user_achievements').select('achievement, unlocked_at').eq('user_id', userId),
  ]);

  const tests = testsRes.data || [];
  const answers = answersRes.data || [];
  const practice = practiceRes.data || [];
  const sessions = sessionsRes.data || [];
  const profile = profileRes.data || { streak: 0 };
  const unlockedRows = unlockedRes.data || [];

  const correct = answers.filter(a => a.is_correct).length + practice.filter(a => a.is_correct).length;
  const hours = sessions.reduce((s, x) => s + (x.duration_seconds || 0), 0) / 3600;
  const perfect = tests.some(t => {
    const total = t.total_questions || 30;
    const raw = t.score || 0;
    const pct = raw > total ? raw : (total > 0 ? Math.round((raw / total) * 100) : 0);
    return pct >= 100;
  });
  const streak = profile?.streak ?? 0;

  const unlockedMap = new Map(unlockedRows.map(r => [r.achievement as string, r.unlocked_at]));

  return META.map(m => {
    const c = compute(m.id, { tests: tests.length, correct, hours, perfect, streak });
    const dbUnlocked = unlockedMap.has(m.id);
    const unlocked = c.unlocked || dbUnlocked;
    return {
      ...m,
      progress: c.progress,
      target: c.target,
      unlocked,
      pct: Math.min(100, Math.round((c.progress / c.target) * 100)),
      unlockedAt: dbUnlocked ? unlockedMap.get(m.id) ?? null : null,
    };
  });
}
