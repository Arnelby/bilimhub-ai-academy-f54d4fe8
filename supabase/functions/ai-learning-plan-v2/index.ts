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
      currentORTScore,
      targetORTScore,
      availableHoursPerDay,
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

    const prompt = `You are an advanced AI learning planner for ORT exam preparation with forecasting capabilities.

Student Data:
TEST HISTORY: ${JSON.stringify(testHistory || [])}
LESSON PROGRESS: ${JSON.stringify(lessonProgress || [])}
TOPIC MASTERY: ${JSON.stringify(topicMastery || [])}
CURRENT ORT SCORE ESTIMATE: ${currentORTScore || 'Unknown'}
TARGET ORT SCORE: ${targetORTScore || 200}
AVAILABLE HOURS PER DAY: ${availableHoursPerDay || 2}

DIAGNOSTIC PROFILE:
- Learning Style: ${diagnosticProfile?.learning_style || 'balanced'}
- Math Level: ${diagnosticProfile?.math_level || 1}
- Motivation Type: ${diagnosticProfile?.motivation_type || 'balanced'}
- Attention Level: ${diagnosticProfile?.attention_level || 50}
- Stress Resistance: ${diagnosticProfile?.stress_resistance || 50}
- Prefers Short Lessons: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Prefers Examples: ${diagnosticProfile?.prefers_examples ?? true}
- Step by Step Preference: ${diagnosticProfile?.step_by_step_preference || 50}

Generate a comprehensive, personalized learning plan with forecasting in this exact JSON format:
{
  "planData": {
    "title": "Personalized ORT Preparation Plan",
    "createdFor": "Student",
    "totalDuration": "8 weeks",
    "intensity": "moderate"
  },
  "schedule": {
    "weeklyHours": 14,
    "dailySchedule": {
      "monday": {"topics": ["Topic"], "duration": "2h", "activities": ["Lesson", "Practice"]},
      "tuesday": {"topics": ["Topic"], "duration": "2h", "activities": ["Mini-test", "Review"]},
      "wednesday": {"topics": ["Topic"], "duration": "2h", "activities": ["Lesson", "Practice"]},
      "thursday": {"topics": ["Topic"], "duration": "2h", "activities": ["Mini-test", "Review"]},
      "friday": {"topics": ["Topic"], "duration": "2h", "activities": ["Lesson", "Practice"]},
      "saturday": {"topics": ["Topic"], "duration": "2h", "activities": ["Full test", "Analysis"]},
      "sunday": {"topics": [], "duration": "0h", "activities": ["Rest"]}
    }
  },
  "targetTopics": [
    {"topic": "Topic Name", "currentMastery": 30, "targetMastery": 80, "priority": "high", "weeksToComplete": 2}
  ],
  "dailyTasks": [
    {"day": 1, "tasks": ["Task 1", "Task 2"], "estimatedTime": "2h", "focusTopic": "Topic"}
  ],
  "miniTests": [
    {"week": 1, "day": 3, "topic": "Topic", "questionCount": 5, "purpose": "Check understanding"}
  ],
  "predictedTimeline": {
    "week1": {"expectedMastery": 35, "focusAreas": ["Topic 1"], "milestone": "Foundation"},
    "week2": {"expectedMastery": 45, "focusAreas": ["Topic 2"], "milestone": "Building"},
    "week4": {"expectedMastery": 60, "focusAreas": ["Topic 3"], "milestone": "Progress"},
    "week8": {"expectedMastery": 80, "focusAreas": ["All topics"], "milestone": "Ready"}
  },
  "masteryGoals": {
    "shortTerm": {"duration": "2 weeks", "targetMastery": 50, "keyTopics": ["Topic 1", "Topic 2"]},
    "mediumTerm": {"duration": "1 month", "targetMastery": 65, "keyTopics": ["Topic 3", "Topic 4"]},
    "longTerm": {"duration": "2 months", "targetMastery": 80, "keyTopics": ["All topics"]}
  },
  "ortScoreProjection": {
    "current": ${currentORTScore || 140},
    "in2Weeks": 155,
    "in1Month": 170,
    "in2Months": ${targetORTScore || 200},
    "confidence": "medium",
    "factors": ["Consistent practice", "Weak topic improvement"]
  },
  "learningStrategy": "Detailed strategy based on learning style and psychology",
  "adaptations": {
    "forLearningStyle": "Specific adaptations",
    "forPsychology": "Psychological considerations",
    "forMotivation": "Motivation techniques"
  },
  "warnings": ["Potential challenges"],
  "motivationalMilestones": [
    {"week": 2, "reward": "Small celebration", "achievement": "First milestone reached"}
  ]
}

Create a realistic, achievable plan adapted to the student's learning style and psychological profile.
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
          { role: "system", content: "You are an expert educational AI that creates detailed, personalized learning plans with accurate forecasting. Always respond with valid JSON only." },
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
      throw new Error("Failed to generate learning plan");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const learningPlan = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    console.log("AI Learning Plan v2 generated successfully");

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
