import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Database, TrendingUp, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title: t('adminDashboard.stats.users'),
      value: stats.totalUsers,
      description: t('adminDashboard.stats.usersDesc'),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: t('adminDashboard.stats.tests'),
      value: stats.totalTests,
      description: t('adminDashboard.stats.testsDesc'),
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('adminDashboard.stats.sessions'),
      value: stats.totalSessions,
      description: t('adminDashboard.stats.sessionsDesc'),
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: t('adminDashboard.stats.ai'),
      value: stats.totalAiRequests,
      description: t('adminDashboard.stats.aiDesc'),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('adminDashboard.heading')}</h2>
        <p className="text-muted-foreground">{t('adminDashboard.subheading')}</p>
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
            <CardTitle>{t('adminDashboard.quickActions.title')}</CardTitle>
            <CardDescription>{t('adminDashboard.quickActions.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/admin/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('adminDashboard.quickActions.analytics')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link to="/admin/settings">
                <Database className="h-4 w-4 mr-2" />
                {t('adminDashboard.quickActions.settings')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('adminDashboard.systemStatus.title')}</CardTitle>
            <CardDescription>{t('adminDashboard.systemStatus.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('adminDashboard.systemStatus.database')}</span>
                <span className="text-sm font-medium text-green-600">{t('adminDashboard.systemStatus.connected')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('adminDashboard.systemStatus.ai')}</span>
                <span className="text-sm font-medium text-green-600">{t('adminDashboard.systemStatus.active')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('adminDashboard.systemStatus.auth')}</span>
                <span className="text-sm font-medium text-green-600">{t('adminDashboard.systemStatus.enabled')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
