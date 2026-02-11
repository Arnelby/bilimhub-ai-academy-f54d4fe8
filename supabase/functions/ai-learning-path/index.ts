import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateObject, validateNumber, validateLanguage } from "../_shared/validation.ts";
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
    const testResults = validateObject(body.testResults, 'testResults');
    const topicProgress = validateObject(body.topicProgress, 'topicProgress');
    const currentLevel = validateNumber(body.currentLevel, 1, 1, 5);
    const language = validateLanguage(body.language);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Respond entirely in Russian.",
      kg: "Respond entirely in Kyrgyz language.",
      en: "Respond entirely in English."
    };

    const prompt = `Create a personalized ORT math learning path based on this student data:

Test Results: ${JSON.stringify(testResults || {})}
Topic Progress: ${JSON.stringify(topicProgress || {})}
Current Level: ${currentLevel || 1}

Generate a learning path with this JSON structure:
{
  "summary": "Brief assessment of current state",
  "weakTopics": ["Topic 1", "Topic 2"],
  "strongTopics": ["Topic 1", "Topic 2"],
  "recommendedPath": [
    {
      "order": 1,
      "topic": "Topic name",
      "reason": "Why this topic",
      "estimatedTime": "2 hours",
      "priority": "high"
    }
  ],
  "weeklyGoals": [
    {
      "week": 1,
      "goals": ["Goal 1", "Goal 2"],
      "topics": ["Topic 1", "Topic 2"]
    }
  ],
  "motivationalMessage": "Encouraging message",
  "estimatedTimeToTarget": "4 weeks"
}

Prioritize weak areas while maintaining engagement.
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
          { role: "system", content: "You are an educational AI that creates personalized learning paths. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI learning path error:", response.status);
      throw new Error("Failed to generate learning path");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const learningPath = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("Learning path generated");

    return new Response(JSON.stringify(learningPath), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Learning path error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
