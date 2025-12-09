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

    // Pre-calculate key metrics for the AI
    const totalMathQuestions = mathAnswers?.length || 0;
    const correctMathAnswers = mathAnswers?.filter((a: any) => a.correct).length || 0;
    const mathAccuracy = totalMathQuestions > 0 ? Math.round((correctMathAnswers / totalMathQuestions) * 100) : 0;
    
    // Calculate topic-level performance
    const topicPerformance: Record<string, { correct: number; total: number; avgTime: number }> = {};
    mathAnswers?.forEach((a: any) => {
      const topic = a.topic || 'general';
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0, avgTime: 0 };
      }
      topicPerformance[topic].total += 1;
      topicPerformance[topic].avgTime += a.timeTaken || 0;
      if (a.correct) topicPerformance[topic].correct += 1;
    });
    
    // Calculate averages
    Object.keys(topicPerformance).forEach(topic => {
      topicPerformance[topic].avgTime = Math.round(topicPerformance[topic].avgTime / topicPerformance[topic].total);
    });

    // Identify weak and strong topics
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, p]) => (p.correct / p.total) < 0.5)
      .map(([topic]) => topic);
    
    const strongTopics = Object.entries(topicPerformance)
      .filter(([_, p]) => (p.correct / p.total) >= 0.75)
      .map(([topic]) => topic);

    // Calculate difficulty-weighted score
    let difficultyScore = 0;
    mathAnswers?.forEach((a: any) => {
      if (a.correct) {
        difficultyScore += (a.difficulty || 1) * 10;
      }
    });

    // Analyze learning style preferences
    const styleCounts: Record<string, number> = {};
    learningAnswers?.forEach((a: any) => {
      (a.scales || []).forEach((scale: string) => {
        styleCounts[scale] = (styleCounts[scale] || 0) + 1;
      });
    });

    // Analyze psychology traits
    const traitScores: Record<string, number> = {};
    psychologyAnswers?.forEach((a: any) => {
      if (a.trait && a.score !== undefined) {
        traitScores[a.trait] = a.score;
      }
    });

    const systemPrompt = `You are an expert educational psychologist AI analyzing ORT exam diagnostic results.

Your analysis must be STRICTLY DATA-DRIVEN. Every score and conclusion must be based on the actual test performance data provided.

ANALYSIS REQUIREMENTS:
1. Math level (1-5) must be calculated from actual accuracy: ${mathAccuracy}% correct
2. Learning style must be determined from the learning style responses
3. Psychological traits must come from the psychology assessment
4. Strengths and weaknesses must reference specific topics from the test

PRE-CALCULATED DATA:
- Total Math Questions: ${totalMathQuestions}
- Correct Answers: ${correctMathAnswers}
- Accuracy: ${mathAccuracy}%
- Difficulty Score: ${difficultyScore}
- Weak Topics: ${weakTopics.join(', ') || 'None identified'}
- Strong Topics: ${strongTopics.join(', ') || 'None identified'}
- Total Time: ${timeTaken} seconds
- Average Time Per Question: ${totalMathQuestions > 0 ? Math.round(timeTaken / totalMathQuestions) : 0} seconds

Return ONLY valid JSON with this exact structure:
{
  "math_level": [1-5 based on ${mathAccuracy}% accuracy: 1=0-20%, 2=21-40%, 3=41-60%, 4=61-80%, 5=81-100%],
  "logic_score": [0-100 based on difficulty-weighted performance],
  "problem_solving_score": [0-100],
  "speed_score": [0-100 based on time taken],
  "accuracy_score": ${mathAccuracy},
  "learning_style": "[most frequent from responses]",
  "visual_preference": [0-100],
  "auditory_preference": [0-100],
  "text_preference": [0-100],
  "example_preference": [0-100],
  "problem_driven_preference": [0-100],
  "step_by_step_preference": [0-100],
  "attention_level": [from psychology: ${traitScores.attention_level || 'calculate'}],
  "stress_resistance": [from psychology: ${traitScores.stress_resistance || 'calculate'}],
  "impulsiveness": [from psychology: ${traitScores.impulsiveness || 'calculate'}],
  "consistency": [from psychology: ${traitScores.consistency || 'calculate'}],
  "patience": [from psychology: ${traitScores.patience || 'calculate'}],
  "confidence": [from psychology: ${traitScores.confidence || 'calculate'}],
  "motivation_type": "[from psychology responses]",
  "topic_mastery": {
    ${Object.entries(topicPerformance).map(([topic, p]) => 
      `"${topic}": ${Math.round((p.correct / p.total) * 100)}`
    ).join(',\n    ')}
  },
  "weak_topics": ${JSON.stringify(weakTopics)},
  "strong_topics": ${JSON.stringify(strongTopics)},
  "summary": "[2-3 sentence personalized summary in ${language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English'}]",
  "strengths": ["strength1 based on strong topics", "strength2", "strength3"],
  "areas_to_improve": ["area1 based on weak topics", "area2", "area3"],
  "recommended_study_approach": "[Specific recommendation in ${language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English'}]",
  "estimated_ort_score": [100-200 estimate based on performance]
}`;

    const userPrompt = `Analyze this complete diagnostic test data:

MATH SECTION DETAILED RESULTS:
${JSON.stringify(mathAnswers, null, 2)}

TOPIC PERFORMANCE BREAKDOWN:
${JSON.stringify(topicPerformance, null, 2)}

LEARNING STYLE RESPONSES:
${JSON.stringify(learningAnswers, null, 2)}
Style Counts: ${JSON.stringify(styleCounts)}

PSYCHOLOGICAL PROFILE RESPONSES:
${JSON.stringify(psychologyAnswers, null, 2)}
Trait Scores: ${JSON.stringify(traitScores)}

STATED PREFERENCES:
${JSON.stringify(preferences, null, 2)}

TIME ANALYSIS:
- Total Time: ${timeTaken} seconds
- Average per question: ${totalMathQuestions > 0 ? Math.round(timeTaken / totalMathQuestions) : 0} seconds

Generate the analysis JSON with all scores calculated from this data.`;

    console.log('Calling AI for diagnostic analysis...');
    console.log(`Math accuracy: ${mathAccuracy}%, Weak topics: ${weakTopics.length}, Strong topics: ${strongTopics.length}`);

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

    // Ensure we have the pre-calculated topic data in the response
    if (!analysis.topic_mastery) {
      analysis.topic_mastery = {};
      Object.entries(topicPerformance).forEach(([topic, p]) => {
        analysis.topic_mastery[topic] = Math.round((p.correct / p.total) * 100);
      });
    }
    if (!analysis.weak_topics) analysis.weak_topics = weakTopics;
    if (!analysis.strong_topics) analysis.strong_topics = strongTopics;

    console.log('Diagnostic analysis completed successfully');
    console.log(`Math level: ${analysis.math_level}, Estimated ORT: ${analysis.estimated_ort_score}`);

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