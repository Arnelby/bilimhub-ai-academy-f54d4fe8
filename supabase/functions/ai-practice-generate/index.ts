import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeAnswer(raw: string | null | undefined): string {
  if (!raw) return 'A';
  let ans = raw.trim().toUpperCase();
  const map: Record<string, string> = { 'А': 'A', 'Б': 'B', 'В': 'C', 'Г': 'D', 'Д': 'E' };
  if (map[ans]) ans = map[ans];
  if (['A', 'B', 'C', 'D', 'E'].includes(ans)) return ans;
  return 'A';
}

const ALL_ORT_TOPICS = [
  'Арифметика', 'Алгебра', 'Геометрия', 'Уравнения',
  'Неравенства', 'Функции', 'Проценты', 'Дроби',
  'Степени и корни', 'Текстовые задачи', 'Последовательности',
  'Системы уравнений', 'Теория вероятностей', 'Комбинаторика',
];

async function callAI(apiKey: string, messages: any[], temperature: number, model: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseAIJson(content: string): any {
  const cleaned = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
    ch === '\n' || ch === '\r' || ch === '\t' ? ch : ' '
  );
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
  } catch {
    return null;
  }
}

// Verify answers with a second AI call
async function verifyAnswers(apiKey: string, questions: any[]): Promise<any[]> {
  const questionsForVerification = questions.map((q: any, i: number) => {
    if (q.type === 'comparison') {
      return `Задача ${i + 1} (сравнение):\nУсловие: ${q.instruction || 'нет'}\nСтолбец A: ${q.column_a}\nСтолбец B: ${q.column_b}\nЗаявленный ответ: ${q.correct_answer}`;
    } else {
      const opts = q.options ? Object.entries(q.options).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      return `Задача ${i + 1} (MCQ):\nУсловие: ${q.instruction}\nВарианты: ${opts}\nЗаявленный ответ: ${q.correct_answer}`;
    }
  }).join('\n\n');

  const verifyPrompt = `Ты математический верификатор. Проверь КАЖДУЮ задачу ниже.
Для каждой:
1. Реши задачу самостоятельно шаг за шагом
2. Сравни свой ответ с заявленным
3. Если заявленный ответ НЕВЕРЕН — исправь его

Ответь СТРОГО JSON:
{"verified": [{"index": 0, "correct_answer": "A", "was_wrong": false}, ...]}

correct_answer — ТОЛЬКО латинские буквы A, B, C, D или E.

Задачи:
${questionsForVerification}

ТОЛЬКО JSON, без пояснений.`;

  try {
    const content = await callAI(apiKey, [
      { role: "system", content: "Ты строгий математический верификатор. Решай каждую задачу заново. ТОЛЬКО JSON." },
      { role: "user", content: verifyPrompt },
    ], 0.1, "google/gemini-2.5-flash");

    const parsed = parseAIJson(content);
    if (!parsed?.verified || !Array.isArray(parsed.verified)) {
      console.warn("[PRACTICE] Verification parse failed, keeping original");
      return questions;
    }

    let fixedCount = 0;
    for (const v of parsed.verified) {
      const idx = v.index;
      if (idx >= 0 && idx < questions.length && v.correct_answer) {
        const newAnswer = normalizeAnswer(v.correct_answer);
        if (newAnswer !== questions[idx].correct_answer) {
          console.log(`[PRACTICE] VERIFY_FIX: Q${idx} ${questions[idx].correct_answer} → ${newAnswer}`);
          questions[idx].correct_answer = newAnswer;
          fixedCount++;
        }
      }
    }
    console.log(`[PRACTICE] Verification: ${fixedCount} fixes out of ${questions.length}`);
    return questions;
  } catch (e) {
    console.error("[PRACTICE] Verification failed:", e);
    return questions;
  }
}

// Build topic distribution for the prompt
function buildTopicDistribution(
  weakTopics: string[],
  mediumTopics: string[],
  count: number
): { weakCount: number; mediumCount: number; weakList: string; mediumList: string } {
  // 80% weak, 20% medium
  const weakCount = Math.ceil(count * 0.8);
  const mediumCount = count - weakCount;
  return {
    weakCount,
    mediumCount: mediumTopics.length > 0 ? mediumCount : 0,
    weakList: weakTopics.join(', '),
    mediumList: mediumTopics.length > 0 ? mediumTopics.join(', ') : weakTopics.join(', '),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTs = Date.now();
  console.log("[PRACTICE] REQUEST_RECEIVED");

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const body = await req.json();
    const {
      weakTopics = [],
      mediumTopics = [],
      mistakePatterns = [],
      previousInstructions = [],
      questionCount = 10,
      formatType = 'comparison',
      groupType = 'ai',
    } = body;

    const isControl = groupType === 'control';
    const actualCount = isControl ? 25 : Math.max(10, questionCount);
    const topics = isControl ? ALL_ORT_TOPICS : weakTopics;

    if (!isControl && topics.length === 0) {
      return new Response(JSON.stringify({ error: 'weakTopics required for AI group' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] User: ${userId}, Group: ${groupType}, Weak: [${topics.join(', ')}], Medium: [${mediumTopics.join(', ')}], Count: ${actualCount}`);

    const { data: profile } = await supabase
      .from('profiles')
      .select('participant_id')
      .eq('id', userId)
      .maybeSingle();

    const participantId = profile?.participant_id || null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build anti-repetition block
    const antiRepetitionBlock = previousInstructions.length > 0
      ? `\n\nЗАПРЕЩЁННЫЕ ЗАДАЧИ (НЕ ПОВТОРЯЙ эти условия, создай ДРУГИЕ с другими числами и формулировками):\n${previousInstructions.slice(0, 20).map((inst: string, i: number) => `${i + 1}. "${inst}"`).join('\n')}`
      : '';

    // Build mistake pattern context
    const mistakeContext = mistakePatterns.length > 0
      ? `\n\nОШИБКИ УЧЕНИКА (создай задачи НА ТЕ ЖЕ ПОДТЕМЫ, но с другими числами):\n${mistakePatterns.slice(0, 8).map((m: any, i: number) => `${i + 1}. Тема: ${m.topic}, Задача: "${m.instruction}"`).join('\n')}`
      : '';

    const validationNote = `\nКРИТИЧЕСКИ ВАЖНО:
1. ПОЛНОСТЬЮ реши каждую задачу шаг за шагом ПЕРЕД выдачей ответа
2. correct_answer ДОЛЖЕН быть математически верным
3. Если сравнение: вычисли ОБА выражения ЧИСЛЕНО
4. correct_answer: ТОЛЬКО латинские буквы A, B, C, D или E
5. ПЕРЕПРОВЕРЬ каждый ответ`;

    let prompt: string;

    if (isControl) {
      // CONTROL: uniform distribution across all topics
      prompt = formatType === 'mcq'
        ? `Сгенерируй ${actualCount} НОВЫХ уникальных задач MCQ по математике для ОРТ.
Темы: ${ALL_ORT_TOPICS.join(', ')}. Равномерно распредели по темам.

JSON: {"questions": [{"type":"mcq","topic":"тема","subtopic":"подтема","instruction":"текст","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correct_answer":"A"}]}

- Задачи общие, без адаптации
- Каждая НОВАЯ и уникальная${antiRepetitionBlock}${validationNote}
- ТОЛЬКО JSON`
        : `Сгенерируй ${actualCount} НОВЫХ уникальных задач (сравнение величин) по математике для ОРТ.
Темы: ${ALL_ORT_TOPICS.join(', ')}. Равномерно распредели.

JSON: {"questions": [{"type":"comparison","topic":"тема","subtopic":"подтема","instruction":"условие или null","column_a":"выражение A","column_b":"выражение B","correct_answer":"A"}]}

- correct_answer: A (A>B), B (B>A), C (равны), D (невозможно определить)
- Каждая НОВАЯ${antiRepetitionBlock}${validationNote}
- ТОЛЬКО JSON`;
    } else {
      // AI GROUP: personalized with 80/20 distribution
      const dist = buildTopicDistribution(weakTopics, mediumTopics, actualCount);
      
      const topicInstruction = dist.mediumCount > 0
        ? `РАСПРЕДЕЛЕНИЕ ЗАДАЧ:
- ${dist.weakCount} задач по СЛАБЫМ темам: ${dist.weakList}
- ${dist.mediumCount} задач по СРЕДНИМ темам: ${dist.mediumList}

Для каждой слабой темы используй РАЗНЫЕ подтемы (например, для Геометрии: площади, углы, треугольники, окружности).`
        : `ВСЕ ${actualCount} задач по темам: ${dist.weakList}
Используй РАЗНЫЕ подтемы для каждой темы.`;

      prompt = formatType === 'mcq'
        ? `Сгенерируй РОВНО ${actualCount} НОВЫХ уникальных задач MCQ по математике для ОРТ.

${topicInstruction}${mistakeContext}

JSON: {"questions": [{"type":"mcq","topic":"тема","subtopic":"подтема (напр. площади, углы, дроби обыкновенные)","instruction":"текст задачи","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correct_answer":"A"}]}

- Фокусируйся на слабых темах ученика
- Используй КОНКРЕТНЫЕ подтемы, не общие категории
- 5 вариантов ответа (A-E)${antiRepetitionBlock}${validationNote}
- ТОЛЬКО JSON`
        : `Сгенерируй РОВНО ${actualCount} НОВЫХ уникальных задач (сравнение величин) по математике для ОРТ.

${topicInstruction}${mistakeContext}

JSON: {"questions": [{"type":"comparison","topic":"тема","subtopic":"подтема (напр. площади, углы, степени с дробным показателем)","instruction":"условие или null","column_a":"выражение A","column_b":"выражение B","correct_answer":"A"}]}

- correct_answer: A (A>B), B (B>A), C (равны), D (невозможно определить)
- Используй КОНКРЕТНЫЕ подтемы
- Фокусируйся на паттернах ошибок ученика${antiRepetitionBlock}${validationNote}
- ТОЛЬКО JSON`;
    }

    console.log("[PRACTICE] AI_GENERATION_STARTED (model: gemini-2.5-pro)");

    let content: string;
    try {
      content = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "Ты генератор математических задач для ОРТ. Отвечай ТОЛЬКО валидным JSON. Каждая задача должна быть математически корректной — РЕШИ задачу перед выдачей ответа. Генерируй РОВНО столько задач, сколько запрошено." },
        { role: "user", content: prompt },
      ], isControl ? 0.2 : 0.4, "google/gemini-2.5-pro");
    } catch (e: any) {
      console.error(`[PRACTICE] AI_ERROR: ${e.message}`);
      const is429 = e.message.includes('429');
      return new Response(JSON.stringify({ error: is429 ? 'Rate limit exceeded' : 'AI generation failed' }), {
        status: is429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = parseAIJson(content);
    if (!parsed) {
      console.error("[PRACTICE] No valid JSON in response");
      return new Response(JSON.stringify({ error: 'AI returned invalid format' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let questions = parsed.questions || [];
    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: 'AI generated 0 questions' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize answers
    for (const q of questions) {
      q.correct_answer = normalizeAnswer(q.correct_answer);
    }

    const topicBreakdown = questions.reduce((acc: Record<string, number>, q: any) => {
      const key = `${q.topic}/${q.subtopic || '?'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    console.log(`[PRACTICE] Generated ${questions.length} questions. Topics: ${JSON.stringify(topicBreakdown)}`);

    // Verify answers
    questions = await verifyAnswers(LOVABLE_API_KEY, questions);

    console.log(`[PRACTICE] Post-verify answers: ${questions.map((q: any) => q.correct_answer).join(',')}`);

    // Save to DB
    const toInsert = questions.map((q: any) => ({
      user_id: userId,
      topic: q.topic || topics[0],
      question_type: q.type || formatType,
      question_data: q,
      correct_answer: q.correct_answer,
      source: isControl ? 'ai_control_v3' : 'ai_personalized_v3',
    }));

    const { error: insertError } = await supabase.from('practice_questions').insert(toInsert);
    if (insertError) console.error("[PRACTICE] DB insert error:", insertError);

    const totalLatency = Date.now() - startTs;
    console.log(`[PRACTICE] Done in ${totalLatency}ms`);

    return new Response(JSON.stringify({
      questions,
      source: 'ai_verified',
      participantId,
      groupType: isControl ? 'control' : 'ai',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[PRACTICE] FATAL:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
