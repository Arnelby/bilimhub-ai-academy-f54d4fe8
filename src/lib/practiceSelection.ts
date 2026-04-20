import { normalizePracticeTopic } from '@/lib/topicTranslations';
import { getDueRepetitionQuestions } from '@/lib/spacedRepetition';
import { getWeakTopics } from '@/lib/topicStats';

/**
 * Stage 3 — deterministic plan + selection (NO AI).
 *
 * Inputs are passed in (the bank, answered set) so this module stays pure
 * and testable. Practice.tsx already builds the bank/answered set from the DB.
 *
 * Selection priority (per session of SESSION_SIZE):
 *   1) SPACED REPETITION  — up to 30% (max 3) of items whose next_review_date <= now
 *   2) WEAK TOPICS (NEW)  — never-answered questions inside weak topics
 *   3) STRONG TOPICS (NEW) — never-answered questions outside weak topics
 *   4) PAD — only if not enough new questions, allow reuse (randomized)
 *
 * The only items allowed to repeat are spaced-repetition ones.
 */

export const SESSION_SIZE = 10;
const REPETITION_RATIO = 0.3; // 30% of session
const WEAK_RATIO = 0.7;       // 70% of remaining session

export interface BankItem {
  qid: string;       // e.g. "pq_<uuid>"
  topic: string;
  q: any;
}

export interface PlanEntry {
  topic: string;
  count: number;
  bucket: 'weak' | 'strong';
}

export interface PracticePlan {
  weakTopics: string[];        // normalized
  strongTopics: string[];      // normalized
  distribution: PlanEntry[];
  insufficientData: boolean;
}

export interface SelectionResult {
  selected: BankItem[];
  sources: Record<string, 'repetition' | 'weak' | 'strong' | 'pad'>;
  plan: PracticePlan;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueByQid(items: BankItem[]): BankItem[] {
  const seen = new Set<string>();
  const out: BankItem[] = [];
  for (const it of items) {
    if (seen.has(it.qid)) continue;
    seen.add(it.qid);
    out.push(it);
  }
  return out;
}

/**
 * Build a deterministic per-topic plan for the user.
 * Plan is informational; selection enforces the same ratios.
 */
export async function generatePracticePlan(params: {
  userId: string;
  bank: BankItem[];
}): Promise<PracticePlan> {
  const { userId, bank } = params;

  const weakResult = await getWeakTopics(userId);
  const weakTopicsNorm = weakResult.topics
    .map((t) => normalizePracticeTopic(t.topic))
    .filter(Boolean);

  // All topics present in the available bank (so plan only references usable topics).
  const bankTopics = Array.from(
    new Set(bank.map((b) => normalizePracticeTopic(b.topic || '')).filter(Boolean))
  );

  const weakTopics = weakTopicsNorm.filter((t) => bankTopics.includes(t));
  const strongTopics = bankTopics.filter((t) => !weakTopics.includes(t));

  const weakCount = Math.round(SESSION_SIZE * WEAK_RATIO);  // 7
  const strongCount = SESSION_SIZE - weakCount;             // 3

  const distribute = (topics: string[], total: number, bucket: 'weak' | 'strong'): PlanEntry[] => {
    if (topics.length === 0 || total <= 0) return [];
    const base = Math.floor(total / topics.length);
    let leftover = total - base * topics.length;
    return topics.map((topic) => {
      const extra = leftover > 0 ? 1 : 0;
      if (leftover > 0) leftover--;
      return { topic, count: base + extra, bucket };
    });
  };

  let distribution: PlanEntry[] = [];

  if (weakTopics.length > 0) {
    distribution = [
      ...distribute(weakTopics, weakCount, 'weak'),
      ...distribute(strongTopics, strongCount, 'strong'),
    ];
  } else {
    // No reliable weak topics → fall back to balanced over whatever we have.
    distribution = distribute(bankTopics, SESSION_SIZE, 'strong');
  }

  const plan: PracticePlan = {
    weakTopics,
    strongTopics,
    distribution,
    insufficientData: weakResult.insufficient_data,
  };

  console.log('[PLAN_GENERATED]', {
    user_id: userId,
    weak_topics: weakTopics,
    strong_topics: strongTopics,
    distribution,
    insufficient_data: weakResult.insufficient_data,
  });

  return plan;
}

/**
 * Pick `count` NEW (never-answered) questions, balanced across the given topics.
 */
function pickNewBalanced(
  pool: BankItem[],
  topics: string[],
  answeredQids: Set<string>,
  alreadyChosen: Set<string>,
  count: number,
): BankItem[] {
  if (count <= 0) return [];

  const grouped = new Map<string, BankItem[]>();
  for (const t of topics) grouped.set(t, []);
  for (const item of pool) {
    const key = normalizePracticeTopic(item.topic || '');
    if (!grouped.has(key)) continue;
    if (answeredQids.has(item.qid)) continue;
    if (alreadyChosen.has(item.qid)) {
      console.log('[REPEAT_BLOCKED]', { question_id: item.qid, reason: 'already_in_session' });
      continue;
    }
    grouped.get(key)!.push(item);
  }

  // Shuffle each topic bucket for variety
  for (const [k, v] of grouped) grouped.set(k, shuffle(v));

  const selected: BankItem[] = [];
  const topicKeys = Array.from(grouped.keys());
  while (selected.length < count) {
    let progressed = false;
    for (const key of topicKeys) {
      if (selected.length >= count) break;
      const bucket = grouped.get(key) || [];
      const next = bucket.shift();
      if (!next) continue;
      selected.push(next);
      progressed = true;
    }
    if (!progressed) break;
  }
  return selected;
}

/**
 * Strict-repeat-prevention selection.
 *
 * @param userId      current user
 * @param bank        full filtered question bank (already quality-checked by caller)
 * @param answeredQids set of question_ids the user has previously answered (from practice_responses)
 */
export async function selectPracticeQuestions(params: {
  userId: string;
  bank: BankItem[];
  answeredQids: Set<string>;
}): Promise<SelectionResult> {
  const { userId, answeredQids } = params;
  const bank = uniqueByQid(params.bank);
  const sources: Record<string, 'repetition' | 'weak' | 'strong' | 'pad'> = {};

  const plan = await generatePracticePlan({ userId, bank });
  const weakSet = new Set(plan.weakTopics);

  const chosen: BankItem[] = [];
  const chosenSet = new Set<string>();

  // 1) SPACED REPETITION — up to 30% (max 3)
  const dueQids = await getDueRepetitionQuestions(userId);
  const dueLimit = Math.min(Math.floor(SESSION_SIZE * REPETITION_RATIO), dueQids.length, 3);
  if (dueQids.length > 0) {
    const bankByQid = new Map(bank.map((b) => [b.qid, b]));
    let added = 0;
    for (const qid of shuffle(dueQids)) {
      if (added >= dueLimit) break;
      const item = bankByQid.get(qid);
      if (!item || chosenSet.has(item.qid)) continue;
      chosen.push(item);
      chosenSet.add(item.qid);
      sources[item.qid] = 'repetition';
      console.log('[QUESTION_SELECTED]', { question_id: item.qid, source: 'repetition' });
      added++;
    }
  }

  const remaining = SESSION_SIZE - chosen.length;
  // 70/30 split of REMAINING, not of total — repetition slots already gave us mistakes.
  const weakTarget = plan.weakTopics.length > 0 ? Math.round(remaining * WEAK_RATIO) : 0;
  const strongTarget = remaining - weakTarget;

  // 2) WEAK TOPICS — NEW only
  if (plan.weakTopics.length > 0 && weakTarget > 0) {
    const weakPool = bank.filter((b) => weakSet.has(normalizePracticeTopic(b.topic || '')));
    const weakPicks = pickNewBalanced(weakPool, plan.weakTopics, answeredQids, chosenSet, weakTarget);
    for (const it of weakPicks) {
      chosen.push(it);
      chosenSet.add(it.qid);
      sources[it.qid] = 'weak';
      console.log('[QUESTION_SELECTED]', { question_id: it.qid, source: 'weak' });
    }
  }

  // 3) STRONG TOPICS — NEW only
  const need3 = SESSION_SIZE - chosen.length;
  if (need3 > 0 && plan.strongTopics.length > 0) {
    const strongPool = bank.filter((b) => !weakSet.has(normalizePracticeTopic(b.topic || '')));
    const strongPicks = pickNewBalanced(strongPool, plan.strongTopics, answeredQids, chosenSet, need3);
    for (const it of strongPicks) {
      chosen.push(it);
      chosenSet.add(it.qid);
      sources[it.qid] = 'strong';
      console.log('[QUESTION_SELECTED]', { question_id: it.qid, source: 'strong' });
    }
  }

  // 4) PAD — not enough new questions in any topic. Allow reuse (randomized),
  //    but still skip questions already in this session and skip the spaced-rep ones
  //    (they're already accounted for above).
  if (chosen.length < SESSION_SIZE) {
    const padPool = shuffle(bank.filter((b) => !chosenSet.has(b.qid)));
    // Prefer NEW first, then anything else
    const padNew = padPool.filter((b) => !answeredQids.has(b.qid));
    const padReuse = padPool.filter((b) => answeredQids.has(b.qid));
    const ordered = [...padNew, ...padReuse];
    for (const it of ordered) {
      if (chosen.length >= SESSION_SIZE) break;
      chosen.push(it);
      chosenSet.add(it.qid);
      sources[it.qid] = 'pad';
      console.log('[QUESTION_SELECTED]', { question_id: it.qid, source: 'pad' });
    }
  }

  // 5) Final shuffle, then trim to SESSION_SIZE
  const final = shuffle(chosen).slice(0, SESSION_SIZE);

  return { selected: final, sources, plan };
}
