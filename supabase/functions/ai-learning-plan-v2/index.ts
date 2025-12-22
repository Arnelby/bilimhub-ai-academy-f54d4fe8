import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ================================
// MANDATORY LIMITS
// ================================
const MAX_STUDY_TIME_PER_DAY = 45; // minutes
const MAX_TOPICS_PER_DAY = 3;

// ================================
// MASTERY THRESHOLDS
// ================================
const STRONG_THRESHOLD = 80; // 80-100% = Strong → EXCLUDE from plan
const MEDIUM_THRESHOLD = 50; // 50-79% = Medium → Low priority
// 0-49% = Weak → High priority

// ================================
// TYPE DEFINITIONS
// ================================
interface TopicMastery {
  topic: string;
  mastery: number;
  status: 'strong' | 'medium' | 'weak';
  priority: number; // 1 = highest (weak), 3 = lowest (strong)
}

interface StudentProfile {
  grade?: string;
  motivation: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  pace: 'slow' | 'normal' | 'fast';
}

interface DayPlan {
  day: number;
  dayName: string;
  topics: { name: string; timeMinutes: number; priority: string }[];
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
// CATEGORIZATION LOGIC
// ================================
function categorizeTopics(topicMasteryData: Record<string, number>): TopicMastery[] {
  return Object.entries(topicMasteryData).map(([topic, mastery]) => {
    let status: 'strong' | 'medium' | 'weak';
    let priority: number;
    
    if (mastery >= STRONG_THRESHOLD) {
      status = 'strong';
      priority = 3; // Lowest priority - exclude
    } else if (mastery >= MEDIUM_THRESHOLD) {
      status = 'medium';
      priority = 2; // Low priority
    } else {
      status = 'weak';
      priority = 1; // High priority
    }
    
    return { topic, mastery: Math.round(mastery), status, priority };
  }).sort((a, b) => {
    // Sort by priority first (weak first), then by mastery (lowest first)
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.mastery - b.mastery;
  });
}

// ================================
// STUDENT TYPE (EDUCATIONAL ONLY)
// ================================
function determineStudentType(profile: StudentProfile): StudentType {
  const { motivation, confidence, pace } = profile;
  
  // Fast but inattentive: fast pace + high confidence + not high motivation
  if (pace === 'fast' && confidence === 'high' && motivation !== 'high') {
    return 'fast_but_inattentive';
  }
  
  // Slow but accurate: slow pace + not low confidence
  if (pace === 'slow' && confidence !== 'low') {
    return 'slow_but_accurate';
  }
  
  // Motivated but anxious: high motivation + low confidence
  if (motivation === 'high' && confidence === 'low') {
    return 'motivated_but_anxious';
  }
  
  // Low motivation but capable: low motivation + not low confidence
  if (motivation === 'low' && confidence !== 'low') {
    return 'low_motivation_but_capable';
  }
  
  return 'balanced_learner';
}

// ================================
// CALCULATE AVAILABLE DAYS
// ================================
function calculateAvailableDays(examDate: string | null): number {
  if (!examDate) return 60; // Default 60 days
  
  const today = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Clamp between 7 and 180 days
  return Math.max(7, Math.min(diffDays, 180));
}

// ================================
// ADJUST PACE BASED ON PROFILE
// ================================
function getTimePerTopic(profile: StudentProfile): number {
  // Slow learners: longer per topic, Fast: shorter
  switch (profile.pace) {
    case 'slow': return 20; // 20 min per topic
    case 'fast': return 12; // 12 min per topic
    default: return 15; // 15 min per topic
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
  const dayNames = language === 'ru' || language === 'kg' ? dayNamesRu : dayNamesEn;
  
  // Filter out strong topics - they don't need study
  const topicsToStudy = topics.filter(t => t.status !== 'strong');
  
  if (topicsToStudy.length === 0) {
    // All topics are strong - minimal maintenance plan
    return [{
      day: 1,
      dayName: dayNames[0],
      topics: [{ name: language === 'ru' ? 'Повторение' : 'Review', timeMinutes: 30, priority: 'revision' }],
      totalTime: 30,
      isRevisionDay: true,
    }];
  }
  
  const baseTimePerTopic = getTimePerTopic(profile);
  const weeksToGenerate = Math.min(Math.ceil(daysAvailable / 7), 4); // Max 4 weeks
  
  let topicCycleIndex = 0;
  
  for (let week = 0; week < weeksToGenerate; week++) {
    for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
      const dayNumber = week * 7 + dayInWeek + 1;
      if (dayNumber > daysAvailable) break;
      
      // Sunday (day 7, 14, 21...) is rest
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
      
      // Every 7th day (Saturday) is revision
      const isRevisionDay = dayInWeek === 5;
      
      const dayPlan: DayPlan = {
        day: dayNumber,
        dayName: dayNames[dayInWeek],
        topics: [],
        totalTime: 0,
        isRevisionDay,
      };
      
      if (isRevisionDay) {
        // Revision day: review weak topics briefly with mini-test
        const weakTopics = topicsToStudy.filter(t => t.status === 'weak').slice(0, 2);
        if (weakTopics.length > 0) {
          weakTopics.forEach(t => {
            dayPlan.topics.push({
              name: t.topic,
              timeMinutes: 15,
              priority: 'revision',
            });
            dayPlan.totalTime += 15;
          });
        } else {
          // No weak topics, review medium ones
          const mediumTopics = topicsToStudy.filter(t => t.status === 'medium').slice(0, 2);
          mediumTopics.forEach(t => {
            dayPlan.topics.push({
              name: t.topic,
              timeMinutes: 15,
              priority: 'revision',
            });
            dayPlan.totalTime += 15;
          });
        }
      } else {
        // Regular study day: max 3 topics, max 45 minutes total
        let remainingTime = MAX_STUDY_TIME_PER_DAY;
        let topicsAdded = 0;
        
        while (topicsAdded < MAX_TOPICS_PER_DAY && remainingTime >= baseTimePerTopic && topicsToStudy.length > 0) {
          const topic = topicsToStudy[topicCycleIndex % topicsToStudy.length];
          const timeForTopic = Math.min(baseTimePerTopic, remainingTime);
          
          // Don't add duplicate topics in same day
          if (!dayPlan.topics.some(t => t.name === topic.topic)) {
            dayPlan.topics.push({
              name: topic.topic,
              timeMinutes: timeForTopic,
              priority: topic.status,
            });
            
            dayPlan.totalTime += timeForTopic;
            remainingTime -= timeForTopic;
            topicsAdded++;
          }
          
          topicCycleIndex++;
          
          // Safety break
          if (topicCycleIndex > topicsToStudy.length * 3) break;
        }
      }
      
      plan.push(dayPlan);
    }
  }
  
  return plan;
}

// ================================
// CONSERVATIVE FALLBACK PLAN
// ================================
function generateConservativePlan(language: string): any {
  const isRu = language === 'ru' || language === 'kg';
  
  return {
    explanation: isRu 
      ? "Недостаточно данных для персонализации. Создан базовый план с акцентом на основные темы."
      : "Insufficient data for personalization. Created a basic plan focusing on core topics.",
    weeklyPlan: [
      {
        day: 1,
        dayName: isRu ? 'Пн' : 'Mon',
        topics: [
          { name: isRu ? 'Дроби' : 'Fractions', time: '15 мин' },
          { name: isRu ? 'Уравнения' : 'Equations', time: '15 мин' },
        ],
        totalTime: '30 мин',
        isRevision: false,
      },
      {
        day: 2,
        dayName: isRu ? 'Вт' : 'Tue',
        topics: [
          { name: isRu ? 'Проценты' : 'Percentages', time: '15 мин' },
          { name: isRu ? 'Степени' : 'Exponents', time: '15 мин' },
        ],
        totalTime: '30 мин',
        isRevision: false,
      },
    ],
    weeklyCheckpoint: {
      improvement: isRu ? 'Базовые операции с числами' : 'Basic number operations',
      measurement: isRu ? 'Мини-тест по пройденным темам' : 'Mini-test on covered topics',
    },
    assumptions: [
      isRu ? 'Использованы стандартные приоритеты тем' : 'Used standard topic priorities',
      isRu ? 'Время обучения: 30-45 минут в день' : 'Study time: 30-45 minutes per day',
    ],
    topicBreakdown: { weak: [], medium: [], strong: [] },
    limitsApplied: {
      maxTimePerDay: '45 мин',
      maxTopicsPerDay: 3,
      revisionDays: isRu ? 'Каждую субботу' : 'Every Saturday',
    },
  };
}

// ================================
// MAIN HANDLER
// ================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      diagnosticProfile,
      topicMastery,
      testHistory,
      targetORTScore,
      language = 'ru',
    } = await req.json();

    const isRu = language === 'ru' || language === 'kg';

    // ================================
    // STEP 1: EXTRACT TOPIC MASTERY
    // ================================
    let topicMasteryData: Record<string, number> = {};
    
    // From diagnostic profile topic performance
    if (diagnosticProfile?.topicPerformance) {
      Object.entries(diagnosticProfile.topicPerformance).forEach(([topic, data]: [string, any]) => {
        // Support both formats:
        // - { percentage: number }
        // - number
        topicMasteryData[topic] = typeof data === 'number' ? data : (data?.percentage || 0);
      });
    }
    
    // From topic progress table
    if (topicMastery && Array.isArray(topicMastery)) {
      topicMastery.forEach((tp: any) => {
        const topicName = tp.topic_id || tp.title || tp.topic;
        if (topicName) {
          topicMasteryData[topicName] = tp.progress_percentage || 0;
        }
      });
    }

    // From test history
    if (testHistory && Array.isArray(testHistory)) {
      const topicScores: Record<string, { correct: number; total: number }> = {};
      testHistory.forEach((test: any) => {
        const answers = test.answers || [];
        answers.forEach((a: any) => {
          const topic = a.topic || 'general';
          if (!topicScores[topic]) topicScores[topic] = { correct: 0, total: 0 };
          topicScores[topic].total += 1;
          if (a.correct) topicScores[topic].correct += 1;
        });
      });
      
      Object.entries(topicScores).forEach(([topic, scores]) => {
        if (scores.total > 0) {
          topicMasteryData[topic] = Math.round((scores.correct / scores.total) * 100);
        }
      });
    }

    // ================================
    // STEP 2: CHECK DATA SUFFICIENCY
    // ================================
    const hasData = Object.keys(topicMasteryData).length > 0;
    
    if (!hasData) {
      console.log("Insufficient data - returning conservative plan");
      return new Response(JSON.stringify(generateConservativePlan(language)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ================================
    // STEP 3: BUILD STUDENT PROFILE
    // ================================
    const profile: StudentProfile = {
      grade: diagnosticProfile?.grade_level || '11',
      motivation: diagnosticProfile?.motivation_type === 'high' || (diagnosticProfile?.confidence > 70) ? 'high' : 
                  diagnosticProfile?.motivation_type === 'low' || (diagnosticProfile?.confidence < 30) ? 'low' : 'medium',
      confidence: diagnosticProfile?.confidence > 70 ? 'high' :
                  diagnosticProfile?.confidence < 40 ? 'low' : 'medium',
      pace: diagnosticProfile?.speed_score > 70 ? 'fast' :
            diagnosticProfile?.speed_score < 40 ? 'slow' : 'normal',
    };

    // ================================
    // STEP 4: CATEGORIZE TOPICS
    // ================================
    const categorizedTopics = categorizeTopics(topicMasteryData);
    
    const weakTopics = categorizedTopics.filter(t => t.status === 'weak');
    const mediumTopics = categorizedTopics.filter(t => t.status === 'medium');
    const strongTopics = categorizedTopics.filter(t => t.status === 'strong');

    // ================================
    // STEP 5: CALCULATE TIME
    // ================================
    const daysAvailable = calculateAvailableDays(diagnosticProfile?.exam_date);

    // ================================
    // STEP 6: DETERMINE STUDENT TYPE
    // ================================
    const studentType = determineStudentType(profile);
    const studentTypeLabels: Record<StudentType, { ru: string; en: string }> = {
      'fast_but_inattentive': { ru: 'Быстрый, но невнимательный', en: 'Fast but inattentive' },
      'slow_but_accurate': { ru: 'Медленный, но точный', en: 'Slow but accurate' },
      'motivated_but_anxious': { ru: 'Мотивированный, но тревожный', en: 'Motivated but anxious' },
      'low_motivation_but_capable': { ru: 'Низкая мотивация, но способный', en: 'Low motivation but capable' },
      'balanced_learner': { ru: 'Сбалансированный ученик', en: 'Balanced learner' },
    };

    // ================================
    // STEP 7: GENERATE WEEKLY PLAN
    // ================================
    const weeklyPlan = generateWeeklyPlan(categorizedTopics, profile, daysAvailable, language);

    // ================================
    // STEP 8: BUILD EXPLANATION (2-3 sentences)
    // ================================
    let explanation = '';
    
    if (weakTopics.length > 0) {
      const weakNames = weakTopics.slice(0, 3).map(t => t.topic).join(', ');
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
    // STEP 9: WEEKLY CHECKPOINT
    // ================================
    const priorityTopic = weakTopics[0]?.topic || mediumTopics[0]?.topic || (isRu ? 'Общие навыки' : 'General skills');
    const weeklyCheckpoint = {
      improvement: priorityTopic,
      measurement: isRu ? 'Мини-тест в конце недели' : 'Mini-test at end of week',
    };

    // ================================
    // STEP 10: FORMAT RESPONSE
    // ================================
    const formattedWeeklyPlan = weeklyPlan.map(day => ({
      day: day.day,
      dayName: day.dayName,
      topics: day.topics.map(t => ({
        name: t.name,
        time: `${t.timeMinutes} ${isRu ? 'мин' : 'min'}`,
      })),
      totalTime: `${day.totalTime} ${isRu ? 'мин' : 'min'}`,
      isRevision: day.isRevisionDay,
    }));

    // Calculate estimated current score
    const avgMastery = categorizedTopics.length > 0 
      ? categorizedTopics.reduce((sum, t) => sum + t.mastery, 0) / categorizedTopics.length 
      : 50;
    const estimatedCurrentScore = Math.round(100 + avgMastery * 1.5);

    const response = {
      // How plan was built (2-3 sentences, simple language)
      explanation,
      
      // Weekly plan with day, topics (max 3), time per topic
      weeklyPlan: formattedWeeklyPlan,
      
      // Weekly checkpoint
      weeklyCheckpoint,
      
      // Topic breakdown for transparency
      topicBreakdown: {
        weak: weakTopics.map(t => ({ name: t.topic, mastery: t.mastery })),
        medium: mediumTopics.map(t => ({ name: t.topic, mastery: t.mastery })),
        strong: strongTopics.map(t => ({ name: t.topic, mastery: t.mastery })),
      },
      
      // Student type (educational only, not clinical)
      studentType: {
        code: studentType,
        label: isRu ? studentTypeLabels[studentType].ru : studentTypeLabels[studentType].en,
      },
      
      // Limits applied (transparency)
      limitsApplied: {
        maxTimePerDay: `${MAX_STUDY_TIME_PER_DAY} ${isRu ? 'мин' : 'min'}`,
        maxTopicsPerDay: MAX_TOPICS_PER_DAY,
        revisionDays: isRu ? 'Каждую субботу' : 'Every Saturday',
      },
      
      // Data used (transparency)
      dataUsed: {
        topicsAnalyzed: categorizedTopics.length,
        daysAvailable,
        hasExamDate: !!diagnosticProfile?.exam_date,
      },
      
      // ================================
      // DATABASE COMPATIBILITY FIELDS
      // ================================
      planData: { 
        generated: true, 
        version: 'v2-educational-rules',
        transparent: true,
      },
      schedule: {
        dailySchedule: weeklyPlan.reduce((acc, day) => {
          acc[day.dayName] = {
            topics: day.topics.map(t => t.name),
            duration: `${day.totalTime}min`,
            activities: day.isRevisionDay ? ['Revision', 'Mini-test'] : ['Study', 'Practice'],
          };
          return acc;
        }, {} as Record<string, any>),
      },
      targetTopics: weakTopics.concat(mediumTopics).slice(0, 10).map(t => ({
        topic: t.topic,
        currentMastery: t.mastery,
        targetMastery: 80,
        priority: t.status === 'weak' ? 'high' : 'medium',
      })),
      dailyTasks: weeklyPlan.slice(0, 7).map(day => ({
        day: day.day,
        focusTopic: day.topics[0]?.name || '',
        tasks: day.topics.map(t => t.name),
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
        week1: { expectedMastery: Math.min(avgMastery + 10, 100), focusAreas: weakTopics.slice(0, 2).map(t => t.topic), milestone: isRu ? 'Основа' : 'Foundation' },
        week2: { expectedMastery: Math.min(avgMastery + 20, 100), focusAreas: weakTopics.slice(0, 3).map(t => t.topic), milestone: isRu ? 'Прогресс' : 'Progress' },
      },
      masteryGoals: {
        shortTerm: { duration: isRu ? '1 неделя' : '1 week', targetMastery: 50, keyTopics: weakTopics.slice(0, 2).map(t => t.topic) },
        mediumTerm: { duration: isRu ? '2 недели' : '2 weeks', targetMastery: 65, keyTopics: weakTopics.slice(0, 3).map(t => t.topic) },
        longTerm: { duration: isRu ? '1 месяц' : '1 month', targetMastery: 80, keyTopics: categorizedTopics.slice(0, 5).map(t => t.topic) },
      },
      ortScoreProjection: {
        current: estimatedCurrentScore,
        in2Weeks: Math.min(estimatedCurrentScore + 10, targetORTScore || 200),
        in1Month: Math.min(estimatedCurrentScore + 25, targetORTScore || 200),
        target: targetORTScore || 200,
      },
      learningStrategy: explanation,
    };

    console.log("Educational plan generated with strict limits - no AI, fully deterministic");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Learning plan error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: generateConservativePlan('ru'),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
