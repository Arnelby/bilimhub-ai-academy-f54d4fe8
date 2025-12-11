import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { mathTopics, LearningStyle } from '@/data/mathLessonsData';
import { 
  BookOpen, 
  PlayCircle, 
  LayoutGrid, 
  AlertTriangle, 
  Brain, 
  FileText, 
  Sparkles,
  Globe,
  ArrowLeft,
  Clock,
  Lightbulb,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  Ear,
  Puzzle,
  Zap,
  Video,
  ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TabType = 'basic' | 'mini' | 'diagrams' | 'mistakes' | 'miniTests' | 'fullTest' | 'dynamic';

const tabIcons: Record<TabType, React.ReactNode> = {
  basic: <BookOpen className="h-4 w-4" />,
  mini: <PlayCircle className="h-4 w-4" />,
  diagrams: <LayoutGrid className="h-4 w-4" />,
  mistakes: <AlertTriangle className="h-4 w-4" />,
  miniTests: <Brain className="h-4 w-4" />,
  fullTest: <FileText className="h-4 w-4" />,
  dynamic: <Sparkles className="h-4 w-4" />,
};

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  visual: <Eye className="h-5 w-5" />,
  auditory: <Ear className="h-5 w-5" />,
  'text-based': <BookOpen className="h-5 w-5" />,
  'problem-solver': <Puzzle className="h-5 w-5" />,
  'adhd-friendly': <Zap className="h-5 w-5" />,
};

export default function FractionsLesson() {
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Get fractions topic data
  const fractionsTopic = mathTopics.find(t => t.id === 'fractions')!;
  
  // Mini-tests state
  const [currentDifficulty, setCurrentDifficulty] = useState<1 | 2 | 3>(1);
  const [miniTestIndex, setMiniTestIndex] = useState(0);
  const [miniTestAnswer, setMiniTestAnswer] = useState<number | null>(null);
  const [miniTestShowResult, setMiniTestShowResult] = useState(false);
  const [miniTestScore, setMiniTestScore] = useState(0);
  const [miniTestTotal, setMiniTestTotal] = useState(0);
  
  // Full test state
  const [fullTestIndex, setFullTestIndex] = useState(0);
  const [fullTestAnswers, setFullTestAnswers] = useState<Record<number, number>>({});
  const [fullTestSubmitted, setFullTestSubmitted] = useState(false);
  
  // Dynamic lesson state
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);

  const t = {
    title: language === 'ru' ? 'Дроби' : language === 'kg' ? 'Бөлчөктөр' : 'Fractions',
    subtitle: language === 'ru' 
      ? 'Полный интерактивный урок' 
      : language === 'kg' 
        ? 'Толук интерактивдик сабак' 
        : 'Complete Interactive Lesson',
    back: language === 'ru' ? 'Назад к урокам' : language === 'kg' ? 'Сабактарга кайтуу' : 'Back to Lessons',
    contents: language === 'ru' ? 'Содержание' : language === 'kg' ? 'Мазмуну' : 'Contents',
    tabs: {
      basic: language === 'ru' ? 'Основной урок' : language === 'kg' ? 'Негизги сабак' : 'Basic Lesson',
      mini: language === 'ru' ? 'Мини-уроки' : language === 'kg' ? 'Мини-сабактар' : 'Mini Lessons',
      diagrams: language === 'ru' ? 'Диаграммы' : language === 'kg' ? 'Диаграммалар' : 'Diagrams',
      mistakes: language === 'ru' ? 'Типичные ошибки' : language === 'kg' ? 'Типтүү каталар' : 'Common Mistakes',
      miniTests: language === 'ru' ? 'Мини-тесты' : language === 'kg' ? 'Мини-тесттер' : 'Mini-Tests',
      fullTest: language === 'ru' ? 'Полный тест' : language === 'kg' ? 'Толук тест' : 'Full Test',
      dynamic: language === 'ru' ? 'AI Урок' : language === 'kg' ? 'AI Сабак' : 'AI Lesson',
    },
    theory: language === 'ru' ? 'Теория' : language === 'kg' ? 'Теория' : 'Theory',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    practice: language === 'ru' ? 'Практика' : language === 'kg' ? 'Практика' : 'Practice',
    checkAnswer: language === 'ru' ? 'Проверить' : language === 'kg' ? 'Текшерүү' : 'Check Answer',
    correct: language === 'ru' ? 'Правильно!' : language === 'kg' ? 'Туура!' : 'Correct!',
    incorrect: language === 'ru' ? 'Неправильно' : language === 'kg' ? 'Туура эмес' : 'Incorrect',
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    restart: language === 'ru' ? 'Начать заново' : language === 'kg' ? 'Кайра баштоо' : 'Restart',
    submit: language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти бүтүрүү' : 'Submit Test',
    retake: language === 'ru' ? 'Пройти заново' : language === 'kg' ? 'Кайра өтүү' : 'Retake Test',
    score: language === 'ru' ? 'Ваш результат' : language === 'kg' ? 'Сиздин жыйынтык' : 'Your Score',
    explanation: language === 'ru' ? 'Объяснение' : language === 'kg' ? 'Түшүндүрмө' : 'Explanation',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окуу стилин тандаңыз' : 'Select Your Learning Style',
    changeStyle: language === 'ru' ? 'Изменить стиль' : language === 'kg' ? 'Стилди өзгөртүү' : 'Change Style',
    difficulty: {
      1: language === 'ru' ? 'Легкий' : language === 'kg' ? 'Жеңил' : 'Easy',
      2: language === 'ru' ? 'Средний' : language === 'kg' ? 'Орточо' : 'Medium',
      3: language === 'ru' ? 'Сложный' : language === 'kg' ? 'Кыйын' : 'Hard',
    },
    styleNames: {
      visual: language === 'ru' ? 'Визуальный' : language === 'kg' ? 'Визуалдык' : 'Visual',
      auditory: language === 'ru' ? 'Аудиальный' : language === 'kg' ? 'Аудиалдык' : 'Auditory',
      'text-based': language === 'ru' ? 'Текстовый' : language === 'kg' ? 'Тексттик' : 'Text-based',
      'problem-solver': language === 'ru' ? 'Практический' : language === 'kg' ? 'Практикалык' : 'Problem-solver',
      'adhd-friendly': language === 'ru' ? 'СДВГ-дружественный' : language === 'kg' ? 'ADHD-достук' : 'ADHD-friendly',
    },
    styleDescriptions: {
      visual: language === 'ru' ? 'Обучение через изображения и диаграммы' : language === 'kg' ? 'Сүрөттөр аркылуу окуу' : 'Learning through images and diagrams',
      auditory: language === 'ru' ? 'Обучение через прослушивание' : language === 'kg' ? 'Угуу аркылуу окуу' : 'Learning through listening',
      'text-based': language === 'ru' ? 'Обучение через чтение' : language === 'kg' ? 'Окуу аркылуу үйрөнүү' : 'Learning through reading',
      'problem-solver': language === 'ru' ? 'Обучение через практику' : language === 'kg' ? 'Практика аркылуу окуу' : 'Learning through practice',
      'adhd-friendly': language === 'ru' ? 'Короткие интерактивные уроки' : language === 'kg' ? 'Кыска интерактивдик сабактар' : 'Short interactive lessons',
    },
  };

  // Mini-test logic
  const filteredMiniTestQuestions = fractionsTopic.miniTestQuestions.filter(q => q.difficulty === currentDifficulty);
  const currentMiniTestQuestion = filteredMiniTestQuestions[miniTestIndex];

  const handleMiniTestAnswer = (answerIndex: number) => {
    if (miniTestShowResult) return;
    setMiniTestAnswer(answerIndex);
  };

  const checkMiniTestAnswer = () => {
    if (miniTestAnswer === null || !currentMiniTestQuestion) return;
    setMiniTestShowResult(true);
    setMiniTestTotal(prev => prev + 1);
    if (miniTestAnswer === currentMiniTestQuestion.correctAnswer) {
      setMiniTestScore(prev => prev + 1);
      // Increase difficulty on correct answer
      if (currentDifficulty < 3) {
        setCurrentDifficulty((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
      }
    } else {
      // Decrease difficulty on wrong answer
      if (currentDifficulty > 1) {
        setCurrentDifficulty((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
      }
    }
  };

  const nextMiniTestQuestion = () => {
    if (miniTestIndex + 1 >= filteredMiniTestQuestions.length) {
      setMiniTestIndex(0);
    } else {
      setMiniTestIndex(prev => prev + 1);
    }
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
  };

  const restartMiniTest = () => {
    setCurrentDifficulty(1);
    setMiniTestIndex(0);
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
    setMiniTestScore(0);
    setMiniTestTotal(0);
  };

  // Full test logic
  const currentFullTestQuestion = fractionsTopic.fullTestQuestions[fullTestIndex];
  const fullTestAnsweredCount = Object.keys(fullTestAnswers).length;

  const handleFullTestAnswer = (answerIndex: number) => {
    setFullTestAnswers(prev => ({ ...prev, [fullTestIndex]: answerIndex }));
  };

  const calculateFullTestScore = () => {
    let correct = 0;
    fractionsTopic.fullTestQuestions.forEach((q, idx) => {
      if (fullTestAnswers[idx] === q.correctAnswer) correct++;
    });
    return correct;
  };

  const restartFullTest = () => {
    setFullTestIndex(0);
    setFullTestAnswers({});
    setFullTestSubmitted(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lessons">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {t.back}
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-lg border overflow-hidden">
              {(['en', 'ru', 'kg'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    language === lang 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Area (3/4) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              {/* Mobile Tab List */}
              <TabsList className="w-full flex-wrap h-auto gap-1 mb-6 lg:hidden">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab}
                    className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tabIcons[tab]}
                    <span className="text-xs">{t.tabs[tab]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Basic Lesson Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.basic}</h2>
                </div>
                
                {/* Theory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">📚 {t.theory}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {fractionsTopic.basicLesson.theory.map((section) => (
                      <div key={section.id} className="space-y-3">
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                        {section.imagePlaceholder && (
                          <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">{section.imagePlaceholder}</p>
                          </div>
                        )}
                        <Separator />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Examples */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">💡 {t.examples}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {fractionsTopic.basicLesson.examples.map((example, idx) => (
                      <div key={example.id} className="p-4 border rounded-lg space-y-3">
                        <Badge variant="outline">{t.examples} {idx + 1}</Badge>
                        <h4 className="font-semibold">{example.title}</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{example.content}</p>
                        {example.imagePlaceholder && (
                          <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center">
                            <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">{example.imagePlaceholder}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Practice Questions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">✏️ {t.practice}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fractionsTopic.basicLesson.practiceQuestions.slice(0, 5).map((q, idx) => (
                      <PracticeQuestion key={q.id} question={q} index={idx} t={t} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mini Lessons Tab */}
              <TabsContent value="mini" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mini}</h2>
                  <Badge variant="secondary">{fractionsTopic.miniLessons.length} {language === 'ru' ? 'уроков' : 'lessons'}</Badge>
                </div>
                
                {fractionsTopic.miniLessons.map((lesson, idx) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {idx + 1}
                          </span>
                          {lesson.title}
                        </CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{lesson.concept}</p>
                      </div>
                      <p className="text-muted-foreground">{lesson.explanation}</p>
                      
                      {/* YouTube Video */}
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src="https://www.youtube.com/embed/UJbYTA-1rYc"
                          title={lesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                        <Lightbulb className="h-5 w-5 text-warning mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-warning">{language === 'ru' ? 'Главное' : 'Key Takeaway'}</p>
                          <p className="text-sm mt-1">{lesson.keyTakeaway}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Diagrams Tab */}
              <TabsContent value="diagrams" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.diagrams}</h2>
                  <Badge variant="secondary">{fractionsTopic.diagrams.length}</Badge>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {fractionsTopic.diagrams.map((diagram) => (
                    <Card key={diagram.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          📊 {diagram.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{diagram.description}</p>
                        <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">{diagram.imagePlaceholder}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Common Mistakes Tab */}
              <TabsContent value="mistakes" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <h2 className="text-2xl font-bold">{t.tabs.mistakes}</h2>
                  <Badge variant="secondary">{fractionsTopic.commonMistakes.length}</Badge>
                </div>
                
                {fractionsTopic.commonMistakes.map((item, idx) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        {language === 'ru' ? 'Ошибка' : 'Mistake'} #{idx + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="font-medium text-destructive">{item.mistake}</p>
                      </div>
                      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="font-medium text-warning mb-2">{language === 'ru' ? 'Почему это неправильно:' : 'Why it\'s wrong:'}</p>
                        <p>{item.explanation}</p>
                      </div>
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="font-medium text-primary mb-2">{language === 'ru' ? 'Как исправить:' : 'How to fix:'}</p>
                        <ul className="list-disc list-inside space-y-1">
                          {item.fix.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                      {item.imagePlaceholder && (
                        <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center">
                          <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">{item.imagePlaceholder}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Mini Tests Tab */}
              <TabsContent value="miniTests" className="mt-0 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.miniTests}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{t.score}: {miniTestScore}/{miniTestTotal}</Badge>
                    <Badge variant={currentDifficulty === 1 ? 'secondary' : currentDifficulty === 2 ? 'default' : 'destructive'}>
                      {t.difficulty[currentDifficulty]}
                    </Badge>
                  </div>
                </div>

                {miniTestTotal > 0 && <Progress value={(miniTestScore / miniTestTotal) * 100} />}

                {currentMiniTestQuestion ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === 'ru' ? 'Вопрос' : 'Question'} {miniTestTotal + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-lg">{currentMiniTestQuestion.question}</p>

                      <div className="grid gap-3">
                        {currentMiniTestQuestion.options.map((option, idx) => {
                          const isSelected = miniTestAnswer === idx;
                          const isCorrect = currentMiniTestQuestion.correctAnswer === idx;
                          
                          return (
                            <Button
                              key={idx}
                              variant="outline"
                              className={cn(
                                'justify-start h-auto py-3 px-4 text-left',
                                isSelected && !miniTestShowResult && 'border-primary bg-primary/10',
                                miniTestShowResult && isCorrect && 'border-green-500 bg-green-500/10 text-green-700',
                                miniTestShowResult && isSelected && !isCorrect && 'border-destructive bg-destructive/10 text-destructive'
                              )}
                              onClick={() => handleMiniTestAnswer(idx)}
                              disabled={miniTestShowResult}
                            >
                              <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                              {miniTestShowResult && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-500" />}
                              {miniTestShowResult && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                            </Button>
                          );
                        })}
                      </div>

                      {!miniTestShowResult && miniTestAnswer !== null && (
                        <Button onClick={checkMiniTestAnswer} className="w-full">
                          {t.checkAnswer}
                        </Button>
                      )}

                      {miniTestShowResult && (
                        <div className="space-y-4">
                          <div className={cn(
                            'p-4 rounded-lg',
                            miniTestAnswer === currentMiniTestQuestion.correctAnswer ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
                          )}>
                            <p className={cn(
                              'font-semibold flex items-center gap-2',
                              miniTestAnswer === currentMiniTestQuestion.correctAnswer ? 'text-green-600' : 'text-destructive'
                            )}>
                              {miniTestAnswer === currentMiniTestQuestion.correctAnswer ? (
                                <><CheckCircle className="h-5 w-5" /> {t.correct}</>
                              ) : (
                                <><XCircle className="h-5 w-5" /> {t.incorrect}</>
                              )}
                            </p>
                          </div>

                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="font-medium text-muted-foreground mb-2">{t.explanation}:</p>
                            <p>{currentMiniTestQuestion.explanation}</p>
                          </div>

                          <Button onClick={nextMiniTestQuestion} className="w-full">
                            {t.next}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="text-center">
                    <CardContent className="pt-8 pb-8">
                      <p className="mb-4">{language === 'ru' ? 'Нет вопросов для этого уровня сложности' : 'No questions for this difficulty'}</p>
                      <Button onClick={restartMiniTest}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t.restart}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Full Test Tab */}
              <TabsContent value="fullTest" className="mt-0 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.fullTest}</h2>
                  </div>
                  <Badge variant="outline">
                    {language === 'ru' ? 'Отвечено' : 'Answered'}: {fullTestAnsweredCount}/{fractionsTopic.fullTestQuestions.length}
                  </Badge>
                </div>

                <Progress value={(fullTestAnsweredCount / fractionsTopic.fullTestQuestions.length) * 100} />

                {!fullTestSubmitted ? (
                  <>
                    {/* Question navigator */}
                    <div className="flex flex-wrap gap-2">
                      {fractionsTopic.fullTestQuestions.map((_, idx) => (
                        <Button
                          key={idx}
                          variant={fullTestIndex === idx ? 'default' : fullTestAnswers[idx] !== undefined ? 'secondary' : 'outline'}
                          size="sm"
                          className="w-10 h-10"
                          onClick={() => setFullTestIndex(idx)}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>{language === 'ru' ? 'Вопрос' : 'Question'} {fullTestIndex + 1} {language === 'ru' ? 'из' : 'of'} {fractionsTopic.fullTestQuestions.length}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-lg">{currentFullTestQuestion.question}</p>

                        <div className="grid gap-3">
                          {currentFullTestQuestion.options.map((option, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className={cn(
                                'justify-start h-auto py-3 px-4 text-left',
                                fullTestAnswers[fullTestIndex] === idx && 'border-primary bg-primary/10'
                              )}
                              onClick={() => handleFullTestAnswer(idx)}
                            >
                              <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                            </Button>
                          ))}
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setFullTestIndex(prev => Math.max(0, prev - 1))}
                            disabled={fullTestIndex === 0}
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {language === 'ru' ? 'Назад' : 'Previous'}
                          </Button>

                          {fullTestIndex === fractionsTopic.fullTestQuestions.length - 1 ? (
                            <Button 
                              onClick={() => setFullTestSubmitted(true)}
                              disabled={fullTestAnsweredCount < fractionsTopic.fullTestQuestions.length}
                            >
                              {t.submit}
                            </Button>
                          ) : (
                            <Button onClick={() => setFullTestIndex(prev => prev + 1)}>
                              {t.next}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="space-y-6">
                    <Card className="text-center">
                      <CardContent className="pt-8 pb-8">
                        <div className="text-6xl mb-4">{calculateFullTestScore() / fractionsTopic.fullTestQuestions.length >= 0.7 ? '🎉' : '📚'}</div>
                        <p className="text-lg text-muted-foreground mb-2">{t.score}:</p>
                        <div className="text-4xl font-bold text-primary mb-2">
                          {calculateFullTestScore()}/{fractionsTopic.fullTestQuestions.length}
                        </div>
                        <Progress value={(calculateFullTestScore() / fractionsTopic.fullTestQuestions.length) * 100} className="w-64 mx-auto mb-4" />
                        <p className="text-xl mb-6">{Math.round((calculateFullTestScore() / fractionsTopic.fullTestQuestions.length) * 100)}%</p>
                        <Button onClick={restartFullTest} size="lg">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {t.retake}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Review answers */}
                    <h3 className="text-xl font-semibold">{language === 'ru' ? 'Разбор ответов' : 'Answer Review'}</h3>
                    {fractionsTopic.fullTestQuestions.map((q, idx) => {
                      const userAnswer = fullTestAnswers[idx];
                      const isCorrect = userAnswer === q.correctAnswer;
                      
                      return (
                        <Card key={q.id} className={cn('border-l-4', isCorrect ? 'border-l-green-500' : 'border-l-destructive')}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3 mb-3">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive mt-1 shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium mb-2">{language === 'ru' ? 'Вопрос' : 'Question'} {idx + 1}: {q.question}</p>
                                <div className="text-sm space-y-1">
                                  <p className={isCorrect ? 'text-green-600' : 'text-destructive'}>
                                    {language === 'ru' ? 'Ваш ответ' : 'Your answer'}: {userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : '-'}
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-green-600">{language === 'ru' ? 'Правильный ответ' : 'Correct answer'}: {String.fromCharCode(65 + q.correctAnswer)}</p>
                                  )}
                                </div>
                                <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                                  <p className="font-medium text-muted-foreground">{t.explanation}:</p>
                                  <p>{q.explanation}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Dynamic Lessons Tab */}
              <TabsContent value="dynamic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.dynamic}</h2>
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
                      <RadioGroup
                        onValueChange={(value) => setSelectedStyle(value as LearningStyle)}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                      >
                        {(['visual', 'auditory', 'text-based', 'problem-solver', 'adhd-friendly'] as LearningStyle[]).map((style) => (
                          <div key={style}>
                            <RadioGroupItem value={style} id={style} className="peer sr-only" />
                            <Label
                              htmlFor={style}
                              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                            >
                              <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary">
                                {styleIcons[style]}
                              </div>
                              <span className="text-lg font-semibold mb-2">{t.styleNames[style]}</span>
                              <span className="text-sm text-muted-foreground text-center">
                                {t.styleDescriptions[style]}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const dynamicContent = fractionsTopic.dynamicLessonContents.find(d => d.learningStyle === selectedStyle);
                      if (!dynamicContent) return null;
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10 text-primary">
                                {styleIcons[selectedStyle]}
                              </div>
                              <div>
                                <h3 className="font-semibold">{dynamicContent.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.styleNames[selectedStyle]}</p>
                              </div>
                            </div>
                            <Button variant="outline" onClick={() => setSelectedStyle(null)}>
                              {t.changeStyle}
                            </Button>
                          </div>

                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'ru' ? 'Подход' : 'Approach'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground">{dynamicContent.approach}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'ru' ? 'Введение' : 'Introduction'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-lg leading-relaxed">{dynamicContent.introduction}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'ru' ? 'Основное содержание' : 'Main Content'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {dynamicContent.mainContent.map((content, idx) => (
                                <p key={idx} className="text-muted-foreground whitespace-pre-wrap">{content}</p>
                              ))}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{t.examples}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {dynamicContent.examples.map((example, idx) => (
                                <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                                  <Badge variant="outline" className="mb-2">{t.examples} {idx + 1}</Badge>
                                  <p className="whitespace-pre-wrap">{example}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'ru' ? 'Резюме' : 'Summary'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-lg">{dynamicContent.summary}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'ru' ? 'Советы' : 'Tips'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-2">
                                {dynamicContent.tips.map((tip, idx) => (
                                  <li key={idx} className="text-muted-foreground">{tip}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Navigation (1/4) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-4">
              <Card className="hidden lg:block">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 text-card-foreground">{t.contents}</h3>
                  <nav className="space-y-1">
                    {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all ${
                          activeTab === tab
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        {tabIcons[tab]}
                        <span className="text-sm font-medium">{t.tabs[tab]}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📐</span>
                    <h4 className="font-semibold">{t.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'Изучите дроби через теорию, примеры, диаграммы и интерактивные тесты.'
                      : language === 'kg'
                        ? 'Бөлчөктөрдү теория, мисалдар, диаграммалар жана интерактивдик тесттер аркылуу үйрөнүңүз.'
                        : 'Learn fractions through theory, examples, diagrams, and interactive tests.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Practice Question Component
function PracticeQuestion({ question, index, t }: { 
  question: { id: string; question: string; options: string[]; correctAnswer: number; explanation: string };
  index: number;
  t: any;
}) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleCheck = () => {
    if (answer !== null) setShowResult(true);
  };

  const isCorrect = answer === question.correctAnswer;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Badge variant="outline">{t.practice} {index + 1}</Badge>
      <p className="font-medium">{question.question}</p>
      
      <div className="grid gap-2">
        {question.options.map((option, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className={cn(
              'justify-start',
              answer === idx && !showResult && 'border-primary bg-primary/10',
              showResult && idx === question.correctAnswer && 'border-green-500 bg-green-500/10',
              showResult && answer === idx && idx !== question.correctAnswer && 'border-destructive bg-destructive/10'
            )}
            onClick={() => !showResult && setAnswer(idx)}
            disabled={showResult}
          >
            {String.fromCharCode(65 + idx)}. {option}
          </Button>
        ))}
      </div>

      {answer !== null && !showResult && (
        <Button size="sm" onClick={handleCheck}>{t.checkAnswer}</Button>
      )}

      {showResult && (
        <div className={cn('p-3 rounded text-sm', isCorrect ? 'bg-green-500/10' : 'bg-destructive/10')}>
          <p className={cn('font-medium', isCorrect ? 'text-green-600' : 'text-destructive')}>
            {isCorrect ? t.correct : t.incorrect}
          </p>
          <p className="mt-1 text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
