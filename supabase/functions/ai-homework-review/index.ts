import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, userId, fileContent, fileName, fileType, subject, title, description, language = 'ru' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update submission status to reviewing
    await supabase
      .from('homework_submissions')
      .update({ status: 'reviewing' })
      .eq('id', submissionId);

    const languageInstructions = {
      ru: 'Ответь на русском языке.',
      en: 'Respond in English.',
      kg: 'Кыргыз тилинде жооп бер.'
    };

    const systemPrompt = `You are an expert educational AI tutor specializing in reviewing student homework for ORT exam preparation in Kyrgyzstan.
Your task is to review the submitted homework and provide detailed, constructive feedback.

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.ru}

You must return a JSON response with this exact structure:
{
  "feedback": "Main detailed feedback about the homework quality and content",
  "suggestions": "Specific suggestions for improvement",
  "corrections": "Any corrections needed for mistakes found",
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "additionalExercises": [
    {"title": "Exercise title", "description": "Exercise description"},
    ...
  ]
}

Be encouraging but honest. Focus on helping the student improve.`;

    const userPrompt = `Please review this homework submission:

Subject: ${subject}
Title: ${title}
${description ? `Description: ${description}` : ''}
File Name: ${fileName}
File Type: ${fileType}

Content:
${fileContent || 'Unable to extract text content from the file. Please provide general feedback based on the file metadata and context.'}

Provide detailed feedback, suggestions, corrections, score (0-100), strengths, weaknesses, and additional exercises to help the student improve.`;

    console.log('Calling AI for homework review...');

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
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    console.log('AI response received:', aiContent?.substring(0, 200));

    // Parse AI response
    let reviewData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      reviewData = {
        feedback: aiContent || 'Unable to generate detailed feedback at this time.',
        suggestions: 'Please review your work and ensure all requirements are met.',
        corrections: null,
        score: 70,
        strengths: [],
        weaknesses: [],
        additionalExercises: []
      };
    }

    // Save feedback to database
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('ai_homework_feedback')
      .insert({
        submission_id: submissionId,
        user_id: userId,
        feedback: reviewData.feedback,
        suggestions: reviewData.suggestions,
        corrections: reviewData.corrections,
        score: reviewData.score,
        strengths: reviewData.strengths || [],
        weaknesses: reviewData.weaknesses || [],
        additional_exercises: reviewData.additionalExercises || []
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      throw feedbackError;
    }

    // Determine new status based on score
    const newStatus = reviewData.score >= 80 ? 'completed' : 'needs_improvement';
    
    // Calculate points (higher score = more points)
    const pointsAwarded = Math.floor(reviewData.score / 10) * 5;

    // Update submission status and points
    await supabase
      .from('homework_submissions')
      .update({ 
        status: newStatus,
        points_awarded: pointsAwarded
      })
      .eq('id', submissionId);

    // Award points to user profile
    if (pointsAwarded > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + pointsAwarded })
          .eq('id', userId);
      }
    }

    // Create notification
    const notificationTitles = {
      ru: 'Домашнее задание проверено',
      en: 'Homework Reviewed',
      kg: 'Үй тапшырмасы текшерилди'
    };

    const notificationMessages = {
      ru: `Ваше домашнее задание "${title}" проверено. Оценка: ${reviewData.score}/100`,
      en: `Your homework "${title}" has been reviewed. Score: ${reviewData.score}/100`,
      kg: `Сиздин үй тапшырмаңыз "${title}" текшерилди. Баа: ${reviewData.score}/100`
    };

    await supabase
      .from('homework_notifications')
      .insert({
        user_id: userId,
        submission_id: submissionId,
        type: 'review_complete',
        title: notificationTitles[language as keyof typeof notificationTitles] || notificationTitles.ru,
        message: notificationMessages[language as keyof typeof notificationMessages] || notificationMessages.ru
      });

    console.log('Homework review completed successfully');

    return new Response(JSON.stringify({
      success: true,
      feedback: feedbackData,
      status: newStatus,
      pointsAwarded
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-homework-review:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
