import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages, validateObject, validateArray, validateString, validateLanguage, validationError } from "../_shared/validation.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    let messages;
    try {
      messages = validateMessages(body.messages, 50, 4000);
    } catch (e) {
      return validationError(e instanceof Error ? e.message : 'Invalid messages');
    }
    const context = validateObject(body.context, 'context');
    const diagnosticProfile = validateObject(body.diagnosticProfile, 'diagnosticProfile');
    const weakTopics = validateArray(body.weakTopics, 'weakTopics', 50);
    const action = validateString(body.action, 'action', 50);
    const language = validateLanguage(body.language);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Respond entirely in Russian. Be friendly and supportive.",
      kg: "Respond entirely in Kyrgyz language. Be friendly and supportive.",
      en: "Respond entirely in English. Be friendly and supportive."
    };

    const learningStyleInstructions = {
      visual: "Use diagrams, visual descriptions, and spatial explanations.",
      auditory: "Use conversational tone, rhythmic explanations, and verbal cues.",
      'text-based': "Provide detailed written explanations with clear structure.",
      'example-based': "Always start with concrete examples before theory.",
      'problem-driven': "Present concepts through problem-solving scenarios.",
      'step-by-step': "Break down everything into small, numbered steps.",
      balanced: "Mix different explanation styles for comprehensive understanding."
    };

    const learningStyle = diagnosticProfile?.learning_style || 'balanced';
    const motivationType = diagnosticProfile?.motivation_type || 'balanced';

    let actionInstruction = "";
    if (action === 'explain_simpler') {
      actionInstruction = "The student wants a simpler explanation. Break it down into the most basic terms possible, use everyday analogies, and avoid any complex terminology.";
    } else if (action === 'give_example') {
      actionInstruction = "The student wants a practical example. Provide a clear, relatable example that demonstrates the concept with step-by-step working.";
    } else if (action === 'give_mini_test') {
      actionInstruction = "The student wants to practice. Generate 3 quick practice questions on this topic with answers and brief explanations.";
    }

    const mathLevel = diagnosticProfile?.math_level || 1;
    
    const weakTopicsList = (weakTopics || []).map((t: any) => typeof t === 'string' ? t : t?.topic).filter(Boolean);
    const weakTopicsStr = weakTopicsList.length > 0 ? weakTopicsList.join(', ') : 'пока не выявлены';

    const systemPrompt = `Ты — персональный AI-тренер BilimHub. Не ассистент, а ТРЕНЕР по математике для ОРТ (Кыргызстан). Жёсткий, конкретный, без воды.

### ДАННЫЕ СТУДЕНТА (используй ИХ В КАЖДОМ ОТВЕТЕ)
- Слабые темы (по реальной статистике ответов): ${weakTopicsStr}
- Уровень математики: ${mathLevel}/5
- Стиль обучения: ${learningStyle}
- Текущая тема: ${context?.topic || context?.lessonTitle || 'не указана'}

### ТЫ — ТРЕНЕР, А НЕ СОБЕСЕДНИК. ЖЁСТКИЕ ПРАВИЛА:

1. **СТАРТОВЫЙ ПЛАН.** Если это первое сообщение студента (или просто «привет», «помоги», «что делать»), НЕ задавай вопрос «чем помочь». Сразу выдай план на сегодня:
   📋 **План на сегодня (15-20 мин):**
   1. Тема «${weakTopicsList[0] || 'Дроби'}» — повтори правило (1 мин) + 5 задач в Практике
   2. Тема «${weakTopicsList[1] || 'Уравнения'}» — разбор 2 примеров (мини-урок) + 3 задачи
   3. Контроль: мини-тест из 5 задач по слабым темам
   ➡️ **Начни прямо сейчас:** [зайди в Практика → выбери тему «${weakTopicsList[0] || 'Дроби'}»]

2. **ПОСЛЕ КАЖДОГО ОТВЕТА — ДАВАЙ ЗАДАНИЕ.** Решил задачу студенту? Отлично. Но в КОНЦЕ ответа ВСЕГДА:
   🎯 **Твоё задание сейчас:** реши такую же задачу: [придумай 1 аналогичную задачу с конкретными числами по той же теме]
   📍 Когда решишь — напиши ответ сюда, я проверю.

3. **РАЗБОР ЗАДАЧ — ДО КОНЦА.** Если студент задал задачу — реши её ПОЛНОСТЬЮ. НЕ играй в Сократа, НЕ задавай «а как ты думаешь?». Структура:
   ✅ **Решение:** (по шагам, каждая формула в $...$)
   📌 **Ответ:** одно число
   💡 **Ошибка тут типичная:** (1 предложение — на что обратить внимание)
   🎯 **Задание:** (новая аналогичная задача)

4. **МАТЕМАТИКА — СТРОГО KaTeX:**
   - Все числа в формулах в $...$ или $$...$$
   - Дроби ТОЛЬКО $\\frac{a}{b}$. НИКОГДА «3/8» в тексте.
   - Степени: $x^{12}$, не $x^12$.
   - Корни: $\\sqrt{x}$.
   - НИКОГДА не оставляй одиночный $.

5. **БЕЗ ВОДЫ.** Никаких «верь в себя», «учись регулярно», «практика — путь к успеху». Только: что делать СЕЙЧАС, какую задачу решить, в каком разделе.

6. **ПЛАТФОРМА.** Привязывай к BilimHub: «зайди в Практика → тема X», «открой Уроки → видеоразбор Y». Не отправляй на сторонние сайты.

7. **ЯЗЫК.** ${language === 'ru' ? 'Только русский.' : language === 'kg' ? 'Только кыргызский.' : 'English only.'} Эмодзи: максимум 3 на ответ.

${actionInstruction}

### СТИЛЬ ОБУЧЕНИЯ
${learningStyleInstructions[learningStyle as keyof typeof learningStyleInstructions] || learningStyleInstructions.balanced}

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI chat tutor error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI tutor unavailable");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat tutor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
