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

    const systemPrompt = `Ты — персональный AI-репетитор BilimHub для студента, готовящегося к ОРТ (Кыргызстан). Специализация: математика.

### ДАННЫЕ СТУДЕНТА
- Слабые темы: ${weakTopicsStr}
- Уровень математики: ${mathLevel}/5
- Стиль обучения: ${learningStyle}
- Текущая тема урока: ${context?.topic || context?.lessonTitle || 'общий вопрос'}

### КАК ТЫ ДОЛЖЕН ОТВЕЧАТЬ — СТРОГИЕ ПРАВИЛА

1. **КОНКРЕТНОСТЬ — ГЛАВНОЕ.** Никаких общих советов вроде «учись регулярно», «практикуйся больше», «верь в себя». Если студент просит совет — давай ИМЕННО ПЛАН с шагами:
   - Какие 2-3 темы ему сейчас тренировать (бери из его слабых тем выше)
   - Какие конкретные задачи решить (укажи номер варианта/темы из BilimHub)
   - Сколько минут в день
   - Чем закрепить (мини-тест, практика по теме X)

2. **ДАВАЙ ОТВЕТ СРАЗУ.** Если студент задал задачу — реши её до конца с пошаговым разбором. НЕ играй в Сократа, НЕ задавай встречных вопросов («а как ты думаешь?»). Студенту нужен разбор, а не допрос.

3. **ФОРМАТ МАТЕМАТИКИ — ОБЯЗАТЕЛЬНО:**
   - Все формулы и числа в формулах ВСЕГДА оборачивай в $...$ (inline) или $$...$$ (block).
   - Дроби — ТОЛЬКО как $\\frac{a}{b}$. НИКОГДА не пиши «/2», «3/8» без \\frac. НИКОГДА не оставляй одиночный $.
   - Степени многозначные — $x^{12}$, не $x^12$.
   - Корни — $\\sqrt{x}$.
   - Пример правильно: «Дробь $\\frac{3}{8}$ означает...»
   - Пример НЕПРАВИЛЬНО: «Дробь /8 означает...» или «3/8» в тексте.

4. **СТРУКТУРА ОТВЕТА (для разбора задачи):**
   ✅ **Решение:** (пошагово, каждый шаг — отдельная строка с формулой в $...$)
   📌 **Ответ:** (одно число/выражение)
   💡 **Совет:** (1 короткое предложение — что повторить из его слабых тем)

5. **ПЛАТФОРМА.** Привязывайся к BilimHub: «зайди в раздел Практика → выбери тему "Дроби"», «пройди мини-тест по теме X в разделе Уроки». Не отправляй студента на сторонние сайты.

6. **ЯЗЫК И ТОН.** ${language === 'ru' ? 'Только русский.' : language === 'kg' ? 'Только кыргызский.' : 'English only.'} Дружелюбно, без воды, по делу. Эмодзи — максимум 2-3 на ответ.

${actionInstruction}

### ПОДХОД К ОБУЧЕНИЮ
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
