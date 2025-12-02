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
      topic, 
      difficulty,
      questionCount,
      diagnosticProfile,
      language = 'ru' 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Generate all questions, options, and explanations in Russian.",
      kg: "Generate all questions, options, and explanations in Kyrgyz language.",
      en: "Generate all questions, options, and explanations in English."
    };

    const learningStyleAdaptation = diagnosticProfile?.prefers_examples 
      ? "Include practical examples in explanations." 
      : "Focus on theoretical explanations.";

    const prompt = `Generate ${questionCount || 5} ORT-style math questions for the topic: "${topic}"

Difficulty Level: ${difficulty || 2} (1=easy, 2=medium, 3=hard)
Student Learning Style: ${diagnosticProfile?.learning_style || 'balanced'}
${learningStyleAdaptation}

Generate questions in this exact JSON format:
{
  "questions": [
    {
      "questionText": "The question text with mathematical notation if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Detailed step-by-step explanation of the solution",
      "difficulty": 2,
      "subTopic": "Specific sub-topic within ${topic}"
    }
  ],
  "difficultyLevel": ${difficulty || 2},
  "estimatedMasteryImpact": 5,
  "topicCoverage": ["Sub-topic 1", "Sub-topic 2"],
  "tips": ["General tip for this topic"]
}

Requirements:
- Questions must be ORT exam style (multiple choice with 4 options)
- Each question should test a different aspect of the topic
- Explanations should be adapted to the student's learning style
- Include varying difficulty within the set
- Make sure correct answers are distributed across options (not always A)

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
          { role: "system", content: "You are an expert ORT exam question generator. Create high-quality, exam-realistic questions. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI mini-test error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate mini-test");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const miniTest = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("AI Mini-test generated successfully for topic:", topic);

    return new Response(JSON.stringify(miniTest), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mini-test generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
