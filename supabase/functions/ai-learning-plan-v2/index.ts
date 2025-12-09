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
      diagnosticProfile,
      language = 'ru' 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract key information from diagnostic profile
    const targetORTScore = diagnosticProfile?.target_ort_score || 170;
    const examDate = diagnosticProfile?.exam_date;
    const monthsUntilExam = diagnosticProfile?.months_until_exam || 6;
    const gradeLevel = diagnosticProfile?.grade_level || 'unknown';
    const mathLevel = diagnosticProfile?.math_level || 1;
    const learningStyle = diagnosticProfile?.learning_style || 'balanced';
    
    // Calculate time remaining
    let weeksRemaining = monthsUntilExam * 4;
    if (examDate) {
      const examDateObj = new Date(examDate);
      const now = new Date();
      const diffMs = examDateObj.getTime() - now.getTime();
      weeksRemaining = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
    }

    // Calculate current estimated ORT score from diagnostic
    const currentORTScore = Math.round(100 + (mathLevel * 20) + (diagnosticProfile?.accuracy_score || 50) * 0.5);
    const scoreGap = targetORTScore - currentORTScore;
    
    // Calculate required intensity based on score gap and time
    const pointsPerWeek = scoreGap / weeksRemaining;
    let intensity = 'moderate';
    let hoursPerDay = 2;
    if (pointsPerWeek > 5) {
      intensity = 'intensive';
      hoursPerDay = 3;
    } else if (pointsPerWeek > 3) {
      intensity = 'high';
      hoursPerDay = 2.5;
    } else if (pointsPerWeek < 1) {
      intensity = 'relaxed';
      hoursPerDay = 1.5;
    }

    // Build topic mastery map for AI
    const topicMasteryMap = (topicMastery || []).reduce((acc: any, t: any) => {
      acc[t.topic_id || t.title] = {
        mastery: t.progress_percentage || 0,
        level: t.mastery || 'not_attempted'
      };
      return acc;
    }, {});

    // Analyze test history for weak topics
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    (testHistory || []).forEach((test: any) => {
      const answers = test.answers || [];
      answers.forEach((a: any) => {
        const topic = a.topic || 'general';
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
        }
        topicPerformance[topic].total += 1;
        if (a.correct) topicPerformance[topic].correct += 1;
      });
    });

    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.total > 0 && (perf.correct / perf.total) < 0.6)
      .map(([topic, perf]) => ({
        topic,
        accuracy: Math.round((perf.correct / perf.total) * 100),
        questionsAttempted: perf.total
      }));

    const languageInstructions = {
      ru: "Respond entirely in Russian.",
      kg: "Respond entirely in Kyrgyz language.",
      en: "Respond entirely in English."
    };

    const prompt = `You are an expert ORT exam preparation AI creating a STRICTLY DATA-DRIVEN personalized learning plan.

CRITICAL: This plan must be based ONLY on the diagnostic data provided. No generic templates. Every recommendation must trace back to specific data points.

=== STUDENT DIAGNOSTIC DATA ===

CURRENT LEVEL:
- Math Level: ${mathLevel}/5
- Logic Score: ${diagnosticProfile?.logic_score || 0}/100
- Problem Solving: ${diagnosticProfile?.problem_solving_score || 0}/100
- Speed Score: ${diagnosticProfile?.speed_score || 0}/100
- Accuracy Score: ${diagnosticProfile?.accuracy_score || 0}/100

GOALS:
- Target ORT Score: ${targetORTScore}
- Current Estimated Score: ${currentORTScore}
- Score Gap to Close: ${scoreGap} points
- Exam Date: ${examDate || 'Not specified'}
- Months Until Exam: ${monthsUntilExam}
- Weeks Remaining: ${weeksRemaining}
- Grade Level: ${gradeLevel}
- Required Intensity: ${intensity} (${hoursPerDay}h/day)
- Points to Gain Per Week: ${pointsPerWeek.toFixed(1)}

LEARNING PROFILE:
- Dominant Learning Style: ${learningStyle}
- Visual Preference: ${diagnosticProfile?.visual_preference || 50}%
- Auditory Preference: ${diagnosticProfile?.auditory_preference || 50}%
- Text Preference: ${diagnosticProfile?.text_preference || 50}%
- Example Preference: ${diagnosticProfile?.example_preference || 50}%
- Problem-Driven Preference: ${diagnosticProfile?.problem_driven_preference || 50}%
- Step-by-Step Preference: ${diagnosticProfile?.step_by_step_preference || 50}%

PSYCHOLOGICAL PROFILE:
- Attention Level: ${diagnosticProfile?.attention_level || 50}%
- Stress Resistance: ${diagnosticProfile?.stress_resistance || 50}%
- Impulsiveness: ${diagnosticProfile?.impulsiveness || 50}%
- Consistency: ${diagnosticProfile?.consistency || 50}%
- Patience: ${diagnosticProfile?.patience || 50}%
- Confidence: ${diagnosticProfile?.confidence || 50}%
- Motivation Type: ${diagnosticProfile?.motivation_type || 'balanced'}

LEARNING PREFERENCES:
- Prefers Short Lessons: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Prefers Examples: ${diagnosticProfile?.prefers_examples ?? true}
- Prefers Quizzes: ${diagnosticProfile?.prefers_quizzes ?? true}
- Prefers Step-by-Step: ${diagnosticProfile?.prefers_step_by_step ?? true}

TOPIC MASTERY MAP:
${JSON.stringify(topicMasteryMap, null, 2)}

WEAK TOPICS FROM TEST HISTORY:
${JSON.stringify(weakTopics, null, 2)}

=== PLAN REQUIREMENTS ===

1. TIMELINE: Create a ${weeksRemaining}-week plan with ${intensity} intensity
2. FOCUS: Prioritize weak topics identified in the data
3. ADAPT: Match lesson format to learning style (${learningStyle})
4. PSYCHOLOGY: Account for ${diagnosticProfile?.attention_level || 50}% attention span and ${diagnosticProfile?.stress_resistance || 50}% stress resistance
5. GOAL: Achieve ${targetORTScore}+ ORT score from current ${currentORTScore}

Generate a comprehensive plan in this exact JSON format:
{
  "planData": {
    "title": "Personalized ORT Plan for ${targetORTScore}+ Score",
    "createdFor": "Student",
    "totalDuration": "${weeksRemaining} weeks",
    "intensity": "${intensity}",
    "basedOn": {
      "diagnosticMathLevel": ${mathLevel},
      "currentScore": ${currentORTScore},
      "targetScore": ${targetORTScore},
      "scoreGap": ${scoreGap},
      "weakTopicsCount": ${weakTopics.length}
    }
  },
  "schedule": {
    "weeklyHours": ${Math.round(hoursPerDay * 6)},
    "dailyHours": ${hoursPerDay},
    "dailySchedule": {
      "monday": {"topics": ["Priority topic based on weakness"], "duration": "${hoursPerDay}h", "activities": ["Adapted to learning style"]},
      "tuesday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "wednesday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "thursday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "friday": {"topics": ["..."], "duration": "${hoursPerDay}h", "activities": ["..."]},
      "saturday": {"topics": ["Review + Test"], "duration": "${hoursPerDay}h", "activities": ["Full practice test"]},
      "sunday": {"topics": [], "duration": "0h", "activities": ["Rest"]}
    }
  },
  "targetTopics": [
    {"topic": "Topic from weak areas", "currentMastery": 30, "targetMastery": 80, "priority": "high", "weeksToComplete": 2, "basedOn": "diagnostic accuracy X%"}
  ],
  "dailyTasks": [
    {"day": 1, "tasks": ["Specific tasks based on profile"], "estimatedTime": "${hoursPerDay}h", "focusTopic": "Weakest topic"}
  ],
  "miniTests": [
    {"week": 1, "day": 3, "topic": "Topic", "questionCount": 5, "purpose": "Verify improvement in weak area"}
  ],
  "predictedTimeline": {
    "week1": {"expectedMastery": X, "expectedScore": ${currentORTScore + Math.round(pointsPerWeek)}, "focusAreas": ["..."], "milestone": "Foundation"},
    "week${Math.ceil(weeksRemaining/2)}": {"expectedMastery": X, "expectedScore": ${currentORTScore + Math.round(scoreGap/2)}, "focusAreas": ["..."], "milestone": "Halfway"},
    "week${weeksRemaining}": {"expectedMastery": X, "expectedScore": ${targetORTScore}, "focusAreas": ["..."], "milestone": "Goal reached"}
  },
  "masteryGoals": {
    "shortTerm": {"duration": "2 weeks", "targetScore": ${currentORTScore + Math.round(pointsPerWeek * 2)}, "keyTopics": ["From weak topics"]},
    "mediumTerm": {"duration": "${Math.ceil(weeksRemaining/2)} weeks", "targetScore": ${currentORTScore + Math.round(scoreGap/2)}, "keyTopics": ["..."]},
    "longTerm": {"duration": "${weeksRemaining} weeks", "targetScore": ${targetORTScore}, "keyTopics": ["All topics mastered"]}
  },
  "ortScoreProjection": {
    "current": ${currentORTScore},
    "in2Weeks": ${currentORTScore + Math.round(pointsPerWeek * 2)},
    "in1Month": ${currentORTScore + Math.round(pointsPerWeek * 4)},
    "final": ${targetORTScore},
    "confidence": "${scoreGap < 30 ? 'high' : scoreGap < 50 ? 'medium' : 'challenging'}",
    "factors": ["Based on diagnostic math level ${mathLevel}", "Account for ${weeksRemaining} weeks prep time"]
  },
  "learningStrategy": "Detailed strategy matching ${learningStyle} learning style with ${hoursPerDay}h daily commitment",
  "adaptations": {
    "forLearningStyle": "Specific adaptations for ${learningStyle} learner",
    "forPsychology": "Account for ${diagnosticProfile?.attention_level || 50}% attention, ${diagnosticProfile?.stress_resistance || 50}% stress resistance",
    "forMotivation": "Tailored for ${diagnosticProfile?.motivation_type || 'balanced'} motivation type"
  },
  "warnings": ["Any concerns based on the data - time constraints, large score gap, etc."],
  "motivationalMilestones": [
    {"week": 2, "reward": "Celebration", "achievement": "First score improvement verified"}
  ]
}

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}

CRITICAL: Every number and recommendation must be calculated from the diagnostic data provided. No placeholder values.`;

    console.log("Generating data-driven learning plan...");
    console.log(`Target: ${targetORTScore}, Current: ${currentORTScore}, Gap: ${scoreGap}, Weeks: ${weeksRemaining}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert ORT exam preparation AI. Create strictly data-driven, personalized learning plans. Always respond with valid JSON only. Every recommendation must be based on the specific diagnostic data provided." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI learning plan error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate learning plan");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const learningPlan = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("Data-driven learning plan generated successfully");

    return new Response(JSON.stringify(learningPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Learning plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});