import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/math/MathRenderer";
import { translateTopic } from "@/lib/topicTranslations";
import { formatAnswerKey, sanitizeReviewText } from "@/lib/reviewFormatting";

/**
 * Universal question-review block.
 * 100% data-driven: never calls AI in runtime.
 * All explanations come from the database (math_questions / math_test_questions / practice_questions).
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
  // From DB:
  correctExplanation?: string | null;
  explanationA?: string | null;
  explanationB?: string | null;
  explanationC?: string | null;
  explanationD?: string | null;
  explanationE?: string | null;
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

export function QuestionReview({ data }: { data: QuestionReviewData }) {
  const wrongExpl = !data.isCorrect
    ? pickDistractorExplanation(data.userAnswer, data)
    : null;
  const correctExpl = data.correctExplanation;
  const displayUserAnswer = formatAnswerKey(data.userAnswer);
  const displayCorrectAnswer = formatAnswerKey(data.correctAnswer);
  const wrongExplText = sanitizeReviewText(wrongExpl);
  const correctExplText = sanitizeReviewText(correctExpl);

  return (
    <div
      className={`rounded-lg border p-4 ${
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
        <div className="min-w-0 flex-1 space-y-2">
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
            <div className="text-sm text-muted-foreground">
              {data.instruction && (
                <div className="mb-1">
                  <MathRenderer content={data.instruction} />
                </div>
              )}
              <span>Столбец А: </span>
              <MathRenderer content={data.column_a} />
              <span className="mx-2">vs</span>
              <span>Столбец Б: </span>
              <MathRenderer content={data.column_b} />
            </div>
          )}
          {data.type === "mcq" && data.instruction && (
            <div className="text-sm text-muted-foreground">
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
            <div className="rounded-md border border-destructive/20 bg-background/60 p-3 text-sm">
              <div className="mb-1 font-medium text-destructive">
                ❌ Почему «{displayUserAnswer}» неверно
              </div>
              <div className="text-foreground/90">
                {wrongExplText ? <MathRenderer content={wrongExplText} /> : NO_EXPL}
              </div>
            </div>
          )}

          {/* Correct explanation */}
          <div className="rounded-md border border-success/20 bg-background/60 p-3 text-sm">
            <div className="mb-1 font-medium text-success">
              ✅ Правильное решение
            </div>
            <div className="text-foreground/90">
              {correctExplText ? <MathRenderer content={correctExplText} /> : NO_EXPL}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
