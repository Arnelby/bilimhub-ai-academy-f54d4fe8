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
      messages, 
      context,
      diagnosticProfile,
      weakTopics,
      action,
      language = 'ru' 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstructions = {
      ru: "Respond entirely in Russian. Be friendly and supportive.",
      kg: "Respond entirely in Kyrgyz language. Be friendly and supportive.",
      en: "Respond entirely in English. Be friendly and supportive."
    };

    const learningStyleInstructions = {
      visual: "Use diagrams, visual descriptions, and spatial explanations.",
      auditory: "Use conversational tone, rhythmic explanations, and verbal cues.",
      'text-based': "Provide detailed written explanations with clear structure.",
      'example-based': "Always start with concrete examples before theory.",
      'problem-driven': "Present concepts through problem-solving scenarios.",
      'step-by-step': "Break down everything into small, numbered steps.",
      balanced: "Mix different explanation styles for comprehensive understanding."
    };

    const learningStyle = diagnosticProfile?.learning_style || 'balanced';
    const motivationType = diagnosticProfile?.motivation_type || 'balanced';

    let actionInstruction = "";
    if (action === 'explain_simpler') {
      actionInstruction = "The student wants a simpler explanation. Break it down into the most basic terms possible, use everyday analogies, and avoid any complex terminology.";
    } else if (action === 'give_example') {
      actionInstruction = "The student wants a practical example. Provide a clear, relatable example that demonstrates the concept with step-by-step working.";
    } else if (action === 'give_mini_test') {
      actionInstruction = "The student wants to practice. Generate 3 quick practice questions on this topic with answers and brief explanations.";
    }

    const systemPrompt = `You are BilimHub AI Tutor - a friendly, patient, and knowledgeable math tutor specializing in ORT exam preparation for students in Kyrgyzstan.

STUDENT PROFILE:
- Learning Style: ${learningStyle}
- Math Level: ${diagnosticProfile?.math_level || 1}/5
- Motivation Type: ${motivationType}
- Attention Level: ${diagnosticProfile?.attention_level || 50}/100
- Prefers Short Lessons: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Prefers Examples: ${diagnosticProfile?.prefers_examples ?? true}
- Weak Topics: ${JSON.stringify(weakTopics || [])}

CURRENT CONTEXT: ${JSON.stringify(context || {})}

YOUR TEACHING APPROACH:
${learningStyleInstructions[learningStyle as keyof typeof learningStyleInstructions] || learningStyleInstructions.balanced}

MOTIVATION STYLE:
${motivationType === 'achievement' ? 'Celebrate progress, use achievement-based language' : ''}
${motivationType === 'social' ? 'Use collaborative language, mention how others succeed' : ''}
${motivationType === 'intrinsic' ? 'Focus on the joy of understanding and mastery' : ''}
${motivationType === 'balanced' ? 'Mix achievement celebration with intrinsic motivation' : ''}

${actionInstruction}

GUIDELINES:
1. Always be encouraging and patient
2. Adapt explanations to the student's learning style
3. When explaining math, show step-by-step solutions
4. If the student is struggling, offer to explain simpler or give examples
5. Proactively suggest relevant lessons or mini-tests when appropriate
6. Keep responses concise but thorough
7. Use emojis sparingly to keep the tone friendly
8. If you don't know something, admit it honestly

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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI chat tutor error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI tutor unavailable");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat tutor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
