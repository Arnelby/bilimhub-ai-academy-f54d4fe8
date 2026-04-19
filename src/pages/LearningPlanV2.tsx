import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserGroup } from "@/hooks/useUserGroup";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, AlertTriangle, CheckCircle, BookOpen, Trophy, Clock, XCircle,
  Target, TrendingUp, TrendingDown, Video, Play, Dumbbell, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import { TEST_CONFIG } from "@/lib/mathTestConfig";
import { translateTopic, parseQuestionId } from "@/lib/topicTranslations";
import { buildDeterministicPlan, type DeterministicPlan } from "@/lib/deterministicPlan";
import { parseScore } from "@/lib/scoreUtils";
import { QuestionReview, type QuestionReviewData } from "@/components/review/QuestionReview";

interface RecommendedLesson {
  id: string;
  title_ru: string | null;
  title: string;
  topicTitle: string;
  topicSlug: string;
}

interface MistakeQuestion {
  questionNumber: string;
  topic: string | null;
  testId: string;
  variantNum: string;
  displayNum: number;
  videoLessonId: string;
  // For per-question review (AI group only):
  reviewData?: QuestionReviewData;
}

interface TestAnalysis {
  testName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  plan: DeterministicPlan;
}

/**
 * Learning Plan — fully deterministic and data-driven.
 * NO AI runtime calls. Topics are classified by raw accuracy from
 * question_attempts + practice_responses.
 */
export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isAI } = useUserGroup();

  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<RecommendedLesson[]>([]);
  const [latestVariantNum, setLatestVariantNum] = useState<string>("");
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [openReview, setOpenReview] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAnalysis();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAnalysis = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) Latest completed test
      const { data: latestAttempt } = await supabase
        .from("user_tests")
        .select("id, test_id, score, total_questions, time_taken_seconds, completed_at, participant_id")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestAttempt) {
        setLoading(false);
        return;
      }

      const matchedConfig = Object.entries(TEST_CONFIG).find(
        ([, c]) => c.uuid === latestAttempt.test_id,
      );
      const testName = matchedConfig ? matchedConfig[1].name : "Тест";
      const varNum = matchedConfig ? matchedConfig[0] : "";
      setLatestVariantNum(varNum);

      // 2) Pull ALL accuracy signals: question_attempts + practice_responses
      const [{ data: attempts }, { data: practice }] = await Promise.all([
        supabase
          .from("question_attempts")
          .select("topic, is_correct")
          .eq("user_id", user.id),
        supabase
          .from("practice_responses")
          .select("topic, is_correct")
          .eq("user_id", user.id),
      ]);

      const plan = buildDeterministicPlan([
        ...(attempts || []),
        ...(practice || []),
      ]);

      // 3) Persist plan
      try {
        await supabase
          .from("ai_learning_plans_v2")
          .update({ is_active: false })
          .eq("user_id", user.id);
        await supabase.from("ai_learning_plans_v2").insert({
          user_id: user.id,
          participant_id: latestAttempt.participant_id,
          plan_data: plan as any,
          target_topics: plan.weakTopics.map((t) => t.topic) as any,
          learning_strategy: "deterministic_v1",
          is_active: true,
        });
      } catch (e) {
        console.warn("[PLAN] persist failed (non-blocking):", e);
      }

      // 4) Score: ONLY from the latest test attempt
      const parsed = parseScore(latestAttempt.score, latestAttempt.total_questions);

      setAnalysis({
        testName,
        completedAt: latestAttempt.completed_at || "",
        score: parsed.correct,
        totalQuestions: parsed.total,
        percentage: parsed.percentage,
        timeTakenSeconds: latestAttempt.time_taken_seconds || 0,
        plan,
      });

      // 5) ALL wrong answers from latest test (no limit) + DB explanations
      const latestTestId = matchedConfig ? `math_test_${matchedConfig[0]}` : "";
      if (latestTestId && matchedConfig) {
        const cfg = matchedConfig[1];
        const numericTestId = parseInt(matchedConfig[0]);

        const [{ data: wrongAnswers }, { data: explRows }, { data: progressRows }] = await Promise.all([
          supabase
            .from("user_answers")
            .select("question_id, topic, test_id, selected_option, correct_option")
            .eq("user_id", user.id)
            .eq("test_id", latestTestId)
            .eq("is_correct", false),
          supabase
            .from(cfg.table)
            .select(
              "question_number, topic, instruction, column_a, column_b, " +
                (cfg.table === "math_test_questions" ? "options, " : "") +
                "correct_answer, correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d" +
                (cfg.table === "math_test_questions" ? ", explanation_e" : ""),
            )
            .eq("test_id", numericTestId),
          supabase
            .from("user_lesson_progress")
            .select("lesson_id")
            .eq("user_id", user.id)
            .eq("completed", true)
            .like("lesson_id", `video_variant${varNum}_%`),
        ]);

        // Build watched set
        const watched = new Set<string>();
        for (const p of progressRows || []) {
          if (p.lesson_id) watched.add(p.lesson_id);
        }
        setWatchedVideos(watched);

        // Index DB explanations by display question number
        const explMap = new Map<number, any>();
        for (const row of (explRows as any[]) || []) {
          const displayNum =
            cfg.table === "math_test_questions"
              ? ((row.question_number - 1) % 30) + 1
              : row.question_number;
          explMap.set(displayNum, row);
        }

        // Letter mapping helper for option index → letter
        const idxToLetter = (n: number | null): string | null => {
          if (n === null || n === undefined) return null;
          return ["A", "B", "C", "D", "E"][n] || null;
        };

        if (wrongAnswers) {
          const items: MistakeQuestion[] = wrongAnswers.map((a) => {
            const variantMatch = a.test_id.match(/math_test_(\d+)/);
            const variantNum = variantMatch ? variantMatch[1] : varNum;
            const parsedQ = parseQuestionId(a.question_id);
            const displayNum = parsedQ
              ? parsedQ.questionNumber
              : parseInt(a.question_id) || 0;
            const videoLessonId = `video_variant${variantNum}_${displayNum}`;

            const explRow = explMap.get(displayNum);
            const userLetter = idxToLetter(a.selected_option);
            const correctLetter = explRow?.correct_answer || idxToLetter(a.correct_option) || "";

            const reviewData: QuestionReviewData | undefined = explRow
              ? {
                  questionNumber: displayNum,
                  topic: a.topic || explRow.topic,
                  type: cfg.questionType,
                  instruction: explRow.instruction,
                  column_a: explRow.column_a,
                  column_b: explRow.column_b,
                  options: explRow.options,
                  userAnswer: userLetter,
                  correctAnswer: correctLetter,
                  isCorrect: false,
                  correctExplanation: explRow.correct_explanation,
                  explanationA: explRow.explanation_a,
                  explanationB: explRow.explanation_b,
                  explanationC: explRow.explanation_c,
                  explanationD: explRow.explanation_d,
                  explanationE: explRow.explanation_e,
                  questionCacheId: `${cfg.table === "math_test_questions" ? "mtq" : "mq"}_${numericTestId}_${displayNum}`,
                }
              : undefined;

            return {
              questionNumber: a.question_id,
              topic: a.topic,
              testId: a.test_id,
              variantNum,
              displayNum,
              videoLessonId,
              reviewData,
            };
          });
          // sort by question number
          items.sort((x, y) => x.displayNum - y.displayNum);
          setMistakes(items);
        }
      }

      // 6) Recommended lessons for weak topics (kept)
      if (plan.weakTopics.length > 0) {
        const weakNames = plan.weakTopics.map((w) => w.topic);
        const { data: matchingTopics } = await supabase
          .from("topics")
          .select("id, title, title_ru")
          .in("title", weakNames);

        if (matchingTopics && matchingTopics.length > 0) {
          const topicIds = matchingTopics.map((t) => t.id);
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select("id, title, title_ru, topic_id")
            .in("topic_id", topicIds);

          if (lessonsData) {
            const recLessons: RecommendedLesson[] = lessonsData.map((l) => {
              const topic = matchingTopics.find((t) => t.id === l.topic_id);
              return {
                id: l.id,
                title: l.title,
                title_ru: l.title_ru,
                topicTitle: topic?.title_ru || topic?.title || "",
                topicSlug: topic?.title || "",
              };
            });
            setRecommendedLessons(recLessons);
          }
        }
      }
    } catch (e) {
      console.error("Error loading analysis:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Мой план</h1>
          <p className="text-muted-foreground mb-6">Войдите, чтобы увидеть план.</p>
          <Button onClick={() => navigate("/login")}>Войти</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="container py-12 text-center max-w-lg mx-auto">
          <Target className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Нет данных</h1>
          <p className="text-muted-foreground mb-6">
            Сначала пройдите тест, чтобы система проанализировала ваши знания.
          </p>
          <Button onClick={() => navigate("/tests")}>
            <Target className="mr-2 h-4 w-4" />
            Перейти к тестам
          </Button>
        </div>
      </Layout>
    );
  }

  const {
    percentage,
    score,
    totalQuestions,
    timeTakenSeconds,
    testName,
    completedAt,
    plan,
  } = analysis;
  const { weakTopics, mediumTopics, strongTopics } = plan;

  const getScoreColor = () => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const scoreBadge =
    percentage >= 90
      ? { label: "Отлично!", variant: "success" as const }
      : percentage >= 80
      ? { label: "Хорошо", variant: "success" as const }
      : percentage >= 60
      ? { label: "Удовлетворительно", variant: "warning" as const }
      : { label: "Требуется улучшение", variant: "destructive" as const };

  const groupMode: "ai" | "control" = isAI ? "ai" : "control";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge variant={scoreBadge.variant} className="mb-4 text-lg px-4 py-2">
            <Trophy className="mr-2 h-5 w-5" />
            {scoreBadge.label}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{testName}</h1>
          <p className="text-muted-foreground">
            Завершен {completedAt ? new Date(completedAt).toLocaleDateString("ru-RU") : ""}
          </p>
        </div>

        {/* Score Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className={`text-5xl font-bold ${getScoreColor()}`}>{percentage}%</div>
              <p className="text-muted-foreground mt-2">Общий результат</p>
              <Progress value={percentage} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-3xl font-bold">{score}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Правильно</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <XCircle className="h-6 w-6" />
                    <span className="text-3xl font-bold">{totalQuestions - score}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Неправильно</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Clock className="h-6 w-6" />
                <span className="text-3xl font-bold">
                  {Math.floor(timeTakenSeconds / 60)}:
                  {(timeTakenSeconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <p className="text-muted-foreground mt-2">Время выполнения</p>
            </CardContent>
          </Card>
        </div>

        {/* Action — practice on weak topics (queue + bulk) */}
        {weakTopics.length > 0 && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-accent" />
                  Работа над ошибками
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Тренировка по {weakTopics.length} слабым темам — задачи берутся из банка
                  practice_questions.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() =>
                    navigate(`/practice?topic=${encodeURIComponent(weakTopics[0].topic)}`)
                  }
                  variant="accent"
                >
                  Начать со слабой темы
                </Button>
                <Button onClick={() => navigate("/practice")} variant="outline">
                  Все слабые темы
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weak Topics — each with its own practice button */}
        {weakTopics.length > 0 && (
          <Card className="mb-6 border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Слабые темы ({weakTopics.length})
              </CardTitle>
              <CardDescription>Точность ниже 50% (минимум 3 попытки)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakTopics.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 flex-wrap"
                  >
                    <span className="text-sm flex-1 min-w-[140px]">
                      {translateTopic(t.topic, language)}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-40">
                        <Progress value={t.accuracy} className="h-2 flex-1" />
                        <span className="text-xs font-mono text-destructive w-14 text-right">
                          {t.accuracy}% ({t.correct}/{t.total})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/practice?topic=${encodeURIComponent(t.topic)}`)
                        }
                      >
                        <Dumbbell className="mr-1 h-3 w-3" />
                        Практика
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medium Topics — also with practice buttons */}
        {mediumTopics.length > 0 && (
          <Card className="mb-6 border-warning/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-warning" />
                Средние темы ({mediumTopics.length})
              </CardTitle>
              <CardDescription>Точность от 50% до 75%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mediumTopics.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 flex-wrap"
                  >
                    <span className="text-sm flex-1 min-w-[140px]">
                      {translateTopic(t.topic, language)}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-40">
                        <Progress value={t.accuracy} className="h-2 flex-1" />
                        <span className="text-xs font-mono text-warning w-14 text-right">
                          {t.accuracy}% ({t.correct}/{t.total})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/practice?topic=${encodeURIComponent(t.topic)}`)
                        }
                      >
                        <Dumbbell className="mr-1 h-3 w-3" />
                        Практика
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strong Topics */}
        {strongTopics.length > 0 && (
          <Card className="mb-6 border-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Сильные темы ({strongTopics.length})
              </CardTitle>
              <CardDescription>Точность 75% и выше</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strongTopics.map((t, i) => (
                  <Badge key={i} variant="secondary">
                    {translateTopic(t.topic, language)} — {t.accuracy}%
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mistake Review — ALL wrong questions from latest test */}
        {mistakes.length > 0 && (
          <Card className="mb-6 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-accent" />
                Видеоразбор задач ({mistakes.length})
              </CardTitle>
              <CardDescription>
                Все вопросы, в которых были допущены ошибки в последнем тесте
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mistakes.map((m, i) => {
                  const isWatched = watchedVideos.has(m.videoLessonId);
                  const reviewKey = `${m.testId}_${m.displayNum}`;
                  const isOpen = openReview === reviewKey;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border bg-card overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 py-3 px-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              Задача {m.displayNum}
                              {m.variantNum ? ` — Вариант ${m.variantNum}` : ""}
                            </span>
                            {isWatched && (
                              <Badge variant="success" className="text-[10px] py-0 h-5">
                                <Eye className="mr-1 h-3 w-3" />
                                Просмотрено
                              </Badge>
                            )}
                          </div>
                          {m.topic && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Тема: {translateTopic(m.topic, language)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {m.reviewData && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setOpenReview(isOpen ? null : reviewKey)
                              }
                            >
                              {isOpen ? (
                                <ChevronUp className="mr-1 h-3 w-3" />
                              ) : (
                                <ChevronDown className="mr-1 h-3 w-3" />
                              )}
                              Разбор
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              to={`/lessons/video/variant${m.variantNum}?question=${m.displayNum}`}
                            >
                              <Video className="mr-1 h-3 w-3" />
                              Видеоразбор
                            </Link>
                          </Button>
                        </div>
                      </div>
                      {isOpen && m.reviewData && (
                        <div className="border-t bg-muted/20 p-3">
                          <QuestionReview
                            data={m.reviewData}
                            groupMode={groupMode}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Lessons */}
        {recommendedLessons.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Рекомендуемые базовые уроки
              </CardTitle>
              <CardDescription>Видеоуроки по вашим слабым темам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 gap-3 flex-wrap"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">
                        {lesson.title_ru || lesson.title}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Тема: {lesson.topicTitle}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/lessons">
                        <Play className="mr-1 h-3 w-3" />
                        Смотреть
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Button onClick={() => navigate("/practice")} variant="accent">
            <Dumbbell className="mr-2 h-4 w-4" />
            Практика
          </Button>
          <Button onClick={() => navigate("/tests")} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            К тестам
          </Button>
          {latestVariantNum && (
            <Button asChild variant="outline">
              <Link to={`/lessons/video/variant${latestVariantNum}`}>
                <Video className="mr-2 h-4 w-4" />
                Видеоразборы варианта
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
