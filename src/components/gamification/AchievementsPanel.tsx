import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, BookOpen, Clock, Sigma, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { loadAchievementsForUser, type AchievementProgress, type AchievementId } from '@/lib/achievementsSource';

const ICONS: Record<AchievementId, React.ReactNode> = {
  first_test:    <Target className="h-6 w-6" />,
  tests_5:       <Target className="h-6 w-6" />,
  tests_10:      <Trophy className="h-6 w-6" />,
  correct_50:    <Star className="h-6 w-6" />,
  correct_100:   <Zap className="h-6 w-6" />,
  correct_500:   <Sigma className="h-6 w-6" />,
  study_1h:      <Clock className="h-6 w-6" />,
  study_5h:      <Clock className="h-6 w-6" />,
  study_10h:     <BookOpen className="h-6 w-6" />,
  perfect_score: <Trophy className="h-6 w-6" />,
  streak_3:      <Flame className="h-6 w-6" />,
  streak_7:      <Flame className="h-6 w-6" />,
};

export function AchievementsPanel() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAchievementsForUser(user.id)
      .then(setAchievements)
      .catch(err => console.error('Achievements load error:', err))
      .finally(() => setLoading(false));
  }, [user]);

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
                {ICONS[a.id]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                {!a.unlocked && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-warning/60 transition-all"
                      style={{ width: `${a.pct}%` }}
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
