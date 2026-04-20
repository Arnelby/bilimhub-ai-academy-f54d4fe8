import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWeakTopics, getStrongTopics, type WeakTopicRow } from '@/lib/topicStats';
import { translateTopic } from '@/lib/topicTranslations';

/**
 * Deterministic topic summary block for the practice results screen.
 * Reads exclusively from `user_topic_stats` (no AI, no recomputation).
 */
export function TopicSummary({ userId }: { userId: string }) {
  const [weak, setWeak] = useState<WeakTopicRow[]>([]);
  const [strong, setStrong] = useState<WeakTopicRow[]>([]);
  const [insufficient, setInsufficient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [w, s] = await Promise.all([getWeakTopics(userId), getStrongTopics(userId)]);
      if (!mounted) return;
      setWeak(w.topics);
      setInsufficient(w.insufficient_data);
      setStrong(s);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) return null;
  if (weak.length === 0 && strong.length === 0) return null;

  const fmtPct = (a: number) => `${Math.round((a ?? 0) * 100)}%`;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Сводка по темам</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <TrendingDown className="h-4 w-4" />
            Слабые темы {insufficient && weak.length > 0 ? '(мало данных)' : ''}
          </div>
          {weak.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет слабых тем — отличная работа!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weak.map((t) => (
                <Badge key={t.topic} variant="outline" className="border-destructive/40 text-destructive">
                  {translateTopic(t.topic, 'ru')} · {fmtPct(t.accuracy)} ({t.total_attempts})
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-success">
            <TrendingUp className="h-4 w-4" />
            Сильные темы
          </div>
          {strong.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет освоенных тем (нужно ≥80% при ≥3 попытках).</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {strong.map((t) => (
                <Badge key={t.topic} variant="outline" className="border-success/40 text-success">
                  {translateTopic(t.topic, 'ru')} · {fmtPct(t.accuracy)} ({t.total_attempts})
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
