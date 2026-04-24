import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Sparkles, ArrowRight } from 'lucide-react';
import { getMasteryForTopic, computeProgress, MASTERY_TARGET_ACCURACY, MASTERY_MIN_ATTEMPTS } from '@/lib/masteryEngine';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * Engagement result block — shown after a practice session.
 *
 * Conveys: «Было X% → стало Y%», прогресс к закрытию темы (10 попыток ИЛИ ≥80%),
 * и кнопку "Добить тему" когда пользователь близко (≥70% прогресса).
 *
 * Snapshot of accuracy "до сессии" хранится в sessionStorage по ключу `pre_acc:<topic>`,
 * который выставляется при старте/загрузке Practice.tsx.
 */
export function TopicProgressDelta({
  userId,
  topic,
  onContinue,
}: {
  userId: string;
  topic: string;
  onContinue: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [beforePct, setBeforePct] = useState<number | null>(null);
  const [afterPct, setAfterPct] = useState<number | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mastered, setMastered] = useState(false);

  useEffect(() => {
    const load = async () => {
      const norm = normalizeAnalyticsTopic(topic);
      const key = `pre_acc:${norm}`;
      const before = sessionStorage.getItem(key);
      const beforeNum = before !== null ? Number(before) : null;

      const row = await getMasteryForTopic(userId, norm);
      if (row) {
        const prog = computeProgress(row);
        const after = Math.round(row.accuracy * 100);
        setAfterPct(after);
        setBeforePct(beforeNum !== null && Number.isFinite(beforeNum) ? Math.round(beforeNum) : after);
        setProgressPct(prog.progress_pct);
        setTotalAttempts(row.total_attempts);

        // Estimate raw attempts (not sessions) needed to close the topic.
        const attemptsByCount = Math.max(0, MASTERY_MIN_ATTEMPTS - row.total_attempts);
        let attemptsByAcc = 0;
        if (row.accuracy < MASTERY_TARGET_ACCURACY) {
          const need = Math.ceil(
            (MASTERY_TARGET_ACCURACY * row.total_attempts - row.correct_answers) / 0.2,
          );
          attemptsByAcc = Math.max(0, need);
        }
        setAttemptsLeft(Math.max(attemptsByCount, attemptsByAcc));
        setMastered(row.status === 'mastered');
      }
      setLoading(false);
    };
    void load();
  }, [userId, topic]);

  if (loading) return null;
  if (afterPct === null) return null;

  const delta = afterPct - (beforePct ?? afterPct);
  const trendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground';
  const almostThere = progressPct >= 70 && !mastered;

  return (
    <Card className="border-2 mb-4 overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Тема</p>
            <h2 className="text-xl font-bold leading-tight">{topic}</h2>
          </div>
          {mastered ? (
            <Badge className="bg-success text-success-foreground gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              Закрыта
            </Badge>
          ) : almostThere ? (
            <Badge className="bg-accent text-accent-foreground gap-1 shrink-0 animate-pulse">
              Почти закрыл!
            </Badge>
          ) : null}
        </div>

        {/* Было → стало */}
        <div className="rounded-lg bg-muted/40 p-4 flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Было</p>
            <p className="text-2xl font-semibold tabular-nums">{beforePct ?? afterPct}%</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Стало</p>
            <p className="text-2xl font-semibold tabular-nums">{afterPct}%</p>
          </div>
          <div className={`text-center ${trendColor}`}>
            <p className="text-xs mb-1 opacity-70">Δ</p>
            <p className="text-2xl font-semibold tabular-nums flex items-center gap-1">
              <TrendIcon className="h-5 w-5" />
              {delta > 0 ? '+' : ''}{delta}
            </p>
          </div>
        </div>

        {/* Прогресс к закрытию темы */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              До закрытия темы
            </span>
            <span className="text-muted-foreground tabular-nums">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {mastered
              ? '🎯 Тема закрыта на 80%+ при 10+ попытках. Отличная работа!'
              : attemptsLeft <= 5
              ? `Осталось ${attemptsLeft} задач до закрытия`
              : `Попыток: ${totalAttempts}/${MASTERY_MIN_ATTEMPTS} • цель: ${Math.round(MASTERY_TARGET_ACCURACY * 100)}%`}
          </p>
        </div>

        {/* CTA */}
        {!mastered && (
          <Button onClick={onContinue} size="lg" className="w-full h-12 text-base">
            {almostThere ? '🔥 Добить тему' : 'Продолжить тему'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
