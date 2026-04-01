import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed 30-question ORT topic mapping
const ORT_QUESTION_TOPIC_MAP: Record<number, string> = {
  1: 'Десятичные дроби',
  2: 'Десятичные дроби',
  3: 'Степени',
  4: 'Операции с дробями',
  5: 'Простые уравнения',
  6: 'Порядок действий',
  7: 'Дроби',
  8: 'Углы треугольника',
  9: 'Операции с дробями',
  10: 'Квадратный корень',
  11: 'Углы и логика',
  12: 'Координаты',
  13: 'Неравенства',
  14: 'Сравнение величин',
  15: 'Функции',
  16: 'Проценты',
  17: 'Прогрессии',
  18: 'Базовая арифметика',
  19: 'Степени',
  20: 'Модуль числа',
  21: 'Пропорции',
  22: 'Треугольники',
  23: 'Сумма углов',
  24: 'Степени',
  25: 'Область чисел',
  26: 'Трапеция',
  27: 'Степени',
  28: 'Прямоугольники',
  29: 'Логика',
  30: 'Стереометрия',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { diagnosticAnswers, language } = body;

    // HARD VALIDATION: no diagnostic data → error
    if (!Array.isArray(diagnosticAnswers) || diagnosticAnswers.length === 0) {
      return new Response(JSON.stringify({
        error: "Недостаточно данных. Пройди диагностический тест заново."
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate per-topic accuracy
    const topicStats: Record<string, { correct: number; total: number }> = {};

    for (const answer of diagnosticAnswers) {
      const qNum = typeof answer.questionId === 'string'
        ? parseInt(answer.questionId.replace(/\D/g, ''), 10)
        : answer.questionId;

      const topic = ORT_QUESTION_TOPIC_MAP[qNum] || answer.topic;
      if (!topic) continue;

      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total += 1;
      if (answer.isCorrect) topicStats[topic].correct += 1;
    }

    const topics = Object.keys(topicStats);
    if (topics.length === 0) {
      return new Response(JSON.stringify({
        error: "Недостаточно данных. Пройди диагностический тест заново."
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Overall accuracy
    let totalCorrect = 0;
    let totalQuestions = 0;
    for (const s of Object.values(topicStats)) {
      totalCorrect += s.correct;
      totalQuestions += s.total;
    }
    const overallAccuracy = Math.round((totalCorrect / totalQuestions) * 100);

    // Categorize topics
    const weakTopics: { topic: string; accuracy: number }[] = [];
    const strongTopics: { topic: string; accuracy: number }[] = [];

    for (const [topic, stats] of Object.entries(topicStats)) {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      if (accuracy < 60) {
        weakTopics.push({ topic, accuracy });
      } else if (accuracy >= 80) {
        strongTopics.push({ topic, accuracy });
      }
    }

    // Sort weak topics by accuracy ascending (worst first)
    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    strongTopics.sort((a, b) => b.accuracy - a.accuracy);

    // If no weak topics
    if (weakTopics.length === 0) {
      return new Response(JSON.stringify({
        diagnostic: { overallAccuracy, weakTopics: [], strongTopics },
        plan: {
          summary: "Ошибок не найдено. Пройди более сложный тест.",
          focusTopics: [],
          actions: [],
        },
        tasks: [],
        cta: { text: "Пройти сложный тест", action: "go_to_tests" },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate tasks using AI for weak topics only
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const weakTopicNames = weakTopics.map(t => t.topic);

    const prompt = `Ты — помощник по подготовке к ОРТ (Кыргызстан). 

Студент прошёл диагностический тест. Вот его слабые темы:
${weakTopics.map(t => `- ${t.topic}: ${t.accuracy}%`).join('\n')}

Для КАЖДОЙ слабой темы сгенерируй 3–5 задач в формате ОРТ (тестовые вопросы с вариантами ответов).
Также напиши краткую стратегию (2–3 предложения) что делать.

Ответь СТРОГО в JSON:
{
  "plan": {
    "summary": "краткое описание плана",
    "focusTopics": [список слабых тем],
    "actions": ["действие 1", "действие 2", "действие 3"]
  },
  "tasks": [
    {
      "topic": "название темы",
      "problems": ["задача 1", "задача 2", "задача 3"]
    }
  ]
}

НЕ придумывай темы. Используй ТОЛЬКО темы из списка выше.
Задачи должны быть в стиле ОРТ — реалистичные, с числами.
${language === 'kg' ? 'Отвечай на кыргызском языке.' : language === 'en' ? 'Respond in English.' : 'Отвечай на русском языке.'}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты генерируешь учебные задачи для ОРТ. Отвечай только валидным JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    let planData = {
      summary: `У тебя ${weakTopics.length} слабых тем. Сосредоточься на них.`,
      focusTopics: weakTopicNames,
      actions: weakTopicNames.map(t => `Повтори тему "${t}" и реши 5 задач`),
    };
    let tasks: { topic: string; problems: string[] }[] = weakTopics.map(t => ({
      topic: t.topic,
      problems: [`Реши 5 задач по теме "${t.topic}"`],
    }));

    if (aiResponse.ok) {
      try {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          if (parsed.plan) planData = parsed.plan;
          if (Array.isArray(parsed.tasks)) tasks = parsed.tasks;
        }
      } catch {
        console.error("Failed to parse AI response, using fallback");
      }
    }

    const result = {
      diagnostic: {
        overallAccuracy,
        weakTopics,
        strongTopics,
      },
      plan: planData,
      tasks,
      cta: {
        text: "Улучшить слабые темы",
        action: "go_to_lessons",
      },
    };

    console.log("Learning plan generated:", { overallAccuracy, weakCount: weakTopics.length, strongCount: strongTopics.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
