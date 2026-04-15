-- Fix Q21: update instruction and column_a
UPDATE math_questions
SET instruction = 'Дан треугольник ABC. AB = BC. Угол A разделен на 36° и 34°.',
    column_a = '∠A'
WHERE test_id = 1 AND question_number = 21;

-- Fix Q26: update instruction
UPDATE math_questions
SET instruction = 'ABCD — трапеция'
WHERE test_id = 1 AND question_number = 26;