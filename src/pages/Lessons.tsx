import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock,
  CheckCircle,
  Play,
  Lock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface Lesson {
  id: string;
  title: string;
  title_ru: string | null;
  topic_id: string | null;
  duration_minutes: number | null;
  difficulty_level: number | null;
  topic?: {
    id: string;
    title: string;
    title_ru: string | null;
    subject: string;
  };
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  progress_percentage: number;
}

interface LessonWithProgress extends Lesson {
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started' | 'locked';
}

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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    async function fetchLessons() {
      if (!user) return;

      try {
        // Fetch all lessons with topics
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*, topic:topics(*)')
          .order('difficulty_level', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        // Map progress to lessons
        const progressMap = new Map<string, LessonProgress>();
        progressData?.forEach(p => {
          progressMap.set(p.lesson_id, p);
        });

        // Combine lessons with progress
        const lessonsWithProgress: LessonWithProgress[] = (lessonsData || []).map((lesson, index) => {
          const progress = progressMap.get(lesson.id);
          let status: LessonWithProgress['status'] = 'not-started';
          
          if (progress?.completed) {
            status = 'completed';
          } else if (progress && progress.progress_percentage > 0) {
            status = 'in-progress';
          } else if (index > 0 && !progressMap.get(lessonsData[index - 1]?.id)?.completed && lesson.difficulty_level && lesson.difficulty_level > 2) {
            status = 'locked';
          }

          return {
            ...lesson,
            progress: progress?.progress_percentage || 0,
            status,
          };
        });

        setLessons(lessonsWithProgress);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [user]);

  const filteredLessons = lessons.filter((lesson) => {
    const title = getLessonTitle(lesson);
    const topicTitle = lesson.topic?.title_ru || lesson.topic?.title || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topicTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || lesson.topic?.subject === selectedSubject;
    const matchesStatus = selectedStatus === 'all' || lesson.status === selectedStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  function getLessonTitle(lesson: Lesson) {
    if (language === 'ru' && lesson.title_ru) return lesson.title_ru;
    return lesson.title;
  }

  function getTopicTitle(lesson: LessonWithProgress) {
    if (language === 'ru' && lesson.topic?.title_ru) return lesson.topic.title_ru;
    return lesson.topic?.title || '';
  }

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

        {/* Featured Interactive Lessons */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <span className="text-3xl">📐</span>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary">
                      {language === 'ru' ? '✨ Интерактивный' : '✨ Interactive'}
                    </Badge>
                    <h3 className="text-xl font-bold">
                      {language === 'ru' ? 'Дроби' : language === 'kg' ? 'Бөлчөктөр' : 'Fractions'}
                    </h3>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/lessons/topic/fractions">
                    {language === 'ru' ? 'Начать урок' : 'Start Lesson'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <span className="text-3xl">🔢</span>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-orange-500/20 text-orange-600">
                      {language === 'ru' ? '✨ Интерактивный' : '✨ Interactive'}
                    </Badge>
                    <h3 className="text-xl font-bold">
                      {language === 'ru' ? 'Степени' : language === 'kg' ? 'Даражалар' : 'Exponents'}
                    </h3>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link to="/lessons/topic/exponents">
                    {language === 'ru' ? 'Начать урок' : 'Start Lesson'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const status = statusConfig[lesson.status];
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
                    <span className="text-xs text-muted-foreground">Уровень {lesson.difficulty_level || 1}</span>
                  </div>
                  <CardTitle className="text-lg">{getLessonTitle(lesson)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getTopicTitle(lesson)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <span>{lesson.duration_minutes || 15} мин</span>
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
