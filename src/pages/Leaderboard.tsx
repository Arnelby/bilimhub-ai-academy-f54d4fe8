import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown, Medal, Trophy, Target } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Row {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  tests_completed: number;
  accuracy: number;
  ranking_score: number;
  rank_position: number;
}

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meRowRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('get_global_leaderboard');
      if (cancelled) return;
      if (error) {
        console.error('[LEADERBOARD_ERROR]', error);
        setError('Не удалось загрузить рейтинг');
        setRows([]);
      } else {
        const list = (data || []) as Row[];
        setRows(list);
        const me = user ? list.find(r => r.user_id === user.id) : undefined;
        console.log('[LEADERBOARD_LOADED]', {
          user_id: user?.id ?? null,
          position: me?.rank_position ?? null,
          total_users: list.length,
        });
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const me = useMemo(
    () => (user ? rows.find(r => r.user_id === user.id) : undefined),
    [rows, user]
  );

  // Ensure current user is included in visible window even if outside it
  useEffect(() => {
    if (!me) return;
    if (me.rank_position > visible) {
      // expand visible to include me
      setVisible(Math.max(visible, me.rank_position));
    }
  }, [me, visible]);

  // Auto-scroll to current user once visible
  useEffect(() => {
    if (!loading && me && meRowRef.current) {
      const t = setTimeout(() => {
        meRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [loading, me]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisible(v => Math.min(v + PAGE_SIZE, rows.length));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, visible);

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as Row[]; // 2,1,3

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Профиль
            </Link>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Рейтинг
          </h1>
          <div className="w-20" />
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">{error}</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Пока никто не завершил тесты. Будь первым!
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium */}
            <Card className="mb-6 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-warning" />
                  Топ-3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 items-end pt-4">
                  {podiumOrder.map((r) => {
                    const isFirst = r.rank_position === 1;
                    const isMe = user?.id === r.user_id;
                    const heightClass = isFirst ? 'h-32' : r.rank_position === 2 ? 'h-24' : 'h-20';
                    const bg = isFirst
                      ? 'bg-gradient-to-b from-warning/30 to-warning/5 border-warning/40'
                      : r.rank_position === 2
                      ? 'bg-gradient-to-b from-muted to-muted/30 border-muted-foreground/30'
                      : 'bg-gradient-to-b from-warning/15 to-warning/5 border-warning/20';
                    return (
                      <div key={r.user_id} className="flex flex-col items-center gap-2">
                        <Avatar className={cn('h-14 w-14 border-2', isFirst ? 'border-warning' : 'border-muted', isMe && 'ring-2 ring-accent')}>
                          <AvatarImage src={r.avatar_url || undefined} />
                          <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                            {r.display_name?.charAt(0)?.toUpperCase() || 'У'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium text-center truncate w-full">
                          {r.display_name || 'Студент'}{isMe && ' (вы)'}
                        </p>
                        <div className={cn('w-full rounded-t-md border flex flex-col items-center justify-center', heightClass, bg)}>
                          {isFirst ? (
                            <Crown className="h-5 w-5 text-warning mb-1" />
                          ) : (
                            <Medal className={cn('h-4 w-4 mb-1', r.rank_position === 2 ? 'text-muted-foreground' : 'text-warning/70')} />
                          )}
                          <span className="text-lg font-bold">#{r.rank_position}</span>
                          <span className="text-[10px] text-muted-foreground">{r.ranking_score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Full list */}
            <div className="space-y-2">
              {rest.map((r) => {
                const isMe = user?.id === r.user_id;
                return (
                  <div
                    key={r.user_id}
                    ref={isMe ? meRowRef : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border bg-card p-3 transition-all',
                      isMe && 'ring-2 ring-accent bg-accent/5'
                    )}
                  >
                    <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                      #{r.rank_position}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={r.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {r.display_name?.charAt(0)?.toUpperCase() || 'У'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {r.display_name || 'Студент'}
                        {isMe && <span className="ml-2 text-xs text-accent">(вы)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        {r.accuracy}% • {r.tests_completed} тестов
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{r.ranking_score}</p>
                      <p className="text-[10px] text-muted-foreground">score</p>
                    </div>
                  </div>
                );
              })}

              {visible < rows.length && (
                <div ref={sentinelRef} className="py-6 text-center text-xs text-muted-foreground">
                  Загрузка…
                </div>
              )}
            </div>

            {/* Sticky my-position footer if outside the visible window */}
            {me && me.rank_position > 3 && (
              <div className="mt-6 rounded-lg bg-accent/10 p-3 text-center text-sm">
                Ваше место: <span className="font-bold text-accent">#{me.rank_position}</span> из {rows.length} • score {me.ranking_score}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
