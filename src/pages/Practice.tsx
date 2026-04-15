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

  const loadPractice = useCallback(async () => {
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
      console.log(`[PRACTICE_FRONTEND] Loading practice for user: ${user.id}, group: ${group}`);

      // Fetch participant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('participant_id, group_type')
        .eq('id', user.id)
        .maybeSingle();
      
      const pid = profile?.participant_id || null;
      setParticipantId(pid);

      let formatType: 'comparison' | 'mcq' = 'comparison';
      let mathTestId = 1;
      let weak: string[] = [];

      if (isAI) {
        // AI GROUP: personalized practice based on weak topics
        const { data: latestAttempt } = await supabase
          .from('user_tests')
          .select('id, test_id')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestAttempt) {
          setLoading(false);
          return;
        }

        const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
        const configEntry = matchedConfig ? matchedConfig[1] : null;
        mathTestId = matchedConfig ? parseInt(matchedConfig[0]) : 1;
        setLatestTestName(configEntry ? configEntry.name : 'Тест');
        formatType = configEntry?.questionType || 'comparison';
        setLatestTestType(formatType);

        const { data: attempts } = await supabase
          .from('question_attempts')
          .select('topic, is_correct')
          .eq('user_id', user.id)
          .eq('test_attempt_id', latestAttempt.id);

        if (!attempts || attempts.length === 0) {
          setLoading(false);
          return;
        }

        const topicMap = new Map<string, { correct: number; total: number }>();
        for (const a of attempts) {
          const t = a.topic || 'Unknown';
          const entry = topicMap.get(t) || { correct: 0, total: 0 };
          entry.total++;
          if (a.is_correct) entry.correct++;
          topicMap.set(t, entry);
        }

        topicMap.forEach((data, topic) => {
          const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
          if (accuracy < 50) weak.push(topic);
        });

        if (weak.length < 3) {
          topicMap.forEach((data, topic) => {
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            if (accuracy >= 50 && accuracy < 80 && !weak.includes(topic)) {
              weak.push(topic);
            }
          });
        }

        setWeakTopics(weak);

        if (weak.length === 0) {
          setLoading(false);
          return;
        }
      } else {
        // CONTROL GROUP: non-personalized practice
        setLatestTestName('Общая практика ОРТ');
        // Determine format from latest test if available
        const { data: latestAttempt } = await supabase
          .from('user_tests')
          .select('test_id')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestAttempt) {
          const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
          if (matchedConfig) {
            formatType = matchedConfig[1]?.questionType || 'comparison';
            mathTestId = parseInt(matchedConfig[0]);
          }
        }
        setLatestTestType(formatType);
      }

      // Create practice session in DB
      const { data: sessionData } = await supabase
        .from('practice_sessions' as any)
        .insert({
          user_id: user.id,
          participant_id: pid,
          group_type: group,
          practice_type: isAI ? 'personalized' : 'general',
          weak_topics: isAI ? weak : [],
        })
        .select('id')
        .single();

      if (sessionData) {
        setSessionId((sessionData as any).id);
      }

      // Call edge function
      const questionCount = isControl ? 25 : Math.min(10, Math.max(5, weak.length * 3));
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-practice-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            weakTopics: isAI ? weak : [],
            questionCount,
            formatType,
            groupType: group || 'ai',
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("[PRACTICE_FRONTEND] Edge function error:", response.status, errData);
        setGenerationError(errData.error || `Ошибка генерации (${response.status})`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log(`[PRACTICE_FRONTEND] Received ${data.questions?.length || 0} questions from ${data.source}`);

      const aiQuestions: PracticeQuestion[] = (data.questions || []).map((raw: any, idx: number) => {
        const q = raw.question_data ? { ...raw.question_data, type: raw.question_type, topic: raw.topic, correct_answer: raw.correct_answer } : raw;
        const qType = q.type || formatType;
        
        if (qType === 'mcq') {
          return {
            type: 'mcq' as const,
            id: 90000 + idx,
            question_number: idx + 1,
            topic: q.topic || '',
            instruction: q.instruction || '',
            options: q.options || {},
            correct_answer: q.correct_answer || 'A',
            variantId: mathTestId,
          };
        }
        return {
          type: 'comparison' as const,
          id: 90000 + idx,
          question_number: idx + 1,
          topic: q.topic || '',
          instruction: q.instruction || null,
          column_a: q.column_a || '',
          column_b: q.column_b || '',
          option_c: null,
          option_d: null,
          correct_answer: q.correct_answer || 'A',
          variantId: mathTestId,
        };
      });

      if (aiQuestions.length > 0) {
        setQuestions(aiQuestions);
      } else {
        setGenerationError('AI не вернул вопросы. Попробуйте ещё раз.');
      }
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
    // AI-only feature
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
        ? `Условие: ${q.instruction || 'Сравните величины'}\nСтолбец A: ${q.column_a}\nСтолбец B: ${q.column_b}`
        : `Условие: ${q.instruction}`;

      const correctLabel = toCyrillicKey(q.correct_answer);
      const userLabel = toCyrillicKey(userAnswer);

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
                content: `Ученик решал задачу по теме "${q.topic}".\n\n${questionText}\n\nУченик выбрал ответ: ${userLabel}\nПравильный ответ: ${correctLabel}\n\nОбъясни кратко:\n1. Почему ответ ученика неправильный\n2. Как правильно решить эту задачу\n3. Какой верный ход рассуждений\n\nОтветь на русском языке, кратко и понятно.`,
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
        // Use ?? to preserve falsy-but-valid answers; || would drop "0"
        const userAns = answers[qKey(q)] ?? null;
        const safeUserAns = (userAns && userAns !== '0') ? userAns : (userAns === '0' ? null : userAns);
        const isCorrect = safeUserAns === q.correct_answer;
        if (isCorrect) correctCount++;
        
        console.log("[ANSWER DEBUG]", {
          question_id: `practice_${i}`,
          raw_ui_answer: answers[qKey(q)],
          final_user_answer: safeUserAns,
        });

        responses.push({
          session_id: sessionId,
          user_id: user.id,
          participant_id: participantId,
          question_index: i,
          topic: q.topic,
          difficulty: null,
          question_data: q.type === 'comparison'
            ? { instruction: (q as ComparisonPractice).instruction, column_a: (q as ComparisonPractice).column_a, column_b: (q as ComparisonPractice).column_b }
            : { instruction: (q as McqPractice).instruction, options: (q as McqPractice).options },
          user_answer: safeUserAns,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
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
      const correct = userAns === q.correct_answer;
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
                          className="mt-2"
                          onClick={() => loadMistakeExplanation(q, userAnswer)}
                        >
                          {explanation?.loading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Lightbulb className="mr-1 h-3 w-3" />
                          )}
                          {expandedMistake === key ? 'Скрыть' : 'Объяснение ошибки'}
                        </Button>

                        {expandedMistake === key && explanation?.explanation && (
                          <div className="mt-2 rounded bg-muted/50 p-3 text-sm whitespace-pre-line">
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
