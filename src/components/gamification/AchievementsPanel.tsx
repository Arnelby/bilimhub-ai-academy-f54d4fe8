import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, BookOpen, Clock, Calculator, Sigma } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export function AchievementsPanel() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  async function loadAchievements() {
    if (!user) return;
    try {
      const [testsRes, answersRes, sessionsRes, unlockedRes] = await Promise.all([
        supabase.from('user_tests').select('id, score, completed_at').eq('user_id', user.id).not('completed_at', 'is', null),
        supabase.from('user_answers').select('is_correct').eq('user_id', user.id),
        supabase.from('user_sessions').select('duration_seconds').eq('user_id', user.id),
        supabase.from('user_achievements').select('achievement, unlocked_at').eq('user_id', user.id),
      ]);

      const tests = testsRes.data || [];
      const answers = answersRes.data || [];
      const sessions = sessionsRes.data || [];
      const unlocked = new Set((unlockedRes.data || []).map(a => a.achievement));

      const correctCount = answers.filter(a => a.is_correct).length;
      const totalStudyHours = sessions.reduce((s, se) => s + (se.duration_seconds || 0), 0) / 3600;
      const testCount = tests.length;

      const allAchievements: Achievement[] = [
        {
          id: 'first_test',
          icon: <Target className="h-6 w-6" />,
          title: 'Первый тест',
          description: 'Пройдите свой первый тест',
          unlocked: testCount >= 1 || unlocked.has('first_test'),
          progress: Math.min(testCount, 1),
          target: 1,
        },
        {
          id: 'tests_5',
          icon: <Target className="h-6 w-6" />,
          title: '5 тестов',
          description: 'Пройдите 5 тестов',
          unlocked: testCount >= 5,
          progress: Math.min(testCount, 5),
          target: 5,
        },
        {
          id: 'tests_10',
          icon: <Trophy className="h-6 w-6" />,
          title: '10 тестов',
          description: 'Пройдите 10 тестов',
          unlocked: testCount >= 10,
          progress: Math.min(testCount, 10),
          target: 10,
        },
        {
          id: 'correct_50',
          icon: <Star className="h-6 w-6" />,
          title: '50 правильных',
          description: '50 правильных ответов',
          unlocked: correctCount >= 50,
          progress: Math.min(correctCount, 50),
          target: 50,
        },
        {
          id: 'correct_100',
          icon: <Zap className="h-6 w-6" />,
          title: '100 правильных',
          description: '100 правильных ответов',
          unlocked: correctCount >= 100,
          progress: Math.min(correctCount, 100),
          target: 100,
        },
        {
          id: 'correct_500',
          icon: <Sigma className="h-6 w-6" />,
          title: '500 правильных',
          description: '500 правильных ответов',
          unlocked: correctCount >= 500,
          progress: Math.min(correctCount, 500),
          target: 500,
        },
        {
          id: 'study_1h',
          icon: <Clock className="h-6 w-6" />,
          title: '1 час обучения',
          description: 'Проведите 1 час на платформе',
          unlocked: totalStudyHours >= 1,
          progress: Math.min(Math.round(totalStudyHours * 10) / 10, 1),
          target: 1,
        },
        {
          id: 'study_5h',
          icon: <Clock className="h-6 w-6" />,
          title: '5 часов обучения',
          description: 'Проведите 5 часов на платформе',
          unlocked: totalStudyHours >= 5,
          progress: Math.min(Math.round(totalStudyHours * 10) / 10, 5),
          target: 5,
        },
        {
          id: 'study_10h',
          icon: <BookOpen className="h-6 w-6" />,
          title: '10 часов обучения',
          description: 'Проведите 10 часов на платформе',
          unlocked: totalStudyHours >= 10,
          progress: Math.min(Math.round(totalStudyHours * 10) / 10, 10),
          target: 10,
        },
        {
          id: 'perfect_score',
          icon: <Trophy className="h-6 w-6" />,
          title: 'Идеальный результат',
          description: 'Получите 100% за тест',
          unlocked: tests.some(t => t.score === 100) || unlocked.has('perfect_score'),
        },
        {
          id: 'algebra_master',
          icon: <Calculator className="h-6 w-6" />,
          title: 'Мастер алгебры',
          description: 'Решите 30 задач по алгебре',
          unlocked: false, // Would need topic-specific counting
        },
        {
          id: 'geometry_master',
          icon: <Sigma className="h-6 w-6" />,
          title: 'Мастер геометрии',
          description: 'Решите 30 задач по геометрии',
          unlocked: false,
        },
      ];

      setAchievements(allAchievements);
    } catch (err) {
      console.error('Achievements load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          Достижения
          <Badge variant="secondary" className="ml-auto">{unlockedCount}/{achievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                a.unlocked
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-border bg-muted/30 opacity-60'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                a.unlocked ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
              }`}>
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                {a.target && !a.unlocked && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-warning/60 transition-all"
                      style={{ width: `${((a.progress || 0) / a.target) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              {a.unlocked && (
                <Star className="h-4 w-4 shrink-0 text-warning fill-warning" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
