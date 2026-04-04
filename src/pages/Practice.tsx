import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MathRenderer } from '@/components/math/MathRenderer';
import { toCyrillicKey, toLatinKey, TEST_CONFIG } from '@/lib/mathTestConfig';

interface PracticeQuestion {
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

export default function Practice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [latestTestName, setLatestTestName] = useState('');

  useEffect(() => {
    if (user) loadPractice();
  }, [user]);

  async function loadPractice() {
    if (!user) return;
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

      // Determine math_test_id from uuid
      const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
      const mathTestId = matchedConfig ? parseInt(matchedConfig[0]) : null;
      setLatestTestName(matchedConfig ? matchedConfig[1].name : 'Тест');

      // 2. Get question attempts for this test to find weak topics
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

      // Weak = accuracy < 50% OR any incorrect answer
      const weak: string[] = [];
      topicMap.forEach((data, topic) => {
        const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        if (accuracy < 50 || data.correct < data.total) {
          weak.push(topic);
        }
      });

      setWeakTopics(weak);

      if (weak.length === 0) {
        setLoading(false);
        return;
      }

      // 4. Fetch comparison questions from math_questions for weak topics
      // Exclude the exact test_id for variation if possible
      const { data: practiceData } = await supabase
        .from('math_questions')
        .select('*')
        .in('topic', weak)
        .limit(30);

      if (practiceData && practiceData.length > 0) {
        // Shuffle and take 10
        const shuffled = practiceData.sort(() => Math.random() - 0.5).slice(0, 10);
        setQuestions(shuffled.map(q => ({
          id: q.id,
          question_number: q.question_number,
          topic: q.topic,
          instruction: q.instruction,
          column_a: q.column_a,
          column_b: q.column_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: toLatinKey(q.correct_answer),
        })));
      }
    } catch (err) {
      console.error('Practice load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAnswer = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: latinKey }));
  };

  const handleFinish = () => {
    setShowResults(true);
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
      const userAns = answers[q.id];
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
                  <div key={r.id} className={`rounded-lg border p-4 ${r.isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{r.topic}</Badge>
                      {r.isCorrect
                        ? <CheckCircle className="h-5 w-5 text-success" />
                        : <AlertTriangle className="h-5 w-5 text-destructive" />}
                    </div>
                    {r.instruction && <MathRenderer content={r.instruction} className="text-sm mb-2" />}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Столбец A:</span> <MathRenderer content={r.column_a} inline /></div>
                      <div><span className="text-muted-foreground">Столбец B:</span> <MathRenderer content={r.column_b} inline /></div>
                    </div>
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
    const isSelected = answers[currentQ.id] === key;
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Практика по слабым темам</h1>
          <p className="text-muted-foreground">На основе: {latestTestName}</p>
          {weakTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {weakTopics.slice(0, 5).map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </div>

        <Progress value={(answeredCount / questions.length) * 100} className="h-2 mb-6" />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="accent">Вопрос {currentIndex + 1} из {questions.length}</Badge>
              <Badge variant="outline">{currentQ?.topic}</Badge>
            </div>

            {currentQ?.instruction ? (
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
                { key: 'C', label: currentQ.option_c || 'Величины равны' },
                { key: 'D', label: currentQ.option_d || 'Недостаточно информации' },
              ].map(opt => renderOptionButton(opt.key, opt.label))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button variant="accent" onClick={handleFinish}>
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
