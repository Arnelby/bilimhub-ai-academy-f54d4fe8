import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Clock, 
  CheckCircle,
  Play,
  BarChart3,
  Calendar,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for tests
const mockTests = [
  {
    id: '1',
    title: 'ОРТ Математика - Тест 1',
    subject: 'mathematics',
    type: 'ort',
    questions: 60,
    duration: '90 мин',
    status: 'completed',
    score: 85,
    date: '2024-01-15',
  },
  {
    id: '2',
    title: 'ОРТ Математика - Тест 2',
    subject: 'mathematics',
    type: 'ort',
    questions: 60,
    duration: '90 мин',
    status: 'completed',
    score: 78,
    date: '2024-01-18',
  },
  {
    id: '3',
    title: 'ОРТ Математика - Тест 3',
    subject: 'mathematics',
    type: 'ort',
    questions: 60,
    duration: '90 мин',
    status: 'available',
    score: null,
    date: null,
  },
  {
    id: '4',
    title: 'Алгебра - Практический тест',
    subject: 'mathematics',
    type: 'practice',
    questions: 20,
    duration: '30 мин',
    status: 'available',
    score: null,
    date: null,
  },
  {
    id: '5',
    title: 'Геометрия - Практический тест',
    subject: 'mathematics',
    type: 'practice',
    questions: 15,
    duration: '25 мин',
    status: 'completed',
    score: 92,
    date: '2024-01-20',
  },
];

const mockStats = {
  testsCompleted: 12,
  averageScore: 82,
  bestScore: 95,
  totalTime: '18 ч',
};

export default function Tests() {
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredTests = mockTests.filter((test) => {
    const matchesSubject = selectedSubject === 'all' || test.subject === selectedSubject;
    const matchesType = selectedType === 'all' || test.type === selectedType;
    return matchesSubject && matchesType;
  });

  const completedTests = filteredTests.filter((test) => test.status === 'completed');
  const availableTests = filteredTests.filter((test) => test.status === 'available');

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
                <p className="text-2xl font-bold">{mockStats.testsCompleted}</p>
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
                <p className="text-2xl font-bold">{mockStats.averageScore}%</p>
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
                <p className="text-2xl font-bold">{mockStats.bestScore}%</p>
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
                <p className="text-2xl font-bold">{mockStats.totalTime}</p>
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
                        <span>{test.duration}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription>
                      {test.questions} вопросов
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
                      <Link to={`/tests/${test.id}`}>
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
                        <span>{test.date}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Результат</span>
                      <span className={`text-2xl font-bold ${
                        test.score! >= 80 ? 'text-success' : test.score! >= 60 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {test.score}%
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/tests/${test.id}/results`}>
                        {t.tests.viewResults}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
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
