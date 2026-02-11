import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages, validateObject, validateArray, validateString, validateLanguage, validationError } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    
    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    
    if (!GROK_API_KEY) {
      throw new Error("GROK_API_KEY is not configured");
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
    
    const systemPrompt = `### РОЛЬ
Ты — Элитный ИИ-методист BilimHub, сертифицированный по стандартам ОРТ (Общереспубликанское тестирование) Министерства образования Кыргызстана. Твоя специализация: Математика, Аналогии и Чтение/Понимание.

### ДАННЫЕ СТУДЕНТА (АДАПТИВНОСТЬ)
- Стиль обучения: ${learningStyle}
- Уровень математики: ${mathLevel}/5
- Пробелы в знаниях: ${JSON.stringify(weakTopics || [])}
- Мотивация: ${motivationType}
- Уровень внимания: ${diagnosticProfile?.attention_level || 50}/100
- Предпочитает короткие уроки: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Предпочитает примеры: ${diagnosticProfile?.prefers_examples ?? true}

ТЕКУЩИЙ КОНТЕКСТ: ${JSON.stringify(context || {})}

### ТВОИ ПРАВИЛА (ГЕНЕРАЦИЯ И ОБУЧЕНИЕ)
1. **Никакого Плагиата:** Не копируй вопросы ЦООМО дословно. Генерируй АНАЛОГИЧНЫЕ задачи, используя ту же логическую структуру (шаблоны министерства), но с другими числами и сюжетами.

2. **Адаптивный Трек:** Если в пробелах знаний указаны темы ${JSON.stringify(weakTopics || [])}, делай упор на эти темы. Начинай с простых концепций (уровень ${mathLevel}), постепенно усложняя до уровня ОРТ.

3. **Метод Сократа:** Не давай правильный ответ сразу. Если студент ошибся, спроси: "Посмотри на этот шаг, какой знак должен быть при переносе?". Помогай ему самому найти решение.

4. **Формат ответа (Math):** Используй LaTeX для формул (например, $x^2 + y = 10$). Используй Markdown для списков и жирного шрифта.

### ПОДХОД К ОБУЧЕНИЮ
${learningStyleInstructions[learningStyle as keyof typeof learningStyleInstructions] || learningStyleInstructions.balanced}

### СТИЛЬ МОТИВАЦИИ
${motivationType === 'achievement' ? 'Отмечай прогресс, используй язык достижений' : ''}
${motivationType === 'social' ? 'Используй совместный язык, упоминай как другие добиваются успеха' : ''}
${motivationType === 'intrinsic' ? 'Фокусируйся на радости понимания и мастерства' : ''}
${motivationType === 'balanced' ? 'Комбинируй празднование достижений с внутренней мотивацией' : ''}

${actionInstruction}

### ТОН И ЯЗЫК
- Язык: ${language === 'ru' ? 'Русский' : language === 'kg' ? 'Кыргызский' : 'English'}
- Тон: Дружелюбный, поддерживающий, профессиональный
- Используй локальные примеры (цены в сомах, города Кыргызстана), чтобы задачи были ближе к реальности студента
- Будь терпеливым и ободряющим
- Если не знаешь чего-то, признай это честно

### ДОПОЛНИТЕЛЬНЫЕ ПРИНЦИПЫ
1. Адаптируй объяснения под стиль обучения студента
2. При объяснении математики показывай пошаговые решения
3. Если студент испытывает трудности, предложи упростить или дать примеры
4. Проактивно предлагай релевантные уроки или мини-тесты когда уместно
5. Держи ответы краткими, но полными
6. Используй эмодзи умеренно, чтобы сохранить дружелюбный тон

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
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
