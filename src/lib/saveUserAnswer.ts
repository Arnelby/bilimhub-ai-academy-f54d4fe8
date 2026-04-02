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

  const row = {
    user_id: userId,
    test_id: testId,
    test_name: testName,
    question_id: questionId,
    topic: topic || null,
    selected_option: selectedOption,
    correct_option: correctOption,
    is_correct: selectedOption === correctOption,
    answered_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_answers' as any)
    .upsert(row, { onConflict: 'user_id,test_id,question_id', ignoreDuplicates: false });

  if (error) {
    console.error('Failed to save user answer:', error);
  }
}
