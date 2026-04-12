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
  // Lowercase / DB variants
  'proportions': 'Пропорции',
  'logical': 'Логика',
  'decimals': 'Десятичные дроби',
  'number line': 'Числовая прямая',
  'inequalities': 'Неравенства',
  'arithmetic': 'Арифметика',
  'fractions': 'Дроби',
  'word problems': 'Текстовые задачи',
  'roots': 'Корни',
  'geometry': 'Геометрия',
  'exponents': 'Степени',
  'algebra': 'Алгебра',
  'coordinate geometry': 'Координатная геометрия',
  'functions': 'Функции',
  'factorials': 'Факториалы',
  'logarithms': 'Логарифмы',
  'trigonometry': 'Тригонометрия',
  'operations': 'Арифметические операции',
  'percentages': 'Проценты',
  'ratios': 'Пропорции',
  'probability': 'Вероятность',
  'statistics': 'Статистика',
  'sequences': 'Последовательности',
  'sets': 'Множества',
  'equations': 'Уравнения',
  'matrices': 'Матрицы',
  'vectors': 'Векторы',
  'combinatorics': 'Комбинаторика',
  'number theory': 'Теория чисел',
  'limits': 'Пределы',
  'derivatives': 'Производные',
  'integrals': 'Интегралы',
  // Additional DB topics found in math_questions
  'comparison': 'Сравнение',
  'expressions': 'Выражения',
  'absolute value': 'Модуль числа',
  'percent': 'Проценты',
  'ratio': 'Пропорции',
  'area': 'Площадь',
  'perimeter': 'Периметр',
  'angles': 'Углы',
  'circles': 'Окружности',
  'powers': 'Степени',
  'linear equations': 'Линейные уравнения',
  'quadratic equations': 'Квадратные уравнения',
  'systems of equations': 'Системы уравнений',
  'data analysis': 'Анализ данных',
  'mean': 'Среднее',
  'median': 'Медиана',
  'Без темы': 'Без темы',
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
  if (language === 'ru') return TOPIC_RU[topic] || TOPIC_RU[topic.toLowerCase()] || topic;
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
  if (variant === 2 && questionNumber >= 31) {
    questionNumber = questionNumber - 30;
  }
  return { variant, questionNumber };
}
