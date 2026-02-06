-- Психологический тест: вопросы и категории

CREATE TYPE perception_type AS ENUM ('visual', 'auditory', 'text', 'practical', 'adhd_friendly');
CREATE TYPE learning_tempo AS ENUM ('fast', 'medium', 'slow');
CREATE TYPE thinking_style AS ENUM ('logical', 'intuitive', 'step_by_step');

-- Таблица вопросов психологического теста
CREATE TABLE IF NOT EXISTS personality_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ru TEXT NOT NULL,
  question_kg TEXT,
  question_en TEXT,
  category TEXT NOT NULL, -- perception/tempo/thinking
  subcategory TEXT NOT NULL, -- visual/auditory/etc
  options JSONB NOT NULL, -- [{text: "", value: "", points: 1}]
  order_index INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Результаты психологического теста
CREATE TABLE IF NOT EXISTS personality_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL, -- {question_id: answer_value}
  
  -- Результаты категоризации
  perception_type perception_type,
  learning_tempo learning_tempo,
  thinking_style thinking_style,
  
  -- Процентные оценки по каждому типу
  perception_scores JSONB, -- {visual: 80, auditory: 20, ...}
  tempo_scores JSONB,
  thinking_scores JSONB,
  
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Обновить таблицу профилей
ALTER TABLE user_diagnostic_profile
  ADD COLUMN IF NOT EXISTS perception_type perception_type,
  ADD COLUMN IF NOT EXISTS learning_tempo learning_tempo,
  ADD COLUMN IF NOT EXISTS thinking_style thinking_style,
  ADD COLUMN IF NOT EXISTS personality_test_completed BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE personality_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions"
ON personality_test_questions FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert their results"
ON personality_test_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their results"
ON personality_test_results FOR SELECT
USING (auth.uid() = user_id);

-- Типовые вопросы (15 шт)
INSERT INTO personality_test_questions (question_ru, category, subcategory, options, order_index) VALUES

-- Тип восприятия (5 вопросов)
('Как вы лучше всего запоминаете новую информацию?', 'perception', 'general', 
 '[
   {"text": "Когда вижу схемы, графики, картинки", "value": "visual", "points": 5},
   {"text": "Когда слушаю объяснения и повторяю вслух", "value": "auditory", "points": 5},
   {"text": "Когда читаю текст и делаю заметки", "value": "text", "points": 5},
   {"text": "Когда сам решаю похожие задачи", "value": "practical", "points": 5}
 ]'::jsonb, 1),

('На уроке математики вам легче понять, когда:', 'perception', 'general',
 '[
   {"text": "Учитель рисует схему на доске", "value": "visual", "points": 5},
   {"text": "Учитель подробно объясняет вслух", "value": "auditory", "points": 5},
   {"text": "Дают учебник с подробным текстом", "value": "text", "points": 5},
   {"text": "Сразу даю практические примеры", "value": "practical", "points": 5}
 ]'::jsonb, 2),

('Вы предпочитаете изучать новую тему:', 'perception', 'general',
 '[
   {"text": "Смотреть обучающее видео", "value": "visual", "points": 4},
   {"text": "Слушать объяснение репетитора", "value": "auditory", "points": 4},
   {"text": "Читать статью или конспект", "value": "text", "points": 4},
   {"text": "Сразу пробовать решать задачи", "value": "practical", "points": 4}
 ]'::jsonb, 3),

('Во время учебы вы:', 'perception', 'adhd',
 '[
   {"text": "Легко концентрируюсь долгое время", "value": "standard", "points": 0},
   {"text": "Нужны короткие перерывы каждые 20-30 мин", "value": "adhd_friendly", "points": 5},
   {"text": "Отвлекаюсь часто, нужны частые смены активности", "value": "adhd_friendly", "points": 7}
 ]'::jsonb, 4),

('Какой формат урока вам больше подходит?', 'perception', 'general',
 '[
   {"text": "45 минут с презентацией и схемами", "value": "visual", "points": 3},
   {"text": "Обсуждение темы с комментариями", "value": "auditory", "points": 3},
   {"text": "Самостоятельное чтение материала", "value": "text", "points": 3},
   {"text": "Много практики с минимумом теории", "value": "practical", "points": 3}
 ]'::jsonb, 5),

-- Темп обучения (5 вопросов)
('С какой скоростью вы обычно усваиваете новый материал?', 'tempo', 'general',
 '[
   {"text": "Быстро, схватываю на лету", "value": "fast", "points": 5},
   {"text": "Средне, нужно несколько объяснений", "value": "medium", "points": 5},
   {"text": "Медленно, мне нужно много времени", "value": "slow", "points": 5}
 ]'::jsonb, 6),

('Сколько повторений вам нужно, чтобы запомнить формулу?', 'tempo', 'general',
 '[
   {"text": "1-2 раза", "value": "fast", "points": 5},
   {"text": "3-5 раз", "value": "medium", "points": 5},
   {"text": "Более 5 раз", "value": "slow", "points": 5}
 ]'::jsonb, 7),

('Если тема сложная, вы:', 'tempo', 'general',
 '[
   {"text": "Быстро разбираюсь сам", "value": "fast", "points": 4},
   {"text": "Нужна помощь, но недолго", "value": "medium", "points": 4},
   {"text": "Требуется много времени и объяснений", "value": "slow", "points": 4}
 ]'::jsonb, 8),

('Ваш идеальный темп прохождения одной темы:', 'tempo', 'general',
 '[
   {"text": "1-2 дня", "value": "fast", "points": 3},
   {"text": "3-5 дней", "value": "medium", "points": 3},
   {"text": "Неделя и больше", "value": "slow", "points": 3}
 ]'::jsonb, 9),

('При подготовке к экзамену вы:', 'tempo', 'general',
 '[
   {"text": "За неделю все повторяю", "value": "fast", "points": 3},
   {"text": "Начинаю за месяц, равномерно", "value": "medium", "points": 3},
   {"text": "Начинаю заранее, учу постепенно", "value": "slow", "points": 3}
 ]'::jsonb, 10),

-- Стиль мышления (5 вопросов)
('Как вы решаете математическую задачу?', 'thinking', 'general',
 '[
   {"text": "Анализирую условие, ищу логические связи", "value": "logical", "points": 5},
   {"text": "Пытаюсь понять суть, затем решаю", "value": "intuitive", "points": 5},
   {"text": "Следую пошаговому алгоритму", "value": "step_by_step", "points": 5}
 ]'::jsonb, 11),

('Вам дали новую задачу без образца. Вы:', 'thinking', 'general',
 '[
   {"text": "Строю логическую цепочку решения", "value": "logical", "points": 5},
   {"text": "Пытаюсь найти похожую задачу в голове", "value": "intuitive", "points": 5},
   {"text": "Ищу инструкцию или алгоритм", "value": "step_by_step", "points": 5}
 ]'::jsonb, 12),

('Вы лучше понимаете:', 'thinking', 'general',
 '[
   {"text": "Почему это работает (причины)", "value": "logical", "points": 4},
   {"text": "Общую идею и суть", "value": "intuitive", "points": 4},
   {"text": "Что делать шаг за шагом", "value": "step_by_step", "points": 4}
 ]'::jsonb, 13),

('Если вы забыли формулу на экзамене:', 'thinking', 'general',
 '[
   {"text": "Вывожу её логически", "value": "logical", "points": 3},
   {"text": "Вспоминаю по ощущениям", "value": "intuitive", "points": 3},
   {"text": "Пытаюсь вспомнить алгоритм", "value": "step_by_step", "points": 3}
 ]'::jsonb, 14),

('Идеальное объяснение для вас:', 'thinking', 'general',
 '[
   {"text": "С доказательствами и обоснованиями", "value": "logical", "points": 3},
   {"text": "С аналогиями и примерами из жизни", "value": "intuitive", "points": 3},
   {"text": "С четкими шагами: делай 1, 2, 3", "value": "step_by_step", "points": 3}
 ]'::jsonb, 15);

COMMENT ON TABLE personality_test_questions IS 'Вопросы психологического теста для определения стиля обучения';
COMMENT ON TABLE personality_test_results IS 'Результаты психологического теста пользователей';
