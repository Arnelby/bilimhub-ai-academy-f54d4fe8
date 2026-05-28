import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
  streak: number;
  rank: number;
  testsCompleted: number;
  averageScore: number;
}

interface LeaderboardProps {
  limit?: number;
  showTabs?: boolean;
  className?: string;
}

export function Leaderboard({ limit = 10, showTabs = true, className }: LeaderboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  async function fetchLeaderboard() {
    try {
      // Fetch leaderboard-visible profiles via SECURITY DEFINER RPC (returns only safe columns: no email/full_name)
      const { data: visibleData } = await supabase.rpc('get_leaderboard_profiles');

      let pool: any[] = ((visibleData as any[]) || [])
        .slice()
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 50);

      // Always include the current user even if they're not visible to others
      if (user && !pool.find((p: any) => p.id === user.id)) {
        const { data: meRow } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, points, level, streak')
          .eq('id', user.id)
          .maybeSingle();
        if (meRow) pool = [...pool, meRow];
      }

      // Fetch test stats for these users
      const userIds = pool.map(u => u.id);
      const { data: testsData } = userIds.length > 0
        ? await supabase
            .from('user_tests')
            .select('user_id, score, total_questions')
            .in('user_id', userIds)
            .not('completed_at', 'is', null)
        : { data: [] };

      // Calculate per-user accuracy
      const userStats = new Map<string, { count: number; totalPct: number }>();
      for (const t of (testsData || [])) {
        const s = userStats.get(t.user_id) || { count: 0, totalPct: 0 };
        s.count++;
        const total = t.total_questions || 30;
        const score = t.score || 0;
        const pct = score > total ? score : Math.round((score / total) * 100);
        s.totalPct += Math.min(100, Math.max(0, pct));
        userStats.set(t.user_id, s);
      }

      // Sort all by accuracy
      const ranked = pool.map((entry) => {
        const st = userStats.get(entry.id);
        return {
          ...entry,
          name: entry.name,
          rank: 0,
          testsCompleted: st?.count || 0,
          averageScore: st ? Math.round(st.totalPct / st.count) : 0,
        };
      })
        .filter(e => e.testsCompleted > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      // Find user position in full ranking
      const me = user ? ranked.find(r => r.id === user.id) : undefined;
      setUserRank(me ? me.rank : null);

      // Top N + ensure current user is always included even if outside top N
      let topSlice = ranked.slice(0, limit);
      if (me && !topSlice.find(r => r.id === user!.id)) {
        topSlice = [...topSlice, me];
      }
      setLeaders(topSlice);


      // Weekly: reuse safe RPC results, filtered by last_activity_date
      const weeklyData = ((visibleData as any[]) || [])
        .filter((p) => p.last_activity_date)
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, limit);

      const weeklyLeadersData: LeaderboardEntry[] = (weeklyData || []).map((entry, index) => {
        const st = userStats.get(entry.id);
        return {
          ...entry,
          rank: index + 1,
          testsCompleted: st?.count || 0,
          averageScore: st ? Math.round(st.totalPct / st.count) : 0,
        };
      });
      setWeeklyLeaders(weeklyLeadersData);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-warning" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Medal className="h-5 w-5 text-warning/70" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/30';
      case 2:
        return 'bg-gradient-to-r from-muted/50 to-muted/20 border-muted-foreground/30';
      case 3:
        return 'bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20';
      default:
        return '';
    }
  };

  const LeaderboardList = ({ data }: { data: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {data.map((entry) => {
        const isCurrentUser = user?.id === entry.id;
        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-all',
              getRankStyle(entry.rank),
              isCurrentUser && 'ring-2 ring-accent',
              'hover:bg-muted/50'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="bg-accent/10 text-accent">
                {entry.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.name || t('gamification.studentFallback')}
                {isCurrentUser && <span className="ml-2 text-xs text-accent">{t('gamification.youSuffix')}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('gamification.testsAvg', { n: entry.testsCompleted, avg: entry.averageScore })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-accent">{entry.averageScore}%</p>
              <p className="text-xs text-muted-foreground">{t('gamification.accuracy')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showTabs) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            {t('gamification.leadersShort')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardList data={leaders} />
          {userRank && userRank > limit && (
            <div className="mt-4 rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-sm">
                {t('gamification.yourPlace')}: <span className="font-bold text-accent">#{userRank}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          {t('gamification.leaderboardTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alltime">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="alltime" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              {t('gamification.allTime')}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('gamification.thisWeek')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="alltime">
            <LeaderboardList data={leaders} />
          </TabsContent>
          <TabsContent value="weekly">
            <LeaderboardList data={weeklyLeaders} />
          </TabsContent>
        </Tabs>
        {userRank && userRank > limit && (
          <div className="mt-4 rounded-lg bg-accent/10 p-3 text-center">
            <p className="text-sm">
              {t('gamification.yourPlace')}: <span className="font-bold text-accent">#{userRank}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
