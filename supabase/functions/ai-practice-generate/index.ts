import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTs = Date.now();
  console.log("[PRACTICE] PRACTICE_REQUEST_RECEIVED");

  try {
    // Auth
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
    const { weakTopics, questionCount = 8, formatType = 'comparison' } = body;

    if (!weakTopics || !Array.isArray(weakTopics) || weakTopics.length === 0) {
      return new Response(JSON.stringify({ error: 'weakTopics required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] User: ${userId}, Topics: ${weakTopics.join(', ')}, Format: ${formatType}, Count: ${questionCount}`);

    // Check cache — questions generated in last 2 hours for same topics
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twoHoursAgo)
      .in('topic', weakTopics)
      .order('created_at', { ascending: false })
      .limit(questionCount);

    if (cached && cached.length >= 3) {
      console.log(`[PRACTICE] PRACTICE_CACHE_FOUND: ${cached.length} questions`);
      return new Response(JSON.stringify({ questions: cached, source: 'cache' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AI Generation
    console.log("[PRACTICE] AI_GENERATION_STARTED");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[PRACTICE] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = formatType === 'mcq'
      ? `Сгенерируй ${questionCount} НОВЫХ уникальных задач по математике в формате ОРТ (множественный выбор) для тем: ${weakTopics.join(', ')}.

JSON формат (строго):
{"questions": [{"type":"mcq","topic":"тема","instruction":"текст задачи","options":{"A":"вариант1","B":"вариант2","C":"вариант3","D":"вариант4","E":"вариант5"},"correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная
- 5 вариантов ответа (A-E)
- correct_answer: латинская буква A-E
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность
- Ответь ТОЛЬКО JSON, без пояснений`
      : `Сгенерируй ${questionCount} НОВЫХ уникальных задач по математике в формате ОРТ (сравнение величин) для тем: ${weakTopics.join(', ')}.

JSON формат (строго):
{"questions": [{"type":"comparison","topic":"тема","instruction":"условие или null","column_a":"выражение A","column_b":"выражение B","correct_answer":"A"}]}

Требования:
- Каждая задача НОВАЯ и уникальная
- correct_answer: A (столбец A больше), B (столбец B больше), C (равны), D (невозможно определить)
- Стиль ОРТ экзамена Кыргызстана
- Разная сложность
- Ответь ТОЛЬКО JSON, без пояснений`;

    const aiStartTs = Date.now();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты генератор математических задач для ОРТ. Отвечай ТОЛЬКО валидным JSON. Никаких пояснений." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    const aiLatency = Date.now() - aiStartTs;
    console.log(`[PRACTICE] AI response status: ${aiResponse.status}, latency: ${aiLatency}ms`);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[PRACTICE] GEMINI_RESPONSE_ERROR: ${aiResponse.status} ${errText}`);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("[PRACTICE] GEMINI_RESPONSE_SUCCESS");

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';

    // Sanitize and parse JSON
    content = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) => 
      ch === '\n' || ch === '\r' || ch === '\t' ? ch : ' '
    );
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[PRACTICE] GEMINI_RESPONSE_ERROR: No JSON found in response");
      return new Response(JSON.stringify({ error: 'AI returned invalid format' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let jsonStr = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[PRACTICE] GEMINI_RESPONSE_ERROR: JSON parse failed", e);
      return new Response(JSON.stringify({ error: 'AI returned malformed JSON' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const questions = parsed.questions || [];
    if (questions.length === 0) {
      console.error("[PRACTICE] GEMINI_RESPONSE_ERROR: No questions in parsed JSON");
      return new Response(JSON.stringify({ error: 'AI generated 0 questions' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PRACTICE] GENERATED_QUESTIONS_RETURNED: ${questions.length}`);

    // Save to practice_questions table
    const toInsert = questions.map((q: any) => ({
      user_id: userId,
      topic: q.topic || weakTopics[0],
      question_type: q.type || formatType,
      question_data: q,
      correct_answer: q.correct_answer || 'A',
      source: 'ai',
    }));

    const { error: insertError } = await supabase
      .from('practice_questions')
      .insert(toInsert);

    if (insertError) {
      console.error("[PRACTICE] DB insert error:", insertError);
      // Still return questions even if save fails
    } else {
      console.log(`[PRACTICE] Saved ${toInsert.length} questions to practice_questions`);
    }

    const totalLatency = Date.now() - startTs;
    console.log(`[PRACTICE] Total latency: ${totalLatency}ms`);

    return new Response(JSON.stringify({ questions, source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[PRACTICE] FATAL_ERROR:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
