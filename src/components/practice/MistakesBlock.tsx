import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, PlayCircle, BookOpen, RefreshCw, ArrowRight, CheckCircle2, Bot } from 'lucide-react';
import { MathRenderer } from '@/components/math/MathRenderer';
import { toCyrillicKey } from '@/lib/mathTestConfig';
import { translateTopic } from '@/lib/topicTranslations';
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

/**
 * Top section of the practice results screen.
 * Replaces the old score-only header with the closed learning loop:
 *   1. Block 1 — list of mistakes with "Watch lesson" + jump-to-review buttons
 *   2. Block 2 — single CTA "Repeat mistakes"
 *   3. Block 3 — next step from user_learning_state
 */
export function MistakesBlock({
  mistakes,
  totalQuestions,
  correctCount,
  state,
  onRepeatMistakes,
}: Props) {
  const navigate = useNavigate();
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const lowAccuracy = percentage < 60 && totalQuestions > 0;

  // === No mistakes — celebrate, then push to next step ===
  if (mistakes.length === 0) {
    return (
      <Card className="mb-6 border-success/40">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-2" />
          <CardTitle className="text-2xl">Без ошибок!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-5xl font-bold">{percentage}%</div>
          <p className="text-muted-foreground">
            {correctCount} из {totalQuestions} правильно
          </p>
          {state && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
              <p className="text-sm font-semibold mb-1">Следующий шаг</p>
              <p className="text-sm text-muted-foreground mb-3">
                {state.next_reason || 'Продолжай обучение'}
              </p>
              <Button onClick={() => navigate(nextActionRoute(state))} variant="accent">
                Продолжить
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Resolve a single CTA target for "Watch lesson now" — first mistake's lesson, else next_target from state.
  const ctaLessonId =
    mistakes.find(m => m.linkedLessonId)?.linkedLessonId ||
    (state?.next_action_type === 'watch_lesson' ? state?.next_target ?? null : null);
  const ctaTopic = mistakes[0]?.topic || state?.current_topic || null;

  return (
    <div className="mb-6 space-y-4">
      {/* Low-accuracy alert — pushes user to lesson immediately */}
      {lowAccuracy && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-destructive">Ты не освоил тему</p>
              <p className="text-sm text-muted-foreground">
                Точность {percentage}%. Прежде чем пробовать снова — посмотри урок.
              </p>
            </div>
            {ctaLessonId ? (
              <Button
                variant="accent"
                onClick={() => navigate(`/lessons/${ctaLessonId}`)}
                className="shrink-0"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Смотреть урок
              </Button>
            ) : ctaTopic ? (
              <Button
                variant="accent"
                onClick={() => navigate(`/lessons?topic=${encodeURIComponent(ctaTopic)}`)}
                className="shrink-0"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Смотреть урок
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Block 1 — Mistakes */}
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Ошибки ({mistakes.length})
            </CardTitle>
            <Badge variant="outline">{percentage}% правильно</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mistakes.map((m, idx) => (
            <div
              key={m.questionId}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">Ошибка #{idx + 1}</p>
                {m.topic && (
                  <Badge variant="secondary" className="shrink-0">
                    {translateTopic(m.topic, 'ru')}
                  </Badge>
                )}
              </div>

              {m.instruction && (
                <div className="text-sm">
                  <MathRenderer content={m.instruction} />
                </div>
              )}

              {m.type === 'comparison' && (m.columnA || m.columnB) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground mb-1">A</p>
                    <MathRenderer content={m.columnA || ''} />
                  </div>
                  <div className="rounded border border-border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground mb-1">B</p>
                    <MathRenderer content={m.columnB || ''} />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-destructive/10 px-2 py-1 text-destructive">
                  Твой ответ: {m.userAnswer ? toCyrillicKey(m.userAnswer) : '—'}
                </span>
                <span className="rounded bg-success/10 px-2 py-1 text-success">
                  Правильный: {toCyrillicKey(m.correctAnswer)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(() => {
                  // 1. Real lesson explicitly linked → open lesson page.
                  if (m.linkedLessonId) {
                    return (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => navigate(`/lessons/${m.linkedLessonId}`)}
                      >
                        <PlayCircle className="mr-1 h-4 w-4" />
                        Смотреть видео
                      </Button>
                    );
                  }
                  // 2. Basic video catalog → deep-link to /video/:id (single video).
                  const basic = basicVideoForTopic(m.topic ?? null);
                  if (basic) {
                    return (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => navigate(
                          `/video/${basic.id}?topic=${encodeURIComponent(translateTopic(m.topic || '', 'ru') || '')}`,
                        )}
                      >
                        <PlayCircle className="mr-1 h-4 w-4" />
                        Базовый урок: {basic.title}
                      </Button>
                    );
                  }
                  // 3. No video at all → AI tutor with question context (no fake button).
                  const params = new URLSearchParams({
                    question: (m.instruction || (m.columnA && m.columnB ? `Сравните: А = ${m.columnA}, Б = ${m.columnB}` : '')).slice(0, 1000),
                    user_answer: m.userAnswer || '',
                    correct_answer: m.correctAnswer || '',
                    topic: m.topic ? translateTopic(m.topic, 'ru') : '',
                  });
                  return (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => navigate(`/ai-tutor?${params.toString()}`)}
                    >
                      <Bot className="mr-1 h-4 w-4" />
                      Открыть AI-наставника
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
                  Читать разбор
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Block 2 — Action */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Закрепи материал</p>
            <p className="text-sm text-muted-foreground">
              Прорешай свои ошибки заново — это уберёт их из слабых тем.
            </p>
          </div>
          <Button onClick={onRepeatMistakes} variant="accent" className="shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить ошибки
          </Button>
        </CardContent>
      </Card>

      {/* Block 3 — Next step */}
      {state && (
        <Card className="border-accent/40">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Дальше
              </p>
              <p className="font-semibold">{state.next_reason || 'Следующий шаг'}</p>
            </div>
            <Button onClick={() => navigate(nextActionRoute(state))} variant="outline" className="shrink-0">
              Перейти
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
