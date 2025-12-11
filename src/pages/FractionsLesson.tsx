import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { fractionsLessonData, getText, LearningStyle, MLPracticeQuestion, MultiLangText } from '@/data/fractionsLessonData';
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
  ImageIcon,
  StickyNote,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Language } from '@/lib/i18n';
import { toast } from 'sonner';
import pizzaFraction34 from '@/assets/lessons/pizza-fraction-3-4.png';

// Map of section IDs to actual images
const sectionImages: Record<string, string> = {
  'theory-1': pizzaFraction34,
};

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

// Practice Question Component
function PracticeQuestion({ question, index, language }: { question: MLPracticeQuestion; index: number; language: Language }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleCheck = () => {
    if (selected !== null) setShowResult(true);
  };

  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{index + 1}</Badge>
        <p className="font-medium">{getText(question.question, language)}</p>
      </div>
      <div className="grid gap-2">
        {question.options.map((opt, idx) => (
          <Button
            key={idx}
            variant="outline"
            className={cn(
              'justify-start h-auto py-2 px-3',
              selected === idx && !showResult && 'border-primary bg-primary/10',
              showResult && idx === question.correctAnswer && 'border-green-500 bg-green-500/10',
              showResult && selected === idx && idx !== question.correctAnswer && 'border-destructive bg-destructive/10'
            )}
            onClick={() => !showResult && setSelected(idx)}
            disabled={showResult}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
            {getText(opt, language)}
          </Button>
        ))}
      </div>
      {!showResult ? (
        <Button onClick={handleCheck} disabled={selected === null} size="sm">
          {language === 'ru' ? 'Проверить' : language === 'kg' ? 'Текшерүү' : 'Check'}
        </Button>
      ) : (
        <div className={cn('p-3 rounded-lg flex items-start gap-2', isCorrect ? 'bg-green-500/10' : 'bg-destructive/10')}>
          {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
          <div>
            <p className="font-medium">{isCorrect ? (language === 'ru' ? 'Правильно!' : 'Correct!') : (language === 'ru' ? 'Неправильно' : 'Incorrect')}</p>
            <p className="text-sm text-muted-foreground">{getText(question.explanation, language)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FractionsLesson() {
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  const data = fractionsLessonData;
  
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
  
  // Notes state
  const [lessonNotes, setLessonNotes] = useState<string>(() => {
    return localStorage.getItem('fractions_lesson_notes') || '';
  });

  const t = {
    title: getText(data.title, language),
    subtitle: language === 'ru' ? 'Полный интерактивный урок' : language === 'kg' ? 'Толук интерактивдик сабак' : 'Complete Interactive Lesson',
    back: language === 'ru' ? 'Назад к урокам' : language === 'kg' ? 'Сабактарга кайтуу' : 'Back to Lessons',
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
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    restart: language === 'ru' ? 'Начать заново' : language === 'kg' ? 'Кайра баштоо' : 'Restart',
    submit: language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти бүтүрүү' : 'Submit Test',
    retake: language === 'ru' ? 'Пройти заново' : language === 'kg' ? 'Кайра өтүү' : 'Retake Test',
    score: language === 'ru' ? 'Ваш результат' : language === 'kg' ? 'Сиздин жыйынтык' : 'Your Score',
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
      visual: language === 'ru' ? 'Обучение через изображения' : language === 'kg' ? 'Сүрөттөр аркылуу окуу' : 'Learning through images',
      auditory: language === 'ru' ? 'Обучение через прослушивание' : language === 'kg' ? 'Угуу аркылуу окуу' : 'Learning through listening',
      'text-based': language === 'ru' ? 'Обучение через чтение' : language === 'kg' ? 'Окуу аркылуу үйрөнүү' : 'Learning through reading',
      'problem-solver': language === 'ru' ? 'Обучение через практику' : language === 'kg' ? 'Практика аркылуу окуу' : 'Learning through practice',
      'adhd-friendly': language === 'ru' ? 'Короткие интерактивные уроки' : language === 'kg' ? 'Кыска интерактивдик сабактар' : 'Short interactive lessons',
    },
  };

  // Mini-test logic
  const filteredMiniTestQuestions = data.miniTestQuestions.filter(q => q.difficulty === currentDifficulty);
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
      if (currentDifficulty < 3) {
        setCurrentDifficulty((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
      }
    } else {
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
  const currentFullTestQuestion = data.fullTestQuestions[fullTestIndex];
  const fullTestAnsweredCount = Object.keys(fullTestAnswers).length;

  const handleFullTestAnswer = (answerIndex: number) => {
    setFullTestAnswers(prev => ({ ...prev, [fullTestIndex]: answerIndex }));
  };

  const calculateFullTestScore = () => {
    let correct = 0;
    data.fullTestQuestions.forEach((q, idx) => {
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
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    language === lang 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
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
                    {data.basicLesson.theory.map((section) => (
                      <div key={section.id} className="space-y-3">
                        <h3 className="text-lg font-semibold">{getText(section.title, language)}</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{getText(section.content, language)}</p>
                        {section.imagePlaceholder && (
                          sectionImages[section.id] ? (
                            <div className="flex justify-center">
                              <img 
                                src={sectionImages[section.id]} 
                                alt={getText(section.imagePlaceholder, language)}
                                className="max-w-xs rounded-lg shadow-md"
                              />
                            </div>
                          ) : (
                            <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">{getText(section.imagePlaceholder, language)}</p>
                            </div>
                          )
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
                    {data.basicLesson.examples.map((example, idx) => (
                      <div key={example.id} className="p-4 border rounded-lg space-y-3">
                        <Badge variant="outline">{t.examples} {idx + 1}</Badge>
                        <h4 className="font-semibold">{getText(example.title, language)}</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{getText(example.content, language)}</p>
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
                    {data.basicLesson.practiceQuestions.slice(0, 5).map((q, idx) => (
                      <PracticeQuestion key={q.id} question={q} index={idx} language={language} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mini Lessons Tab */}
              <TabsContent value="mini" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mini}</h2>
                </div>
                
                {data.miniLessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getText(lesson.title, language)}
                        </CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{getText(lesson.concept, language)}</p>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{getText(lesson.explanation, language)}</p>
                      
                      {/* YouTube Video */}
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src={lesson.videoUrl}
                          title={getText(lesson.title, language)}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                        <Lightbulb className="h-5 w-5 text-warning mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-warning">{language === 'ru' ? 'Главное' : language === 'kg' ? 'Негизгиси' : 'Key Takeaway'}</p>
                          <p className="text-sm text-foreground mt-1">{getText(lesson.keyTakeaway, language)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5 text-primary" />
                      {language === 'ru' ? 'Мои заметки' : language === 'kg' ? 'Менин жазууларым' : 'My Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={
                        language === 'ru' 
                          ? 'Запишите важные моменты из видео здесь...' 
                          : language === 'kg' 
                          ? 'Видеодогу маанилүү жерлерди бул жерге жазыңыз...' 
                          : 'Write down important points from the video here...'
                      }
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                      className="min-h-[150px] resize-y"
                    />
                    <Button 
                      onClick={() => {
                        localStorage.setItem('fractions_lesson_notes', lessonNotes);
                        toast.success(
                          language === 'ru' 
                            ? 'Заметки сохранены!' 
                            : language === 'kg' 
                            ? 'Жазуулар сакталды!' 
                            : 'Notes saved!'
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {language === 'ru' ? 'Сохранить заметки' : language === 'kg' ? 'Жазууларды сактоо' : 'Save Notes'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Diagrams Tab */}
              <TabsContent value="diagrams" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.diagrams}</h2>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {data.diagrams.map((diagram) => (
                    <Card key={diagram.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{getText(diagram.title, language)}</CardTitle>
                        <Badge variant="outline">{diagram.type}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{getText(diagram.description, language)}</p>
                        <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">{getText(diagram.imagePlaceholder, language)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Common Mistakes Tab */}
              <TabsContent value="mistakes" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mistakes}</h2>
                </div>
                
                {data.commonMistakes.map((mistake, idx) => (
                  <Card key={mistake.id} className="border-l-4 border-l-destructive">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5" />
                        {language === 'ru' ? 'Ошибка' : language === 'kg' ? 'Ката' : 'Mistake'} {idx + 1}: {getText(mistake.mistake, language)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm">{getText(mistake.explanation, language)}</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <p className="font-medium text-green-600 mb-2">{language === 'ru' ? 'Как исправить:' : language === 'kg' ? 'Кантип оңдоо керек:' : 'How to fix:'}</p>
                        <ul className="list-disc list-inside space-y-1">
                          {mistake.fix.map((fix, i) => (
                            <li key={i} className="text-sm">{getText(fix, language)}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Mini-Tests Tab */}
              <TabsContent value="miniTests" className="mt-0 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.miniTests}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentDifficulty === 1 ? 'default' : 'outline'}>{t.difficulty[1]}</Badge>
                    <Badge variant={currentDifficulty === 2 ? 'default' : 'outline'}>{t.difficulty[2]}</Badge>
                    <Badge variant={currentDifficulty === 3 ? 'default' : 'outline'}>{t.difficulty[3]}</Badge>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{language === 'ru' ? 'Уровень' : 'Level'}: {t.difficulty[currentDifficulty]}</CardTitle>
                      <Badge>{language === 'ru' ? 'Счёт' : 'Score'}: {miniTestScore}/{miniTestTotal}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentMiniTestQuestion ? (
                      <>
                        <p className="text-lg font-medium">{getText(currentMiniTestQuestion.question, language)}</p>
                        <div className="grid gap-3">
                          {currentMiniTestQuestion.options.map((opt, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className={cn(
                                'justify-start h-auto py-3 px-4',
                                miniTestAnswer === idx && !miniTestShowResult && 'border-primary bg-primary/10',
                                miniTestShowResult && idx === currentMiniTestQuestion.correctAnswer && 'border-green-500 bg-green-500/10',
                                miniTestShowResult && miniTestAnswer === idx && idx !== currentMiniTestQuestion.correctAnswer && 'border-destructive bg-destructive/10'
                              )}
                              onClick={() => handleMiniTestAnswer(idx)}
                              disabled={miniTestShowResult}
                            >
                              <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                              {getText(opt, language)}
                            </Button>
                          ))}
                        </div>

                        {miniTestShowResult && (
                          <div className={cn('p-4 rounded-lg', miniTestAnswer === currentMiniTestQuestion.correctAnswer ? 'bg-green-500/10' : 'bg-destructive/10')}>
                            <div className="flex items-center gap-2 mb-2">
                              {miniTestAnswer === currentMiniTestQuestion.correctAnswer ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                              <span className="font-medium">
                                {miniTestAnswer === currentMiniTestQuestion.correctAnswer 
                                  ? (language === 'ru' ? 'Правильно!' : 'Correct!') 
                                  : (language === 'ru' ? 'Неправильно' : 'Incorrect')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{getText(currentMiniTestQuestion.explanation, language)}</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {!miniTestShowResult ? (
                            <Button onClick={checkMiniTestAnswer} disabled={miniTestAnswer === null}>
                              {language === 'ru' ? 'Проверить' : 'Check'}
                            </Button>
                          ) : (
                            <Button onClick={nextMiniTestQuestion}>
                              {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" onClick={restartMiniTest}>
                            <RotateCcw className="mr-2 h-4 w-4" /> {t.restart}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{language === 'ru' ? 'Нет вопросов для этого уровня' : 'No questions for this level'}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Full Test Tab */}
              <TabsContent value="fullTest" className="mt-0 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.fullTest}</h2>
                  </div>
                  <Badge variant="outline">
                    {language === 'ru' ? 'Отвечено' : 'Answered'}: {fullTestAnsweredCount}/{data.fullTestQuestions.length}
                  </Badge>
                </div>

                <Progress value={(fullTestAnsweredCount / data.fullTestQuestions.length) * 100} />

                {!fullTestSubmitted ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {data.fullTestQuestions.map((_, idx) => (
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
                        <CardTitle>{language === 'ru' ? 'Вопрос' : 'Question'} {fullTestIndex + 1} {language === 'ru' ? 'из' : 'of'} {data.fullTestQuestions.length}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-lg">{getText(currentFullTestQuestion.question, language)}</p>

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
                              {getText(option, language)}
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

                          {fullTestIndex === data.fullTestQuestions.length - 1 ? (
                            <Button 
                              onClick={() => setFullTestSubmitted(true)}
                              disabled={fullTestAnsweredCount < data.fullTestQuestions.length}
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
                        <div className="text-6xl mb-4">{calculateFullTestScore() / data.fullTestQuestions.length >= 0.7 ? '🎉' : '📚'}</div>
                        <p className="text-lg text-muted-foreground mb-2">{t.score}:</p>
                        <div className="text-4xl font-bold text-primary mb-2">
                          {calculateFullTestScore()}/{data.fullTestQuestions.length}
                        </div>
                        <Progress value={(calculateFullTestScore() / data.fullTestQuestions.length) * 100} className="w-64 mx-auto mb-4" />
                        <p className="text-xl mb-6">{Math.round((calculateFullTestScore() / data.fullTestQuestions.length) * 100)}%</p>
                        <Button onClick={restartFullTest} size="lg">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {t.retake}
                        </Button>
                      </CardContent>
                    </Card>

                    <h3 className="text-xl font-semibold">{language === 'ru' ? 'Разбор ответов' : 'Answer Review'}</h3>
                    {data.fullTestQuestions.map((q, idx) => {
                      const userAnswer = fullTestAnswers[idx];
                      const isCorrect = userAnswer === q.correctAnswer;
                      
                      return (
                        <Card key={q.id} className={cn('border-l-4', isCorrect ? 'border-l-green-500' : 'border-l-destructive')}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3 mb-3">
                              {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                              <div>
                                <p className="font-medium">{getText(q.question, language)}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {language === 'ru' ? 'Ваш ответ' : 'Your answer'}: {String.fromCharCode(65 + userAnswer)}. {getText(q.options[userAnswer], language)}
                                </p>
                                {!isCorrect && (
                                  <p className="text-sm text-green-600 mt-1">
                                    {language === 'ru' ? 'Правильный ответ' : 'Correct'}: {String.fromCharCode(65 + q.correctAnswer)}. {getText(q.options[q.correctAnswer], language)}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground mt-2">{getText(q.explanation, language)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Dynamic AI Lesson Tab */}
              <TabsContent value="dynamic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.dynamic}</h2>
                </div>

                {!selectedStyle ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{t.selectStyle}</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {(Object.keys(styleIcons) as LearningStyle[]).map((style) => (
                        <Card 
                          key={style} 
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setSelectedStyle(style)}
                        >
                          <CardContent className="pt-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {styleIcons[style]}
                            </div>
                            <h3 className="font-semibold mb-1">{t.styleNames[style]}</h3>
                            <p className="text-sm text-muted-foreground">{t.styleDescriptions[style]}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {styleIcons[selectedStyle]}
                        <h3 className="text-xl font-semibold">{t.styleNames[selectedStyle]}</h3>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedStyle(null)}>
                        {t.changeStyle}
                      </Button>
                    </div>

                    {(() => {
                      const lesson = data.dynamicLessons.find(l => l.learningStyle === selectedStyle);
                      if (!lesson) return null;
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle>{getText(lesson.title, language)}</CardTitle>
                            <p className="text-sm text-muted-foreground">{getText(lesson.approach, language)}</p>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="p-4 bg-primary/5 rounded-lg">
                              <p>{getText(lesson.introduction, language)}</p>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-semibold">{language === 'ru' ? 'Содержание' : 'Content'}</h4>
                              {lesson.mainContent.map((content, idx) => (
                                <p key={idx} className="text-muted-foreground whitespace-pre-wrap">{getText(content, language)}</p>
                              ))}
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-semibold">{language === 'ru' ? 'Примеры' : 'Examples'}</h4>
                              {lesson.examples.map((example, idx) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <p className="text-sm">{getText(example, language)}</p>
                                </div>
                              ))}
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-semibold mb-2">{language === 'ru' ? 'Итог' : 'Summary'}</h4>
                              <p>{getText(lesson.summary, language)}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">{language === 'ru' ? 'Советы' : 'Tips'}</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {lesson.tips.map((tip, idx) => (
                                  <li key={idx} className="text-sm text-muted-foreground">{getText(tip, language)}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ru' ? 'Содержание' : 'Contents'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabIcons[tab]}
                    {t.tabs[tab]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
