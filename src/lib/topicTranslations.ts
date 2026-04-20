// Centralized English → Russian/Kyrgyz topic name translations
// Used across My Plan, Lessons, Profile, and other pages

export const TOPIC_RU: Record<string, string> = {
  'Arithmetic': 'Арифметика',
  'Fractions': 'Дроби',
  'Word Problems': 'Текстовые задачи',
  'Roots': 'Корни',
  'Geometry': 'Геометрия',
  'Solid Geometry': 'Геометрия',
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
  'Logic': 'Логика',
  'Decimals': 'Десятичные дроби',
  'Data Analysis': 'Анализ данных',
  'Algebraic Expressions': 'Алгебраические выражения',
  'Linear Equations': 'Линейные уравнения',
  'Order of Operations': 'Порядок действий',
  'Polynomials': 'Многочлены',
  'Magic Square': 'Магический квадрат',
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
  'solid geometry': 'Геометрия',
  'data analysis': 'Анализ данных',
  'algebraic expressions': 'Алгебраические выражения',
  'linear equations': 'Линейные уравнения',
  'order of operations': 'Порядок действий',
  'polynomials': 'Многочлены',
  'magic square': 'Магический квадрат',
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
  'quadratic equations': 'Квадратные уравнения',
  'systems of equations': 'Системы уравнений',
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

const TOPIC_EN_FROM_RU = Object.entries(TOPIC_RU).reduce<Record<string, string>>((acc, [en, ru]) => {
  if (/^[A-Z]/.test(en) && !acc[ru]) acc[ru] = en;
  return acc;
}, {});

const ANALYTICS_TOPIC_ALIASES_EN: Record<string, string> = {
  'Solid Geometry': 'Geometry',
  'solid geometry': 'Geometry',
};

const PRACTICE_TOPIC_ALIASES_RU: Record<string, string> = {
  'Geometry': 'Геометрия',
  'geometry': 'Геометрия',
  'Геометрия': 'Геометрия',
  'Solid Geometry': 'Геометрия',
  'solid geometry': 'Геометрия',
  'Coordinate Geometry': 'Геометрия',
  'coordinate geometry': 'Геометрия',
  'Координатная геометрия': 'Геометрия',
  'Fractions': 'Дроби',
  'fractions': 'Дроби',
  'Дроби': 'Дроби',
  'Percentages': 'Проценты',
  'percentages': 'Проценты',
  'Проценты': 'Проценты',
  'Algebra': 'Алгебра',
  'algebra': 'Алгебра',
  'Алгебра': 'Алгебра',
  'Functions': 'Функции',
  'functions': 'Функции',
  'Функции': 'Функции',
  'Inequalities': 'Неравенства',
  'inequalities': 'Неравенства',
  'Неравенства': 'Неравенства',
  'Arithmetic': 'Арифметика',
  'arithmetic': 'Арифметика',
  'Арифметика': 'Арифметика',
  'Exponents': 'Степени и корни',
  'exponents': 'Степени и корни',
  'Roots': 'Степени и корни',
  'roots': 'Степени и корни',
  'Степени': 'Степени и корни',
  'Корни': 'Степени и корни',
  'Степени и корни': 'Степени и корни',
  'Probability': 'Теория вероятностей',
  'probability': 'Теория вероятностей',
  'Вероятность': 'Теория вероятностей',
  'Теория вероятностей': 'Теория вероятностей',
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

export function normalizeAnalyticsTopic(topic: string): string {
  const trimmed = topic.trim();
  if (!trimmed) return trimmed;

  const translatedRu = TOPIC_RU[trimmed] || TOPIC_RU[trimmed.toLowerCase()] || trimmed;
  const normalizedEn = TOPIC_EN_FROM_RU[trimmed] || TOPIC_EN_FROM_RU[translatedRu] || trimmed;

  return ANALYTICS_TOPIC_ALIASES_EN[normalizedEn]
    || ANALYTICS_TOPIC_ALIASES_EN[normalizedEn.toLowerCase()]
    || normalizedEn;
}

export function normalizePracticeTopic(topic: string): string {
  const trimmed = topic.trim();
  if (!trimmed) return trimmed;

  return PRACTICE_TOPIC_ALIASES_RU[trimmed]
    || PRACTICE_TOPIC_ALIASES_RU[trimmed.toLowerCase()]
    || TOPIC_RU[trimmed]
    || TOPIC_RU[trimmed.toLowerCase()]
    || trimmed;
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
