import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, AlertTriangle, CheckCircle, ArrowRight, BookOpen } from "lucide-react";

interface DiagnosticResult {
  overallAccuracy: number;
  weakTopics: { topic: string; accuracy: number }[];
  strongTopics: { topic: string; accuracy: number }[];
}

interface PlanResult {
  diagnostic: DiagnosticResult;
  plan: {
    summary: string;
    focusTopics: string[];
    actions: string[];
  };
  tasks: { topic: string; problems: string[] }[];
  cta: { text: string; action: string };
  error?: string;
}

export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { language } = useLanguage();

  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) fetchSavedPlan();
    else setLoading(false);
  }, [user]);

  const fetchSavedPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ai_learning_plans_v2')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.plan_data) {
        const parsed = data.plan_data as unknown as PlanResult;
        if (parsed.diagnostic) {
          setResult(parsed);
        }
      }
    } catch (e) {
      console.error('Error fetching plan:', e);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user || !session) { navigate('/login'); return; }

    setGenerating(true);
    try {
      // Get diagnostic test answers
      const { data: testData } = await supabase
        .from('user_tests')
        .select('answers, score, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const answers = Array.isArray(testData?.answers) ? testData.answers : [];

      // Transform answers to the format the edge function expects
      const diagnosticAnswers = answers.map((a: any, idx: number) => ({
        questionId: a.questionId || a.question_id || idx + 1,
        topic: a.topic || null,
        isCorrect: a.correct ?? a.isCorrect ?? false,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-learning-plan-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ diagnosticAnswers, language }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate plan');
      const planResult: PlanResult = await response.json();

      if (planResult.error) {
        toast({ title: "Ошибка", description: planResult.error, variant: "destructive" });
        setGenerating(false);
        return;
      }

      // Save to DB
      await supabase.from('ai_learning_plans_v2').update({ is_active: false }).eq('user_id', user.id);
      await supabase.from('ai_learning_plans_v2').insert({
        user_id: user.id,
        plan_data: planResult as any,
        is_active: true,
      });

      setResult(planResult);
      toast({ title: "План создан!", description: "Твой план обучения готов." });
    } catch (e) {
      console.error('Error generating plan:', e);
      toast({ title: "Ошибка", description: "Не удалось создать план", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCTA = () => {
    if (result?.cta?.action === 'go_to_tests') {
      navigate('/tests');
    } else {
      navigate('/lessons');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">План обучения</h1>
          <p className="text-muted-foreground mb-6">Войди, чтобы увидеть план.</p>
          <Button onClick={() => navigate('/login')}>Войти</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">План обучения</h1>
          <Button onClick={generatePlan} disabled={generating} size="sm">
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Генерация...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" />{result ? 'Обновить' : 'Создать план'}</>
            )}
          </Button>
        </div>

        {!result ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">План ещё не создан</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Нажми «Создать план» — система проанализирует твои результаты диагностики и покажет слабые темы.
              </p>
              <Button onClick={generatePlan} disabled={generating}>Создать план</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overall Accuracy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Общий результат диагностики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {result.diagnostic.overallAccuracy}%
                  </div>
                  <div className="flex-1">
                    <Progress value={result.diagnostic.overallAccuracy} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weak Topics */}
            {result.diagnostic.weakTopics.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Слабые темы ({result.diagnostic.weakTopics.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.diagnostic.weakTopics.map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{t.topic}</span>
                        <div className="flex items-center gap-3 w-48">
                          <Progress value={t.accuracy} className="h-2 flex-1" />
                          <span className="text-sm font-mono text-destructive w-10 text-right">{t.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strong Topics */}
            {result.diagnostic.strongTopics.length > 0 && (
              <Card className="border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Сильные темы ({result.diagnostic.strongTopics.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.diagnostic.strongTopics.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-green-700">
                        {t.topic} — {t.accuracy}%
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Summary & Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Рекомендации</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{result.plan.summary}</p>
                {result.plan.actions.length > 0 && (
                  <ul className="space-y-2">
                    {result.plan.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            {result.tasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Задачи для практики</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.tasks.map((task, i) => (
                    <div key={i}>
                      <h3 className="font-medium text-sm mb-2">{task.topic}</h3>
                      <ul className="space-y-1 pl-4">
                        {task.problems.map((p, j) => (
                          <li key={j} className="text-sm text-muted-foreground list-disc">{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* CTA Button */}
            <Button onClick={handleCTA} className="w-full" size="lg">
              {result.cta?.text || "Улучшить слабые темы"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
