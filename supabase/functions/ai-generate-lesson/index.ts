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
    const { topic, learningStyle, studentResults, language = 'ru' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Respond entirely in Russian.",
      kg: "Respond entirely in Kyrgyz language.",
      en: "Respond entirely in English."
    };

    const styleInstructions: Record<string, string> = {
      visual: `Use diagrams descriptions, visual metaphors, spatial layout, arrows, color-coded steps. Format with clear visual separation, use bullet points and numbered lists.`,
      auditory: `Use spoken-style explanations ("Imagine you hear this…"). Write in a conversational, natural speech pattern as if explaining aloud.`,
      'text-based': `Provide detailed definitions, long thorough explanations, structured paragraphs with comprehensive coverage.`,
      'problem-solver': `Minimum theory (20%). Focus on exercises (80%) with step-by-step solutions. Practical tasks first.`,
      'adhd-friendly': `Ultra-short blocks (1-3 sentences max). Bullet points only. No heavy text. Immediate quick wins. Use emojis for engagement. Frequent breaks between sections.`
    };

    // Build personalized context from student results
    let studentContext = '';
    if (studentResults) {
      const { accuracy, weakAreas, strongAreas, recentMistakes, testsCompleted } = studentResults;
      studentContext = `
STUDENT PERFORMANCE DATA:
- Accuracy: ${accuracy || 0}%
- Tests Completed: ${testsCompleted || 0}
- Weak Areas: ${weakAreas?.length ? weakAreas.join(', ') : 'None identified yet'}
- Strong Areas: ${strongAreas?.length ? strongAreas.join(', ') : 'None identified yet'}
- Recent Mistakes: ${recentMistakes?.length ? recentMistakes.join(', ') : 'None'}

DIFFICULTY CALIBRATION:
${accuracy < 40 ? '→ Use VERY EASY examples and explanations' : 
  accuracy < 70 ? '→ Use MEDIUM difficulty with gradual progression' :
  accuracy < 90 ? '→ Use MIXED difficulty with some challenges' :
  '→ Use HARD problems to push growth'}
`;
    }

    const prompt = `You are an expert math tutor creating a PERSONALIZED adaptive lesson on "${topic}".

${studentContext}

LEARNING STYLE SELECTED: ${learningStyle}
STYLE REQUIREMENTS: ${styleInstructions[learningStyle] || styleInstructions['text-based']}

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}

CREATE A COMPLETE LESSON with this EXACT JSON structure:
{
  "status": "ok",
  "topic": "${topic}",
  "learning_style": "${learningStyle}",
  "lesson": {
    "introduction": "2-3 sentences greeting the student, acknowledging their weak areas if any, encouraging them, and briefly outlining what they'll learn",
    "core_lesson": "Main lesson content adapted to the ${learningStyle} learning style. This should be 3-5 paragraphs explaining the core concepts of ${topic} using the specified style approach.",
    "weakness_training": [
      {
        "area": "Name of weak area",
        "explanation": "Very short targeted explanation",
        "example": "One clear worked example",
        "exercises": ["Exercise 1", "Exercise 2"],
        "tip": "Quick tip to remember"
      }
    ],
    "practice_questions": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "Why this answer is correct"
      }
    ],
    "final_summary": "3 key rules/takeaways, one final challenge question"
  }
}

IMPORTANT:
- Generate 2-3 weakness_training items (even if no weak areas, cover common trouble spots)
- Generate 4-6 practice_questions at the appropriate difficulty
- Keep the ${learningStyle} style consistent throughout
- Make it engaging and encouraging
- Return ONLY valid JSON, no markdown`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert math teacher creating engaging personalized lessons. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI lesson generation error:", response.status, errorText);
      throw new Error("Failed to generate lesson");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const lesson = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("Personalized lesson generated for topic:", topic, "style:", learningStyle);

    return new Response(JSON.stringify(lesson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Lesson generation error:", error);
    return new Response(JSON.stringify({ 
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
