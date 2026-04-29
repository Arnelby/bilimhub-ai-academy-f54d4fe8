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
import { TEST_CONFIG, formatDurationMinutes } from '@/lib/mathTestConfig';
import { parseScore } from '@/lib/scoreUtils';

const TEST_VARIANTS = Object.entries(TEST_CONFIG).map(([id, c]) => ({
  mathTestId: parseInt(id),
  uuid: c.uuid,
  name: c.name,
  table: c.table,
  description: c.description,
  durationMinutes: formatDurationMinutes(c.durationSeconds),
}));

interface UserTestRecord {
  id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
  test_id: string;
}

interface TestAccessRecord {
  test_id: number;
  is_allowed: boolean;
}

export default function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<UserTestRecord[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [accessMap, setAccessMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Get participant_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('participant_id')
          .eq('id', user.id)
          .maybeSingle();

        const participantId = profile?.participant_id;

        const [attemptsRes, q1Res, q2Res, q3Res, q4Res, accessRes] = await Promise.all([
          supabase
            .from('user_tests')
            .select('id, score, total_questions, completed_at, test_id')
            .eq('user_id', user.id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),
          supabase.from('math_questions').select('id').eq('test_id', 1),
          supabase.from('math_questions').select('id').eq('test_id', 2),
          supabase.from('math_questions').select('id').eq('test_id', 3),
          supabase.from('math_test_questions').select('id').eq('test_id', 4),
          participantId
            ? supabase.from('test_access').select('test_id, is_allowed').eq('participant_id', participantId)
            : Promise.resolve({ data: [] as TestAccessRecord[] }),
        ]);

        setAttempts(attemptsRes.data || []);
        setQuestionCounts({
          1: new Set((q1Res.data || []).map(q => q.id)).size,
          2: new Set((q2Res.data || []).map(q => q.id)).size,
          3: new Set((q3Res.data || []).map(q => q.id)).size,
          4: new Set((q4Res.data || []).map(q => q.id)).size,
        });

        // Build access map from test_access table
        const aMap: Record<number, boolean> = { 1: false, 2: false, 3: false, 4: false };
        const accessData = (accessRes as any).data as TestAccessRecord[] || [];
        for (const row of accessData) {
          aMap[row.test_id] = row.is_allowed;
        }
        // HOTFIX OVERRIDE: CTRL-030 (Канатова Адина) — always unlock tests 1 & 2
        if (participantId === 'CTRL-030') {
          aMap[1] = true;
          aMap[2] = true;
          console.log('[TEST_ACCESS_OVERRIDE]', { user_id: 'CTRL-030', override: true, test_1: 'allowed', test_2: 'allowed' });
        }
        // GLOBAL OVERRIDE: Test 3 (mid2) is open to all users regardless of group/progress
        aMap[3] = true;
        console.log('[TEST_ACCESS_OPENED]', { test_id: 3, scope: 'all_users' });
        setAccessMap(aMap);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleStartTest = (mathTestId: number) => {
    localStorage.removeItem('testing58_answers');
    localStorage.removeItem('testing58_currentPage');
    localStorage.removeItem('testing58_startTime');
    navigate(`/tests/math-test/${mathTestId}`);
  };

  const getAttemptsForTest = (uuid: string) =>
    attempts.filter(a => a.test_id === uuid);

  const getScoreParsed = (a: UserTestRecord) => parseScore(a.score, a.total_questions);

  const getBestPct = (testAttempts: UserTestRecord[]) =>
    testAttempts.length > 0 ? Math.max(...testAttempts.map(a => getScoreParsed(a).percentage)) : 0;

  const getAvgPct = (testAttempts: UserTestRecord[]) =>
    testAttempts.length > 0
      ? Math.round(testAttempts.reduce((s, a) => s + getScoreParsed(a).percentage, 0) / testAttempts.length)
      : 0;

  const totalAttempts = attempts.length;
  const overallBest = attempts.length > 0 ? Math.max(...attempts.map(a => getScoreParsed(a).percentage)) : 0;
  const overallAvg = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + getScoreParsed(a).percentage, 0) / attempts.length)
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

        {/* Global Stats */}
        {totalAttempts > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAttempts}</p>
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
                  <p className="text-2xl font-bold">{overallAvg}%</p>
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
                  <p className="text-2xl font-bold">{overallBest}%</p>
                  <p className="text-sm text-muted-foreground">Лучший результат</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Cards */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Доступные тесты</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {TEST_VARIANTS.map((variant) => {
              const testAttempts = getAttemptsForTest(variant.uuid);
              const qCount = questionCounts[variant.mathTestId] || 0;
              // Access controlled by test_access table (backend source of truth)
              const isLocked = !accessMap[variant.mathTestId];
              return (
                <Card key={variant.mathTestId} variant="interactive" className={isLocked ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="accent">Вариант {variant.mathTestId}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{variant.durationMinutes} мин</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{variant.name}</CardTitle>
                    <CardDescription>{qCount} вопросов · {variant.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {testAttempts.length > 0 && (
                      <div className="mb-4 flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Попыток: <strong>{testAttempts.length}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Лучший: <strong className="text-accent">{getBestPct(testAttempts)}%</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Средний: <strong>{getAvgPct(testAttempts)}%</strong>
                        </span>
                      </div>
                    )}
                    {isLocked ? (
                      <Button variant="outline" className="w-full" disabled>
                        🔒 Тест заблокирован
                      </Button>
                    ) : (
                      <Button variant="accent" className="w-full" onClick={() => handleStartTest(variant.mathTestId)}>
                        <Play className="mr-2 h-4 w-4" />
                        {testAttempts.length > 0 ? 'Пройти снова' : 'Начать тест'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Past Attempts */}
        {attempts.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">История попыток</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attempts.map((attempt) => {
                const variant = TEST_VARIANTS.find(v => v.uuid === attempt.test_id);
                return (
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
                      <CardTitle className="text-base">{variant?.name || 'Тест'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Результат</span>
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${
                            getScoreParsed(attempt).percentage >= 80 ? 'text-success' : getScoreParsed(attempt).percentage >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {getScoreParsed(attempt).correct}/{getScoreParsed(attempt).total}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({getScoreParsed(attempt).percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => navigate(`/tests/${attempt.test_id}/results/${attempt.id}`)}>
                          Результаты
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="accent" className="flex-1 gap-2" onClick={() => handleStartTest(variant?.mathTestId || 1)}>
                          <RotateCcw className="h-4 w-4" />
                          Пересдать
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
