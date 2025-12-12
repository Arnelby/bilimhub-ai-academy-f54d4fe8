import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLessonData, useStorageImage, LessonData } from '@/hooks/useLessonData';
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
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language } from '@/lib/i18n';
import { toast } from 'sonner';

// Import exponent images
import exponentRulesCheatsheet from '@/assets/lessons/exponent-rules-cheatsheet.png';
import exponentSimplificationFlowchart from '@/assets/lessons/exponent-simplification-flowchart.png';
import exponentNegativeZeroDiagram from '@/assets/lessons/exponent-negative-zero-diagram.png';

// Import fraction images
import fractionOperationsCheatsheet from '@/assets/lessons/fraction-operations-cheatsheet.png';
import fractionConversionFlowchart from '@/assets/lessons/fraction-conversion-flowchart.png';
import fractionDivisionSteps from '@/assets/lessons/fraction-division-steps.png';

// Static image maps per topic
const topicImages: Record<string, Record<string, string>> = {
  fractions: {
    'diag-1': fractionOperationsCheatsheet,
    'diag-2': fractionConversionFlowchart,
    'diag-3': fractionDivisionSteps,
  },
  exponents: {
    'diag-1': exponentRulesCheatsheet,
    'diag-2': exponentSimplificationFlowchart,
    'diag-3': exponentNegativeZeroDiagram,
  },
};

// Video URL overrides per topic (overrides JSON values)
const topicVideos: Record<string, string> = {
  fractions: 'https://youtu.be/UJbYTA-1rYc',
  exponents: 'https://youtu.be/4-j-tKt6gIo',
};

type TabType = 'basic' | 'mini' | 'diagrams' | 'mistakes' | 'miniTests' | 'fullTest' | 'dynamic';
type LearningStyle = 'visual' | 'auditory' | 'text-based' | 'problem-solver' | 'adhd-friendly';
type Difficulty = 'easy' | 'medium' | 'hard';

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

// Helper to get text from multilang object or string
function getText(obj: { en: string; ru: string; kg: string } | string | undefined, lang: Language): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
}

// Helper to get rules as array (handles both array of multilang objects and multilang object with arrays)
function getRulesArray(rules: any, lang: Language): string[] {
  if (!rules) return [];
  // If it's a multilang object with arrays (like exponents)
  if (rules[lang] && Array.isArray(rules[lang])) {
    return rules[lang];
  }
  // If it's an array of multilang objects (like fractions)
  if (Array.isArray(rules)) {
    return rules.map(r => getText(r, lang));
  }
  return [];
}

// Helper to get examples from either examples or worked_examples
function getExamples(basicLesson: any): any[] {
  if (basicLesson.examples && Array.isArray(basicLesson.examples)) {
    return basicLesson.examples;
  }
  if (basicLesson.worked_examples && Array.isArray(basicLesson.worked_examples)) {
    return basicLesson.worked_examples;
  }
  return [];
}

// Helper to get theory/content
function getTheoryText(basicLesson: any, lang: Language): string {
  if (basicLesson.theory) return getText(basicLesson.theory, lang);
  if (basicLesson.content) return getText(basicLesson.content, lang);
  return '';
}

// Video Embed component
function VideoEmbed({ url }: { url?: string }) {
  const { language } = useLanguage();
  
  if (!url) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
        <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Видео будет добавлено скоро' : language === 'kg' ? 'Видео жакында кошулат' : 'Video will be added soon'}
        </p>
      </div>
    );
  }

  // Extract YouTube video ID
  const getYouTubeId = (urlStr: string) => {
    const match = urlStr.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);
  
  if (videoId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {language === 'ru' ? 'Смотреть видео' : language === 'kg' ? 'Видеону көрүү' : 'Watch video'}
    </a>
  );
}

// Diagram Image component with auto-generate fallback
function DiagramImage({ imagePath, title, topicId }: { imagePath: string; title: string; topicId: string }) {
  const images = topicImages[topicId] || {};
  
  // Check if it's an auto-generate placeholder
  if (imagePath === 'auto-generate' || !imagePath) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
        <p className="text-muted-foreground text-sm">{title}</p>
        <Badge variant="outline" className="mt-2">AI Generated</Badge>
      </div>
    );
  }

  // Check if we have a static image for this diagram ID
  const staticImage = images[imagePath];
  if (staticImage) {
    return (
      <img 
        src={staticImage} 
        alt={title}
        className="w-full rounded-lg shadow-md"
      />
    );
  }

  // Otherwise try to load from storage
  return <StorageImage path={imagePath} alt={title} />;
}

// Storage Image component
function StorageImage({ path, alt }: { path: string; alt: string }) {
  const url = useStorageImage(path);
  
  if (!url) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{alt}</p>
      </div>
    );
  }

  return <img src={url} alt={alt} className="w-full rounded-lg shadow-md" />;
}

export default function DynamicLessonViewer() {
  const { topicId } = useParams<{ topicId: string }>();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Mapping from topic IDs to lesson JSON files in storage (exact paths in bucket)
  const lessonPathMap: Record<string, string> = {
    fractions: 'fractions/fraction.json',
    exponents: 'exponents/exponents.json',
  };

  // Fetch lesson data from storage (JSON is the single source of truth)
  const bucketPath =
    (topicId && lessonPathMap[topicId]) ||
    (topicId ? `${topicId}/${topicId}.json` : '');

  const { data, loading, error } = useLessonData(bucketPath);
  
  // Mini-tests state
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [miniTestIndex, setMiniTestIndex] = useState(0);
  const [miniTestAnswer, setMiniTestAnswer] = useState<string | null>(null);
  const [miniTestShowResult, setMiniTestShowResult] = useState(false);
  const [miniTestScore, setMiniTestScore] = useState(0);
  const [miniTestTotal, setMiniTestTotal] = useState(0);
  
  // Full test state
  const [fullTestIndex, setFullTestIndex] = useState(0);
  const [fullTestAnswers, setFullTestAnswers] = useState<Record<number, string>>({});
  const [fullTestSubmitted, setFullTestSubmitted] = useState(false);
  
  // Dynamic lesson state
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  
  // Notes state
  const [lessonNotes, setLessonNotes] = useState<string>(() => {
    return localStorage.getItem(`${topicId}_lesson_notes`) || '';
  });

  const saveNotes = () => {
    localStorage.setItem(`${topicId}_lesson_notes`, lessonNotes);
    toast.success(language === 'ru' ? 'Заметки сохранены!' : 'Notes saved!');
  };

  const t = {
    title: data ? getText({ en: data.topic, ru: data.topic_ru || data.topic, kg: data.topic_kg || data.topic }, language) : '',
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
    definitions: language === 'ru' ? 'Определения' : language === 'kg' ? 'Аныктамалар' : 'Definitions',
    rules: language === 'ru' ? 'Правила' : language === 'kg' ? 'Эрежелер' : 'Rules',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    restart: language === 'ru' ? 'Начать заново' : language === 'kg' ? 'Кайра баштоо' : 'Restart',
    submit: language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти бүтүрүү' : 'Submit Test',
    retake: language === 'ru' ? 'Пройти заново' : language === 'kg' ? 'Кайра өтүү' : 'Retake Test',
    score: language === 'ru' ? 'Ваш результат' : language === 'kg' ? 'Сиздин жыйынтык' : 'Your Score',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окуу стилин тандаңыз' : 'Select Your Learning Style',
    changeStyle: language === 'ru' ? 'Изменить стиль' : language === 'kg' ? 'Стилди өзгөртүү' : 'Change Style',
    difficulty: {
      easy: language === 'ru' ? 'Легкий' : language === 'kg' ? 'Жеңил' : 'Easy',
      medium: language === 'ru' ? 'Средний' : language === 'kg' ? 'Орточо' : 'Medium',
      hard: language === 'ru' ? 'Сложный' : language === 'kg' ? 'Кыйын' : 'Hard',
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
    notesPlaceholder: language === 'ru' ? 'Запишите свои заметки здесь...' : language === 'kg' ? 'Жазууларыңызды бул жерге жазыңыз...' : 'Write your notes here...',
    saveNotes: language === 'ru' ? 'Сохранить заметки' : language === 'kg' ? 'Жазууларды сактоо' : 'Save Notes',
  };

  // Mini-test logic
  const filteredMiniTestQuestions = data?.mini_tests?.filter(q => q.difficulty === currentDifficulty) || [];
  const currentMiniTestQuestion = filteredMiniTestQuestions[miniTestIndex];

  const handleMiniTestAnswer = (answer: string) => {
    if (miniTestShowResult) return;
    setMiniTestAnswer(answer);
  };

  const checkMiniTestAnswer = () => {
    if (miniTestAnswer === null || !currentMiniTestQuestion) return;
    setMiniTestShowResult(true);
    setMiniTestTotal(prev => prev + 1);
    if (miniTestAnswer === currentMiniTestQuestion.correct) {
      setMiniTestScore(prev => prev + 1);
      // Increase difficulty
      if (currentDifficulty === 'easy') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium') setCurrentDifficulty('hard');
    } else {
      // Decrease difficulty
      if (currentDifficulty === 'hard') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium') setCurrentDifficulty('easy');
    }
  };

  const nextMiniTestQuestion = () => {
    const newFilteredQuestions = data?.mini_tests?.filter(q => q.difficulty === currentDifficulty) || [];
    if (newFilteredQuestions.length === 0) {
      setMiniTestIndex(0);
    } else {
      setMiniTestIndex((prev) => (prev + 1) % newFilteredQuestions.length);
    }
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
  };

  const restartMiniTest = () => {
    setCurrentDifficulty('easy');
    setMiniTestIndex(0);
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
    setMiniTestScore(0);
    setMiniTestTotal(0);
  };

  // Full test logic
  const currentFullTestQuestion = data?.full_test?.[fullTestIndex];
  const fullTestAnsweredCount = Object.keys(fullTestAnswers).length;

  const handleFullTestAnswer = (answer: string) => {
    setFullTestAnswers(prev => ({ ...prev, [fullTestIndex]: answer }));
  };

  const calculateFullTestScore = () => {
    let correct = 0;
    data?.full_test?.forEach((q, idx) => {
      if (fullTestAnswers[idx] === q.correct) correct++;
    });
    return correct;
  };

  const restartFullTest = () => {
    setFullTestIndex(0);
    setFullTestAnswers({});
    setFullTestSubmitted(false);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {language === 'ru' ? 'Урок не найден' : 'Lesson not found'}
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link to="/lessons">{t.back}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

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
              <TabsList className="w-full flex-wrap h-auto gap-1 mb-6">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab}
                    className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tabIcons[tab]}
                    <span className="text-xs hidden sm:inline">{t.tabs[tab]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Basic Lesson Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{getText(data.basic_lesson.title, language)}</h2>
                </div>
                
                {/* Video */}
                {data.basic_lesson.video && (
                  <Card>
                    <CardContent className="pt-6">
                      <VideoEmbed url={topicVideos[topicId!] || data.basic_lesson.video} />
                    </CardContent>
                  </Card>
                )}

                {/* Theory/Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">📚 {t.theory}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{getTheoryText(data.basic_lesson, language)}</p>
                  </CardContent>
                </Card>

                {/* Definitions */}
                {data.basic_lesson.definitions && data.basic_lesson.definitions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">📖 {t.definitions}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.basic_lesson.definitions.map((def, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-primary">{getText(def.term, language)}</h4>
                          <p className="text-muted-foreground mt-1">{getText(def.definition, language)}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Rules */}
                {(() => {
                  const rulesArr = getRulesArray(data.basic_lesson.rules, language);
                  if (rulesArr.length === 0) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">📐 {t.rules}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {rulesArr.map((rule, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <p className="text-muted-foreground">{rule}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Examples */}
                {(() => {
                  const examples = getExamples(data.basic_lesson);
                  if (examples.length === 0) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">💡 {t.examples}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {examples.map((example, idx) => (
                          <div key={idx} className="p-4 border rounded-lg space-y-3">
                            <Badge variant="outline">{t.examples} {idx + 1}</Badge>
                            <h4 className="font-semibold">{getText(example.title, language)}</h4>
                            <div className="bg-muted/50 p-3 rounded">
                              <p className="font-medium">{getText(example.problem, language)}</p>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded border-l-4 border-green-500">
                              <p>{getText(example.solution, language)}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5" />
                      {language === 'ru' ? 'Мои заметки' : 'My Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                      placeholder={t.notesPlaceholder}
                      className="min-h-[120px]"
                    />
                    <Button onClick={saveNotes} size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      {t.saveNotes}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mini Lessons Tab */}
              <TabsContent value="mini" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mini}</h2>
                  <Badge variant="outline">{data.mini_lessons?.length || 0} {language === 'ru' ? 'уроков' : 'lessons'}</Badge>
                </div>

                {data.mini_lessons?.map((lesson, idx) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Badge>{idx + 1}</Badge>
                          {getText(lesson.title, language)}
                        </CardTitle>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {lesson.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{getText(lesson.summary, language)}</p>
                      <VideoEmbed url={lesson.video} />
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{getText(lesson.content, language)}</p>
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
                  <Badge variant="outline">{data.diagrams?.length || 0}</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {data.diagrams?.map((diagram) => (
                    <Card key={diagram.id}>
                      <CardHeader>
                        <CardTitle>{getText(diagram.title, language)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">{getText(diagram.description, language)}</p>
                        <DiagramImage 
                          imagePath={diagram.image} 
                          title={getText(diagram.title, language)} 
                          topicId={topicId || ''} 
                        />
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
                  <Badge variant="outline">{data.common_mistakes?.length || 0}</Badge>
                </div>

                {data.common_mistakes?.map((mistake, idx) => (
                  <Card key={mistake.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-6 w-6 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-destructive">{language === 'ru' ? 'Ошибка' : 'Mistake'} {idx + 1}</h4>
                          <p className="text-muted-foreground">{getText(mistake.mistake, language)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-6 w-6 text-warning mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-warning">{language === 'ru' ? 'Почему это неправильно' : 'Why it is wrong'}</h4>
                          <p className="text-muted-foreground">{getText(mistake.why, language)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-500">{language === 'ru' ? 'Как исправить' : 'How to fix'}</h4>
                          <p className="text-muted-foreground">{getText(mistake.fix, language)}</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="font-medium mb-1">{language === 'ru' ? 'Пример' : 'Example'}</h4>
                        <p className="font-mono text-sm">{getText(mistake.example, language)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Mini-Tests Tab */}
              <TabsContent value="miniTests" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.miniTests}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentDifficulty === 'easy' ? 'default' : 'outline'}>
                      {t.difficulty.easy}
                    </Badge>
                    <Badge variant={currentDifficulty === 'medium' ? 'default' : 'outline'}>
                      {t.difficulty.medium}
                    </Badge>
                    <Badge variant={currentDifficulty === 'hard' ? 'default' : 'outline'}>
                      {t.difficulty.hard}
                    </Badge>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{language === 'ru' ? 'Счёт' : 'Score'}: {miniTestScore}/{miniTestTotal}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={restartMiniTest}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        {t.restart}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentMiniTestQuestion ? (
                      <>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{getText(currentMiniTestQuestion.question, language)}</p>
                        </div>
                        
                        <div className="grid gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((option) => (
                            <Button
                              key={option}
                              variant="outline"
                              className={cn(
                                'justify-start h-auto py-3 px-4',
                                miniTestAnswer === option && !miniTestShowResult && 'border-primary bg-primary/10',
                                miniTestShowResult && option === currentMiniTestQuestion.correct && 'border-green-500 bg-green-500/10',
                                miniTestShowResult && miniTestAnswer === option && option !== currentMiniTestQuestion.correct && 'border-destructive bg-destructive/10'
                              )}
                              onClick={() => handleMiniTestAnswer(option)}
                              disabled={miniTestShowResult}
                            >
                              <span className="font-bold mr-2">{option}.</span>
                              {getText(currentMiniTestQuestion.options[option], language)}
                            </Button>
                          ))}
                        </div>

                        {miniTestShowResult && (
                          <div className={cn(
                            'p-4 rounded-lg',
                            miniTestAnswer === currentMiniTestQuestion.correct ? 'bg-green-500/10' : 'bg-destructive/10'
                          )}>
                            {miniTestAnswer === currentMiniTestQuestion.correct ? (
                              <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">{language === 'ru' ? 'Правильно!' : 'Correct!'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-destructive">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">{language === 'ru' ? 'Неправильно' : 'Incorrect'}</span>
                              </div>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                              {getText(currentMiniTestQuestion.explanation, language)}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!miniTestShowResult ? (
                            <Button onClick={checkMiniTestAnswer} disabled={miniTestAnswer === null}>
                              {language === 'ru' ? 'Проверить' : 'Check'}
                            </Button>
                          ) : (
                            <Button onClick={nextMiniTestQuestion}>
                              {t.next}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ru' ? 'Нет вопросов для текущего уровня сложности' : 'No questions for current difficulty'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Full Test Tab */}
              <TabsContent value="fullTest" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.fullTest}</h2>
                  <Badge variant="outline">{data.full_test?.length || 0} {language === 'ru' ? 'вопросов' : 'questions'}</Badge>
                </div>

                {fullTestSubmitted ? (
                  // Results
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.score}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-6">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {calculateFullTestScore()}/{data.full_test?.length || 0}
                        </div>
                        <div className="text-2xl text-muted-foreground">
                          {Math.round((calculateFullTestScore() / (data.full_test?.length || 1)) * 100)}%
                        </div>
                        <Progress 
                          value={(calculateFullTestScore() / (data.full_test?.length || 1)) * 100} 
                          className="h-3 mt-4"
                        />
                      </div>

                      <Button onClick={restartFullTest} className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t.retake}
                      </Button>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold">{language === 'ru' ? 'Обзор ответов' : 'Answer Review'}</h3>
                        {data.full_test?.map((q, idx) => {
                          const userAnswer = fullTestAnswers[idx];
                          const isCorrect = userAnswer === q.correct;
                          return (
                            <div key={q.id} className={cn(
                              'p-4 rounded-lg border',
                              isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-destructive/5 border-destructive/30'
                            )}>
                              <div className="flex items-start gap-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{idx + 1}. {getText(q.question, language)}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {language === 'ru' ? 'Ваш ответ' : 'Your answer'}: {userAnswer || '-'} | {language === 'ru' ? 'Правильный' : 'Correct'}: {q.correct}
                                  </p>
                                  <p className="text-sm mt-2">{getText(q.explanation, language)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Test taking
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {language === 'ru' ? 'Вопрос' : 'Question'} {fullTestIndex + 1}/{data.full_test?.length || 0}
                        </CardTitle>
                        <Badge variant="outline">
                          {fullTestAnsweredCount}/{data.full_test?.length || 0} {language === 'ru' ? 'отвечено' : 'answered'}
                        </Badge>
                      </div>
                      <Progress value={(fullTestAnsweredCount / (data.full_test?.length || 1)) * 100} className="h-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentFullTestQuestion && (
                        <>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-medium">{getText(currentFullTestQuestion.question, language)}</p>
                          </div>

                          <div className="grid gap-2">
                            {(['A', 'B', 'C', 'D'] as const).map((option) => (
                              <Button
                                key={option}
                                variant="outline"
                                className={cn(
                                  'justify-start h-auto py-3 px-4',
                                  fullTestAnswers[fullTestIndex] === option && 'border-primary bg-primary/10'
                                )}
                                onClick={() => handleFullTestAnswer(option)}
                              >
                                <span className="font-bold mr-2">{option}.</span>
                                {getText(currentFullTestQuestion.options[option], language)}
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

                            {fullTestIndex === (data.full_test?.length || 0) - 1 ? (
                              <Button 
                                onClick={() => setFullTestSubmitted(true)}
                                disabled={fullTestAnsweredCount < (data.full_test?.length || 0)}
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

                          {/* Question navigation */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            {data.full_test?.map((_, idx) => (
                              <Button
                                key={idx}
                                variant={fullTestAnswers[idx] ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                  'w-10 h-10',
                                  fullTestIndex === idx && 'ring-2 ring-primary ring-offset-2'
                                )}
                                onClick={() => setFullTestIndex(idx)}
                              >
                                {idx + 1}
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Dynamic Lessons Tab */}
              <TabsContent value="dynamic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.dynamic}</h2>
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    AI Personalized
                  </Badge>
                </div>

                {!selectedStyle ? (
                  // Style selection
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.selectStyle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(Object.keys(styleIcons) as LearningStyle[]).map((style) => (
                          <Button
                            key={style}
                            variant="outline"
                            className="h-auto flex-col gap-3 py-6"
                            onClick={() => setSelectedStyle(style)}
                          >
                            <div className="p-3 rounded-full bg-primary/10">
                              {styleIcons[style]}
                            </div>
                            <span className="font-semibold">{t.styleNames[style]}</span>
                            <span className="text-xs text-muted-foreground">{t.styleDescriptions[style]}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Dynamic lesson content
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-base py-1 px-3">
                        {styleIcons[selectedStyle]}
                        <span className="ml-2">{t.styleNames[selectedStyle]}</span>
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStyle(null)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        {t.changeStyle}
                      </Button>
                    </div>

                    {data.dynamic_lessons && selectedStyle && (() => {
                      const styleKey = selectedStyle as keyof LessonData['dynamic_lessons'];
                      const lessonContent = data.dynamic_lessons[styleKey];
                      
                      if (!lessonContent) return (
                        <div className="text-center py-8 text-muted-foreground">
                          {language === 'ru' ? 'Контент для этого стиля не найден' : 'Content for this style not found'}
                        </div>
                      );

                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle>{getText(lessonContent.title, language)}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="prose prose-sm max-w-none">
                              <p className="whitespace-pre-wrap">{getText(lessonContent.content, language)}</p>
                            </div>
                            
                            {lessonContent.examples?.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-3">{t.examples}</h4>
                                  <div className="space-y-3">
                                    {lessonContent.examples.map((example, idx) => (
                                      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                                        <Badge variant="outline" className="mb-2">{idx + 1}</Badge>
                                        <p>{getText(example, language)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Lesson Tree */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{language === 'ru' ? 'Содержание' : 'Contents'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                    size="sm"
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
