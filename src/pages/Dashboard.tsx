import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Play,
  Award,
  Calendar,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { LearningTree } from '@/components/gamification/LearningTree';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { MasteryLevel } from '@/components/gamification/MasteryNode';

// Mock data
const mockUser = {
  name: 'Айбек',
  streak: 7,
  points: 2450,
  level: 5,
  weeklyGoal: 70,
  weeklyProgress: 45,
};

const mockTopics: { id: string; title: string; level: MasteryLevel; progress?: number }[] = [
  { id: '1', title: 'Алгебра', level: 'mastered' },
  { id: '2', title: 'Геометрия', level: 'in-progress', progress: 65 },
  { id: '3', title: 'Тригонометрия', level: 'in-progress', progress: 30 },
  { id: '4', title: 'Функции', level: 'weak' },
  { id: '5', title: 'Логарифмы', level: 'locked' },
];

const mockAchievements = [
  { id: '1', title: 'Первый тест', description: 'Завершите первый тест', unlocked: true },
  { id: '2', title: '7-дневный стрик', description: 'Учитесь 7 дней подряд', unlocked: true },
  { id: '3', title: 'Мастер алгебры', description: 'Освойте все темы алгебры', unlocked: false, progress: 80 },
];

const mockRecentActivity = [
  { id: '1', type: 'lesson', title: 'Квадратные уравнения', time: '2 часа назад', score: null },
  { id: '2', type: 'test', title: 'ОРТ Математика - Тест 5', time: 'Вчера', score: 85 },
  { id: '3', type: 'lesson', title: 'Системы неравенств', time: '2 дня назад', score: null },
];

const mockSuggestedLessons = [
  { id: '1', title: 'Прогрессии', subject: 'Математика', difficulty: 'Средний', duration: '25 мин' },
  { id: '2', title: 'Параболы', subject: 'Математика', difficulty: 'Сложный', duration: '30 мин' },
];

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t.dashboard.welcome}, {mockUser.name}! 👋</h1>
            <p className="text-muted-foreground">{t.dashboard.yourProgress}</p>
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={mockUser.streak} />
            <PointsDisplay points={mockUser.points} />
            <LevelBadge level={mockUser.level} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Play className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.dashboard.continueLesson}</h3>
                <p className="text-sm text-muted-foreground">Квадратные уравнения</p>
              </div>
              <Button variant="accent" asChild>
                <Link to="/lessons">
                  {t.common.continue}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success transition-colors group-hover:bg-success group-hover:text-success-foreground">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.dashboard.startTest}</h3>
                <p className="text-sm text-muted-foreground">ОРТ Математика</p>
              </div>
              <Button variant="success" asChild>
                <Link to="/tests">
                  Start
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    {t.dashboard.weeklyGoal}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {mockUser.weeklyProgress}/{mockUser.weeklyGoal} XP
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={(mockUser.weeklyProgress / mockUser.weeklyGoal) * 100} className="h-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Еще {mockUser.weeklyGoal - mockUser.weeklyProgress} XP до цели!
                </p>
              </CardContent>
            </Card>

            {/* Learning Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Дерево обучения - Математика
                </CardTitle>
                <CardDescription>
                  Ваш прогресс по темам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LearningTree 
                  topics={mockTopics}
                  onTopicClick={(id) => console.log('Topic clicked:', id)}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  {t.dashboard.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          activity.type === 'test' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                        }`}>
                          {activity.type === 'test' ? (
                            <Target className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      {activity.score !== null && (
                        <Badge variant="success">{activity.score}%</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* AI Recommendations */}
            <Card variant="accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Рекомендации
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  На основе вашего прогресса, рекомендуем сосредоточиться на теме <strong>Функции</strong>.
                </p>
                <Button variant="accent" size="sm" className="w-full" asChild>
                  <Link to="/lessons">
                    Начать урок
                    <Zap className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Suggested Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  {t.dashboard.suggestedLessons}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockSuggestedLessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    className="block rounded-lg border border-border p-3 transition-all hover:border-accent hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.subject} • {lesson.duration}
                        </p>
                      </div>
                      <Badge variant="ghost">{lesson.difficulty}</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  {t.dashboard.achievements}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                    progress={achievement.progress}
                  />
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/profile">
                    Все достижения
                    <ArrowRight className="ml-2 h-4 w-4" />
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
