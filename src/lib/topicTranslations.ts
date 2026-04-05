// Centralized English → Russian/Kyrgyz topic name translations
// Used across My Plan, Lessons, Profile, and other pages

export const TOPIC_RU: Record<string, string> = {
  'Arithmetic': 'Арифметика',
  'Fractions': 'Дроби',
  'Word Problems': 'Текстовые задачи',
  'Roots': 'Корни',
  'Geometry': 'Геометрия',
  'Exponents': 'Степени',
  'Algebra': 'Алгебра',
  'Coordinate Geometry': 'Координатная геометрия',
  'Functions': 'Функции',
  'Inequalities': 'Неравенства',
  'Number Line': 'Числовая прямая',
  'Factorials': 'Факториалы',
  'Logarithms': 'Логарифмы',
  'Trigonometry': 'Тригонометрия',
  'Operations': 'Арифметические операции',
  'Percentages': 'Проценты',
  'Ratios': 'Пропорции',
  'Probability': 'Вероятность',
  'Statistics': 'Статистика',
  'Sequences': 'Последовательности',
  'Sets': 'Множества',
  'Equations': 'Уравнения',
  'Matrices': 'Матрицы',
  'Vectors': 'Векторы',
  'Combinatorics': 'Комбинаторика',
  'Number Theory': 'Теория чисел',
  'Limits': 'Пределы',
  'Derivatives': 'Производные',
  'Integrals': 'Интегралы',
};

export const TOPIC_KG: Record<string, string> = {
  'Arithmetic': 'Арифметика',
  'Fractions': 'Бөлчөктөр',
  'Word Problems': 'Тексттик маселелер',
  'Roots': 'Тамырлар',
  'Geometry': 'Геометрия',
  'Exponents': 'Даражалар',
  'Algebra': 'Алгебра',
  'Coordinate Geometry': 'Координаталык геометрия',
  'Functions': 'Функциялар',
  'Inequalities': 'Теңсиздиктер',
  'Number Line': 'Сандык сызык',
  'Factorials': 'Факториалдар',
  'Logarithms': 'Логарифмдер',
  'Trigonometry': 'Тригонометрия',
  'Operations': 'Арифметикалык амалдар',
  'Percentages': 'Пайыздар',
  'Ratios': 'Пропорциялар',
  'Probability': 'Ыктымалдуулук',
  'Statistics': 'Статистика',
  'Sequences': 'Ырааттуулуктар',
  'Sets': 'Көптүктөр',
  'Equations': 'Теңдемелер',
};

/**
 * Translate an English topic name to the user's language.
 * Falls back to the original string if no translation exists.
 */
export function translateTopic(topic: string, language: 'en' | 'ru' | 'kg'): string {
  if (language === 'ru') return TOPIC_RU[topic] || topic;
  if (language === 'kg') return TOPIC_KG[topic] || topic;
  return topic;
}

/**
 * Parse a question_id like "mq_3_1" into { variant, questionNumber }.
 * Returns null if format doesn't match.
 */
export function parseQuestionId(questionId: string): { variant: number; questionNumber: number } | null {
  const match = questionId.match(/^mq_(\d+)_(\d+)$/);
  if (!match) return null;
  const variant = parseInt(match[1], 10);
  let questionNumber = parseInt(match[2], 10);
  // Handle legacy data: variant 2 stored question_numbers 31-60, normalize to 1-30
  if (variant === 2 && questionNumber >= 31) {
    questionNumber = questionNumber - 30;
  }
  return { variant, questionNumber };
}
