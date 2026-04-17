import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { translateTopic } from '@/lib/topicTranslations';
import { normalizeAnswer, compareAnswers } from '@/lib/answerNormalization';

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
}

type PracticeQuestion = ComparisonPractice | McqPractice;

interface MistakeExplanation {
  explanation: string;
  correctReasoning: string;
  loading: boolean;
}

export default function Practice() {
  const navigate = useNavigate();
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

      // ============ 1. LOAD ENTIRE QUESTION BANK ============
      const [{ data: compRows }, { data: mcqRows }] = await Promise.all([
        supabase.from('math_questions').select('id, test_id, question_number, topic, instruction, column_a, column_b, correct_answer').not('correct_answer', 'is', null),
        supabase.from('math_test_questions').select('id, test_id, question_number, topic, instruction, options, correct_answer, question_type').eq('question_type', 'mcq').not('correct_answer', 'is', null),
      ]);

      type Bank = { qid: string; topic: string; q: PracticeQuestion };
      const bank: Bank[] = [];
      for (const r of compRows || []) {
        const qid = `mq_${r.test_id}_${r.question_number}`;
        bank.push({
          qid,
          topic: r.topic || '',
          q: {
            type: 'comparison',
            id: r.id,
            question_number: r.question_number,
            topic: r.topic || '',
            instruction: r.instruction,
            column_a: r.column_a,
            column_b: r.column_b,
            option_c: null,
            option_d: null,
            correct_answer: (r.correct_answer || 'A').toString().trim().toUpperCase(),
            variantId: r.test_id,
          },
        });
      }
      for (const r of mcqRows || []) {
        const qid = `mtq_${r.test_id}_${r.question_number}`;
        bank.push({
          qid,
          topic: r.topic || '',
          q: {
            type: 'mcq',
            id: r.id,
            question_number: r.question_number,
            topic: r.topic || '',
            instruction: r.instruction || '',
            options: (r.options as any) || {},
            correct_answer: (r.correct_answer || 'A').toString().trim().toUpperCase(),
            variantId: r.test_id,
          },
        });
      }

      const bankByQid = new Map(bank.map(b => [b.qid, b]));

      // ============ 1b. SESSION REUSE — load active session BEFORE generating ============
      if (!forceNew) {
        const { data: activeSess } = await supabase
          .from('practice_sessions')
          .select('id, weak_topics, practice_type')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeSess) {
          const { data: sessQs } = await supabase
            .from('practice_session_questions')
            .select('question_id, order_index')
            .eq('session_id', activeSess.id)
            .order('order_index', { ascending: true });

          const restored: PracticeQuestion[] = [];
          for (const sq of sessQs || []) {
            const b = bankByQid.get(sq.question_id);
            if (b) restored.push({ ...b.q, _qid: b.qid } as any);
          }

          if (restored.length > 0) {
            console.log(`[PRACTICE_FRONTEND] Reusing active session ${activeSess.id} with ${restored.length} questions`);
            setSessionId(activeSess.id);
            setQuestions(restored);
            const wt = Array.isArray(activeSess.weak_topics) ? (activeSess.weak_topics as string[]) : [];
            setWeakTopics(wt);
            setLatestTestName(isAI ? 'Персональная практика' : 'Общая практика ОРТ');
            setLatestTestType(restored[0].type);
            setLoading(false);
            return;
          }
          // Active session exists but has no question rows → close it and regenerate
          await supabase
            .from('practice_sessions')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('id', activeSess.id);
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
        supabase.from('practice_responses').select('question_id, question_data').eq('user_id', user.id),
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
              const t = (a.topic || '').trim();
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

      if (isControl) {
        // CONTROL: 25 random across all topics, no weak-topic bias
        chosen = shuffle(unseen).slice(0, 25);
        if (chosen.length < 25) {
          // Pool exhausted — allow reuse to keep practice available
          const reusable = shuffle(bank.filter(b => !chosen.includes(b)));
          chosen = chosen.concat(reusable.slice(0, 25 - chosen.length));
        }
      } else {
        // AI: 10 total — strict 80/20 (8 weak + 2 other)
        const TOTAL = 10;
        const WEAK_N = 8;
        const weakSet = new Set(weak);

        // Helper: pick by weak/other split from a pool
        const pickFromPool = (pool: Bank[]) => {
          const weakP = shuffle(pool.filter(b => weakSet.has(b.topic)));
          const otherP = shuffle(pool.filter(b => !weakSet.has(b.topic)));
          const weakPick = weakP.slice(0, WEAK_N);
          const otherPick = otherP.slice(0, TOTAL - weakPick.length);
          return [...weakPick, ...otherPick];
        };

        if (weak.length === 0) {
          // No weak data → random sample from unseen (then bank)
          chosen = shuffle(unseen).slice(0, TOTAL);
          if (chosen.length < TOTAL) {
            const reusable = shuffle(bank.filter(b => !chosen.includes(b)));
            chosen = chosen.concat(reusable.slice(0, TOTAL - chosen.length));
          }
        } else {
          // 1) Try unseen pool with strict 80/20
          chosen = pickFromPool(unseen);

          // 2) If short, backfill from seen pool — STILL respecting 80/20
          if (chosen.length < TOTAL) {
            const seenAvail = bank.filter(b => !chosen.includes(b));
            const fromSeen = pickFromPool(seenAvail);
            chosen = chosen.concat(fromSeen.slice(0, TOTAL - chosen.length));
          }

          // 3) Last-resort: any remaining (shouldn't trigger normally)
          if (chosen.length < TOTAL) {
            const remaining = shuffle(bank.filter(b => !chosen.includes(b)));
            chosen = chosen.concat(remaining.slice(0, TOTAL - chosen.length));
          }
        }
        chosen = shuffle(chosen);

        // Validate 80/20 distribution and log
        const weakInChosen = chosen.filter(b => weakSet.has(b.topic)).length;
        console.log(`[PRACTICE_FRONTEND] AI distribution: ${weakInChosen}/${chosen.length} from weak topics. Topics: ${chosen.map(b => b.topic).join(', ')}`);
      }

      console.log(`[PRACTICE_FRONTEND] Chosen ${chosen.length} questions. Weak topics: [${weak.join(', ')}]`);

      if (chosen.length === 0) {
        setGenerationError('Нет доступных заданий. Пройдите тест сначала.');
        setLoading(false);
        return;
      }

      // attach qid into question for save step
      const finalQuestions: PracticeQuestion[] = chosen.map(b => ({ ...b.q, _qid: b.qid } as any));

      // ============ 5. CREATE SESSION ============
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
        })
        .select('id')
        .single();

      if (sessionData) setSessionId(sessionData.id);
      setQuestions(finalQuestions);
    } catch (err) {
      console.error('[PRACTICE_FRONTEND] Practice load error:', err);
      setGenerationError('Ошибка загрузки практики');
    } finally {
      setLoading(false);
    }
  }, [user, group, groupLoading, isAI, isControl]);

  useEffect(() => {
    if (user && !groupLoading) loadPractice();
  }, [user, groupLoading, loadPractice]);

  const qKey = (q: PracticeQuestion) => `${q.type}_${q.id}`;

  const handleAnswer = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [qKey(q)]: latinKey }));
  };

  const loadMistakeExplanation = async (q: PracticeQuestion, userAnswer: string) => {
    if (!isAI) return;
    
    const key = qKey(q);
    if (mistakeExplanations[key]?.explanation) {
      setExpandedMistake(expandedMistake === key ? null : key);
      return;
    }

    setExpandedMistake(key);
    setMistakeExplanations(prev => ({
      ...prev,
      [key]: { explanation: '', correctReasoning: '', loading: true },
    }));

    try {
      const questionText = q.type === 'comparison'
        ? `Условие: ${q.instruction || 'Сравните величины'}\nСтолбец A: ${q.column_a}\nСтолбец B: ${q.column_b}\n\nВарианты ответа:\nА) Величина в столбце A больше\nБ) Величина в столбце B больше\nВ) Величины равны\nГ) Недостаточно информации`
        : `Условие: ${q.instruction}${q.type === 'mcq' && q.options ? '\n\nВарианты:\n' + Object.entries(q.options).map(([k, v]) => `${toCyrillicKey(k)}) ${v}`).join('\n') : ''}`;

      const correctLabel = toCyrillicKey(q.correct_answer);
      const userLabel = toCyrillicKey(userAnswer);

      // Build structured prompt with strict format
      const explanationPrompt = `Ученик решал математическую задачу ОРТ.

ЗАДАЧА:
${questionText}

Ответ ученика: ${userLabel}
Правильный ответ: ${correctLabel}

ОТВЕТЬ СТРОГО ПО ФОРМАТУ (4 блока):

❌ ОШИБКА:
[Конкретно что ученик сделал неправильно. Одно предложение.]

✅ РЕШЕНИЕ:
[Пошаговое решение. Каждый шаг на новой строке. Используй математическую запись:]
[- Дроби: $\\frac{a}{b}$]
[- Степени: $x^{2}$, $\\sqrt{x}$]
[- Сравнения: $>$, $<$, $=$]
[- Вычисления показывай: $2^3 = 8$]

📌 ОТВЕТ: ${correctLabel}

💡 ЗАПОМНИ:
[Одно предложение — ключевое правило для запоминания.]

ПРАВИЛА:
- Математические формулы оборачивай в $...$
- Не используй фразы "давайте разберём", "рассмотрим" — пиши прямо
- Решение должно быть конкретным с числами
- Ответ ОБЯЗАН совпадать с правильным: ${correctLabel}
- Пиши на русском языке`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-tutor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: explanationPrompt,
              },
            ],
            context: { type: 'mistake_review' },
            language: 'ru',
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullText += content;
              } catch { /* skip */ }
            }
          }
        }
      }

      const explanation = fullText || 'Не удалось получить объяснение.';
      setMistakeExplanations(prev => ({
        ...prev,
        [key]: { explanation, correctReasoning: '', loading: false },
      }));
    } catch {
      setMistakeExplanations(prev => ({
        ...prev,
        [key]: { explanation: 'Ошибка при загрузке объяснения.', correctReasoning: '', loading: false },
      }));
    }
  };

  // Save practice results to DB
  const savePracticeResults = useCallback(async () => {
    if (!user) return;
    try {
      let correctCount = 0;
      const responses: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAns = answers[qKey(q)] ?? null;
        const normUser = normalizeAnswer(userAns);
        const normCorrect = normalizeAnswer(q.correct_answer);
        const isCorrect = compareAnswers(userAns, q.correct_answer);
        if (isCorrect) correctCount++;
        
        console.log("[PRACTICE_VALIDATION]", {
          question_index: i,
          topic: q.topic,
          raw_user_answer: userAns,
          normalized_user: normUser,
          raw_correct: q.correct_answer,
          normalized_correct: normCorrect,
          is_correct: isCorrect,
          match: normUser === normCorrect,
        });

        const respReliable = !!(participantId && normUser);
        if (!respReliable) {
          console.warn('[DATA_INTEGRITY] Unreliable practice_response:', { index: i, participantId, user_answer: normUser });
        }

        // Skip questions the user did not answer at all — do not pollute analytics
        if (!normUser) {
          console.log('[PRACTICE_VALIDATION] Skipping unanswered question', { index: i, qid: (q as any)._qid });
          continue;
        }

        responses.push({
          session_id: sessionId,
          user_id: user.id,
          participant_id: participantId,
          question_index: i,
          topic: q.topic,
          difficulty: null,
          question_data: q.type === 'comparison'
            ? { question_id: (q as any)._qid, instruction: (q as ComparisonPractice).instruction, column_a: (q as ComparisonPractice).column_a, column_b: (q as ComparisonPractice).column_b }
            : { question_id: (q as any)._qid, instruction: (q as McqPractice).instruction, options: (q as McqPractice).options },
          user_answer: normUser,
          correct_answer: normalizeAnswer(q.correct_answer),
          is_correct: isCorrect,
          data_version: 'v2',
          is_reliable: respReliable,
        });
      }

      // Save practice_responses
      if (sessionId && responses.length > 0) {
        const { error: respError } = await supabase
          .from('practice_responses' as any)
          .insert(responses);
        if (respError) console.error('[PRACTICE] Failed to save responses:', respError);

        // Update practice session summary
        const totalTime = Math.round((Date.now() - sessionStartRef.current) / 1000);
        await supabase
          .from('practice_sessions' as any)
          .update({
            ended_at: new Date().toISOString(),
            total_time_seconds: totalTime,
            num_tasks: questions.length,
            num_correct: correctCount,
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.error('[PRACTICE] Failed to save results:', err);
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
            <Button onClick={loadPractice} variant="accent">
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
              <div className="flex gap-3 justify-center mb-6">
                <Button onClick={loadPractice} variant="accent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Новая практика
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

          {/* Show all questions with correct/incorrect for both groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Все задания ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allResults.map(({ q, userAnswer, isCorrect }, idx) => {
                const key = qKey(q);
                const explanation = mistakeExplanations[key];
                return (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                        {isCorrect ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Правильно</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Неправильно</Badge>
                        )}
                      </div>
                      {/* Control: NO topic display to avoid personalization hints */}
                      {isAI && (
                        <Badge variant="outline">{translateTopic(q.topic, 'ru')}</Badge>
                      )}
                    </div>

                    {q.type === 'comparison' ? (
                      <div className="text-sm mb-2">
                        {q.instruction && <p className="mb-1"><MathRenderer content={q.instruction} /></p>}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded bg-muted/50 p-2 text-center">
                            <span className="text-xs text-muted-foreground">A:</span> <MathRenderer content={q.column_a} inline />
                          </div>
                          <div className="rounded bg-muted/50 p-2 text-center">
                            <span className="text-xs text-muted-foreground">B:</span> <MathRenderer content={q.column_b} inline />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mb-2"><MathRenderer content={q.instruction} /></p>
                    )}

                    <div className="flex gap-4 text-sm">
                      <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                        Ваш ответ: {userAnswer ? toCyrillicKey(userAnswer) : '—'}
                      </span>
                      <span className="text-success">Верный: {toCyrillicKey(q.correct_answer)}</span>
                    </div>

                    {/* AI group only: mistake explanation via AI */}
                    {isAI && !isCorrect && userAnswer && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-accent hover:text-accent"
                          onClick={() => loadMistakeExplanation(q, userAnswer)}
                        >
                          {explanation?.loading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Lightbulb className="mr-1 h-3 w-3" />
                          )}
                          {expandedMistake === key ? 'Скрыть разбор' : 'Разбор с AI'}
                        </Button>

                        {expandedMistake === key && explanation?.explanation && (
                          <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm leading-relaxed">
                            <MathRenderer content={explanation.explanation} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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
              onClick={() => { savePracticeResults(); setShowResults(true); }}
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
