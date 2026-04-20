import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ADMIN_TOKEN = Deno.env.get("APPLY_EXPL_TOKEN") ?? "expl-2026-04-apply";
    const auth = req.headers.get("x-admin-token");
    if (auth !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rows: Array<Record<string, string | null>> = body.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "rows required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const r of rows) {
      const id = r.id;
      if (!id) { skipped++; continue; }

      const { data: cur, error: selErr } = await supabase
        .from("practice_questions")
        .select("correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d, explanation_e")
        .eq("id", id)
        .maybeSingle();

      if (selErr || !cur) { errors.push(`select ${id}: ${selErr?.message ?? "missing"}`); continue; }

      const patch: Record<string, string> = {};
      const fields = ["correct_explanation","explanation_a","explanation_b","explanation_c","explanation_d","explanation_e"] as const;
      for (const f of fields) {
        if (!cur[f] && r[f]) patch[f] = r[f] as string;
      }
      if (Object.keys(patch).length === 0) { skipped++; continue; }

      const { error: updErr } = await supabase
        .from("practice_questions")
        .update(patch)
        .eq("id", id);
      if (updErr) {
        errors.push(`update ${id}: ${updErr.message}`);
      } else {
        updated++;
      }
    }

    return new Response(JSON.stringify({ updated, skipped, errors: errors.slice(0, 10), errorCount: errors.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
