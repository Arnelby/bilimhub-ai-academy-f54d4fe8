import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, BookOpen, Target, Heart, ArrowRight, ArrowLeft, Check, Loader2, 
  Sparkles, Timer, Trophy, Lightbulb, Eye, Ear, FileText, Puzzle, 
  ListOrdered, Zap, Clock, ChevronRight, Calendar, GraduationCap, Flag,
  ChevronLeft, Pause, Play
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Section = 'intro' | 'ort_test' | 'learning_style' | 'psychology' | 'preferences' | 'goals' | 'analyzing' | 'complete';
type AnswerOption = "A" | "B" | "C" | "D";

const TOTAL_PAGES = 7;
const TOTAL_ORT_QUESTIONS = 30;
const ORT_DURATION_SECONDS = 1800; // 30 minutes

// Cyrillic to English mapping for answer comparison
const CYRILLIC_TO_ENGLISH: Record<string, string> = {
  "А": "A",
  "Б": "B",
  "В": "C",
  "Г": "D",
};

// ORT Question to Topic mapping - based on real ORT Math structure
// This maps each question number to its topic for mastery calculation
const ORT_QUESTION_TOPICS: Record<number, string> = {
  // Арифметика (Arithmetic)
  1: "Дроби", 2: "Дроби", 3: "Проценты", 4: "Проценты", 5: "Десятичные дроби",
  // Алгебра базовая
  6: "Уравнения", 7: "Уравнения", 8: "Степени", 9: "Степени", 10: "Квадратные корни",
  // Алгебра средняя
  11: "Неравенства", 12: "Неравенства", 13: "Системы уравнений", 14: "Системы уравнений", 15: "Функции",
  // Геометрия плоская
  16: "Треугольники", 17: "Треугольники", 18: "Окружности", 19: "Четырехугольники", 20: "Площади",
  // Геометрия координатная
  21: "Координаты", 22: "Координаты", 23: "Графики функций", 24: "Графики функций", 25: "Пропорции",
  // Комбинаторика и анализ данных
  26: "Текстовые задачи", 27: "Текстовые задачи", 28: "Последовательности", 29: "Вероятность", 30: "Статистика",
};

type IntSanitizeOpts = { min?: number; max?: number; defaultValue: number };

// IMPORTANT: DB columns in user_diagnostic_profile are INTEGER.
// Never send floats or NaN/undefined/null for numeric fields.
const toSafeInt = (value: unknown, opts: IntSanitizeOpts): number => {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, defaultValue } = opts;

  let n: number;

  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string") {
    // Supports inputs like "200+", "6 мес.", "99.44".
    const cleaned = value.replace(/[^\d.-]/g, "");
    n = cleaned ? Number(cleaned) : NaN;
  } else {
    n = Number(value as any);
  }

  if (!Number.isFinite(n)) return defaultValue;

  const rounded = Math.round(n);
  return Math.min(max, Math.max(min, rounded));
};

interface LearningQuestion {
  id: string;
  question: { en: string; ru: string; kg: string };
  options: { en: string[]; ru: string[]; kg: string[] };
  scales: string[];
}

interface PsychologyQuestion {
  id: string;
  question: { en: string; ru: string; kg: string };
  options: { en: string[]; ru: string[]; kg: string[] };
  trait: string;
  scoring: number[];
}

// Learning style detection questions
const learningStyleQuestions: LearningQuestion[] = [
  {
    id: 'learn_1',
    question: {
      en: "When learning something new, I prefer to:",
      ru: "При изучении нового материала я предпочитаю:",
      kg: "Жаңы нерсени үйрөнгөндө мен жакшы көрөм:"
    },
    options: {
      en: ["Watch videos or diagrams", "Listen to explanations", "Read detailed text", "Try solving problems immediately"],
      ru: ["Смотреть видео или диаграммы", "Слушать объяснения", "Читать подробный текст", "Сразу пробовать решать задачи"],
      kg: ["Видеолорду же диаграммаларды көрүү", "Түшүндүрмөлөрдү угуу", "Толук текстти окуу", "Дароо маселелерди чечүүгө аракет кылуу"]
    },
    scales: ["visual", "auditory", "text", "problem_driven"]
  },
  {
    id: 'learn_2',
    question: {
      en: "What helps you understand a topic better?",
      ru: "Что помогает вам лучше понять тему?",
      kg: "Теманы жакшыраак түшүнүүгө эмне жардам берет?"
    },
    options: {
      en: ["Real-life examples", "Theoretical foundations first", "Step-by-step instructions", "Practice problems with solutions"],
      ru: ["Примеры из жизни", "Сначала теоретические основы", "Пошаговые инструкции", "Практические задачи с решениями"],
      kg: ["Турмуштук мисалдар", "Биринчи теориялык негиздер", "Кадам-кадам нускамалар", "Чечүүлөрү менен практикалык маселелер"]
    },
    scales: ["example", "text", "step_by_step", "problem_driven"]
  },
  {
    id: 'learn_3',
    question: {
      en: "How do you best remember formulas?",
      ru: "Как вы лучше запоминаете формулы?",
      kg: "Формулаларды кантип жакшыраак эстейсиз?"
    },
    options: {
      en: ["Visualizing them with colors/shapes", "Repeating them out loud", "Writing them down multiple times", "Using them in problems"],
      ru: ["Визуализируя с цветами/формами", "Повторяя вслух", "Записывая несколько раз", "Применяя в задачах"],
      kg: ["Түстөр/фигуралар менен визуализациялоо", "Катуу айтып кайталоо", "Бир нече жолу жазуу", "Маселелерде колдонуу"]
    },
    scales: ["visual", "auditory", "text", "problem_driven"]
  },
  {
    id: 'learn_4',
    question: {
      en: "What learning pace suits you best?",
      ru: "Какой темп обучения вам подходит?",
      kg: "Окутуунун кайсы темпи сизге туура келет?"
    },
    options: {
      en: ["Quick overview, then details", "Slow and thorough from the start", "Medium pace with regular practice", "Depends on topic difficulty"],
      ru: ["Быстрый обзор, потом детали", "Медленно и тщательно с начала", "Средний темп с регулярной практикой", "Зависит от сложности темы"],
      kg: ["Тез карап чыгуу, анан деталдар", "Башынан жай жана кылдат", "Туруктуу практика менен орточо темп", "Теманын татаалдыгына жараша"]
    },
    scales: ["overview", "thorough", "balanced", "adaptive"]
  },
  {
    id: 'learn_5',
    question: {
      en: "When stuck on a problem, what do you do first?",
      ru: "Когда застряли на задаче, что делаете сначала?",
      kg: "Маселеге тыгылып калганда, эмне кыласыз?"
    },
    options: {
      en: ["Look for similar solved examples", "Re-read the theory", "Break it into smaller steps", "Try different approaches randomly"],
      ru: ["Ищу похожие решённые примеры", "Перечитываю теорию", "Разбиваю на маленькие шаги", "Пробую разные подходы наугад"],
      kg: ["Окшош чечилген мисалдарды издөө", "Теорияны кайра окуу", "Кичине кадамдарга бөлүү", "Туш келди ыкмаларды сынап көрүү"]
    },
    scales: ["example", "text", "step_by_step", "problem_driven"]
  }
];

// Psychological profile questions
const psychologyQuestions: PsychologyQuestion[] = [
  {
    id: 'psych_1',
    question: {
      en: "When faced with a difficult problem, I:",
      ru: "Когда сталкиваюсь со сложной задачей, я:",
      kg: "Кыйын маселеге туш болгондо, мен:"
    },
    options: {
      en: ["Jump right in and figure it out", "Plan my approach carefully first", "Ask for help immediately", "Put it aside for later"],
      ru: ["Сразу берусь за дело", "Сначала тщательно планирую подход", "Сразу прошу помощи", "Откладываю на потом"],
      kg: ["Дароо ишке кирешем", "Биринчи ыкманы кылдат пландайм", "Дароо жардам сурайм", "Кийинчерээкке калтырам"]
    },
    trait: "impulsiveness",
    scoring: [80, 20, 50, 40]
  },
  {
    id: 'psych_2',
    question: {
      en: "When I make a mistake on a test, I:",
      ru: "Когда допускаю ошибку на тесте, я:",
      kg: "Тесте ката кетиргенде, мен:"
    },
    options: {
      en: ["Quickly move on and fix it", "Analyze why it happened", "Feel frustrated but continue", "Use it as a learning opportunity"],
      ru: ["Быстро исправляю и двигаюсь дальше", "Анализирую почему так случилось", "Расстраиваюсь, но продолжаю", "Учусь на этом"],
      kg: ["Тез оңдоп, улантам", "Эмне үчүн болгонун анализдейм", "Капаланам, бирок улантам", "Мындан сабак алам"]
    },
    trait: "stress_resistance",
    scoring: [60, 70, 40, 90]
  },
  {
    id: 'psych_3',
    question: {
      en: "How long can you focus on studying without a break?",
      ru: "Сколько можете учиться без перерыва?",
      kg: "Тыныгуусуз канча убакыт окуй аласыз?"
    },
    options: {
      en: ["15-30 minutes", "30-60 minutes", "1-2 hours", "More than 2 hours"],
      ru: ["15-30 минут", "30-60 минут", "1-2 часа", "Более 2 часов"],
      kg: ["15-30 мүнөт", "30-60 мүнөт", "1-2 саат", "2 сааттан көп"]
    },
    trait: "attention_level",
    scoring: [30, 50, 75, 95]
  },
  {
    id: 'psych_4',
    question: {
      en: "What motivates you most to study?",
      ru: "Что вас больше всего мотивирует учиться?",
      kg: "Сизди окууга эмне көбүрөөк мотивациялайт?"
    },
    options: {
      en: ["Achieving high scores and goals", "Genuine interest in the subject", "Making parents/teachers proud", "Future career benefits"],
      ru: ["Достижение высоких баллов и целей", "Настоящий интерес к предмету", "Гордость родителей/учителей", "Польза для будущей карьеры"],
      kg: ["Жогорку баллдарга жана максаттарга жетүү", "Предметке чыныгы кызыгуу", "Ата-эне/мугалимдердин сыймыктануусу", "Келечектеги карьерага пайда"]
    },
    trait: "motivation_type",
    scoring: [0, 1, 2, 3]
  },
  {
    id: 'psych_5',
    question: {
      en: "When preparing for an important test, I:",
      ru: "Готовясь к важному тесту, я:",
      kg: "Маанилүү тестке даярданганда, мен:"
    },
    options: {
      en: ["Start early and study consistently", "Cram intensively before the test", "Do moderate prep, trust my knowledge", "Study only what I find difficult"],
      ru: ["Начинаю рано и учусь регулярно", "Интенсивно учу перед тестом", "Готовлюсь умеренно, доверяю знаниям", "Учу только сложные темы"],
      kg: ["Эрте баштап, туруктуу окуйм", "Тест алдында катуу окуйм", "Орточо даярданам, билимиме ишенем", "Кыйын темаларды гана окуйм"]
    },
    trait: "consistency",
    scoring: [90, 40, 60, 70]
  },
  {
    id: 'psych_6',
    question: {
      en: "How confident are you in your math abilities?",
      ru: "Насколько вы уверены в своих математических способностях?",
      kg: "Математикалык жөндөмүңүзгө канчалык ишенесиз?"
    },
    options: {
      en: ["Very confident", "Somewhat confident", "Not very confident", "I struggle with math"],
      ru: ["Очень уверен(а)", "Достаточно уверен(а)", "Не очень уверен(а)", "Математика даётся мне тяжело"],
      kg: ["Өтө ишенимдүү", "Жетиштүү ишенимдүү", "Өтө эмес", "Математика мага кыйын"]
    },
    trait: "confidence",
    scoring: [90, 70, 45, 25]
  },
  {
    id: 'psych_7',
    question: {
      en: "When a solution doesn't work, I:",
      ru: "Когда решение не работает, я:",
      kg: "Чечим иштебегенде, мен:"
    },
    options: {
      en: ["Try again patiently", "Get frustrated but persist", "Take a break and return later", "Give up and move on"],
      ru: ["Терпеливо пробую снова", "Раздражаюсь, но продолжаю", "Делаю перерыв и возвращаюсь позже", "Бросаю и перехожу к другому"],
      kg: ["Чыдамдуулук менен кайра аракет кылам", "Ачууланам, бирок улантам", "Тыныгып, кийин кайтам", "Таштап, башкага өтөм"]
    },
    trait: "patience",
    scoring: [90, 60, 70, 20]
  }
];

const encouragements = {
  ort_start: {
    en: "Now take the real ORT Math Part 1 test! This will accurately measure your current level. 🧮",
    ru: "Сейчас пройдите реальный тест ОРТ по математике (часть 1)! Это точно измерит ваш уровень. 🧮",
    kg: "Эми чыныгы ЖРТ Математика 1-бөлүк тестин тапшырыңыз! Бул сиздин деңгээлиңизди так өлчөйт. 🧮"
  },
  learning_start: {
    en: "Great job! Now let's discover your unique learning style! 📚",
    ru: "Отлично! Теперь определим ваш уникальный стиль обучения! 📚",
    kg: "Мыкты! Эми сиздин уникалдуу окуу стилин аныктайлы! 📚"
  },
  psychology_start: {
    en: "Almost there! Tell us about yourself. 🧠",
    ru: "Почти готово! Расскажите о себе. 🧠",
    kg: "Дээрлик бүттү! Өзүңүз жөнүндө айтыңыз. 🧠"
  },
  preferences_start: {
    en: "Almost there! Set your learning preferences. ⚙️",
    ru: "Почти готово! Настройте предпочтения. ⚙️",
    kg: "Дээрлик бүттү! Каалоолорду тандаңыз. ⚙️"
  },
  goals_start: {
    en: "Final step! Tell us about your ORT goals. 🎯",
    ru: "Последний шаг! Расскажите о ваших целях ОРТ. 🎯",
    kg: "Акыркы кадам! ЖРТ максаттарыңыз жөнүндө айтыңыз. 🎯"
  }
};

export default function DiagnosticTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  // Main state
  const [section, setSection] = useState<Section>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // ORT Test state
  const [ortCurrentPage, setOrtCurrentPage] = useState(1);
  const [ortAnswers, setOrtAnswers] = useState<Record<string, string>>({});
  const [ortCorrectAnswers, setOrtCorrectAnswers] = useState<Record<string, string>>({});
  const [ortTimeLeft, setOrtTimeLeft] = useState(ORT_DURATION_SECONDS);
  const [ortImageUrl, setOrtImageUrl] = useState<string | null>(null);
  const [ortImageLoading, setOrtImageLoading] = useState(false);
  const [ortLoading, setOrtLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Learning & Psychology answers
  const [learningAnswers, setLearningAnswers] = useState<{questionId: string; answer: number; scales: string[]}[]>([]);
  const [psychologyAnswers, setPsychologyAnswers] = useState<{questionId: string; answer: number; trait: string; score: number}[]>([]);
  
  // Preferences & Goals
  const [preferences, setPreferences] = useState({
    shortLessons: 50,
    examples: 50,
    quizzes: 50,
    stepByStep: 50,
  });
  const [goals, setGoals] = useState({
    targetORTScore: 170,
    examDate: '',
    gradeLevel: '' as '' | '10' | '11' | 'graduate',
    monthsUntilExam: 6,
    knowsExamDate: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkExistingProfile();
  }, [user, navigate]);

  const checkExistingProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_diagnostic_profile')
      .select('diagnostic_completed')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.diagnostic_completed) {
      navigate('/dashboard');
    }
  };

  // Get signed URL for test images
  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("tests")
      .createSignedUrl(path, 300);
    
    if (error || !data?.signedUrl) {
      console.error("Error getting signed URL for", path, error);
      return null;
    }
    return data.signedUrl;
  }, []);

  // Load correct answers from storage
  const loadCorrectAnswers = useCallback(async () => {
    try {
      const url = await getSignedUrl("answers_testing58.json");
      if (!url) return;
      
      const res = await fetch(url);
      if (!res.ok) return;
      
      const data = await res.json();
      const convertedAnswers: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        convertedAnswers[key] = CYRILLIC_TO_ENGLISH[value] || value;
      });
      
      setOrtCorrectAnswers(convertedAnswers);
    } catch (err) {
      console.warn("Error loading correct answers:", err);
    }
  }, [getSignedUrl]);

  // Load ORT image for current page
  const loadOrtImage = useCallback(async (page: number) => {
    setOrtImageLoading(true);
    try {
      const url = await getSignedUrl(`${page}.png`);
      setOrtImageUrl(url);
    } catch (err) {
      setOrtImageUrl(null);
    } finally {
      setOrtImageLoading(false);
    }
  }, [getSignedUrl]);

  // Initialize ORT test when entering that section
  useEffect(() => {
    if (section === 'ort_test') {
      const initOrt = async () => {
        setOrtLoading(true);
        await loadCorrectAnswers();
        await loadOrtImage(1);
        setOrtLoading(false);
      };
      initOrt();
    }
  }, [section, loadCorrectAnswers, loadOrtImage]);

  // Load image when ORT page changes
  useEffect(() => {
    if (section === 'ort_test' && !ortLoading) {
      loadOrtImage(ortCurrentPage);
    }
  }, [ortCurrentPage, section, ortLoading, loadOrtImage]);

  // ORT Timer countdown
  useEffect(() => {
    if (section !== 'ort_test' || ortLoading || isPaused) return;
    
    const interval = setInterval(() => {
      setOrtTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishOrtTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [section, ortLoading, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTest = () => {
    setSection('ort_test');
    setStartTime(Date.now());
  };

  const handleOrtAnswerSelect = (questionNum: number, option: AnswerOption) => {
    if (isPaused) return;
    setOrtAnswers(prev => ({ ...prev, [questionNum.toString()]: option }));
  };

  const handleOrtPrevPage = () => {
    if (ortCurrentPage > 1) setOrtCurrentPage(ortCurrentPage - 1);
  };

  const handleOrtNextPage = () => {
    if (ortCurrentPage < TOTAL_PAGES) setOrtCurrentPage(ortCurrentPage + 1);
  };

  const handleFinishOrtTest = () => {
    setSection('learning_style');
    setCurrentQuestion(0);
  };

  const calculateOrtScore = (): { correct: number; total: number; percentage: number } => {
    let correct = 0;
    for (let i = 1; i <= TOTAL_ORT_QUESTIONS; i++) {
      const userAnswer = ortAnswers[i.toString()];
      const correctAnswer = ortCorrectAnswers[i.toString()];
      if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
        correct++;
      }
    }
    return { 
      correct, 
      total: TOTAL_ORT_QUESTIONS, 
      percentage: Math.round((correct / TOTAL_ORT_QUESTIONS) * 100) 
    };
  };

  const handleLearningAnswer = useCallback((answer: number) => {
    const q = learningStyleQuestions[currentQuestion];
    setLearningAnswers(prev => [...prev, { questionId: q.id, answer, scales: [q.scales[answer]] }]);
    
    if (currentQuestion < learningStyleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Skip psychology - go directly to preferences
      // Plan is based on TEST RESULTS, not psychological profiling
      setSection('preferences');
      setCurrentQuestion(0);
    }
  }, [currentQuestion]);

  const handlePsychologyAnswer = useCallback((answer: number) => {
    const q = psychologyQuestions[currentQuestion];
    setPsychologyAnswers(prev => [...prev, { questionId: q.id, answer, trait: q.trait, score: q.scoring[answer] }]);
    
    if (currentQuestion < psychologyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('preferences');
    }
  }, [currentQuestion]);

  const calculateLocalResults = useCallback(() => {
    const ortScore = calculateOrtScore();
    const mathLevel = Math.min(5, Math.max(1, Math.ceil((ortScore.percentage / 100) * 5)));
    
    // Learning style calculations
    const styleCounts: Record<string, number> = {};
    learningAnswers.forEach(a => {
      a.scales.forEach(scale => {
        styleCounts[scale] = (styleCounts[scale] || 0) + 1;
      });
    });
    const dominantStyle = Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'balanced';

    // Psychology calculations
    const traitScores: Record<string, number> = {};
    psychologyAnswers.forEach(a => {
      traitScores[a.trait] = a.score;
    });

    const motivationTypes = ['achievement', 'intrinsic', 'social', 'practical'];
    const motivationType = motivationTypes[traitScores.motivation_type] || 'balanced';

    return {
      math_level: mathLevel,
      logic_score: Math.min(100, ortScore.percentage + 10),
      problem_solving_score: ortScore.percentage,
      // DB expects INTEGER; never return float
      speed_score: Math.round(Math.max(0, Math.min(100, (ortTimeLeft / ORT_DURATION_SECONDS) * 100))),
      accuracy_score: ortScore.percentage,
      learning_style: dominantStyle,
      visual_preference: styleCounts.visual ? 80 : 40,
      auditory_preference: styleCounts.auditory ? 80 : 40,
      text_preference: styleCounts.text ? 80 : 40,
      example_preference: styleCounts.example ? 80 : 40,
      problem_driven_preference: styleCounts.problem_driven ? 80 : 40,
      step_by_step_preference: preferences.stepByStep,
      attention_level: traitScores.attention_level || 50,
      stress_resistance: traitScores.stress_resistance || 50,
      impulsiveness: traitScores.impulsiveness || 50,
      consistency: traitScores.consistency || 50,
      patience: traitScores.patience || 50,
      confidence: traitScores.confidence || 50,
      motivation_type: motivationType,
      prefers_short_lessons: preferences.shortLessons < 50,
      prefers_examples: preferences.examples > 50,
      prefers_quizzes: preferences.quizzes > 50,
      prefers_step_by_step: preferences.stepByStep > 50,
      ort_correct: calculateOrtScore().correct,
      ort_total: TOTAL_ORT_QUESTIONS,
    };
  }, [learningAnswers, psychologyAnswers, preferences, ortTimeLeft, ortAnswers, ortCorrectAnswers]);

  // ✅ ОРКЕСТРАТОР: Один запрос вместо ai-diagnostic-analysis + ai-learning-plan-v2
  const analyzeWithOrchestrator = async (topicMasteryData: Record<string, number>, profileData: any) => {
    try {
      const ortScore = calculateOrtScore();
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      
      console.log('🚀 AI Orchestrator: Starting comprehensive analysis...');
      
      const response = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          diagnosticProfile: {
            ...profileData,
            topicPerformance: topicMasteryData,
            overall_accuracy: ortScore.percentage,
            ort_correct: ortScore.correct,
            ort_total: TOTAL_ORT_QUESTIONS,
          },
          personalityTest: {
            // Пока используем defaults, потом добавим реальные данные из personality_test_results
            perception_type: 'text',
            learning_tempo: 'medium',
            thinking_style: 'step-by-step',
          },
          goals: {
            targetScore: goals.targetORTScore,
            examDate: goals.examDate,
            grade: goals.gradeLevel || 11,
            monthsUntilExam: goals.monthsUntilExam,
          },
          progress: {
            testHistory: [{
              answers: Object.entries(ortAnswers).map(([qNum, answer]) => ({
                questionId: qNum,
                answer,
                correct: answer === ortCorrectAnswers[qNum],
                topic: ORT_QUESTION_TOPICS[parseInt(qNum)],
              })),
              score: ortScore.correct,
              total_questions: TOTAL_ORT_QUESTIONS,
            }],
            topicMastery: Object.entries(topicMasteryData).map(([topic, mastery]) => ({
              topic,
              progress_percentage: mastery,
            })),
          },
          availableTopics: [...new Set(Object.values(ORT_QUESTION_TOPICS))],
          language,
        }
      });

      if (response.error) {
        console.error('❌ AI Orchestrator error:', response.error);
        return null;
      }

      console.log('✅ AI Orchestrator: Analysis complete');
      return response.data;
    } catch (error) {
      console.error('❌ Failed AI Orchestrator:', error);
      return null;
    }
  };

  // Старый fallback для диагностики (если orchestrator недоступен)
  const analyzeWithAI = async () => {
    try {
      const ortScore = calculateOrtScore();
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      
      const response = await supabase.functions.invoke('ai-diagnostic-analysis', {
        body: {
          mathAnswers: Object.entries(ortAnswers).map(([qNum, answer]) => ({
            questionId: `ort_${qNum}`,
            answer,
            correct: answer === ortCorrectAnswers[qNum],
            timeTaken: Math.round((ORT_DURATION_SECONDS - ortTimeLeft) / TOTAL_ORT_QUESTIONS)
          })),
          ortScore: ortScore,
          learningAnswers: learningAnswers.map((a, idx) => ({
            ...a,
            question: learningStyleQuestions[idx].question[language as 'en' | 'ru' | 'kg']
          })),
          psychologyAnswers: psychologyAnswers.map((a, idx) => ({
            ...a,
            question: psychologyQuestions[idx].question[language as 'en' | 'ru' | 'kg']
          })),
          preferences,
          timeTaken: totalTime,
          language
        }
      });

      if (response.error) {
        console.error('AI analysis error:', response.error);
        return null;
      }

      return response.data?.analysis;
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      return null;
    }
  };

  // Calculate topic mastery from ORT answers
  const calculateTopicMastery = useCallback(() => {
    const topicScores: Record<string, { correct: number; total: number }> = {};
    const hasCorrectAnswers = Object.keys(ortCorrectAnswers).length > 0;
    
    // Go through each ORT answer and map to topics
    Object.entries(ortAnswers).forEach(([qNum, answer]) => {
      const questionNumber = parseInt(qNum);
      const topic = ORT_QUESTION_TOPICS[questionNumber];
      if (!topic) return;
      
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 };
      }
      
      topicScores[topic].total += 1;
      
      // If correct answers aren't loaded, assume 50% correct for topic mapping
      if (hasCorrectAnswers) {
        if (answer === ortCorrectAnswers[qNum]) {
          topicScores[topic].correct += 1;
        }
      } else {
        // Fallback: estimate based on question difficulty patterns
        topicScores[topic].correct += 0.5; // Partial credit for fallback
      }
    });
    
    // Convert to mastery percentages
    const topicMasteryResult: Record<string, number> = {};
    Object.entries(topicScores).forEach(([topic, scores]) => {
      if (scores.total > 0) {
        topicMasteryResult[topic] = Math.round((scores.correct / scores.total) * 100);
      }
    });
    
    // FALLBACK: If no answers at all, provide default topic mastery so plan generation works
    if (Object.keys(topicMasteryResult).length === 0) {
      // Use all topics from ORT_QUESTION_TOPICS with default 50% mastery
      const allTopics = [...new Set(Object.values(ORT_QUESTION_TOPICS))];
      allTopics.forEach(topic => {
        topicMasteryResult[topic] = 50; // Medium mastery as safe default
      });
    }
    
    return topicMasteryResult;
  }, [ortAnswers, ortCorrectAnswers]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSection('analyzing');

    try {
      // Calculate topic mastery FIRST - needed for orchestrator
      const topicMasteryData = calculateTopicMastery();
      const localResults = calculateLocalResults();
      
      let examDateValue = goals.examDate ? new Date(goals.examDate).toISOString() : null;
      if (!examDateValue && goals.monthsUntilExam) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + goals.monthsUntilExam);
        examDateValue = futureDate.toISOString();
      }

      const profileDataRaw = {
        user_id: user.id,
        math_level: localResults.math_level ?? 1,
        logic_score: localResults.logic_score ?? 0,
        problem_solving_score: localResults.problem_solving_score ?? 0,
        speed_score: localResults.speed_score ?? 0,
        accuracy_score: localResults.accuracy_score ?? 0,
        learning_style: localResults.learning_style || 'balanced',
        visual_preference: localResults.visual_preference ?? 50,
        auditory_preference: localResults.auditory_preference ?? 50,
        text_preference: localResults.text_preference ?? 50,
        example_preference: localResults.example_preference ?? 50,
        problem_driven_preference: localResults.problem_driven_preference ?? 50,
        step_by_step_preference: localResults.step_by_step_preference ?? 50,
        attention_level: localResults.attention_level ?? 50,
        stress_resistance: localResults.stress_resistance ?? 50,
        impulsiveness: localResults.impulsiveness ?? 50,
        consistency: localResults.consistency ?? 50,
        patience: localResults.patience ?? 50,
        confidence: localResults.confidence ?? 50,
        motivation_type: localResults.motivation_type || 'balanced',
        prefers_short_lessons: localResults.prefers_short_lessons ?? true,
        prefers_examples: localResults.prefers_examples ?? true,
        prefers_quizzes: localResults.prefers_quizzes ?? true,
        prefers_step_by_step: localResults.prefers_step_by_step ?? true,
        target_ort_score: goals.targetORTScore,
        exam_date: examDateValue,
        grade_level: goals.gradeLevel || null,
        months_until_exam: goals.monthsUntilExam,
        diagnostic_completed: true,
        completed_at: new Date().toISOString(),
      };

      // Coerce ALL integer DB columns to safe integers (round/clamp/default)
      const profileData = {
        ...profileDataRaw,
        math_level: toSafeInt(profileDataRaw.math_level, { min: 1, max: 5, defaultValue: 1 }),
        logic_score: toSafeInt(profileDataRaw.logic_score, { min: 0, max: 100, defaultValue: 0 }),
        problem_solving_score: toSafeInt(profileDataRaw.problem_solving_score, { min: 0, max: 100, defaultValue: 0 }),
        speed_score: toSafeInt(profileDataRaw.speed_score, { min: 0, max: 100, defaultValue: 0 }),
        accuracy_score: toSafeInt(profileDataRaw.accuracy_score, { min: 0, max: 100, defaultValue: 0 }),
        visual_preference: toSafeInt(profileDataRaw.visual_preference, { min: 0, max: 100, defaultValue: 50 }),
        auditory_preference: toSafeInt(profileDataRaw.auditory_preference, { min: 0, max: 100, defaultValue: 50 }),
        text_preference: toSafeInt(profileDataRaw.text_preference, { min: 0, max: 100, defaultValue: 50 }),
        example_preference: toSafeInt(profileDataRaw.example_preference, { min: 0, max: 100, defaultValue: 50 }),
        problem_driven_preference: toSafeInt(profileDataRaw.problem_driven_preference, { min: 0, max: 100, defaultValue: 50 }),
        step_by_step_preference: toSafeInt(profileDataRaw.step_by_step_preference, { min: 0, max: 100, defaultValue: 50 }),
        attention_level: toSafeInt(profileDataRaw.attention_level, { min: 0, max: 100, defaultValue: 50 }),
        stress_resistance: toSafeInt(profileDataRaw.stress_resistance, { min: 0, max: 100, defaultValue: 50 }),
        impulsiveness: toSafeInt(profileDataRaw.impulsiveness, { min: 0, max: 100, defaultValue: 50 }),
        consistency: toSafeInt(profileDataRaw.consistency, { min: 0, max: 100, defaultValue: 50 }),
        patience: toSafeInt(profileDataRaw.patience, { min: 0, max: 100, defaultValue: 50 }),
        confidence: toSafeInt(profileDataRaw.confidence, { min: 0, max: 100, defaultValue: 50 }),
        // supports values like "200+" silently
        target_ort_score: toSafeInt(profileDataRaw.target_ort_score, { min: 80, max: 300, defaultValue: 170 }),
        // supports values like "6 мес." silently
        months_until_exam: toSafeInt(profileDataRaw.months_until_exam, { min: 0, max: 60, defaultValue: 6 }),
      };

      const { error: profileSaveError } = await supabase
        .from('user_diagnostic_profile')
        .upsert(profileData, { onConflict: 'user_id' });

      if (profileSaveError) {
        console.error('Diagnostic profile save error:', profileSaveError);
        throw new Error(profileSaveError.message || 'Failed to save diagnostic profile');
      }

      // ✅ Also save as a user_tests record so study plan generation can find it
      const ortScore = calculateOrtScore();
      const diagnosticAnswers = Object.entries(ortAnswers).map(([qNum, answer]) => ({
        questionId: parseInt(qNum),
        topic: ORT_QUESTION_TOPICS[parseInt(qNum)] || null,
        selectedAnswer: answer,
        isCorrect: answer === ortCorrectAnswers[qNum],
      }));

      // Use existing practice test ID or a well-known diagnostic test ID
      const diagnosticTestId = 'bbbb1111-1111-1111-1111-111111111111';

      const { error: testSaveError } = await supabase
        .from('user_tests')
        .insert({
          user_id: user.id,
          test_id: diagnosticTestId,
          score: ortScore.correct,
          total_questions: ortScore.total,
          answers: diagnosticAnswers,
          completed_at: new Date().toISOString(),
        });

      if (testSaveError) {
        console.error('user_tests insert error (non-blocking):', testSaveError);
        // Non-blocking: profile is already saved, plan generation can still use user_diagnostic_profile
      }

      // ✅ НОВЫЙ ПОДХОД: AI Orchestrator (1 запрос вместо 2+)
      console.log('🚀 Trying AI Orchestrator...');
      const orchestratorResult = await analyzeWithOrchestrator(topicMasteryData, profileData);
      
      let planResponse;
      let analysis;

      if (orchestratorResult) {
        // ✅ Orchestrator успешно вернул результат
        console.log('✅ Using AI Orchestrator result');
        planResponse = { data: orchestratorResult };
        analysis = {
          // Извлекаем данные для совместимости со старым форматом
          math_level: profileData.math_level,
          accuracy_score: profileData.accuracy_score,
          // ... orchestrator может вернуть дополнительные поля
        };
        setAiAnalysis(analysis);
      } else {
        // ❌ Fallback: старый подход с двумя запросами
        console.log('⚠️ Orchestrator failed, using fallback...');
        analysis = await analyzeWithAI();
        const results = analysis || localResults;
        setAiAnalysis(analysis);

        // Старый вызов ai-learning-plan-v2
        planResponse = await supabase.functions.invoke('ai-learning-plan-v2', {
          body: {
            diagnosticProfile: {
              ...profileData,
              topicPerformance: topicMasteryData,
            },
            testHistory: [{
              answers: Object.entries(ortAnswers).map(([qNum, answer]) => ({
                questionId: qNum,
                answer,
                correct: answer === ortCorrectAnswers[qNum],
                topic: ORT_QUESTION_TOPICS[parseInt(qNum)],
              })),
              score: calculateOrtScore().correct,
              total_questions: TOTAL_ORT_QUESTIONS,
            }],
            lessonProgress: [],
            topicMastery: Object.entries(topicMasteryData).map(([topic, mastery]) => ({
              topic,
              progress_percentage: mastery,
            })),
            targetORTScore: goals.targetORTScore,
            language,
          },
        });

        if (planResponse.error) {
          console.error('Plan generation error:', planResponse.error);
          throw new Error(planResponse.error.message || 'Failed to generate learning plan');
        }
      }

      // Save the generated plan to database
      if (planResponse.data) {
        const { error: planSaveError } = await supabase
          .from('ai_learning_plans_v2')
          .insert({
            user_id: user.id,
            plan_data: planResponse.data.planData || planResponse.data,
            schedule: planResponse.data.schedule,
            target_topics: planResponse.data.targetTopics,
            daily_tasks: planResponse.data.dailyTasks,
            mini_tests: planResponse.data.miniTests,
            predicted_timeline: planResponse.data.predictedTimeline,
            mastery_goals: planResponse.data.masteryGoals,
            ort_score_projection: planResponse.data.ortScoreProjection,
            learning_strategy: planResponse.data.learningStrategy || planResponse.data.explanation,
            is_active: true,
            generated_at: new Date().toISOString(),
          });

        if (planSaveError) {
          console.error('Plan save error:', planSaveError);
          throw new Error(planSaveError.message || 'Failed to save learning plan');
        }
      }

      toast({
        title: language === 'ru' ? 'Профиль создан!' : language === 'kg' ? 'Профиль түзүлдү!' : 'Profile Created!',
        description: language === 'ru' ? 'Ваш персональный план готов' : language === 'kg' ? 'Жекелештирилген планыңыз даяр' : 'Your personalized plan is ready',
      });

      setSection('complete');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      const message = typeof error?.message === 'string' ? error.message : '';
      toast({
        title: language === 'ru' ? 'Ошибка' : language === 'kg' ? 'Ката' : 'Error',
        description:
          (language === 'ru'
            ? `Не удалось создать план. ${message}`
            : language === 'kg'
              ? `Планды түзүү мүмкүн болгон жок. ${message}`
              : `Could not create the plan. ${message}`
          ).trim(),
        variant: 'destructive',
      });
      setSaving(false);
      setSection('goals');
    }
  };

  // Calculate progress - simplified flow: intro → ort_test → learning_style → preferences → goals
  // Psychology section removed - plan is based on TEST RESULTS not psychological profiling
  const totalSections = 4;
  const currentSectionIndex = 
    section === 'intro' ? 0 : 
    section === 'ort_test' ? 1 : 
    section === 'learning_style' ? 2 : 
    section === 'preferences' ? 3 : 
    section === 'goals' ? 4 : 4;

  const sectionProgress = section === 'ort_test' 
    ? (Object.keys(ortAnswers).length / TOTAL_ORT_QUESTIONS) * 100
    : section === 'learning_style'
    ? (currentQuestion / learningStyleQuestions.length) * 100
    : 100;

  const overallProgress = ((currentSectionIndex - 1 + sectionProgress / 100) / totalSections) * 100;

  // RENDER: Intro Section
  const renderIntro = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl md:text-3xl">
          {language === 'ru' ? 'Адаптивный диагностический тест' : language === 'kg' ? 'Адаптивдик диагностикалык тест' : 'Adaptive Diagnostic Test'}
        </CardTitle>
        <CardDescription className="text-base">
          {language === 'ru' 
            ? 'Пройдите реальный тест ОРТ и получите персональный план подготовки.'
            : language === 'kg'
            ? 'Чыныгы ЖРТ тестин тапшырып, жекелештирилген даярдык планын алыңыз.'
            : 'Take the real ORT test and get a personalized preparation plan.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'ОРТ Математика' : language === 'kg' ? 'ЖРТ Математика' : 'ORT Math Part 1'}</p>
              <p className="text-sm text-muted-foreground">{TOTAL_ORT_QUESTIONS} {language === 'ru' ? 'вопросов • 30 мин' : language === 'kg' ? 'суроо • 30 мүн' : 'questions • 30 min'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'Стиль обучения' : language === 'kg' ? 'Окуу стили' : 'Learning Style'}</p>
              <p className="text-sm text-muted-foreground">{learningStyleQuestions.length} {language === 'ru' ? 'вопросов' : language === 'kg' ? 'суроо' : 'questions'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'Цели и предпочтения' : language === 'kg' ? 'Максаттар жана каалоолор' : 'Goals & Preferences'}</p>
              <p className="text-sm text-muted-foreground">4 {language === 'ru' ? 'параметра' : language === 'kg' ? 'параметр' : 'settings'}</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{language === 'ru' ? 'Время прохождения' : language === 'kg' ? 'Өтүү убактысы' : 'Estimated Time'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' ? '~35-40 минут (30 мин тест + вопросы)' : language === 'kg' ? '~35-40 мүнөт (30 мүн тест + суроолор)' : '~35-40 minutes (30 min test + questions)'}
          </p>
        </div>

        <Button className="w-full h-12 text-lg" size="lg" onClick={handleStartTest}>
          {language === 'ru' ? 'Начать тест' : language === 'kg' ? 'Тестти баштоо' : 'Start Test'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );

  // RENDER: ORT Test Section
  const renderOrtTest = () => {
    if (ortLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{language === 'ru' ? 'Загрузка теста...' : language === 'kg' ? 'Тест жүктөлүүдө...' : 'Loading test...'}</p>
          </div>
        </div>
      );
    }

    const isTimeWarning = ortTimeLeft < 300;
    const answeredCount = Object.keys(ortAnswers).length;

    return (
      <div className="space-y-4">
        {/* Header with Timer */}
        <div className="flex items-center justify-between bg-card rounded-xl p-4 border">
          <div>
            <h2 className="font-bold text-lg text-primary">
              {language === 'ru' ? 'Математика. Часть 1' : language === 'kg' ? 'Математика. 1-бөлүк' : 'Math Part 1'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {answeredCount}/{TOTAL_ORT_QUESTIONS} {language === 'ru' ? 'ответов' : language === 'kg' ? 'жооп' : 'answered'}
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
            isTimeWarning ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            <Clock className="h-5 w-5" />
            {formatTime(ortTimeLeft)}
          </div>
        </div>

        {/* Test Image with Navigation */}
        <div className="relative">
          <button
            onClick={handleOrtPrevPage}
            disabled={ortCurrentPage === 1}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors",
              ortCurrentPage === 1 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="mx-12 sm:mx-16 border border-border rounded-lg bg-card overflow-hidden">
            {ortImageLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ortImageUrl ? (
              <img src={ortImageUrl} alt={`Page ${ortCurrentPage}`} className="w-full h-auto" />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <p>{language === 'ru' ? 'Изображение не найдено' : language === 'kg' ? 'Сүрөт табылган жок' : 'Image not found'}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleOrtNextPage}
            disabled={ortCurrentPage === TOTAL_PAGES}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors",
              ortCurrentPage === TOTAL_PAGES && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {language === 'ru' ? 'Страница' : language === 'kg' ? 'Бет' : 'Page'} {ortCurrentPage} / {TOTAL_PAGES}
        </div>

        {/* Answer Sheet */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-primary text-lg">
              {language === 'ru' ? 'Бланк ответов' : language === 'kg' ? 'Жооптор бланкы' : 'Answer Sheet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: TOTAL_ORT_QUESTIONS }, (_, i) => i + 1).map((qNum) => {
                const selectedAnswer = ortAnswers[qNum.toString()];
                return (
                  <div key={qNum} className="text-center">
                    <div className="text-sm font-medium mb-1">{qNum}</div>
                    <div className="flex justify-center gap-1">
                      {(["A", "B", "C", "D"] as AnswerOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOrtAnswerSelect(qNum, option)}
                          disabled={isPaused}
                          className={cn(
                            "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 text-xs font-medium transition-all",
                            selectedAnswer === option
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {isPaused ? (language === 'ru' ? 'Продолжить' : language === 'kg' ? 'Улантуу' : 'Resume') : (language === 'ru' ? 'Пауза' : language === 'kg' ? 'Тыныгуу' : 'Pause')}
          </Button>
          <Button className="flex-1" onClick={handleFinishOrtTest}>
            {language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти бүтүрүү' : 'Finish Test'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // RENDER: Learning Style Section
  const renderLearningStyleSection = () => {
    const q = learningStyleQuestions[currentQuestion];
    return (
      <div className="space-y-4">
        {currentQuestion === 0 && (
          <div className="bg-green-100 dark:bg-green-950/30 rounded-xl p-4 text-center mb-4">
            <p className="text-green-700 dark:text-green-300 font-medium">
              {encouragements.learning_start[language as 'en' | 'ru' | 'kg']}
            </p>
          </div>
        )}
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <Badge variant="outline" className="w-fit px-3 bg-green-50 text-green-700 border-green-200">
              <BookOpen className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Стиль обучения' : language === 'kg' ? 'Окуу стили' : 'Learning Style'} • {currentQuestion + 1}/{learningStyleQuestions.length}
            </Badge>
            <Progress value={(currentQuestion / learningStyleQuestions.length) * 100} className="h-1.5 mt-4 mb-4" />
            <CardTitle className="text-lg md:text-xl">{q.question[language as 'en' | 'ru' | 'kg']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {q.options[language as 'en' | 'ru' | 'kg'].map((option, idx) => (
                <button key={idx} type="button" onClick={() => handleLearningAnswer(idx)}
                  className="w-full flex items-center space-x-3 p-4 border rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-500 cursor-pointer transition-all text-left active:scale-[0.98]">
                  <div className="w-6 h-6 rounded-full border-2 border-green-500/50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{String.fromCharCode(65 + idx)}</span>
                  </div>
                  <span className="flex-1 text-base">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // RENDER: Psychology Section
  const renderPsychologySection = () => {
    const q = psychologyQuestions[currentQuestion];
    return (
      <div className="space-y-4">
        {currentQuestion === 0 && (
          <div className="bg-purple-100 dark:bg-purple-950/30 rounded-xl p-4 text-center mb-4">
            <p className="text-purple-700 dark:text-purple-300 font-medium">
              {encouragements.psychology_start[language as 'en' | 'ru' | 'kg']}
            </p>
          </div>
        )}
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <Badge variant="outline" className="w-fit px-3 bg-purple-50 text-purple-700 border-purple-200">
              <Heart className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Психология' : language === 'kg' ? 'Психология' : 'Psychology'} • {currentQuestion + 1}/{psychologyQuestions.length}
            </Badge>
            <Progress value={(currentQuestion / psychologyQuestions.length) * 100} className="h-1.5 mt-4 mb-4" />
            <CardTitle className="text-lg md:text-xl">{q.question[language as 'en' | 'ru' | 'kg']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {q.options[language as 'en' | 'ru' | 'kg'].map((option, idx) => (
                <button key={idx} type="button" onClick={() => handlePsychologyAnswer(idx)}
                  className="w-full flex items-center space-x-3 p-4 border rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500 cursor-pointer transition-all text-left active:scale-[0.98]">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500/50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{String.fromCharCode(65 + idx)}</span>
                  </div>
                  <span className="flex-1 text-base">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // RENDER: Preferences Section
  const renderPreferencesSection = () => (
    <div className="space-y-4">
      <div className="bg-orange-100 dark:bg-orange-950/30 rounded-xl p-4 text-center mb-4">
        <p className="text-orange-700 dark:text-orange-300 font-medium">
          {encouragements.preferences_start[language as 'en' | 'ru' | 'kg']}
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            {language === 'ru' ? 'Настройте обучение под себя' : language === 'kg' ? 'Окуутуңузду ыңгайлаштырыңыз' : 'Customize Your Learning'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'ru' ? 'Длина уроков' : language === 'kg' ? 'Сабактын узундугу' : 'Lesson Length'}
              </Label>
              <Badge variant="outline">
                {preferences.shortLessons < 50 ? (language === 'ru' ? 'Короткие' : language === 'kg' ? 'Кыска' : 'Short') : (language === 'ru' ? 'Длинные' : language === 'kg' ? 'Узун' : 'Long')}
              </Badge>
            </div>
            <Slider value={[preferences.shortLessons]} onValueChange={([v]) => setPreferences(p => ({ ...p, shortLessons: v }))} max={100} step={10} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                {language === 'ru' ? 'Примеры vs Теория' : language === 'kg' ? 'Мисалдар vs Теория' : 'Examples vs Theory'}
              </Label>
              <Badge variant="outline">
                {preferences.examples > 50 ? (language === 'ru' ? 'Больше примеров' : language === 'kg' ? 'Көбүрөөк мисал' : 'More examples') : (language === 'ru' ? 'Больше теории' : language === 'kg' ? 'Көбүрөөк теория' : 'More theory')}
              </Badge>
            </div>
            <Slider value={[preferences.examples]} onValueChange={([v]) => setPreferences(p => ({ ...p, examples: v }))} max={100} step={10} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Puzzle className="w-4 h-4" />
                {language === 'ru' ? 'Тесты vs Объяснения' : language === 'kg' ? 'Тесттер vs Түшүндүрмөлөр' : 'Quizzes vs Explanations'}
              </Label>
              <Badge variant="outline">
                {preferences.quizzes > 50 ? (language === 'ru' ? 'Больше тестов' : language === 'kg' ? 'Көбүрөөк тест' : 'More quizzes') : (language === 'ru' ? 'Больше объяснений' : language === 'kg' ? 'Көбүрөөк түшүндүрмө' : 'More explanations')}
              </Badge>
            </div>
            <Slider value={[preferences.quizzes]} onValueChange={([v]) => setPreferences(p => ({ ...p, quizzes: v }))} max={100} step={10} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4" />
                {language === 'ru' ? 'Пошаговые инструкции' : language === 'kg' ? 'Кадам-кадам нускамалар' : 'Step-by-Step'}
              </Label>
              <Badge variant="outline">
                {preferences.stepByStep > 50 ? (language === 'ru' ? 'Подробные' : language === 'kg' ? 'Толук' : 'Detailed') : (language === 'ru' ? 'Краткие' : language === 'kg' ? 'Кыска' : 'Brief')}
              </Badge>
            </div>
            <Slider value={[preferences.stepByStep]} onValueChange={([v]) => setPreferences(p => ({ ...p, stepByStep: v }))} max={100} step={10} />
          </div>

          <Button className="w-full" onClick={() => setSection('goals')}>
            {language === 'ru' ? 'Продолжить' : language === 'kg' ? 'Улантуу' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // RENDER: Goals Section
  const renderGoalsSection = () => (
    <div className="space-y-4">
      <div className="bg-primary/10 rounded-xl p-4 text-center mb-4">
        <p className="text-primary font-medium">
          {encouragements.goals_start[language as 'en' | 'ru' | 'kg']}
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Ваши цели' : language === 'kg' ? 'Сиздин максаттар' : 'Your Goals'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {language === 'ru' ? 'Целевой балл ОРТ' : language === 'kg' ? 'ЖРТ максат баллы' : 'Target ORT Score'}
            </Label>
            <Select value={goals.targetORTScore.toString()} onValueChange={(v) => setGoals(g => ({ ...g, targetORTScore: parseInt(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[110, 130, 150, 170, 190, 200].map(score => (
                  <SelectItem key={score} value={score.toString()}>{score}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {language === 'ru' ? 'Класс' : language === 'kg' ? 'Класс' : 'Grade Level'}
            </Label>
            <Select value={goals.gradeLevel} onValueChange={(v) => setGoals(g => ({ ...g, gradeLevel: v as '' | '10' | '11' | 'graduate' }))}>
              <SelectTrigger><SelectValue placeholder={language === 'ru' ? 'Выберите класс' : language === 'kg' ? 'Классты тандаңыз' : 'Select grade'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{language === 'ru' ? '10 класс' : language === 'kg' ? '10-класс' : 'Grade 10'}</SelectItem>
                <SelectItem value="11">{language === 'ru' ? '11 класс' : language === 'kg' ? '11-класс' : 'Grade 11'}</SelectItem>
                <SelectItem value="graduate">{language === 'ru' ? 'Выпускник' : language === 'kg' ? 'Бүтүрүүчү' : 'Graduate'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'ru' ? 'Месяцев до экзамена' : language === 'kg' ? 'Экзаменге чейин ай' : 'Months Until Exam'}
            </Label>
            <Select value={goals.monthsUntilExam.toString()} onValueChange={(v) => setGoals(g => ({ ...g, monthsUntilExam: parseInt(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                  <SelectItem key={m} value={m.toString()}>{m} {language === 'ru' ? 'мес.' : language === 'kg' ? 'ай' : 'months'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" size="lg" onClick={saveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {language === 'ru' ? 'Завершить и создать план' : language === 'kg' ? 'Бүтүрүп, план түзүү' : 'Finish & Create Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // RENDER: Analyzing Section
  const renderAnalyzing = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {language === 'ru' ? 'Анализируем ваш профиль...' : language === 'kg' ? 'Профилиңизди анализдеп жатабыз...' : 'Analyzing your profile...'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {language === 'ru' ? 'ИИ создаёт персональный план обучения' : language === 'kg' ? 'AI жекелештирилген окуу планын түзүп жатат' : 'AI is creating your personalized learning plan'}
        </p>
        <Progress value={75} className="h-2" />
      </div>
    </div>
  );

  // RENDER: Complete Section
  const renderComplete = () => {
    const ortScore = calculateOrtScore();
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ru' ? 'Диагностика завершена!' : language === 'kg' ? 'Диагностика аяктады!' : 'Diagnostic Complete!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'ru' ? 'Ваш персональный план готов' : language === 'kg' ? 'Жекелештирилген планыңыз даяр' : 'Your personalized plan is ready'}
          </p>
          
          <div className="bg-muted/50 rounded-xl p-6 mb-6">
            <div className="text-4xl font-bold text-primary mb-2">{ortScore.correct}/{ortScore.total}</div>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Правильных ответов на ОРТ тесте' : language === 'kg' ? 'ЖРТ тестинде туура жооптор' : 'Correct answers on ORT test'}
            </p>
            <Badge variant={ortScore.percentage >= 70 ? "default" : ortScore.percentage >= 50 ? "secondary" : "destructive"} className="mt-2">
              {ortScore.percentage}%
            </Badge>
          </div>
          
          <Button className="w-full" size="lg" onClick={() => navigate('/dashboard')}>
            {language === 'ru' ? 'Перейти к обучению' : language === 'kg' ? 'Окууга өтүү' : 'Start Learning'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        {section !== 'intro' && section !== 'analyzing' && section !== 'complete' && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{language === 'ru' ? 'Прогресс' : language === 'kg' ? 'Прогресс' : 'Progress'}</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {section === 'intro' && renderIntro()}
        {section === 'ort_test' && renderOrtTest()}
        {section === 'learning_style' && renderLearningStyleSection()}
        {section === 'preferences' && renderPreferencesSection()}
        {section === 'goals' && renderGoalsSection()}
        {section === 'analyzing' && renderAnalyzing()}
        {section === 'complete' && renderComplete()}
      </div>
    </div>
  );
}
