import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Target, AlertTriangle, Dumbbell, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { MathRenderer } from '@/components/math/MathRenderer';
import { toCyrillicKey, toLatinKey, TEST_CONFIG } from '@/lib/mathTestConfig';
import { normalizeAnalyticsTopic, normalizePracticeTopic, translateTopic, topicToLessonSlug } from '@/lib/topicTranslations';
import { buildDeterministicPlan } from '@/lib/deterministicPlan';
import { normalizeAnswer, compareAnswers } from '@/lib/answerNormalization';
import { QuestionReview } from '@/components/review/QuestionReview';
import { TopicSummary } from '@/components/practice/TopicSummary';
import { updateSpacedRepetition, getFailedQuestions } from '@/lib/spacedRepetition';
import { updateTopicStats } from '@/lib/topicStats';
import { selectPracticeQuestions, SESSION_SIZE } from '@/lib/practiceSelection';
import { useMotivation } from '@/hooks/useMotivation';
import { MotivationWidget } from '@/components/motivation/MotivationWidget';
import { updateLearningState, getLearningState, type LearningState } from '@/lib/learningState';
import { advanceMasteryAfterAnswer } from '@/lib/masteryLoop';
import { MistakesBlock, type MistakeItem } from '@/components/practice/MistakesBlock';
import { recordMasteryAttempt, selectForcedTopic, getMistakeQueueForTopic, getMasteryForTopic } from '@/lib/masteryEngine';
import { TopicProgressDelta } from '@/components/practice/TopicProgressDelta';
import { toast } from 'sonner';

interface ComparisonPractice {
  type: 'comparison';
  id: number;
  question_number: number;
  topic: string;
  instruction: string | null;
  column_a: string;
  column_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  variantId?: number;
  correct_explanation?: string | null;
  explanation_a?: string | null;
  explanation_b?: string | null;
  explanation_c?: string | null;
  explanation_d?: string | null;
  explanation_e?: string | null;
}

interface McqPractice {
  type: 'mcq';
  id: number;
  question_number: number;
  topic: string;
  instruction: string;
  options: Record<string, string>;
  correct_answer: string;
  variantId?: number;
  correct_explanation?: string | null;
  explanation_a?: string | null;
  explanation_b?: string | null;
  explanation_c?: string | null;
  explanation_d?: string | null;
  explanation_e?: string | null;
}

type PracticeQuestion = ComparisonPractice | McqPractice;

const PRACTICE_RECENT_HISTORY_LIMIT = 200;
const PRACTICE_SESSION_SIZE = 10; // hard limit per spec — exactly 10 questions per session

interface MistakeExplanation {
  staticSolution: string;     // full solution from question_explanations (no AI)
  mistakeHint: string;        // short AI hint, only when wrong
  loadingStatic: boolean;
  loadingHint: boolean;
}

export default function Practice() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedTopic = searchParams.get('topic'); // null = no focus
  const modeParam = searchParams.get('mode');
  const reviewMode = modeParam === 'review';
  const masteryMode = modeParam === 'mastery' || modeParam === 'validation';
  const isValidationMode = modeParam === 'validation';
  const difficultyParam = (searchParams.get('difficulty') || 'all') as 'easy' | 'medium' | 'hard' | 'all';
  const { user } = useAuth();
  const [learningState, setLearningState] = useState<LearningState | null>(null);
  const { isAI, isControl, group, loading: groupLoading } = useUserGroup();
  const motivation = useMotivation(user?.id);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [latestTestName, setLatestTestName] = useState('');
  const [latestTestType, setLatestTestType] = useState<'comparison' | 'mcq'>('comparison');
  const [mistakeExplanations, setMistakeExplanations] = useState<Record<string, MistakeExplanation>>({});
  const [expandedMistake, setExpandedMistake] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  const loadPractice = useCallback(async (forceNew: boolean = false) => {
    if (!user || groupLoading) return;
    setLoading(true);
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setMistakeExplanations({});
    setExpandedMistake(null);
    setGenerationError(null);
    sessionStartRef.current = Date.now();

    // ENGAGEMENT: when starting a fresh session, clear stale "before" snapshots
    // so the next results screen captures the true accuracy at session start.
    if (forceNew) {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('pre_acc:')) sessionStorage.removeItem(k);
        }
      } catch { /* sessionStorage may be unavailable */ }
    }

    // ===== MASTERY LOCK (AI group only) =====
    // If there is an unmastered topic and the user did NOT request review mode,
    // force them onto the weakest topic. No free choice.
    if (!reviewMode && isAI) {
      try {
        const forced = await selectForcedTopic(user.id);
        if (forced && normalizeAnalyticsTopic(focusedTopic || '') !== forced.topic) {
          console.log('[MASTERY_LOCK] redirecting to forced topic', forced.topic);
          setSearchParams({ topic: forced.topic });
          return;
        }
      } catch (e) {
        console.error('[MASTERY_LOCK] check failed', e);
      }
    }


    // ===== BACKEND GATE: lesson-before-practice (server-side enforcement) =====
    // Only when a topic is focused and not in review/mastery mode.
    if (!reviewMode && !masteryMode && focusedTopic) {
      try {
        const { data: gate, error: gateErr } = await supabase.rpc(
          'start_practice_session' as any,
          { _topic: focusedTopic, _practice_type: isAI ? 'personalized' : 'general' },
        );
        if (gateErr) {
          console.warn('[PRACTICE_GATE] RPC error (non-blocking)', gateErr);
        } else if (gate && (gate as any).allowed === false) {
          const reason = (gate as any).reason;
          const lessonId = (gate as any).lesson_id;
          console.log('[PRACTICE_GATE] blocked', gate);
          if (reason === 'lesson_required' && lessonId) {
            toast.info('Сначала посмотри урок по этой теме');
            navigate(`/lessons/${lessonId}`, { replace: true });
            return;
          }
        } else {
          console.log('[PRACTICE_GATE] allowed', gate);
        }
      } catch (e) {
        console.warn('[PRACTICE_GATE] exception (non-blocking)', e);
      }
    }

    // === REVIEW MODE — AI group only. Control must never see mistake-review flow. ===
    if (reviewMode && !isAI) {
      console.log('[REVIEW_MODE] blocked for non-AI group — redirecting to general practice');
      setSearchParams({});
      return;
    }
    if (reviewMode) {
      try {
        const failed = await getFailedQuestions(user.id);
        const pqIds = failed
          .map(f => f.question_id)
          .filter(qid => typeof qid === 'string' && qid.startsWith('pq_'))
          .map(qid => qid.slice(3));

        if (pqIds.length === 0) {
          console.log('[REVIEW_MODE] no failed questions — redirecting to general practice');
          setSearchParams({});
          return;
        }

        const { data: rows } = await supabase
          .from('practice_questions')
          .select('id, topic, question_type, correct_answer, question_data, correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d, explanation_e')
          .in('id', pqIds);

        const reviewQs: PracticeQuestion[] = [];
        for (const r of (rows ?? []) as any[]) {
          const data = (r.question_data as any) || {};
          const qtype = (r.question_type || data.type || '').toString().toLowerCase();
          const ans = (r.correct_answer || data.correct_answer || 'A').toString().trim().toUpperCase();
          const base = {
            id: r.id as any,
            question_number: 0,
            topic: r.topic || data.topic || '',
            correct_answer: ans,
            correct_explanation: r.correct_explanation ?? null,
            explanation_a: r.explanation_a ?? null,
            explanation_b: r.explanation_b ?? null,
            explanation_c: r.explanation_c ?? null,
            explanation_d: r.explanation_d ?? null,
            explanation_e: r.explanation_e ?? null,
          };
          if (qtype === 'comparison') {
            reviewQs.push({
              ...base,
              type: 'comparison',
              instruction: data.instruction ?? null,
              column_a: data.column_a ?? '',
              column_b: data.column_b ?? '',
              option_c: null,
              option_d: null,
              _qid: `pq_${r.id}`,
            } as any);
          } else if (qtype === 'mcq') {
            reviewQs.push({
              ...base,
              type: 'mcq',
              instruction: data.instruction || '',
              options: data.options || {},
              _qid: `pq_${r.id}`,
            } as any);
          }
        }

        const { data: pid } = await supabase
          .from('profiles').select('participant_id').eq('id', user.id).maybeSingle();
        const participant = pid?.participant_id || null;
        setParticipantId(participant);

        const { data: sess } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            participant_id: participant,
            group_type: group,
            practice_type: 'review_mistakes',
            data_version: 'v2',
            is_reliable: !!participant,
            status: 'active',
          })
          .select('id')
          .single();

        if (sess) {
          setSessionId(sess.id);
          await supabase.from('practice_session_questions').insert(
            reviewQs.map((q, idx) => ({
              session_id: sess.id,
              question_id: (q as any)._qid,
              order_index: idx,
            })),
          );
        }

        setQuestions(reviewQs);
        setLatestTestName('Повторение ошибок');
        setLatestTestType(reviewQs[0]?.type || 'comparison');
        setLoading(false);
        console.log('[REVIEW_MODE] loaded', { count: reviewQs.length });
        return;
      } catch (e) {
        console.error('[REVIEW_MODE] failed', e);
      }
    }

    try {
      console.log(`[PRACTICE_FRONTEND] DB-driven practice for user: ${user.id}, group: ${group}, forceNew: ${forceNew}`);

      const focusRu = focusedTopic ? normalizePracticeTopic(focusedTopic) : null;
      const focusEn = focusedTopic ? normalizeAnalyticsTopic(focusedTopic) : null;
      const requestedCount = PRACTICE_SESSION_SIZE;

      const { data: profile } = await supabase
        .from('profiles')
        .select('participant_id')
        .eq('id', user.id)
        .maybeSingle();
      const pid = profile?.participant_id || null;
      setParticipantId(pid);

      const [
        { data: latestSess },
        { data: priorPractice },
        { data: attempts },
        { data: latestAttempt },
      ] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('id, weak_topics, practice_type, status, num_correct, num_tasks')
          .eq('user_id', user.id)
          .in('status', ['active', 'completed'])
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('practice_responses')
          .select('question_id, question_data, is_correct, created_at, topic')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('question_attempts')
          .select('topic, is_correct')
          .eq('user_id', user.id),
        isAI
          ? supabase
              .from('user_tests')
              .select('id, test_id')
              .eq('user_id', user.id)
              .not('completed_at', 'is', null)
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);

      // Build per-question history maps — used for 3-tier selection (NEW → INCORRECT → REVIEW).
      // Newest entries first because priorPractice is ordered by created_at DESC.
      const answeredQids = new Set<string>();
      const incorrectQids = new Set<string>();
      const recentQidsOrdered: string[] = [];
      for (const p of (priorPractice || []) as any[]) {
        const qid: string | undefined = p.question_id || p.question_data?.question_id;
        if (typeof qid !== 'string' || !qid.startsWith('pq_')) continue;
        if (!answeredQids.has(qid)) recentQidsOrdered.push(qid);
        answeredQids.add(qid);
        if (p.is_correct === false) incorrectQids.add(qid);
      }
      // Last few question_ids to avoid in tier-3 fallback
      const veryRecentQids = new Set(recentQidsOrdered.slice(0, 5));

      // Fetch the FULL topic pool (no pre-exclusion) so we can tier client-side.
      const [{ data: practiceRows, error: practicePoolError }, { data: testCompRows }, { data: testMcqRows }] = await Promise.all([
        (supabase as any).rpc('get_practice_question_pool', {
          requested_topic: focusRu,
          recent_question_ids: null,
          max_rows: focusedTopic ? 1000 : 1000,
        }),
        supabase
          .from('math_questions')
          .select('test_id, question_number, instruction, column_a, column_b'),
        supabase
          .from('math_test_questions')
          .select('test_id, question_number, instruction, options')
          .eq('question_type', 'mcq'),
      ]);

      if (practicePoolError) throw practicePoolError;

      console.log('[TOPIC_LOAD_DEBUG]', {
        topic_requested: focusedTopic ?? null,
        topic_requested_ru: focusRu,
        rows_returned: practiceRows?.length || 0,
        error: null,
      });

      type Bank = { qid: string; topic: string; q: PracticeQuestion };

      const norm = (s: any) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      const testFingerprints = new Set<string>();
      for (const r of testCompRows || []) {
        testFingerprints.add(`comp|${norm(r.instruction)}|${norm(r.column_a)}|${norm(r.column_b)}`);
      }
      for (const r of testMcqRows || []) {
        const opts = (r.options as any) || {};
        const optBlob = ['A', 'B', 'C', 'D', 'E']
          .map(k => norm(opts[k] ?? opts[k.toLowerCase()]))
          .join('|');
        testFingerprints.add(`mcq|${norm(r.instruction)}|${optBlob}`);
      }

      const rawBank: Bank[] = [];
      let duplicateCount = 0;

      for (const r of practiceRows || []) {
        const qid = `pq_${r.id}`;
        const data = (r.question_data as any) || {};
        const qtype = (r.question_type || data.type || '').toString().toLowerCase();
        const ans = (r.correct_answer || data.correct_answer || 'A').toString().trim().toUpperCase();

        let fingerprint = '';
        if (qtype === 'comparison') {
          fingerprint = `comp|${norm(data.instruction)}|${norm(data.column_a)}|${norm(data.column_b)}`;
        } else if (qtype === 'mcq') {
          const opts = data.options || {};
          const optBlob = ['A', 'B', 'C', 'D', 'E']
            .map(k => norm(opts[k] ?? opts[k.toLowerCase()]))
            .join('|');
          fingerprint = `mcq|${norm(data.instruction)}|${optBlob}`;
        }

        if (fingerprint && testFingerprints.has(fingerprint)) {
          duplicateCount++;
          console.warn(`[DUPLICATE_TEST_QUESTION] practice_questions.id=${r.id} matches a test question — excluded.`);
          continue;
        }

        if (qtype === 'comparison') {
          rawBank.push({
            qid,
            topic: r.topic || data.topic || '',
            q: {
              type: 'comparison',
              id: r.id as any,
              question_number: 0,
              topic: r.topic || data.topic || '',
              instruction: data.instruction ?? null,
              column_a: data.column_a ?? '',
              column_b: data.column_b ?? '',
              option_c: null,
              option_d: null,
              correct_answer: ans,
              correct_explanation: (r as any).correct_explanation ?? null,
              explanation_a: (r as any).explanation_a ?? null,
              explanation_b: (r as any).explanation_b ?? null,
              explanation_c: (r as any).explanation_c ?? null,
              explanation_d: (r as any).explanation_d ?? null,
              explanation_e: (r as any).explanation_e ?? null,
            } as ComparisonPractice,
          });
        } else if (qtype === 'mcq') {
          rawBank.push({
            qid,
            topic: r.topic || data.topic || '',
            q: {
              type: 'mcq',
              id: r.id as any,
              question_number: 0,
              topic: r.topic || data.topic || '',
              instruction: data.instruction || '',
              options: data.options || {},
              correct_answer: ans,
              correct_explanation: (r as any).correct_explanation ?? null,
              explanation_a: (r as any).explanation_a ?? null,
              explanation_b: (r as any).explanation_b ?? null,
              explanation_c: (r as any).explanation_c ?? null,
              explanation_d: (r as any).explanation_d ?? null,
              explanation_e: (r as any).explanation_e ?? null,
            } as McqPractice,
          });
        }
      }

      const HAS_NUMBER = /\d/;
      const FIGURE_REF = /(рисун|рис\.|фигур|диаграмм|график|чертеж|figure|diagram|see\s+the)/i;
      const VAR_ONLY = /^[\s,;:.\-+*/=()a-zA-Zа-яА-Я]+$/;
      const reasons: Record<string, number> = {};
      const bump = (k: string) => { reasons[k] = (reasons[k] || 0) + 1; };

      const isQualityOk = (b: Bank): boolean => {
        const q = b.q;
        const ans = (q.correct_answer || '').trim().toUpperCase();

        if (q.type === 'comparison') {
          const a = (q.column_a || '').trim();
          const bcol = (q.column_b || '').trim();
          if (!a || !bcol) { bump('comp_missing_columns'); return false; }
          if (!['A', 'B', 'C', 'D'].includes(ans)) { bump('comp_bad_answer'); return false; }
          const blob = `${q.instruction || ''} ${a} ${bcol}`;
          if (FIGURE_REF.test(blob) && !HAS_NUMBER.test(blob)) { bump('figure_no_data'); return false; }
          if (!HAS_NUMBER.test(a) && !HAS_NUMBER.test(bcol) && VAR_ONLY.test(a) && VAR_ONLY.test(bcol)) {
            bump('vars_only');
            return false;
          }
          return true;
        }

        const opts = q.options || {};
        const keys = Object.keys(opts).map(k => k.trim().toUpperCase());
        const need = ['A', 'B', 'C', 'D', 'E'];
        const hasAll5 = need.every(k => keys.includes(k) && String((opts as any)[k] ?? (opts as any)[k.toLowerCase()] ?? '').trim() !== '');
        if (!hasAll5) { bump('mcq_not_5_options'); return false; }
        if (!need.includes(ans)) { bump('mcq_bad_answer'); return false; }
        const instr = (q.instruction || '').trim();
        if (!instr) { bump('mcq_empty_instruction'); return false; }
        if (FIGURE_REF.test(instr) && !HAS_NUMBER.test(instr)) { bump('figure_no_data'); return false; }
        if (!HAS_NUMBER.test(instr) && VAR_ONLY.test(instr)) { bump('vars_only'); return false; }
        return true;
      };

      const bankAll = rawBank.filter(isQualityOk);

      // === DIFFICULTY: data-driven first, text heuristic as fallback ===
      // Pull global accuracy per question_id from practice_responses (across all users).
      // difficulty_score = correct / total
      //   easy   > 0.7
      //   medium 0.4–0.7
      //   hard   < 0.4
      // Requires n >= 5 attempts; otherwise fall back to text heuristic.
      const qidsForStats = bankAll.map(b => b.qid).filter(Boolean);
      const statsByQid = new Map<string, { total: number; correct: number }>();
      if (qidsForStats.length > 0) {
        const { data: statsRows } = await supabase
          .from('practice_responses')
          .select('question_id, is_correct')
          .in('question_id', qidsForStats);
        for (const r of (statsRows || [])) {
          if (!r.question_id) continue;
          const cur = statsByQid.get(r.question_id) || { total: 0, correct: 0 };
          cur.total += 1;
          if (r.is_correct) cur.correct += 1;
          statsByQid.set(r.question_id, cur);
        }
      }

      const classifyByText = (b: Bank): 'easy' | 'medium' | 'hard' => {
        const q = b.q;
        const text = (q.type === 'comparison'
          ? `${q.instruction || ''} ${(q as ComparisonPractice).column_a} ${(q as ComparisonPractice).column_b}`
          : `${q.instruction || ''} ${Object.values((q as McqPractice).options || {}).join(' ')}`
        ).trim();
        const len = text.length;
        const hasVars = /[a-zA-Zа-яА-Я]\s*[=≠<>≤≥]/.test(text);
        const hasMultiStep = /(если|тогда|найдите|сколько|при каком|на сколько)/i.test(text);
        const hasFigure = /(рисун|рис\.|фигур|диаграмм|график)/i.test(text);
        if (len < 60 && !hasVars && !hasMultiStep && !hasFigure) return 'easy';
        if (len > 180 || hasFigure || (hasVars && hasMultiStep)) return 'hard';
        return 'medium';
      };

      const classifyDifficulty = (b: Bank): 'easy' | 'medium' | 'hard' => {
        const s = statsByQid.get(b.qid);
        if (s && s.total >= 5) {
          const score = s.correct / s.total;
          const level: 'easy' | 'medium' | 'hard' =
            score > 0.7 ? 'easy' : score < 0.4 ? 'hard' : 'medium';
          console.log('[DIFFICULTY_DATA]', { qid: b.qid, n: s.total, score: score.toFixed(2), level });
          return level;
        }
        return classifyByText(b);
      };

      const bank = difficultyParam === 'all'
        ? bankAll
        : bankAll.filter(b => classifyDifficulty(b) === difficultyParam);
      console.log('[DIFFICULTY_FILTER]', {
        selected: difficultyParam,
        before: bankAll.length,
        after: bank.length,
        with_stats: Array.from(statsByQid.values()).filter(s => s.total >= 5).length,
      });

      const bankByQid = new Map(bank.map(b => [b.qid, b]));
      const poolByTopic = Array.from(bank.reduce((map, item) => {
        const key = normalizePracticeTopic(item.topic || '<empty>');
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map<string, number>()).entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);

      console.log(`[PRACTICE_SOURCE] practice_questions=${practiceRows?.length || 0}, test_excluded=${duplicateCount}, test_bank_size=${testFingerprints.size}`);
      console.log('[POOL_DEBUG]', {
        topic: focusRu ?? 'ALL',
        total_in_db: practiceRows?.length || 0,
        after_quality_filter: rawBank.length,
        after_all_filters: bank.length,
        per_topic: poolByTopic,
      });
      console.log('[PRACTICE_FILTER] exclusion reasons:', reasons);

      if (!forceNew && latestSess) {
        const { data: sessQs } = await supabase
          .from('practice_session_questions')
          .select('question_id, order_index')
          .eq('session_id', latestSess.id)
          .order('order_index', { ascending: true });

        const orderedQids = (sessQs || []).map(sq => sq.question_id).filter(Boolean);
        const uniqueOrderedQids = Array.from(new Set(orderedQids));
        const hasTestQids = orderedQids.some(qid => typeof qid === 'string' && (qid.startsWith('mq_') || qid.startsWith('mtq_')));
        const hasRepeatedSessionQids = uniqueOrderedQids.length !== orderedQids.length;
        const restored = uniqueOrderedQids
          .map(qid => bankByQid.get(qid))
          .filter(Boolean)
          .map(b => ({ ...b!.q, _qid: b!.qid } as any as PracticeQuestion));
        const mismatchedFocusedTopic = !!focusRu && restored.some(q => normalizePracticeTopic(q.topic) !== focusRu);

        if (hasTestQids || hasRepeatedSessionQids || mismatchedFocusedTopic || (orderedQids.length > 0 && restored.length === 0)) {
          console.warn('[SESSION_INVALIDATED]', {
            session_id: latestSess.id,
            hasTestQids,
            hasRepeatedSessionQids,
            mismatchedFocusedTopic,
            restoredCount: restored.length,
          });
          if (latestSess.status === 'active') {
            await supabase
              .from('practice_sessions')
              .update({ status: 'completed', ended_at: new Date().toISOString() })
              .eq('id', latestSess.id);
          }
        } else if (restored.length > 0) {
          setSessionId(latestSess.id);
          setQuestions(restored);
          const wt = Array.isArray(latestSess.weak_topics) ? (latestSess.weak_topics as string[]) : [];
          setWeakTopics(wt);
          setLatestTestName(focusRu ? `Практика: ${focusRu}` : (isAI ? 'Персональная практика' : 'Общая практика ОРТ'));
          setLatestTestType(restored[0].type);

          const { data: priorResp } = await supabase
            .from('practice_responses')
            .select('question_id, user_answer')
            .eq('session_id', latestSess.id);

          const restoredAnswers: Record<string, string> = {};
          const qidToKey = new Map(restored.map(q => [(q as any)._qid as string, `${q.type}_${q.id}`]));
          for (const r of priorResp || []) {
            if (!r.question_id || !r.user_answer) continue;
            const k = qidToKey.get(r.question_id);
            if (k) restoredAnswers[k] = r.user_answer;
          }
          setAnswers(restoredAnswers);

          if (latestSess.status === 'completed') {
            setCurrentIndex(restored.length - 1);
            setShowResults(true);
          } else {
            const firstUnanswered = restored.findIndex(q => !restoredAnswers[`${q.type}_${q.id}`]);
            setCurrentIndex(firstUnanswered === -1 ? restored.length - 1 : firstUnanswered);
          }

          console.log('[SELECTION_DEBUG]', {
            session_id: latestSess.id,
            requested_count: requestedCount,
            actual_selected: restored.length,
            unique_question_ids: uniqueOrderedQids,
            restored: true,
          });
          setLoading(false);
          return;
        }
      } else if (forceNew) {
        await supabase
          .from('practice_sessions')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('status', 'active');
      }

      let weak: string[] = [];
      if (isAI) {
        if (latestAttempt) {
          const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
          if (matchedConfig) {
            setLatestTestName(matchedConfig[1].name);
            setLatestTestType(matchedConfig[1]?.questionType || 'comparison');
          }
        }

        const plan = buildDeterministicPlan([
          ...(attempts || []),
          ...((priorPractice || []).map((row: any) => ({ topic: row.topic, is_correct: row.is_correct })) || []),
        ]);
        weak = plan.weakTopics.map(topic => topic.topic);
        setWeakTopics(weak);
        console.log('[WEAK_TOPICS_DEBUG]', {
          weak_topics: plan.weakTopics,
          medium_topics: plan.mediumTopics,
          strong_topics: plan.strongTopics,
        });
      } else {
        setLatestTestName('Общая практика ОРТ');
        setLatestTestType('comparison');
      }

      const uniqueByQid = (items: Bank[]) => Array.from(new Map(items.map(item => [item.qid, item])).values());
      const pickBalancedByTopic = (pool: Bank[], count: number) => {
        const uniquePool = uniqueByQid(pool);
        const grouped = new Map<string, Bank[]>();
        for (const item of uniquePool) {
          const key = normalizePracticeTopic(item.topic || '<empty>');
          const bucket = grouped.get(key) || [];
          bucket.push(item);
          grouped.set(key, bucket);
        }

        const selected: Bank[] = [];
        const topicKeys = Array.from(grouped.keys());
        while (selected.length < count) {
          let progressed = false;
          for (const key of topicKeys) {
            const bucket = grouped.get(key) || [];
            const next = bucket.shift();
            if (!next) continue;
            selected.push(next);
            progressed = true;
            if (selected.length >= count) break;
          }
          if (!progressed) break;
        }
        return selected;
      };

      let chosen: Bank[] = [];
      let selectionDebug: any = {};

      if (focusedTopic) {
        // 3-TIER SELECTION for a focused topic — always returns up to requestedCount.
        // Tier 1 (NEW)        — questions never answered in this topic
        // Tier 2 (INCORRECT)  — previously wrong answers in this topic (oldest mistakes first)
        // Tier 3 (REVIEW)     — any topic question, excluding the very last 5
        // Final pad           — if topic has zero pool, pad from other topics (NEW first)
        const topicBank = uniqueByQid(bank.filter(b => normalizePracticeTopic(b.topic) === focusRu));

        const tier1New = topicBank.filter(b => !answeredQids.has(b.qid));
        // shuffle tier1 for variety
        for (let i = tier1New.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tier1New[i], tier1New[j]] = [tier1New[j], tier1New[i]];
        }
        chosen.push(...tier1New.slice(0, requestedCount));

        let tier2Count = 0;
        let tier3Count = 0;
        let crossTopicPad = 0;

        if (chosen.length < requestedCount) {
          // Tier 2: incorrect ones — sort oldest mistake first.
          // priorPractice is DESC by created_at, so reverse to get oldest first among answered set.
          const orderedIncorrectQids = (priorPractice || [])
            .slice()
            .reverse()
            .map((p: any) => p.question_id || p.question_data?.question_id)
            .filter((qid: any): qid is string => typeof qid === 'string' && incorrectQids.has(qid));
          const seenInTier2 = new Set<string>();
          const tier2: Bank[] = [];
          for (const qid of orderedIncorrectQids) {
            if (seenInTier2.has(qid)) continue;
            seenInTier2.add(qid);
            const b = topicBank.find(x => x.qid === qid);
            if (b && !chosen.some(c => c.qid === b.qid)) tier2.push(b);
          }
          const need2 = requestedCount - chosen.length;
          chosen.push(...tier2.slice(0, need2));
          tier2Count = Math.min(tier2.length, need2);
        }

        if (chosen.length < requestedCount) {
          // Tier 3: any from topic, excluding the very recent 5 + already-chosen
          const chosenIds = new Set(chosen.map(b => b.qid));
          const tier3Pool = topicBank.filter(b => !chosenIds.has(b.qid) && !veryRecentQids.has(b.qid));
          for (let i = tier3Pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tier3Pool[i], tier3Pool[j]] = [tier3Pool[j], tier3Pool[i]];
          }
          const need3 = requestedCount - chosen.length;
          chosen.push(...tier3Pool.slice(0, need3));
          tier3Count = Math.min(tier3Pool.length, need3);
        }

        if (chosen.length < requestedCount) {
          // Cross-topic pad — only used if the requested topic genuinely has no/insufficient bank.
          // This guarantees the user always gets a full session of `requestedCount` questions.
          const chosenIds = new Set(chosen.map(b => b.qid));
          const otherPool = bank.filter(b => !chosenIds.has(b.qid) && normalizePracticeTopic(b.topic) !== focusRu);
          // prefer NEW (unanswered) cross-topic questions
          const otherNew = otherPool.filter(b => !answeredQids.has(b.qid));
          const otherRest = otherPool.filter(b => answeredQids.has(b.qid));
          const padPool = pickBalancedByTopic([...otherNew, ...otherRest], requestedCount - chosen.length);
          chosen.push(...padPool);
          crossTopicPad = padPool.length;
        }

        chosen = uniqueByQid(chosen).slice(0, requestedCount);
        selectionDebug = {
          tier: 'focused-topic',
          topic: focusRu,
          topic_pool_size: topicBank.length,
          new_count: Math.min(tier1New.length, requestedCount),
          incorrect_count: tier2Count,
          fallback_count: tier3Count,
          cross_topic_pad: crossTopicPad,
          final_count: chosen.length,
        };

        setLatestTestName(`Практика: ${focusRu}`);
      } else if (isControl) {
        chosen = pickBalancedByTopic(bank, requestedCount);
        selectionDebug = { tier: 'control', final_count: chosen.length };
      } else {
        // STAGE 3: deterministic plan + selection (NO AI).
        // Replaces previous weak/other split. Strict repeat-prevention is enforced inside.
        const answeredQidSet = new Set(Array.from(answeredQids));
        const sel = await selectPracticeQuestions({
          userId: user.id,
          bank,
          answeredQids: answeredQidSet,
        });
        chosen = sel.selected;
        // Keep weakTopics in sync with what the deterministic planner produced.
        weak = sel.plan.weakTopics;
        setWeakTopics(weak);
        selectionDebug = {
          tier: 'deterministic-stage3',
          weak_topics: sel.plan.weakTopics,
          strong_topics: sel.plan.strongTopics,
          insufficient_data: sel.plan.insufficientData,
          sources: sel.sources,
          final_count: chosen.length,
        };
      }

      chosen = uniqueByQid(chosen);

      console.log('[PRACTICE_SELECTION]', selectionDebug);
      console.log('[SELECTION_DEBUG]', {
        requested_count: requestedCount,
        actual_selected: chosen.length,
        unique_question_ids: chosen.map(b => b.qid),
        topics: chosen.map(b => normalizePracticeTopic(b.topic)),
      });

      if (chosen.length === 0) {
        // Truly no questions anywhere — only happens if the entire DB pool is empty.
        // Show a soft empty-state instead of an error screen.
        console.warn('[PRACTICE_SELECTION] empty bank — DB pool exhausted');
        setQuestions([]);
        setLoading(false);
        return;
      }

      const finalQuestions: PracticeQuestion[] = chosen.map(b => ({ ...b.q, _qid: b.qid } as any));

      const { data: sessionData } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          participant_id: pid,
          group_type: group,
          practice_type: focusedTopic ? 'topic_focus' : (isAI ? 'personalized' : 'general'),
          weak_topics: isAI ? weak : [],
          data_version: 'v2',
          is_reliable: !!pid,
          status: 'active',
        })
        .select('id')
        .single();

      if (sessionData) {
        setSessionId(sessionData.id);
        // Motivation: daily check-in fires once on session start (idempotent per day).
        void motivation.checkIn();
        const sessQRows = chosen.map((b, idx) => ({
          session_id: sessionData.id,
          question_id: b.qid,
          order_index: idx,
        }));
        if (sessQRows.length > 0) {
          const { error: sqErr } = await supabase
            .from('practice_session_questions')
            .insert(sessQRows);
          if (sqErr) console.error('[PRACTICE_SESSION] Failed to save session questions:', sqErr);
        }
        console.log(`[PRACTICE_SESSION] created session_id=${sessionData.id} questions=${chosen.length} group=${group}`);
      }

      setQuestions(finalQuestions);
      console.log(`[PRACTICE_LOAD] loaded_questions_count=${finalQuestions.length}`);
      console.log('[SCOPE_LOCKED] practice runtime: no AI generation, no runtime personalization beyond pre-built session.');

      // ENGAGEMENT: snapshot pre-session accuracy per topic so the result screen
      // can render «Было X% → стало Y%». Stored in sessionStorage (per-tab, per-topic).
      try {
        const topics = Array.from(
          new Set(finalQuestions.map((q) => normalizeAnalyticsTopic(q.topic || '')).filter(Boolean)),
        );
        await Promise.all(
          topics.map(async (t) => {
            const key = `pre_acc:${t}`;
            // Don't overwrite an existing snapshot (we want true "before" of this session).
            if (sessionStorage.getItem(key) !== null) return;
            const row = await getMasteryForTopic(user.id, t);
            const pct = row ? Math.round((row.accuracy ?? 0) * 100) : 0;
            sessionStorage.setItem(key, String(pct));
          }),
        );
      } catch (e) {
        console.warn('[ENGAGEMENT_SNAPSHOT] failed', e);
      }
    } catch (err) {
      console.error('[PRACTICE_FRONTEND] Practice load error:', err);
      console.log('[TOPIC_LOAD_DEBUG]', {
        topic_requested: focusedTopic ?? null,
        rows_returned: 0,
        error: err instanceof Error ? err.message : String(err),
      });
      setGenerationError('Ошибка загрузки практики');
    } finally {
      setLoading(false);
    }
  }, [user, group, groupLoading, isAI, isControl, focusedTopic, reviewMode, setSearchParams, difficultyParam]);

  useEffect(() => {
    // PRACTICE NEVER RESETS:
    // - resume any active session (questions are immutable until completion)
    // - only force a brand-new session on explicit ?new=1 (the "Новая практика"
    //   button) or when entering review mode (mistake-only loop)
    // Switching topics or revisiting the page must NOT regenerate questions.
    const forceNew = searchParams.get('new') === '1' || reviewMode;
    if (user && !groupLoading) {
      void loadPractice(forceNew).then(() => {
        if (forceNew && searchParams.get('new') === '1') {
          const next = new URLSearchParams(searchParams);
          next.delete('new');
          setSearchParams(next, { replace: true });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupLoading, focusedTopic, reviewMode]);

  // Reset per-question timer whenever the visible question changes
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIndex, questions.length]);

  const qKey = (q: PracticeQuestion) => `${q.type}_${q.id}`;

  // Immediately persist a single answer to practice_responses (upsert by session+question)
  const persistAnswer = useCallback(async (q: PracticeQuestion, latinKey: string, index: number) => {
    if (!user || !sessionId) return;
    const qid = (q as any)._qid as string | undefined;
    if (!qid) return;
    const normUser = normalizeAnswer(latinKey);
    const normCorrect = normalizeAnswer(q.correct_answer);
    const isCorrect = compareAnswers(latinKey, q.correct_answer);
    const respReliable = !!(participantId && normUser);

    // Strict diagnostic — never hide a comparison from the developer console.
    console.log('[ANSWER_DEBUG]', {
      question_id: qid,
      user_answer: latinKey,
      correct_answer: q.correct_answer,
      normalized_user: normUser,
      normalized_correct: normCorrect,
      result: isCorrect,
    });

    const timeSpentSeconds = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
    const row = {
      session_id: sessionId,
      user_id: user.id,
      participant_id: participantId,
      question_index: index,
      topic: q.topic,
      difficulty: null as string | null,
      question_id: qid,
      question_data: q.type === 'comparison'
        ? { question_id: qid, instruction: (q as ComparisonPractice).instruction, column_a: (q as ComparisonPractice).column_a, column_b: (q as ComparisonPractice).column_b }
        : { question_id: qid, instruction: (q as McqPractice).instruction, options: (q as McqPractice).options },
      user_answer: normUser,
      correct_answer: normCorrect,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
      data_version: 'v2',
      is_reliable: respReliable,
    };

    const { error } = await supabase
      .from('practice_responses' as any)
      .upsert(row, { onConflict: 'session_id,question_id' });
    if (error) console.error('[PRACTICE_SESSION] save answer failed', error);
    else console.log(`[TRACKING_ENABLED] is_correct=${isCorrect} time_spent_s=${timeSpentSeconds} topic="${q.topic}" session=${sessionId}`);

    // Spaced repetition / per-question learning state update (deterministic, NO AI).
    // Pass topic so we can attach linked_lesson_id for the recovery flow.
    try {
      await updateSpacedRepetition({
        userId: user.id,
        questionId: qid,
        isCorrect,
        topic: q.topic ?? null,
      });
    } catch (e) {
      console.error('[SPACED_HOOK] failed', e);
    }

    // Per-topic stats update (deterministic, NO AI)
    try {
      await updateTopicStats({ userId: user.id, topic: q.topic, isCorrect });
    } catch (e) {
      console.error('[TOPIC_STATS_HOOK] failed', e);
    }

    // MASTERY MODE — record attempt + maintain mistake queue (deterministic, NO AI)
    try {
      await recordMasteryAttempt({
        userId: user.id,
        topic: q.topic,
        questionId: qid,
        isCorrect,
      });
    } catch (e) {
      console.error('[MASTERY_HOOK] failed', e);
    }

    // PREMATURE-FEEDBACK FIX: do NOT reveal correctness during the session.
    // Per-answer toasts (✓ / ✗) used to leak the answer state, which both
    // (a) let users brute-force by re-clicking and (b) created "spam errors".
    // We now stay silent until the final results screen.
    // (Mastery progression toast for closed topics is still useful, but only
    // when the topic is fully mastered — never per-answer correctness.)
    try {
      if (isCorrect) {
        const normTopic = normalizeAnalyticsTopic(q.topic || '');
        const row = normTopic ? await getMasteryForTopic(user.id, normTopic) : null;
        if (row && row.status === 'mastered') {
          toast.success(`🎯 Тема «${row.topic}» закрыта!`);
        }
      }
    } catch (e) {
      console.warn('[MICRO_FEEDBACK] failed', e);
    }

    // Motivation: count this answer toward the daily goal (also performs
    // daily-reset + streak update if it's the first action of the day).
    try {
      await motivation.recordTask();
    } catch (e) {
      console.error('[MOTIVATION_HOOK] failed', e);
    }

    // Unified Learning State refresh — recompute next_action / weak topics / progress.
    try {
      // MASTERY LOOP: advance phase machine BEFORE generic recompute.
      let masteryResult: Awaited<ReturnType<typeof advanceMasteryAfterAnswer>> = null;
      if (masteryMode && q.topic) {
        masteryResult = await advanceMasteryAfterAnswer({
          userId: user.id,
          topic: normalizeAnalyticsTopic(q.topic) || q.topic,
          isCorrect,
          isValidation: isValidationMode,
        });
      }
      const newState = await updateLearningState(user.id);
      if (newState) setLearningState(newState);

      // React to phase transition: route user to the new step.
      if (masteryMode && masteryResult?.changed && masteryResult.old_phase !== masteryResult.new_phase) {
        const np = masteryResult.new_phase;
        const nt = masteryResult.new_topic;
        if (np === 'lesson') {
          toast('Возврат к уроку — закрепим основу', { icon: '📘' });
          const slug = nt ? topicToLessonSlug(nt) : null;
          setTimeout(() => navigate(slug ? `/lessons/topic/${encodeURIComponent(slug)}` : '/lessons'), 900);
        } else if (np === 'validation') {
          toast.success('2 верно подряд — переходим к проверке темы');
          setTimeout(() => navigate(`/practice?topic=${encodeURIComponent(nt || q.topic)}&mode=validation`), 900);
        } else if (np === 'idle') {
          toast.success('Тема улучшена! Переходим к следующей.');
          setTimeout(() => navigate('/next-step'), 900);
        }
      }
    } catch (e) {
      console.error('[LEARNING_STATE_HOOK] failed', e);
    }
  }, [user, sessionId, participantId, motivation, masteryMode, isValidationMode, navigate]);

  // Load latest learning state once on mount so the results screen has it ready.
  useEffect(() => {
    if (!user) return;
    void getLearningState(user.id).then(s => s && setLearningState(s));
  }, [user]);

  const handleAnswer = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    // LOCK: an answer is fixed exactly once. No re-selection, no second attempts.
    if (answers[qKey(q)]) {
      console.log('[ANSWER_LOCK] ignoring re-click — answer already fixed', { qid: qKey(q) });
      return;
    }
    setAnswers(prev => ({ ...prev, [qKey(q)]: latinKey }));
    void persistAnswer(q, latinKey, currentIndex);
    // Reset timer for next question
    questionStartRef.current = Date.now();
  };

  // Legacy helper kept only for compatibility with old UI branches.
  // Runtime is DB-only; QuestionReview reads explanations directly from question rows.
  const loadMistakeExplanation = async (q: PracticeQuestion, userAnswer: string | null) => {
    const key = qKey(q);
    const questionId = `${q.type}_${q.id}`;
    const isWrong = !!userAnswer && !compareAnswers(userAnswer, q.correct_answer);

    // Toggle if already loaded
    const existing = mistakeExplanations[key];
    if (existing && !existing.loadingStatic && !existing.loadingHint) {
      setExpandedMistake(expandedMistake === key ? null : key);
      return;
    }

    setExpandedMistake(key);
    setMistakeExplanations(prev => ({
      ...prev,
      [key]: {
        staticSolution: '',
        mistakeHint: '',
        loadingStatic: true,
        loadingHint: isWrong,
      },
    }));

    // STEP 1 — static explanation from DB (no AI)
    let staticSolution = '';
    try {
      const { data: staticRow } = await supabase
        .from('question_explanations')
        .select('explanation_text')
        .eq('question_id', questionId)
        .maybeSingle();
      staticSolution = staticRow?.explanation_text
        || `Правильный ответ: ${toCyrillicKey(q.correct_answer)}. Подробное решение для этой задачи скоро появится.`;
    } catch {
      staticSolution = `Правильный ответ: ${toCyrillicKey(q.correct_answer)}.`;
    }

    setMistakeExplanations(prev => ({
      ...prev,
      [key]: {
        staticSolution,
        mistakeHint: '',
        loadingStatic: false,
        loadingHint: isWrong,
      },
    }));

    if (!isWrong) return;

    // AI HARD-DISABLED in practice. No AI generation, validation, or explanations.
    // Only the static DB solution (loaded above from question_explanations) is shown.
    console.error('[PRACTICE_AI_BLOCKED] AI mistake hint disabled — DB-only practice mode.');
    setMistakeExplanations(prev => ({
      ...prev,
      [key]: {
        staticSolution,
        mistakeHint: '',
        loadingStatic: false,
        loadingHint: false,
      },
    }));
  };

  // Per-answer rows are saved immediately by persistAnswer().
  // On submit we only finalize the session (status = completed + summary stats).
  // We additionally upsert any answers that may have been changed in-memory but failed to persist (best-effort).
  const savePracticeResults = useCallback(async () => {
    if (!user || !sessionId) return;
    try {
      let correctCount = 0;
      const fallbackRows: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAns = answers[qKey(q)] ?? null;
        const normUser = normalizeAnswer(userAns);
        const isCorrect = compareAnswers(userAns, q.correct_answer);
        if (isCorrect) correctCount++;
        if (!normUser) continue;
        // Best-effort upsert in case persistAnswer failed earlier
        fallbackRows.push({
          session_id: sessionId,
          user_id: user.id,
          participant_id: participantId,
          question_index: i,
          topic: q.topic,
          difficulty: null,
          question_id: (q as any)._qid,
          question_data: q.type === 'comparison'
            ? { question_id: (q as any)._qid, instruction: (q as ComparisonPractice).instruction, column_a: (q as ComparisonPractice).column_a, column_b: (q as ComparisonPractice).column_b }
            : { question_id: (q as any)._qid, instruction: (q as McqPractice).instruction, options: (q as McqPractice).options },
          user_answer: normUser,
          correct_answer: normalizeAnswer(q.correct_answer),
          is_correct: isCorrect,
          data_version: 'v2',
          is_reliable: !!(participantId && normUser),
        });
      }

      if (fallbackRows.length > 0) {
        const { error: respError } = await supabase
          .from('practice_responses' as any)
          .upsert(fallbackRows, { onConflict: 'session_id,question_id' });
        if (respError) console.error('[PRACTICE_SESSION] final upsert failed:', respError);
      }

      // Canonical score: ALWAYS recount from DB (never trust frontend state).
      const { count: dbCorrect } = await supabase
        .from('practice_responses')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_correct', true);
      const finalCorrect = typeof dbCorrect === 'number' ? dbCorrect : correctCount;

      const totalTime = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const { error: sessErr } = await supabase
        .from('practice_sessions' as any)
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          total_time_seconds: totalTime,
          num_tasks: questions.length,
          num_correct: finalCorrect,
        })
        .eq('id', sessionId)
        .neq('status', 'completed'); // never overwrite an already-completed session
      if (sessErr) console.error('[PRACTICE_SESSION] complete failed:', sessErr);
      else {
        const accuracy = questions.length > 0 ? finalCorrect / questions.length : 0;
        console.log(`[PRACTICE_RESULTS] saved session_id=${sessionId} db_correct=${finalCorrect}/${questions.length}`);
        console.log('[SESSION_COMPLETED]', {
          user_id: user.id,
          session_id: sessionId,
          num_tasks: questions.length,
          num_correct: finalCorrect,
          accuracy,
        });
      }
    } catch (err) {
      console.error('[PRACTICE_SESSION] Failed to finalize:', err);
    }
    // PLAN PROGRESS: tell any open LearningPlan tab to refresh.
    try {
      localStorage.setItem('plan:invalidate', String(Date.now()));
      window.dispatchEvent(new Event('plan:invalidate'));
    } catch { /* ignore */ }
  }, [user, questions, answers, sessionId, participantId]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading || groupLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Генерация практических заданий...</p>
        </div>
      </Layout>
    );
  }

  if (generationError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-warning mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ошибка генерации</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{generationError}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => loadPractice(false)} variant="accent">
              <RefreshCw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Button>
            <Button onClick={() => navigate('/tests')} variant="outline">
              <Target className="mr-2 h-4 w-4" />
              К тестам
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Target className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Нет заданий для практики</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {isAI && weakTopics.length === 0
              ? 'Сначала пройдите тест, чтобы система определила слабые темы.'
              : isControl
              ? 'Сначала пройдите хотя бы один тест.'
              : 'Не найдено вопросов по вашим слабым темам.'}
          </p>
          <Button onClick={() => navigate('/tests')}>
            <Target className="mr-2 h-4 w-4" />
            Перейти к тестам
          </Button>
        </div>
      </Layout>
    );
  }

  // Results screen
  if (showResults) {
    let correctCount = 0;
    const allResults: { q: PracticeQuestion; userAnswer: string | null; isCorrect: boolean }[] = [];

    for (const q of questions) {
      const userAns = answers[qKey(q)] || null;
      const correct = compareAnswers(userAns, q.correct_answer);
      if (correct) correctCount++;
      allResults.push({ q, userAnswer: userAns, isCorrect: correct });
    }

    const mistakes = allResults.filter(r => !r.isCorrect && r.userAnswer);
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const incorrectCount = questions.length - correctCount;
    console.log('[RESULT_RENDER]', {
      user_id: user?.id,
      session_id: sessionId,
      questions_count: questions.length,
      correct: correctCount,
      incorrect: incorrectCount,
      accuracy_pct: percentage,
    });

    // Build mistake items for the new MistakesBlock (linked_lesson_id resolved client-side from learningState topic mapping is not needed — MistakesBlock falls back to /lessons?topic=...).
    const mistakeItems: MistakeItem[] = mistakes.map(({ q, userAnswer }) => ({
      questionId: (q as any)._qid || `${q.type}_${q.id}`,
      topic: q.topic ?? null,
      type: q.type,
      instruction: q.instruction ?? null,
      columnA: q.type === 'comparison' ? q.column_a : null,
      columnB: q.type === 'comparison' ? q.column_b : null,
      options: q.type === 'mcq' ? q.options : null,
      userAnswer,
      correctAnswer: q.correct_answer,
      linkedLessonId: null,
    }));

    // ENGAGEMENT: dominant topic of this session → progress delta block
    const topicCount: Record<string, number> = {};
    for (const r of allResults) {
      const t = normalizeAnalyticsTopic(r.q.topic || '');
      if (t) topicCount[t] = (topicCount[t] || 0) + 1;
    }
    const sessionTopic = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* ENGAGEMENT — «Было X% → стало Y%», прогресс к закрытию темы, "Добить тему" */}
          {isAI && user && sessionTopic && (
            <TopicProgressDelta
              userId={user.id}
              topic={sessionTopic}
              onContinue={() => {
                // Clear the snapshot so the next session captures a fresh "before".
                sessionStorage.removeItem(`pre_acc:${sessionTopic}`);
                setSearchParams({ topic: sessionTopic });
              }}
            />
          )}

          {/* === Header — AI group sees full Learning Loop; control sees plain score only === */}
          {isAI ? (
            <MistakesBlock
              mistakes={mistakeItems}
              totalQuestions={questions.length}
              correctCount={correctCount}
              state={learningState}
              onRepeatMistakes={() => {
                // Route to /practice?mode=review which loads only failed questions.
                setSearchParams({ mode: 'review' });
              }}
            />
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-5xl font-bold">{percentage}%</div>
                <p className="text-muted-foreground">
                  {correctCount} из {questions.length} правильно
                </p>
              </CardContent>
            </Card>
          )}

          {/* Secondary actions */}
          <div className="flex gap-3 justify-center mb-6 flex-wrap">
            <Button
              onClick={() => {
                // Explicit user intent → start a NEW session (only legal regeneration trigger).
                if (isAI && focusedTopic && weakTopics.length > 0) {
                  const normalizedFocused = normalizeAnalyticsTopic(focusedTopic);
                  const idx = weakTopics.findIndex(
                    t => normalizeAnalyticsTopic(t) === normalizedFocused,
                  );
                  const next = weakTopics[(idx + 1) % weakTopics.length];
                  if (next && normalizeAnalyticsTopic(next) !== normalizedFocused) {
                    setSearchParams({ topic: next, new: '1' });
                    return;
                  }
                }
                if (focusedTopic) {
                  setSearchParams({ new: '1' });
                  return;
                }
                setSearchParams({ new: '1' });
              }}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isAI && focusedTopic ? 'Следующая тема' : 'Новая практика'}
            </Button>
            <Button onClick={() => navigate('/tests')} variant="outline">
              К тестам
            </Button>
          </div>

          {/* AI-only: per-topic summary (reveals weak topics — hidden for control) */}
          {isAI && user && <TopicSummary userId={user.id} />}

          {/* Unified data-driven review (no AI) — uses QuestionReview component */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Все задания ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allResults.map(({ q, userAnswer, isCorrect }, idx) => (
                <div key={qKey(q)} id={`review-${(q as any)._qid || `${q.type}_${q.id}`}`}>
                  <QuestionReview
                    groupMode={isAI ? 'ai' : 'control'}
                    data={{
                      questionNumber: idx + 1,
                      topic: isAI ? q.topic : null,
                      type: q.type,
                      instruction: q.instruction ?? null,
                      column_a: q.type === 'comparison' ? q.column_a : null,
                      column_b: q.type === 'comparison' ? q.column_b : null,
                      options: q.type === 'mcq' ? q.options : null,
                      userAnswer,
                      correctAnswer: q.correct_answer,
                      isCorrect,
                      correctExplanation: q.correct_explanation ?? null,
                      explanationA: q.explanation_a ?? null,
                      explanationB: q.explanation_b ?? null,
                      explanationC: q.explanation_c ?? null,
                      explanationD: q.explanation_d ?? null,
                      explanationE: q.explanation_e ?? null,
                      questionCacheId: (q as any)._qid ?? null,
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Question view
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-accent" />
              Практика
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAI ? `AI-задания по слабым темам • ${latestTestName}` : `Общие задания ОРТ`}
            </p>
          </div>
          <Badge variant="accent">{answeredCount}/{questions.length}</Badge>
        </div>

        <Progress value={(answeredCount / questions.length) * 100} className="mb-4 h-2" />

        {/* Difficulty selector — switching restarts the session with the new filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Сложность:</span>
          {([
            { id: 'all', label: 'Все' },
            { id: 'easy', label: '🟢 Лёгкие' },
            { id: 'medium', label: '🟡 Средние' },
            { id: 'hard', label: '🔴 Сложные' },
          ] as const).map(opt => (
            <Button
              key={opt.id}
              size="sm"
              variant={difficultyParam === opt.id ? 'accent' : 'outline'}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (opt.id === 'all') next.delete('difficulty');
                else next.set('difficulty', opt.id);
                setSearchParams(next);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Motivation widget — AI group only (control gets no retention/streak signals) */}
        {isAI && !motivation.loading && (
          <MotivationWidget
            streak={motivation.streak}
            tasksCompletedToday={motivation.tasksCompletedToday}
            dailyGoal={motivation.dailyGoal}
            goalCompleted={motivation.goalCompleted}
            activeDaysLast7={motivation.activeDaysLast7}
            warningLevel={motivation.warningLevel}
            className="mb-6"
          />
        )}

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline">Вопрос {currentIndex + 1} из {questions.length}</Badge>
              {/* Control: don't show topic to avoid revealing weak areas */}
              {isAI && currentQ && (
                <Badge variant="secondary">{translateTopic(currentQ.topic, 'ru')}</Badge>
              )}
            </div>

            {currentQ?.type === 'comparison' ? (
              <>
                {currentQ.instruction ? (
                  <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
                    <MathRenderer content={currentQ.instruction} />
                  </div>
                ) : (
                  <p className="mb-5 text-base text-muted-foreground">
                    Сравните величины в столбцах A и B.
                  </p>
                )}

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец A</p>
                    <MathRenderer content={currentQ.column_a} className="text-xl font-bold" />
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец B</p>
                    <MathRenderer content={currentQ.column_b} className="text-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'A', label: 'Величина в столбце A больше' },
                    { key: 'B', label: 'Величина в столбце B больше' },
                    { key: 'C', label: 'Величины равны' },
                    { key: 'D', label: 'Недостаточно информации' },
                  ].map(opt => {
                    const fixed = !!answers[qKey(currentQ)];
                    const isSelected = answers[qKey(currentQ)] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleAnswer(opt.key)}
                        disabled={fixed}
                        aria-disabled={fixed}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-2 ring-accent'
                            : fixed
                            ? 'border-border opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-accent/50 hover:bg-muted/50'
                        }`}
                      >
                        <span className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${
                          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                        }`}>
                          {toCyrillicKey(opt.key)}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : currentQ?.type === 'mcq' ? (
              <>
                <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
                  <MathRenderer content={currentQ.instruction} />
                </div>

                <div className="space-y-3">
                  {Object.entries(currentQ.options).map(([key, value]) => {
                    const fixed = !!answers[qKey(currentQ)];
                    const isSelected = answers[qKey(currentQ)] === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        disabled={fixed}
                        aria-disabled={fixed}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-2 ring-accent'
                            : fixed
                            ? 'border-border opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-accent/50 hover:bg-muted/50'
                        }`}
                      >
                        <span className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${
                          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                        }`}>
                          {toCyrillicKey(key)}
                        </span>
                        <MathRenderer content={String(value)} inline />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="accent"
              onClick={async () => {
                console.log('[PRACTICE_RESULTS] saving before showing results screen');
                await savePracticeResults();
                console.log('[PRACTICE_RESULTS] saved — results now persistent');
                setShowResults(true);
              }}
              disabled={answeredCount === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Показать результаты
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Далее
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
