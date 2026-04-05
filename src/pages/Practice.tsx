import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Target, AlertTriangle, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
}

interface McqPractice {
  type: 'mcq';
  id: number;
  question_number: number;
  topic: string;
  instruction: string;
  options: Record<string, string>;
  correct_answer: string;
}

type PracticeQuestion = ComparisonPractice | McqPractice;

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

  const loadPractice = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
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
        setLoading(false);
        return;
      }

      const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
      setLatestTestName(matchedConfig ? matchedConfig[1].name : 'Тест');

      // 2. Get question attempts for weak topics
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('topic, is_correct')
        .eq('user_id', user.id)
        .eq('test_attempt_id', latestAttempt.id);

      if (!attempts || attempts.length === 0) {
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

      // Weak = accuracy < 50%
      const weak: string[] = [];
      topicMap.forEach((data, topic) => {
        const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        if (accuracy < 50) weak.push(topic);
      });

      // If few weak topics, also include medium (< 80%)
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

      // 4. Fetch from BOTH tables for variety
      const allQuestions: PracticeQuestion[] = [];

      // Comparison questions from math_questions
      const { data: compData } = await supabase
        .from('math_questions')
        .select('*')
        .in('topic', weak)
        .limit(20);

      if (compData) {
        for (const q of compData) {
          allQuestions.push({
            type: 'comparison',
            id: q.id,
            question_number: q.question_number,
            topic: q.topic,
            instruction: q.instruction,
            column_a: q.column_a,
            column_b: q.column_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: toLatinKey(q.correct_answer),
          });
        }
      }

      // MCQ questions from math_test_questions
      const { data: mcqData } = await supabase
        .from('math_test_questions')
        .select('*')
        .in('topic', weak)
        .limit(20);

      if (mcqData) {
        for (const q of mcqData) {
          const rawOptions = (q.options as Record<string, string>) || {};
          if (Object.keys(rawOptions).length > 0) {
            const normalizedOptions: Record<string, string> = {};
            for (const [k, v] of Object.entries(rawOptions)) {
              normalizedOptions[toLatinKey(k)] = v;
            }
            allQuestions.push({
              type: 'mcq',
              id: q.id,
              question_number: q.question_number,
              topic: q.topic || '',
              instruction: q.instruction || '',
              options: normalizedOptions,
              correct_answer: toLatinKey(q.correct_answer),
            });
          }
        }
      }

      // Shuffle and pick 10-15, prioritizing weak topics with more questions
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);

      // Give more weight to weakest topics
      const weakest = weak.slice(0, 2);
      const prioritized = [
        ...shuffled.filter(q => weakest.includes(q.topic)),
        ...shuffled.filter(q => !weakest.includes(q.topic)),
      ];

      setQuestions(prioritized.slice(0, 12));
    } catch (err) {
      console.error('Practice load error:', err);
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

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
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

  if (showResults) {
    let correct = 0;
    const results = questions.map(q => {
      const userAns = answers[qKey(q)];
      const isCorrect = userAns === q.correct_answer;
      if (isCorrect) correct++;
      return { ...q, userAnswer: userAns, isCorrect };
    });
    const percentage = Math.round((correct / questions.length) * 100);

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Результаты практики</CardTitle>
              <CardDescription>На основе слабых тем из: {latestTestName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className={`text-5xl font-bold ${percentage >= 80 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {percentage}%
                </p>
                <p className="text-muted-foreground mt-1">{correct} из {questions.length} правильных</p>
              </div>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-4 ${r.isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{translateTopic(r.topic, 'ru')}</Badge>
                      {r.isCorrect
                        ? <CheckCircle className="h-5 w-5 text-success" />
                        : <AlertTriangle className="h-5 w-5 text-destructive" />}
                    </div>
                    {r.type === 'comparison' ? (
                      <>
                        {r.instruction && <MathRenderer content={r.instruction} className="text-sm mb-2" />}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Столбец A:</span> <MathRenderer content={r.column_a} inline /></div>
                          <div><span className="text-muted-foreground">Столбец B:</span> <MathRenderer content={r.column_b} inline /></div>
                        </div>
                      </>
                    ) : (
                      <MathRenderer content={r.instruction} className="text-sm mb-2" />
                    )}
                    <p className="text-sm mt-2">
                      Ваш ответ: <strong>{r.userAnswer ? toCyrillicKey(r.userAnswer) : '—'}</strong>
                      {!r.isCorrect && <span className="ml-2 text-success">Верный: {toCyrillicKey(r.correct_answer)}</span>}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/tests')}>К тестам</Button>
                <Button variant="accent" className="flex-1" onClick={() => { setShowResults(false); setAnswers({}); setCurrentIndex(0); loadPractice(); }}>
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Ещё практика
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const renderOptionButton = (key: string, label: string) => {
    const isSelected = answers[qKey(currentQ)] === key;
    const displayKey = toCyrillicKey(key);
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
          {displayKey}
        </span>
        <MathRenderer content={label} inline />
      </button>
    );
  };

  const renderComparisonQuestion = (q: ComparisonPractice) => (
    <>
      {q.instruction ? (
        <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
          <MathRenderer content={q.instruction} />
        </div>
      ) : (
        <p className="mb-5 text-base text-muted-foreground">
          Сравните величины в столбцах A и B. Выберите правильный ответ.
        </p>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец A</p>
          <MathRenderer content={q.column_a} className="text-xl font-bold" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец B</p>
          <MathRenderer content={q.column_b} className="text-xl font-bold" />
        </div>
      </div>
      <div className="space-y-3">
        {[
          { key: 'A', label: 'Величина в столбце A больше' },
          { key: 'B', label: 'Величина в столбце B больше' },
          { key: 'C', label: q.option_c || 'Величины равны' },
          { key: 'D', label: q.option_d || 'Недостаточно информации' },
        ].map(opt => renderOptionButton(opt.key, opt.label))}
      </div>
    </>
  );

  const renderMcqQuestion = (q: McqPractice) => (
    <>
      <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
        <MathRenderer content={q.instruction} />
      </div>
      <div className="space-y-3">
        {Object.entries(q.options).map(([key, value]) =>
          renderOptionButton(key, value)
        )}
      </div>
    </>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-accent" />
            Практика по слабым темам
          </h1>
          <p className="text-muted-foreground">На основе: {latestTestName}</p>
          {weakTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {weakTopics.map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{translateTopic(t, 'ru')}</Badge>
              ))}
            </div>
          )}
        </div>

        <Progress value={(answeredCount / questions.length) * 100} className="h-2 mb-6" />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="accent">Вопрос {currentIndex + 1} из {questions.length}</Badge>
              <Badge variant="outline">{translateTopic(currentQ?.topic || '', 'ru')}</Badge>
            </div>

            {currentQ?.type === 'mcq'
              ? renderMcqQuestion(currentQ)
              : currentQ?.type === 'comparison'
              ? renderComparisonQuestion(currentQ)
              : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button variant="accent" onClick={() => setShowResults(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Показать результаты
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
              Далее
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
