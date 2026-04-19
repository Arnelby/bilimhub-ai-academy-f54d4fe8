import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50;
const CONFIDENCE_THRESHOLD = 0.8;

const SYSTEM_PROMPT = `Ты классифицируешь математические задачи.

Формат входа:
- question_type: mcq | comparison
- instruction
- column_a
- column_b
- options (если mcq)

Задача: Определи качество задачи.

Правила:
- keep → задача понятна, решаема логически, без догадок
- remove → задача бессмысленная, неполная, некорректная
- review → есть сомнения

ВАЖНО:
- не решай задачу
- не исправляй
- только оцени`;

interface ClassifyResult {
  decision: "keep" | "remove" | "review";
  confidence: number;
  reason: string;
}

async function classifyOne(
  apiKey: string,
  question: { id: string; question_type: string; question_data: any }
): Promise<ClassifyResult | null> {
  const userContent = JSON.stringify({
    question_type: question.question_type,
    instruction: question.question_data?.instruction ?? null,
    column_a: question.question_data?.column_a ?? null,
    column_b: question.question_data?.column_b ?? null,
    options: question.question_data?.options ?? null,
  });

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_question",
              description: "Return classification decision",
              parameters: {
                type: "object",
                properties: {
                  decision: { type: "string", enum: ["keep", "remove", "review"] },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  reason: { type: "string" },
                },
                required: ["decision", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_question" } },
      }),
    });

    if (!resp.ok) {
      console.error(`[AI_REVIEW] AI error ${resp.status} for ${question.id}`);
      return null;
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return null;
    const args = JSON.parse(toolCall.function.arguments);
    return args as ClassifyResult;
  } catch (e) {
    console.error(`[AI_REVIEW] Exception for ${question.id}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Auth check + admin verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load review questions (limit 200 per run)
    const { data: questions, error: loadErr } = await supabase
      .from("practice_questions")
      .select("id, question_type, question_data")
      .eq("quality_status", "review")
      .limit(200);

    if (loadErr) throw loadErr;

    const total = questions?.length ?? 0;
    console.log(`[AI_REVIEW] Loaded ${total} review questions`);

    let kept = 0;
    let removed = 0;
    let skipped = 0;
    let failed = 0;
    const keepIds: string[] = [];
    const removeIds: string[] = [];

    // Process in batches of 50
    for (let i = 0; i < (questions ?? []).length; i += BATCH_SIZE) {
      const batch = questions!.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((q) => classifyOne(apiKey, q as any).then((r) => ({ id: q.id, r })))
      );

      for (const { id, r } of results) {
        if (!r) {
          failed++;
          continue;
        }
        if (r.confidence < CONFIDENCE_THRESHOLD) {
          skipped++;
          continue;
        }
        if (r.decision === "keep") {
          keepIds.push(id);
          kept++;
        } else if (r.decision === "remove") {
          removeIds.push(id);
          removed++;
        } else {
          skipped++;
        }
      }
      console.log(`[AI_REVIEW] Batch ${i / BATCH_SIZE + 1} done`);
    }

    // Apply updates
    if (keepIds.length > 0) {
      const { error } = await supabase
        .from("practice_questions")
        .update({ quality_status: "keep", quality_reason: "ai_classified" })
        .in("id", keepIds)
        .eq("quality_status", "review"); // safety: only touch review rows
      if (error) console.error("[AI_REVIEW] keep update error:", error);
    }
    if (removeIds.length > 0) {
      const { error } = await supabase
        .from("practice_questions")
        .update({ quality_status: "remove", quality_reason: "ai_classified" })
        .in("id", removeIds)
        .eq("quality_status", "review");
      if (error) console.error("[AI_REVIEW] remove update error:", error);
    }

    const summary = {
      total_processed: total,
      kept,
      removed,
      skipped_low_confidence: skipped,
      failed,
    };
    console.log("[AI_REVIEW]", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[AI_REVIEW] Fatal:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
