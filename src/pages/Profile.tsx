import { Link } from 'react-router-dom';
import { 
  User, 
  Settings,
  BookOpen,
  Target,
  Clock,
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Edit,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LearningTree } from '@/components/gamification/LearningTree';
import { MasteryLevel } from '@/components/gamification/MasteryNode';

// Mock user data
const mockUser = {
  name: 'Айбек Токтогулов',
  email: 'aibek@example.com',
  avatar: null,
  joinDate: 'Январь 2024',
  streak: 7,
  points: 2450,
  level: 5,
  testsCompleted: 15,
  lessonsCompleted: 28,
  totalStudyTime: '24 ч 30 мин',
  averageScore: 82,
};

const mockTopics: { id: string; title: string; level: MasteryLevel; progress?: number }[] = [
  { id: '1', title: 'Алгебра', level: 'mastered' },
  { id: '2', title: 'Геометрия', level: 'in-progress', progress: 75 },
  { id: '3', title: 'Тригонометрия', level: 'in-progress', progress: 45 },
  { id: '4', title: 'Функции', level: 'weak' },
  { id: '5', title: 'Логарифмы', level: 'in-progress', progress: 20 },
  { id: '6', title: 'Статистика', level: 'locked' },
];

const mockAchievements = [
  { id: '1', title: 'Первый урок', description: 'Завершите первый урок', unlocked: true, icon: <BookOpen className="h-6 w-6" /> },
  { id: '2', title: 'Первый тест', description: 'Завершите первый тест', unlocked: true, icon: <Target className="h-6 w-6" /> },
  { id: '3', title: '7-дневный стрик', description: 'Учитесь 7 дней подряд', unlocked: true, icon: <Star className="h-6 w-6" /> },
  { id: '4', title: 'Отличник', description: 'Получите 90%+ на тесте', unlocked: true, icon: <Trophy className="h-6 w-6" /> },
  { id: '5', title: 'Мастер алгебры', description: 'Освойте все темы алгебры', unlocked: false, progress: 80 },
  { id: '6', title: '30-дневный стрик', description: 'Учитесь 30 дней подряд', unlocked: false, progress: 23 },
];

const mockSavedTerms = [
  { id: '1', term: 'Дискриминант', definition: 'D = b² - 4ac' },
  { id: '2', term: 'Теорема Пифагора', definition: 'a² + b² = c²' },
  { id: '3', term: 'Синус', definition: 'sin(α) = противолежащий катет / гипотенуза' },
];

export default function Profile() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{mockUser.name}</h1>
                  <p className="text-muted-foreground">{mockUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    Участник с {mockUser.joinDate}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StreakBadge streak={mockUser.streak} size="lg" />
                <PointsDisplay points={mockUser.points} />
                <LevelBadge level={mockUser.level} size="lg" />
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  {t.profile.editProfile}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {t.profile.statistics}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-accent/10 text-accent mb-2">
                      <Target className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{mockUser.testsCompleted}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.testsCompleted}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-success/10 text-success mb-2">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{mockUser.lessonsCompleted}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.lessonsFinished}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-warning/10 text-warning mb-2">
                      <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{mockUser.totalStudyTime}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.totalStudyTime}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{mockUser.averageScore}%</p>
                    <p className="text-sm text-muted-foreground">{t.profile.averageScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {t.profile.learningTree} - Математика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LearningTree 
                  topics={mockTopics}
                  onTopicClick={(id) => console.log('Topic clicked:', id)}
                />
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  {t.profile.achievements}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mockAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      unlocked={achievement.unlocked}
                      progress={achievement.progress}
                      icon={achievement.icon}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Saved Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  {t.profile.savedVocabulary}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockSavedTerms.map((term) => (
                  <div
                    key={term.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="font-medium">{term.term}</p>
                    <p className="text-sm text-muted-foreground">{term.definition}</p>
                  </div>
                ))}
                <Button variant="ghost" className="w-full">
                  Показать все термины
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Настройки
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/pricing">
                    <Star className="mr-2 h-4 w-4" />
                    Перейти на PRO
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
