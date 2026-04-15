import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function flattenCachedQuestion(row: any): any {
  const qd = row.question_data || {};
  return {
    type: row.question_type || qd.type || 'comparison',
    topic: row.topic || qd.topic || '',
    instruction: qd.instruction || null,
    column_a: qd.column_a || null,
    column_b: qd.column_b || null,
    options: qd.options || null,
    correct_answer: row.correct_answer || qd.correct_answer || 'A',
  };
}

// All ORT math topics for control group (non-personalized)
const ALL_ORT_TOPICS = [
  'Арифметика', 'Алгебра', 'Геометрия', 'Уравнения',
  'Неравенства', 'Функции', 'Проценты', 'Дроби',
  'Степени и корни', 'Текстовые задачи', 'Последовательности',
  'Системы уравнений', 'Теория вероятностей', 'Комбинаторика',
];

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

    // For control: use ALL_ORT_TOPICS; for AI: use weak topics
    const topics = isControl ? ALL_ORT_TOPICS : (weakTopics || []);

    if (!isControl && (!topics || topics.length === 0)) {
      return new Response(JSON.stringify({ error: 'weakTopics required for AI group' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] User: ${userId}, Group: ${groupType}, Topics: ${topics.join(', ')}, Format: ${formatType}, Count: ${actualCount}`);

    // Fetch participant_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('participant_id, group_type')
      .eq('id', userId)
      .maybeSingle();

    const participantId = profile?.participant_id || null;

    // Check cache — questions generated in last 2 hours for same topics (AI only, control always generates fresh)
    if (!isControl) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', twoHoursAgo)
        .in('topic', topics)
        .order('created_at', { ascending: false })
        .limit(actualCount);

      if (cached && cached.length >= 3) {
        console.log(`[PRACTICE] CACHE_HIT: ${cached.length} questions`);
        const flattened = cached.map(flattenCachedQuestion);
        return new Response(JSON.stringify({ questions: flattened, source: 'cache' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // AI Generation
    console.log("[PRACTICE] AI_GENERATION_STARTED");
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

    const validationNote = `\nВАЖНО: Для каждой задачи:
1. Сначала реши задачу самостоятельно
2. Убедись, что ответ математически корректен
3. Не генерируй задачи, если не уверен в решении
4. correct_answer должен быть проверенным и верным
5. ЗАПРЕЩЕНО копировать задачи из реальных тестов ОРТ
6. Каждая задача должна иметь ДРУГИЕ числа, формулировки и структуру
7. Если задача похожа на типичную тестовую — измени числа и контекст`;

    const prompt = formatType === 'mcq'
      ? `Сгенерируй ${actualCount} НОВЫХ уникальных задач по математике в формате ОРТ (множественный выбор) для тем: ${topicList}.

JSON формат (строго):
{"questions": [{"type":"mcq","topic":"тема","instruction":"текст задачи","options":{"A":"вариант1","B":"вариант2","C":"вариант3","D":"вариант4","E":"вариант5"},"correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная (не копируй из учебников)
- Меняй числа, формулировки и структуру
- 5 вариантов ответа (A-E)
- correct_answer: латинская буква A-E
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность${controlNote}${validationNote}
- Ответь ТОЛЬКО JSON, без пояснений`
      : `Сгенерируй ${actualCount} НОВЫХ уникальных задач по математике в формате ОРТ (сравнение величин) для тем: ${topicList}.

JSON формат (строго):
{"questions": [{"type":"comparison","topic":"тема","instruction":"условие или null","column_a":"выражение A","column_b":"выражение B","correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная (не копируй из учебников)
- Меняй числа, формулировки и структуру
- correct_answer: A (столбец A больше), B (столбец B больше), C (равны), D (невозможно определить)
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность${controlNote}${validationNote}
- Ответь ТОЛЬКО JSON, без пояснений`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты генератор математических задач для ОРТ. Отвечай ТОЛЬКО валидным JSON. Никаких пояснений. Каждая задача должна быть математически корректной — проверь решение перед выдачей." },
          { role: "user", content: prompt },
        ],
        temperature: isControl ? 0.6 : 0.8, // less randomness for control consistency
      }),
    });

    console.log(`[PRACTICE] AI status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[PRACTICE] AI_ERROR: ${aiResponse.status} ${errText}`);
      return new Response(JSON.stringify({ error: aiResponse.status === 429 ? 'Rate limit exceeded' : 'AI generation failed' }), {
        status: aiResponse.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';

    content = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
      ch === '\n' || ch === '\r' || ch === '\t' ? ch : ' '
    );
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[PRACTICE] No JSON in AI response");
      return new Response(JSON.stringify({ error: 'AI returned invalid format' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    } catch (e) {
      console.error("[PRACTICE] JSON parse failed", e);
      return new Response(JSON.stringify({ error: 'AI returned malformed JSON' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const questions = parsed.questions || [];
    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: 'AI generated 0 questions' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] Generated ${questions.length} questions`);

    // Save to practice_questions table
    const toInsert = questions.map((q: any) => ({
      user_id: userId,
      topic: q.topic || topics[0],
      question_type: q.type || formatType,
      question_data: q,
      correct_answer: q.correct_answer || 'A',
      source: isControl ? 'ai_control' : 'ai',
    }));

    const { error: insertError } = await supabase.from('practice_questions').insert(toInsert);
    if (insertError) {
      console.error("[PRACTICE] DB insert error:", insertError);
    }

    const totalLatency = Date.now() - startTs;
    console.log(`[PRACTICE] Done in ${totalLatency}ms`);

    return new Response(JSON.stringify({
      questions,
      source: 'ai',
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
