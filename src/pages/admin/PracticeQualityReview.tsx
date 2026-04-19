import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QualityCounts {
  keep: number;
  remove: number;
  review: number;
  unknown: number;
}

interface RunSummary {
  total_processed: number;
  kept: number;
  removed: number;
  skipped_low_confidence: number;
  failed?: number;
}

export default function PracticeQualityReview() {
  const [counts, setCounts] = useState<QualityCounts>({ keep: 0, remove: 0, review: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<RunSummary | null>(null);

  async function loadCounts() {
    setLoading(true);
    try {
      const statuses: Array<keyof QualityCounts> = ['keep', 'remove', 'review', 'unknown'];
      const results = await Promise.all(
        statuses.map((s) =>
          supabase
            .from('practice_questions')
            .select('id', { count: 'exact', head: true })
            .eq('quality_status', s)
        )
      );
      const next: QualityCounts = { keep: 0, remove: 0, review: 0, unknown: 0 };
      statuses.forEach((s, i) => {
        next[s] = results[i].count ?? 0;
      });
      setCounts(next);
    } catch (e) {
      console.error('Failed to load counts', e);
      toast.error('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCounts();
  }, []);

  async function runAiReview() {
    if (running) return;
    if (counts.review === 0) {
      toast.info('Нет вопросов в статусе review');
      return;
    }
    setRunning(true);
    setLastRun(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-classify-review-questions', {
        body: {},
      });
      if (error) throw error;
      const summary = data as RunSummary;
      setLastRun(summary);
      toast.success(
        `Обработано: ${summary.total_processed}. Keep: ${summary.kept}, Remove: ${summary.removed}, Skipped: ${summary.skipped_low_confidence}`
      );
      await loadCounts();
    } catch (e: any) {
      console.error('[AI_REVIEW] run failed', e);
      const msg = e?.message || 'Не удалось запустить AI Review';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Practice Quality Review</h1>
        <p className="text-muted-foreground mt-2">
          Офлайн AI-классификация вопросов со статусом <code>review</code>.
          AI не используется в рантайме практики.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Keep</CardDescription>
            <CardTitle className="text-3xl text-success">{counts.keep}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Review</CardDescription>
            <CardTitle className="text-3xl text-warning">{counts.review}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remove</CardDescription>
            <CardTitle className="text-3xl text-destructive">{counts.remove}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unknown</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{counts.unknown}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Запустить AI Review</CardTitle>
          <CardDescription>
            Обработает до 200 вопросов в статусе <code>review</code> батчами по 50.
            Применяются только классификации с confidence ≥ 0.8.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runAiReview} disabled={running || loading || counts.review === 0} size="lg">
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run AI Review ({counts.review})
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadCounts} disabled={loading || running}>
              Обновить статистику
            </Button>
          </div>

          {lastRun && (
            <div className="border border-border rounded-lg p-4 space-y-2 bg-muted/30">
              <div className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Последний запуск
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Обработано</div>
                  <div className="text-xl font-bold">{lastRun.total_processed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Keep</div>
                  <div className="text-xl font-bold text-success">{lastRun.kept}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Remove</div>
                  <div className="text-xl font-bold text-destructive">{lastRun.removed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Skipped (low conf.)</div>
                  <div className="text-xl font-bold text-warning">{lastRun.skipped_low_confidence}</div>
                </div>
              </div>
              {lastRun.failed ? (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Ошибок AI: {lastRun.failed}
                </Badge>
              ) : null}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            <p>• Confidence threshold: 0.8</p>
            <p>• Batch size: 50 параллельных запросов</p>
            <p>• Модель: google/gemini-2.5-flash</p>
            <p>• Защита: обновляются только записи со статусом <code>review</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
