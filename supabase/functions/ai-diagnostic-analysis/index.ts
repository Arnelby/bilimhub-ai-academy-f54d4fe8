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
    const { mathAnswers, learningAnswers, psychologyAnswers, preferences, timeTaken, language } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an educational psychologist AI analyzing student diagnostic test results for ORT exam preparation in Kyrgyzstan.

Analyze the provided test data and generate a comprehensive learning profile. Your analysis should be detailed, actionable, and supportive.

Return ONLY valid JSON with this exact structure:
{
  "math_level": 1-5,
  "logic_score": 0-100,
  "problem_solving_score": 0-100,
  "speed_score": 0-100,
  "accuracy_score": 0-100,
  "learning_style": "visual" | "auditory" | "text-based" | "example-based" | "problem-driven" | "step-by-step",
  "visual_preference": 0-100,
  "auditory_preference": 0-100,
  "text_preference": 0-100,
  "example_preference": 0-100,
  "problem_driven_preference": 0-100,
  "step_by_step_preference": 0-100,
  "attention_level": 0-100,
  "stress_resistance": 0-100,
  "impulsiveness": 0-100,
  "consistency": 0-100,
  "patience": 0-100,
  "confidence": 0-100,
  "motivation_type": "achievement" | "intrinsic" | "social" | "practical",
  "summary": "A 2-3 sentence summary of the student's profile in ${language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English'}",
  "strengths": ["strength1", "strength2", "strength3"],
  "areas_to_improve": ["area1", "area2", "area3"],
  "recommended_study_approach": "Brief recommendation in ${language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English'}"
}`;

    const userPrompt = `Analyze this diagnostic test data:

MATH SECTION RESULTS:
${JSON.stringify(mathAnswers, null, 2)}

LEARNING STYLE RESPONSES:
${JSON.stringify(learningAnswers, null, 2)}

PSYCHOLOGICAL PROFILE RESPONSES:
${JSON.stringify(psychologyAnswers, null, 2)}

STATED PREFERENCES:
${JSON.stringify(preferences, null, 2)}

TIME TAKEN: ${timeTaken} seconds

Based on this data:
1. Calculate accurate scores for each metric
2. Determine the dominant learning style
3. Assess psychological traits
4. Provide personalized recommendations

Return the JSON analysis.`;

    console.log('Calling Lovable AI for diagnostic analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'API credits exhausted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Diagnostic analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-diagnostic-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
