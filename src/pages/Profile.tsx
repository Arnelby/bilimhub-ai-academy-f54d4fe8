import { useState, useEffect } from 'react';
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
  Star,
  Loader2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LearningTree } from '@/components/gamification/LearningTree';
import { MasteryLevel } from '@/components/gamification/MasteryNode';
import { Leaderboard } from '@/components/gamification/Leaderboard';

interface Profile {
  name: string | null;
  email: string | null;
  streak: number;
  points: number;
  level: number;
  created_at: string | null;
  leaderboard_visible: boolean;
}

interface TopicProgress {
  id: string;
  title: string;
  level: MasteryLevel;
  progress?: number;
}

interface SavedTerm {
  id: string;
  term: string;
  definition: string | null;
}

export default function Profile() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [savedTerms, setSavedTerms] = useState<SavedTerm[]>([]);
  const [stats, setStats] = useState({
    testsCompleted: 0,
    lessonsCompleted: 0,
    totalStudyTime: '0 ч',
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  async function fetchProfileData() {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.name,
          email: profileData.email,
          streak: profileData.streak || 0,
          points: profileData.points || 0,
          level: profileData.level || 1,
          created_at: profileData.created_at,
          leaderboard_visible: profileData.leaderboard_visible ?? false,
        });
      }

      // Fetch stats
      const { data: testsData } = await supabase
        .from('user_tests')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const { data: lessonsData } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true);

      const scores = testsData?.map(t => t.score || 0) || [];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const totalSeconds = lessonsData?.reduce((acc, l) => acc + (l.time_spent_seconds || 0), 0) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      setStats({
        testsCompleted: testsData?.length || 0,
        lessonsCompleted: lessonsData?.length || 0,
        totalStudyTime: `${hours} ч ${minutes} мин`,
        averageScore: avgScore,
      });

      // Fetch topics with progress
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('subject', 'mathematics')
        .order('order_index');

      const { data: topicProgressData } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user.id);

      const progressMap = new Map(topicProgressData?.map(p => [p.topic_id, p]) || []);

      const masteryMap: Record<string, MasteryLevel> = {
        'mastered': 'mastered',
        'in_progress': 'in-progress',
        'weak': 'weak',
        'not_attempted': 'locked',
      };

      const topicsWithProgress: TopicProgress[] = (topicsData || []).map(topic => {
        const progress = progressMap.get(topic.id);
        let level: MasteryLevel = 'locked';
        
        if (progress?.mastery) {
          level = masteryMap[progress.mastery] || 'locked';
        }

        return {
          id: topic.id,
          title: language === 'ru' && topic.title_ru ? topic.title_ru : topic.title,
          level,
          progress: progress?.progress_percentage || 0,
        };
      });

      setTopics(topicsWithProgress);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      type AchievementType = 'first_lesson' | 'first_test' | 'streak_3' | 'streak_7' | 'streak_30' | 'mastery_5' | 'mastery_10' | 'perfect_score' | 'early_bird' | 'night_owl';
      
      const achievementsList: { id: AchievementType; title: string; description: string; icon?: React.ReactNode }[] = [
        { id: 'first_lesson', title: 'Первый урок', description: 'Завершите первый урок', icon: <BookOpen className="h-6 w-6" /> },
        { id: 'first_test', title: 'Первый тест', description: 'Завершите первый тест', icon: <Target className="h-6 w-6" /> },
        { id: 'streak_3', title: '3-дневный стрик', description: 'Учитесь 3 дня подряд', icon: <Star className="h-6 w-6" /> },
        { id: 'streak_7', title: '7-дневный стрик', description: 'Учитесь 7 дней подряд', icon: <Star className="h-6 w-6" /> },
        { id: 'streak_30', title: '30-дневный стрик', description: 'Учитесь 30 дней подряд', icon: <Trophy className="h-6 w-6" /> },
        { id: 'perfect_score', title: 'Отличник', description: 'Получите 100% на тесте', icon: <Trophy className="h-6 w-6" /> },
      ];

      const unlockedIds = new Set(achievementsData?.map(a => a.achievement) || []);
      setAchievements(achievementsList.map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        progress: a.id.includes('streak') ? Math.min(100, ((profile?.streak || 0) / parseInt(a.id.split('_')[1] || '7')) * 100) : undefined,
      })));

      // Fetch saved terms
      const { data: termsData } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      setSavedTerms(termsData || []);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatJoinDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
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
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile?.name || 'Студент'}</h1>
                  <p className="text-muted-foreground">{profile?.email || user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    Участник с {formatJoinDate(profile?.created_at || null)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StreakBadge streak={profile?.streak || 0} size="lg" />
                <PointsDisplay points={profile?.points || 0} />
                <LevelBadge level={profile?.level || 1} size="lg" />
                <div className="flex items-center gap-2">
                  <Switch
                    id="leaderboard-visible"
                    checked={profile?.leaderboard_visible ?? false}
                    onCheckedChange={async (checked) => {
                      if (!user) return;
                      await supabase
                        .from('profiles')
                        .update({ leaderboard_visible: checked })
                        .eq('id', user.id);
                      setProfile(prev => prev ? { ...prev, leaderboard_visible: checked } : prev);
                    }}
                  />
                  <Label htmlFor="leaderboard-visible" className="text-sm flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Показать в рейтинге
                  </Label>
                </div>
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
                    <p className="text-2xl font-bold">{stats.testsCompleted}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.testsCompleted}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-success/10 text-success mb-2">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{stats.lessonsCompleted}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.lessonsFinished}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-warning/10 text-warning mb-2">
                      <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalStudyTime}</p>
                    <p className="text-sm text-muted-foreground">{t.profile.totalStudyTime}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{stats.averageScore}%</p>
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
                {topics.length > 0 ? (
                  <LearningTree 
                    topics={topics}
                    onTopicClick={(id) => console.log('Topic clicked:', id)}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Начните изучать уроки, чтобы увидеть прогресс
                  </p>
                )}
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
                  {achievements.map((achievement) => (
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
                {savedTerms.length > 0 ? (
                  savedTerms.map((term) => (
                    <div
                      key={term.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="font-medium">{term.term}</p>
                      <p className="text-sm text-muted-foreground">{term.definition}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Сохраненных терминов пока нет
                  </p>
                )}
                {savedTerms.length > 0 && (
                  <Button variant="ghost" className="w-full">
                    Показать все термины
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/dashboard">
                    <Settings className="mr-2 h-4 w-4" />
                    Панель управления
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
