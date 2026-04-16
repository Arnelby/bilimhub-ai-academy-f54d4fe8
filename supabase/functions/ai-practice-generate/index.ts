import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize answer to uppercase Latin letter
function normalizeAnswer(raw: string | null | undefined): string {
  if (!raw) return 'A';
  let ans = raw.trim().toUpperCase();
  const map: Record<string, string> = { 'А': 'A', 'Б': 'B', 'В': 'C', 'Г': 'D', 'Д': 'E' };
  if (map[ans]) ans = map[ans];
  if (['A', 'B', 'C', 'D', 'E'].includes(ans)) return ans;
  return 'A';
}

function flattenCachedQuestion(row: any): any {
  const qd = row.question_data || {};
  return {
    type: row.question_type || qd.type || 'comparison',
    topic: row.topic || qd.topic || '',
    instruction: qd.instruction || null,
    column_a: qd.column_a || null,
    column_b: qd.column_b || null,
    options: qd.options || null,
    correct_answer: normalizeAnswer(row.correct_answer || qd.correct_answer),
  };
}

const ALL_ORT_TOPICS = [
  'Арифметика', 'Алгебра', 'Геометрия', 'Уравнения',
  'Неравенства', 'Функции', 'Проценты', 'Дроби',
  'Степени и корни', 'Текстовые задачи', 'Последовательности',
  'Системы уравнений', 'Теория вероятностей', 'Комбинаторика',
];

// Call AI gateway
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

// Parse JSON from AI response
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

// Verify answers using a second AI call with a more capable model
async function verifyAnswers(apiKey: string, questions: any[]): Promise<any[]> {
  // Build verification prompt
  const questionsForVerification = questions.map((q: any, i: number) => {
    if (q.type === 'comparison') {
      return `Задача ${i + 1} (сравнение):
Условие: ${q.instruction || 'нет'}
Столбец A: ${q.column_a}
Столбец B: ${q.column_b}
Заявленный ответ: ${q.correct_answer}`;
    } else {
      const opts = q.options ? Object.entries(q.options).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      return `Задача ${i + 1} (MCQ):
Условие: ${q.instruction}
Варианты: ${opts}
Заявленный ответ: ${q.correct_answer}`;
    }
  }).join('\n\n');

  const verifyPrompt = `Ты математический верификатор. Проверь КАЖДУЮ задачу ниже.
Для каждой задачи:
1. Реши задачу самостоятельно шаг за шагом
2. Сравни свой ответ с заявленным
3. Если заявленный ответ НЕВЕРЕН — исправь его

Ответь СТРОГО в JSON формате:
{"verified": [{"index": 0, "correct_answer": "A", "was_wrong": false}, ...]}

correct_answer — ТОЛЬКО латинские буквы A, B, C, D или E.

Задачи:
${questionsForVerification}

Ответь ТОЛЬКО JSON, без пояснений.`;

  try {
    const content = await callAI(apiKey, [
      { role: "system", content: "Ты строгий математический верификатор. Проверяй каждую задачу, решая её заново. Отвечай ТОЛЬКО JSON." },
      { role: "user", content: verifyPrompt },
    ], 0.1, "google/gemini-2.5-pro");

    const parsed = parseAIJson(content);
    if (!parsed?.verified || !Array.isArray(parsed.verified)) {
      console.warn("[PRACTICE] Verification parse failed, keeping original answers");
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
    console.log(`[PRACTICE] Verification complete: ${fixedCount} answers corrected out of ${questions.length}`);
    return questions;
  } catch (e) {
    console.error("[PRACTICE] Verification failed:", e);
    return questions; // Return unmodified if verification fails
  }
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
      weakTopics,
      questionCount = 8,
      formatType = 'comparison',
      groupType = 'ai',
    } = body;

    const isControl = groupType === 'control';
    const actualCount = isControl ? 25 : questionCount;
    const topics = isControl ? ALL_ORT_TOPICS : (weakTopics || []);

    if (!isControl && (!topics || topics.length === 0)) {
      return new Response(JSON.stringify({ error: 'weakTopics required for AI group' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] User: ${userId}, Group: ${groupType}, Topics: ${topics.join(', ')}, Count: ${actualCount}`);

    const { data: profile } = await supabase
      .from('profiles')
      .select('participant_id, group_type')
      .eq('id', userId)
      .maybeSingle();

    const participantId = profile?.participant_id || null;

    // NO CACHE — always generate fresh questions to avoid stale wrong answers
    // Previous 2-hour cache was serving questions with incorrect correct_answers

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const topicList = topics.join(', ');
    const controlNote = isControl
      ? '\n- Задачи должны быть общими, без адаптации к уровню ученика\n- Равномерно распредели задачи по всем указанным темам'
      : '\n- Фокусируйся на слабых темах ученика';

    const validationNote = `\nКРИТИЧЕСКИ ВАЖНО — ПРОВЕРКА ПРАВИЛЬНОСТИ ОТВЕТА:
1. Сначала ПОЛНОСТЬЮ реши каждую задачу шаг за шагом
2. Запиши промежуточные вычисления
3. Только после решения определи correct_answer
4. correct_answer ДОЛЖЕН быть математически верным
5. Если задача на сравнение: вычисли ОБА выражения ЧИСЛЕНО, сравни числа, потом выбери A/B/C/D
6. Если задача MCQ: вычисли ответ, найди его среди вариантов
7. ЗАПРЕЩЕНО угадывать correct_answer без решения
8. ЗАПРЕЩЕНО копировать задачи из реальных тестов ОРТ
9. correct_answer: ТОЛЬКО латинские буквы A, B, C, D или E (НЕ кириллица)
10. ПЕРЕД ВЫДАЧЕЙ — ПЕРЕПРОВЕРЬ каждый ответ ещё раз`;

    const prompt = formatType === 'mcq'
      ? `Сгенерируй ${actualCount} НОВЫХ уникальных задач по математике в формате ОРТ (множественный выбор) для тем: ${topicList}.

JSON формат (строго):
{"questions": [{"type":"mcq","topic":"тема","instruction":"текст задачи","options":{"A":"вариант1","B":"вариант2","C":"вариант3","D":"вариант4","E":"вариант5"},"correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная
- 5 вариантов ответа (A-E)
- correct_answer: латинская буква A-E
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность${controlNote}${validationNote}
- Ответь ТОЛЬКО JSON, без пояснений`
      : `Сгенерируй ${actualCount} НОВЫХ уникальных задач по математике в формате ОРТ (сравнение величин) для тем: ${topicList}.

JSON формат (строго):
{"questions": [{"type":"comparison","topic":"тема","instruction":"условие или null","column_a":"выражение A","column_b":"выражение B","correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная
- correct_answer: A (столбец A больше), B (столбец B больше), C (равны), D (невозможно определить)
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность${controlNote}${validationNote}
- Ответь ТОЛЬКО JSON, без пояснений`;

    console.log("[PRACTICE] AI_GENERATION_STARTED (model: gemini-2.5-pro)");

    // Step 1: Generate questions with gemini-2.5-pro for better math accuracy
    let content: string;
    try {
      content = await callAI(LOVABLE_API_KEY, [
        { role: "system", content: "Ты генератор математических задач для ОРТ. Отвечай ТОЛЬКО валидным JSON. Каждая задача должна быть математически корректной — РЕШИ задачу перед выдачей ответа." },
        { role: "user", content: prompt },
      ], isControl ? 0.2 : 0.3, "google/gemini-2.5-pro");
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
      console.error("[PRACTICE] No valid JSON in AI response");
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

    // Normalize all answers
    for (const q of questions) {
      q.correct_answer = normalizeAnswer(q.correct_answer);
    }

    console.log(`[PRACTICE] Generated ${questions.length} questions, pre-verify answers: ${questions.map((q: any) => q.correct_answer).join(',')}`);

    // Step 2: VERIFY answers with a second AI call
    questions = await verifyAnswers(LOVABLE_API_KEY, questions);

    console.log(`[PRACTICE] Post-verify answers: ${questions.map((q: any) => q.correct_answer).join(',')}`);

    // Save to practice_questions table
    const toInsert = questions.map((q: any) => ({
      user_id: userId,
      topic: q.topic || topics[0],
      question_type: q.type || formatType,
      question_data: q,
      correct_answer: q.correct_answer,
      source: isControl ? 'ai_control_verified' : 'ai_verified',
    }));

    const { error: insertError } = await supabase.from('practice_questions').insert(toInsert);
    if (insertError) {
      console.error("[PRACTICE] DB insert error:", insertError);
    }

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
