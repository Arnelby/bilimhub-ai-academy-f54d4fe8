import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateArray, validateString, validationError } from "../_shared/validation.ts";

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
    const testAttemptId = validateString(body.testAttemptId, 'testAttemptId', 100);
    const answers = validateArray(body.answers, 'answers', 200);
    const questions = validateArray(body.questions, 'questions', 200);
    if (questions.length === 0) {
      return validationError('questions must not be empty');
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate basic statistics
    let correct = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q: any, index: number) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correct_option;
      
      if (isCorrect) correct++;
      
      const topicId = q.topic_id || 'general';
      if (!topicPerformance[topicId]) {
        topicPerformance[topicId] = { correct: 0, total: 0 };
      }
      topicPerformance[topicId].total++;
      if (isCorrect) topicPerformance[topicId].correct++;
    });

    const score = Math.round((correct / questions.length) * 100);

    // Generate AI analysis
    const analysisPrompt = `Analyze this ORT test performance and provide personalized feedback:

Test Results:
- Score: ${score}% (${correct}/${questions.length} correct)
- Topic Performance: ${JSON.stringify(topicPerformance)}

Questions answered incorrectly:
${questions.filter((q: any, i: number) => answers[i] !== q.correct_option).map((q: any) => `- ${q.question_text}`).join('\n')}

Provide:
1. Brief overall assessment (2-3 sentences)
2. List of 2-3 strong areas
3. List of 2-3 areas needing improvement
4. 3 specific recommendations for improvement
5. Motivational message

Respond in Russian. Format as JSON with keys: assessment, strengths, weaknesses, recommendations, motivation`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an educational AI that analyzes test results. Always respond with valid JSON." },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI analysis error:", response.status);
      throw new Error("Failed to generate AI analysis");
    }

    const aiData = await response.json();
    let analysis;
    
    try {
      const content = aiData.choices[0].message.content;
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      analysis = {
        assessment: "Тест завершен. Продолжайте практиковаться для улучшения результатов.",
        strengths: ["Завершение теста"],
        weaknesses: ["Требуется больше практики"],
        recommendations: ["Повторите пройденный материал", "Решайте больше практических задач"],
        motivation: "Каждый шаг вперед - это прогресс! Продолжайте учиться!"
      };
    }

    const result = {
      score,
      correct,
      total: questions.length,
      topicPerformance,
      analysis,
    };

    console.log("Test analysis completed:", { score, correct, total: questions.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
