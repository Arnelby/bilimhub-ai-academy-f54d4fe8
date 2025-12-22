import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// MANDATORY Question → Topic Mapping (Q1-Q30)
// Every question MUST map to at least one topic
// ============================================
const QUESTION_TOPIC_MAP: Record<number, string[]> = {
  1: ["Decimal fractions"],
  2: ["Decimal fractions", "Operations with decimals"],
  3: ["Exponents"],
  4: ["Operations with fractions"],
  5: ["Simple equations"],
  6: ["Order of operations"],
  7: ["Fractions"],
  8: ["Similarity", "Triangle angles"],
  9: ["Operations with fractions"],
  10: ["Square root"],
  11: ["Angles", "Logic"],
  12: ["Coordinates"],
  13: ["Inequalities"],
  14: ["Comparing values"],
  15: ["Functions"],
  16: ["Percentages"],
  17: ["Progressions"],
  18: ["Basic arithmetic operations"],
  19: ["Exponents"],
  20: ["Absolute value"],
  21: ["Proportions"],
  22: ["Triangles"],
  23: ["Sum of interior angles"],
  24: ["Exponents"],
  25: ["Range of numbers"],
  26: ["Trapezoid"],
  27: ["Exponents"],
  28: ["Rectangles"],
  29: ["Logic"],
  30: ["3D geometry"],
};

// ============================================
// TOPIC COVERAGE VALIDATION
// Each topic should have at least 2 questions for reliable assessment
// Topics with < 2 questions get flagged for low confidence
// ============================================
const MINIMUM_QUESTIONS_PER_TOPIC = 2;

interface TopicPerformance {
  correct: number;
  total: number;
  avgTime: number;
  percentage: number;
  status: 'strong' | 'medium' | 'weak';
  lowConfidence: boolean; // Flag if < 2 questions
}

// ============================================
// MASTERY THRESHOLDS (STRICT)
// ============================================
const STRONG_THRESHOLD = 80;  // 80-100%
const MEDIUM_THRESHOLD = 50;  // 50-79%
// 0-49% = weak

// ============================================
// FALLBACK RULES for insufficient data
// ============================================
function applyFallbackRules(topicPerformance: Record<string, TopicPerformance>): void {
  Object.keys(topicPerformance).forEach(topic => {
    const perf = topicPerformance[topic];
    
    // Flag low confidence topics
    if (perf.total < MINIMUM_QUESTIONS_PER_TOPIC) {
      perf.lowConfidence = true;
      // For low confidence, be conservative - don't mark as strong
      if (perf.percentage >= STRONG_THRESHOLD && perf.total < 2) {
        perf.status = 'medium'; // Downgrade to medium due to insufficient data
      }
    }
  });
}

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

    // ============================================
    // VALIDATION: Check input data exists
    // ============================================
    if (!mathAnswers || !Array.isArray(mathAnswers) || mathAnswers.length === 0) {
      console.log("No math answers provided - returning minimal analysis");
      return new Response(JSON.stringify({
        analysis: {
          error: "insufficient_data",
          message: "No diagnostic answers provided",
          math_level: 1,
          accuracy_score: 0,
          topic_mastery: {},
          weak_topics: [],
          medium_topics: [],
          strong_topics: [],
          lesson_progress: [],
          overall_accuracy: 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 1️⃣ GROUP QUESTIONS BY TOPIC 
    // Using mandatory mapping, validate every question has mapping
    // ============================================
    const topicPerformance: Record<string, TopicPerformance> = {};
    const unmappedQuestions: number[] = [];
    
    mathAnswers.forEach((a: any) => {
      // Extract question number from questionId (e.g., "ort_1" -> 1)
      const qNumMatch = a.questionId?.match(/(\d+)$/);
      const qNum = qNumMatch ? parseInt(qNumMatch[1]) : null;
      
      // Validate question mapping exists
      if (!qNum || !QUESTION_TOPIC_MAP[qNum]) {
        if (qNum) unmappedQuestions.push(qNum);
        // Fallback: map to General topic
        const topics = ['General'];
        topics.forEach(topic => {
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0, avgTime: 0, percentage: 0, status: 'weak', lowConfidence: false };
          }
          topicPerformance[topic].total += 1;
          topicPerformance[topic].avgTime += a.timeTaken || 0;
          if (a.correct) topicPerformance[topic].correct += 1;
        });
      } else {
        // Get topics from mandatory mapping
        const topics = QUESTION_TOPIC_MAP[qNum];
        
        // Count for each topic (if question has multiple topics, count for each)
        topics.forEach(topic => {
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0, avgTime: 0, percentage: 0, status: 'weak', lowConfidence: false };
          }
          topicPerformance[topic].total += 1;
          topicPerformance[topic].avgTime += a.timeTaken || 0;
          if (a.correct) topicPerformance[topic].correct += 1;
        });
      }
    });

    // Log unmapped questions for debugging
    if (unmappedQuestions.length > 0) {
      console.warn(`Unmapped questions detected: ${unmappedQuestions.join(', ')}`);
    }
    
    // ============================================
    // 2️⃣ CALCULATE MASTERY PERCENTAGE per topic
    // Handle edge cases: 0 answers, partial data
    // ============================================
    Object.keys(topicPerformance).forEach(topic => {
      const perf = topicPerformance[topic];
      
      // Handle edge case: 0 answers
      if (perf.total === 0) {
        perf.avgTime = 0;
        perf.percentage = 0;
        perf.status = 'weak';
        perf.lowConfidence = true;
        return;
      }
      
      perf.avgTime = Math.round(perf.avgTime / perf.total);
      perf.percentage = Math.round((perf.correct / perf.total) * 100);
      
      // ============================================
      // 3️⃣ ASSIGN MASTERY STATUS (ONLY: Strong/Medium/Weak)
      // ============================================
      if (perf.percentage >= STRONG_THRESHOLD) {
        perf.status = 'strong';   // 🟢 Strong — 80–100%
      } else if (perf.percentage >= MEDIUM_THRESHOLD) {
        perf.status = 'medium';   // 🟡 Medium — 50–79%
      } else {
        perf.status = 'weak';     // 🔴 Weak — 0–49%
      }
    });

    // ============================================
    // APPLY FALLBACK RULES for insufficient data
    // ============================================
    applyFallbackRules(topicPerformance);

    // ============================================
    // 4️⃣ IDENTIFY WEAK TOPICS (ranked from weakest to strongest)
    // ============================================
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, p]) => p.status === 'weak')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic, p]) => ({ 
        topic, 
        percentage: p.percentage,
        questionCount: p.total,
        lowConfidence: p.lowConfidence 
      }));
    
    const mediumTopics = Object.entries(topicPerformance)
      .filter(([_, p]) => p.status === 'medium')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic, p]) => ({ 
        topic, 
        percentage: p.percentage,
        questionCount: p.total,
        lowConfidence: p.lowConfidence 
      }));
    
    const strongTopics = Object.entries(topicPerformance)
      .filter(([_, p]) => p.status === 'strong')
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .map(([topic, p]) => ({ 
        topic, 
        percentage: p.percentage,
        questionCount: p.total,
        lowConfidence: p.lowConfidence 
      }));

    // Pre-calculate overall metrics with edge case handling
    const totalMathQuestions = mathAnswers?.length || 0;
    const correctMathAnswers = mathAnswers?.filter((a: any) => a.correct).length || 0;
    const mathAccuracy = totalMathQuestions > 0 ? Math.round((correctMathAnswers / totalMathQuestions) * 100) : 0;

    // ============================================
    // 5️⃣ LESSON PROGRESS VISUALIZATION data
    // ============================================
    const lessonProgress = Object.entries(topicPerformance).map(([topic, p]) => ({
      lesson: topic,
      mastery: p.percentage,
      status: p.status,
      statusEmoji: p.status === 'strong' ? '🟢' : p.status === 'medium' ? '🟡' : '🔴',
      questionCount: p.total,
      lowConfidence: p.lowConfidence
    }));

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

    // ============================================
    // 6️⃣ AI PERSONALIZED LEARNING OUTPUT
    // ============================================
    const systemPrompt = `You are an expert educational AI that provides personalized, supportive learning feedback.

Your analysis must be:
- Supportive and motivating
- Precise with no fluff  
- Always show percentages
- Always link weaknesses to lessons

MANDATORY OUTPUT RULES:
1. Use ONLY the topic data provided - DO NOT invent topics
2. Use ONLY the correctness data provided - DO NOT guess results
3. Always explain results clearly with percentages
4. Link every weakness to a specific lesson/topic

TOPIC MASTERY DATA (calculated from the 30-question diagnostic):
${Object.entries(topicPerformance).map(([topic, p]) => 
  `- ${topic}: ${p.percentage}% (${p.correct}/${p.total}) ${p.status === 'strong' ? '🟢 Strong' : p.status === 'medium' ? '🟡 Medium' : '🔴 Weak'}${p.lowConfidence ? ' ⚠️ Low confidence' : ''}`
).join('\n')}

WEAK TOPICS (learning priorities, ranked weakest first):
${weakTopics.length > 0 ? weakTopics.map(t => `- ${t.topic}: ${t.percentage}%`).join('\n') : 'None'}

STRONG TOPICS:
${strongTopics.length > 0 ? strongTopics.map(t => `- ${t.topic}: ${t.percentage}%`).join('\n') : 'None'}

OVERALL ACCURACY: ${mathAccuracy}% (${correctMathAnswers}/${totalMathQuestions} correct)

Generate output in ${language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English'}.

Return ONLY valid JSON with this structure:
{
  "math_level": [1-5 based on ${mathAccuracy}%: 1=0-20%, 2=21-40%, 3=41-60%, 4=61-80%, 5=81-100%],
  "accuracy_score": ${mathAccuracy},
  "logic_score": [0-100],
  "problem_solving_score": [0-100],
  "speed_score": [0-100],
  "learning_style": "[dominant style from responses]",
  "visual_preference": [0-100],
  "auditory_preference": [0-100],
  "text_preference": [0-100],
  "example_preference": [0-100],
  "problem_driven_preference": [0-100],
  "step_by_step_preference": [0-100],
  "attention_level": [from psychology],
  "stress_resistance": [from psychology],
  "impulsiveness": [from psychology],
  "consistency": [from psychology],
  "patience": [from psychology],
  "confidence": [from psychology],
  "motivation_type": "[type]",
  "personalized_summary": "[Student-friendly 2-3 sentences: what they're good at, what they struggle with, what topic to start with, why this order]",
  "strengths_explanation": "[What the student is good at based on strong topics]",
  "weaknesses_explanation": "[What the student struggles with based on weak topics]",
  "recommended_start_topic": "[Which topic to start with - the weakest one]",
  "recommendation_reasoning": "[Why this order is recommended]",
  "estimated_ort_score": [100-200]
}`;

    const userPrompt = `Analyze this diagnostic test and generate personalized learning feedback:

MATH ANSWERS (30 questions):
${JSON.stringify(mathAnswers, null, 2)}

LEARNING STYLE RESPONSES:
${JSON.stringify(learningAnswers, null, 2)}
Style Counts: ${JSON.stringify(styleCounts)}

PSYCHOLOGY RESPONSES:
${JSON.stringify(psychologyAnswers, null, 2)}
Trait Scores: ${JSON.stringify(traitScores)}

PREFERENCES:
${JSON.stringify(preferences, null, 2)}

TIME: ${timeTaken} seconds total

Generate supportive, precise feedback focusing on their weakest topics first.`;

    console.log('Calling AI for diagnostic analysis...');
    console.log(`Accuracy: ${mathAccuracy}%, Weak: ${weakTopics.length}, Medium: ${mediumTopics.length}, Strong: ${strongTopics.length}`);

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

    // ============================================
    // ENSURE ALL MANDATORY CALCULATED DATA IS INCLUDED
    // (These are NOT from AI - they are calculated server-side)
    // ============================================
    analysis.topic_mastery = {};
    Object.entries(topicPerformance).forEach(([topic, p]) => {
      analysis.topic_mastery[topic] = {
        percentage: p.percentage,
        correct: p.correct,
        total: p.total,
        status: p.status,
        lowConfidence: p.lowConfidence
      };
    });
    
    // Save the topic performance for the learning plan
    analysis.topicPerformance = topicPerformance;
    
    analysis.weak_topics = weakTopics;
    analysis.medium_topics = mediumTopics;
    analysis.strong_topics = strongTopics;
    analysis.lesson_progress = lessonProgress;
    analysis.overall_accuracy = mathAccuracy;
    
    // Data quality flags
    analysis.data_quality = {
      totalQuestions: totalMathQuestions,
      unmappedQuestions: unmappedQuestions.length,
      lowConfidenceTopics: Object.values(topicPerformance).filter(p => p.lowConfidence).length,
    };

    // ============================================
    // 7️⃣ ADAPTIVE LESSON BEHAVIOR data
    // ============================================
    analysis.adaptive_settings = {
      emphasize_weak_subtopics: weakTopics.map(t => t.topic),
      reduce_theory_for: strongTopics.map(t => t.topic),
      increase_practice_for: [...weakTopics, ...mediumTopics].map(t => t.topic),
      learning_mode: styleCounts.visual > (styleCounts.text || 0) ? 'visual' :
                     styleCounts.auditory > (styleCounts.text || 0) ? 'auditory' :
                     styleCounts.problem_driven > (styleCounts.text || 0) ? 'practical' :
                     'text-based'
    };

    // ============================================
    // 8️⃣ MINI-TEST RECOMMENDATIONS for each weak topic
    // ============================================
    analysis.recommended_mini_tests = weakTopics.map(t => ({
      topic: t.topic,
      questionCount: 5,
      difficulty: t.percentage < 25 ? 1 : t.percentage < 50 ? 2 : 2,
      priority: 'high',
      reason: `Low mastery (${t.percentage}%) requires focused practice`
    }));

    console.log('Diagnostic analysis completed successfully');
    console.log(`Math level: ${analysis.math_level}, Weak topics: ${weakTopics.length}, ORT: ${analysis.estimated_ort_score}`);

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
