import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, PlayCircle, BookOpen, RefreshCw, ArrowRight, CheckCircle2, Bot } from 'lucide-react';
import { SafeMath } from '@/components/review/SafeMath';
import { sanitizeReviewText } from '@/lib/reviewFormatting';
import { toCyrillicKey } from '@/lib/mathTestConfig';
import { useTopicName } from '@/hooks/useTopicName';
import type { LearningState } from '@/lib/learningState';
import { nextActionRoute } from '@/lib/learningState';
import { basicVideoForTopic } from '@/lib/basicVideos';

export interface MistakeItem {
  questionId: string;
  topic: string | null;
  type: 'comparison' | 'mcq';
  instruction: string | null;
  columnA?: string | null;
  columnB?: string | null;
  options?: Record<string, string> | null;
  userAnswer: string | null;
  correctAnswer: string;
  linkedLessonId: string | null;
}

interface Props {
  mistakes: MistakeItem[];
  totalQuestions: number;
  correctCount: number;
  state: LearningState | null;
  onRepeatMistakes: () => void;
}

function TopicBadge({ topic }: { topic: string }) {
  const name = useTopicName(topic);
  return <Badge variant="secondary" className="shrink-0">{name}</Badge>;
}

export function MistakesBlock({
  mistakes,
  totalQuestions,
  correctCount,
  state,
  onRepeatMistakes,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const lowAccuracy = percentage < 60 && totalQuestions > 0;

  // === No mistakes — celebrate, then push to next step ===
  if (mistakes.length === 0) {
    return (
      <Card className="mb-6 border-success/40">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-2" />
          <CardTitle className="text-2xl">{t('mistakes.noMistakesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-5xl font-bold">{percentage}%</div>
          <p className="text-muted-foreground">
            {t('mistakes.ofCorrect', { correct: correctCount, total: totalQuestions })}
          </p>
          {state && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <p className="text-sm font-semibold mb-1">{t('mistakes.nextStep')}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {state.next_reason || t('mistakes.keepLearning')}
              </p>
              <Button onClick={() => navigate(nextActionRoute(state))} variant="accent">
                {t('mistakes.continue')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const ctaLessonId =
    mistakes.find(m => m.linkedLessonId)?.linkedLessonId ||
    (state?.next_action_type === 'watch_lesson' ? state?.next_target ?? null : null);
  const ctaTopic = mistakes[0]?.topic || state?.current_topic || null;
  const ctaBasic = ctaLessonId ? null : basicVideoForTopic(ctaTopic);

  return (
    <div className="mb-6 space-y-4">
      {lowAccuracy && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-destructive">{t('mistakes.lowAccuracyTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('mistakes.lowAccuracyDesc', { percent: percentage })}
              </p>
            </div>
            {ctaLessonId ? (
              <Button
                variant="accent"
                onClick={() => navigate(`/lessons/${ctaLessonId}`)}
                className="shrink-0"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {t('mistakes.watchLesson')}
              </Button>
            ) : ctaBasic ? (
              <Button
                variant="accent"
                onClick={() => navigate(
                  `/video/${ctaBasic.id}?topic=${encodeURIComponent(ctaTopic || '')}`,
                )}
                className="shrink-0"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {t('mistakes.basicLesson')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('mistakes.mistakesCount', { count: mistakes.length })}
            </CardTitle>
            <Badge variant="outline">{t('mistakes.percentCorrect', { percent: percentage })}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mistakes.map((m, idx) => (
            <div
              key={m.questionId}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{t('mistakes.errorN', { n: idx + 1 })}</p>
                {m.topic && <TopicBadge topic={m.topic} />}
              </div>

              {m.instruction && (
                <div className="text-sm">
                  <SafeMath content={sanitizeReviewText(m.instruction) ?? m.instruction} />
                </div>
              )}

              {m.type === 'comparison' && (m.columnA || m.columnB) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground mb-1">A</p>
                    <SafeMath content={m.columnA || ''} />
                  </div>
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground mb-1">B</p>
                    <SafeMath content={m.columnB || ''} />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-destructive/10 px-2 py-1 text-destructive">
                  {t('mistakes.yourAnswer', { value: m.userAnswer ? toCyrillicKey(m.userAnswer) : '—' })}
                </span>
                <span className="rounded bg-success/10 px-2 py-1 text-success">
                  {t('mistakes.correctAnswer', { value: toCyrillicKey(m.correctAnswer) })}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(() => {
                  if (m.linkedLessonId) {
                    return (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => navigate(`/lessons/${m.linkedLessonId}`)}
                      >
                        <PlayCircle className="mr-1 h-4 w-4" />
                        {t('mistakes.watchVideo')}
                      </Button>
                    );
                  }
                  const basic = basicVideoForTopic(m.topic ?? null);
                  if (basic) {
                    return (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => navigate(
                          `/video/${basic.id}?topic=${encodeURIComponent(m.topic || '')}`,
                        )}
                      >
                        <PlayCircle className="mr-1 h-4 w-4" />
                        {t('mistakes.basicLessonNamed', { name: basicVideoTitle(basic) })}
                      </Button>
                    );
                  }
                  console.warn('[VIDEO_MAPPING_FAILED]', { topic: m.topic, questionId: m.questionId });
                  const params = new URLSearchParams({
                    question: (m.instruction || (m.columnA && m.columnB
                      ? t('mistakes.compareLabel', { a: m.columnA, b: m.columnB })
                      : '')).slice(0, 1000),
                    user_answer: m.userAnswer || '',
                    correct_answer: m.correctAnswer || '',
                    topic: m.topic || '',
                  });
                  return (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => navigate(`/ai-tutor?${params.toString()}`)}
                    >
                      <Bot className="mr-1 h-4 w-4" />
                      {t('mistakes.openTutor')}
                    </Button>
                  );
                })()}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById(`review-${m.questionId}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <BookOpen className="mr-1 h-4 w-4" />
                  {t('mistakes.readReview')}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{t('mistakes.consolidate')}</p>
            <p className="text-sm text-muted-foreground">{t('mistakes.consolidateDesc')}</p>
          </div>
          <Button onClick={onRepeatMistakes} variant="accent" className="shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('mistakes.repeatMistakes')}
          </Button>
        </CardContent>
      </Card>

      {state && (
        <Card className="border-accent/40">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t('mistakes.next')}
              </p>
              <p className="font-semibold">{state.next_reason || t('mistakes.nextStep')}</p>
            </div>
            <Button onClick={() => navigate(nextActionRoute(state))} variant="outline" className="shrink-0">
              {t('mistakes.go')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
