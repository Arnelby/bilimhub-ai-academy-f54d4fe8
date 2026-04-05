// Centralized math test configuration
export interface MathTestConfig {
  uuid: string;
  name: string;
  table: 'math_questions' | 'math_test_questions';
  durationSeconds: number;
  description: string;
  questionType: 'comparison' | 'mcq';
}

export const TEST_CONFIG: Record<number, MathTestConfig> = {
  1: { uuid: '00000000-0000-0000-0000-000000000001', name: 'Математика тест вариант 1', table: 'math_questions', durationSeconds: 30 * 60, description: 'Сравнение величин', questionType: 'comparison' },
  2: { uuid: '00000000-0000-0000-0000-000000000002', name: 'Математика тест вариант 2', table: 'math_test_questions', durationSeconds: 60 * 60, description: 'Тест с вариантами ответов', questionType: 'mcq' },
  3: { uuid: '00000000-0000-0000-0000-000000000003', name: 'Математика тест вариант 3', table: 'math_questions', durationSeconds: 30 * 60, description: 'Сравнение величин', questionType: 'comparison' },
  4: { uuid: '00000000-0000-0000-0000-000000000004', name: 'Математика тест вариант 4', table: 'math_test_questions', durationSeconds: 60 * 60, description: 'Тест с вариантами ответов', questionType: 'mcq' },
};

// Latin→Cyrillic mapping for UI display
export const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А',
  B: 'Б',
  C: 'В',
  D: 'Г',
  E: 'Д',
};

export const CYRILLIC_TO_LATIN: Record<string, string> = {
  'А': 'A',
  'Б': 'B',
  'В': 'C',
  'Г': 'D',
  'Д': 'E',
};

/** Convert a potentially Cyrillic key to Latin for DB storage */
export function toLatinKey(key: string): string {
  return CYRILLIC_TO_LATIN[key] || key;
}

/** Convert a Latin key to Cyrillic for UI display */
export function toCyrillicKey(key: string): string {
  return LATIN_TO_CYRILLIC[key] || key;
}

export function formatDurationMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}
