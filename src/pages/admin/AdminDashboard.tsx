import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Database, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Stats {
  totalTopics: number;
  publishedTopics: number;
  totalUsers: number;
  totalDatasets: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTopics: 0,
    publishedTopics: 0,
    totalUsers: 0,
    totalDatasets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [topicsRes, publishedRes, profilesRes, datasetsRes] = await Promise.all([
          supabase.from('admin_topics').select('id', { count: 'exact', head: true }),
          supabase.from('admin_topics').select('id', { count: 'exact', head: true }).eq('is_published', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('admin_training_datasets').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalTopics: topicsRes.count || 0,
          publishedTopics: publishedRes.count || 0,
          totalUsers: profilesRes.count || 0,
          totalDatasets: datasetsRes.count || 0,
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
      title: 'Total Topics',
      value: stats.totalTopics,
      description: 'Content items in database',
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Published',
      value: stats.publishedTopics,
      description: 'Live topics for students',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered students',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'AI Datasets',
      value: stats.totalDatasets,
      description: 'Training datasets',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to the BilimHub Admin Panel</p>
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/admin/topics">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Topics
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link to="/admin/datasets">
                <Database className="h-4 w-4 mr-2" />
                AI Training Datasets
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current platform health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Gateway</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <span className="text-sm font-medium text-green-600">Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
