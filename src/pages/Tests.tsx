import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Clock, CheckCircle, Play, BarChart3,
  Calendar, Trophy, Loader2, RotateCcw, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TEST_UUID = '00000000-0000-0000-0000-000000000001';
const TEST_NAME = 'Математика — Диагностический тест (Вариант 2)';

interface UserTestRecord {
  id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
}

export default function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<UserTestRecord[]>([]);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [attemptsRes, countRes] = await Promise.all([
          supabase
            .from('user_tests')
            .select('id, score, total_questions, completed_at')
            .eq('user_id', user.id)
            .eq('test_id', TEST_UUID)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),
          supabase
            .from('math_questions')
            .select('id')
            .eq('test_id', 1),
        ]);

        setAttempts(attemptsRes.data || []);

        const seen = new Set<number>();
        (countRes.data || []).forEach(q => seen.add(q.id));
        setQuestionCount(seen.size);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleStartTest = () => {
    localStorage.removeItem('testing58_answers');
    localStorage.removeItem('testing58_currentPage');
    localStorage.removeItem('testing58_startTime');
    navigate('/tests/math-test');
  };

  const latestAttempt = attempts[0];
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score || 0)) : 0;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length)
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Тестирование</h1>
          <p className="text-muted-foreground">Пройдите диагностический тест для анализа знаний</p>
        </div>

        {/* Stats */}
        {attempts.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attempts.length}</p>
                  <p className="text-sm text-muted-foreground">Попыток пройдено</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Средний балл</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bestScore}%</p>
                  <p className="text-sm text-muted-foreground">Лучший результат</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Card */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Доступный тест</h2>
          <Card variant="interactive" className="max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="accent">Диагностика</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>30 мин</span>
                </div>
              </div>
              <CardTitle className="text-lg">{TEST_NAME}</CardTitle>
              <CardDescription>{questionCount} вопросов · Сравнение величин</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                <p>Сравните величины в столбцах A и B</p>
                <p>Выберите один из 4 вариантов ответа</p>
              </div>
              <Button variant="accent" className="w-full" onClick={handleStartTest}>
                <Play className="mr-2 h-4 w-4" />
                {attempts.length > 0 ? 'Пройти снова' : 'Начать тест'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Past Attempts */}
        {attempts.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">История попыток</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Завершено
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('ru-RU') : ''}</span>
                      </div>
                    </div>
                    <CardTitle className="text-base">{TEST_NAME}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Результат</span>
                      <span className={`text-2xl font-bold ${
                        (attempt.score || 0) >= 80 ? 'text-success' : (attempt.score || 0) >= 60 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {attempt.score || 0}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => navigate(`/tests/${TEST_UUID}/results/${attempt.id}`)}>
                        Результаты
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button variant="accent" className="flex-1 gap-2" onClick={handleStartTest}>
                        <RotateCcw className="h-4 w-4" />
                        Пересдать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {attempts.length === 0 && (
          <div className="py-8 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Вы ещё не проходили тест</h3>
            <p className="text-muted-foreground">Пройдите диагностический тест для анализа ваших знаний</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
