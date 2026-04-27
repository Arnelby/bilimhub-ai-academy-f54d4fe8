import { supabase } from '@/integrations/supabase/client';
import { getDueRepetitionQuestions, updateSpacedRepetition } from '@/lib/spacedRepetition';
import { advanceMasteryAfterAnswer, getMasteryLoopState, recomputeMasteryState } from '@/lib/masteryLoop';
import { extractAnswerLetter } from '@/lib/answerExtraction';
import { normalizePracticeTopic } from '@/lib/topicTranslations';

/**
 * Forced Learning Mode — закрытый цикл обучения.
 * SQL RPC управляет состоянием learning_sessions; этот модуль —
 * клиентский оркестратор: подбор задач + сохранение ответа +
 * пробрасывание в mastery/spaced_repetition.
 *
 * NO AI AT RUNTIME.
 */

export type LearningStep = 'question' | 'explanation' | 'result';
export type LearningStatus = 'active' | 'paused' | 'completed';
export type QuestionSource = 'spaced_repetition' | 'weak_topic' | 'pool';

export interface LearningSession {
  id: string;
  user_id: string;
  is_active: boolean;
  status: LearningStatus;
  topic: string | null;
  step: LearningStep;
  current_question_id: string | null;
  current_question_source: QuestionSource | null;
  current_question_payload: any | null;
  last_answer_correct: boolean | null;
  last_answer_explanation: string | null;
  last_correct_answer: string | null;
  last_user_answer: string | null;
  questions_answered: number;
  correct_count: number;
  max_questions: number;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
}

export interface PickedQuestion {
  question_id: string;          // "pq_<uuid>"
  source: QuestionSource;
  topic: string;
  payload: {
    id: string;                 // raw uuid
    topic: string;
    question_type: string;
    correct_answer: string;
    question_data: any;
    correct_explanation: string | null;
    explanation_a: string | null;
    explanation_b: string | null;
    explanation_c: string | null;
    explanation_d: string | null;
    explanation_e: string | null;
  };
}

// ---------- Session lifecycle ----------

export async function fetchOpenSession(): Promise<LearningSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('learning_sessions' as any)
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[FORCED_FETCH_FAIL]', error);
    return null;
  }
  return (data as any) ?? null;
}

export async function startOrResumeSession(topic?: string | null): Promise<LearningSession | null> {
  console.log('[LEARNING_STARTED]', { topic });
  const { data, error } = await supabase.rpc('start_or_resume_learning_session' as any, {
    _topic: topic ?? null,
  });
  if (error) {
    console.error('[FORCED_START_FAIL]', error);
    return null;
  }
  return (data as any) ?? null;
}

export async function pauseSession(): Promise<void> {
  console.log('[LEARNING_PAUSED]');
  const { error } = await supabase.rpc('pause_learning_session' as any, {});
  if (error) console.error('[FORCED_PAUSE_FAIL]', error);
}

export async function completeSession(): Promise<void> {
  console.log('[SESSION_COMPLETED]');
  const { error } = await supabase.rpc('complete_learning_session' as any, {});
  if (error) console.error('[FORCED_COMPLETE_FAIL]', error);
}

export async function extendSession(extra = 5): Promise<LearningSession | null> {
  const { data, error } = await supabase.rpc('extend_learning_session' as any, { _extra: extra });
  if (error) {
    console.error('[FORCED_EXTEND_FAIL]', error);
    return null;
  }
  return (data as any) ?? null;
}

export async function setCurrentQuestion(q: PickedQuestion): Promise<LearningSession | null> {
  const { data, error } = await supabase.rpc('set_learning_current_question' as any, {
    _question_id: q.question_id,
    _source: q.source,
    _payload: q.payload as any,
  });
  if (error) {
    console.error('[FORCED_SET_Q_FAIL]', error);
    return null;
  }
  console.log('[QUESTION_SHOWN]', { question_id: q.question_id, source: q.source, topic: q.topic });
  return (data as any) ?? null;
}

export async function recordAnswer(params: {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}): Promise<LearningSession | null> {
  const { data, error } = await supabase.rpc('record_learning_answer' as any, {
    _is_correct: params.isCorrect,
    _user_answer: params.userAnswer,
    _correct_answer: params.correctAnswer,
    _explanation: params.explanation,
  });
  if (error) {
    console.error('[FORCED_RECORD_FAIL]', error);
    return null;
  }
  console.log('[ANSWER_SUBMITTED]', { isCorrect: params.isCorrect });
  console.log('[EXPLANATION_SHOWN]');
  return (data as any) ?? null;
}

export async function advanceStep(): Promise<LearningSession | null> {
  const { data, error } = await supabase.rpc('advance_learning_step' as any, {});
  if (error) {
    console.error('[FORCED_ADVANCE_FAIL]', error);
    return null;
  }
  return (data as any) ?? null;
}

// ---------- Question picker ----------

interface PoolRow {
  id: string;
  topic: string | null;
  question_type: string;
  correct_answer: string;
  question_data: any;
  correct_explanation: string | null;
  explanation_a: string | null;
  explanation_b: string | null;
  explanation_c: string | null;
  explanation_d: string | null;
  explanation_e: string | null;
}

async function fetchPool(topic: string | null, excludeIds: string[]): Promise<PoolRow[]> {
  const { data, error } = await supabase.rpc('get_practice_question_pool' as any, {
    requested_topic: topic ?? null,
    recent_question_ids: excludeIds.length ? excludeIds : null,
    max_rows: 200,
  });
  if (error) {
    console.error('[FORCED_POOL_FAIL]', error);
    return [];
  }
  return (data as any) ?? [];
}

function rowToPicked(row: PoolRow, source: QuestionSource): PickedQuestion {
  return {
    question_id: `pq_${row.id}`,
    source,
    topic: row.topic ?? '',
    payload: {
      id: row.id,
      topic: row.topic ?? '',
      question_type: row.question_type,
      correct_answer: row.correct_answer,
      question_data: row.question_data,
      correct_explanation: row.correct_explanation,
      explanation_a: row.explanation_a,
      explanation_b: row.explanation_b,
      explanation_c: row.explanation_c,
      explanation_d: row.explanation_d,
      explanation_e: row.explanation_e,
    },
  };
}

/**
 * Priority:
 *   1) spaced_repetition due ids that exist in the practice pool
 *   2) weak topic (mastery phase_topic)
 *   3) any pool question for the session topic
 */
export async function pickNextQuestion(params: {
  userId: string;
  session: LearningSession;
}): Promise<PickedQuestion | null> {
  const { userId, session } = params;
  const exclude: string[] = [];
  if (session.current_question_id) exclude.push(session.current_question_id);

  // Resolve weak topic via mastery state if session has none yet.
  let topic = session.topic;
  if (!topic) {
    const m = await getMasteryLoopState(userId);
    topic = m?.phase_topic ?? (m?.weak_topics?.[0] as string | undefined) ?? null;
  }
  const normTopic = topic ? normalizePracticeTopic(topic) : null;

  // 1) Spaced repetition
  const due = await getDueRepetitionQuestions(userId);
  if (due.length > 0) {
    const dueRawIds = due
      .filter((q) => q.startsWith('pq_'))
      .map((q) => q.slice(3));
    if (dueRawIds.length > 0) {
      const { data, error } = await supabase
        .from('practice_questions')
        .select('id, topic, question_type, correct_answer, question_data, correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d, explanation_e')
        .in('id', dueRawIds)
        .limit(5);
      if (!error && data && data.length > 0) {
        const row = data[Math.floor(Math.random() * data.length)] as PoolRow;
        return rowToPicked(row, 'spaced_repetition');
      }
    }
  }

  // 2) Weak topic
  if (normTopic) {
    const pool = await fetchPool(normTopic, exclude);
    if (pool.length > 0) {
      const row = pool[Math.floor(Math.random() * Math.min(pool.length, 20))];
      return rowToPicked(row, 'weak_topic');
    }
  }

  // 3) Anything from pool
  const pool = await fetchPool(null, exclude);
  if (pool.length > 0) {
    const row = pool[Math.floor(Math.random() * Math.min(pool.length, 20))];
    return rowToPicked(row, 'pool');
  }
  return null;
}

// ---------- Answer evaluation ----------

export interface EvaluatedAnswer {
  isCorrect: boolean;
  userAnswer: string;          // letter A-E
  correctAnswer: string;       // letter A-E
  explanation: string;         // short, ≤ 3 lines target
}

const LETTERS = ['A','B','C','D','E'] as const;

export function evaluateAnswer(picked: PickedQuestion, userLetter: string): EvaluatedAnswer {
  const correct = (picked.payload.correct_answer || '').toUpperCase();
  const user = (userLetter || '').toUpperCase();
  const isCorrect = !!correct && user === correct;

  // Pick explanation: prefer the per-letter one for the user's wrong choice;
  // for correct answers prefer correct_explanation.
  let explanation = '';
  if (isCorrect) {
    explanation = picked.payload.correct_explanation || pickLetterExplanation(picked, correct) || '';
  } else {
    explanation = pickLetterExplanation(picked, user) || picked.payload.correct_explanation || '';
  }
  if (!explanation) explanation = `Правильный ответ — ${correct}.`;
  return { isCorrect, userAnswer: user, correctAnswer: correct, explanation: shortText(explanation, 280) };
}

function pickLetterExplanation(p: PickedQuestion, letter: string): string | null {
  switch (letter) {
    case 'A': return p.payload.explanation_a;
    case 'B': return p.payload.explanation_b;
    case 'C': return p.payload.explanation_c;
    case 'D': return p.payload.explanation_d;
    case 'E': return p.payload.explanation_e;
    default: return null;
  }
}

function shortText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

// ---------- Side effects after an answer ----------

export async function applyAnswerSideEffects(params: {
  userId: string;
  session: LearningSession;
  picked: PickedQuestion;
  evaluated: EvaluatedAnswer;
}): Promise<void> {
  const { userId, session, picked, evaluated } = params;
  const topic = picked.topic || session.topic || null;

  // 1. Persist response (research-grade) — practice_responses
  try {
    await supabase.from('practice_responses').insert({
      user_id: userId,
      session_id: session.id,
      question_id: picked.question_id,
      question_index: session.questions_answered, // 0-based at time of insert
      topic,
      correct_answer: evaluated.correctAnswer,
      user_answer: evaluated.userAnswer,
      is_correct: evaluated.isCorrect,
      question_data: picked.payload.question_data,
      time_spent_seconds: 0,
    } as any);
  } catch (e) {
    console.error('[FORCED_RESPONSE_SAVE_FAIL]', e);
  }

  // 2. Spaced repetition update
  await updateSpacedRepetition({
    userId,
    questionId: picked.question_id,
    isCorrect: evaluated.isCorrect,
    topic,
  });

  // 3. Mastery loop advance (treat forced answers as practice attempts)
  if (topic) {
    await advanceMasteryAfterAnswer({
      userId,
      topic,
      isCorrect: evaluated.isCorrect,
      isValidation: false,
    });
  }

  // 4. Recompute aggregates so next question / next-step is fresh
  await recomputeMasteryState(userId);
}

// ---------- Helpers ----------

export function letterOptionsForQuestion(picked: PickedQuestion): string[] {
  // Comparison questions always A-D (SAT style)
  if (picked.payload.question_type === 'comparison') return ['A','B','C','D'];
  // MCQ — derive from question_data.options keys if present
  const opts = picked.payload?.question_data?.options;
  if (opts && typeof opts === 'object') {
    const keys = Object.keys(opts).map((k) => k.toUpperCase()).filter((k) => LETTERS.includes(k as any));
    if (keys.length > 0) return keys.sort();
  }
  return ['A','B','C','D','E'];
}

// Cyrillic display mapping (А Б В Г Д) — used by UI buttons
export const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А', B: 'Б', C: 'В', D: 'Г', E: 'Д',
};

export { extractAnswerLetter };
