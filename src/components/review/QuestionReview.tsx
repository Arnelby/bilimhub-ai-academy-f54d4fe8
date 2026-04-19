import { useState } from "react";
import { CheckCircle, XCircle, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math/MathRenderer";
import { translateTopic } from "@/lib/topicTranslations";
import { formatAnswerKey, sanitizeReviewText } from "@/lib/reviewFormatting";
import { supabase } from "@/integrations/supabase/client";

/**
 * Universal question-review block.
 * 100% data-driven: never calls AI in runtime.
 * All explanations come from the database.
 *
 *  - control group: ONLY static DB explanation (correct + why-wrong from columns)
 *  - ai group: same + button "Разбор с AI" that loads cached row from
 *    ai_mistake_explanations (NO live AI generation)
 */
export interface QuestionReviewData {
  questionNumber: number;
  topic?: string | null;
  type?: "comparison" | "mcq";
  instruction?: string | null;
  column_a?: string | null;
  column_b?: string | null;
  options?: Record<string, string> | null;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  // From DB (math_questions / math_test_questions / practice_questions):
  correctExplanation?: string | null;
  explanationA?: string | null;
  explanationB?: string | null;
  explanationC?: string | null;
  explanationD?: string | null;
  explanationE?: string | null;
  /** Stable ID used for ai_mistake_explanations cache lookup. */
  questionCacheId?: string | null;
}

interface QuestionReviewProps {
  data: QuestionReviewData;
  /** 'ai' shows extra "Разбор с AI" button. 'control' shows only static text. */
  groupMode?: "ai" | "control";
}

const NO_EXPL = "Объяснение отсутствует";

function pickDistractorExplanation(
  letter: string | null,
  d: QuestionReviewData,
): string | null {
  if (!letter) return null;
  const key = letter.toUpperCase();
  switch (key) {
    case "A":
    case "А":
      return d.explanationA ?? null;
    case "B":
    case "Б":
      return d.explanationB ?? null;
    case "C":
    case "В":
      return d.explanationC ?? null;
    case "D":
    case "Г":
      return d.explanationD ?? null;
    case "E":
    case "Д":
      return d.explanationE ?? null;
    default:
      return null;
  }
}

export function QuestionReview({ data, groupMode = "ai" }: QuestionReviewProps) {
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const wrongExpl = !data.isCorrect
    ? pickDistractorExplanation(data.userAnswer, data)
    : null;
  const correctExpl = data.correctExplanation;
  const displayUserAnswer = formatAnswerKey(data.userAnswer);
  const displayCorrectAnswer = formatAnswerKey(data.correctAnswer);
  const wrongExplText = sanitizeReviewText(wrongExpl);
  const correctExplText = sanitizeReviewText(correctExpl);

  const canShowAiBtn =
    groupMode === "ai" && !data.isCorrect && !!data.questionCacheId;

  const loadCachedAiHint = async () => {
    if (!data.questionCacheId) return;
    if (aiOpen) {
      setAiOpen(false);
      return;
    }
    setAiOpen(true);
    if (aiHint) return; // already loaded

    setAiLoading(true);
    setAiError(null);
    try {
      // Cache-only: read pre-generated row, never call live AI from review screen
      const { data: cached, error } = await supabase
        .from("ai_mistake_explanations")
        .select("explanation")
        .eq("question_id", data.questionCacheId)
        .eq("user_answer", (data.userAnswer || "").toUpperCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (cached?.explanation) {
        setAiHint(cached.explanation);
      } else {
        setAiError(
          "Готовый AI-разбор пока недоступен. Используйте текстовый разбор выше.",
        );
      }
    } catch (e) {
      console.error("[REVIEW] cached AI hint fetch failed", e);
      setAiError("Не удалось загрузить AI-разбор.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 overflow-hidden ${
        data.isCorrect
          ? "border-success/30 bg-success/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {data.isCorrect ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 break-words">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              Вопрос {data.questionNumber}
            </span>
            {data.topic && (
              <Badge variant="outline" className="text-xs">
                {translateTopic(data.topic, "ru")}
              </Badge>
            )}
          </div>

          {/* Question content */}
          {data.type === "comparison" && data.column_a && data.column_b && (
            <div className="text-sm text-muted-foreground break-words">
              {data.instruction && (
                <div className="mb-1 break-words">
                  <MathRenderer content={data.instruction} />
                </div>
              )}
              <div className="break-words">
                <span>Столбец А: </span>
                <MathRenderer content={data.column_a} inline />
                <span className="mx-2">vs</span>
                <span>Столбец Б: </span>
                <MathRenderer content={data.column_b} inline />
              </div>
            </div>
          )}
          {data.type === "mcq" && data.instruction && (
            <div className="text-sm text-muted-foreground break-words">
              <MathRenderer content={data.instruction} />
            </div>
          )}

          {/* Answer summary */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>
              Ваш ответ:{" "}
              <span
                className={
                  data.isCorrect
                    ? "font-medium text-success"
                    : "font-medium text-destructive"
                }
              >
                {displayUserAnswer}
              </span>
            </span>
            {!data.isCorrect && (
              <span>
                Правильный:{" "}
                <span className="font-medium text-success">
                  {displayCorrectAnswer}
                </span>
              </span>
            )}
          </div>

          {/* Why your answer was wrong (only if wrong) */}
          {!data.isCorrect && (
            <div className="rounded-md border border-destructive/20 bg-background/60 p-3 text-sm overflow-hidden">
              <div className="mb-1 font-medium text-destructive">
                ❌ Почему «{displayUserAnswer}» неверно
              </div>
              <div className="text-foreground/90 break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:max-w-full">
                {wrongExplText ? <MathRenderer content={wrongExplText} /> : NO_EXPL}
              </div>
            </div>
          )}

          {/* Correct explanation */}
          <div className="rounded-md border border-success/20 bg-background/60 p-3 text-sm overflow-hidden">
            <div className="mb-1 font-medium text-success">
              ✅ Правильное решение
            </div>
            <div className="text-foreground/90 break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:max-w-full">
              {correctExplText ? <MathRenderer content={correctExplText} /> : NO_EXPL}
            </div>
          </div>

          {/* AI hint button (cache-only, AI group only) */}
          {canShowAiBtn && (
            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={loadCachedAiHint}
                disabled={aiLoading}
                className="border-accent/40 text-accent hover:bg-accent/10"
              >
                {aiLoading ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                )}
                {aiOpen ? "Скрыть AI-разбор" : "Разбор с AI"}
              </Button>

              {aiOpen && !aiLoading && (
                <div className="mt-2 rounded-md border border-accent/20 bg-accent/5 p-3 text-sm overflow-hidden">
                  {aiError ? (
                    <p className="text-muted-foreground">{aiError}</p>
                  ) : aiHint ? (
                    <div className="text-foreground/90 break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:max-w-full">
                      <MathRenderer content={aiHint} />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
