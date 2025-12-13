import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EXACT Q1-Q30 Topic Mapping for ORT Math Part 1
const QUESTION_TOPIC_MAPPING: Record<number, string[]> = {
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

// Consolidated topic categories for lesson mapping
const TOPIC_TO_LESSON: Record<string, string> = {
  "Decimal fractions": "Fractions",
  "Operations with decimals": "Fractions",
  "Operations with fractions": "Fractions",
  "Fractions": "Fractions",
  "Exponents": "Exponents",
  "Square root": "Exponents",
  "Simple equations": "Equations",
  "Order of operations": "Basic Operations",
  "Basic arithmetic operations": "Basic Operations",
  "Similarity": "Geometry",
  "Triangle angles": "Geometry",
  "Triangles": "Geometry",
  "Angles": "Geometry",
  "Sum of interior angles": "Geometry",
  "Trapezoid": "Geometry",
  "Rectangles": "Geometry",
  "3D geometry": "Geometry",
  "Coordinates": "Coordinate Geometry",
  "Inequalities": "Inequalities",
  "Comparing values": "Inequalities",
  "Range of numbers": "Inequalities",
  "Functions": "Functions",
  "Percentages": "Percentages",
  "Proportions": "Percentages",
  "Progressions": "Progressions",
  "Absolute value": "Absolute Value",
  "Logic": "Logic",
};

interface TopicMastery {
  correct: number;
  total: number;
  percentage: number;
  status: 'strong' | 'medium' | 'weak';
  statusEmoji: string;
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

    // 1️⃣ Group Questions by Topic & Calculate Performance
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    const lessonPerformance: Record<string, { correct: number; total: number }> = {};
    
    mathAnswers?.forEach((answer: any) => {
      const qNum = parseInt(answer.questionId?.replace('ort_', '') || '0');
      if (qNum < 1 || qNum > 30) return;
      
      const topics = QUESTION_TOPIC_MAPPING[qNum] || ['General'];
      
      topics.forEach(topic => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
        }
        topicPerformance[topic].total += 1;
        if (answer.correct) topicPerformance[topic].correct += 1;
        
        // Map to lesson
        const lesson = TOPIC_TO_LESSON[topic] || topic;
        if (!lessonPerformance[lesson]) {
          lessonPerformance[lesson] = { correct: 0, total: 0 };
        }
        lessonPerformance[lesson].total += 1;
        if (answer.correct) lessonPerformance[lesson].correct += 1;
      });
    });

    // 2️⃣ Calculate Mastery Percentage per Topic
    const topicMastery: Record<string, TopicMastery> = {};
    Object.entries(topicPerformance).forEach(([topic, data]) => {
      const percentage = Math.round((data.correct / data.total) * 100);
      let status: 'strong' | 'medium' | 'weak';
      let statusEmoji: string;
      
      if (percentage >= 80) {
        status = 'strong';
        statusEmoji = '🟢';
      } else if (percentage >= 50) {
        status = 'medium';
        statusEmoji = '🟡';
      } else {
        status = 'weak';
        statusEmoji = '🔴';
      }
      
      topicMastery[topic] = { ...data, percentage, status, statusEmoji };
    });

    // 3️⃣ Calculate Lesson Mastery
    const lessonMastery: Record<string, TopicMastery> = {};
    Object.entries(lessonPerformance).forEach(([lesson, data]) => {
      const percentage = Math.round((data.correct / data.total) * 100);
      let status: 'strong' | 'medium' | 'weak';
      let statusEmoji: string;
      
      if (percentage >= 80) {
        status = 'strong';
        statusEmoji = '🟢';
      } else if (percentage >= 50) {
        status = 'medium';
        statusEmoji = '🟡';
      } else {
        status = 'weak';
        statusEmoji = '🔴';
      }
      
      lessonMastery[lesson] = { ...data, percentage, status, statusEmoji };
    });

    // 4️⃣ Identify Weak Topics (ranked from weakest to strongest)
    const weakTopics = Object.entries(topicMastery)
      .filter(([_, data]) => data.status === 'weak')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic, data]) => ({ topic, ...data }));

    const mediumTopics = Object.entries(topicMastery)
      .filter(([_, data]) => data.status === 'medium')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic, data]) => ({ topic, ...data }));

    const strongTopics = Object.entries(topicMastery)
      .filter(([_, data]) => data.status === 'strong')
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .map(([topic, data]) => ({ topic, ...data }));

    // Calculate overall stats
    const totalQuestions = mathAnswers?.length || 0;
    const correctAnswers = mathAnswers?.filter((a: any) => a.correct).length || 0;
    const overallAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Learning style detection
    const styleCounts: Record<string, number> = {};
    learningAnswers?.forEach((a: any) => {
      (a.scales || []).forEach((scale: string) => {
        styleCounts[scale] = (styleCounts[scale] || 0) + 1;
      });
    });

    // Psychology trait scores
    const traitScores: Record<string, number> = {};
    psychologyAnswers?.forEach((a: any) => {
      if (a.trait && a.score !== undefined) {
        traitScores[a.trait] = a.score;
      }
    });

    // Build lesson progress visualization string
    const lessonProgressText = Object.entries(lessonMastery)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([lesson, data]) => `${lesson} — ${data.percentage}% ${data.statusEmoji}`)
      .join('\n');

    // Language selection for responses
    const langCode = language === 'kg' ? 'Kyrgyz' : language === 'ru' ? 'Russian' : 'English';

    const systemPrompt = `You are an expert educational AI inside an adaptive learning platform for ORT exam preparation.
Your task is to analyze the diagnostic test results and provide personalized learning recommendations.

CRITICAL RULES:
- Do NOT invent topics
- Do NOT guess results  
- Use ONLY the provided correctness data
- Always explain results clearly
- Always show percentages
- Always link weaknesses to lessons

STUDENT DATA:
Total Questions: ${totalQuestions}
Correct Answers: ${correctAnswers}
Overall Accuracy: ${overallAccuracy}%
Time Taken: ${timeTaken} seconds

TOPIC MASTERY (calculated from test):
${Object.entries(topicMastery).map(([topic, data]) => 
  `${topic}: ${data.percentage}% (${data.correct}/${data.total}) ${data.statusEmoji}`
).join('\n')}

LESSON PROGRESS:
${lessonProgressText}

WEAK TOPICS (priority order):
${weakTopics.map((t, i) => `${i + 1}. ${t.topic} — ${t.percentage}%`).join('\n') || 'None identified'}

MEDIUM TOPICS:
${mediumTopics.map(t => `${t.topic} — ${t.percentage}%`).join('\n') || 'None'}

STRONG TOPICS:
${strongTopics.map(t => `${t.topic} — ${t.percentage}%`).join('\n') || 'None'}

LEARNING STYLE PREFERENCES:
${JSON.stringify(styleCounts)}

PSYCHOLOGICAL TRAITS:
${JSON.stringify(traitScores)}

Return ONLY valid JSON with this exact structure:
{
  "math_level": [1-5 based on ${overallAccuracy}% accuracy],
  "accuracy_score": ${overallAccuracy},
  "logic_score": [0-100],
  "problem_solving_score": [0-100],
  "speed_score": [0-100 based on time],
  "learning_style": "[dominant style]",
  "visual_preference": [0-100],
  "auditory_preference": [0-100],
  "text_preference": [0-100],
  "example_preference": [0-100],
  "problem_driven_preference": [0-100],
  "step_by_step_preference": [0-100],
  "attention_level": [0-100],
  "stress_resistance": [0-100],
  "impulsiveness": [0-100],
  "consistency": [0-100],
  "patience": [0-100],
  "confidence": [0-100],
  "motivation_type": "[type]",
  "topic_mastery": ${JSON.stringify(Object.fromEntries(
    Object.entries(topicMastery).map(([k, v]) => [k, v.percentage])
  ))},
  "lesson_mastery": ${JSON.stringify(Object.fromEntries(
    Object.entries(lessonMastery).map(([k, v]) => [k, { percentage: v.percentage, status: v.status }])
  ))},
  "weak_topics": ${JSON.stringify(weakTopics.map(t => t.topic))},
  "medium_topics": ${JSON.stringify(mediumTopics.map(t => t.topic))},
  "strong_topics": ${JSON.stringify(strongTopics.map(t => t.topic))},
  "learning_priorities": [List weak topics in order from weakest to strongest],
  "personalized_analysis": {
    "strengths_description": "[2-3 sentences in ${langCode} about what student is good at based on strong topics]",
    "weaknesses_description": "[2-3 sentences in ${langCode} about what student struggles with based on weak topics]",
    "recommended_start_topic": "[First topic to study]",
    "study_order_explanation": "[Why this order is recommended in ${langCode}]",
    "motivational_message": "[Supportive, motivating message in ${langCode}]"
  },
  "adaptive_lesson_settings": {
    "emphasize_weak_subtopics": true,
    "reduce_theory_for_strong": true,
    "increase_practice_for_weak": true,
    "preferred_learning_mode": "[visual/auditory/text/practical/adhd_friendly]"
  },
  "estimated_ort_score": [100-200 estimate],
  "summary": "[Brief summary in ${langCode}]"
}`;

    const userPrompt = `Analyze this diagnostic test and provide personalized learning recommendations.

The student needs to understand:
1. What they are good at (with specific topics and percentages)
2. What they struggle with (with specific topics and percentages)
3. Which topic to start with and why
4. A supportive, motivating recommendation

Focus on being data-driven, supportive, and precise. No fluff.`;

    console.log('Calling AI for diagnostic analysis...');
    console.log(`Accuracy: ${overallAccuracy}%, Weak topics: ${weakTopics.length}, Strong topics: ${strongTopics.length}`);

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
      // Fallback to calculated values
      analysis = {
        math_level: Math.min(5, Math.max(1, Math.ceil((overallAccuracy / 100) * 5))),
        accuracy_score: overallAccuracy,
        topic_mastery: Object.fromEntries(
          Object.entries(topicMastery).map(([k, v]) => [k, v.percentage])
        ),
        lesson_mastery: Object.fromEntries(
          Object.entries(lessonMastery).map(([k, v]) => [k, { percentage: v.percentage, status: v.status }])
        ),
        weak_topics: weakTopics.map(t => t.topic),
        medium_topics: mediumTopics.map(t => t.topic),
        strong_topics: strongTopics.map(t => t.topic),
      };
    }

    // Ensure critical data is present
    if (!analysis.topic_mastery) {
      analysis.topic_mastery = Object.fromEntries(
        Object.entries(topicMastery).map(([k, v]) => [k, v.percentage])
      );
    }
    if (!analysis.lesson_mastery) {
      analysis.lesson_mastery = Object.fromEntries(
        Object.entries(lessonMastery).map(([k, v]) => [k, { percentage: v.percentage, status: v.status }])
      );
    }
    if (!analysis.weak_topics) analysis.weak_topics = weakTopics.map(t => t.topic);
    if (!analysis.medium_topics) analysis.medium_topics = mediumTopics.map(t => t.topic);
    if (!analysis.strong_topics) analysis.strong_topics = strongTopics.map(t => t.topic);

    // Add raw calculated data for frontend use
    analysis._calculated = {
      topicMastery,
      lessonMastery,
      weakTopics,
      mediumTopics,
      strongTopics,
      overallAccuracy,
      totalQuestions,
      correctAnswers,
    };

    console.log('Diagnostic analysis completed successfully');
    console.log(`Math level: ${analysis.math_level}, Weak topics: ${weakTopics.length}, Strong: ${strongTopics.length}`);

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
