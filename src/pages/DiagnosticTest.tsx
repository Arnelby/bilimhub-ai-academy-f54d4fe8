import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Brain, BookOpen, Target, Heart, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";

type Section = 'intro' | 'math' | 'learning_style' | 'psychology' | 'preferences' | 'complete';

interface MathQuestion {
  question: string;
  options: string[];
  correct: number;
  difficulty: number;
}

const mathQuestions: MathQuestion[] = [
  { question: "Чему равно 15% от 200?", options: ["25", "30", "35", "40"], correct: 1, difficulty: 1 },
  { question: "Решите: 3x + 7 = 22. Найдите x.", options: ["3", "4", "5", "6"], correct: 2, difficulty: 1 },
  { question: "Найдите площадь прямоугольника со сторонами 8 и 12.", options: ["72", "96", "80", "100"], correct: 1, difficulty: 1 },
  { question: "Упростите: (2x + 3)(x - 1)", options: ["2x² + x - 3", "2x² - x + 3", "2x² + x + 3", "2x² - x - 3"], correct: 0, difficulty: 2 },
  { question: "Найдите корни уравнения: x² - 5x + 6 = 0", options: ["1 и 6", "2 и 3", "-2 и -3", "1 и 5"], correct: 1, difficulty: 2 },
  { question: "Вычислите: √144 + √81", options: ["21", "23", "25", "27"], correct: 0, difficulty: 2 },
  { question: "Если sin(θ) = 0.6, найдите cos(θ) в первом квадранте.", options: ["0.6", "0.7", "0.8", "0.9"], correct: 2, difficulty: 3 },
  { question: "Найдите производную: f(x) = 3x² + 2x - 5", options: ["6x + 2", "6x - 2", "3x + 2", "6x² + 2"], correct: 0, difficulty: 3 },
];

const learningStyleQuestions = [
  { question: "Как вы лучше запоминаете информацию?", options: ["Визуально (схемы, графики)", "На слух (объяснения)", "Через чтение текста", "Через практику"] },
  { question: "Что помогает вам понять новую тему?", options: ["Примеры из жизни", "Теоретическое объяснение", "Решение задач", "Пошаговые инструкции"] },
  { question: "Какой темп обучения вам подходит?", options: ["Быстрый, общий обзор", "Медленный, детальный", "Средний с практикой", "Зависит от темы"] },
];

const psychologyQuestions = [
  { question: "Как вы справляетесь со сложными задачами?", options: ["Сразу берусь решать", "Сначала планирую", "Прошу помощи", "Откладываю"], scale: "impulsiveness" },
  { question: "Как вы реагируете на ошибки?", options: ["Быстро исправляю", "Анализирую причину", "Расстраиваюсь", "Учусь на них"], scale: "stress_resistance" },
  { question: "Сколько можете концентрироваться на учёбе?", options: ["15-30 минут", "30-60 минут", "1-2 часа", "Более 2 часов"], scale: "attention" },
  { question: "Что вас мотивирует учиться?", options: ["Достижение целей", "Интерес к предмету", "Одобрение других", "Практическая польза"], scale: "motivation" },
];

export default function DiagnosticTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [section, setSection] = useState<Section>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mathAnswers, setMathAnswers] = useState<number[]>([]);
  const [learningAnswers, setLearningAnswers] = useState<number[]>([]);
  const [psychologyAnswers, setPsychologyAnswers] = useState<number[]>([]);
  const [preferences, setPreferences] = useState({
    shortLessons: 50,
    examples: 50,
    quizzes: 50,
    stepByStep: 50,
  });
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkExistingProfile();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_diagnostic_profile')
      .select('diagnostic_completed')
      .eq('user_id', user.id)
      .single();
    
    if (data?.diagnostic_completed) {
      navigate('/dashboard');
    }
  };

  const totalSteps = 4;
  const currentStep = section === 'intro' ? 0 : section === 'math' ? 1 : section === 'learning_style' ? 2 : section === 'psychology' ? 3 : section === 'preferences' ? 4 : 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleMathAnswer = (answer: number) => {
    const newAnswers = [...mathAnswers, answer];
    setMathAnswers(newAnswers);
    
    if (currentQuestion < mathQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('learning_style');
      setCurrentQuestion(0);
    }
  };

  const handleLearningAnswer = (answer: number) => {
    const newAnswers = [...learningAnswers, answer];
    setLearningAnswers(newAnswers);
    
    if (currentQuestion < learningStyleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('psychology');
      setCurrentQuestion(0);
    }
  };

  const handlePsychologyAnswer = (answer: number) => {
    const newAnswers = [...psychologyAnswers, answer];
    setPsychologyAnswers(newAnswers);
    
    if (currentQuestion < psychologyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('preferences');
    }
  };

  const calculateResults = () => {
    // Math level calculation
    let correctCount = 0;
    let totalDifficulty = 0;
    mathAnswers.forEach((answer, idx) => {
      if (answer === mathQuestions[idx].correct) {
        correctCount++;
        totalDifficulty += mathQuestions[idx].difficulty;
      }
    });
    const mathLevel = Math.min(5, Math.max(1, Math.ceil((correctCount / mathQuestions.length) * 5)));
    const accuracy = Math.round((correctCount / mathQuestions.length) * 100);
    const speed = startTime ? Math.round((Date.now() - startTime) / 1000 / mathQuestions.length) : 30;

    // Learning style calculation
    const styleMap = ['visual', 'auditory', 'text-based', 'example-based'];
    const styleCounts = [0, 0, 0, 0];
    learningAnswers.forEach(answer => styleCounts[answer]++);
    const dominantStyle = styleMap[styleCounts.indexOf(Math.max(...styleCounts))];

    // Psychology calculation
    const motivationMap = ['achievement', 'intrinsic', 'social', 'practical'];
    const motivationType = motivationMap[psychologyAnswers[3] || 0];

    return {
      math_level: mathLevel,
      logic_score: totalDifficulty * 10,
      problem_solving_score: correctCount * 12,
      speed_score: Math.max(0, 100 - speed * 2),
      accuracy_score: accuracy,
      learning_style: dominantStyle,
      visual_preference: learningAnswers[0] === 0 ? 80 : 40,
      auditory_preference: learningAnswers[0] === 1 ? 80 : 40,
      text_preference: learningAnswers[0] === 2 ? 80 : 40,
      example_preference: learningAnswers[1] === 0 ? 80 : 40,
      problem_driven_preference: learningAnswers[1] === 2 ? 80 : 40,
      step_by_step_preference: preferences.stepByStep,
      attention_level: psychologyAnswers[2] === 3 ? 90 : psychologyAnswers[2] === 2 ? 70 : psychologyAnswers[2] === 1 ? 50 : 30,
      stress_resistance: psychologyAnswers[1] === 3 ? 80 : psychologyAnswers[1] === 1 ? 70 : 50,
      impulsiveness: psychologyAnswers[0] === 0 ? 80 : psychologyAnswers[0] === 1 ? 30 : 50,
      consistency: psychologyAnswers[0] === 1 ? 80 : 50,
      patience: psychologyAnswers[2] >= 2 ? 70 : 40,
      confidence: mathLevel >= 3 ? 70 : 50,
      motivation_type: motivationType,
      prefers_short_lessons: preferences.shortLessons < 50,
      prefers_examples: preferences.examples > 50,
      prefers_quizzes: preferences.quizzes > 50,
      prefers_step_by_step: preferences.stepByStep > 50,
    };
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const results = calculateResults();
      
      const { error } = await supabase
        .from('user_diagnostic_profile')
        .upsert({
          user_id: user.id,
          ...results,
          diagnostic_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: language === 'ru' ? "Диагностика завершена!" : "Diagnostic Complete!",
        description: language === 'ru' ? "Ваш профиль обучения создан" : "Your learning profile has been created",
      });

      setSection('complete');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save diagnostic results",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderIntro = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <Brain className="w-16 h-16 mx-auto text-primary mb-4" />
        <CardTitle className="text-2xl">
          {language === 'ru' ? 'Адаптивный диагностический тест' : 'Adaptive Diagnostic Test'}
        </CardTitle>
        <CardDescription className="text-lg">
          {language === 'ru' 
            ? 'Этот тест поможет нам понять ваш уровень, стиль обучения и создать персональный план подготовки к ОРТ.'
            : 'This test will help us understand your level, learning style, and create a personalized ORT preparation plan.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Target className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium">{language === 'ru' ? 'Уровень математики' : 'Math Level'}</p>
              <p className="text-sm text-muted-foreground">8 вопросов</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <BookOpen className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium">{language === 'ru' ? 'Стиль обучения' : 'Learning Style'}</p>
              <p className="text-sm text-muted-foreground">3 вопроса</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-medium">{language === 'ru' ? 'Психологический профиль' : 'Psychology'}</p>
              <p className="text-sm text-muted-foreground">4 вопроса</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Brain className="w-8 h-8 text-purple-500" />
            <div>
              <p className="font-medium">{language === 'ru' ? 'Предпочтения' : 'Preferences'}</p>
              <p className="text-sm text-muted-foreground">4 параметра</p>
            </div>
          </div>
        </div>
        <Button 
          className="w-full" 
          size="lg" 
          onClick={() => { setSection('math'); setStartTime(Date.now()); }}
        >
          {language === 'ru' ? 'Начать тест' : 'Start Test'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderMathSection = () => {
    const q = mathQuestions[currentQuestion];
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Математика' : 'Math'} • {currentQuestion + 1}/{mathQuestions.length}
            </span>
            <span className="text-sm font-medium px-2 py-1 bg-primary/10 rounded">
              {q.difficulty === 1 ? '⭐' : q.difficulty === 2 ? '⭐⭐' : '⭐⭐⭐'}
            </span>
          </div>
          <CardTitle className="text-xl">{q.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup onValueChange={(v) => handleMathAnswer(parseInt(v))}>
            {q.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-lg">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderLearningStyleSection = () => {
    const q = learningStyleQuestions[currentQuestion];
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Стиль обучения' : 'Learning Style'} • {currentQuestion + 1}/{learningStyleQuestions.length}
            </span>
          </div>
          <CardTitle className="text-xl">{q.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup onValueChange={(v) => handleLearningAnswer(parseInt(v))}>
            {q.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                <RadioGroupItem value={idx.toString()} id={`learn-${idx}`} />
                <Label htmlFor={`learn-${idx}`} className="flex-1 cursor-pointer text-lg">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderPsychologySection = () => {
    const q = psychologyQuestions[currentQuestion];
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Психологический профиль' : 'Psychology'} • {currentQuestion + 1}/{psychologyQuestions.length}
            </span>
          </div>
          <CardTitle className="text-xl">{q.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup onValueChange={(v) => handlePsychologyAnswer(parseInt(v))}>
            {q.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                <RadioGroupItem value={idx.toString()} id={`psych-${idx}`} />
                <Label htmlFor={`psych-${idx}`} className="flex-1 cursor-pointer text-lg">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderPreferencesSection = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'ru' ? 'Ваши предпочтения в обучении' : 'Your Learning Preferences'}</CardTitle>
        <CardDescription>
          {language === 'ru' ? 'Настройте параметры под себя' : 'Customize these settings for yourself'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>{language === 'ru' ? 'Длина уроков' : 'Lesson Length'}</Label>
            <span className="text-sm text-muted-foreground">
              {preferences.shortLessons < 50 ? (language === 'ru' ? 'Короткие' : 'Short') : (language === 'ru' ? 'Длинные' : 'Long')}
            </span>
          </div>
          <Slider
            value={[preferences.shortLessons]}
            onValueChange={([v]) => setPreferences(p => ({ ...p, shortLessons: v }))}
            max={100}
            step={10}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>{language === 'ru' ? 'Примеры vs Теория' : 'Examples vs Theory'}</Label>
            <span className="text-sm text-muted-foreground">
              {preferences.examples > 50 ? (language === 'ru' ? 'Больше примеров' : 'More examples') : (language === 'ru' ? 'Больше теории' : 'More theory')}
            </span>
          </div>
          <Slider
            value={[preferences.examples]}
            onValueChange={([v]) => setPreferences(p => ({ ...p, examples: v }))}
            max={100}
            step={10}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>{language === 'ru' ? 'Тесты vs Объяснения' : 'Quizzes vs Explanations'}</Label>
            <span className="text-sm text-muted-foreground">
              {preferences.quizzes > 50 ? (language === 'ru' ? 'Больше тестов' : 'More quizzes') : (language === 'ru' ? 'Больше объяснений' : 'More explanations')}
            </span>
          </div>
          <Slider
            value={[preferences.quizzes]}
            onValueChange={([v]) => setPreferences(p => ({ ...p, quizzes: v }))}
            max={100}
            step={10}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>{language === 'ru' ? 'Пошаговые инструкции' : 'Step-by-step Instructions'}</Label>
            <span className="text-sm text-muted-foreground">
              {preferences.stepByStep > 50 ? (language === 'ru' ? 'Детальные шаги' : 'Detailed steps') : (language === 'ru' ? 'Общий обзор' : 'Overview')}
            </span>
          </div>
          <Slider
            value={[preferences.stepByStep]}
            onValueChange={([v]) => setPreferences(p => ({ ...p, stepByStep: v }))}
            max={100}
            step={10}
          />
        </div>

        <Button className="w-full" size="lg" onClick={saveProfile} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {language === 'ru' ? 'Сохранение...' : 'Saving...'}</>
          ) : (
            <><Check className="mr-2 h-5 w-5" /> {language === 'ru' ? 'Завершить диагностику' : 'Complete Diagnostic'}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderComplete = () => (
    <Card className="max-w-2xl mx-auto text-center">
      <CardContent className="py-12">
        <Check className="w-20 h-20 mx-auto text-green-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4">
          {language === 'ru' ? 'Диагностика завершена!' : 'Diagnostic Complete!'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {language === 'ru' 
            ? 'Ваш персональный профиль обучения создан. Перенаправление на панель управления...'
            : 'Your personalized learning profile has been created. Redirecting to dashboard...'}
        </p>
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {section !== 'intro' && section !== 'complete' && (
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{language === 'ru' ? 'Математика' : 'Math'}</span>
              <span>{language === 'ru' ? 'Стиль' : 'Style'}</span>
              <span>{language === 'ru' ? 'Психология' : 'Psychology'}</span>
              <span>{language === 'ru' ? 'Предпочтения' : 'Preferences'}</span>
            </div>
          </div>
        )}

        {section === 'intro' && renderIntro()}
        {section === 'math' && renderMathSection()}
        {section === 'learning_style' && renderLearningStyleSection()}
        {section === 'psychology' && renderPsychologySection()}
        {section === 'preferences' && renderPreferencesSection()}
        {section === 'complete' && renderComplete()}
      </div>
    </div>
  );
}
