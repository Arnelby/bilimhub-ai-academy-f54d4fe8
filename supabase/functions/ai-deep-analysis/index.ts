import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  topicId: string | null;
  topicName: string;
  subTopic: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeTaken: number | null;
  rootCause: 'none' | 'misunderstanding' | 'lack_of_knowledge' | 'miscalculation' | 'distraction' | 'conceptual_gap';
  explanation: string;
  recommendedAction: string;
}

interface TopicMastery {
  topicId: string;
  topicName: string;
  correctCount: number;
  totalCount: number;
  masteryPercentage: number;
  status: 'mastered' | 'in_progress' | 'weak' | 'not_attempted';
  weakSubTopics: string[];
  strongSubTopics: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      testAttemptId, 
      answers, 
      questions, 
      timeTakenPerQuestion,
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

    // Calculate basic statistics per question
    const questionDetails = questions.map((q: any, index: number) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correct_option;
      const timeTaken = timeTakenPerQuestion?.[index] || null;
      
      return {
        questionId: q.id,
        questionText: q.question_text,
        topicId: q.topic_id,
        options: q.options,
        userAnswer,
        correctAnswer: q.correct_option,
        isCorrect,
        timeTaken,
        explanation: q.explanation,
      };
    });

    // Calculate overall statistics
    const correct = questionDetails.filter((q: any) => q.isCorrect).length;
    const score = Math.round((correct / questions.length) * 100);

    // Group by topic
    const topicGroups: Record<string, any[]> = {};
    questionDetails.forEach((q: any) => {
      const topicId = q.topicId || 'general';
      if (!topicGroups[topicId]) {
        topicGroups[topicId] = [];
      }
      topicGroups[topicId].push(q);
    });

    // AI Deep Analysis Prompt
    const analysisPrompt = `You are an expert educational AI specializing in ORT exam analysis for students in Kyrgyzstan.

Analyze this test attempt in extreme detail and provide comprehensive diagnostic information.

TEST DATA:
- Overall Score: ${score}% (${correct}/${questions.length})
- Questions with answers: ${JSON.stringify(questionDetails)}
- Topic groupings: ${JSON.stringify(Object.keys(topicGroups))}

STUDENT PROFILE:
- Learning Style: ${diagnosticProfile?.learning_style || 'balanced'}
- Math Level: ${diagnosticProfile?.math_level || 'unknown'}
- Prefers Step-by-Step: ${diagnosticProfile?.prefers_step_by_step ?? true}
- Confidence: ${diagnosticProfile?.confidence || 50}
- Impulsiveness: ${diagnosticProfile?.impulsiveness || 50}

For each INCORRECT answer, determine the ROOT CAUSE:
1. "misunderstanding" - Student misread or misinterpreted the question
2. "lack_of_knowledge" - Student doesn't know the concept/formula
3. "miscalculation" - Student knew the method but made arithmetic error
4. "distraction" - Student answered too quickly (if time data shows < 10 seconds)
5. "conceptual_gap" - Student has fundamental gaps in understanding

Provide your analysis in this exact JSON format:
{
  "overallScore": ${score},
  "performance": "weak" | "average" | "good" | "excellent",
  "questionAnalysis": [
    {
      "questionId": "uuid",
      "isCorrect": false,
      "rootCause": "lack_of_knowledge",
      "explanation": "Detailed explanation of why the student got this wrong",
      "subTopic": "Specific subtopic this tests",
      "recommendedAction": "What student should study to fix this"
    }
  ],
  "topicMastery": [
    {
      "topicId": "uuid or general",
      "topicName": "Topic name",
      "masteryPercentage": 75,
      "status": "in_progress",
      "weakSubTopics": ["Subtopic 1"],
      "strongSubTopics": ["Subtopic 2"]
    }
  ],
  "errorPatterns": [
    {
      "pattern": "Pattern description",
      "frequency": 3,
      "affectedTopics": ["Topic 1", "Topic 2"],
      "rootCause": "conceptual_gap",
      "solution": "Detailed solution strategy"
    }
  ],
  "skillsAssessment": {
    "logicReasoning": 70,
    "problemSolving": 65,
    "calculationAccuracy": 80,
    "conceptualUnderstanding": 55,
    "timeManagement": 60
  },
  "immediateActions": [
    {
      "priority": 1,
      "action": "Study topic X",
      "reason": "Why this is urgent",
      "estimatedTime": "30 min"
    }
  ],
  "strengthsIdentified": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "personalizedFeedback": "Detailed personalized feedback considering learning style",
  "motivationalMessage": "Encouraging message based on psychological profile",
  "nextSteps": {
    "lessons": ["Lesson topic 1", "Lesson topic 2"],
    "practiceAreas": ["Practice area 1"],
    "miniTestTopics": ["Topic for mini-test"]
  }
}

Be very specific and accurate. Do not generalize.
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
          { 
            role: "system", 
            content: "You are an expert educational diagnostician that provides deep, actionable analysis of student test performance. Always respond with valid JSON only. Never use random or generic responses - analyze the actual data provided." 
          },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI deep analysis error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate deep analysis");
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);

    // Add metadata
    analysis.testAttemptId = testAttemptId;
    analysis.analyzedAt = new Date().toISOString();
    analysis.questionsAnalyzed = questions.length;

    console.log("AI Deep Analysis completed:", { score, questionsAnalyzed: questions.length });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Deep analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
