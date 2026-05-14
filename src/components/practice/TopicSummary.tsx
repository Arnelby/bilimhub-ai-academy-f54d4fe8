import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWeakTopics, getStrongTopics, type WeakTopicRow } from '@/lib/topicStats';
import { useTopicName } from '@/hooks/useTopicName';

function TopicBadge({ topic, accuracy, attempts, tone }: { topic: string; accuracy: number; attempts: number; tone: 'weak' | 'strong' }) {
  const name = useTopicName(topic);
  const cls =
    tone === 'weak'
      ? 'border-destructive/40 text-destructive'
      : 'border-success/40 text-success';
  return (
    <Badge variant="outline" className={cls}>
      {name} · {Math.round((accuracy ?? 0) * 100)}% ({attempts})
    </Badge>
  );
}

/**
 * Deterministic topic summary block for the practice results screen.
 * Reads exclusively from `user_topic_stats` (no AI, no recomputation).
 */
export function TopicSummary({ userId }: { userId: string }) {
  const { t } = useTranslation();
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{t('topicSummary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <TrendingDown className="h-4 w-4" />
            {t('topicSummary.weak')} {insufficient && weak.length > 0 ? t('topicSummary.weakInsufficient') : ''}
          </div>
          {weak.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('topicSummary.noWeak')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weak.map((row) => (
                <TopicBadge key={row.topic} topic={row.topic} accuracy={row.accuracy} attempts={row.total_attempts} tone="weak" />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-success">
            <TrendingUp className="h-4 w-4" />
            {t('topicSummary.strong')}
          </div>
          {strong.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('topicSummary.noStrong')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {strong.map((row) => (
                <TopicBadge key={row.topic} topic={row.topic} accuracy={row.accuracy} attempts={row.total_attempts} tone="strong" />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
