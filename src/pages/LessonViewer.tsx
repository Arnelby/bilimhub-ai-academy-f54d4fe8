import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Loader2,
  Lightbulb,
  List,
  Bookmark,
  Clock,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateGamification } from '@/hooks/useGamification';
import { AIChatTutor, AIChatButton } from '@/components/chat/AIChatTutor';

interface LessonContent {
  title: string;
  introduction: string;
  sections: {
    title: string;
    content: string;
    keyPoints?: string[];
    example?: {
      problem: string;
      solution: string;
    };
  }[];
  quiz: {
    question: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[];
  summary: string;
  vocabulary?: { term: string; definition: string }[];
}

export default function LessonViewer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<any>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    async function fetchLesson() {
      if (!lessonId) return;

      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*, topic:topics(*)')
          .eq('id', lessonId)
          .single();

        if (error) throw error;
        setLesson(data);

        // Check if content exists
        if (data.content && typeof data.content === 'object' && Object.keys(data.content).length > 0) {
          const lessonContent = data.content as unknown as LessonContent;
          setContent(lessonContent);
          if (lessonContent.quiz) {
            setQuizAnswers(new Array(lessonContent.quiz.length).fill(null));
          }
        } else {
          // Generate AI content
          await generateContent(data);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить урок',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId, toast]);

  const generateContent = async (lessonData: any) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-lesson', {
        body: {
          topic: lessonData.title_ru || lessonData.title,
          level: lessonData.difficulty_level || 1,
          language: 'ru',
        },
      });

      if (error) throw error;

      setContent(data);
      if (data.quiz) {
        setQuizAnswers(new Array(data.quiz.length).fill(null));
      }

      // Save generated content
      await supabase
        .from('lessons')
        .update({ content: data, is_ai_generated: true })
        .eq('id', lessonId);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Ошибка генерации',
        description: 'Не удалось создать контент урока',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const completeLesson = async () => {
    if (!user || !lessonId) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const correctAnswers = content?.quiz?.filter(
      (q, i) => quizAnswers[i] === q.correctOption
    ).length || 0;
    const totalQuestions = content?.quiz?.length || 1;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    try {
      await supabase.from('user_lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        progress_percentage: 100,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString(),
      });

      // Update gamification (points, streak, achievements)
      await updateGamification({
        userId: user.id,
        pointsEarned: 50,
        lessonCompleted: true,
        topicId: lesson?.topic_id,
      });

      // Single source of truth — recompute next action / plan
      const { updateLearningState } = await import('@/lib/learningState');
      await updateLearningState(user.id);

      toast({
        title: 'Урок завершен! 🎉',
        description: `Вы получили 50 XP! Результат: ${score}%`,
      });

      setShowResults(true);
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  if (loading || generating) {
    return (
      <Layout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">
            {generating ? 'AI создает урок для вас...' : 'Загрузка урока...'}
          </p>
        </div>
      </Layout>
    );
  }

  if (!content) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Урок не найден</h1>
          <Button asChild className="mt-4">
            <Link to="/lessons">Вернуться к урокам</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const totalSections = (content.sections?.length || 0) + 1; // +1 for quiz
  const isQuizSection = currentSection >= (content.sections?.length || 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/lessons">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Назад
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{content.title || lesson?.title_ru || lesson?.title}</h1>
              <p className="text-muted-foreground">{lesson?.topic?.title_ru || lesson?.topic?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="ghost">
              <Clock className="mr-1 h-3 w-3" />
              {lesson?.duration_minutes || 15} мин
            </Badge>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Прогресс урока</span>
            <span>{Math.round((currentSection / totalSections) * 100)}%</span>
          </div>
          <Progress value={(currentSection / totalSections) * 100} className="h-2" />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <List className="h-4 w-4" />
                  Содержание
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {content.sections?.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSection(index)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      currentSection === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {index < currentSection && (
                      <CheckCircle className="mr-2 inline h-4 w-4 text-success" />
                    )}
                    {section.title}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentSection(content.sections?.length || 0)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isQuizSection ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Trophy className="mr-2 inline h-4 w-4" />
                  Проверка знаний
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!isQuizSection ? (
              <Card>
                <CardContent className="p-6">
                  {/* Introduction */}
                  {currentSection === 0 && content.introduction && (
                    <div className="mb-6 rounded-lg bg-accent/10 p-4">
                      <p className="text-lg">{content.introduction}</p>
                    </div>
                  )}

                  {/* Section Content */}
                  <div className="prose max-w-none dark:prose-invert">
                    <h2 className="text-2xl font-bold mb-4">
                      {content.sections?.[currentSection]?.title}
                    </h2>
                    <p className="whitespace-pre-wrap">
                      {content.sections?.[currentSection]?.content}
                    </p>

                    {/* Key Points */}
                    {content.sections?.[currentSection]?.keyPoints && (
                      <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
                        <h4 className="flex items-center gap-2 font-semibold mb-2">
                          <Lightbulb className="h-4 w-4 text-warning" />
                          Ключевые моменты
                        </h4>
                        <ul className="space-y-2">
                          {content.sections[currentSection].keyPoints?.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-1 text-success shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Example */}
                    {content.sections?.[currentSection]?.example && (
                      <div className="mt-6 rounded-lg border p-4">
                        <h4 className="font-semibold mb-2">Пример</h4>
                        <div className="bg-muted rounded p-3 mb-3">
                          <p className="font-medium">
                            {content.sections[currentSection].example?.problem}
                          </p>
                        </div>
                        <p className="whitespace-pre-wrap">
                          {content.sections[currentSection].example?.solution}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Quiz Section */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    Проверка знаний
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {showResults ? (
                    <div className="text-center py-8">
                      <Trophy className="mx-auto h-16 w-16 text-warning mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Урок завершен!</h3>
                      <p className="text-muted-foreground mb-4">
                        Правильных ответов: {content.quiz?.filter((q, i) => quizAnswers[i] === q.correctOption).length || 0} из {content.quiz?.length || 0}
                      </p>
                      <Button variant="accent" asChild>
                        <Link to="/lessons">
                          Продолжить обучение
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    content.quiz?.map((question, qIndex) => (
                      <div key={qIndex} className="rounded-lg border p-4">
                        <p className="font-medium mb-4">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              onClick={() => handleQuizAnswer(qIndex, oIndex)}
                              className={`w-full rounded-lg border p-3 text-left transition-all ${
                                quizAnswers[qIndex] === oIndex
                                  ? 'border-accent bg-accent/10 ring-2 ring-accent'
                                  : 'hover:border-accent/50 hover:bg-muted/50'
                              }`}
                            >
                              {String.fromCharCode(65 + oIndex)}. {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  {!showResults && (
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full"
                      onClick={completeLesson}
                      disabled={quizAnswers.some((a) => a === null)}
                    >
                      Завершить урок
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
              {!isQuizSection && (
                <Button
                  variant="accent"
                  onClick={() => setCurrentSection(currentSection + 1)}
                >
                  Далее
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      {showChat ? (
        <AIChatTutor
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          context={{ lesson: lesson?.title, topic: lesson?.topic?.title }}
        />
      ) : (
        <AIChatButton onClick={() => setShowChat(true)} />
      )}
    </Layout>
  );
}
