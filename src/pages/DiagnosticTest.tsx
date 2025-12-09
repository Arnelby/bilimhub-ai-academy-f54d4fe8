import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Brain, BookOpen, Target, Heart, ArrowRight, ArrowLeft, Check, Loader2, 
  Sparkles, Timer, Trophy, Lightbulb, Eye, Ear, FileText, Puzzle, 
  ListOrdered, Zap, Clock, ChevronRight, Calendar, GraduationCap, Flag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Section = 'intro' | 'math' | 'learning_style' | 'psychology' | 'preferences' | 'goals' | 'analyzing' | 'complete';

interface MathQuestion {
  id: string;
  question: { en: string; ru: string; kg: string };
  options: { en: string[]; ru: string[]; kg: string[] };
  correct: number;
  difficulty: 1 | 2 | 3;
  topic: string;
}

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

// Comprehensive math questions covering ORT topics
const mathQuestions: MathQuestion[] = [
  {
    id: 'math_1',
    question: {
      en: "What is 15% of 200?",
      ru: "Чему равно 15% от 200?",
      kg: "200дүн 15% канча?"
    },
    options: {
      en: ["25", "30", "35", "40"],
      ru: ["25", "30", "35", "40"],
      kg: ["25", "30", "35", "40"]
    },
    correct: 1,
    difficulty: 1,
    topic: "percentages"
  },
  {
    id: 'math_2',
    question: {
      en: "Solve: 3x + 7 = 22. Find x.",
      ru: "Решите: 3x + 7 = 22. Найдите x.",
      kg: "Чыгарыңыз: 3x + 7 = 22. x-ти табыңыз."
    },
    options: {
      en: ["3", "4", "5", "6"],
      ru: ["3", "4", "5", "6"],
      kg: ["3", "4", "5", "6"]
    },
    correct: 2,
    difficulty: 1,
    topic: "linear_equations"
  },
  {
    id: 'math_3',
    question: {
      en: "Find the area of a rectangle with sides 8 and 12.",
      ru: "Найдите площадь прямоугольника со сторонами 8 и 12.",
      kg: "Капталдары 8 жана 12 болгон тик бурчтуктун аянтын табыңыз."
    },
    options: {
      en: ["72", "96", "80", "100"],
      ru: ["72", "96", "80", "100"],
      kg: ["72", "96", "80", "100"]
    },
    correct: 1,
    difficulty: 1,
    topic: "geometry"
  },
  {
    id: 'math_4',
    question: {
      en: "If a train travels 240 km in 3 hours, what is its speed?",
      ru: "Если поезд проехал 240 км за 3 часа, какова его скорость?",
      kg: "Поезд 3 саатта 240 км жол жүрсө, анын ылдамдыгы канча?"
    },
    options: {
      en: ["60 km/h", "70 km/h", "80 km/h", "90 km/h"],
      ru: ["60 км/ч", "70 км/ч", "80 км/ч", "90 км/ч"],
      kg: ["60 км/с", "70 км/с", "80 км/с", "90 км/с"]
    },
    correct: 2,
    difficulty: 1,
    topic: "word_problems"
  },
  {
    id: 'math_5',
    question: {
      en: "Simplify: (2x + 3)(x - 1)",
      ru: "Упростите: (2x + 3)(x - 1)",
      kg: "Жөнөкөйлөтүңүз: (2x + 3)(x - 1)"
    },
    options: {
      en: ["2x² + x - 3", "2x² - x + 3", "2x² + x + 3", "2x² - x - 3"],
      ru: ["2x² + x - 3", "2x² - x + 3", "2x² + x + 3", "2x² - x - 3"],
      kg: ["2x² + x - 3", "2x² - x + 3", "2x² + x + 3", "2x² - x - 3"]
    },
    correct: 0,
    difficulty: 2,
    topic: "algebra"
  },
  {
    id: 'math_6',
    question: {
      en: "Find the roots of: x² - 5x + 6 = 0",
      ru: "Найдите корни уравнения: x² - 5x + 6 = 0",
      kg: "Теңдемелердин тамырларын табыңыз: x² - 5x + 6 = 0"
    },
    options: {
      en: ["1 and 6", "2 and 3", "-2 and -3", "1 and 5"],
      ru: ["1 и 6", "2 и 3", "-2 и -3", "1 и 5"],
      kg: ["1 жана 6", "2 жана 3", "-2 жана -3", "1 жана 5"]
    },
    correct: 1,
    difficulty: 2,
    topic: "quadratic_equations"
  },
  {
    id: 'math_7',
    question: {
      en: "Calculate: √144 + √81",
      ru: "Вычислите: √144 + √81",
      kg: "Эсептеңиз: √144 + √81"
    },
    options: {
      en: ["21", "23", "25", "27"],
      ru: ["21", "23", "25", "27"],
      kg: ["21", "23", "25", "27"]
    },
    correct: 0,
    difficulty: 1,
    topic: "arithmetic"
  },
  {
    id: 'math_8',
    question: {
      en: "A circle has radius 7. What is its area? (Use π ≈ 22/7)",
      ru: "Радиус круга равен 7. Чему равна его площадь? (π ≈ 22/7)",
      kg: "Айлананын радиусу 7. Анын аянты канча? (π ≈ 22/7)"
    },
    options: {
      en: ["154", "144", "134", "164"],
      ru: ["154", "144", "134", "164"],
      kg: ["154", "144", "134", "164"]
    },
    correct: 0,
    difficulty: 2,
    topic: "geometry"
  },
  {
    id: 'math_9',
    question: {
      en: "What is the next number in the sequence: 2, 6, 18, 54, ?",
      ru: "Какое следующее число в последовательности: 2, 6, 18, 54, ?",
      kg: "Ырааттуулуктагы кийинки сан кайсы: 2, 6, 18, 54, ?"
    },
    options: {
      en: ["108", "162", "216", "148"],
      ru: ["108", "162", "216", "148"],
      kg: ["108", "162", "216", "148"]
    },
    correct: 1,
    difficulty: 2,
    topic: "sequences"
  },
  {
    id: 'math_10',
    question: {
      en: "If sin(θ) = 0.6 and θ is in the first quadrant, find cos(θ).",
      ru: "Если sin(θ) = 0.6 и θ в первом квадранте, найдите cos(θ).",
      kg: "sin(θ) = 0.6 жана θ биринчи квадрантта болсо, cos(θ) табыңыз."
    },
    options: {
      en: ["0.6", "0.7", "0.8", "0.9"],
      ru: ["0.6", "0.7", "0.8", "0.9"],
      kg: ["0.6", "0.7", "0.8", "0.9"]
    },
    correct: 2,
    difficulty: 3,
    topic: "trigonometry"
  },
  {
    id: 'math_11',
    question: {
      en: "Find the derivative: f(x) = 3x² + 2x - 5",
      ru: "Найдите производную: f(x) = 3x² + 2x - 5",
      kg: "Туундуну табыңыз: f(x) = 3x² + 2x - 5"
    },
    options: {
      en: ["6x + 2", "6x - 2", "3x + 2", "6x² + 2"],
      ru: ["6x + 2", "6x - 2", "3x + 2", "6x² + 2"],
      kg: ["6x + 2", "6x - 2", "3x + 2", "6x² + 2"]
    },
    correct: 0,
    difficulty: 3,
    topic: "calculus"
  },
  {
    id: 'math_12',
    question: {
      en: "Solve the system: x + y = 10, x - y = 4. Find x.",
      ru: "Решите систему: x + y = 10, x - y = 4. Найдите x.",
      kg: "Системаны чыгарыңыз: x + y = 10, x - y = 4. x табыңыз."
    },
    options: {
      en: ["5", "6", "7", "8"],
      ru: ["5", "6", "7", "8"],
      kg: ["5", "6", "7", "8"]
    },
    correct: 2,
    difficulty: 2,
    topic: "systems"
  }
];

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
      en: [
        "Watch videos or diagrams",
        "Listen to explanations",
        "Read detailed text",
        "Try solving problems immediately"
      ],
      ru: [
        "Смотреть видео или диаграммы",
        "Слушать объяснения",
        "Читать подробный текст",
        "Сразу пробовать решать задачи"
      ],
      kg: [
        "Видеолорду же диаграммаларды көрүү",
        "Түшүндүрмөлөрдү угуу",
        "Толук текстти окуу",
        "Дароо маселелерди чечүүгө аракет кылуу"
      ]
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
      en: [
        "Real-life examples",
        "Theoretical foundations first",
        "Step-by-step instructions",
        "Practice problems with solutions"
      ],
      ru: [
        "Примеры из жизни",
        "Сначала теоретические основы",
        "Пошаговые инструкции",
        "Практические задачи с решениями"
      ],
      kg: [
        "Турмуштук мисалдар",
        "Биринчи теориялык негиздер",
        "Кадам-кадам нускамалар",
        "Чечүүлөрү менен практикалык маселелер"
      ]
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
      en: [
        "Visualizing them with colors/shapes",
        "Repeating them out loud",
        "Writing them down multiple times",
        "Using them in problems"
      ],
      ru: [
        "Визуализируя с цветами/формами",
        "Повторяя вслух",
        "Записывая несколько раз",
        "Применяя в задачах"
      ],
      kg: [
        "Түстөр/фигуралар менен визуализациялоо",
        "Катуу айтып кайталоо",
        "Бир нече жолу жазуу",
        "Маселелерде колдонуу"
      ]
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
      en: [
        "Quick overview, then details",
        "Slow and thorough from the start",
        "Medium pace with regular practice",
        "Depends on topic difficulty"
      ],
      ru: [
        "Быстрый обзор, потом детали",
        "Медленно и тщательно с начала",
        "Средний темп с регулярной практикой",
        "Зависит от сложности темы"
      ],
      kg: [
        "Тез карап чыгуу, анан деталдар",
        "Башынан жай жана кылдат",
        "Туруктуу практика менен орточо темп",
        "Теманын татаалдыгына жараша"
      ]
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
      en: [
        "Look for similar solved examples",
        "Re-read the theory",
        "Break it into smaller steps",
        "Try different approaches randomly"
      ],
      ru: [
        "Ищу похожие решённые примеры",
        "Перечитываю теорию",
        "Разбиваю на маленькие шаги",
        "Пробую разные подходы наугад"
      ],
      kg: [
        "Окшош чечилген мисалдарды издөө",
        "Теорияны кайра окуу",
        "Кичине кадамдарга бөлүү",
        "Туш келди ыкмаларды сынап көрүү"
      ]
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
      en: [
        "Jump right in and figure it out",
        "Plan my approach carefully first",
        "Ask for help immediately",
        "Put it aside for later"
      ],
      ru: [
        "Сразу берусь за дело",
        "Сначала тщательно планирую подход",
        "Сразу прошу помощи",
        "Откладываю на потом"
      ],
      kg: [
        "Дароо ишке кирешем",
        "Биринчи ыкманы кылдат пландайм",
        "Дароо жардам сурайм",
        "Кийинчерээкке калтырам"
      ]
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
      en: [
        "Quickly move on and fix it",
        "Analyze why it happened",
        "Feel frustrated but continue",
        "Use it as a learning opportunity"
      ],
      ru: [
        "Быстро исправляю и двигаюсь дальше",
        "Анализирую почему так случилось",
        "Расстраиваюсь, но продолжаю",
        "Учусь на этом"
      ],
      kg: [
        "Тез оңдоп, улантам",
        "Эмне үчүн болгонун анализдейм",
        "Капаланам, бирок улантам",
        "Мындан сабак алам"
      ]
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
      en: [
        "15-30 minutes",
        "30-60 minutes",
        "1-2 hours",
        "More than 2 hours"
      ],
      ru: [
        "15-30 минут",
        "30-60 минут",
        "1-2 часа",
        "Более 2 часов"
      ],
      kg: [
        "15-30 мүнөт",
        "30-60 мүнөт",
        "1-2 саат",
        "2 сааттан көп"
      ]
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
      en: [
        "Achieving high scores and goals",
        "Genuine interest in the subject",
        "Making parents/teachers proud",
        "Future career benefits"
      ],
      ru: [
        "Достижение высоких баллов и целей",
        "Настоящий интерес к предмету",
        "Гордость родителей/учителей",
        "Польза для будущей карьеры"
      ],
      kg: [
        "Жогорку баллдарга жана максаттарга жетүү",
        "Предметке чыныгы кызыгуу",
        "Ата-эне/мугалимдердин сыймыктануусу",
        "Келечектеги карьерага пайда"
      ]
    },
    trait: "motivation_type",
    scoring: [0, 1, 2, 3] // Maps to motivation types
  },
  {
    id: 'psych_5',
    question: {
      en: "When preparing for an important test, I:",
      ru: "Готовясь к важному тесту, я:",
      kg: "Маанилүү тестке даярданганда, мен:"
    },
    options: {
      en: [
        "Start early and study consistently",
        "Cram intensively before the test",
        "Do moderate prep, trust my knowledge",
        "Study only what I find difficult"
      ],
      ru: [
        "Начинаю рано и учусь регулярно",
        "Интенсивно учу перед тестом",
        "Готовлюсь умеренно, доверяю знаниям",
        "Учу только сложные темы"
      ],
      kg: [
        "Эрте баштап, туруктуу окуйм",
        "Тест алдында катуу окуйм",
        "Орточо даярданам, билимиме ишенем",
        "Кыйын темаларды гана окуйм"
      ]
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
      en: [
        "Very confident",
        "Somewhat confident",
        "Not very confident",
        "I struggle with math"
      ],
      ru: [
        "Очень уверен(а)",
        "Достаточно уверен(а)",
        "Не очень уверен(а)",
        "Математика даётся мне тяжело"
      ],
      kg: [
        "Өтө ишенимдүү",
        "Жетиштүү ишенимдүү",
        "Өтө эмес",
        "Математика мага кыйын"
      ]
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
      en: [
        "Try again patiently",
        "Get frustrated but persist",
        "Take a break and return later",
        "Give up and move on"
      ],
      ru: [
        "Терпеливо пробую снова",
        "Раздражаюсь, но продолжаю",
        "Делаю перерыв и возвращаюсь позже",
        "Бросаю и перехожу к другому"
      ],
      kg: [
        "Чыдамдуулук менен кайра аракет кылам",
        "Ачууланам, бирок улантам",
        "Тыныгып, кийин кайтам",
        "Таштап, башкага өтөм"
      ]
    },
    trait: "patience",
    scoring: [90, 60, 70, 20]
  }
];

// Encouragement messages
const encouragements = {
  math_start: {
    en: "Let's test your math skills! Take your time and do your best. 🧮",
    ru: "Проверим ваши математические навыки! Не торопитесь. 🧮",
    kg: "Математикалык көндүмдөрүңүздү текшерели! Шашылбаңыз. 🧮"
  },
  math_mid: {
    en: "You're doing great! Keep going! 💪",
    ru: "Отлично! Продолжайте! 💪",
    kg: "Мыкты! Улантыңыз! 💪"
  },
  learning_start: {
    en: "Now let's discover your unique learning style! 📚",
    ru: "Теперь определим ваш уникальный стиль обучения! 📚",
    kg: "Эми сиздин уникалдуу окуу стилин аныктайлы! 📚"
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
  
  const [section, setSection] = useState<Section>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mathAnswers, setMathAnswers] = useState<{questionId: string; answer: number; correct: boolean; timeTaken: number}[]>([]);
  const [learningAnswers, setLearningAnswers] = useState<{questionId: string; answer: number; scales: string[]}[]>([]);
  const [psychologyAnswers, setPsychologyAnswers] = useState<{questionId: string; answer: number; trait: string; score: number}[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

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
      .single();
    
    if (data?.diagnostic_completed) {
      navigate('/dashboard');
    }
  };

  const totalSections = 5;
  const currentSectionIndex = 
    section === 'intro' ? 0 : 
    section === 'math' ? 1 : 
    section === 'learning_style' ? 2 : 
    section === 'psychology' ? 3 : 
    section === 'preferences' ? 4 : 
    section === 'goals' ? 5 : 5;
  
  const sectionProgress = section === 'math' 
    ? (currentQuestion / mathQuestions.length) * 100
    : section === 'learning_style'
    ? (currentQuestion / learningStyleQuestions.length) * 100
    : section === 'psychology'
    ? (currentQuestion / psychologyQuestions.length) * 100
    : 100;

  const overallProgress = ((currentSectionIndex - 1 + sectionProgress / 100) / totalSections) * 100;

  const handleStartTest = () => {
    setSection('math');
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const handleMathAnswer = useCallback((answer: number) => {
    const q = mathQuestions[currentQuestion];
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    
    const newAnswer = {
      questionId: q.id,
      answer,
      correct: answer === q.correct,
      timeTaken
    };
    
    setMathAnswers(prev => [...prev, newAnswer]);
    
    if (currentQuestion < mathQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setQuestionStartTime(Date.now());
    } else {
      setSection('learning_style');
      setCurrentQuestion(0);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, questionStartTime]);

  const handleLearningAnswer = useCallback((answer: number) => {
    const q = learningStyleQuestions[currentQuestion];
    
    const newAnswer = {
      questionId: q.id,
      answer,
      scales: [q.scales[answer]]
    };
    
    setLearningAnswers(prev => [...prev, newAnswer]);
    
    if (currentQuestion < learningStyleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('psychology');
      setCurrentQuestion(0);
    }
  }, [currentQuestion]);

  const handlePsychologyAnswer = useCallback((answer: number) => {
    const q = psychologyQuestions[currentQuestion];
    
    const newAnswer = {
      questionId: q.id,
      answer,
      trait: q.trait,
      score: q.scoring[answer]
    };
    
    setPsychologyAnswers(prev => [...prev, newAnswer]);
    
    if (currentQuestion < psychologyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('preferences');
    }
  }, [currentQuestion]);

  const calculateLocalResults = useCallback(() => {
    // Math calculations
    const correctCount = mathAnswers.filter(a => a.correct).length;
    const totalTime = mathAnswers.reduce((sum, a) => sum + a.timeTaken, 0);
    const avgTime = mathAnswers.length > 0 ? totalTime / mathAnswers.length : 30;
    const mathLevel = Math.min(5, Math.max(1, Math.ceil((correctCount / mathQuestions.length) * 5)));
    const accuracy = Math.round((correctCount / mathQuestions.length) * 100);
    
    // Calculate difficulty-weighted scores
    let difficultyScore = 0;
    mathAnswers.forEach((a, idx) => {
      if (a.correct) {
        difficultyScore += mathQuestions[idx].difficulty * 10;
      }
    });

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

    // Motivation type mapping
    const motivationTypes = ['achievement', 'intrinsic', 'social', 'practical'];
    const motivationType = motivationTypes[traitScores.motivation_type] || 'balanced';

    return {
      math_level: mathLevel,
      logic_score: Math.min(100, difficultyScore),
      problem_solving_score: Math.min(100, correctCount * 8 + difficultyScore / 3),
      speed_score: Math.max(0, Math.min(100, 100 - avgTime * 2)),
      accuracy_score: accuracy,
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
    };
  }, [mathAnswers, learningAnswers, psychologyAnswers, preferences]);

  const analyzeWithAI = async () => {
    try {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      
      const response = await supabase.functions.invoke('ai-diagnostic-analysis', {
        body: {
          mathAnswers: mathAnswers.map((a, idx) => ({
            ...a,
            question: mathQuestions[idx].question[language as 'en' | 'ru' | 'kg'],
            difficulty: mathQuestions[idx].difficulty,
            topic: mathQuestions[idx].topic
          })),
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

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSection('analyzing');

    try {
      // Try AI analysis first, fall back to local calculation
      const analysis = await analyzeWithAI();
      const localResults = calculateLocalResults();
      const results = analysis || localResults;

      setAiAnalysis(analysis);
      
      // Calculate exam date from goals
      let examDateValue = goals.examDate ? new Date(goals.examDate).toISOString() : null;
      if (!examDateValue && goals.monthsUntilExam) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + goals.monthsUntilExam);
        examDateValue = futureDate.toISOString();
      }

      const { error } = await supabase
        .from('user_diagnostic_profile')
        .upsert({
          user_id: user.id,
          ...results,
          target_ort_score: goals.targetORTScore,
          exam_date: examDateValue,
          grade_level: goals.gradeLevel || null,
          months_until_exam: goals.monthsUntilExam,
          diagnostic_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: language === 'ru' ? "Диагностика завершена!" : language === 'kg' ? "Диагностика аяктады!" : "Diagnostic Complete!",
        description: language === 'ru' ? "Ваш профиль обучения создан" : language === 'kg' ? "Окуу профилиңиз түзүлдү" : "Your learning profile has been created",
      });

      setSection('complete');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save diagnostic results",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const renderIntro = () => (
    <Card className="max-w-2xl mx-auto border-2">
      <CardHeader className="text-center pb-2">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-2xl md:text-3xl">
          {language === 'ru' ? 'Адаптивный диагностический тест' : language === 'kg' ? 'Адаптивдүү диагностикалык тест' : 'Adaptive Diagnostic Test'}
        </CardTitle>
        <CardDescription className="text-base md:text-lg mt-2">
          {language === 'ru' 
            ? 'Этот тест поможет нам создать персональный план подготовки к ОРТ, основанный на вашем уровне и стиле обучения.'
            : language === 'kg'
            ? 'Бул тест ЖРТга даярдыгыңыздын жекелештирилген планын түзүүгө жардам берет.'
            : 'This test will help us create a personalized ORT preparation plan based on your level and learning style.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'Математика' : language === 'kg' ? 'Математика' : 'Math Skills'}</p>
              <p className="text-sm text-muted-foreground">{mathQuestions.length} {language === 'ru' ? 'вопросов' : language === 'kg' ? 'суроо' : 'questions'}</p>
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
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'Психологический профиль' : language === 'kg' ? 'Психологиялык профиль' : 'Psychology'}</p>
              <p className="text-sm text-muted-foreground">{psychologyQuestions.length} {language === 'ru' ? 'вопросов' : language === 'kg' ? 'суроо' : 'questions'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium">{language === 'ru' ? 'Предпочтения' : language === 'kg' ? 'Каалоолор' : 'Preferences'}</p>
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
            {language === 'ru' ? '~10-15 минут' : language === 'kg' ? '~10-15 мүнөт' : '~10-15 minutes'}
          </p>
        </div>

        <Button 
          className="w-full h-12 text-lg" 
          size="lg" 
          onClick={handleStartTest}
        >
          {language === 'ru' ? 'Начать тест' : language === 'kg' ? 'Тестти баштоо' : 'Start Test'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderMathSection = () => {
    const q = mathQuestions[currentQuestion];
    const showEncouragement = currentQuestion === 0 || currentQuestion === Math.floor(mathQuestions.length / 2);
    
    return (
      <div className="space-y-4">
        {showEncouragement && (
          <div className="bg-primary/10 rounded-xl p-4 text-center mb-4">
            <p className="text-primary font-medium">
              {currentQuestion === 0 
                ? encouragements.math_start[language as 'en' | 'ru' | 'kg']
                : encouragements.math_mid[language as 'en' | 'ru' | 'kg']}
            </p>
          </div>
        )}
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="px-3">
                {language === 'ru' ? 'Математика' : language === 'kg' ? 'Математика' : 'Math'} • {currentQuestion + 1}/{mathQuestions.length}
              </Badge>
              <Badge 
                variant={q.difficulty === 1 ? 'secondary' : q.difficulty === 2 ? 'default' : 'destructive'}
                className="px-3"
              >
                {q.difficulty === 1 ? '⭐' : q.difficulty === 2 ? '⭐⭐' : '⭐⭐⭐'}
              </Badge>
            </div>
            <Progress value={(currentQuestion / mathQuestions.length) * 100} className="h-1.5 mb-4" />
            <CardTitle className="text-lg md:text-xl leading-relaxed">
              {q.question[language as 'en' | 'ru' | 'kg']}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              onValueChange={(v) => handleMathAnswer(parseInt(v))}
              className="space-y-3"
            >
              {q.options[language as 'en' | 'ru' | 'kg'].map((option, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all"
                >
                  <RadioGroupItem value={idx.toString()} id={`math-${idx}`} />
                  <Label htmlFor={`math-${idx}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLearningStyleSection = () => {
    const q = learningStyleQuestions[currentQuestion];
    const showEncouragement = currentQuestion === 0;
    
    return (
      <div className="space-y-4">
        {showEncouragement && (
          <div className="bg-green-100 dark:bg-green-950/30 rounded-xl p-4 text-center mb-4">
            <p className="text-green-700 dark:text-green-300 font-medium">
              {encouragements.learning_start[language as 'en' | 'ru' | 'kg']}
            </p>
          </div>
        )}
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="px-3 bg-green-50 text-green-700 border-green-200">
                <BookOpen className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Стиль обучения' : language === 'kg' ? 'Окуу стили' : 'Learning Style'} • {currentQuestion + 1}/{learningStyleQuestions.length}
              </Badge>
            </div>
            <Progress value={(currentQuestion / learningStyleQuestions.length) * 100} className="h-1.5 mb-4" />
            <CardTitle className="text-lg md:text-xl leading-relaxed">
              {q.question[language as 'en' | 'ru' | 'kg']}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              onValueChange={(v) => handleLearningAnswer(parseInt(v))}
              className="space-y-3"
            >
              {q.options[language as 'en' | 'ru' | 'kg'].map((option, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 hover:border-green-500/50 cursor-pointer transition-all"
                >
                  <RadioGroupItem value={idx.toString()} id={`learn-${idx}`} />
                  <Label htmlFor={`learn-${idx}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPsychologySection = () => {
    const q = psychologyQuestions[currentQuestion];
    const showEncouragement = currentQuestion === 0;
    
    return (
      <div className="space-y-4">
        {showEncouragement && (
          <div className="bg-purple-100 dark:bg-purple-950/30 rounded-xl p-4 text-center mb-4">
            <p className="text-purple-700 dark:text-purple-300 font-medium">
              {encouragements.psychology_start[language as 'en' | 'ru' | 'kg']}
            </p>
          </div>
        )}
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="px-3 bg-purple-50 text-purple-700 border-purple-200">
                <Heart className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Психологический профиль' : language === 'kg' ? 'Психологиялык профиль' : 'Psychology'} • {currentQuestion + 1}/{psychologyQuestions.length}
              </Badge>
            </div>
            <Progress value={(currentQuestion / psychologyQuestions.length) * 100} className="h-1.5 mb-4" />
            <CardTitle className="text-lg md:text-xl leading-relaxed">
              {q.question[language as 'en' | 'ru' | 'kg']}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              onValueChange={(v) => handlePsychologyAnswer(parseInt(v))}
              className="space-y-3"
            >
              {q.options[language as 'en' | 'ru' | 'kg'].map((option, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 hover:border-purple-500/50 cursor-pointer transition-all"
                >
                  <RadioGroupItem value={idx.toString()} id={`psych-${idx}`} />
                  <Label htmlFor={`psych-${idx}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    );
  };

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
          <CardDescription>
            {language === 'ru' 
              ? 'Передвигайте ползунки, чтобы указать ваши предпочтения'
              : language === 'kg'
              ? 'Каалоолоруңузду көрсөтүү үчүн слайдерлерди жылдырыңыз'
              : 'Move the sliders to indicate your preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'ru' ? 'Длина уроков' : language === 'kg' ? 'Сабактын узундугу' : 'Lesson Length'}
              </Label>
              <Badge variant="outline">
                {preferences.shortLessons < 50 
                  ? (language === 'ru' ? 'Короткие' : language === 'kg' ? 'Кыска' : 'Short') 
                  : (language === 'ru' ? 'Длинные' : language === 'kg' ? 'Узун' : 'Long')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">5-10 min</span>
              <Slider
                value={[preferences.shortLessons]}
                onValueChange={([v]) => setPreferences(p => ({ ...p, shortLessons: v }))}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">30+ min</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                {language === 'ru' ? 'Примеры vs Теория' : language === 'kg' ? 'Мисалдар vs Теория' : 'Examples vs Theory'}
              </Label>
              <Badge variant="outline">
                {preferences.examples > 50 
                  ? (language === 'ru' ? 'Больше примеров' : language === 'kg' ? 'Көбүрөөк мисал' : 'More examples') 
                  : (language === 'ru' ? 'Больше теории' : language === 'kg' ? 'Көбүрөөк теория' : 'More theory')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Теория' : language === 'kg' ? 'Теория' : 'Theory'}</span>
              <Slider
                value={[preferences.examples]}
                onValueChange={([v]) => setPreferences(p => ({ ...p, examples: v }))}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Puzzle className="w-4 h-4" />
                {language === 'ru' ? 'Тесты vs Объяснения' : language === 'kg' ? 'Тесттер vs Түшүндүрмөлөр' : 'Quizzes vs Explanations'}
              </Label>
              <Badge variant="outline">
                {preferences.quizzes > 50 
                  ? (language === 'ru' ? 'Больше тестов' : language === 'kg' ? 'Көбүрөөк тест' : 'More quizzes') 
                  : (language === 'ru' ? 'Больше объяснений' : language === 'kg' ? 'Көбүрөөк түшүндүрмө' : 'More explanations')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Объяснения' : language === 'kg' ? 'Түшүндүрмө' : 'Explain'}</span>
              <Slider
                value={[preferences.quizzes]}
                onValueChange={([v]) => setPreferences(p => ({ ...p, quizzes: v }))}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Тесты' : language === 'kg' ? 'Тесттер' : 'Quizzes'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4" />
                {language === 'ru' ? 'Пошаговые инструкции' : language === 'kg' ? 'Кадам-кадам нускамалар' : 'Step-by-step'}
              </Label>
              <Badge variant="outline">
                {preferences.stepByStep > 50 
                  ? (language === 'ru' ? 'Детальные шаги' : language === 'kg' ? 'Деталдуу кадамдар' : 'Detailed steps') 
                  : (language === 'ru' ? 'Общий обзор' : language === 'kg' ? 'Жалпы обзор' : 'Overview')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Обзор' : language === 'kg' ? 'Обзор' : 'Overview'}</span>
              <Slider
                value={[preferences.stepByStep]}
                onValueChange={([v]) => setPreferences(p => ({ ...p, stepByStep: v }))}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">{language === 'ru' ? 'Шаги' : language === 'kg' ? 'Кадамдар' : 'Steps'}</span>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg" 
            size="lg" 
            onClick={() => setSection('goals')}
          >
            <ArrowRight className="mr-2 h-5 w-5" /> {language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderGoalsSection = () => (
    <div className="space-y-4">
      <div className="bg-indigo-100 dark:bg-indigo-950/30 rounded-xl p-4 text-center mb-4">
        <p className="text-indigo-700 dark:text-indigo-300 font-medium">
          {encouragements.goals_start[language as 'en' | 'ru' | 'kg']}
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-500" />
            {language === 'ru' ? 'Ваши цели ОРТ' : language === 'kg' ? 'ЖРТ максаттарыңыз' : 'Your ORT Goals'}
          </CardTitle>
          <CardDescription>
            {language === 'ru' 
              ? 'Эта информация поможет создать идеальный план подготовки'
              : language === 'kg'
              ? 'Бул маалымат идеалдуу даярдык планын түзүүгө жардам берет'
              : 'This information will help us create your perfect preparation plan'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Target ORT Score */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Target className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Какой балл ОРТ вы хотите получить?' : language === 'kg' ? 'Канча ЖРТ балл алгыңыз келет?' : 'What ORT score do you want to achieve?'}
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[110, 130, 150, 170, 190, 200].map((score) => (
                <Button
                  key={score}
                  variant={goals.targetORTScore === score ? "default" : "outline"}
                  className={`h-12 ${goals.targetORTScore === score ? '' : 'hover:border-primary'}`}
                  onClick={() => setGoals(g => ({ ...g, targetORTScore: score }))}
                >
                  {score}{score === 200 ? '+' : ''}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Или введите свой:' : language === 'kg' ? 'Же өзүңүз жазыңыз:' : 'Or enter your own:'}
              </span>
              <Input
                type="number"
                min={100}
                max={250}
                value={goals.targetORTScore}
                onChange={(e) => setGoals(g => ({ ...g, targetORTScore: parseInt(e.target.value) || 170 }))}
                className="w-24"
              />
            </div>
          </div>

          {/* Exam Date Toggle */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Calendar className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Когда ваш экзамен?' : language === 'kg' ? 'Экзамениңиз качан?' : 'When is your exam?'}
            </Label>
            <div className="flex gap-2">
              <Button
                variant={goals.knowsExamDate ? "default" : "outline"}
                onClick={() => setGoals(g => ({ ...g, knowsExamDate: true }))}
                className="flex-1"
              >
                {language === 'ru' ? 'Знаю дату' : language === 'kg' ? 'Күнүн билем' : 'I know the date'}
              </Button>
              <Button
                variant={!goals.knowsExamDate ? "default" : "outline"}
                onClick={() => setGoals(g => ({ ...g, knowsExamDate: false }))}
                className="flex-1"
              >
                {language === 'ru' ? 'Примерно' : language === 'kg' ? 'Болжолдуу' : 'Approximately'}
              </Button>
            </div>
          </div>

          {goals.knowsExamDate ? (
            <div className="space-y-2">
              <Label>{language === 'ru' ? 'Выберите дату экзамена:' : language === 'kg' ? 'Экзамен күнүн тандаңыз:' : 'Select exam date:'}</Label>
              <Input
                type="date"
                value={goals.examDate}
                onChange={(e) => setGoals(g => ({ ...g, examDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="max-w-xs"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {language === 'ru' ? 'В каком вы классе?' : language === 'kg' ? 'Канча класста окуйсуз?' : 'What grade are you in?'}
                </Label>
                <Select 
                  value={goals.gradeLevel} 
                  onValueChange={(v) => setGoals(g => ({ 
                    ...g, 
                    gradeLevel: v as '' | '10' | '11' | 'graduate',
                    monthsUntilExam: v === '10' ? 18 : v === '11' ? 6 : g.monthsUntilExam
                  }))}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder={language === 'ru' ? 'Выберите класс' : language === 'kg' ? 'Классты тандаңыз' : 'Select grade'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">{language === 'ru' ? '10 класс (~18 месяцев)' : language === 'kg' ? '10 класс (~18 ай)' : '10th Grade (~18 months)'}</SelectItem>
                    <SelectItem value="11">{language === 'ru' ? '11 класс (~6 месяцев)' : language === 'kg' ? '11 класс (~6 ай)' : '11th Grade (~6 months)'}</SelectItem>
                    <SelectItem value="graduate">{language === 'ru' ? 'Выпускник' : language === 'kg' ? 'Бүтүрүүчү' : 'Graduate'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {language === 'ru' ? 'Примерно сколько месяцев до экзамена?' : language === 'kg' ? 'Экзаменге болжол менен канча ай калды?' : 'Approximately how many months until exam?'}
                </Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">1</span>
                  <Slider
                    value={[goals.monthsUntilExam]}
                    onValueChange={([v]) => setGoals(g => ({ ...g, monthsUntilExam: v }))}
                    min={1}
                    max={24}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">24</span>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {goals.monthsUntilExam} {language === 'ru' ? 'мес.' : language === 'kg' ? 'ай' : 'months'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Summary of what they'll get */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {language === 'ru' ? 'Ваш план будет включать:' : language === 'kg' ? 'Планыңыз камтыйт:' : 'Your plan will include:'}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {language === 'ru' 
                  ? `Цель: ${goals.targetORTScore}+ баллов` 
                  : language === 'kg' 
                  ? `Максат: ${goals.targetORTScore}+ балл` 
                  : `Target: ${goals.targetORTScore}+ points`}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {language === 'ru' 
                  ? `Срок: ${goals.examDate ? new Date(goals.examDate).toLocaleDateString() : `~${goals.monthsUntilExam} месяцев`}` 
                  : language === 'kg' 
                  ? `Мөөнөт: ${goals.examDate ? new Date(goals.examDate).toLocaleDateString() : `~${goals.monthsUntilExam} ай`}` 
                  : `Timeline: ${goals.examDate ? new Date(goals.examDate).toLocaleDateString() : `~${goals.monthsUntilExam} months`}`}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {language === 'ru' 
                  ? 'Персональная программа на основе диагностики' 
                  : language === 'kg' 
                  ? 'Диагностикага негизделген жеке программа' 
                  : 'Personalized program based on your diagnostic'}
              </li>
            </ul>
          </div>

          <Button 
            className="w-full h-12 text-lg" 
            size="lg" 
            onClick={saveProfile} 
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {language === 'ru' ? 'Анализ...' : language === 'kg' ? 'Анализ...' : 'Analyzing...'}</>
            ) : (
              <><Check className="mr-2 h-5 w-5" /> {language === 'ru' ? 'Завершить диагностику' : language === 'kg' ? 'Диагностиканы бүтүрүү' : 'Complete Diagnostic'}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyzing = () => (
    <Card className="max-w-2xl mx-auto text-center">
      <CardContent className="py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {language === 'ru' ? 'ИИ анализирует ваши ответы...' : language === 'kg' ? 'ЖИ жоопторуңузду анализдөөдө...' : 'AI is analyzing your answers...'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {language === 'ru' 
            ? 'Создаём персональный профиль обучения'
            : language === 'kg'
            ? 'Жекелештирилген окуу профилин түзүп жатабыз'
            : 'Creating your personalized learning profile'}
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </CardContent>
    </Card>
  );

  const renderComplete = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Trophy className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {language === 'ru' ? 'Диагностика завершена!' : language === 'kg' ? 'Диагностика аяктады!' : 'Diagnostic Complete!'}
        </h2>
        
        {aiAnalysis?.summary && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-muted-foreground">{aiAnalysis.summary}</p>
          </div>
        )}

        {aiAnalysis?.strengths && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {language === 'ru' ? 'Сильные стороны' : language === 'kg' ? 'Күчтүү жактары' : 'Strengths'}
              </h3>
              <ul className="text-sm space-y-1">
                {aiAnalysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {language === 'ru' ? 'Области для роста' : language === 'kg' ? 'Өсүү чөйрөлөрү' : 'Areas to Improve'}
              </h3>
              <ul className="text-sm space-y-1">
                {aiAnalysis.areas_to_improve?.map((a: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-muted-foreground mb-6">
          {language === 'ru' 
            ? 'Ваш персональный профиль обучения создан. Перенаправление на панель управления...'
            : language === 'kg'
            ? 'Жекелештирилген окуу профилиңиз түзүлдү. Панелге багыттоо...'
            : 'Your personalized learning profile has been created. Redirecting to dashboard...'}
        </p>
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {section !== 'intro' && section !== 'complete' && section !== 'analyzing' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {language === 'ru' ? 'Общий прогресс' : language === 'kg' ? 'Жалпы прогресс' : 'Overall Progress'}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between mt-3 text-xs md:text-sm">
              <div className={`flex items-center gap-1 ${section === 'math' ? 'text-primary font-medium' : currentSectionIndex > 1 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                <Target className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'ru' ? 'Математика' : language === 'kg' ? 'Математика' : 'Math'}</span>
              </div>
              <div className={`flex items-center gap-1 ${section === 'learning_style' ? 'text-primary font-medium' : currentSectionIndex > 2 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                <BookOpen className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'ru' ? 'Стиль' : language === 'kg' ? 'Стил' : 'Style'}</span>
              </div>
              <div className={`flex items-center gap-1 ${section === 'psychology' ? 'text-primary font-medium' : currentSectionIndex > 3 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                <Heart className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'ru' ? 'Психология' : language === 'kg' ? 'Психология' : 'Psychology'}</span>
              </div>
              <div className={`flex items-center gap-1 ${section === 'preferences' ? 'text-primary font-medium' : currentSectionIndex > 4 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'ru' ? 'Предпочтения' : language === 'kg' ? 'Каалоолор' : 'Preferences'}</span>
              </div>
              <div className={`flex items-center gap-1 ${section === 'goals' ? 'text-primary font-medium' : 'text-muted-foreground/50'}`}>
                <Flag className="w-4 h-4" />
                <span className="hidden md:inline">{language === 'ru' ? 'Цели' : language === 'kg' ? 'Максаттар' : 'Goals'}</span>
              </div>
            </div>
          </div>
        )}

        {section === 'intro' && renderIntro()}
        {section === 'math' && renderMathSection()}
        {section === 'learning_style' && renderLearningStyleSection()}
        {section === 'psychology' && renderPsychologySection()}
        {section === 'preferences' && renderPreferencesSection()}
        {section === 'goals' && renderGoalsSection()}
        {section === 'analyzing' && renderAnalyzing()}
        {section === 'complete' && renderComplete()}
      </div>
    </div>
  );
}
