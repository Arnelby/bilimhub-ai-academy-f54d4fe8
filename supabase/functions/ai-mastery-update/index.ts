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
    const { userId, topicMasteryUpdates, testScore, aiAnalysis } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process each topic mastery update
    const updates = [];
    
    for (const update of topicMasteryUpdates || []) {
      const { topicId, masteryPercentage, status, weakSubTopics, strongSubTopics } = update;
      
      // Get existing progress
      const { data: existing } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .single();

      // Calculate new mastery using weighted average (recent performance weighted more)
      let newMastery = masteryPercentage;
      if (existing) {
        const existingWeight = 0.4;
        const newWeight = 0.6;
        newMastery = Math.round(existing.progress_percentage * existingWeight + masteryPercentage * newWeight);
      }

      // Determine mastery level
      let masteryLevel: 'mastered' | 'in_progress' | 'weak' | 'not_attempted' = 'not_attempted';
      if (newMastery >= 80) masteryLevel = 'mastered';
      else if (newMastery >= 50) masteryLevel = 'in_progress';
      else if (newMastery > 0) masteryLevel = 'weak';

      const updateData = {
        user_id: userId,
        topic_id: topicId,
        progress_percentage: newMastery,
        mastery: masteryLevel,
        last_practiced: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_topic_progress')
        .upsert(updateData, { onConflict: 'user_id,topic_id' });

      if (error) {
        console.error('Error updating topic mastery:', error);
      } else {
        updates.push({ topicId, oldMastery: existing?.progress_percentage || 0, newMastery, status: masteryLevel });
      }
    }

    // Store AI analysis in recommendations table for reference
    if (aiAnalysis) {
      // Deactivate old recommendations
      await supabase
        .from('ai_recommendations')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Store new analysis
      await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          weak_topics: aiAnalysis.areasForImprovement || [],
          recommended_topics: aiAnalysis.nextSteps?.lessons || [],
          recommended_lessons: aiAnalysis.nextSteps?.practiceAreas || [],
          recommended_mini_tests: aiAnalysis.nextSteps?.miniTestTopics?.map((t: string) => ({ topic: t })) || [],
          error_patterns: aiAnalysis.errorPatterns || [],
          motivation_message: aiAnalysis.motivationalMessage,
          study_strategy: aiAnalysis.personalizedFeedback,
          predicted_mastery: aiAnalysis.skillsAssessment,
          is_active: true,
        });
    }

    console.log("Mastery update completed:", { userId, updatesCount: updates.length });

    return new Response(JSON.stringify({ 
      success: true, 
      updates,
      message: `Updated mastery for ${updates.length} topics`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mastery update error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
