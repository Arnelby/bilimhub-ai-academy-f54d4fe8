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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Import exponent images
import exponentRulesCheatsheet from '@/assets/lessons/exponent-rules-cheatsheet.png';
import exponentSimplificationFlowchart from '@/assets/lessons/exponent-simplification-flowchart.png';
import exponentNegativeZeroDiagram from '@/assets/lessons/exponent-negative-zero-diagram.png';

// Import fraction images
import fractionOperationsCheatsheet from '@/assets/lessons/fraction-operations-cheatsheet.png';
import fractionConversionFlowchart from '@/assets/lessons/fraction-conversion-flowchart.png';
import fractionDivisionSteps from '@/assets/lessons/fraction-division-steps.png';

// Import lesson tests data (simple format)
import { lessonTests, SimpleTestQuestion } from '@/data/lessonTestsData';

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

// Use imported test data from lessonTestsData.ts
// Tests are now in simple format: { id, question, options: string[], correct: string, explanation, difficulty? }

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
function DiagramImage({ imagePath, diagramId, title, topicId }: { imagePath: string; diagramId: string; title: string; topicId: string }) {
  const images = topicImages[topicId] || {};
  
  // First check if we have a static image for this diagram ID
  const staticImage = images[diagramId];
  if (staticImage) {
    return (
      <img 
        src={staticImage} 
        alt={title}
        className="w-full rounded-lg shadow-md"
      />
    );
  }
  
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Normalize topicId to handle singular/plural variants
  const normalizedTopicId = topicId === 'exponent' ? 'exponents' 
    : topicId === 'quadratic' ? 'quadratics' 
    : topicId;
  
  // Mapping from topic IDs to lesson JSON files in storage (exact paths in bucket)
  const lessonPathMap: Record<string, string> = {
    fractions: 'fractions/fraction.json',
    exponents: 'exponents/exponents.json',
    quadratics: 'quadratics/quadratics.json',
  };

  // Fetch lesson data from storage (JSON is the single source of truth)
  const bucketPath =
    (normalizedTopicId && lessonPathMap[normalizedTopicId]) ||
    (normalizedTopicId ? `${normalizedTopicId}/${normalizedTopicId}.json` : '');

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
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [aiPracticeAnswers, setAiPracticeAnswers] = useState<Record<number, number>>({});
  const [showAiResults, setShowAiResults] = useState(false);
  
  // Notes state
  const [lessonNotes, setLessonNotes] = useState<string>(() => {
    return localStorage.getItem(`${normalizedTopicId}_lesson_notes`) || '';
  });

  const saveNotes = () => {
    localStorage.setItem(`${normalizedTopicId}_lesson_notes`, lessonNotes);
    toast.success(language === 'ru' ? 'Заметки сохранены!' : 'Notes saved!');
  };

  // AI Lesson generation
  const fetchStudentResults = async () => {
    if (!user) return null;
    try {
      const { data: miniTestResults } = await supabase
        .from('mini_test_results')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      const { data: testResults } = await supabase
        .from('user_tests')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      let totalCorrect = 0;
      let totalQuestions = 0;
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
      const weakAreas = accuracy < 60 ? ['Сложение дробей', 'Вычитание дробей'] : accuracy < 80 ? ['Умножение дробей'] : [];

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

  const generateAILesson = async (style: LearningStyle) => {
    setIsGeneratingLesson(true);
    setGeneratedLesson(null);
    setAiPracticeAnswers({});
    setShowAiResults(false);

    try {
      const studentResults = await fetchStudentResults();
      const topicName = normalizedTopicId === 'fractions' ? 'Дроби (Fractions)' : normalizedTopicId === 'exponents' ? 'Степени (Exponents)' : normalizedTopicId === 'quadratics' ? 'Квадратные уравнения (Quadratic Equations)' : normalizedTopicId;

      const { data, error } = await supabase.functions.invoke('ai-generate-lesson', {
        body: { topic: topicName, learningStyle: style, studentResults, language }
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
      setIsGeneratingLesson(false);
    }
  };

  const handleStyleSelect = (style: LearningStyle) => {
    setSelectedStyle(style);
    generateAILesson(style);
  };

  const handleAiAnswerSelect = (qIdx: number, oIdx: number) => {
    if (showAiResults) return;
    setAiPracticeAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const checkAiAnswers = () => setShowAiResults(true);
  const resetAiPractice = () => { setAiPracticeAnswers({}); setShowAiResults(false); };

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

  // Mini-test logic - use imported test data from lessonTestsData.ts
  // Helper to get fallback mini tests by topic
  const getMiniTestFallback = (): SimpleTestQuestion[] => {
    const topicKey = normalizedTopicId as keyof typeof lessonTests;
    return lessonTests[topicKey]?.miniTests || [];
  };
  
  const miniTestSource = (data?.mini_tests && data.mini_tests.length > 0) 
    ? data.mini_tests 
    : getMiniTestFallback();
  const filteredMiniTestQuestions = miniTestSource.filter((q: any) => q.difficulty === currentDifficulty) || [];
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
    const miniTestSrc = (data?.mini_tests && data.mini_tests.length > 0) 
      ? data.mini_tests 
      : getMiniTestFallback();
    const newFilteredQuestions = miniTestSrc.filter((q: any) => q.difficulty === currentDifficulty) || [];
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

  // Helper to get fallback full test by topic
  const getFullTestFallback = (): SimpleTestQuestion[] => {
    const topicKey = normalizedTopicId as keyof typeof lessonTests;
    return lessonTests[topicKey]?.fullTest || [];
  };
  
  // Full test logic - use fallback questions if no full_test in data
  const fullTestSource = (data?.full_test && data.full_test.length > 0)
    ? data.full_test
    : getFullTestFallback();
  const currentFullTestQuestion = fullTestSource[fullTestIndex];
  const fullTestAnsweredCount = Object.keys(fullTestAnswers).length;

  const handleFullTestAnswer = (answer: string) => {
    setFullTestAnswers(prev => ({ ...prev, [fullTestIndex]: answer }));
  };

  const calculateFullTestScore = () => {
    let correct = 0;
    fullTestSource.forEach((q: any, idx: number) => {
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

  // Check if we have fallback data available for this topic
  const hasFallbackContent = normalizedTopicId === 'fractions' || normalizedTopicId === 'exponents' || normalizedTopicId === 'quadratics';

  // Error state - only show error if we have no fallback content
  if ((error || !data) && !hasFallbackContent) {
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
                {data?.basic_lesson ? (
                  <>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-bold">{getText(data.basic_lesson.title, language)}</h2>
                    </div>
                    
                    {/* Video */}
                    {data.basic_lesson.video && (
                      <Card>
                        <CardContent className="pt-6">
                          <VideoEmbed url={topicVideos[normalizedTopicId!] || data.basic_lesson.video} />
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
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'ru' ? 'Основной урок будет добавлен позже. Вы можете пройти мини-тесты и полный тест.' : 'Basic lesson content coming soon. You can take the mini-tests and full test.'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Mini Lessons Tab */}
              <TabsContent value="mini" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mini}</h2>
                  <Badge variant="outline">{data?.mini_lessons?.length || 0} {language === 'ru' ? 'уроков' : 'lessons'}</Badge>
                </div>

                {data?.mini_lessons && data.mini_lessons.length > 0 ? (
                  data.mini_lessons.map((lesson, idx) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ru' ? 'Мини-уроки будут добавлены позже' : 'Mini lessons coming soon'}
                  </div>
                )}
              </TabsContent>

              {/* Diagrams Tab */}
              <TabsContent value="diagrams" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.diagrams}</h2>
                  <Badge variant="outline">{data?.diagrams?.length || 0}</Badge>
                </div>

                {data?.diagrams && data.diagrams.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {data.diagrams.map((diagram) => (
                      <Card key={diagram.id}>
                        <CardHeader>
                          <CardTitle>{getText(diagram.title, language)}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-muted-foreground text-sm">{getText(diagram.description, language)}</p>
                          <DiagramImage 
                            imagePath={diagram.image} 
                            diagramId={diagram.id}
                            title={getText(diagram.title, language)} 
                            topicId={normalizedTopicId || ''} 
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ru' ? 'Диаграммы будут добавлены позже' : 'Diagrams coming soon'}
                  </div>
                )}
              </TabsContent>

              {/* Common Mistakes Tab */}
              <TabsContent value="mistakes" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <h2 className="text-2xl font-bold">{t.tabs.mistakes}</h2>
                  <Badge variant="outline">{data?.common_mistakes?.length || 0}</Badge>
                </div>

                {data?.common_mistakes && data.common_mistakes.length > 0 ? (
                  data.common_mistakes.map((mistake, idx) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ru' ? 'Типичные ошибки будут добавлены позже' : 'Common mistakes coming soon'}
                  </div>
                )}
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
                      (() => {
                        // Handle both simple format (string[]) and old format (object with A/B/C/D)
                        const isSimpleFormat = Array.isArray(currentMiniTestQuestion.options);
                        const options: string[] = isSimpleFormat 
                          ? (currentMiniTestQuestion.options as string[])
                          : ['A', 'B', 'C', 'D'].map(key => getText((currentMiniTestQuestion.options as any)[key], language));
                        const questionText = typeof currentMiniTestQuestion.question === 'string' 
                          ? currentMiniTestQuestion.question 
                          : getText(currentMiniTestQuestion.question, language);
                        const explanationText = typeof currentMiniTestQuestion.explanation === 'string'
                          ? currentMiniTestQuestion.explanation
                          : getText(currentMiniTestQuestion.explanation, language);
                        
                        return (
                          <>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">{questionText}</p>
                            </div>
                            
                            <div className="grid gap-2">
                              {options.map((optionText: string, idx: number) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className={cn(
                                    'justify-start h-auto py-3 px-4',
                                    miniTestAnswer === optionText && !miniTestShowResult && 'border-primary bg-primary/10',
                                    miniTestShowResult && optionText === currentMiniTestQuestion.correct && 'border-green-500 bg-green-500/10',
                                    miniTestShowResult && miniTestAnswer === optionText && optionText !== currentMiniTestQuestion.correct && 'border-destructive bg-destructive/10'
                                  )}
                                  onClick={() => handleMiniTestAnswer(optionText)}
                                  disabled={miniTestShowResult}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                  {optionText}
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
                                <p className="mt-2 text-sm text-muted-foreground">{explanationText}</p>
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
                        );
                      })()
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
                  <Badge variant="outline">{fullTestSource.length} {language === 'ru' ? 'вопросов' : 'questions'}</Badge>
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
                          {calculateFullTestScore()}/{fullTestSource.length}
                        </div>
                        <div className="text-2xl text-muted-foreground">
                          {Math.round((calculateFullTestScore() / (fullTestSource.length || 1)) * 100)}%
                        </div>
                        <Progress 
                          value={(calculateFullTestScore() / (fullTestSource.length || 1)) * 100} 
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
                        {fullTestSource.map((q: any, idx: number) => {
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
                                  <p className="font-medium">{idx + 1}. {q.question}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {language === 'ru' ? 'Ваш ответ' : 'Your answer'}: {userAnswer || '-'} | {language === 'ru' ? 'Правильный' : 'Correct'}: {q.correct}
                                  </p>
                                  <p className="text-sm mt-2">{q.explanation}</p>
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
                          {language === 'ru' ? 'Вопрос' : 'Question'} {fullTestIndex + 1}/{fullTestSource.length}
                        </CardTitle>
                        <Badge variant="outline">
                          {fullTestAnsweredCount}/{fullTestSource.length} {language === 'ru' ? 'отвечено' : 'answered'}
                        </Badge>
                      </div>
                      <Progress value={(fullTestAnsweredCount / (fullTestSource.length || 1)) * 100} className="h-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentFullTestQuestion && (
                        <>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-medium">
                              {typeof currentFullTestQuestion.question === 'string' 
                                ? currentFullTestQuestion.question 
                                : getText(currentFullTestQuestion.question, language)}
                            </p>
                          </div>

                          <div className="grid gap-2">
                            {(() => {
                              const isSimple = Array.isArray(currentFullTestQuestion.options);
                              const opts: string[] = isSimple 
                                ? (currentFullTestQuestion.options as string[])
                                : ['A', 'B', 'C', 'D'].map(k => getText((currentFullTestQuestion.options as any)[k], language));
                              return opts.map((optText, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className={cn(
                                    'justify-start h-auto py-3 px-4',
                                    fullTestAnswers[fullTestIndex] === optText && 'border-primary bg-primary/10'
                                  )}
                                  onClick={() => handleFullTestAnswer(optText)}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                  {optText}
                                </Button>
                              ));
                            })()}
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

                            {fullTestIndex === fullTestSource.length - 1 ? (
                              <Button 
                                onClick={() => setFullTestSubmitted(true)}
                                disabled={fullTestAnsweredCount < fullTestSource.length}
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
                            {fullTestSource.map((_: any, idx: number) => (
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
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.selectStyle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(Object.keys(styleIcons) as LearningStyle[]).map((style) => (
                          <button
                            key={style}
                            onClick={() => handleStyleSelect(style)}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent hover:border-primary cursor-pointer transition-all"
                          >
                            <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                              {styleIcons[style]}
                            </div>
                            <span className="font-semibold mb-2">{t.styleNames[style]}</span>
                            <span className="text-xs text-muted-foreground text-center">{t.styleDescriptions[style]}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : isGeneratingLesson ? (
                  <Card>
                    <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-lg text-muted-foreground">{language === 'ru' ? 'Генерация урока...' : 'Generating lesson...'}</p>
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Анализируем ваш прогресс и создаем персональный урок...' : 'Analyzing your progress...'}</p>
                    </CardContent>
                  </Card>
                ) : generatedLesson ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-base py-1 px-3">{styleIcons[selectedStyle]}<span className="ml-2">{t.styleNames[selectedStyle]}</span></Badge>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStyle(null); setGeneratedLesson(null); }}><RotateCcw className="h-4 w-4 mr-1" />{t.changeStyle}</Button>
                    </div>

                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{language === 'ru' ? 'Введение' : 'Introduction'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground text-lg leading-relaxed">{generatedLesson.lesson.introduction}</p></CardContent></Card>

                    <Card><CardHeader><CardTitle>{language === 'ru' ? 'Основной материал' : 'Core Lesson'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground whitespace-pre-wrap leading-relaxed">{generatedLesson.lesson.core_lesson}</p></CardContent></Card>

                    {generatedLesson.lesson.weakness_training?.length > 0 && (
                      <Card><CardHeader><CardTitle>{language === 'ru' ? 'Работа над слабыми местами' : 'Weakness Training'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                          {generatedLesson.lesson.weakness_training.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-3">
                              <Badge variant="secondary">{item.area}</Badge>
                              <p className="text-foreground">{item.explanation}</p>
                              <div className="p-3 bg-background rounded border"><p className="font-medium text-sm text-muted-foreground mb-1">{language === 'ru' ? 'Пример:' : 'Example:'}</p><p className="text-foreground">{item.example}</p></div>
                              {item.exercises?.length > 0 && (<ul className="list-disc list-inside space-y-1">{item.exercises.map((ex: string, i: number) => (<li key={i} className="text-foreground">{ex}</li>))}</ul>)}
                              {item.tip && (<div className="flex items-start gap-2 p-2 bg-primary/10 rounded"><span className="text-primary">💡</span><p className="text-sm text-foreground"><strong>{language === 'ru' ? 'Совет:' : 'Tip:'}</strong> {item.tip}</p></div>)}
                            </div>
                          ))}
                        </CardContent></Card>
                    )}

                    {generatedLesson.lesson.practice_questions?.length > 0 && (
                      <Card><CardHeader><CardTitle>{language === 'ru' ? 'Практика' : 'Practice'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                          {generatedLesson.lesson.practice_questions.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="p-4 border rounded-lg space-y-3">
                              <p className="font-medium text-foreground">{qIdx + 1}. {q.question}</p>
                              <div className="grid gap-2">
                                {q.options.map((option: string, oIdx: number) => {
                                  const isSelected = aiPracticeAnswers[qIdx] === oIdx;
                                  const isCorrect = q.correct === oIdx;
                                  let cls = "text-left p-3 rounded border transition-all ";
                                  if (showAiResults) { cls += isCorrect ? "bg-green-100 border-green-500 dark:bg-green-900/30" : isSelected ? "bg-red-100 border-red-500 dark:bg-red-900/30" : "bg-muted/50"; }
                                  else { cls += isSelected ? "bg-primary/20 border-primary" : "bg-muted/50 hover:bg-muted"; }
                                  return (<button key={oIdx} onClick={() => handleAiAnswerSelect(qIdx, oIdx)} className={cls} disabled={showAiResults}>
                                    <div className="flex items-center gap-2">{showAiResults && isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}{showAiResults && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}<span>{String.fromCharCode(65 + oIdx)}. {option}</span></div>
                                  </button>);
                                })}
                              </div>
                              {showAiResults && (<div className="p-3 bg-muted/50 rounded text-sm"><strong>{language === 'ru' ? 'Объяснение:' : 'Explanation:'}</strong> {q.explanation}</div>)}
                            </div>
                          ))}
                          <div className="flex gap-3 pt-4">
                            {!showAiResults ? (<Button onClick={checkAiAnswers} disabled={Object.keys(aiPracticeAnswers).length < generatedLesson.lesson.practice_questions.length}>{language === 'ru' ? 'Проверить ответы' : 'Check Answers'}</Button>) : (<Button variant="outline" onClick={resetAiPractice}>{language === 'ru' ? 'Попробовать снова' : 'Try Again'}</Button>)}
                          </div>
                        </CardContent></Card>
                    )}

                    <Card><CardHeader><CardTitle>{language === 'ru' ? 'Итоги' : 'Summary'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground whitespace-pre-wrap leading-relaxed">{generatedLesson.lesson.final_summary}</p></CardContent></Card>
                  </div>
                ) : null}
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
