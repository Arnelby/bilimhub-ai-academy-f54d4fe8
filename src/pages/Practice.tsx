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
import { normalizeAnalyticsTopic, normalizePracticeTopic, translateTopic } from '@/lib/topicTranslations';
import { normalizeAnswer, compareAnswers } from '@/lib/answerNormalization';
import { QuestionReview } from '@/components/review/QuestionReview';

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
  const { user } = useAuth();
  const { isAI, isControl, group, loading: groupLoading } = useUserGroup();
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

    try {
      console.log(`[PRACTICE_FRONTEND] DB-driven practice for user: ${user.id}, group: ${group}, forceNew: ${forceNew}`);

      // participant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('participant_id')
        .eq('id', user.id)
        .maybeSingle();
      const pid = profile?.participant_id || null;
      setParticipantId(pid);

      // ============ 1. LOAD PRACTICE-ONLY BANK ============
      // STRICT RULE: Practice MUST NOT reuse test questions.
      // Source = practice_questions only. math_questions + math_test_questions are TEST tables
      // and are used solely to build an exclusion set (filter, not delete).
      const [{ data: practiceRows }, { data: testCompRows }, { data: testMcqRows }] = await Promise.all([
        supabase
          .from('practice_questions')
          .select('id, topic, question_type, correct_answer, question_data, quality_status, correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d, explanation_e')
          .not('correct_answer', 'is', null)
          // STRICT quality gate: ONLY 'keep' questions are served to students.
          // 'review' / 'unknown' / 'remove' are excluded — no exceptions.
          .in('quality_status', ['keep', 'approved']),
        supabase
          .from('math_questions')
          .select('test_id, question_number, instruction, column_a, column_b'),
        supabase
          .from('math_test_questions')
          .select('test_id, question_number, instruction, options')
          .eq('question_type', 'mcq'),
      ]);

      // Build exclusion fingerprints from TEST tables.
      // We can't compare by id (different schemas), so we fingerprint by content.
      const norm = (s: any) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      const testFingerprints = new Set<string>();
      const testIdSet = new Set<string>(); // synthetic test ids (mq_/mtq_) — legacy
      for (const r of testCompRows || []) {
        testIdSet.add(`mq_${r.test_id}_${r.question_number}`);
        testFingerprints.add(`comp|${norm(r.instruction)}|${norm(r.column_a)}|${norm(r.column_b)}`);
      }
      for (const r of testMcqRows || []) {
        testIdSet.add(`mtq_${r.test_id}_${r.question_number}`);
        const opts = (r.options as any) || {};
        const optBlob = ['A','B','C','D','E']
          .map(k => norm(opts[k] ?? opts[k.toLowerCase()]))
          .join('|');
        testFingerprints.add(`mcq|${norm(r.instruction)}|${optBlob}`);
      }

      type Bank = { qid: string; topic: string; q: PracticeQuestion };
      const rawBank: Bank[] = [];
      let duplicateCount = 0;

      for (const r of practiceRows || []) {
        const qid = `pq_${r.id}`;
        const data = (r.question_data as any) || {};
        const qtype = (r.question_type || data.type || '').toString().toLowerCase();
        const ans = (r.correct_answer || data.correct_answer || 'A').toString().trim().toUpperCase();

        // Build fingerprint to check against test bank.
        let fingerprint = '';
        if (qtype === 'comparison') {
          fingerprint = `comp|${norm(data.instruction)}|${norm(data.column_a)}|${norm(data.column_b)}`;
        } else if (qtype === 'mcq') {
          const opts = data.options || {};
          const optBlob = ['A','B','C','D','E']
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

      console.log(`[PRACTICE_SOURCE] practice_questions=${practiceRows?.length || 0}, test_excluded=${duplicateCount}, test_bank_size=${testFingerprints.size}`);

      // ============ 1a. SMART QUALITY FILTER + STRICT FORMAT LOCK ============
      // NOTE: filter only — never delete DB rows.
      const HAS_NUMBER = /\d/;
      const FIGURE_REF = /(рисун|рис\.|фигур|диаграмм|график|чертеж|figure|diagram|see\s+the)/i;
      const VAR_ONLY = /^[\s,;:.\-+*/=()a-zA-Zа-яА-Я]+$/; // no digits at all

      const reasons: Record<string, number> = {};
      const bump = (k: string) => { reasons[k] = (reasons[k] || 0) + 1; };

      const isQualityOk = (b: Bank): boolean => {
        const q = b.q;
        const ans = (q.correct_answer || '').trim().toUpperCase();

        const hasFullReview =
          !!q.correct_explanation &&
          !!q.explanation_a &&
          !!q.explanation_b &&
          !!q.explanation_c &&
          !!q.explanation_d &&
          (q.type === 'comparison' || !!q.explanation_e);
        if (!hasFullReview) { bump('missing_review_explanations'); return false; }

        if (q.type === 'comparison') {
          // STRICT FORMAT: must have Column A + Column B + correct_answer in {A,B,C,D}
          const a = (q.column_a || '').trim();
          const bcol = (q.column_b || '').trim();
          if (!a || !bcol) { bump('comp_missing_columns'); return false; }
          if (!['A', 'B', 'C', 'D'].includes(ans)) { bump('comp_bad_answer'); return false; }

          // Quality: figure reference without numbers in either column or instruction
          const blob = `${q.instruction || ''} ${a} ${bcol}`;
          if (FIGURE_REF.test(blob) && !HAS_NUMBER.test(blob)) { bump('figure_no_data'); return false; }

          // Undefined problem: BOTH columns are pure variables (no digits anywhere)
          if (!HAS_NUMBER.test(a) && !HAS_NUMBER.test(bcol) && VAR_ONLY.test(a) && VAR_ONLY.test(bcol)) {
            bump('vars_only'); return false;
          }
          return true;
        }

        // MCQ: STRICT — exactly 5 options A..E, correct_answer must be one of them
        const opts = q.options || {};
        const keys = Object.keys(opts).map(k => k.trim().toUpperCase());
        const need = ['A', 'B', 'C', 'D', 'E'];
        const hasAll5 = need.every(k => keys.includes(k) && String((opts as any)[k] ?? (opts as any)[k.toLowerCase()] ?? '').trim() !== '');
        if (!hasAll5) { bump('mcq_not_5_options'); return false; }
        if (!need.includes(ans)) { bump('mcq_bad_answer'); return false; }

        const instr = (q.instruction || '').trim();
        if (!instr) { bump('mcq_empty_instruction'); return false; }
        if (FIGURE_REF.test(instr) && !HAS_NUMBER.test(instr)) { bump('figure_no_data'); return false; }
        // Undefined: instruction has no digits AND looks like vars-only
        if (!HAS_NUMBER.test(instr) && VAR_ONLY.test(instr)) { bump('vars_only'); return false; }
        return true;
      };

      const bank: Bank[] = rawBank.filter(isQualityOk);
      console.log(`[PRACTICE_FILTER] raw=${rawBank.length}, kept=${bank.length}, excluded=${rawBank.length - bank.length}`);
      console.log('[PRACTICE_FILTER] exclusion reasons:', reasons);

      const bankByQid = new Map(bank.map(b => [b.qid, b]));

      // ============ 1b. SESSION REUSE — load latest session BEFORE generating ============
      // Also restore COMPLETED sessions so results never disappear on refresh.
      if (!forceNew) {
        const { data: latestSess } = await supabase
          .from('practice_sessions')
          .select('id, weak_topics, practice_type, status, num_correct, num_tasks')
          .eq('user_id', user.id)
          .in('status', ['active', 'completed'])
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const activeSess = latestSess;
        if (activeSess) {
          const { data: sessQs } = await supabase
            .from('practice_session_questions')
            .select('question_id, order_index')
            .eq('session_id', activeSess.id)
            .order('order_index', { ascending: true });

          // Detect legacy sessions whose stored qids point to TEST tables (mq_/mtq_).
          // Those sessions must NOT be restored — they would re-serve test questions.
          const hasTestQids = (sessQs || []).some(
            sq => typeof sq.question_id === 'string' && (sq.question_id.startsWith('mq_') || sq.question_id.startsWith('mtq_'))
          );
          if (hasTestQids && activeSess.status === 'active') {
            console.warn(`[DUPLICATE_TEST_QUESTION] session=${activeSess.id} contains test-bank qids — closing and regenerating from practice_questions only.`);
            await supabase
              .from('practice_sessions')
              .update({ status: 'completed', ended_at: new Date().toISOString() })
              .eq('id', activeSess.id);
          } else {
            const restored: PracticeQuestion[] = [];
            for (const sq of sessQs || []) {
              const b = bankByQid.get(sq.question_id);
              if (b) restored.push({ ...b.q, _qid: b.qid } as any);
            }

            if (restored.length > 0) {
            console.log(`[PRACTICE_SESSION] restored session_id=${activeSess.id} questions=${restored.length}`);
            setSessionId(activeSess.id);
            setQuestions(restored);
            const wt = Array.isArray(activeSess.weak_topics) ? (activeSess.weak_topics as string[]) : [];
            setWeakTopics(wt);
            setLatestTestName(isAI ? 'Персональная практика' : 'Общая практика ОРТ');
            setLatestTestType(restored[0].type);

            // Restore previously saved answers for this session
            const { data: priorResp } = await supabase
              .from('practice_responses')
              .select('question_id, user_answer')
              .eq('session_id', activeSess.id);
            const restoredAnswers: Record<string, string> = {};
            const qidToKey = new Map(restored.map(q => [(q as any)._qid as string, `${q.type}_${q.id}`]));
            for (const r of priorResp || []) {
              if (!r.question_id || !r.user_answer) continue;
              const k = qidToKey.get(r.question_id);
              if (k) restoredAnswers[k] = r.user_answer;
            }
            setAnswers(restoredAnswers);

            if (activeSess.status === 'completed') {
              // Permanently restore results screen
              setCurrentIndex(restored.length - 1);
              setShowResults(true);
              console.log(`[PRACTICE_RESULTS] restored session=${activeSess.id} score=${activeSess.num_correct}/${activeSess.num_tasks}`);
            } else {
              const firstUnanswered = restored.findIndex(q => !restoredAnswers[`${q.type}_${q.id}`]);
              setCurrentIndex(firstUnanswered === -1 ? restored.length - 1 : firstUnanswered);
              console.log(`[PRACTICE_SESSION] restored answers=${Object.keys(restoredAnswers).length} resume_index=${firstUnanswered === -1 ? restored.length - 1 : firstUnanswered}`);
            }
            console.log(`[PRACTICE_DEBUG] session_id=${activeSess.id} loaded_questions_count=${restored.length} loaded_answers_count=${Object.keys(restoredAnswers).length} status=${activeSess.status}`);
            setLoading(false);
            return;
            }
            // Session exists but has no question rows → BUG, do not silently regenerate over it.
            console.error(`[SESSION_NO_QUESTIONS] session_id=${activeSess.id} has 0 rows in practice_session_questions. Closing and regenerating.`);
            if (activeSess.status === 'active') {
              await supabase
                .from('practice_sessions')
                .update({ status: 'completed', ended_at: new Date().toISOString() })
                .eq('id', activeSess.id);
            }
          }
        }
      } else {
        // forceNew: close any active sessions before creating a new one
        await supabase
          .from('practice_sessions')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('status', 'active');
      }

      // ============ 2. EXCLUDE ALREADY ANSWERED (per-participant non-repetition) ============
      const [{ data: priorAttempts }, { data: priorPractice }] = await Promise.all([
        supabase.from('question_attempts').select('question_id').eq('user_id', user.id),
        supabase.from('practice_responses').select('question_id, question_data, is_correct, created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
      ]);
      const seen = new Set<string>();
      for (const a of priorAttempts || []) if (a.question_id) seen.add(a.question_id);
      for (const p of priorPractice || []) {
        // Prefer dedicated column; fall back to JSON for legacy rows
        const qid = (p as any).question_id || (p.question_data as any)?.question_id;
        if (qid) seen.add(qid);
      }
      const unseen = bank.filter(b => !seen.has(b.qid));
      console.log(`[PRACTICE_FRONTEND] Bank: ${bank.length}, seen: ${seen.size}, unseen: ${unseen.length}`);

      // ============ 3. WEAK TOPICS (AI only) ============
      let weak: string[] = [];
      let formatType: 'comparison' | 'mcq' = 'comparison';
      let mathTestId = 1;

      if (isAI) {
        const { data: latestAttempt } = await supabase
          .from('user_tests')
          .select('id, test_id')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestAttempt) {
          const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
          if (matchedConfig) {
            mathTestId = parseInt(matchedConfig[0]);
            formatType = matchedConfig[1]?.questionType || 'comparison';
            setLatestTestName(matchedConfig[1].name);
          }
          setLatestTestType(formatType);

          // Accuracy per topic from BOTH tests and prior practice (full history)
          const [{ data: attempts }, { data: practiceHist }] = await Promise.all([
            supabase.from('question_attempts').select('topic, is_correct').eq('user_id', user.id),
            supabase.from('practice_responses').select('topic, is_correct').eq('user_id', user.id),
          ]);
          const tmap = new Map<string, { c: number; t: number }>();
          const ingest = (rows: { topic: string | null; is_correct: boolean | null }[] | null) => {
            for (const a of rows || []) {
              const t = normalizeAnalyticsTopic(a.topic || '');
              if (!t) continue;
              const e = tmap.get(t) || { c: 0, t: 0 };
              e.t++;
              if (a.is_correct) e.c++;
              tmap.set(t, e);
            }
          };
          ingest(attempts);
          ingest(practiceHist);

          // Rank topics by accuracy ASC; require ≥3 attempts AND <60% accuracy.
          // Cap to top-8 worst so the weak set is actually targeted.
          const ranked = Array.from(tmap.entries())
            .filter(([, v]) => v.t >= 3 && (v.c / v.t) * 100 < 60)
            .sort((a, b) => (a[1].c / a[1].t) - (b[1].c / b[1].t))
            .slice(0, 8)
            .map(([k]) => k);
          weak = ranked;
          console.log('[PRACTICE_FRONTEND] Topic accuracy map:',
            Array.from(tmap.entries()).map(([k, v]) => `${k}=${v.c}/${v.t}`).join(', '));
          console.log('[PRACTICE_FRONTEND] Weak topics (top-8 <60%, ≥3 attempts):', weak);
          setWeakTopics(weak);
        }
      } else {
        setLatestTestName('Общая практика ОРТ');
        setLatestTestType('comparison');
      }

      // ============ 4. SELECT QUESTIONS ============
      const shuffle = <T,>(arr: T[]) => arr.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

      let chosen: Bank[] = [];

      // 4a. TOPIC-FOCUSED MODE — overrides everything else.
      // Triggered by ?topic=... from "My Plan".
      // Requirement: 10 questions and all of them must be about the tapped topic.
      if (focusedTopic) {
        const focusEn = normalizeAnalyticsTopic(focusedTopic);
        const focusRu = normalizePracticeTopic(focusedTopic);
        const matchesFocus = (t: string) => {
          return normalizePracticeTopic(t) === focusRu;
        };

        const topicBank = bank.filter(b => matchesFocus(b.topic));
        const TOPIC_TOTAL = 10;
        const shuffleArr = <T,>(arr: T[]) => arr.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

        const unseenTopic = topicBank.filter(b => !seen.has(b.qid));
        const seenTopic = topicBank.filter(b => seen.has(b.qid));
        let focusPick = shuffleArr(unseenTopic).slice(0, TOPIC_TOTAL);
        if (focusPick.length < TOPIC_TOTAL) {
          focusPick = focusPick.concat(shuffleArr(seenTopic).slice(0, TOPIC_TOTAL - focusPick.length));
        }
        if (focusPick.length < TOPIC_TOTAL && topicBank.length > 0) {
          const refillPool = shuffleArr(topicBank);
          let refillIndex = 0;
          while (focusPick.length < TOPIC_TOTAL) {
            focusPick.push(refillPool[refillIndex % refillPool.length]);
            refillIndex++;
          }
        }
        chosen = focusPick;

        // GRACEFUL FALLBACK: if the topic has zero questions in the bank,
        // show a clear topic-specific error instead of unrelated mixed tasks.
        if (chosen.length === 0) {
          setGenerationError(`Нет готовых заданий по теме «${focusRu}».`);
          setLoading(false);
          return;
        }

        setLatestTestName(`Практика: ${focusRu}`);
        console.log(`[PRACTICE_TOPIC] focus_en="${focusEn}" focus_ru="${focusRu}" topic_bank=${topicBank.length} chosen=${chosen.length}`);
      } else if (isControl) {
        // CONTROL: 25 random across all topics, no weak-topic bias
        chosen = shuffle(unseen).slice(0, 25);
        if (chosen.length < 25) {
          // Pool exhausted — allow reuse to keep practice available
          const reusable = shuffle(bank.filter(b => !chosen.includes(b)));
          chosen = chosen.concat(reusable.slice(0, 25 - chosen.length));
        }
      } else {
        // AI: 10 total — strict 80/20 (8 weak + 2 other)
        // + RULE-BASED REINFORCEMENT: re-inject up to 2 recently-wrong questions
        // (rule: review wrong items 5-10 questions later; here we re-surface across sessions)
        const TOTAL = 10;
        const WEAK_N = 8;
        const REINFORCE_N = 2; // slots reserved inside TOTAL for recent mistakes
        const weakSet = new Set(weak.map(topic => normalizePracticeTopic(topic)));

        // Find recent wrong answers (last 30 responses) — keep ones whose qid is still in bank
        const wrongQids = new Set<string>();
        for (const p of (priorPractice || []).slice(-30)) {
          const isWrongRow = (p as any).is_correct === false;
          const qid = (p as any).question_id;
          if (isWrongRow && qid && bankByQid.has(qid)) wrongQids.add(qid);
        }
        const reinforcePool = shuffle(Array.from(wrongQids).map(qid => bankByQid.get(qid)!).filter(Boolean));
        const reinforcePick = reinforcePool.slice(0, REINFORCE_N);
        const reinforceSet = new Set(reinforcePick.map(b => b.qid));
        console.log(`[PRACTICE_REINFORCE] recent_wrong=${wrongQids.size} reinjected=${reinforcePick.length}`);

        // Helper: pick by weak/other split from a pool, excluding already-chosen qids
        const pickFromPool = (pool: Bank[], remaining: number) => {
          const weakP = shuffle(pool.filter(b => weakSet.has(normalizePracticeTopic(b.topic)) && !reinforceSet.has(b.qid)));
          const otherP = shuffle(pool.filter(b => !weakSet.has(normalizePracticeTopic(b.topic)) && !reinforceSet.has(b.qid)));
          const weakSlots = Math.min(WEAK_N, remaining);
          const weakPick = weakP.slice(0, weakSlots);
          const otherPick = otherP.slice(0, remaining - weakPick.length);
          return [...weakPick, ...otherPick];
        };

        const remainingSlots = TOTAL - reinforcePick.length;

        if (weak.length === 0) {
          const newPicks = shuffle(unseen.filter(b => !reinforceSet.has(b.qid))).slice(0, remainingSlots);
          chosen = [...reinforcePick, ...newPicks];
          if (chosen.length < TOTAL) {
            const reusable = shuffle(bank.filter(b => !chosen.includes(b)));
            chosen = chosen.concat(reusable.slice(0, TOTAL - chosen.length));
          }
        } else {
          // 1) Reinforcement first, then 80/20 from unseen
          const fromUnseen = pickFromPool(unseen, remainingSlots);
          chosen = [...reinforcePick, ...fromUnseen];

          // 2) Backfill from seen pool with 80/20
          if (chosen.length < TOTAL) {
            const seenAvail = bank.filter(b => !chosen.includes(b));
            const fromSeen = pickFromPool(seenAvail, TOTAL - chosen.length);
            chosen = chosen.concat(fromSeen);
          }

          // 3) Last-resort
          if (chosen.length < TOTAL) {
            const remaining = shuffle(bank.filter(b => !chosen.includes(b)));
            chosen = chosen.concat(remaining.slice(0, TOTAL - chosen.length));
          }
        }
        chosen = shuffle(chosen);

        const weakInChosen = chosen.filter(b => weakSet.has(normalizePracticeTopic(b.topic))).length;
        console.log(`[PRACTICE_FRONTEND] AI distribution: ${weakInChosen}/${chosen.length} from weak topics, ${reinforcePick.length} reinforced. Topics: ${chosen.map(b => b.topic).join(', ')}`);
      }

      console.log(`[PRACTICE_FRONTEND] Chosen ${chosen.length} questions. Weak topics: [${weak.join(', ')}]`);

      if (chosen.length === 0) {
        setGenerationError('Нет доступных заданий. Пройдите тест сначала.');
        setLoading(false);
        return;
      }

      // attach qid into question for save step
      const finalQuestions: PracticeQuestion[] = chosen.map(b => ({ ...b.q, _qid: b.qid } as any));

      // ============ 5. CREATE SESSION + STORE ASSIGNED QUESTIONS ============
      const { data: sessionData } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          participant_id: pid,
          group_type: group,
          practice_type: isAI ? 'personalized' : 'general',
          weak_topics: isAI ? weak : [],
          data_version: 'v2',
          is_reliable: !!pid,
          status: 'active',
        })
        .select('id')
        .single();

      if (sessionData) {
        setSessionId(sessionData.id);
        console.log(`[PRACTICE_SESSION] created session_id=${sessionData.id} questions=${chosen.length} group=${group}`);
        // Persist the assigned question set so we can reuse this session later
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
        console.log(`[PRACTICE_DEBUG] session_id=${sessionData.id} loaded_questions_count=${chosen.length} loaded_answers_count=0 status=active(new)`);
      }
      setQuestions(finalQuestions);
      console.log(`[PRACTICE_LOAD] loaded_questions_count=${finalQuestions.length}`);
      console.log('[SCOPE_LOCKED] practice runtime: no AI generation, no runtime personalization beyond pre-built session.');
    } catch (err) {
      console.error('[PRACTICE_FRONTEND] Practice load error:', err);
      setGenerationError('Ошибка загрузки практики');
    } finally {
      setLoading(false);
    }
  }, [user, group, groupLoading, isAI, isControl, focusedTopic]);

  useEffect(() => {
    // When user navigates with ?topic=..., always start a fresh session for that topic.
    if (user && !groupLoading) loadPractice(!!focusedTopic);
  }, [user, groupLoading, loadPractice, focusedTopic]);

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
  }, [user, sessionId, participantId]);

  const handleAnswer = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
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
      else console.log(`[PRACTICE_RESULTS] saved session_id=${sessionId} db_correct=${finalCorrect}/${questions.length}`);
    } catch (err) {
      console.error('[PRACTICE_SESSION] Failed to finalize:', err);
    }
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

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CheckCircle className={`mx-auto h-12 w-12 mb-2 ${percentage >= 80 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'}`} />
              <CardTitle className="text-2xl">Результаты практики</CardTitle>
              <CardDescription>{latestTestName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">{percentage}%</div>
                <p className="text-muted-foreground">{correctCount} из {questions.length} правильно</p>
                <Progress value={percentage} className="mt-4 h-3" />
              </div>

              {/* Control: show all questions with answers; AI: show weak topics + mistake analysis */}
              <div className="flex gap-3 justify-center mb-6 flex-wrap">
                <Button
                  onClick={() => {
                    // Auto-queue: if we just finished a focused topic, jump to the next weak topic.
                    if (focusedTopic && weakTopics.length > 0) {
                      const normalizedFocused = normalizeAnalyticsTopic(focusedTopic);
                      const idx = weakTopics.findIndex(
                        t => normalizeAnalyticsTopic(t) === normalizedFocused,
                      );
                      const next = weakTopics[(idx + 1) % weakTopics.length];
                      if (next && normalizeAnalyticsTopic(next) !== normalizedFocused) {
                        setSearchParams({ topic: next });
                        return;
                      }
                    }
                    // Otherwise: clear focus and start a fresh general session
                    if (focusedTopic) {
                      setSearchParams({});
                      return;
                    }
                    loadPractice(true);
                  }}
                  variant="accent"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {focusedTopic ? 'Следующая тема' : 'Новая практика'}
                </Button>
                {isAI && (
                  <Button onClick={() => navigate('/learning-plan')} variant="outline">
                    Мой план
                  </Button>
                )}
                <Button onClick={() => navigate('/tests')} variant="outline">
                  К тестам
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Unified data-driven review (no AI) — uses QuestionReview component */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Все задания ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allResults.map(({ q, userAnswer, isCorrect }, idx) => (
                <QuestionReview
                  key={qKey(q)}
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

        <Progress value={(answeredCount / questions.length) * 100} className="mb-6 h-2" />

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
                    const isSelected = answers[qKey(currentQ)] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleAnswer(opt.key)}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-2 ring-accent'
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
                    const isSelected = answers[qKey(currentQ)] === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-2 ring-accent'
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
