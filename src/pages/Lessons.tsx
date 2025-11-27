import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  Play,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for lessons
const mockLessons = [
  {
    id: '1',
    title: 'Квадратные уравнения',
    subject: 'mathematics',
    topic: 'Алгебра',
    level: 1,
    duration: '25 мин',
    progress: 100,
    status: 'completed',
    description: 'Научитесь решать квадратные уравнения различными методами.',
  },
  {
    id: '2',
    title: 'Системы уравнений',
    subject: 'mathematics',
    topic: 'Алгебра',
    level: 2,
    duration: '30 мин',
    progress: 60,
    status: 'in-progress',
    description: 'Методы решения систем линейных и нелинейных уравнений.',
  },
  {
    id: '3',
    title: 'Тригонометрические функции',
    subject: 'mathematics',
    topic: 'Тригонометрия',
    level: 3,
    duration: '35 мин',
    progress: 0,
    status: 'not-started',
    description: 'Основные тригонометрические функции и их свойства.',
  },
  {
    id: '4',
    title: 'Производная функции',
    subject: 'mathematics',
    topic: 'Анализ',
    level: 4,
    duration: '40 мин',
    progress: 0,
    status: 'locked',
    description: 'Понятие производной и правила дифференцирования.',
  },
  {
    id: '5',
    title: 'Геометрические фигуры',
    subject: 'mathematics',
    topic: 'Геометрия',
    level: 1,
    duration: '20 мин',
    progress: 100,
    status: 'completed',
    description: 'Основные свойства плоских геометрических фигур.',
  },
  {
    id: '6',
    title: 'Логарифмы',
    subject: 'mathematics',
    topic: 'Алгебра',
    level: 3,
    duration: '30 мин',
    progress: 25,
    status: 'in-progress',
    description: 'Свойства логарифмов и логарифмические уравнения.',
  },
];

const subjects = [
  { value: 'all', label: 'Все предметы' },
  { value: 'mathematics', label: 'Математика' },
  { value: 'russian', label: 'Русский язык' },
  { value: 'kyrgyz', label: 'Кыргызский язык' },
];

const statusConfig = {
  completed: {
    badge: 'success',
    icon: CheckCircle,
    label: 'Завершено',
  },
  'in-progress': {
    badge: 'warning',
    icon: Play,
    label: 'В процессе',
  },
  'not-started': {
    badge: 'ghost',
    icon: BookOpen,
    label: 'Не начато',
  },
  locked: {
    badge: 'secondary',
    icon: Lock,
    label: 'Заблокировано',
  },
} as const;

export default function Lessons() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredLessons = mockLessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || lesson.subject === selectedSubject;
    const matchesStatus = selectedStatus === 'all' || lesson.status === selectedStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t.lessons.title}</h1>
          <p className="text-muted-foreground">{t.lessons.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.lessons.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t.lessons.allSubjects} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="completed">{t.lessons.mastered}</SelectItem>
              <SelectItem value="in-progress">{t.lessons.inProgress}</SelectItem>
              <SelectItem value="not-started">{t.lessons.notStarted}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lessons Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const status = statusConfig[lesson.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const isLocked = lesson.status === 'locked';

            return (
              <Card
                key={lesson.id}
                variant={isLocked ? 'default' : 'interactive'}
                className={isLocked ? 'opacity-60' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant={status.badge as any} className="mb-2">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Уровень {lesson.level}</span>
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lesson.topic}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  {lesson.progress > 0 && lesson.status !== 'completed' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Прогресс</span>
                        <span>{lesson.progress}%</span>
                      </div>
                      <Progress value={lesson.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration}</span>
                    </div>
                    <Button
                      variant={isLocked ? 'ghost' : lesson.status === 'in-progress' ? 'accent' : 'default'}
                      size="sm"
                      disabled={isLocked}
                      asChild={!isLocked}
                    >
                      {isLocked ? (
                        <span>
                          <Lock className="mr-1 h-4 w-4" />
                          Заблокировано
                        </span>
                      ) : (
                        <Link to={`/lessons/${lesson.id}`}>
                          {lesson.status === 'in-progress' ? t.lessons.continueLesson : t.lessons.startLesson}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredLessons.length === 0 && (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Уроки не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить фильтры поиска</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
