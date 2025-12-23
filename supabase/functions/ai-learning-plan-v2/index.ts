import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ================================
// FIXED 30-QUESTION ORT TOPIC MAPPING (AUTHORITATIVE)
// ================================
const ORT_QUESTION_TOPIC_MAP: Record<number, string[]> = {
  1:  ['Decimal fractions'],
  2:  ['Decimal fractions', 'Operations with decimals'],
  3:  ['Exponents'],
  4:  ['Operations with fractions'],
  5:  ['Simple equations'],
  6:  ['Order of operations'],
  7:  ['Fractions'],
  8:  ['Similarity', 'Triangle angles'],
  9:  ['Operations with fractions'],
  10: ['Square root'],
  11: ['Angles', 'Logic'],
  12: ['Coordinates'],
  13: ['Inequalities'],
  14: ['Comparing values'],
  15: ['Functions'],
  16: ['Percentages'],
  17: ['Progressions'],
  18: ['Basic arithmetic operations'],
  19: ['Exponents'],
  20: ['Absolute value'],
  21: ['Proportions'],
  22: ['Triangles'],
  23: ['Sum of interior angles'],
  24: ['Exponents'],
  25: ['Range of numbers'],
  26: ['Trapezoid'],
  27: ['Exponents'],
  28: ['Rectangles'],
  29: ['Logic'],
  30: ['3D geometry'],
};

// Russian topic names mapping
const TOPIC_NAME_RU: Record<string, string> = {
  'Decimal fractions': 'Десятичные дроби',
  'Operations with decimals': 'Операции с десятичными',
  'Exponents': 'Степени',
  'Operations with fractions': 'Операции с дробями',
  'Simple equations': 'Простые уравнения',
  'Order of operations': 'Порядок действий',
  'Fractions': 'Дроби',
  'Similarity': 'Подобие',
  'Triangle angles': 'Углы треугольника',
  'Square root': 'Квадратный корень',
  'Angles': 'Углы',
  'Logic': 'Логика',
  'Coordinates': 'Координаты',
  'Inequalities': 'Неравенства',
  'Comparing values': 'Сравнение величин',
  'Functions': 'Функции',
  'Percentages': 'Проценты',
  'Progressions': 'Прогрессии',
  'Basic arithmetic operations': 'Базовые арифметические операции',
  'Absolute value': 'Модуль числа',
  'Proportions': 'Пропорции',
  'Triangles': 'Треугольники',
  'Sum of interior angles': 'Сумма внутренних углов',
  'Range of numbers': 'Область чисел',
  'Trapezoid': 'Трапеция',
  'Rectangles': 'Прямоугольники',
  '3D geometry': 'Стереометрия',
};

// Get all unique topics from the mapping
function getAllORTTopics(): string[] {
  const topics = new Set<string>();
  Object.values(ORT_QUESTION_TOPIC_MAP).forEach(arr => arr.forEach(t => topics.add(t)));
  return Array.from(topics);
}

// ================================
// MANDATORY LIMITS
// ================================
const MAX_STUDY_TIME_PER_DAY = 45; // minutes
const MAX_TOPICS_PER_DAY = 3;

// ================================
// MASTERY THRESHOLDS
// ================================
const STRONG_THRESHOLD = 80; // 80-100% = Strong
const MEDIUM_THRESHOLD = 50; // 50-79% = Medium
// 0-49% = Weak → High priority

// ================================
// TYPE DEFINITIONS
// ================================
interface TopicMastery {
  topic: string;
  topicRu: string;
  mastery: number;
  status: 'strong' | 'medium' | 'weak';
  priority: number;
  questionCount: number;
  isAssumed: boolean;
}

interface StudentProfile {
  grade: string;
  overallMathLevel: 'low' | 'medium' | 'high';
  motivation: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  pace: 'slow' | 'normal' | 'fast';
  learningStyle: 'analytical' | 'step-by-step' | 'example-driven';
  dominantErrorType: 'conceptual' | 'calculation' | 'logical_reasoning';
  isAssumed: boolean;
}

interface DayPlan {
  day: number;
  dayName: string;
  topics: { name: string; nameRu: string; timeMinutes: number; priority: string }[];
  totalTime: number;
  isRevisionDay: boolean;
}

type StudentType = 
  | 'fast_but_inattentive'
  | 'slow_but_accurate'
  | 'motivated_but_anxious'
  | 'low_motivation_but_capable'
  | 'balanced_learner';

// ================================
// NUMERIC SAFETY (STRICT)
// ================================
function toSafeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.\-,]/g, '').replace(',', '.');
    const n = Number.parseFloat(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toSafeInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = toSafeNumber(value, fallback);
  const rounded = Math.round(n);
  if (!Number.isFinite(rounded)) return fallback;
  return Math.max(min, Math.min(max, rounded));
}

function toSafePercentInt(value: unknown, fallback = 50): number {
  return toSafeInt(value, fallback, 0, 100);
}

// ================================
// CALCULATE TOPIC MASTERY FROM ANSWERS
// ================================
function calculateTopicMasteryFromAnswers(
  answers: Array<{ questionId: string | number; correct: boolean; topic?: string }>,
  correctAnswerMap?: Record<string, string>
): Record<string, { correct: number; total: number }> {
  const topicScores: Record<string, { correct: number; total: number }> = {};

  answers.forEach((answer) => {
    const qNum = typeof answer.questionId === 'string' 
      ? parseInt(answer.questionId.replace(/\D/g, ''), 10) 
      : answer.questionId;
    
    // Use fixed ORT mapping
    const topics = ORT_QUESTION_TOPIC_MAP[qNum] || (answer.topic ? [answer.topic] : ['General']);
    
    topics.forEach(topic => {
      if (!topicScores[topic]) topicScores[topic] = { correct: 0, total: 0 };
      topicScores[topic].total += 1;
      if (answer.correct) topicScores[topic].correct += 1;
    });
  });

  return topicScores;
}

// ================================
// CATEGORIZATION LOGIC
// ================================
function categorizeTopics(topicMasteryData: Record<string, { mastery: number; total: number; isAssumed: boolean }>): TopicMastery[] {
  return Object.entries(topicMasteryData).map(([topic, data]) => {
    const safeMastery = toSafePercentInt(data.mastery, 50);

    let status: 'strong' | 'medium' | 'weak';
    let priority: number;

    if (safeMastery >= STRONG_THRESHOLD) {
      status = 'strong';
      priority = 3;
    } else if (safeMastery >= MEDIUM_THRESHOLD) {
      status = 'medium';
      priority = 2;
    } else {
      status = 'weak';
      priority = 1;
    }

    return { 
      topic, 
      topicRu: TOPIC_NAME_RU[topic] || topic,
      mastery: safeMastery, 
      status, 
      priority,
      questionCount: data.total,
      isAssumed: data.isAssumed,
    };
  }).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.mastery - b.mastery;
  });
}

// ================================
// BUILD STUDENT PROFILE (NEVER FAIL)
// ================================
function buildStudentProfile(diagnosticProfile: any, avgMastery: number): StudentProfile {
  let isAssumed = false;
  
  // Grade
  let grade = '11';
  if (diagnosticProfile?.grade_level) {
    grade = String(diagnosticProfile.grade_level).trim();
  } else {
    isAssumed = true;
  }

  // Overall math level
  let overallMathLevel: 'low' | 'medium' | 'high' = 'medium';
  if (avgMastery >= 70) overallMathLevel = 'high';
  else if (avgMastery < 40) overallMathLevel = 'low';

  // Confidence
  const confidenceScore = toSafePercentInt(diagnosticProfile?.confidence, 50);
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (confidenceScore > 70) confidence = 'high';
  else if (confidenceScore < 40) confidence = 'low';
  else if (!diagnosticProfile?.confidence) isAssumed = true;

  // Motivation
  let motivation: 'low' | 'medium' | 'high' = 'medium';
  if (diagnosticProfile?.motivation_type) {
    const mt = String(diagnosticProfile.motivation_type).toLowerCase();
    if (mt.includes('high') || mt.includes('intrinsic') || mt.includes('achievement')) motivation = 'high';
    else if (mt.includes('low')) motivation = 'low';
  } else {
    isAssumed = true;
  }

  // Pace
  const speedScore = toSafePercentInt(diagnosticProfile?.speed_score, 50);
  let pace: 'slow' | 'normal' | 'fast' = 'normal';
  if (speedScore > 70) pace = 'fast';
  else if (speedScore < 40) pace = 'slow';
  else if (!diagnosticProfile?.speed_score) isAssumed = true;

  // Learning style
  let learningStyle: 'analytical' | 'step-by-step' | 'example-driven' = 'step-by-step';
  if (diagnosticProfile?.learning_style) {
    const ls = String(diagnosticProfile.learning_style).toLowerCase();
    if (ls.includes('visual') || ls.includes('example') || ls.includes('практик')) learningStyle = 'example-driven';
    else if (ls.includes('text') || ls.includes('analyt') || ls.includes('теор')) learningStyle = 'analytical';
  } else if (diagnosticProfile?.prefers_examples) {
    learningStyle = 'example-driven';
  } else if (diagnosticProfile?.prefers_step_by_step) {
    learningStyle = 'step-by-step';
  } else {
    isAssumed = true;
  }

  // Dominant error type - infer from data
  let dominantErrorType: 'conceptual' | 'calculation' | 'logical_reasoning' = 'conceptual';
  const accuracyScore = toSafePercentInt(diagnosticProfile?.accuracy_score, 50);
  const logicScore = toSafePercentInt(diagnosticProfile?.logic_score, 50);
  
  if (accuracyScore < 50 && logicScore >= 50) {
    dominantErrorType = 'calculation';
  } else if (logicScore < 50) {
    dominantErrorType = 'logical_reasoning';
  }

  return {
    grade,
    overallMathLevel,
    motivation,
    confidence,
    pace,
    learningStyle,
    dominantErrorType,
    isAssumed,
  };
}

// ================================
// STUDENT TYPE (EDUCATIONAL ONLY)
// ================================
function determineStudentType(profile: StudentProfile): StudentType {
  const { motivation, confidence, pace } = profile;
  
  if (pace === 'fast' && confidence === 'high' && motivation !== 'high') {
    return 'fast_but_inattentive';
  }
  if (pace === 'slow' && confidence !== 'low') {
    return 'slow_but_accurate';
  }
  if (motivation === 'high' && confidence === 'low') {
    return 'motivated_but_anxious';
  }
  if (motivation === 'low' && confidence !== 'low') {
    return 'low_motivation_but_capable';
  }
  return 'balanced_learner';
}

// ================================
// CALCULATE AVAILABLE DAYS
// ================================
function calculateAvailableDays(examDate: string | null | undefined, monthsUntilExam?: number): number {
  if (monthsUntilExam && typeof monthsUntilExam === 'number' && monthsUntilExam > 0) {
    return Math.max(7, Math.min(monthsUntilExam * 30, 180));
  }
  
  if (!examDate) return 60;
  
  const today = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(7, Math.min(diffDays, 180));
}

// ================================
// TIME PER TOPIC BASED ON PROFILE
// ================================
function getTimePerTopic(profile: StudentProfile): number {
  switch (profile.pace) {
    case 'slow': return 20;
    case 'fast': return 12;
    default: return 15;
  }
}

// ================================
// GENERATE WEEKLY PLAN WITH LIMITS
// ================================
function generateWeeklyPlan(
  topics: TopicMastery[],
  profile: StudentProfile,
  daysAvailable: number,
  language: string
): DayPlan[] {
  const plan: DayPlan[] = [];
  const dayNamesRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const isRu = language === 'ru' || language === 'kg';
  const dayNames = isRu ? dayNamesRu : dayNamesEn;
  
  // Filter out strong topics
  const topicsToStudy = topics.filter(t => t.status !== 'strong');
  
  if (topicsToStudy.length === 0) {
    // All strong - maintenance plan
    return [{
      day: 1,
      dayName: dayNames[0],
      topics: [{ 
        name: 'Review', 
        nameRu: 'Повторение',
        timeMinutes: 30, 
        priority: 'revision' 
      }],
      totalTime: 30,
      isRevisionDay: true,
    }];
  }
  
  const baseTimePerTopic = getTimePerTopic(profile);
  const weeksToGenerate = Math.min(Math.ceil(daysAvailable / 7), 4);
  
  let topicCycleIndex = 0;
  
  for (let week = 0; week < weeksToGenerate; week++) {
    for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
      const dayNumber = week * 7 + dayInWeek + 1;
      if (dayNumber > daysAvailable) break;
      
      // Sunday is rest
      if (dayInWeek === 6) {
        plan.push({
          day: dayNumber,
          dayName: dayNames[6],
          topics: [],
          totalTime: 0,
          isRevisionDay: false,
        });
        continue;
      }
      
      const isRevisionDay = dayInWeek === 5; // Saturday
      
      const dayPlan: DayPlan = {
        day: dayNumber,
        dayName: dayNames[dayInWeek],
        topics: [],
        totalTime: 0,
        isRevisionDay,
      };
      
      if (isRevisionDay) {
        const weakTopics = topicsToStudy.filter(t => t.status === 'weak').slice(0, 2);
        const revisionTopics = weakTopics.length > 0 ? weakTopics : topicsToStudy.slice(0, 2);
        
        revisionTopics.forEach(t => {
          dayPlan.topics.push({
            name: t.topic,
            nameRu: t.topicRu,
            timeMinutes: 15,
            priority: 'revision',
          });
          dayPlan.totalTime += 15;
        });
      } else {
        let remainingTime = MAX_STUDY_TIME_PER_DAY;
        let topicsAdded = 0;
        
        while (topicsAdded < MAX_TOPICS_PER_DAY && remainingTime >= baseTimePerTopic && topicsToStudy.length > 0) {
          const topic = topicsToStudy[topicCycleIndex % topicsToStudy.length];
          const timeForTopic = Math.min(baseTimePerTopic, remainingTime);
          
          if (!dayPlan.topics.some(t => t.name === topic.topic)) {
            dayPlan.topics.push({
              name: topic.topic,
              nameRu: topic.topicRu,
              timeMinutes: timeForTopic,
              priority: topic.status,
            });
            
            dayPlan.totalTime += timeForTopic;
            remainingTime -= timeForTopic;
            topicsAdded++;
          }
          
          topicCycleIndex++;
          if (topicCycleIndex > topicsToStudy.length * 3) break;
        }
      }
      
      plan.push(dayPlan);
    }
  }
  
  return plan;
}

// ================================
// GENERATE DEFAULT TOPIC MASTERY (FAIL-SAFE)
// ================================
function generateDefaultTopicMastery(): Record<string, { mastery: number; total: number; isAssumed: boolean }> {
  const allTopics = getAllORTTopics();
  const result: Record<string, { mastery: number; total: number; isAssumed: boolean }> = {};
  
  // Foundational topics (typically weak for most students)
  const foundational = ['Fractions', 'Decimal fractions', 'Exponents', 'Percentages', 'Simple equations'];
  const intermediate = ['Operations with fractions', 'Proportions', 'Square root', 'Inequalities'];
  
  allTopics.forEach(topic => {
    let defaultMastery = 50; // Assume medium by default
    
    if (foundational.includes(topic)) {
      defaultMastery = 40; // Assume weak for foundational
    } else if (intermediate.includes(topic)) {
      defaultMastery = 55; // Assume medium-low for intermediate
    }
    
    result[topic] = { mastery: defaultMastery, total: 0, isAssumed: true };
  });
  
  return result;
}

// ================================
// MAIN HANDLER
// ================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestedLanguage = 'ru';

  try {
    const body = await req.json().catch(() => ({}));
    const {
      diagnosticProfile,
      topicMastery,
      testHistory,
      targetORTScore,
      language = 'ru',
    } = (body ?? {}) as any;

    requestedLanguage = language;
    const isRu = language === 'ru' || language === 'kg';
    
    console.log("Received request with data:", {
      hasDiagnosticProfile: !!diagnosticProfile,
      hasTopicMastery: !!topicMastery,
      hasTestHistory: !!testHistory,
      language,
    });

    // ================================
    // STEP 1: EXTRACT TOPIC MASTERY (NEVER FAIL)
    // ================================
    let topicMasteryData: Record<string, { mastery: number; total: number; isAssumed: boolean }> = {};
    let assumptions: string[] = [];
    
    // Source 1: From test history answers (using fixed ORT mapping)
    if (testHistory && Array.isArray(testHistory)) {
      testHistory.forEach((test: any) => {
        const answers = Array.isArray(test?.answers) ? test.answers : [];
        if (answers.length > 0) {
          const scores = calculateTopicMasteryFromAnswers(answers);
          Object.entries(scores).forEach(([topic, data]) => {
            if (!topicMasteryData[topic]) {
              topicMasteryData[topic] = { mastery: 0, total: 0, isAssumed: false };
            }
            topicMasteryData[topic].total += data.total;
            topicMasteryData[topic].mastery = toSafePercentInt(
              ((topicMasteryData[topic].mastery * (topicMasteryData[topic].total - data.total)) + 
               (data.correct / data.total * 100 * data.total)) / topicMasteryData[topic].total,
              50
            );
          });
        }
      });
    }

    // Source 2: From diagnostic profile topic performance
    if (diagnosticProfile?.topicPerformance) {
      Object.entries(diagnosticProfile.topicPerformance).forEach(([topic, data]: [string, any]) => {
        const raw = typeof data === 'number' ? data : (data?.percentage ?? data?.progress ?? data?.mastery ?? 50);
        if (!topicMasteryData[topic]) {
          topicMasteryData[topic] = { mastery: toSafePercentInt(raw, 50), total: 1, isAssumed: false };
        } else {
          // Merge with existing
          topicMasteryData[topic].mastery = toSafePercentInt(
            (topicMasteryData[topic].mastery + toSafePercentInt(raw, 50)) / 2,
            50
          );
        }
      });
    }

    // Source 3: From topic progress table
    if (topicMastery && Array.isArray(topicMastery)) {
      topicMastery.forEach((tp: any) => {
        const topicName = tp.topic_id || tp.title || tp.topic;
        if (topicName) {
          const mastery = toSafePercentInt(tp.progress_percentage ?? tp.mastery ?? tp.percentage, 50);
          if (!topicMasteryData[topicName]) {
            topicMasteryData[topicName] = { mastery, total: 1, isAssumed: false };
          } else {
            topicMasteryData[topicName].mastery = toSafePercentInt(
              (topicMasteryData[topicName].mastery + mastery) / 2,
              50
            );
          }
        }
      });
    }

    // ================================
    // FAIL-SAFE: If no data, use defaults
    // ================================
    const hasRealData = Object.values(topicMasteryData).some(d => !d.isAssumed && d.total > 0);
    
    if (!hasRealData || Object.keys(topicMasteryData).length === 0) {
      console.log("No real data found - using default topic mastery (fail-safe mode)");
      topicMasteryData = generateDefaultTopicMastery();
      assumptions.push(isRu 
        ? "Использованы стандартные приоритеты тем (диагностический тест не пройден)"
        : "Used standard topic priorities (diagnostic test not completed)");
    }

    // ================================
    // STEP 2: CATEGORIZE TOPICS
    // ================================
    const categorizedTopics = categorizeTopics(topicMasteryData);
    
    const weakTopics = categorizedTopics.filter(t => t.status === 'weak');
    const mediumTopics = categorizedTopics.filter(t => t.status === 'medium');
    const strongTopics = categorizedTopics.filter(t => t.status === 'strong');

    // ================================
    // STEP 3: BUILD STUDENT PROFILE
    // ================================
    const avgMastery = categorizedTopics.length > 0
      ? Math.round(categorizedTopics.reduce((sum, t) => sum + t.mastery, 0) / categorizedTopics.length)
      : 50;
    
    const studentProfile = buildStudentProfile(diagnosticProfile, avgMastery);
    
    if (studentProfile.isAssumed) {
      assumptions.push(isRu 
        ? "Некоторые параметры профиля предположены на основе результатов теста"
        : "Some profile parameters inferred from test results");
    }

    // ================================
    // STEP 4: CALCULATE TIME
    // ================================
    const daysAvailable = calculateAvailableDays(
      diagnosticProfile?.exam_date,
      diagnosticProfile?.months_until_exam
    );

    // ================================
    // STEP 5: DETERMINE STUDENT TYPE
    // ================================
    const studentType = determineStudentType(studentProfile);
    const studentTypeLabels: Record<StudentType, { ru: string; en: string }> = {
      'fast_but_inattentive': { ru: 'Быстрый, но невнимательный', en: 'Fast but inattentive' },
      'slow_but_accurate': { ru: 'Медленный, но точный', en: 'Slow but accurate' },
      'motivated_but_anxious': { ru: 'Мотивированный, но тревожный', en: 'Motivated but anxious' },
      'low_motivation_but_capable': { ru: 'Низкая мотивация, но способный', en: 'Low motivation but capable' },
      'balanced_learner': { ru: 'Сбалансированный ученик', en: 'Balanced learner' },
    };

    // ================================
    // STEP 6: GENERATE WEEKLY PLAN
    // ================================
    const weeklyPlan = generateWeeklyPlan(categorizedTopics, studentProfile, daysAvailable, language);

    // ================================
    // STEP 7: BUILD DIAGNOSTIC SUMMARY
    // ================================
    const diagnosticSummary = {
      topicsAnalyzed: categorizedTopics.length,
      weakCount: weakTopics.length,
      mediumCount: mediumTopics.length,
      strongCount: strongTopics.length,
      overallMastery: avgMastery,
      daysUntilExam: daysAvailable,
    };

    // ================================
    // STEP 8: BUILD WEAKNESS ANALYSIS
    // ================================
    const weaknessAnalysis = weakTopics.map((t, idx) => ({
      rank: idx + 1,
      topic: t.topic,
      topicRu: t.topicRu,
      mastery: t.mastery,
      questionsAttempted: t.questionCount,
      recommendation: t.mastery < 30 
        ? (isRu ? 'Требует немедленного внимания' : 'Requires immediate attention')
        : (isRu ? 'Нужна дополнительная практика' : 'Needs additional practice'),
      isAssumed: t.isAssumed,
    }));

    // ================================
    // STEP 9: BUILD EXPLANATION
    // ================================
    let explanation = '';
    
    if (weakTopics.length > 0) {
      const weakNames = weakTopics.slice(0, 3).map(t => isRu ? t.topicRu : t.topic).join(', ');
      explanation = isRu
        ? `Ваш план построен на основе диагностики. Слабые темы (${weakNames}) имеют высокий приоритет и будут изучаться первыми. `
        : `Your plan is built from diagnostic data. Weak topics (${weakNames}) have high priority and will be studied first. `;
    } else if (mediumTopics.length > 0) {
      explanation = isRu
        ? `Вы хорошо справляетесь с большинством тем! План сфокусирован на закреплении средних тем. `
        : `You're doing well with most topics! Plan focuses on strengthening medium-level topics. `;
    } else {
      explanation = isRu
        ? `Отличные результаты! План включает только повторение для поддержания уровня. `
        : `Excellent results! Plan includes only review to maintain your level. `;
    }
    
    if (daysAvailable < 30) {
      explanation += isRu
        ? `Времени мало (${daysAvailable} дней), поэтому глубина изучения уменьшена, а не нагрузка увеличена.`
        : `Time is limited (${daysAvailable} days), so topic depth is reduced, not workload increased.`;
    } else {
      explanation += isRu
        ? `У вас достаточно времени (${daysAvailable} дней) для систематической подготовки.`
        : `You have enough time (${daysAvailable} days) for systematic preparation.`;
    }

    // ================================
    // STEP 10: FORMAT RESPONSE
    // ================================
    const formattedWeeklyPlan = weeklyPlan.map(day => ({
      day: day.day,
      dayName: day.dayName,
      topics: day.topics.map(t => ({
        name: isRu ? t.nameRu : t.name,
        time: `${t.timeMinutes} ${isRu ? 'мин' : 'min'}`,
        priority: t.priority,
      })),
      totalTime: `${day.totalTime} ${isRu ? 'мин' : 'min'}`,
      isRevision: day.isRevisionDay,
    }));

    // Calculate estimated current score
    const estimatedCurrentScore = Math.round(100 + avgMastery * 1.5);
    const safeTargetScore = toSafeInt(targetORTScore ?? diagnosticProfile?.target_ort_score, 170, 100, 250);

    const response = {
      // ================================
      // 1. DIAGNOSTIC SUMMARY
      // ================================
      diagnosticSummary,
      
      // ================================
      // 2. STUDENT PROFILE (STRUCTURED)
      // ================================
      studentProfile: {
        grade: studentProfile.grade,
        overallMathLevel: studentProfile.overallMathLevel,
        strongTopics: strongTopics.map(t => isRu ? t.topicRu : t.topic),
        mediumTopics: mediumTopics.map(t => isRu ? t.topicRu : t.topic),
        weakTopics: weakTopics.map(t => isRu ? t.topicRu : t.topic),
        dominantErrorType: studentProfile.dominantErrorType,
        learningStyle: studentProfile.learningStyle,
        confidenceLevel: studentProfile.confidence,
        studentType: {
          code: studentType,
          label: isRu ? studentTypeLabels[studentType].ru : studentTypeLabels[studentType].en,
        },
      },
      
      // ================================
      // 3. WEAKNESS ANALYSIS
      // ================================
      weaknessAnalysis,
      
      // ================================
      // 4. PERSONALIZED LEARNING PLAN
      // ================================
      explanation,
      weeklyPlan: formattedWeeklyPlan,
      weeklyCheckpoint: {
        improvement: weakTopics[0]?.topic || mediumTopics[0]?.topic || 'General skills',
        measurement: isRu ? 'Мини-тест в конце недели' : 'Mini-test at end of week',
      },
      topicBreakdown: {
        weak: weakTopics.map(t => ({ name: isRu ? t.topicRu : t.topic, mastery: t.mastery, isAssumed: t.isAssumed })),
        medium: mediumTopics.map(t => ({ name: isRu ? t.topicRu : t.topic, mastery: t.mastery, isAssumed: t.isAssumed })),
        strong: strongTopics.map(t => ({ name: isRu ? t.topicRu : t.topic, mastery: t.mastery, isAssumed: t.isAssumed })),
      },
      limitsApplied: {
        maxTimePerDay: `${MAX_STUDY_TIME_PER_DAY} ${isRu ? 'мин' : 'min'}`,
        maxTopicsPerDay: MAX_TOPICS_PER_DAY,
        revisionDays: isRu ? 'Каждую субботу' : 'Every Saturday',
      },
      
      // ================================
      // 5. ASSUMPTIONS & LIMITATIONS
      // ================================
      assumptions: assumptions.length > 0 ? assumptions : [
        isRu ? 'Все данные получены из диагностического теста' : 'All data derived from diagnostic test'
      ],
      limitations: [
        isRu ? 'План не включает видео-уроки (только текстовый формат)' : 'Plan does not include video lessons (text-based only)',
        isRu ? 'Мини-тесты генерируются динамически' : 'Mini-tests are generated dynamically',
      ],
      
      // ================================
      // DATABASE COMPATIBILITY FIELDS
      // ================================
      planData: { 
        generated: true, 
        version: 'v2-ort-30q-mapping',
        transparent: true,
        hasAssumptions: assumptions.length > 0,
      },
      schedule: {
        dailySchedule: weeklyPlan.reduce((acc, day) => {
          acc[day.dayName] = {
            topics: day.topics.map(t => isRu ? t.nameRu : t.name),
            duration: `${day.totalTime}min`,
            activities: day.isRevisionDay ? ['Revision', 'Mini-test'] : ['Study', 'Practice'],
          };
          return acc;
        }, {} as Record<string, any>),
      },
      targetTopics: weakTopics.concat(mediumTopics).slice(0, 10).map(t => ({
        topic: isRu ? t.topicRu : t.topic,
        currentMastery: t.mastery,
        targetMastery: 80,
        priority: t.status === 'weak' ? 'high' : 'medium',
      })),
      dailyTasks: weeklyPlan.slice(0, 7).map(day => ({
        day: day.day,
        focusTopic: day.topics[0] ? (isRu ? day.topics[0].nameRu : day.topics[0].name) : '',
        tasks: day.topics.map(t => isRu ? t.nameRu : t.name),
        estimatedTime: `${day.totalTime} ${isRu ? 'мин' : 'min'}`,
      })),
      miniTests: [{
        week: 1,
        day: 6,
        topic: isRu ? 'Недельный обзор' : 'Weekly review',
        questionCount: 10,
        purpose: isRu ? 'Проверка прогресса' : 'Progress check',
      }],
      predictedTimeline: {
        week1: {
          expectedMastery: toSafePercentInt(avgMastery + 10, 60),
          focusAreas: weakTopics.slice(0, 2).map(t => isRu ? t.topicRu : t.topic),
          milestone: isRu ? 'Основа' : 'Foundation',
        },
        week2: {
          expectedMastery: toSafePercentInt(avgMastery + 20, 70),
          focusAreas: weakTopics.slice(0, 3).map(t => isRu ? t.topicRu : t.topic),
          milestone: isRu ? 'Прогресс' : 'Progress',
        },
      },
      masteryGoals: {
        shortTerm: { 
          duration: isRu ? '1 неделя' : '1 week', 
          targetMastery: 50, 
          keyTopics: weakTopics.slice(0, 2).map(t => isRu ? t.topicRu : t.topic) 
        },
        mediumTerm: { 
          duration: isRu ? '2 недели' : '2 weeks', 
          targetMastery: 65, 
          keyTopics: weakTopics.slice(0, 3).map(t => isRu ? t.topicRu : t.topic) 
        },
        longTerm: { 
          duration: isRu ? '1 месяц' : '1 month', 
          targetMastery: 80, 
          keyTopics: categorizedTopics.slice(0, 5).map(t => isRu ? t.topicRu : t.topic) 
        },
      },
      ortScoreProjection: {
        current: estimatedCurrentScore,
        in2Weeks: Math.min(estimatedCurrentScore + 10, safeTargetScore),
        in1Month: Math.min(estimatedCurrentScore + 25, safeTargetScore),
        target: safeTargetScore,
      },
      learningStrategy: explanation,
    };

    console.log("Educational plan generated successfully with ORT 30-question mapping");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Learning plan error:", error);

    // ================================
    // FAIL-SAFE: NEVER REFUSE TO GENERATE
    // ================================
    const isRu = requestedLanguage === 'ru' || requestedLanguage === 'kg';
    
    // Generate a minimal but valid plan
    const defaultMastery = generateDefaultTopicMastery();
    const categorizedTopics = categorizeTopics(defaultMastery);
    const weakTopics = categorizedTopics.filter(t => t.status === 'weak');
    const mediumTopics = categorizedTopics.filter(t => t.status === 'medium');
    
    const safeFallback = {
      diagnosticSummary: {
        topicsAnalyzed: categorizedTopics.length,
        weakCount: weakTopics.length,
        mediumCount: mediumTopics.length,
        strongCount: 0,
        overallMastery: 50,
        daysUntilExam: 60,
      },
      studentProfile: {
        grade: '11',
        overallMathLevel: 'medium',
        strongTopics: [],
        mediumTopics: mediumTopics.slice(0, 5).map(t => isRu ? t.topicRu : t.topic),
        weakTopics: weakTopics.slice(0, 5).map(t => isRu ? t.topicRu : t.topic),
        dominantErrorType: 'conceptual',
        learningStyle: 'step-by-step',
        confidenceLevel: 'medium',
        studentType: {
          code: 'balanced_learner',
          label: isRu ? 'Сбалансированный ученик' : 'Balanced learner',
        },
      },
      weaknessAnalysis: weakTopics.slice(0, 5).map((t, idx) => ({
        rank: idx + 1,
        topic: t.topic,
        topicRu: t.topicRu,
        mastery: t.mastery,
        questionsAttempted: 0,
        recommendation: isRu ? 'Требует изучения' : 'Needs study',
        isAssumed: true,
      })),
      explanation: isRu 
        ? 'Возникла техническая ошибка, но план всё равно создан. Используются стандартные приоритеты тем.'
        : 'A technical error occurred, but the plan was still generated. Using standard topic priorities.',
      weeklyPlan: [
        {
          day: 1,
          dayName: isRu ? 'Пн' : 'Mon',
          topics: weakTopics.slice(0, 3).map(t => ({
            name: isRu ? t.topicRu : t.topic,
            time: '15 мин',
            priority: 'weak',
          })),
          totalTime: '45 мин',
          isRevision: false,
        },
      ],
      weeklyCheckpoint: {
        improvement: isRu ? 'Базовые операции' : 'Basic operations',
        measurement: isRu ? 'Мини-тест' : 'Mini-test',
      },
      topicBreakdown: {
        weak: weakTopics.slice(0, 5).map(t => ({ name: isRu ? t.topicRu : t.topic, mastery: t.mastery, isAssumed: true })),
        medium: mediumTopics.slice(0, 5).map(t => ({ name: isRu ? t.topicRu : t.topic, mastery: t.mastery, isAssumed: true })),
        strong: [],
      },
      limitsApplied: {
        maxTimePerDay: '45 мин',
        maxTopicsPerDay: 3,
        revisionDays: isRu ? 'Каждую субботу' : 'Every Saturday',
      },
      assumptions: [
        isRu ? 'Все данные предположены из-за технической ошибки' : 'All data assumed due to technical error',
      ],
      limitations: [
        isRu ? 'Возникла техническая ошибка при обработке данных' : 'Technical error occurred during processing',
      ],
      planData: { generated: true, version: 'v2-fallback', hasAssumptions: true },
      schedule: { dailySchedule: {} },
      targetTopics: weakTopics.slice(0, 5).map(t => ({
        topic: isRu ? t.topicRu : t.topic,
        currentMastery: t.mastery,
        targetMastery: 80,
        priority: 'high',
      })),
      dailyTasks: [],
      miniTests: [],
      predictedTimeline: {},
      masteryGoals: {},
      ortScoreProjection: { current: 150, in2Weeks: 160, in1Month: 175, target: 200 },
      learningStrategy: isRu 
        ? 'Базовый план с фокусом на основные темы математики.'
        : 'Basic plan focusing on core math topics.',
    };

    return new Response(JSON.stringify(safeFallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
