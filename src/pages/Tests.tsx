import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Target, 
  Clock, 
  CheckCircle,
  Play,
  BarChart3,
  Calendar,
  Trophy,
  ArrowRight,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Test {
  id: string;
  title: string;
  title_ru: string | null;
  subject: string;
  type: string;
  duration_minutes: number;
  created_at: string;
}

interface UserTest {
  id: string;
  test_id: string;
  score: number | null;
  completed_at: string | null;
  total_questions: number | null;
}

interface TestWithStatus extends Test {
  status: 'available' | 'completed';
  userAttempt?: UserTest;
  questionCount: number;
}

export default function Tests() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState({
    testsCompleted: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: '0 ч',
  });

  // Handle retake test - clears localStorage and navigates to test
  const handleRetakeTest = (testId: string) => {
    // Clear localStorage for this test (using the testing58 keys pattern)
    localStorage.removeItem('testing58_answers');
    localStorage.removeItem('testing58_currentPage');
    localStorage.removeItem('testing58_startTime');
    
    // Navigate to the test
    if (testId === '3fa85f64-5717-4562-b3fc-2c963f66afa6' || testId.includes('testing58')) {
      navigate('/tests/testing58');
    } else {
      navigate(`/tests/${testId}`);
    }
  };

  useEffect(() => {
    async function fetchTests() {
      if (!user) return;

      try {
        // Fetch all tests with question counts
        const { data: testsData, error: testsError } = await supabase
          .from('tests')
          .select('*')
          .order('created_at', { ascending: false });

        if (testsError) throw testsError;

        // Fetch user's completed tests
        const { data: userTests, error: userTestsError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);

        if (userTestsError) throw userTestsError;

        // Fetch question counts for each test
        const { data: questionCounts, error: qError } = await supabase
          .from('questions')
          .select('test_id');

        if (qError) throw qError;

        // Count questions per test
        const questionCountMap: Record<string, number> = {};
        questionCounts?.forEach(q => {
          if (q.test_id) {
            questionCountMap[q.test_id] = (questionCountMap[q.test_id] || 0) + 1;
          }
        });

        // Map tests with their status
        const testsWithStatus: TestWithStatus[] = (testsData || []).map(test => {
          const userAttempt = userTests?.find(ut => ut.test_id === test.id);
          return {
            ...test,
            status: userAttempt?.completed_at ? 'completed' : 'available',
            userAttempt,
            questionCount: questionCountMap[test.id] || 0,
          };
        });

        setTests(testsWithStatus);

        // Calculate stats
        const completedTests = userTests?.filter(t => t.completed_at) || [];
        const scores = completedTests.map(t => t.score || 0);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

        setStats({
          testsCompleted: completedTests.length,
          averageScore: avgScore,
          bestScore: bestScore,
          totalTime: `${Math.round(completedTests.length * 1.5)} ч`,
        });
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTests();
  }, [user]);

  const filteredTests = tests.filter((test) => {
    const matchesSubject = selectedSubject === 'all' || test.subject === selectedSubject;
    const matchesType = selectedType === 'all' || test.type === selectedType;
    return matchesSubject && matchesType;
  });

  const completedTests = filteredTests.filter((test) => test.status === 'completed');
  const availableTests = filteredTests.filter((test) => test.status === 'available');

  const getTestTitle = (test: Test) => {
    if (language === 'ru' && test.title_ru) return test.title_ru;
    return test.title;
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t.tests.title}</h1>
          <p className="text-muted-foreground">{t.tests.subtitle}</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.testsCompleted}</p>
                <p className="text-sm text-muted-foreground">Тестов пройдено</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-sm text-muted-foreground">Средний балл</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bestScore}%</p>
                <p className="text-sm text-muted-foreground">Лучший результат</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTime}</p>
                <p className="text-sm text-muted-foreground">Время на тесты</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Предмет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все предметы</SelectItem>
              <SelectItem value="mathematics">Математика</SelectItem>
              <SelectItem value="russian">Русский язык</SelectItem>
              <SelectItem value="kyrgyz">Кыргызский язык</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Тип теста" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="ort">ОРТ тесты</SelectItem>
              <SelectItem value="practice">Практические</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Доступные тесты</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableTests.map((test) => (
                <Card key={test.id} variant="interactive">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant={test.type === 'ort' ? 'accent' : 'ghost'}>
                        {test.type === 'ort' ? 'ОРТ' : 'Практика'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration_minutes} мин</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{getTestTitle(test)}</CardTitle>
                    <CardDescription>
                      {test.questionCount} вопросов
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {test.type === 'ort' && (
                      <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                        <p>{t.tests.part1}</p>
                        <p>{t.tests.part2}</p>
                      </div>
                    )}
                    <Button variant="accent" className="w-full" asChild>
                      <Link to={test.id === '3fa85f64-5717-4562-b3fc-2c963f66afa6' ? '/tests/testing58' : `/tests/${test.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        {t.tests.startTest}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tests */}
        {completedTests.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Пройденные тесты</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Завершено
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{test.userAttempt?.completed_at ? new Date(test.userAttempt.completed_at).toLocaleDateString('ru-RU') : ''}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{getTestTitle(test)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Результат</span>
                      <span className={`text-2xl font-bold ${
                        (test.userAttempt?.score || 0) >= 80 ? 'text-success' : (test.userAttempt?.score || 0) >= 60 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {test.userAttempt?.score || 0}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/tests/${test.id}/results/${test.userAttempt?.id}`}>
                          {t.tests.viewResults}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="accent" 
                        className="flex-1 gap-2"
                        onClick={() => handleRetakeTest(test.id)}
                      >
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

        {filteredTests.length === 0 && (
          <div className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Тесты не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить фильтры</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
