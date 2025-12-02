import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      testHistory, 
      lessonProgress, 
      topicMastery, 
      errorPatterns,
      diagnosticProfile,
      language = 'ru' 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Respond entirely in Russian.",
      kg: "Respond entirely in Kyrgyz language.",
      en: "Respond entirely in English."
    };

    const prompt = `You are an advanced AI educational advisor for ORT exam preparation in Kyrgyzstan.

Analyze this student data and generate personalized recommendations:

TEST HISTORY: ${JSON.stringify(testHistory || [])}
LESSON PROGRESS: ${JSON.stringify(lessonProgress || [])}
TOPIC MASTERY: ${JSON.stringify(topicMastery || [])}
ERROR PATTERNS: ${JSON.stringify(errorPatterns || [])}
DIAGNOSTIC PROFILE: ${JSON.stringify(diagnosticProfile || {})}

Based on the diagnostic profile:
- Learning Style: ${diagnosticProfile?.learning_style || 'balanced'}
- Math Level: ${diagnosticProfile?.math_level || 1}
- Motivation Type: ${diagnosticProfile?.motivation_type || 'balanced'}
- Prefers Short Lessons: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Prefers Examples: ${diagnosticProfile?.prefers_examples ?? true}

Generate comprehensive recommendations in this exact JSON format:
{
  "weakTopics": [
    {"topic": "Topic Name", "mastery": 30, "priority": "high", "reason": "Why weak"}
  ],
  "recommendedLessons": [
    {"lessonId": "uuid-or-null", "title": "Lesson Title", "topic": "Topic", "reason": "Why recommended", "estimatedTime": "15 min"}
  ],
  "recommendedTopics": [
    {"topic": "Topic Name", "priority": "high", "reason": "Why focus on this"}
  ],
  "recommendedMiniTests": [
    {"topic": "Topic Name", "questionCount": 5, "difficulty": 2, "reason": "Why this mini-test"}
  ],
  "errorPatterns": [
    {"pattern": "Pattern description", "frequency": "high", "solution": "How to fix"}
  ],
  "motivationMessage": "Personalized motivation based on psychology profile",
  "predictedMastery": {
    "currentOverall": 45,
    "predictedIn2Weeks": 60,
    "predictedIn1Month": 75
  },
  "studyStrategy": "Detailed strategy based on learning style",
  "shortTermPlan": {
    "duration": "1 week",
    "goals": ["Goal 1", "Goal 2"],
    "dailyTasks": ["Task 1", "Task 2"]
  },
  "longTermPlan": {
    "duration": "1 month",
    "milestones": [
      {"week": 1, "goal": "Goal", "topics": ["Topic 1"]}
    ],
    "targetORTScore": 180
  }
}

Adapt recommendations to the student's learning style and psychological profile.
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
          { role: "system", content: "You are an expert educational AI that creates personalized learning recommendations. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI recommendations error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate recommendations");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const recommendations = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("AI Recommendations v2 generated successfully");

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
