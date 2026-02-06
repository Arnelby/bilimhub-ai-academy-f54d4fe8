import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// AI ORCHESTRATOR
// Одна функция вместо 17+ запросов
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      diagnosticProfile,      // Результаты диагностического теста
      personalityTest,        // Результаты психологического теста
      goals,                  // Цели студента
      progress,               // Текущий прогресс
      availableTopics,        // Темы из базы данных
      language = 'ru'
    } = await req.json();
    
    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    
    if (!GROK_API_KEY) {
      throw new Error("GROK_API_KEY is not configured");
    }

    console.log("AI Orchestrator: processing comprehensive learning plan");

    // ============================================
    // ПОСТРОИТЬ КОНТЕКСТ ДЛЯ ИИ
    // ============================================
    
    // 1. Анализ диагностики
    const topicMastery = diagnosticProfile?.topicPerformance || diagnosticProfile?.topic_mastery || {};
    const weakTopics = Object.entries(topicMastery)
      .filter(([_, data]: [string, any]) => (data.percentage || data.mastery || 0) < 50)
      .sort((a: any, b: any) => (a[1].percentage || 0) - (b[1].percentage || 0))
      .map(([topic, data]: [string, any]) => ({
        topic,
        mastery: data.percentage || data.mastery || 0,
        questionCount: data.total || data.questionCount || 0
      }));

    const strongTopics = Object.entries(topicMastery)
      .filter(([_, data]: [string, any]) => (data.percentage || data.mastery || 0) >= 80)
      .map(([topic, data]: [string, any]) => ({
        topic,
        mastery: data.percentage || data.mastery || 0
      }));

    // 2. Психотип студента
    const perceptionType = personalityTest?.perception_type || 'text';
    const learningTempo = personalityTest?.learning_tempo || 'medium';
    const thinkingStyle = personalityTest?.thinking_style || 'step-by-step';

    // 3. Цели и временные рамки
    const targetScore = goals?.targetScore || diagnosticProfile?.target_ort_score || 180;
    const examDate = goals?.examDate || diagnosticProfile?.exam_date;
    const grade = goals?.grade || diagnosticProfile?.grade_level || 11;
    
    const daysUntilExam = examDate 
      ? Math.max(7, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 60;

    // 4. Текущий прогресс
    const currentScore = diagnosticProfile?.estimated_ort_score || 
                        (diagnosticProfile?.overall_accuracy ? 100 + diagnosticProfile.overall_accuracy * 1.5 : 150);
    const scoreGap = targetScore - currentScore;

    // ============================================
    // МОЩНЫЙ ORCHESTRATION PROMPT
    // ============================================
    
    const systemPrompt = `Ты — AI-репетитор BilimHub, эксперт по подготовке к ОРТ в Кыргызстане.

ТВОЯ ЗАДАЧА:
Создать ОДИН структурированный, персонализированный учебный план для студента на основе ВСЕХ данных.

КОНТЕКСТ СТУДЕНТА:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ДИАГНОСТИКА:
- Слабые темы (${weakTopics.length}): ${weakTopics.slice(0, 5).map(t => `${t.topic} (${t.mastery}%)`).join(', ')}
- Сильные темы (${strongTopics.length}): ${strongTopics.slice(0, 3).map(t => t.topic).join(', ')}
- Общая точность: ${diagnosticProfile?.overall_accuracy || 50}%

🧠 ПСИХОТИП:
- Восприятие: ${perceptionType} (visual/auditory/text/practical/adhd_friendly)
- Темп: ${learningTempo} (fast/medium/slow)
- Мышление: ${thinkingStyle} (logical/intuitive/step-by-step)

🎯 ЦЕЛИ:
- Текущий балл ОРТ: ~${currentScore}
- Целевой балл: ${targetScore}
- Разрыв: ${scoreGap} баллов
- Класс: ${grade}
- Дней до экзамена: ${daysUntilExam}

📚 ДОСТУПНЫЕ ТЕМЫ:
${(availableTopics || []).join(', ') || 'Все темы ОРТ математики'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
1. ✅ Фокус на СЛАБЫХ темах (приоритет №1)
2. ✅ Адаптация под психотип (${perceptionType}, ${thinkingStyle})
3. ✅ Реалистичные сроки (${daysUntilExam} дней)
4. ✅ Постепенное увеличение нагрузки
5. ✅ НЕ придумывай темы, используй ТОЛЬКО из доступных
6. ✅ Учитывай разрыв в ${scoreGap} баллов

АДАПТАЦИЯ ПОД ПСИХОТИП:
${perceptionType === 'visual' ? '- Используй диаграммы, схемы, визуальные объяснения' : ''}
${perceptionType === 'auditory' ? '- Рекомендуй аудио-объяснения, проговаривание вслух' : ''}
${perceptionType === 'text' ? '- Детальные текстовые объяснения, конспекты' : ''}
${perceptionType === 'practical' ? '- Практические задачи, минимум теории' : ''}
${perceptionType === 'adhd_friendly' ? '- Короткие сессии (10-15 мин), частые перерывы' : ''}
${learningTempo === 'fast' ? '- Быстрый темп, сложные задачи, минимум повторений' : ''}
${learningTempo === 'slow' ? '- Медленный темп, больше повторений, пошаговые объяснения' : ''}
${thinkingStyle === 'logical' ? '- Логические связи, доказательства, формулы' : ''}
${thinkingStyle === 'intuitive' ? '- Интуитивные объяснения, аналогии, примеры из жизни' : ''}
${thinkingStyle === 'step-by-step' ? '- Пошаговые инструкции, четкая последовательность' : ''}

ЯЗЫК: ${language === 'kg' ? 'Кыргызский' : language === 'ru' ? 'Русский' : 'English'}

ВЕРНИ JSON:
{
  "learningPlan": {
    "overview": "Краткое описание плана (2-3 предложения)",
    "strategy": "Стратегия обучения под психотип",
    "weeklyPlan": [
      {
        "week": 1,
        "goal": "Цель недели",
        "topics": ["Тема 1", "Тема 2"],
        "hoursPerDay": 2,
        "expectedProgress": "+10%"
      }
    ],
    "dailySchedule": {
      "monday": { "topics": [...], "duration": "30 min", "activities": [...] },
      "tuesday": { "topics": [...], "duration": "30 min", "activities": [...] }
    }
  },
  "weakTopicsAnalysis": [
    {
      "topic": "Тема",
      "currentMastery": 30,
      "targetMastery": 70,
      "priority": "critical",
      "estimatedTime": "5 дней",
      "reason": "Почему критично",
      "studyApproach": "Как изучать под психотип"
    }
  ],
  "recommendations": {
    "startWith": "С какой темы начать",
    "focusAreas": ["Тема 1", "Тема 2", "Тема 3"],
    "avoidFor": ["Что пока не трогать"],
    "studyTips": ["Совет 1", "Совет 2"],
    "personalizedMessage": "Мотивационное сообщение для студента"
  },
  "timeline": {
    "week1": { "mastery": 55, "milestone": "Основы" },
    "week2": { "mastery": 65, "milestone": "Прогресс" },
    "week4": { "mastery": 75, "milestone": "Уверенность" },
    "examDay": { "expectedScore": ${Math.min(currentScore + scoreGap * 0.8, targetScore)} }
  },
  "nextSteps": [
    { "step": 1, "action": "Действие 1", "duration": "30 min" },
    { "step": 2, "action": "Действие 2", "duration": "45 min" }
  ]
}`;

    const userPrompt = `Создай персонализированный учебный план для этого студента.

ПОЛНЫЕ ДАННЫЕ:
${JSON.stringify({
  diagnosticProfile,
  personalityTest,
  goals,
  topicMastery,
  weakTopics,
  strongTopics,
  currentScore,
  targetScore,
  daysUntilExam
}, null, 2)}

Верни ТОЛЬКО валидный JSON, без дополнительного текста.`;

    // ============================================
    // ОДИН ЗАПРОС К GROK
    // ============================================
    
    console.log(`Calling Grok with context: ${weakTopics.length} weak, ${strongTopics.length} strong, ${daysUntilExam} days`);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error:", response.status, errorText);
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in Grok response");
    }

    // ============================================
    // ПАРСИНГ ОТВЕТА
    // ============================================
    
    let orchestratedPlan;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      orchestratedPlan = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse Grok response");
    }

    // ============================================
    // ДОБАВИТЬ МЕТАДАННЫЕ
    // ============================================
    
    orchestratedPlan.metadata = {
      generatedAt: new Date().toISOString(),
      apiVersion: "orchestrator-v1",
      model: "grok-beta",
      psychotype: { perceptionType, learningTempo, thinkingStyle },
      scoreProjection: {
        current: currentScore,
        target: targetScore,
        gap: scoreGap,
        daysRemaining: daysUntilExam
      }
    };

    console.log("AI Orchestrator: comprehensive plan generated successfully");

    return new Response(JSON.stringify(orchestratedPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Orchestrator error:", error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: {
        learningPlan: {
          overview: "Возникла техническая ошибка, но базовый план создан.",
          strategy: "Сфокусируйся на слабых темах, постепенно увеличивай нагрузку.",
          weeklyPlan: []
        },
        weakTopicsAnalysis: [],
        recommendations: {
          startWith: "Проверь подключение к интернету и попробуй снова",
          focusAreas: [],
          studyTips: ["Не волнуйся, система работает в фоновом режиме"]
        }
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
