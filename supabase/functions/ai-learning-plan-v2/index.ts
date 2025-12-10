import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default fallback plan when AI fails or no data available
function generateDefaultPlan(diagnosticProfile: any, language: string) {
  const targetORTScore = diagnosticProfile?.target_ort_score || 170;
  const monthsUntilExam = diagnosticProfile?.months_until_exam || 6;
  const mathLevel = diagnosticProfile?.math_level || 3;
  const learningStyle = diagnosticProfile?.learning_style || 'balanced';
  const weeksRemaining = monthsUntilExam * 4;
  const currentORTScore = Math.round(100 + (mathLevel * 20));
  const scoreGap = targetORTScore - currentORTScore;
  const hoursPerDay = scoreGap > 40 ? 3 : scoreGap > 20 ? 2.5 : 2;
  
  const topicNames = language === 'ru' 
    ? ['Арифметика', 'Алгебра', 'Геометрия', 'Проценты', 'Уравнения', 'Функции']
    : language === 'kg'
    ? ['Арифметика', 'Алгебра', 'Геометрия', 'Пайыздар', 'Теңдемелер', 'Функциялар']
    : ['Arithmetic', 'Algebra', 'Geometry', 'Percentages', 'Equations', 'Functions'];

  const weekDays = language === 'ru'
    ? ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
    : language === 'kg'
    ? ['дүйшөмбү', 'шейшемби', 'шаршемби', 'бейшемби', 'жума', 'ишемби', 'жекшемби']
    : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return {
    planData: {
      title: language === 'ru' 
        ? `Персональный план подготовки к ОРТ на ${targetORTScore}+ баллов`
        : language === 'kg'
        ? `ЖРТга даярдык планы ${targetORTScore}+ балл`
        : `Personalized ORT Plan for ${targetORTScore}+ Score`,
      createdFor: language === 'ru' ? 'Студент' : language === 'kg' ? 'Окуучу' : 'Student',
      totalDuration: language === 'ru' 
        ? `${weeksRemaining} недель`
        : language === 'kg'
        ? `${weeksRemaining} жума`
        : `${weeksRemaining} weeks`,
      intensity: scoreGap > 40 ? 'intensive' : scoreGap > 20 ? 'high' : 'moderate',
      basedOn: {
        diagnosticMathLevel: mathLevel,
        currentScore: currentORTScore,
        targetScore: targetORTScore,
        scoreGap: scoreGap,
        weakTopicsCount: 3
      }
    },
    schedule: {
      weeklyHours: Math.round(hoursPerDay * 6),
      dailyHours: hoursPerDay,
      dailySchedule: {
        [weekDays[0]]: { topics: [topicNames[0], topicNames[1]], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Теория + практика' : 'Theory + practice'] },
        [weekDays[1]]: { topics: [topicNames[2]], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Геометрические задачи' : 'Geometry problems'] },
        [weekDays[2]]: { topics: [topicNames[3], topicNames[4]], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Решение уравнений' : 'Solving equations'] },
        [weekDays[3]]: { topics: [topicNames[5]], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Анализ функций' : 'Function analysis'] },
        [weekDays[4]]: { topics: [topicNames[0], topicNames[1]], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Комплексные задачи' : 'Complex problems'] },
        [weekDays[5]]: { topics: [language === 'ru' ? 'Обзор + Тест' : 'Review + Test'], duration: `${hoursPerDay}h`, activities: [language === 'ru' ? 'Полный практический тест' : 'Full practice test'] },
        [weekDays[6]]: { topics: [], duration: '0h', activities: [language === 'ru' ? 'Отдых' : 'Rest'] }
      }
    },
    targetTopics: topicNames.slice(0, 4).map((topic, idx) => ({
      topic,
      currentMastery: 30 + idx * 10,
      targetMastery: 80,
      priority: idx === 0 ? 'high' : idx === 1 ? 'high' : 'medium',
      weeksToComplete: 2 + idx,
      basedOn: language === 'ru' ? 'Диагностический тест' : 'Diagnostic test'
    })),
    dailyTasks: [
      { day: 1, tasks: [language === 'ru' ? 'Изучить основы арифметики' : 'Study arithmetic basics', language === 'ru' ? 'Решить 10 задач' : 'Solve 10 problems'], estimatedTime: `${hoursPerDay}h`, focusTopic: topicNames[0] },
      { day: 2, tasks: [language === 'ru' ? 'Геометрические фигуры' : 'Geometric shapes', language === 'ru' ? 'Вычисление площадей' : 'Area calculations'], estimatedTime: `${hoursPerDay}h`, focusTopic: topicNames[2] },
      { day: 3, tasks: [language === 'ru' ? 'Линейные уравнения' : 'Linear equations', language === 'ru' ? 'Мини-тест' : 'Mini-test'], estimatedTime: `${hoursPerDay}h`, focusTopic: topicNames[4] }
    ],
    miniTests: [
      { week: 1, day: 3, topic: topicNames[0], questionCount: 5, purpose: language === 'ru' ? 'Проверка базовых навыков' : 'Basic skills check' },
      { week: 1, day: 6, topic: language === 'ru' ? 'Недельный обзор' : 'Weekly review', questionCount: 10, purpose: language === 'ru' ? 'Комплексная проверка' : 'Comprehensive check' }
    ],
    predictedTimeline: {
      week1: { expectedMastery: 35, expectedScore: currentORTScore + 5, focusAreas: [topicNames[0], topicNames[1]], milestone: language === 'ru' ? 'Основа' : 'Foundation' },
      [`week${Math.ceil(weeksRemaining/2)}`]: { expectedMastery: 60, expectedScore: currentORTScore + Math.round(scoreGap/2), focusAreas: [topicNames[2], topicNames[3]], milestone: language === 'ru' ? 'Половина пути' : 'Halfway' },
      [`week${weeksRemaining}`]: { expectedMastery: 85, expectedScore: targetORTScore, focusAreas: topicNames, milestone: language === 'ru' ? 'Цель достигнута' : 'Goal reached' }
    },
    masteryGoals: {
      shortTerm: { duration: language === 'ru' ? '2 недели' : '2 weeks', targetScore: currentORTScore + 10, keyTopics: [topicNames[0], topicNames[1]] },
      mediumTerm: { duration: language === 'ru' ? `${Math.ceil(weeksRemaining/2)} недель` : `${Math.ceil(weeksRemaining/2)} weeks`, targetScore: currentORTScore + Math.round(scoreGap/2), keyTopics: [topicNames[2], topicNames[3]] },
      longTerm: { duration: language === 'ru' ? `${weeksRemaining} недель` : `${weeksRemaining} weeks`, targetScore: targetORTScore, keyTopics: topicNames }
    },
    ortScoreProjection: {
      current: currentORTScore,
      in2Weeks: currentORTScore + 10,
      in1Month: currentORTScore + 20,
      final: targetORTScore,
      confidence: scoreGap < 30 ? 'high' : scoreGap < 50 ? 'medium' : 'challenging',
      factors: [
        language === 'ru' ? `Уровень математики: ${mathLevel}/5` : `Math level: ${mathLevel}/5`,
        language === 'ru' ? `${weeksRemaining} недель подготовки` : `${weeksRemaining} weeks of preparation`
      ]
    },
    learningStrategy: language === 'ru'
      ? `Стратегия адаптирована под ${learningStyle === 'visual' ? 'визуальный' : learningStyle === 'auditory' ? 'аудиальный' : 'сбалансированный'} стиль обучения с ${hoursPerDay} часами занятий ежедневно`
      : `Strategy adapted for ${learningStyle} learning style with ${hoursPerDay}h daily commitment`,
    adaptations: {
      forLearningStyle: language === 'ru'
        ? `Контент оптимизирован для ${learningStyle === 'visual' ? 'визуального' : 'вашего'} восприятия`
        : `Content optimized for ${learningStyle} learners`,
      forPsychology: language === 'ru'
        ? 'Регулярные перерывы и разнообразие задач'
        : 'Regular breaks and varied tasks',
      forMotivation: language === 'ru'
        ? 'Еженедельные достижения и отслеживание прогресса'
        : 'Weekly achievements and progress tracking'
    },
    warnings: scoreGap > 50 
      ? [language === 'ru' ? 'Большой разрыв в баллах требует интенсивной подготовки' : 'Large score gap requires intensive preparation']
      : [],
    motivationalMilestones: [
      { week: 2, reward: '🎉', achievement: language === 'ru' ? 'Первое улучшение результата!' : 'First score improvement!' },
      { week: Math.ceil(weeksRemaining/2), reward: '🏆', achievement: language === 'ru' ? 'Половина пути пройдена!' : 'Halfway milestone reached!' }
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      testHistory = [], 
      lessonProgress = [], 
      topicMastery = [], 
      diagnosticProfile = {},
      language = 'ru' 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.log("LOVABLE_API_KEY not configured, using fallback plan");
      const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
      return new Response(JSON.stringify(fallbackPlan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract key information from diagnostic profile with safe defaults
    const targetORTScore = diagnosticProfile?.target_ort_score || 170;
    const examDate = diagnosticProfile?.exam_date;
    const monthsUntilExam = diagnosticProfile?.months_until_exam || 6;
    const gradeLevel = diagnosticProfile?.grade_level || 'unknown';
    const mathLevel = diagnosticProfile?.math_level || 3;
    const learningStyle = diagnosticProfile?.learning_style || 'balanced';
    
    // Calculate time remaining
    let weeksRemaining = Math.max(4, monthsUntilExam * 4);
    if (examDate) {
      const examDateObj = new Date(examDate);
      const now = new Date();
      const diffMs = examDateObj.getTime() - now.getTime();
      weeksRemaining = Math.max(4, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
    }

    // Calculate current estimated ORT score from diagnostic
    const currentORTScore = Math.round(100 + (mathLevel * 20) + (diagnosticProfile?.accuracy_score || 50) * 0.5);
    const scoreGap = Math.max(0, targetORTScore - currentORTScore);
    
    // Calculate required intensity based on score gap and time
    const pointsPerWeek = weeksRemaining > 0 ? scoreGap / weeksRemaining : 5;
    let intensity = 'moderate';
    let hoursPerDay = 2;
    if (pointsPerWeek > 5) {
      intensity = 'intensive';
      hoursPerDay = 3;
    } else if (pointsPerWeek > 3) {
      intensity = 'high';
      hoursPerDay = 2.5;
    } else if (pointsPerWeek < 1) {
      intensity = 'relaxed';
      hoursPerDay = 1.5;
    }

    // Build topic mastery map for AI (handle empty data)
    const topicMasteryMap = (topicMastery || []).reduce((acc: any, t: any) => {
      acc[t.topic_id || t.title || 'unknown'] = {
        mastery: t.progress_percentage || 0,
        level: t.mastery || 'not_attempted'
      };
      return acc;
    }, {});

    // Analyze test history for weak topics (handle empty data)
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    (testHistory || []).forEach((test: any) => {
      const answers = test.answers || [];
      answers.forEach((a: any) => {
        const topic = a.topic || 'general';
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
        }
        topicPerformance[topic].total += 1;
        if (a.correct) topicPerformance[topic].correct += 1;
      });
    });

    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.total > 0 && (perf.correct / perf.total) < 0.6)
      .map(([topic, perf]) => ({
        topic,
        accuracy: Math.round((perf.correct / perf.total) * 100),
        questionsAttempted: perf.total
      }));

    // For new users with no data, provide assumed weak topics
    const hasLimitedData = testHistory.length === 0 && lessonProgress.length === 0;
    const assumedWeakTopics = hasLimitedData ? [
      { topic: 'algebra', accuracy: 50, questionsAttempted: 0 },
      { topic: 'geometry', accuracy: 50, questionsAttempted: 0 },
      { topic: 'percentages', accuracy: 50, questionsAttempted: 0 }
    ] : [];

    const languageInstructions = {
      ru: "Respond entirely in Russian. All text, topic names, descriptions, and recommendations must be in Russian.",
      kg: "Respond entirely in Kyrgyz language. All text, topic names, descriptions, and recommendations must be in Kyrgyz.",
      en: "Respond entirely in English."
    };

    const prompt = `You are an expert ORT exam preparation AI creating a STRICTLY DATA-DRIVEN personalized learning plan.

${hasLimitedData ? 'NOTE: This is a NEW USER with limited data. Create a comprehensive starter plan based on their diagnostic test results and goals. Make reasonable assumptions for topic mastery based on their math level.' : 'CRITICAL: This plan must be based ONLY on the diagnostic data provided. No generic templates. Every recommendation must trace back to specific data points.'}

=== STUDENT DIAGNOSTIC DATA ===

CURRENT LEVEL:
- Math Level: ${mathLevel}/5
- Logic Score: ${diagnosticProfile?.logic_score || 50}/100
- Problem Solving: ${diagnosticProfile?.problem_solving_score || 50}/100
- Speed Score: ${diagnosticProfile?.speed_score || 50}/100
- Accuracy Score: ${diagnosticProfile?.accuracy_score || 50}/100
${hasLimitedData ? '- Status: NEW USER - plan should focus on establishing baseline and building fundamentals' : ''}

GOALS:
- Target ORT Score: ${targetORTScore}
- Current Estimated Score: ${currentORTScore}
- Score Gap to Close: ${scoreGap} points
- Exam Date: ${examDate || 'Not specified'}
- Months Until Exam: ${monthsUntilExam}
- Weeks Remaining: ${weeksRemaining}
- Grade Level: ${gradeLevel}
- Required Intensity: ${intensity} (${hoursPerDay}h/day)
- Points to Gain Per Week: ${pointsPerWeek.toFixed(1)}

LEARNING PROFILE:
- Dominant Learning Style: ${learningStyle}
- Visual Preference: ${diagnosticProfile?.visual_preference || 50}%
- Auditory Preference: ${diagnosticProfile?.auditory_preference || 50}%
- Text Preference: ${diagnosticProfile?.text_preference || 50}%
- Example Preference: ${diagnosticProfile?.example_preference || 50}%
- Problem-Driven Preference: ${diagnosticProfile?.problem_driven_preference || 50}%
- Step-by-Step Preference: ${diagnosticProfile?.step_by_step_preference || 50}%

PSYCHOLOGICAL PROFILE:
- Attention Level: ${diagnosticProfile?.attention_level || 50}%
- Stress Resistance: ${diagnosticProfile?.stress_resistance || 50}%
- Impulsiveness: ${diagnosticProfile?.impulsiveness || 50}%
- Consistency: ${diagnosticProfile?.consistency || 50}%
- Patience: ${diagnosticProfile?.patience || 50}%
- Confidence: ${diagnosticProfile?.confidence || 50}%
- Motivation Type: ${diagnosticProfile?.motivation_type || 'balanced'}

LEARNING PREFERENCES:
- Prefers Short Lessons: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Prefers Examples: ${diagnosticProfile?.prefers_examples ?? true}
- Prefers Quizzes: ${diagnosticProfile?.prefers_quizzes ?? true}
- Prefers Step-by-Step: ${diagnosticProfile?.prefers_step_by_step ?? true}

${Object.keys(topicMasteryMap).length > 0 ? `TOPIC MASTERY MAP:\n${JSON.stringify(topicMasteryMap, null, 2)}` : 'TOPIC MASTERY MAP: No prior data - assume baseline levels based on math level'}

WEAK TOPICS FROM DATA:
${weakTopics.length > 0 ? JSON.stringify(weakTopics, null, 2) : hasLimitedData ? JSON.stringify(assumedWeakTopics, null, 2) : '[]'}

=== PLAN REQUIREMENTS ===

1. TIMELINE: Create a ${weeksRemaining}-week plan with ${intensity} intensity
2. FOCUS: Prioritize weak topics identified in the data
3. ADAPT: Match lesson format to learning style (${learningStyle})
4. PSYCHOLOGY: Account for ${diagnosticProfile?.attention_level || 50}% attention span and ${diagnosticProfile?.stress_resistance || 50}% stress resistance
5. GOAL: Achieve ${targetORTScore}+ ORT score from current ${currentORTScore}
${hasLimitedData ? '6. NEW USER: Start with comprehensive fundamentals review before advancing to complex topics' : ''}

Generate a comprehensive plan in this exact JSON format:
{
  "planData": {
    "title": "Personalized ORT Plan for ${targetORTScore}+ Score",
    "createdFor": "Student",
    "totalDuration": "${weeksRemaining} weeks",
    "intensity": "${intensity}",
    "basedOn": {
      "diagnosticMathLevel": ${mathLevel},
      "currentScore": ${currentORTScore},
      "targetScore": ${targetORTScore},
      "scoreGap": ${scoreGap},
      "weakTopicsCount": ${weakTopics.length || assumedWeakTopics.length}
    }
  },
  "schedule": {
    "weeklyHours": ${Math.round(hoursPerDay * 6)},
    "dailyHours": ${hoursPerDay},
    "dailySchedule": {
      "monday": {"topics": ["Priority topic based on weakness"], "duration": "${hoursPerDay}h", "activities": ["Adapted to learning style"]},
      "tuesday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "wednesday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "thursday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "friday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "saturday": {"topics": ["Review + Test"], "duration": "${hoursPerDay}h", "activities": ["Full practice test"]},
      "sunday": {"topics": [], "duration": "0h", "activities": ["Rest"]}
    }
  },
  "targetTopics": [
    {"topic": "Topic from weak areas", "currentMastery": 30, "targetMastery": 80, "priority": "high", "weeksToComplete": 2, "basedOn": "diagnostic accuracy X%"}
  ],
  "dailyTasks": [
    {"day": 1, "tasks": ["Specific tasks based on profile"], "estimatedTime": "${hoursPerDay}h", "focusTopic": "Weakest topic"}
  ],
  "miniTests": [
    {"week": 1, "day": 3, "topic": "Topic", "questionCount": 5, "purpose": "Verify improvement in weak area"}
  ],
  "predictedTimeline": {
    "week1": {"expectedMastery": X, "expectedScore": ${currentORTScore + Math.round(pointsPerWeek)}, "focusAreas": ["..."], "milestone": "Foundation"},
    "week${Math.ceil(weeksRemaining/2)}": {"expectedMastery": X, "expectedScore": ${currentORTScore + Math.round(scoreGap/2)}, "focusAreas": ["..."], "milestone": "Halfway"},
    "week${weeksRemaining}": {"expectedMastery": X, "expectedScore": ${targetORTScore}, "focusAreas": ["..."], "milestone": "Goal reached"}
  },
  "masteryGoals": {
    "shortTerm": {"duration": "2 weeks", "targetScore": ${currentORTScore + Math.round(pointsPerWeek * 2)}, "keyTopics": ["From weak topics"]},
    "mediumTerm": {"duration": "${Math.ceil(weeksRemaining/2)} weeks", "targetScore": ${currentORTScore + Math.round(scoreGap/2)}, "keyTopics": ["..."]},
    "longTerm": {"duration": "${weeksRemaining} weeks", "targetScore": ${targetORTScore}, "keyTopics": ["All topics mastered"]}
  },
  "ortScoreProjection": {
    "current": ${currentORTScore},
    "in2Weeks": ${currentORTScore + Math.round(pointsPerWeek * 2)},
    "in1Month": ${currentORTScore + Math.round(pointsPerWeek * 4)},
    "final": ${targetORTScore},
    "confidence": "${scoreGap < 30 ? 'high' : scoreGap < 50 ? 'medium' : 'challenging'}",
    "factors": ["Based on diagnostic math level ${mathLevel}", "Account for ${weeksRemaining} weeks prep time"]
  },
  "learningStrategy": "Detailed strategy matching ${learningStyle} learning style with ${hoursPerDay}h daily commitment",
  "adaptations": {
    "forLearningStyle": "Specific adaptations for ${learningStyle} learner",
    "forPsychology": "Account for ${diagnosticProfile?.attention_level || 50}% attention, ${diagnosticProfile?.stress_resistance || 50}% stress resistance",
    "forMotivation": "Tailored for ${diagnosticProfile?.motivation_type || 'balanced'} motivation type"
  },
  "warnings": ["Any concerns based on the data - time constraints, large score gap, etc."],
  "motivationalMilestones": [
    {"week": 2, "reward": "Celebration", "achievement": "First score improvement verified"}
  ]
}

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}

CRITICAL: Every number and recommendation must be calculated from the diagnostic data provided. No placeholder values. Return ONLY valid JSON, no markdown code blocks.`;

    console.log("Generating data-driven learning plan...");
    console.log(`Target: ${targetORTScore}, Current: ${currentORTScore}, Gap: ${scoreGap}, Weeks: ${weeksRemaining}, HasLimitedData: ${hasLimitedData}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert ORT exam preparation AI. Create strictly data-driven, personalized learning plans. Always respond with valid JSON only, no markdown code blocks. Every recommendation must be based on the specific diagnostic data provided." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI learning plan error:", response.status, errorText);
      
      if (response.status === 429) {
        console.log("Rate limited, using fallback plan");
        const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
        return new Response(JSON.stringify(fallbackPlan), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.log("Credits exhausted, using fallback plan");
        const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
        return new Response(JSON.stringify(fallbackPlan), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // For any other error, use fallback
      console.log("AI error, using fallback plan");
      const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
      return new Response(JSON.stringify(fallbackPlan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log("No content from AI, using fallback plan");
      const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
      return new Response(JSON.stringify(fallbackPlan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    try {
      // Try to parse JSON, handling various formats
      let learningPlan;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      
      if (jsonMatch) {
        learningPlan = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the content directly
        const cleanContent = content.trim();
        learningPlan = JSON.parse(cleanContent);
      }

      console.log("Data-driven learning plan generated successfully");

      return new Response(JSON.stringify(learningPlan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response, using fallback:", parseError);
      const fallbackPlan = generateDefaultPlan(diagnosticProfile, language);
      return new Response(JSON.stringify(fallbackPlan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Learning plan error:", error);
    // Always return a valid plan, never an error
    const fallbackPlan = generateDefaultPlan({}, 'ru');
    return new Response(JSON.stringify(fallbackPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});