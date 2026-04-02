import { supabase } from '@/integrations/supabase/client';

interface SaveAnswerParams {
  userId: string;
  testId: string;
  testName: string;
  questionId: string;
  topic?: string;
  selectedOption: number;
  correctOption: number;
}

export async function saveUserAnswer(params: SaveAnswerParams) {
  const { userId, testId, testName, questionId, topic, selectedOption, correctOption } = params;
  
  const { error } = await supabase
    .from('user_answers' as any)
    .upsert(
      {
        user_id: userId,
        test_id: testId,
        test_name: testName,
        question_id: questionId,
        topic: topic || null,
        selected_option: selectedOption,
        correct_option: correctOption,
        is_correct: selectedOption === correctOption,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,test_id,question_id', ignoreDuplicates: false }
    );

  if (error) {
    // Fallback to simple insert if upsert fails (no unique constraint yet)
    const { error: insertError } = await supabase
      .from('user_answers' as any)
      .insert({
        user_id: userId,
        test_id: testId,
        test_name: testName,
        question_id: questionId,
        topic: topic || null,
        selected_option: selectedOption,
        correct_option: correctOption,
        is_correct: selectedOption === correctOption,
        answered_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('Failed to save user answer:', insertError);
    }
  }
}
