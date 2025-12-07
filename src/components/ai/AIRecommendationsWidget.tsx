import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  Brain, 
  Loader2, 
  RefreshCw, 
  BookOpen, 
  Target, 
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Recommendation {
  weakTopics: Array<{ topic: string; mastery: number; priority: string; reason: string }>;
  recommendedLessons: Array<{ title: string; topic: string; reason: string; estimatedTime: string }>;
  recommendedMiniTests: Array<{ topic: string; questionCount: number; difficulty: number; reason: string }>;
  errorPatterns: Array<{ pattern: string; frequency: string; solution: string }>;
  motivationMessage: string;
  studyStrategy: string;
  predictedMastery: { currentOverall: number; predictedIn2Weeks: number; predictedIn1Month: number };
  shortTermPlan: { duration: string; goals: string[]; dailyTasks: string[] };
}

export function AIRecommendationsWidget() {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  async function fetchRecommendations() {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setRecommendations({
          weakTopics: data.weak_topics as any[] || [],
          recommendedLessons: data.recommended_lessons as any[] || [],
          recommendedMiniTests: data.recommended_mini_tests as any[] || [],
          errorPatterns: data.error_patterns as any[] || [],
          motivationMessage: data.motivation_message || '',
          studyStrategy: data.study_strategy || '',
          predictedMastery: data.predicted_mastery as any || {},
          shortTermPlan: data.short_term_plan as any || {},
        });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateRecommendations() {
    if (!user || !session) return;
    
    setGenerating(true);
    try {
      // Fetch user data
      const [testsRes, lessonsRes, topicsRes, diagnosticRes] = await Promise.all([
        supabase.from('user_tests').select('*').eq('user_id', user.id).not('completed_at', 'is', null),
        supabase.from('user_lesson_progress').select('*').eq('user_id', user.id),
        supabase.from('user_topic_progress').select('*').eq('user_id', user.id),
        supabase.from('user_diagnostic_profile').select('*').eq('user_id', user.id).single(),
      ]);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommendations-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          testHistory: testsRes.data || [],
          lessonProgress: lessonsRes.data || [],
          topicMastery: topicsRes.data || [],
          diagnosticProfile: diagnosticRes.data,
          language,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: language === 'ru' ? 'Превышен лимит' : 'Rate limit exceeded',
            description: language === 'ru' ? 'Попробуйте позже' : 'Please try again later',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to generate recommendations');
      }

      const result = await response.json();

      // Save to database
      await supabase
        .from('ai_recommendations')
        .update({ is_active: false })
        .eq('user_id', user.id);

      await supabase.from('ai_recommendations').insert({
        user_id: user.id,
        weak_topics: result.weakTopics || [],
        recommended_topics: result.recommendedTopics || [],
        recommended_lessons: result.recommendedLessons || [],
        recommended_mini_tests: result.recommendedMiniTests || [],
        error_patterns: result.errorPatterns || [],
        motivation_message: result.motivationMessage,
        study_strategy: result.studyStrategy,
        predicted_mastery: result.predictedMastery,
        short_term_plan: result.shortTermPlan,
        long_term_plan: result.longTermPlan,
        is_active: true,
      });

      setRecommendations(result);
      
      toast({
        title: language === 'ru' ? 'Рекомендации обновлены!' : 'Recommendations updated!',
        description: language === 'ru' ? 'AI проанализировал ваш прогресс' : 'AI analyzed your progress',
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: language === 'ru' ? 'Не удалось создать рекомендации' : 'Failed to generate recommendations',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {language === 'ru' ? 'AI Рекомендации' : 'AI Recommendations'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {language === 'ru' 
              ? 'Получите персональные рекомендации от AI' 
              : 'Get personalized recommendations from AI'}
          </p>
          <Button onClick={generateRecommendations} disabled={generating}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === 'ru' ? 'Генерация...' : 'Generating...'}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> {language === 'ru' ? 'Получить рекомендации' : 'Get Recommendations'}</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Motivation Message */}
      {recommendations.motivationMessage && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/20 rounded-full">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">{recommendations.motivationMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predicted Progress */}
      {recommendations.predictedMastery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              {language === 'ru' ? 'Прогноз прогресса' : 'Progress Forecast'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Сейчас' : 'Now'}</p>
                <p className="text-2xl font-bold">{recommendations.predictedMastery.currentOverall || 0}%</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Через 2 нед.' : 'In 2 weeks'}</p>
                <p className="text-2xl font-bold text-accent">{recommendations.predictedMastery.predictedIn2Weeks || 0}%</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Через месяц' : 'In 1 month'}</p>
                <p className="text-2xl font-bold text-success">{recommendations.predictedMastery.predictedIn1Month || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak Topics */}
      {recommendations.weakTopics?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {language === 'ru' ? 'Слабые темы' : 'Weak Topics'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={generateRecommendations} disabled={generating}>
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.weakTopics.slice(0, 5).map((topic, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{topic.topic}</span>
                    <Badge variant={topic.priority === 'high' ? 'destructive' : 'warning'}>
                      {topic.priority === 'high' 
                        ? (language === 'ru' ? 'Высокий' : 'High')
                        : (language === 'ru' ? 'Средний' : 'Medium')}
                    </Badge>
                  </div>
                  <Progress value={topic.mastery} className="h-2" />
                  <p className="text-sm text-muted-foreground">{topic.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Lessons */}
      {recommendations.recommendedLessons?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-accent" />
              {language === 'ru' ? 'Рекомендуемые уроки' : 'Recommended Lessons'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendedLessons.slice(0, 3).map((lesson, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">{lesson.reason}</p>
                  </div>
                  <Badge variant="secondary">{lesson.estimatedTime}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/lessons">
                {language === 'ru' ? 'Все уроки' : 'All Lessons'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recommended Mini-Tests */}
      {recommendations.recommendedMiniTests?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-success" />
              {language === 'ru' ? 'Мини-тесты для практики' : 'Practice Mini-Tests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendedMiniTests.slice(0, 3).map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{test.topic}</p>
                    <p className="text-sm text-muted-foreground">{test.reason}</p>
                  </div>
                  <Badge variant="outline">{test.questionCount} {language === 'ru' ? 'вопросов' : 'questions'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Strategy */}
      {recommendations.studyStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              {language === 'ru' ? 'Стратегия обучения' : 'Study Strategy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{recommendations.studyStrategy}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
