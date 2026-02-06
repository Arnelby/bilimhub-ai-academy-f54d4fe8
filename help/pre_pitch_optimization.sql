-- ============================================
-- BilimHub Pre-Pitch Optimization Script
-- Дата: 03.02.2026
-- Цель: Ускорить работу БД перед питчем 7 февраля
-- ============================================

-- ============================================
-- 1. ИНДЕКСЫ ДЛЯ СКОРОСТИ
-- ============================================

-- Ускоряем поиск вопросов по тестам
CREATE INDEX IF NOT EXISTS idx_questions_test_id 
ON questions(test_id);

-- Ускоряем получение результатов пользователя
CREATE INDEX IF NOT EXISTS idx_user_tests_user_id 
ON user_tests(user_id);

-- Ускоряем получение прогресса по темам
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id 
ON user_topic_progress(user_id);

-- Ускоряем получение прогресса по урокам
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id 
ON user_lesson_progress(user_id);

-- Ускоряем поиск AI рекомендаций
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id 
ON ai_recommendations(user_id);

-- Ускоряем поиск AI планов обучения
CREATE INDEX IF NOT EXISTS idx_ai_learning_plans_v2_user_id 
ON ai_learning_plans_v2(user_id);

-- Ускоряем фильтрацию тестов по типу и предмету
CREATE INDEX IF NOT EXISTS idx_tests_type_subject 
ON tests(type, subject);

-- GIN индекс для быстрого поиска в JSONB полях
CREATE INDEX IF NOT EXISTS idx_questions_options_gin 
ON questions USING GIN (options);

CREATE INDEX IF NOT EXISTS idx_user_tests_answers_gin 
ON user_tests USING GIN (answers);

-- ============================================
-- 2. ВЕКТОРНЫЙ ПОИСК (Подготовка к RAG)
-- ============================================

-- Включаем расширение для векторного поиска
CREATE EXTENSION IF NOT EXISTS vector;

-- Создаем таблицу для embeddings (пока пустая, для будущего)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(768), -- размерность для text-embedding-3-small
  metadata JSONB DEFAULT '{}'::jsonb,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого векторного поиска
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- 3. ЛОГИРОВАНИЕ AI ЗАПРОСОВ (Мониторинг)
-- ============================================

-- Таблица для отслеживания использования AI
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для аналитики по пользователям
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id 
ON ai_usage_logs(user_id, created_at DESC);

-- Индекс для аналитики по функциям
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_function 
ON ai_usage_logs(function_name, created_at DESC);

-- ============================================
-- 4. КОЛОНКА ДЛЯ СЛАБЫХ ТЕМ (Адаптивность)
-- ============================================

-- Добавляем колонку для хранения аналитики обучения
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS learning_analytics JSONB DEFAULT '{
  "weak_topics": [],
  "strong_topics": [],
  "recent_mistakes": [],
  "learning_velocity": 0
}'::jsonb;

-- Индекс для быстрого доступа к слабым темам
CREATE INDEX IF NOT EXISTS idx_profiles_learning_analytics_gin 
ON profiles USING GIN (learning_analytics);

-- ============================================
-- 5. ТАБЛИЦА ШАБЛОНОВ (Министерские стандарты)
-- ============================================

-- Таблица для хранения структур задач МОН КР
CREATE TABLE IF NOT EXISTS ai_question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_standard_id TEXT NOT NULL, -- код стандарта МОН
  topic TEXT NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  question_type TEXT NOT NULL, -- 'comparison', 'multiple_choice', 'analogy'
  trap_type TEXT, -- тип ловушки: 'sign_error', 'division_by_zero', etc.
  template_structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска шаблонов по теме и сложности
CREATE INDEX IF NOT EXISTS idx_question_templates_topic_difficulty 
ON ai_question_templates(topic, difficulty_level);

-- ============================================
-- 6. RLS ПОЛИТИКИ ДЛЯ НОВЫХ ТАБЛИЦ
-- ============================================

-- Включаем RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_templates ENABLE ROW LEVEL SECURITY;

-- Политики для document_embeddings (все могут читать)
CREATE POLICY "Everyone can read embeddings" ON document_embeddings
  FOR SELECT USING (true);

-- Политики для ai_usage_logs (только свои)
CREATE POLICY "Users can view their own logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Политики для ai_question_templates (все могут читать)
CREATE POLICY "Everyone can read templates" ON ai_question_templates
  FOR SELECT USING (true);

-- ============================================
-- 7. ВАКУУМИЗАЦИЯ И АНАЛИЗ
-- ============================================

-- Обновляем статистику для оптимизатора запросов
ANALYZE questions;
ANALYZE user_tests;
ANALYZE user_topic_progress;
ANALYZE profiles;
ANALYZE tests;

-- ============================================
-- ГОТОВО! 🚀
-- ============================================

-- Проверка созданных индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Проверка размера таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
