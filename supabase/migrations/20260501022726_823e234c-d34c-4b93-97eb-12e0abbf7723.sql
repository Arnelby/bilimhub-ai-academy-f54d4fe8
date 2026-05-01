-- =========================================================
-- STEP 0+1+4 (part A): Backups + topic_normalized columns
-- Reversible. Original `topic` columns are NOT modified.
-- =========================================================

-- 0. BACKUPS (snapshot of current state, never modified)
CREATE TABLE IF NOT EXISTS public.practice_questions_backup AS
  SELECT *, now() AS _backup_at FROM public.practice_questions;

CREATE TABLE IF NOT EXISTS public.practice_responses_backup AS
  SELECT *, now() AS _backup_at FROM public.practice_responses;

CREATE TABLE IF NOT EXISTS public.topic_mastery_state_backup AS
  SELECT *, now() AS _backup_at FROM public.topic_mastery_state;

-- 1. Canonical RU->EN topic mapping (single source of truth)
CREATE TABLE IF NOT EXISTS public.topic_canonical_map (
  raw_topic   text PRIMARY KEY,
  canonical_en text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed mapping. EN values mirror topics.title.
INSERT INTO public.topic_canonical_map (raw_topic, canonical_en) VALUES
  -- Identity (already EN)
  ('Algebra','Algebra'),('Arithmetic','Arithmetic'),('Combinatorics','Combinatorics'),
  ('Coordinate Geometry','Coordinate Geometry'),('Data Analysis','Data Analysis'),
  ('Decimals','Decimals'),('Equations','Equations'),('Exponents','Exponents'),
  ('Factorials','Factorials'),('Fractions','Fractions'),('Functions','Functions'),
  ('Geometry','Geometry'),('Inequalities','Inequalities'),('Linear Equations','Linear Equations'),
  ('Logarithms','Logarithms'),('Logic','Logic'),('Number Line','Number Line'),
  ('Number Theory','Number Theory'),('Operations','Operations'),('Percentages','Percentages'),
  ('Probability','Probability'),('Proportions','Proportions'),('Quadratic Equations','Quadratic Equations'),
  ('Roots','Roots'),('Sequences','Sequences'),('Solid Geometry','Geometry'),
  ('Statistics','Statistics'),('Trigonometry','Trigonometry'),('Word Problems','Word Problems'),
  -- Russian -> English
  ('Алгебра','Algebra'),
  ('Алгебраические выражения','Algebra'),
  ('Арифметика','Arithmetic'),
  ('Арифметические операции','Operations'),
  ('Геометрия','Geometry'),
  ('Дроби','Fractions'),
  ('Десятичные дроби','Decimals'),
  ('Комбинаторика','Combinatorics'),
  ('Координатная геометрия','Coordinate Geometry'),
  ('Корни','Roots'),
  ('Логика','Logic'),
  ('Логарифмы','Logarithms'),
  ('Неравенства','Inequalities'),
  ('Отношения и пропорции','Proportions'),
  ('Последовательности','Sequences'),
  ('Проценты','Percentages'),
  ('Системы уравнений','Equations'),
  ('Статистика','Statistics'),
  ('Стереометрия','Geometry'),
  ('Степени','Exponents'),
  ('Степени и корни','Exponents'),
  ('Текстовые задачи','Word Problems'),
  ('Теория вероятностей','Probability'),
  ('Теория чисел','Number Theory'),
  ('Тригонометрия','Trigonometry'),
  ('Уравнения','Equations'),
  ('Квадратные уравнения','Equations'),
  ('Линейные уравнения','Equations'),
  ('Числовая прямая','Number Line'),
  ('Числовая ось','Number Line'),
  ('Функции','Functions'),
  ('Вероятность','Probability')
ON CONFLICT (raw_topic) DO UPDATE SET canonical_en = EXCLUDED.canonical_en;

-- Helper function: normalize any incoming topic string -> canonical EN
CREATE OR REPLACE FUNCTION public.normalize_topic(_raw text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT canonical_en FROM public.topic_canonical_map
      WHERE raw_topic = trim(_raw) LIMIT 1),
    (SELECT canonical_en FROM public.topic_canonical_map
      WHERE lower(raw_topic) = lower(trim(_raw)) LIMIT 1),
    trim(_raw)
  );
$$;

-- 2. Add topic_normalized columns (NEW columns, originals untouched)
ALTER TABLE public.practice_questions   ADD COLUMN IF NOT EXISTS topic_normalized text;
ALTER TABLE public.practice_responses   ADD COLUMN IF NOT EXISTS topic_normalized text;
ALTER TABLE public.topic_mastery_state  ADD COLUMN IF NOT EXISTS topic_normalized text;

-- 3. Backfill (one-time; idempotent)
UPDATE public.practice_questions
   SET topic_normalized = public.normalize_topic(topic)
 WHERE topic_normalized IS DISTINCT FROM public.normalize_topic(topic);

UPDATE public.practice_responses
   SET topic_normalized = public.normalize_topic(topic)
 WHERE topic IS NOT NULL
   AND topic_normalized IS DISTINCT FROM public.normalize_topic(topic);

UPDATE public.topic_mastery_state
   SET topic_normalized = public.normalize_topic(topic)
 WHERE topic_normalized IS DISTINCT FROM public.normalize_topic(topic);

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pq_topic_norm  ON public.practice_questions  (topic_normalized);
CREATE INDEX IF NOT EXISTS idx_pr_topic_norm  ON public.practice_responses  (topic_normalized);
CREATE INDEX IF NOT EXISTS idx_tms_topic_norm ON public.topic_mastery_state (topic_normalized);

-- 5. Trigger: auto-normalize on future INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.tg_set_topic_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.topic IS NOT NULL THEN
    NEW.topic_normalized := public.normalize_topic(NEW.topic);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pq_norm_trg  ON public.practice_questions;
DROP TRIGGER IF EXISTS pr_norm_trg  ON public.practice_responses;
DROP TRIGGER IF EXISTS tms_norm_trg ON public.topic_mastery_state;

CREATE TRIGGER pq_norm_trg  BEFORE INSERT OR UPDATE OF topic ON public.practice_questions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_topic_normalized();
CREATE TRIGGER pr_norm_trg  BEFORE INSERT OR UPDATE OF topic ON public.practice_responses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_topic_normalized();
CREATE TRIGGER tms_norm_trg BEFORE INSERT OR UPDATE OF topic ON public.topic_mastery_state
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_topic_normalized();