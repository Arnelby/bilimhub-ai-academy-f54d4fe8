import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { LessonData } from '@/hooks/useLessonData';
import { Sparkles, Eye, Ear, BookOpen, Puzzle, Zap, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DynamicLessonsTabProps {
  data: LessonData['dynamic_lessons'];
  topicId?: string;
}

type LearningStyle = 'visual' | 'auditory' | 'text-based' | 'problem-solver' | 'adhd-friendly';

interface GeneratedLesson {
  status: string;
  topic: string;
  learning_style: string;
  lesson: {
    introduction: string;
    core_lesson: string;
    weakness_training: Array<{
      area: string;
      explanation: string;
      example: string;
      exercises: string[];
      tip: string;
    }>;
    practice_questions: Array<{
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }>;
    final_summary: string;
  };
}

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  visual: <Eye className="h-5 w-5" />,
  auditory: <Ear className="h-5 w-5" />,
  'text-based': <BookOpen className="h-5 w-5" />,
  'problem-solver': <Puzzle className="h-5 w-5" />,
  'adhd-friendly': <Zap className="h-5 w-5" />,
};

export function DynamicLessonsTab({ data, topicId = 'fractions' }: DynamicLessonsTabProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const t = {
    title: language === 'ru' ? 'AI Урок' : language === 'kg' ? 'AI Сабак' : 'AI Lesson',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окуу стилин тандаңыз' : 'Select Your Learning Style',
    visual: language === 'ru' ? 'Визуальный' : language === 'kg' ? 'Визуалдык' : 'Visual',
    auditory: language === 'ru' ? 'Аудиальный' : language === 'kg' ? 'Аудиалдык' : 'Auditory',
    'text-based': language === 'ru' ? 'Текстовый' : language === 'kg' ? 'Тексттик' : 'Text-based',
    'problem-solver': language === 'ru' ? 'Практический' : language === 'kg' ? 'Практикалык' : 'Problem-solver',
    'adhd-friendly': language === 'ru' ? 'СДВГ-дружественный' : language === 'kg' ? 'ADHD-достук' : 'ADHD-friendly',
    changeStyle: language === 'ru' ? 'Изменить стиль' : language === 'kg' ? 'Стилди өзгөртүү' : 'Change Style',
    generating: language === 'ru' ? 'Генерация урока...' : language === 'kg' ? 'Сабак түзүлүүдө...' : 'Generating lesson...',
    introduction: language === 'ru' ? 'Введение' : language === 'kg' ? 'Киришүү' : 'Introduction',
    coreLesson: language === 'ru' ? 'Основной материал' : language === 'kg' ? 'Негизги материал' : 'Core Lesson',
    weaknessTraining: language === 'ru' ? 'Работа над слабыми местами' : language === 'kg' ? 'Алсыз жерлерди жакшыртуу' : 'Weakness Training',
    practice: language === 'ru' ? 'Практика' : language === 'kg' ? 'Практика' : 'Practice',
    summary: language === 'ru' ? 'Итоги' : language === 'kg' ? 'Жыйынтык' : 'Summary',
    tip: language === 'ru' ? 'Совет' : language === 'kg' ? 'Кеңеш' : 'Tip',
    checkAnswers: language === 'ru' ? 'Проверить ответы' : language === 'kg' ? 'Жоопторду текшерүү' : 'Check Answers',
    tryAgain: language === 'ru' ? 'Попробовать снова' : language === 'kg' ? 'Кайра аракет' : 'Try Again',
  };

  const styleDescriptions: Record<LearningStyle, string> = {
    visual: language === 'ru' 
      ? 'Обучение через изображения' 
      : language === 'kg' 
        ? 'Сүрөттөр аркылуу окуу'
        : 'Learning through images',
    auditory: language === 'ru'
      ? 'Обучение через прослушивание'
      : language === 'kg'
        ? 'Угуу аркылуу окуу'
        : 'Learning through listening',
    'text-based': language === 'ru'
      ? 'Обучение через чтение'
      : language === 'kg'
        ? 'Окуу аркылуу'
        : 'Learning through reading',
    'problem-solver': language === 'ru'
      ? 'Обучение через практику'
      : language === 'kg'
        ? 'Практика аркылуу окуу'
        : 'Learning through practice',
    'adhd-friendly': language === 'ru'
      ? 'Короткие интерактивные уроки'
      : language === 'kg'
        ? 'Кыска интерактивдүү сабактар'
        : 'Short interactive lessons',
  };

  const fetchStudentResults = async () => {
    if (!user) return null;
    
    try {
      // Get mini test results for this topic
      const { data: miniTestResults } = await supabase
        .from('mini_test_results')
        .select('score, total_questions, answers')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Get user tests results
      const { data: testResults } = await supabase
        .from('user_tests')
        .select('score, total_questions, answers')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Calculate accuracy and identify weak areas
      let totalCorrect = 0;
      let totalQuestions = 0;
      const weakAreas: string[] = [];

      if (miniTestResults) {
        miniTestResults.forEach(r => {
          totalCorrect += r.score || 0;
          totalQuestions += r.total_questions || 0;
        });
      }

      if (testResults) {
        testResults.forEach(r => {
          totalCorrect += r.score || 0;
          totalQuestions += r.total_questions || 0;
        });
      }

      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 50;

      // Identify weak areas based on topic
      if (topicId === 'fractions') {
        if (accuracy < 60) {
          weakAreas.push('Сложение дробей', 'Вычитание дробей');
        }
        if (accuracy < 80) {
          weakAreas.push('Умножение дробей', 'Деление дробей');
        }
      }

      return {
        accuracy,
        testsCompleted: (miniTestResults?.length || 0) + (testResults?.length || 0),
        weakAreas,
        strongAreas: accuracy > 70 ? ['Основы дробей'] : [],
        recentMistakes: []
      };
    } catch (error) {
      console.error('Error fetching student results:', error);
      return null;
    }
  };

  const generateLesson = async (style: LearningStyle) => {
    setIsGenerating(true);
    setGeneratedLesson(null);
    setPracticeAnswers({});
    setShowResults(false);

    try {
      const studentResults = await fetchStudentResults();

      const { data, error } = await supabase.functions.invoke('ai-generate-lesson', {
        body: {
          topic: topicId === 'fractions' ? 'Дроби (Fractions)' : topicId,
          learningStyle: style,
          studentResults,
          language
        }
      });

      if (error) throw error;

      if (data.status === 'ok') {
        setGeneratedLesson(data);
      } else {
        throw new Error(data.error || 'Failed to generate lesson');
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast.error(language === 'ru' ? 'Ошибка генерации урока' : 'Error generating lesson');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStyleSelect = (style: LearningStyle) => {
    setSelectedStyle(style);
    generateLesson(style);
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setPracticeAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const resetPractice = () => {
    setPracticeAnswers({});
    setShowResults(false);
  };

  const styles: LearningStyle[] = ['visual', 'auditory', 'text-based', 'problem-solver', 'adhd-friendly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-purple-500/20">
          AI Personalized
        </Badge>
      </div>

      {!selectedStyle ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.selectStyle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => handleStyleSelect(style)}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground hover:border-primary cursor-pointer transition-all"
                >
                  <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary">
                    {styleIcons[style]}
                  </div>
                  <span className="text-lg font-semibold mb-2">{t[style]}</span>
                  <span className="text-sm text-muted-foreground text-center">
                    {styleDescriptions[style]}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isGenerating ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">{t.generating}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Анализируем ваш прогресс и создаем персональный урок...' : 'Analyzing your progress and creating a personalized lesson...'}
            </p>
          </CardContent>
        </Card>
      ) : generatedLesson ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {styleIcons[selectedStyle]}
              </div>
              <div>
                <h3 className="font-semibold">{t[selectedStyle]}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Персонализированный урок' : 'Personalized Lesson'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setSelectedStyle(null); setGeneratedLesson(null); }}>
              {t.changeStyle}
            </Button>
          </div>

          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t.introduction}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-lg leading-relaxed">
                {generatedLesson.lesson.introduction}
              </p>
            </CardContent>
          </Card>

          {/* Core Lesson */}
          <Card>
            <CardHeader>
              <CardTitle>{t.coreLesson}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {generatedLesson.lesson.core_lesson}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weakness Training */}
          {generatedLesson.lesson.weakness_training?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.weaknessTraining}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {generatedLesson.lesson.weakness_training.map((item, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Badge variant="secondary">{item.area}</Badge>
                    <p className="text-foreground">{item.explanation}</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium text-sm text-muted-foreground mb-1">
                        {language === 'ru' ? 'Пример:' : 'Example:'}
                      </p>
                      <p className="text-foreground">{item.example}</p>
                    </div>
                    {item.exercises?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-muted-foreground">
                          {language === 'ru' ? 'Упражнения:' : 'Exercises:'}
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {item.exercises.map((ex, i) => (
                            <li key={i} className="text-foreground">{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.tip && (
                      <div className="flex items-start gap-2 p-2 bg-primary/10 rounded">
                        <span className="text-primary">💡</span>
                        <p className="text-sm text-foreground"><strong>{t.tip}:</strong> {item.tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Practice Questions */}
          {generatedLesson.lesson.practice_questions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.practice}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {generatedLesson.lesson.practice_questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 border rounded-lg space-y-3">
                    <p className="font-medium text-foreground">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((option, oIdx) => {
                        const isSelected = practiceAnswers[qIdx] === oIdx;
                        const isCorrect = q.correct === oIdx;
                        let buttonClass = "text-left p-3 rounded border transition-all ";
                        
                        if (showResults) {
                          if (isCorrect) {
                            buttonClass += "bg-green-100 border-green-500 dark:bg-green-900/30";
                          } else if (isSelected && !isCorrect) {
                            buttonClass += "bg-red-100 border-red-500 dark:bg-red-900/30";
                          } else {
                            buttonClass += "bg-muted/50";
                          }
                        } else if (isSelected) {
                          buttonClass += "bg-primary/20 border-primary";
                        } else {
                          buttonClass += "bg-muted/50 hover:bg-muted";
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleAnswerSelect(qIdx, oIdx)}
                            className={buttonClass}
                            disabled={showResults}
                          >
                            <div className="flex items-center gap-2">
                              {showResults && isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {showResults && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                              <span>{String.fromCharCode(65 + oIdx)}. {option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {showResults && (
                      <div className="p-3 bg-muted/50 rounded text-sm">
                        <strong>{language === 'ru' ? 'Объяснение:' : 'Explanation:'}</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  {!showResults ? (
                    <Button 
                      onClick={checkAnswers}
                      disabled={Object.keys(practiceAnswers).length < generatedLesson.lesson.practice_questions.length}
                    >
                      {t.checkAnswers}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={resetPractice}>
                      {t.tryAgain}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t.summary}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {generatedLesson.lesson.final_summary}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
