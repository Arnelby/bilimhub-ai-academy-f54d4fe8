import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateNumber, validateLanguage, validationError } from "../_shared/validation.ts";

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
    const part = validateNumber(body.part, 1, 1, 2);
    const variant = validateNumber(body.variant, 1, 1, 10);
    const language = validateLanguage(body.language);
    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    
    if (!GROK_API_KEY) {
      throw new Error("GROK_API_KEY is not configured");
    }

    const questionCount = 30;
    const isPartOne = part === 1;
    
    const systemPrompt = `### РОЛЬ
Ты — Элитный ИИ-методист BilimHub, сертифицированный по стандартам ОРТ (Общереспубликанское тестирование) Министерства образования Кыргызстана. Твоя специализация: создание качественных тестовых вопросов по Математике, Аналогиям и Чтению/Пониманию.

### ЗАДАЧА
Сгенерируй ${questionCount} оригинальных математических вопросов на языке: ${language === 'ru' ? 'Русский' : language === 'kg' ? 'Кыргызский' : 'English'}.

Для вопросов Части 1: Используй формат сравнения "Колонка А vs Колонка Б", где студенты сравнивают два значения.
Для вопросов Части 2: Используй стандартный формат множественного выбора с 4 вариантами.

### ТВОИ ПРАВИЛА (ГЕНЕРАЦИЯ И ОБУЧЕНИЕ)
1. **Никакого Плагиата:** Не копируй вопросы ЦООМО дословно. Генерируй АНАЛОГИЧНЫЕ задачи, используя ту же логическую структуру (шаблоны министерства), но с другими числами и сюжетами.

2. **Стандарты качества:**
   - Каждый вопрос должен быть оригинальным
   - Соответствовать уровню сложности ОРТ
   - Быть четким и однозначным
   - Иметь ровно один правильный ответ

3. **Локальный контекст:** Используй примеры из реальной жизни Кыргызстана (цены в сомах, названия городов, местные ситуации)

4. **Формат ответа (Math):** Используй LaTeX для формул в тексте вопроса (например, $x^2 + y = 10$).

### СТРУКТУРА ГЕНЕРАЦИИ ТЕСТА (JSON)
Возвращай ТОЛЬКО валидный JSON массив со следующей структурой:
[
  {
    "question_text": "Четкая формулировка задачи",
    "trap_check": "Описание ловушки (например: 'деление на ноль', 'неправильная аналогия', 'забытый знак минус')",
    "options": ["А) вариант1", "Б) вариант2", "В) вариант3", "Г) вариант4"],
    "correct_option": 0,
    "explanation": "Почему этот ответ верен и как не попасться в ловушку в следующий раз (педагогическое объяснение)"
  }
]

### ФОРМАТ ВАРИАНТОВ
Для вопросов Части 1 (сравнение), варианты ответа должны быть:
- А) Величина в колонке А больше
- Б) Величина в колонке Б больше
- В) Величины равны
- Г) Невозможно определить

Для вопросов Части 2: стандартные 4 варианта с префиксами А), Б), В), Г)

### ТОН И ЯЗЫК
- Тон: Профессиональный, как у опытного методиста Министерства образования
- Формулировки должны быть точными и соответствовать стандартам ОРТ
- Вопросы должны проверять понимание, а не только запоминание`;

    const userPrompt = isPartOne 
      ? `Generate ${questionCount} Part 1 ORT math comparison questions. Each question should present two columns (Колонка А and Колонка Б) with mathematical expressions or values to compare. Topics: arithmetic, algebra, geometry basics, percentages, fractions.`
      : `Generate ${questionCount} Part 2 ORT math questions. Standard multiple choice with 4 options each. Topics: equations, functions, geometry, trigonometry, probability, statistics.`;

    console.log(`Generating ORT test Part ${part}, Variant ${variant}`);

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse questions from AI response");
    }

    console.log(`Generated ${questions.length} questions`);

    return new Response(JSON.stringify({ 
      success: true,
      questions,
      part,
      variant,
      questionCount: questions.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating ORT test:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
