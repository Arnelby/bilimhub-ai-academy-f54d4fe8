import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Database, TrendingUp, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Stats {
  totalUsers: number;
  totalTests: number;
  totalSessions: number;
  totalAiRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTests: 0,
    totalSessions: 0,
    totalAiRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [profilesRes, testsRes, sessionsRes, aiLogsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('user_tests').select('id', { count: 'exact', head: true }),
          supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
          supabase.from('ai_request_logs').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalUsers: profilesRes.count || 0,
          totalTests: testsRes.count || 0,
          totalSessions: sessionsRes.count || 0,
          totalAiRequests: aiLogsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Пользователи',
      value: stats.totalUsers,
      description: 'Зарегистрированных студентов',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Тесты пройдены',
      value: stats.totalTests,
      description: 'Всего попыток тестов',
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Сессии',
      value: stats.totalSessions,
      description: 'Учебных сессий',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'AI Запросы',
      value: stats.totalAiRequests,
      description: 'Обращений к AI',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Панель управления</h2>
        <p className="text-muted-foreground">Обзор платформы BilimHub</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Основные задачи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/admin/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Аналитика
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link to="/admin/settings">
                <Database className="h-4 w-4 mr-2" />
                Настройки
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статус системы</CardTitle>
            <CardDescription>Текущее состояние</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">База данных</span>
                <span className="text-sm font-medium text-green-600">Подключена</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Gateway</span>
                <span className="text-sm font-medium text-green-600">Активен</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Аутентификация</span>
                <span className="text-sm font-medium text-green-600">Включена</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
