import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * Deterministic, rule-based learning plan.
 * NO AI runtime. All inputs come from the DB (question_attempts + practice_responses).
 *
 * Topic classification rules:
 *   - require ≥3 attempts to consider a topic at all
 *   - accuracy < 0.5  → WEAK
 *   - accuracy < 0.75 → MEDIUM
 *   - accuracy ≥ 0.75 → STRONG
 *
 * Ranking:
 *   - WEAK topics sorted by accuracy ASC (worst first), capped at 5
 *   - MEDIUM topics sorted by accuracy ASC, capped at 8
 *   - STRONG topics sorted by accuracy DESC
 */

export interface TopicAccuracy {
  topic: string;
  total: number;
  correct: number;
  accuracy: number; // 0..100
}

export interface DeterministicPlan {
  weakTopics: TopicAccuracy[];
  mediumTopics: TopicAccuracy[];
  strongTopics: TopicAccuracy[];
  generatedAt: string; // ISO
}

const MIN_ATTEMPTS = 5;       // need ≥5 attempts to classify as weak (per spec)
const WEAK_THRESHOLD = 60;    // accuracy < 60% → weak
const MEDIUM_THRESHOLD = 80;  // accuracy < 80% → medium
const MAX_WEAK = 5;
const MAX_MEDIUM = 8;
const MAX_RECENT_ATTEMPTS = 50; // only consider last 50 attempts per spec

interface RawRow {
  topic: string | null;
  is_correct: boolean | null;
}

export function buildDeterministicPlan(rows: RawRow[]): DeterministicPlan {
  // Limit to most recent N attempts (caller passes ordered or unordered; we just cap total volume)
  const limited = rows.slice(0, MAX_RECENT_ATTEMPTS * 4); // generous cap, then per-topic aggregation
  const map = new Map<string, { correct: number; total: number }>();
  for (const r of limited) {
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
    if (v.total < MIN_ATTEMPTS) return;
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
    weakTopics: weak.slice(0, MAX_WEAK),
    mediumTopics: medium.slice(0, MAX_MEDIUM),
    strongTopics: strong,
    generatedAt: new Date().toISOString(),
  };
}
