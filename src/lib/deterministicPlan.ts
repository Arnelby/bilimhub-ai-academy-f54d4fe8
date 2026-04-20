import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * THIN WRAPPER — kept for backward compatibility.
 * Topic classification is now centralized in `learningState.ts`.
 * This file remains so existing UI components (e.g., Practice.tsx) keep compiling.
 */

export interface TopicAccuracy {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface DeterministicPlan {
  weakTopics: TopicAccuracy[];
  mediumTopics: TopicAccuracy[];
  strongTopics: TopicAccuracy[];
  generatedAt: string;
}

interface RawRow {
  topic: string | null;
  is_correct: boolean | null;
}

const WEAK_THRESHOLD = 60;
const MEDIUM_THRESHOLD = 80;

export function buildDeterministicPlan(rows: RawRow[]): DeterministicPlan {
  const map = new Map<string, { correct: number; total: number }>();
  for (const r of rows) {
    const t = normalizeAnalyticsTopic(r.topic || '');
    if (!t) continue;
    const e = map.get(t) || { correct: 0, total: 0 };
    e.total++;
    if (r.is_correct) e.correct++;
    map.set(t, e);
  }
  const weak: TopicAccuracy[] = [];
  const medium: TopicAccuracy[] = [];
  const strong: TopicAccuracy[] = [];
  map.forEach((v, topic) => {
    if (v.total < 1) return;
    const accuracy = Math.round((v.correct / v.total) * 100);
    const stat: TopicAccuracy = { topic, total: v.total, correct: v.correct, accuracy };
    if (accuracy < WEAK_THRESHOLD) weak.push(stat);
    else if (accuracy < MEDIUM_THRESHOLD) medium.push(stat);
    else strong.push(stat);
  });
  weak.sort((a, b) => a.accuracy - b.accuracy);
  medium.sort((a, b) => a.accuracy - b.accuracy);
  strong.sort((a, b) => b.accuracy - a.accuracy);
  return {
    weakTopics: weak,
    mediumTopics: medium,
    strongTopics: strong,
    generatedAt: new Date().toISOString(),
  };
}
