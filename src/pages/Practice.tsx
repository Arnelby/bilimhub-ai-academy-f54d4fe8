import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Target, AlertTriangle, Dumbbell, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MathRenderer } from '@/components/math/MathRenderer';
import { QuestionImage } from '@/components/math/QuestionImage';
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

  const loadPractice = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setMistakeExplanations({});
    setExpandedMistake(null);
    setGenerationError(null);
    
    try {
      console.log("[PRACTICE_FRONTEND] Loading practice for user:", user.id);

      // 1. Find latest completed test
      const { data: latestAttempt } = await supabase
        .from('user_tests')
        .select('id, test_id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestAttempt) {
        console.log("[PRACTICE_FRONTEND] No completed tests found");
        setLoading(false);
        return;
      }

      const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
      const configEntry = matchedConfig ? matchedConfig[1] : null;
      const mathTestId = matchedConfig ? parseInt(matchedConfig[0]) : 1;
      setLatestTestName(configEntry ? configEntry.name : 'Тест');
      setLatestTestType(configEntry?.questionType || 'comparison');

      // 2. Get question attempts for weak topics
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('topic, is_correct')
        .eq('user_id', user.id)
        .eq('test_attempt_id', latestAttempt.id);

      if (!attempts || attempts.length === 0) {
        console.log("[PRACTICE_FRONTEND] No question attempts found");
        setLoading(false);
        return;
      }

      // 3. Calculate topic accuracy
      const topicMap = new Map<string, { correct: number; total: number }>();
      for (const a of attempts) {
        const t = a.topic || 'Unknown';
        const entry = topicMap.get(t) || { correct: 0, total: 0 };
        entry.total++;
        if (a.is_correct) entry.correct++;
        topicMap.set(t, entry);
      }

      const weak: string[] = [];
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
        console.log("[PRACTICE_FRONTEND] No weak topics found");
        setLoading(false);
        return;
      }

      console.log("[PRACTICE_FRONTEND] Weak topics:", weak);
      console.log("[PRACTICE_FRONTEND] Calling ai-practice-generate edge function");

      // 4. Call dedicated practice generation edge function
      const formatType = configEntry?.questionType || 'comparison';
      const questionCount = Math.min(10, Math.max(5, weak.length * 3));

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
            weakTopics: weak,
            questionCount,
            formatType,
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

      const aiQuestions: PracticeQuestion[] = (data.questions || []).map((q: any, idx: number) => {
        if (q.type === 'mcq' || formatType === 'mcq') {
          return {
            type: 'mcq' as const,
            id: 90000 + idx,
            question_number: idx + 1,
            topic: q.topic || weak[0] || '',
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
          topic: q.topic || weak[0] || '',
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
  }, [user]);

  useEffect(() => {
    if (user) loadPractice();
  }, [user, loadPractice]);

  const qKey = (q: PracticeQuestion) => `${q.type}_${q.id}`;

  const handleAnswer = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [qKey(q)]: latinKey }));
  };

  const loadMistakeExplanation = async (q: PracticeQuestion, userAnswer: string) => {
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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

  // Save practice results to DB (before early returns for hooks rules)
  const savePracticeResults = useCallback(async () => {
    if (!user) return;
    try {
      // Save each generated question to practice_questions if not already saved
      for (const q of questions) {
        const userAns = answers[qKey(q)];
        if (!userAns) continue;
        await supabase.from('practice_questions').insert({
          user_id: user.id,
          topic: q.topic,
          question_type: q.type,
          question_data: q.type === 'comparison'
            ? { instruction: (q as ComparisonPractice).instruction, column_a: (q as ComparisonPractice).column_a, column_b: (q as ComparisonPractice).column_b }
            : { instruction: (q as McqPractice).instruction, options: (q as McqPractice).options },
          correct_answer: q.correct_answer,
          source: 'ai',
        });
      }
    } catch (err) {
      console.error('[PRACTICE] Failed to save results:', err);
    }
  }, [user, questions, answers]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading) {
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
            {weakTopics.length === 0
              ? 'Сначала пройдите тест, чтобы система определила слабые темы.'
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
    const mistakes: { q: PracticeQuestion; userAnswer: string }[] = [];

    for (const q of questions) {
      const userAns = answers[qKey(q)];
      if (userAns === q.correct_answer) {
        correctCount++;
      } else if (userAns) {
        mistakes.push({ q, userAnswer: userAns });
      }
    }

    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CheckCircle className={`mx-auto h-12 w-12 mb-2 ${percentage >= 80 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'}`} />
              <CardTitle className="text-2xl">Результаты практики</CardTitle>
              <CardDescription>{latestTestName} • Слабые темы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">{percentage}%</div>
                <p className="text-muted-foreground">{correctCount} из {questions.length} правильно</p>
                <Progress value={percentage} className="mt-4 h-3" />
              </div>

              {weakTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {weakTopics.map(t => (
                    <Badge key={t} variant="outline">{translateTopic(t, 'ru')}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={loadPractice} variant="accent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Новая практика
                </Button>
                <Button onClick={() => navigate('/learning-plan')} variant="outline">
                  Мой план
                </Button>
              </div>
            </CardContent>
          </Card>

          {mistakes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  Разбор ошибок ({mistakes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mistakes.map(({ q, userAnswer }, idx) => {
                  const key = qKey(q);
                  const explanation = mistakeExplanations[key];
                  return (
                    <div key={key} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{translateTopic(q.topic, 'ru')}</Badge>
                        <span className="text-sm text-muted-foreground">#{idx + 1}</span>
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
                        <span className="text-destructive">Ваш: {toCyrillicKey(userAnswer)}</span>
                        <span className="text-success">Верный: {toCyrillicKey(q.correct_answer)}</span>
                      </div>

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
                        {expandedMistake === key ? 'Скрыть' : 'Объяснение'}
                      </Button>

                      {expandedMistake === key && explanation?.explanation && (
                        <div className="mt-2 rounded bg-muted/50 p-3 text-sm whitespace-pre-line">
                          <MathRenderer content={explanation.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
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
              AI-задания по слабым темам • {latestTestName}
            </p>
          </div>
          <Badge variant="accent">{answeredCount}/{questions.length}</Badge>
        </div>

        <Progress value={(answeredCount / questions.length) * 100} className="mb-6 h-2" />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline">Вопрос {currentIndex + 1} из {questions.length}</Badge>
              <Badge variant="secondary">{translateTopic(currentQ?.topic || '', 'ru')}</Badge>
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
                        <MathRenderer content={value} inline />
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
