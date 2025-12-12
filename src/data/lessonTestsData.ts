// Lesson Tests Data - Simple format with string arrays
// Format: { id, question, options: string[], correct: string, explanation, difficulty? }

export interface SimpleTestQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ============================================
// FRACTIONS - Mini Tests (9 questions)
// ============================================
export const fractionsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'frac-mt-1', difficulty: 'easy', question: '1/2 + 1/4 = ?', options: ['3/4', '2/6', '1/6', '2/4'], correct: '3/4', explanation: '1/2 = 2/4, поэтому 2/4 + 1/4 = 3/4' },
  { id: 'frac-mt-2', difficulty: 'easy', question: 'Сократите дробь 4/8', options: ['2/4', '1/2', '1/4', '4/4'], correct: '1/2', explanation: '4/8 ÷ 4/4 = 1/2' },
  { id: 'frac-mt-3', difficulty: 'easy', question: '3/5 × 2 = ?', options: ['5/5', '3/10', '6/5', '6/10'], correct: '6/5', explanation: '3/5 × 2 = 6/5 = 1 1/5' },
  // Medium (3)
  { id: 'frac-mt-4', difficulty: 'medium', question: '2/3 ÷ 1/2 = ?', options: ['1/3', '4/3', '2/6', '3/4'], correct: '4/3', explanation: '2/3 ÷ 1/2 = 2/3 × 2/1 = 4/3' },
  { id: 'frac-mt-5', difficulty: 'medium', question: '3/4 - 1/3 = ?', options: ['2/1', '5/12', '2/7', '1/12'], correct: '5/12', explanation: '3/4 = 9/12, 1/3 = 4/12, поэтому 9/12 - 4/12 = 5/12' },
  { id: 'frac-mt-6', difficulty: 'medium', question: 'Преобразуйте 7/4 в смешанное число', options: ['1 3/4', '2 1/4', '1 1/2', '3 1/4'], correct: '1 3/4', explanation: '7 ÷ 4 = 1 остаток 3, поэтому 7/4 = 1 3/4' },
  // Hard (3)
  { id: 'frac-mt-7', difficulty: 'hard', question: '(2/3 + 1/4) × 6 = ?', options: ['5 1/2', '11/2', '6', '4'], correct: '11/2', explanation: '2/3 + 1/4 = 8/12 + 3/12 = 11/12. Затем 11/12 × 6 = 66/12 = 11/2' },
  { id: 'frac-mt-8', difficulty: 'hard', question: '(5/6 - 1/3) ÷ 1/2 = ?', options: ['1', '1/4', '1/2', '2'], correct: '1', explanation: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2. Затем 1/2 ÷ 1/2 = 1' },
  { id: 'frac-mt-9', difficulty: 'hard', question: 'Если 3/x = 1/4, чему равен x?', options: ['12', '3/4', '4/3', '7'], correct: '12', explanation: '3/x = 1/4 → x = 3 × 4 = 12' },
];

// ============================================
// FRACTIONS - Full Test (20 questions)
// ============================================
export const fractionsFullTest: SimpleTestQuestion[] = [
  { id: 'frac-ft-1', question: '1/2 + 1/3 = ?', options: ['2/5', '5/6', '2/6', '1/5'], correct: '5/6', explanation: '1/2 = 3/6, 1/3 = 2/6, поэтому 3/6 + 2/6 = 5/6' },
  { id: 'frac-ft-2', question: 'Какая дробь равна 4/6?', options: ['2/3', '3/4', '1/2', '4/8'], correct: '2/3', explanation: '4/6 ÷ 2/2 = 2/3' },
  { id: 'frac-ft-3', question: '3/4 × 2/5 = ?', options: ['6/20', '5/9', '3/10', '6/9'], correct: '3/10', explanation: '3/4 × 2/5 = 6/20 = 3/10' },
  { id: 'frac-ft-4', question: '5/6 - 1/2 = ?', options: ['4/4', '1/3', '2/6', '4/6'], correct: '1/3', explanation: '5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3' },
  { id: 'frac-ft-5', question: '3/5 ÷ 1/2 = ?', options: ['3/10', '6/5', '5/6', '1/5'], correct: '6/5', explanation: '3/5 ÷ 1/2 = 3/5 × 2/1 = 6/5' },
  { id: 'frac-ft-6', question: 'Сократите 12/18', options: ['6/9', '4/6', '2/3', '3/4'], correct: '2/3', explanation: '12/18 ÷ 6/6 = 2/3' },
  { id: 'frac-ft-7', question: 'Преобразуйте 11/4 в смешанное число', options: ['2 3/4', '2 1/4', '3 1/4', '1 3/4'], correct: '2 3/4', explanation: '11 ÷ 4 = 2 остаток 3, поэтому 11/4 = 2 3/4' },
  { id: 'frac-ft-8', question: '2 1/2 + 1 3/4 = ?', options: ['3 5/4', '4 1/4', '3 1/4', '4 3/4'], correct: '4 1/4', explanation: '2 1/2 = 10/4, 1 3/4 = 7/4, поэтому 10/4 + 7/4 = 17/4 = 4 1/4' },
  { id: 'frac-ft-9', question: 'Какая дробь больше: 3/5 или 2/3?', options: ['3/5', '2/3', 'Они равны', 'Нельзя определить'], correct: '2/3', explanation: '3/5 = 9/15, 2/3 = 10/15. 10/15 > 9/15, поэтому 2/3 > 3/5' },
  { id: 'frac-ft-10', question: '7/8 × 4/7 = ?', options: ['1/2', '28/56', '4/8', '11/15'], correct: '1/2', explanation: '7/8 × 4/7 = 28/56 = 1/2' },
  { id: 'frac-ft-11', question: 'Преобразуйте 3 2/5 в неправильную дробь', options: ['15/5', '17/5', '13/5', '11/5'], correct: '17/5', explanation: '3 2/5 = (3 × 5 + 2)/5 = 17/5' },
  { id: 'frac-ft-12', question: '5/8 - 3/8 = ?', options: ['2/8', '1/4', '1/8', '2/16'], correct: '1/4', explanation: '5/8 - 3/8 = 2/8 = 1/4' },
  { id: 'frac-ft-13', question: '2/3 ÷ 4/5 = ?', options: ['8/15', '10/12', '5/6', '6/5'], correct: '5/6', explanation: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6' },
  { id: 'frac-ft-14', question: 'Если 1/4 числа равна 12, чему равно число?', options: ['3', '48', '16', '36'], correct: '48', explanation: 'Если 1/4 × x = 12, тогда x = 12 × 4 = 48' },
  { id: 'frac-ft-15', question: '1/6 + 1/4 + 1/3 = ?', options: ['3/13', '3/4', '9/12', '1/2'], correct: '3/4', explanation: 'НОЗ = 12. 1/6 = 2/12, 1/4 = 3/12, 1/3 = 4/12. Сумма = 9/12 = 3/4' },
  { id: 'frac-ft-16', question: '(2/3)² = ?', options: ['4/6', '4/9', '2/6', '6/9'], correct: '4/9', explanation: '(2/3)² = 2²/3² = 4/9' },
  { id: 'frac-ft-17', question: '5 - 2 3/4 = ?', options: ['2 1/4', '3 1/4', '2 3/4', '3 3/4'], correct: '2 1/4', explanation: '5 = 20/4, 2 3/4 = 11/4. 20/4 - 11/4 = 9/4 = 2 1/4' },
  { id: 'frac-ft-18', question: '3/4 от 24 = ?', options: ['16', '18', '20', '6'], correct: '18', explanation: '3/4 × 24 = 72/4 = 18' },
  { id: 'frac-ft-19', question: 'Какое число при умножении на 2/5 даёт 6?', options: ['12/5', '15', '12', '3'], correct: '15', explanation: 'x × 2/5 = 6 → x = 6 × 5/2 = 15' },
  { id: 'frac-ft-20', question: '(3/4 + 1/2) × 8 = ?', options: ['10', '6', '8', '12'], correct: '10', explanation: '3/4 + 1/2 = 3/4 + 2/4 = 5/4. Затем 5/4 × 8 = 40/4 = 10' },
];

// ============================================
// EXPONENTS - Mini Tests (9 questions)
// ============================================
export const exponentsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'exp-mt-1', difficulty: 'easy', question: '2³ = ?', options: ['6', '8', '9', '16'], correct: '8', explanation: '2³ = 2 × 2 × 2 = 8' },
  { id: 'exp-mt-2', difficulty: 'easy', question: '5² = ?', options: ['10', '25', '32', '125'], correct: '25', explanation: '5² = 5 × 5 = 25' },
  { id: 'exp-mt-3', difficulty: 'easy', question: '10⁰ = ?', options: ['0', '1', '10', '100'], correct: '1', explanation: 'Любое ненулевое число в степени 0 равно 1' },
  // Medium (3)
  { id: 'exp-mt-4', difficulty: 'medium', question: '2² × 2³ = ?', options: ['2⁵', '2⁶', '4⁵', '4⁶'], correct: '2⁵', explanation: 'При умножении с одинаковым основанием складываем показатели: 2² × 2³ = 2⁵' },
  { id: 'exp-mt-5', difficulty: 'medium', question: '3⁻² = ?', options: ['6', '1/9', '-6', '9'], correct: '1/9', explanation: 'Отрицательный показатель означает обратное число: 3⁻² = 1/3² = 1/9' },
  { id: 'exp-mt-6', difficulty: 'medium', question: '(2³)² = ?', options: ['2⁵', '2⁶', '2⁹', '4⁶'], correct: '2⁶', explanation: 'Степень степени: умножаем показатели: (2³)² = 2⁶' },
  // Hard (3)
  { id: 'exp-mt-7', difficulty: 'hard', question: '5⁴ ÷ 5² = ?', options: ['5²', '5⁶', '1²', '5⁸'], correct: '5²', explanation: 'При делении с одинаковым основанием вычитаем показатели: 5⁴ ÷ 5² = 5²' },
  { id: 'exp-mt-8', difficulty: 'hard', question: '(2 × 3)³ = ?', options: ['18', '36', '216', '72'], correct: '216', explanation: '(2 × 3)³ = 6³ = 216' },
  { id: 'exp-mt-9', difficulty: 'hard', question: '(x²)³ × x⁴ = ?', options: ['x⁹', 'x¹⁰', 'x²⁴', 'x⁸'], correct: 'x¹⁰', explanation: '(x²)³ = x⁶, затем x⁶ × x⁴ = x¹⁰' },
];

// ============================================
// EXPONENTS - Full Test (20 questions)
// ============================================
export const exponentsFullTest: SimpleTestQuestion[] = [
  { id: 'exp-ft-1', question: '3⁴ = ?', options: ['12', '81', '64', '27'], correct: '81', explanation: '3⁴ = 3 × 3 × 3 × 3 = 81' },
  { id: 'exp-ft-2', question: '2⁵ = ?', options: ['10', '25', '32', '16'], correct: '32', explanation: '2⁵ = 2 × 2 × 2 × 2 × 2 = 32' },
  { id: 'exp-ft-3', question: '4² × 4³ = ?', options: ['4⁵', '4⁶', '16⁵', '8⁵'], correct: '4⁵', explanation: '4² × 4³ = 4²⁺³ = 4⁵' },
  { id: 'exp-ft-4', question: '7⁰ = ?', options: ['0', '7', '1', '-1'], correct: '1', explanation: 'Любое ненулевое число в степени 0 равно 1' },
  { id: 'exp-ft-5', question: '2⁻³ = ?', options: ['-8', '1/8', '-6', '8'], correct: '1/8', explanation: '2⁻³ = 1/2³ = 1/8' },
  { id: 'exp-ft-6', question: '(3²)³ = ?', options: ['3⁵', '3⁶', '9⁶', '3⁸'], correct: '3⁶', explanation: 'Степень степени: (3²)³ = 3⁶' },
  { id: 'exp-ft-7', question: '6⁸ ÷ 6⁵ = ?', options: ['6³', '6¹³', '1³', '36³'], correct: '6³', explanation: '6⁸ ÷ 6⁵ = 6⁸⁻⁵ = 6³' },
  { id: 'exp-ft-8', question: '(5²)⁰ = ?', options: ['25', '0', '1', '5'], correct: '1', explanation: 'Любое выражение в степени 0 равно 1' },
  { id: 'exp-ft-9', question: '2⁴ × 3⁴ = ?', options: ['6⁴', '6⁸', '5⁸', '2⁴ + 3⁴'], correct: '6⁴', explanation: 'Одинаковый показатель: 2⁴ × 3⁴ = (2 × 3)⁴ = 6⁴' },
  { id: 'exp-ft-10', question: '10⁻¹ = ?', options: ['-10', '0,1', '-1', '10'], correct: '0,1', explanation: '10⁻¹ = 1/10 = 0,1' },
  { id: 'exp-ft-11', question: 'x⁵ × x³ = ?', options: ['x¹⁵', 'x⁸', 'x²', '2x⁸'], correct: 'x⁸', explanation: 'x⁵ × x³ = x⁵⁺³ = x⁸' },
  { id: 'exp-ft-12', question: '(1/2)² = ?', options: ['1', '1/4', '2', '1/2'], correct: '1/4', explanation: '(1/2)² = 1²/2² = 1/4' },
  { id: 'exp-ft-13', question: 'a⁶ ÷ a² = ?', options: ['a⁴', 'a³', 'a⁸', 'a¹²'], correct: 'a⁴', explanation: 'a⁶ ÷ a² = a⁶⁻² = a⁴' },
  { id: 'exp-ft-14', question: '4⁻¹ = ?', options: ['-4', '1/4', '4', '-1/4'], correct: '1/4', explanation: '4⁻¹ = 1/4' },
  { id: 'exp-ft-15', question: '(xy)³ = ?', options: ['x³y', 'xy³', 'x³y³', '3xy'], correct: 'x³y³', explanation: '(xy)³ = x³y³' },
  { id: 'exp-ft-16', question: '9^(1/2) = ?', options: ['4,5', '3', '81', '18'], correct: '3', explanation: '9^(1/2) = √9 = 3' },
  { id: 'exp-ft-17', question: '(2³)⁴ = ?', options: ['2⁷', '2¹²', '8⁴', '6⁴'], correct: '2¹²', explanation: '(2³)⁴ = 2³ˣ⁴ = 2¹²' },
  { id: 'exp-ft-18', question: '5² + 5³ = ?', options: ['5⁵', '150', '10⁵', '250'], correct: '150', explanation: '5² + 5³ = 25 + 125 = 150' },
  { id: 'exp-ft-19', question: '(a/b)³ = ?', options: ['a³/b', 'a/b³', 'a³/b³', '3a/3b'], correct: 'a³/b³', explanation: '(a/b)³ = a³/b³' },
  { id: 'exp-ft-20', question: 'Если 2ˣ = 16, чему равен x?', options: ['2', '3', '4', '8'], correct: '4', explanation: '2⁴ = 16, значит x = 4' },
];

// ============================================
// QUADRATICS - Mini Tests (9 questions)
// ============================================
export const quadraticsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'quad-mt-1', difficulty: 'easy', question: 'Какова стандартная форма квадратного уравнения?', options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + cx = 0', 'a/x + b = 0'], correct: 'ax² + bx + c = 0', explanation: 'Квадратное уравнение имеет вид ax² + bx + c = 0, где a ≠ 0' },
  { id: 'quad-mt-2', difficulty: 'easy', question: 'Решите: x² = 16', options: ['x = 4', 'x = -4', 'x = ±4', 'x = 8'], correct: 'x = ±4', explanation: 'x² = 16 означает x = ±4 (положительный и отрицательный корни)' },
  { id: 'quad-mt-3', difficulty: 'easy', question: 'В уравнении x² - 5x + 6 = 0, чему равен c?', options: ['1', '-5', '6', '0'], correct: '6', explanation: 'В ax² + bx + c = 0, c — свободный член. Здесь c = 6' },
  // Medium (3)
  { id: 'quad-mt-4', difficulty: 'medium', question: 'Решите: x² - 5x + 6 = 0', options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'], correct: 'x = 2, x = 3', explanation: 'Разложение: (x-2)(x-3) = 0, значит x = 2 или x = 3' },
  { id: 'quad-mt-5', difficulty: 'medium', question: 'Чему равен дискриминант x² - 4x + 4 = 0?', options: ['0', '8', '16', '-16'], correct: '0', explanation: 'D = b² - 4ac = (-4)² - 4(1)(4) = 16 - 16 = 0' },
  { id: 'quad-mt-6', difficulty: 'medium', question: 'Если дискриминант D < 0, уравнение имеет:', options: ['Два корня', 'Один корень', 'Нет действительных корней', 'Три корня'], correct: 'Нет действительных корней', explanation: 'Когда D < 0, квадратное уравнение не имеет действительных корней' },
  // Hard (3)
  { id: 'quad-mt-7', difficulty: 'hard', question: 'Решите: x² + 2x - 8 = 0', options: ['x = 2, x = -4', 'x = -2, x = 4', 'x = 1, x = -8', 'x = 4, x = 2'], correct: 'x = 2, x = -4', explanation: 'Разложение: (x+4)(x-2) = 0, значит x = 2 или x = -4' },
  { id: 'quad-mt-8', difficulty: 'hard', question: 'Вычислите D для 2x² + 3x - 2 = 0', options: ['25', '1', '17', '-7'], correct: '25', explanation: 'D = 3² - 4(2)(-2) = 9 + 16 = 25' },
  { id: 'quad-mt-9', difficulty: 'hard', question: 'Найдите сумму корней x² - 7x + 12 = 0', options: ['7', '-7', '12', '3'], correct: '7', explanation: 'По формуле Виета: x₁ + x₂ = -b/a = -(-7)/1 = 7' },
];

// ============================================
// QUADRATICS - Full Test (20 questions)
// ============================================
export const quadraticsFullTest: SimpleTestQuestion[] = [
  { id: 'quad-ft-1', question: 'Решите: x² - 9 = 0', options: ['x = 3', 'x = -3', 'x = ±3', 'x = 9'], correct: 'x = ±3', explanation: 'x² = 9, поэтому x = ±3' },
  { id: 'quad-ft-2', question: 'Найдите дискриминант: x² + 6x + 9 = 0', options: ['0', '36', '45', '-36'], correct: '0', explanation: 'D = 6² - 4(1)(9) = 36 - 36 = 0' },
  { id: 'quad-ft-3', question: 'Решите: x² - 4x = 0', options: ['x = 0, x = 4', 'x = 0, x = -4', 'x = 4', 'x = 2'], correct: 'x = 0, x = 4', explanation: 'x(x - 4) = 0, поэтому x = 0 или x = 4' },
  { id: 'quad-ft-4', question: 'Какова формула дискриминанта?', options: ['D = b² + 4ac', 'D = b² - 4ac', 'D = 4ac - b²', 'D = a² - 4bc'], correct: 'D = b² - 4ac', explanation: 'Дискриминант квадратного уравнения: D = b² - 4ac' },
  { id: 'quad-ft-5', question: 'Решите: x² - x - 6 = 0', options: ['x = 3, x = -2', 'x = -3, x = 2', 'x = 6, x = -1', 'x = 2, x = 3'], correct: 'x = 3, x = -2', explanation: '(x - 3)(x + 2) = 0, значит x = 3 или x = -2' },
  { id: 'quad-ft-6', question: 'Если D = 0, сколько корней?', options: ['Нет корней', 'Один корень', 'Два корня', 'Три корня'], correct: 'Один корень', explanation: 'Когда D = 0, есть один (кратный) корень' },
  { id: 'quad-ft-7', question: 'Решите по формуле: x² - 5x + 6 = 0', options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = 5, x = 1'], correct: 'x = 2, x = 3', explanation: 'x = (5 ± 1)/2, значит x = 3 или x = 2' },
  { id: 'quad-ft-8', question: 'Если D > 0, сколько действительных корней?', options: ['Нет корней', 'Один корень', 'Два корня', 'Три корня'], correct: 'Два корня', explanation: 'Когда D > 0, есть два различных действительных корня' },
  { id: 'quad-ft-9', question: 'Решите: 2x² - 8 = 0', options: ['x = ±2', 'x = ±4', 'x = 2', 'x = 4'], correct: 'x = ±2', explanation: '2x² = 8, x² = 4, x = ±2' },
  { id: 'quad-ft-10', question: 'Разложите: x² - 4x - 5', options: ['(x - 5)(x + 1)', '(x + 5)(x - 1)', '(x - 4)(x - 1)', '(x + 4)(x + 1)'], correct: '(x - 5)(x + 1)', explanation: 'Множители -5 и 1 дают -4 в сумме' },
  { id: 'quad-ft-11', question: 'Сумма корней для ax² + bx + c = 0?', options: ['-b/a', 'b/a', 'c/a', '-c/a'], correct: '-b/a', explanation: 'По формулам Виета, x₁ + x₂ = -b/a' },
  { id: 'quad-ft-12', question: 'Произведение корней для ax² + bx + c = 0?', options: ['-b/a', 'b/a', 'c/a', '-c/a'], correct: 'c/a', explanation: 'По формулам Виета, x₁ × x₂ = c/a' },
  { id: 'quad-ft-13', question: 'Решите: x² + 6x + 9 = 0', options: ['x = 3', 'x = -3', 'x = ±3', 'x = 9'], correct: 'x = -3', explanation: '(x + 3)² = 0, значит x = -3 — кратный корень' },
  { id: 'quad-ft-14', question: 'Какова формула корней квадратного уравнения?', options: ['x = -b/2a', 'x = (-b ± √D)/2a', 'x = b ± √D/a', 'x = -b ± √D/a'], correct: 'x = (-b ± √D)/2a', explanation: 'Формула корней: x = (-b ± √D)/2a' },
  { id: 'quad-ft-15', question: 'Решите: x² - 2x - 15 = 0', options: ['x = 5, x = -3', 'x = -5, x = 3', 'x = 3, x = 5', 'x = -3, x = -5'], correct: 'x = 5, x = -3', explanation: '(x - 5)(x + 3) = 0' },
  { id: 'quad-ft-16', question: 'Решите: 3x² - 12x = 0', options: ['x = 0, x = 4', 'x = 0, x = -4', 'x = 4', 'x = 12'], correct: 'x = 0, x = 4', explanation: '3x(x - 4) = 0, значит x = 0 или x = 4' },
  { id: 'quad-ft-17', question: 'Вычислите D для: x² + x + 1 = 0', options: ['-3', '3', '5', '0'], correct: '-3', explanation: 'D = 1² - 4(1)(1) = 1 - 4 = -3' },
  { id: 'quad-ft-18', question: 'Если корни 2 и 5, какое уравнение?', options: ['x² - 7x + 10 = 0', 'x² + 7x + 10 = 0', 'x² - 7x - 10 = 0', 'x² + 7x - 10 = 0'], correct: 'x² - 7x + 10 = 0', explanation: '(x - 2)(x - 5) = x² - 7x + 10' },
  { id: 'quad-ft-19', question: 'Решите: x² - 1 = 0', options: ['x = 1', 'x = -1', 'x = ±1', 'x = 0'], correct: 'x = ±1', explanation: '(x-1)(x+1) = 0, значит x = ±1' },
  { id: 'quad-ft-20', question: 'Выделите полный квадрат: x² + 8x + ___ = (x + 4)²', options: ['4', '8', '16', '64'], correct: '16', explanation: '(x + 4)² = x² + 8x + 16' },
];

// Export all tests by topic
export const lessonTests = {
  fractions: {
    miniTests: fractionsMiniTests,
    fullTest: fractionsFullTest,
  },
  exponents: {
    miniTests: exponentsMiniTests,
    fullTest: exponentsFullTest,
  },
  quadratics: {
    miniTests: quadraticsMiniTests,
    fullTest: quadraticsFullTest,
  },
};
