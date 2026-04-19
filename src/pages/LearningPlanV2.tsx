import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, AlertTriangle, CheckCircle, BookOpen, Trophy, Clock, XCircle,
  Target, TrendingUp, TrendingDown, Video, Play, Dumbbell,
} from "lucide-react";
import { TEST_CONFIG } from "@/lib/mathTestConfig";
import { translateTopic, parseQuestionId } from "@/lib/topicTranslations";
import { buildDeterministicPlan, type DeterministicPlan } from "@/lib/deterministicPlan";
import { parseScore } from "@/lib/scoreUtils";

interface RecommendedLesson {
  id: string;
  title_ru: string | null;
  title: string;
  topicTitle: string;
}

interface MistakeQuestion {
  questionNumber: string;
  topic: string | null;
  testId: string;
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
 *
 * The plan is persisted in `ai_learning_plans_v2` (legacy table name kept;
 * `plan_data` now stores the deterministic plan, not an AI response).
 */
export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<RecommendedLesson[]>([]);
  const [latestVariantNum, setLatestVariantNum] = useState<string>("");

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

      // 3) Persist plan (overwrite previous active row, no AI involved)
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

      // 4) Score: ONLY from the latest test attempt itself.
      // Topics (weak/medium/strong) use full history, but the headline
      // score must reflect ONLY this last test — otherwise we get nonsense
      // like 217% when total_attempts > total_questions.
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

      // 5) Mistakes from latest test for video review
      const latestTestId = matchedConfig ? `math_test_${matchedConfig[0]}` : "";
      if (latestTestId) {
        const { data: wrongAnswers } = await supabase
          .from("user_answers")
          .select("question_id, topic, test_id")
          .eq("user_id", user.id)
          .eq("test_id", latestTestId)
          .eq("is_correct", false)
          .limit(10);

        if (wrongAnswers) {
          setMistakes(
            wrongAnswers.map((a) => ({
              questionNumber: a.question_id,
              topic: a.topic,
              testId: a.test_id,
            })),
          );
        }
      }

      // 6) Recommended lessons for weak topics
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

        {/* Action — practice on weak topics */}
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
                  practice_questions без участия AI.
                </p>
              </div>
              <Button onClick={() => navigate("/practice")} variant="accent">
                Начать практику
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Weak Topics */}
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
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{translateTopic(t.topic, language)}</span>
                    <div className="flex items-center gap-3 w-48">
                      <Progress value={t.accuracy} className="h-2 flex-1" />
                      <span className="text-sm font-mono text-destructive w-16 text-right">
                        {t.accuracy}% ({t.correct}/{t.total})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medium Topics */}
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
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{translateTopic(t.topic, language)}</span>
                    <div className="flex items-center gap-3 w-48">
                      <Progress value={t.accuracy} className="h-2 flex-1" />
                      <span className="text-sm font-mono text-warning w-16 text-right">
                        {t.accuracy}% ({t.correct}/{t.total})
                      </span>
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

        {/* Mistake Review (video) */}
        {mistakes.length > 0 && (
          <Card className="mb-6 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-accent" />
                Видеоразбор задач
              </CardTitle>
              <CardDescription>
                Видеоразбор задач, в которых были допущены ошибки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mistakes.map((m, i) => {
                  const variantMatch = m.testId.match(/math_test_(\d+)/);
                  const variantNum = variantMatch ? variantMatch[1] : "";
                  const variantKey = variantNum ? `variant${variantNum}` : "";
                  const parsed = parseQuestionId(m.questionNumber);
                  const displayNum = parsed ? parsed.questionNumber : m.questionNumber;
                  const displayVariant = parsed
                    ? parsed.variant
                    : variantNum
                    ? parseInt(variantNum)
                    : null;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          Задача {displayNum}
                          {displayVariant ? ` — Тест вариант ${displayVariant}` : ""}
                        </span>
                        {m.topic && (
                          <p className="text-xs text-muted-foreground">
                            Тема: {translateTopic(m.topic, language)}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to={`/lessons/video/${variantKey}?question=${displayNum}`}
                        >
                          <Video className="mr-1 h-3 w-3" />
                          Смотреть видеоразбор
                        </Link>
                      </Button>
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
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
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
