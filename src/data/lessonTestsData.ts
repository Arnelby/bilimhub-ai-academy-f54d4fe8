// ============================================
// LESSON TESTS DATA - Comprehensive Coverage
// ============================================
// Format: { id, question, options: string[], correct: string, explanation, difficulty? }
// 
// COVERAGE REQUIREMENTS:
// - Each ORT topic MUST have mini-tests (9 questions: 3 easy, 3 medium, 3 hard)
// - Each ORT topic MUST have full test (20 questions)
// - Tests are generated based on diagnostic topic mapping
// ============================================

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

// ============================================
// DECIMAL FRACTIONS - Mini Tests (9 questions)
// ============================================
export const decimalFractionsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'dec-mt-1', difficulty: 'easy', question: '0.5 + 0.3 = ?', options: ['0.8', '0.2', '8', '0.53'], correct: '0.8', explanation: '0.5 + 0.3 = 0.8' },
  { id: 'dec-mt-2', difficulty: 'easy', question: '1.2 - 0.7 = ?', options: ['0.5', '0.6', '1.9', '0.7'], correct: '0.5', explanation: '1.2 - 0.7 = 0.5' },
  { id: 'dec-mt-3', difficulty: 'easy', question: 'Преобразуйте 1/4 в десятичную дробь', options: ['0.25', '0.4', '0.14', '0.5'], correct: '0.25', explanation: '1/4 = 0.25' },
  // Medium (3)
  { id: 'dec-mt-4', difficulty: 'medium', question: '2.5 × 0.4 = ?', options: ['1', '10', '0.1', '1.0'], correct: '1', explanation: '2.5 × 0.4 = 1.0 = 1' },
  { id: 'dec-mt-5', difficulty: 'medium', question: '3.6 ÷ 0.9 = ?', options: ['4', '3.24', '0.4', '32.4'], correct: '4', explanation: '3.6 ÷ 0.9 = 4' },
  { id: 'dec-mt-6', difficulty: 'medium', question: 'Округлите 3.456 до сотых', options: ['3.46', '3.45', '3.5', '3.4'], correct: '3.46', explanation: '3.456 ≈ 3.46 (6 > 5, поэтому округляем вверх)' },
  // Hard (3)
  { id: 'dec-mt-7', difficulty: 'hard', question: '(2.4 + 1.6) × 0.5 = ?', options: ['2', '4', '0.2', '1.6'], correct: '2', explanation: '(2.4 + 1.6) × 0.5 = 4 × 0.5 = 2' },
  { id: 'dec-mt-8', difficulty: 'hard', question: '5.25 ÷ 0.25 = ?', options: ['21', '2.1', '210', '0.21'], correct: '21', explanation: '5.25 ÷ 0.25 = 21' },
  { id: 'dec-mt-9', difficulty: 'hard', question: 'Преобразуйте 0.375 в обыкновенную дробь', options: ['3/8', '3/4', '375/100', '37/80'], correct: '3/8', explanation: '0.375 = 375/1000 = 3/8' },
];

// ============================================
// DECIMAL FRACTIONS - Full Test (20 questions)
// ============================================
export const decimalFractionsFullTest: SimpleTestQuestion[] = [
  { id: 'dec-ft-1', question: '0.4 + 0.06 = ?', options: ['0.46', '0.10', '4.6', '0.406'], correct: '0.46', explanation: '0.4 + 0.06 = 0.46' },
  { id: 'dec-ft-2', question: '2.5 - 1.3 = ?', options: ['1.2', '1.8', '3.8', '0.12'], correct: '1.2', explanation: '2.5 - 1.3 = 1.2' },
  { id: 'dec-ft-3', question: '0.7 × 0.8 = ?', options: ['0.56', '5.6', '56', '0.056'], correct: '0.56', explanation: '0.7 × 0.8 = 0.56' },
  { id: 'dec-ft-4', question: '4.8 ÷ 0.6 = ?', options: ['8', '0.8', '80', '2.88'], correct: '8', explanation: '4.8 ÷ 0.6 = 8' },
  { id: 'dec-ft-5', question: 'Преобразуйте 3/5 в десятичную', options: ['0.6', '0.35', '0.53', '0.3'], correct: '0.6', explanation: '3/5 = 0.6' },
  { id: 'dec-ft-6', question: '1.25 + 2.75 = ?', options: ['4', '3.00', '4.00', '3.1'], correct: '4', explanation: '1.25 + 2.75 = 4.00 = 4' },
  { id: 'dec-ft-7', question: '5 - 2.7 = ?', options: ['2.3', '3.3', '7.7', '2.7'], correct: '2.3', explanation: '5.0 - 2.7 = 2.3' },
  { id: 'dec-ft-8', question: '0.25 × 4 = ?', options: ['1', '0.1', '10', '0.29'], correct: '1', explanation: '0.25 × 4 = 1' },
  { id: 'dec-ft-9', question: '7.2 ÷ 0.9 = ?', options: ['8', '6.48', '0.8', '80'], correct: '8', explanation: '7.2 ÷ 0.9 = 8' },
  { id: 'dec-ft-10', question: 'Сравните: 0.5 и 0.50', options: ['0.5 > 0.50', '0.5 < 0.50', '0.5 = 0.50', 'Нельзя сравнить'], correct: '0.5 = 0.50', explanation: '0.5 = 0.50 (нули справа не меняют значение)' },
  { id: 'dec-ft-11', question: 'Округлите 2.745 до десятых', options: ['2.7', '2.8', '2.74', '3'], correct: '2.7', explanation: '2.745 ≈ 2.7 (4 < 5, округляем вниз)' },
  { id: 'dec-ft-12', question: '0.12 × 100 = ?', options: ['12', '1.2', '120', '0.0012'], correct: '12', explanation: '0.12 × 100 = 12' },
  { id: 'dec-ft-13', question: '45 ÷ 100 = ?', options: ['0.45', '4.5', '450', '0.045'], correct: '0.45', explanation: '45 ÷ 100 = 0.45' },
  { id: 'dec-ft-14', question: 'Преобразуйте 0.8 в дробь', options: ['4/5', '8/10', '8/100', '1/8'], correct: '4/5', explanation: '0.8 = 8/10 = 4/5' },
  { id: 'dec-ft-15', question: '3.14 + 2.86 = ?', options: ['6', '5.00', '6.00', '5.9'], correct: '6', explanation: '3.14 + 2.86 = 6.00 = 6' },
  { id: 'dec-ft-16', question: '0.09 × 0.1 = ?', options: ['0.009', '0.9', '0.09', '9'], correct: '0.009', explanation: '0.09 × 0.1 = 0.009' },
  { id: 'dec-ft-17', question: '6.3 ÷ 0.7 = ?', options: ['9', '0.9', '4.41', '90'], correct: '9', explanation: '6.3 ÷ 0.7 = 9' },
  { id: 'dec-ft-18', question: 'Какое число между 0.3 и 0.4?', options: ['0.35', '0.34', '0.5', '0.25'], correct: '0.35', explanation: '0.3 < 0.35 < 0.4' },
  { id: 'dec-ft-19', question: '2.5² = ?', options: ['6.25', '5', '625', '25'], correct: '6.25', explanation: '2.5² = 2.5 × 2.5 = 6.25' },
  { id: 'dec-ft-20', question: '√0.25 = ?', options: ['0.5', '0.25', '5', '0.05'], correct: '0.5', explanation: '√0.25 = 0.5 (потому что 0.5² = 0.25)' },
];

// ============================================
// PERCENTAGES - Mini Tests (9 questions)
// ============================================
export const percentagesMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'perc-mt-1', difficulty: 'easy', question: '50% от 80 = ?', options: ['40', '160', '30', '4'], correct: '40', explanation: '50% = 0.5, поэтому 0.5 × 80 = 40' },
  { id: 'perc-mt-2', difficulty: 'easy', question: 'Преобразуйте 1/4 в проценты', options: ['25%', '14%', '40%', '4%'], correct: '25%', explanation: '1/4 = 0.25 = 25%' },
  { id: 'perc-mt-3', difficulty: 'easy', question: '10% от 200 = ?', options: ['20', '2', '10', '100'], correct: '20', explanation: '10% = 0.1, поэтому 0.1 × 200 = 20' },
  // Medium (3)
  { id: 'perc-mt-4', difficulty: 'medium', question: 'Число увеличили на 20%. Было 50, стало?', options: ['60', '70', '40', '52'], correct: '60', explanation: '50 × 1.2 = 60 или 50 + (50 × 0.2) = 60' },
  { id: 'perc-mt-5', difficulty: 'medium', question: 'Какой процент составляет 15 от 60?', options: ['25%', '15%', '4%', '45%'], correct: '25%', explanation: '15/60 = 0.25 = 25%' },
  { id: 'perc-mt-6', difficulty: 'medium', question: '75% от какого числа равно 45?', options: ['60', '33.75', '120', '45'], correct: '60', explanation: 'x × 0.75 = 45, поэтому x = 45/0.75 = 60' },
  // Hard (3)
  { id: 'perc-mt-7', difficulty: 'hard', question: 'Цена снизилась на 30%, затем на 10%. Общее снижение?', options: ['37%', '40%', '33%', '20%'], correct: '37%', explanation: '0.7 × 0.9 = 0.63, снижение = 100% - 63% = 37%' },
  { id: 'perc-mt-8', difficulty: 'hard', question: 'После уменьшения на 20% число стало 80. Исходное?', options: ['100', '96', '64', '160'], correct: '100', explanation: 'x × 0.8 = 80, поэтому x = 100' },
  { id: 'perc-mt-9', difficulty: 'hard', question: 'На сколько % нужно увеличить 80, чтобы получить 100?', options: ['25%', '20%', '125%', '80%'], correct: '25%', explanation: '(100-80)/80 × 100% = 25%' },
];

// ============================================
// PERCENTAGES - Full Test (20 questions)
// ============================================
export const percentagesFullTest: SimpleTestQuestion[] = [
  { id: 'perc-ft-1', question: '25% от 120 = ?', options: ['30', '25', '45', '3'], correct: '30', explanation: '0.25 × 120 = 30' },
  { id: 'perc-ft-2', question: 'Преобразуйте 0.75 в проценты', options: ['75%', '7.5%', '0.75%', '750%'], correct: '75%', explanation: '0.75 = 75%' },
  { id: 'perc-ft-3', question: '100% от числа = ?', options: ['Всё число', 'Половина', 'Ничего', '10%'], correct: 'Всё число', explanation: '100% = целое число' },
  { id: 'perc-ft-4', question: 'Найдите 15% от 60', options: ['9', '15', '45', '0.9'], correct: '9', explanation: '0.15 × 60 = 9' },
  { id: 'perc-ft-5', question: '80 — это сколько % от 200?', options: ['40%', '80%', '250%', '25%'], correct: '40%', explanation: '80/200 = 0.4 = 40%' },
  { id: 'perc-ft-6', question: 'Увеличьте 50 на 10%', options: ['55', '60', '45', '5'], correct: '55', explanation: '50 × 1.1 = 55' },
  { id: 'perc-ft-7', question: 'Уменьшите 80 на 25%', options: ['60', '55', '20', '100'], correct: '60', explanation: '80 × 0.75 = 60' },
  { id: 'perc-ft-8', question: 'Преобразуйте 3/10 в проценты', options: ['30%', '3%', '10%', '0.3%'], correct: '30%', explanation: '3/10 = 0.3 = 30%' },
  { id: 'perc-ft-9', question: '200% от 25 = ?', options: ['50', '12.5', '25', '200'], correct: '50', explanation: '2 × 25 = 50' },
  { id: 'perc-ft-10', question: 'Какое число, если 40% от него = 28?', options: ['70', '11.2', '68', '56'], correct: '70', explanation: 'x × 0.4 = 28, x = 70' },
  { id: 'perc-ft-11', question: 'Цена была 100, стала 130. На сколько % выросла?', options: ['30%', '130%', '13%', '23%'], correct: '30%', explanation: '(130-100)/100 = 30%' },
  { id: 'perc-ft-12', question: '0.5% от 200 = ?', options: ['1', '10', '100', '0.1'], correct: '1', explanation: '0.005 × 200 = 1' },
  { id: 'perc-ft-13', question: 'Преобразуйте 150% в десятичную дробь', options: ['1.5', '15', '0.15', '150'], correct: '1.5', explanation: '150% = 1.5' },
  { id: 'perc-ft-14', question: '60 — это 150% от какого числа?', options: ['40', '90', '36', '100'], correct: '40', explanation: '60/1.5 = 40' },
  { id: 'perc-ft-15', question: 'Товар подорожал с 50 до 65. На сколько %?', options: ['30%', '15%', '65%', '23%'], correct: '30%', explanation: '(65-50)/50 = 30%' },
  { id: 'perc-ft-16', question: 'Найдите 33⅓% от 90', options: ['30', '60', '27', '3'], correct: '30', explanation: '33⅓% = 1/3, так что 90/3 = 30' },
  { id: 'perc-ft-17', question: 'После скидки 40% товар стоит 60. Исходная цена?', options: ['100', '24', '84', '150'], correct: '100', explanation: 'x × 0.6 = 60, x = 100' },
  { id: 'perc-ft-18', question: '5% + 5% = ?', options: ['10%', '25%', '0.1%', '1%'], correct: '10%', explanation: '5% + 5% = 10%' },
  { id: 'perc-ft-19', question: 'Какой % составляет 7 от 28?', options: ['25%', '4%', '7%', '35%'], correct: '25%', explanation: '7/28 = 0.25 = 25%' },
  { id: 'perc-ft-20', question: '12 — это 60% от какого числа?', options: ['20', '7.2', '72', '200'], correct: '20', explanation: '12/0.6 = 20' },
];

// ============================================
// SIMPLE EQUATIONS - Mini Tests (9 questions)
// ============================================
export const simpleEquationsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'eq-mt-1', difficulty: 'easy', question: 'Решите: x + 5 = 12', options: ['7', '17', '5', '-7'], correct: '7', explanation: 'x = 12 - 5 = 7' },
  { id: 'eq-mt-2', difficulty: 'easy', question: 'Решите: 3x = 15', options: ['5', '45', '12', '3'], correct: '5', explanation: 'x = 15/3 = 5' },
  { id: 'eq-mt-3', difficulty: 'easy', question: 'Решите: x - 4 = 10', options: ['14', '6', '-6', '40'], correct: '14', explanation: 'x = 10 + 4 = 14' },
  // Medium (3)
  { id: 'eq-mt-4', difficulty: 'medium', question: 'Решите: 2x + 3 = 11', options: ['4', '7', '5.5', '14'], correct: '4', explanation: '2x = 11 - 3 = 8, x = 4' },
  { id: 'eq-mt-5', difficulty: 'medium', question: 'Решите: 5x - 2 = 18', options: ['4', '3.2', '20', '16'], correct: '4', explanation: '5x = 20, x = 4' },
  { id: 'eq-mt-6', difficulty: 'medium', question: 'Решите: x/4 = 3', options: ['12', '0.75', '7', '1'], correct: '12', explanation: 'x = 3 × 4 = 12' },
  // Hard (3)
  { id: 'eq-mt-7', difficulty: 'hard', question: 'Решите: 3(x + 2) = 15', options: ['3', '5', '1', '11'], correct: '3', explanation: '3x + 6 = 15, 3x = 9, x = 3' },
  { id: 'eq-mt-8', difficulty: 'hard', question: 'Решите: 2x - 3 = x + 5', options: ['8', '2', '-2', '5'], correct: '8', explanation: '2x - x = 5 + 3, x = 8' },
  { id: 'eq-mt-9', difficulty: 'hard', question: 'Решите: (x - 1)/2 = 4', options: ['9', '7', '3', '4.5'], correct: '9', explanation: 'x - 1 = 8, x = 9' },
];

// ============================================
// SIMPLE EQUATIONS - Full Test (20 questions)
// ============================================
export const simpleEquationsFullTest: SimpleTestQuestion[] = [
  { id: 'eq-ft-1', question: 'Решите: x + 7 = 15', options: ['8', '22', '-8', '7'], correct: '8', explanation: 'x = 15 - 7 = 8' },
  { id: 'eq-ft-2', question: 'Решите: 4x = 24', options: ['6', '28', '20', '96'], correct: '6', explanation: 'x = 24/4 = 6' },
  { id: 'eq-ft-3', question: 'Решите: x - 9 = 5', options: ['14', '-4', '4', '45'], correct: '14', explanation: 'x = 5 + 9 = 14' },
  { id: 'eq-ft-4', question: 'Решите: x/3 = 7', options: ['21', '4', '10', '2.33'], correct: '21', explanation: 'x = 7 × 3 = 21' },
  { id: 'eq-ft-5', question: 'Решите: 2x + 5 = 17', options: ['6', '11', '7', '22'], correct: '6', explanation: '2x = 12, x = 6' },
  { id: 'eq-ft-6', question: 'Решите: 3x - 4 = 14', options: ['6', '10', '3.33', '18'], correct: '6', explanation: '3x = 18, x = 6' },
  { id: 'eq-ft-7', question: 'Решите: 5x = -25', options: ['-5', '5', '-30', '30'], correct: '-5', explanation: 'x = -25/5 = -5' },
  { id: 'eq-ft-8', question: 'Решите: -x = 8', options: ['-8', '8', '-1/8', '1/8'], correct: '-8', explanation: 'x = -8' },
  { id: 'eq-ft-9', question: 'Решите: x + x = 14', options: ['7', '14', '28', '0'], correct: '7', explanation: '2x = 14, x = 7' },
  { id: 'eq-ft-10', question: 'Решите: 4(x - 2) = 12', options: ['5', '3.5', '8', '1'], correct: '5', explanation: 'x - 2 = 3, x = 5' },
  { id: 'eq-ft-11', question: 'Решите: x/2 + 3 = 10', options: ['14', '3.5', '20', '13'], correct: '14', explanation: 'x/2 = 7, x = 14' },
  { id: 'eq-ft-12', question: 'Решите: 3x + 2x = 25', options: ['5', '12.5', '27', '23'], correct: '5', explanation: '5x = 25, x = 5' },
  { id: 'eq-ft-13', question: 'Решите: 2(x + 3) = x + 10', options: ['4', '7', '1', '16'], correct: '4', explanation: '2x + 6 = x + 10, x = 4' },
  { id: 'eq-ft-14', question: 'Решите: 6x - 2 = 4x + 6', options: ['4', '2', '8', '-2'], correct: '4', explanation: '2x = 8, x = 4' },
  { id: 'eq-ft-15', question: 'Решите: 0.5x = 10', options: ['20', '5', '10.5', '9.5'], correct: '20', explanation: 'x = 10/0.5 = 20' },
  { id: 'eq-ft-16', question: 'Решите: x - 2.5 = 7.5', options: ['10', '5', '-5', '18.75'], correct: '10', explanation: 'x = 7.5 + 2.5 = 10' },
  { id: 'eq-ft-17', question: 'Если x + 5 = 2x, чему равен x?', options: ['5', '-5', '2.5', '10'], correct: '5', explanation: '5 = x' },
  { id: 'eq-ft-18', question: 'Решите: 3(2x - 1) = 9', options: ['2', '1', '3', '4'], correct: '2', explanation: '6x - 3 = 9, 6x = 12, x = 2' },
  { id: 'eq-ft-19', question: 'Решите: x/5 - 2 = 0', options: ['10', '2.5', '-10', '7'], correct: '10', explanation: 'x/5 = 2, x = 10' },
  { id: 'eq-ft-20', question: 'Решите: -2x + 8 = 0', options: ['4', '-4', '16', '-16'], correct: '4', explanation: '-2x = -8, x = 4' },
];

// ============================================
// SQUARE ROOT - Mini Tests (9 questions)
// ============================================
export const squareRootMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'sqrt-mt-1', difficulty: 'easy', question: '√16 = ?', options: ['4', '8', '2', '256'], correct: '4', explanation: '√16 = 4, потому что 4² = 16' },
  { id: 'sqrt-mt-2', difficulty: 'easy', question: '√9 = ?', options: ['3', '81', '4.5', '6'], correct: '3', explanation: '√9 = 3, потому что 3² = 9' },
  { id: 'sqrt-mt-3', difficulty: 'easy', question: '√100 = ?', options: ['10', '50', '1000', '5'], correct: '10', explanation: '√100 = 10' },
  // Medium (3)
  { id: 'sqrt-mt-4', difficulty: 'medium', question: '√49 + √25 = ?', options: ['12', '74', '14', '24'], correct: '12', explanation: '7 + 5 = 12' },
  { id: 'sqrt-mt-5', difficulty: 'medium', question: '√144 = ?', options: ['12', '72', '14', '11'], correct: '12', explanation: '12² = 144' },
  { id: 'sqrt-mt-6', difficulty: 'medium', question: '(√5)² = ?', options: ['5', '25', '√25', '10'], correct: '5', explanation: '(√5)² = 5' },
  // Hard (3)
  { id: 'sqrt-mt-7', difficulty: 'hard', question: '√50 = ?', options: ['5√2', '25', '√25 × √2', '10'], correct: '5√2', explanation: '√50 = √(25×2) = 5√2' },
  { id: 'sqrt-mt-8', difficulty: 'hard', question: '√12 × √3 = ?', options: ['6', '√36', '36', '√15'], correct: '6', explanation: '√12 × √3 = √36 = 6' },
  { id: 'sqrt-mt-9', difficulty: 'hard', question: '√(x²) = ?', options: ['|x|', 'x', 'x²', '±x'], correct: '|x|', explanation: '√(x²) = |x| (абсолютное значение)' },
];

// ============================================
// PROPORTIONS - Mini Tests (9 questions)
// ============================================
export const proportionsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'prop-mt-1', difficulty: 'easy', question: '2/4 = x/8. Найдите x', options: ['4', '2', '16', '1'], correct: '4', explanation: '2/4 = 1/2, так что x/8 = 1/2, x = 4' },
  { id: 'prop-mt-2', difficulty: 'easy', question: '3/6 = ?/12', options: ['6', '3', '24', '2'], correct: '6', explanation: '3/6 = 1/2, так что ?/12 = 1/2, ? = 6' },
  { id: 'prop-mt-3', difficulty: 'easy', question: 'Если 2:4 = 5:x, найдите x', options: ['10', '2.5', '20', '1'], correct: '10', explanation: '2/4 = 5/x, x = 10' },
  // Medium (3)
  { id: 'prop-mt-4', difficulty: 'medium', question: 'За 3 часа машина проехала 180 км. За 5 часов?', options: ['300 км', '540 км', '60 км', '900 км'], correct: '300 км', explanation: '180/3 = 60 км/ч, 60 × 5 = 300 км' },
  { id: 'prop-mt-5', difficulty: 'medium', question: '4 рабочих за 6 дней. 8 рабочих за?', options: ['3 дня', '12 дней', '48 дней', '2 дня'], correct: '3 дня', explanation: 'Обратная пропорция: 4×6 = 8×x, x = 3' },
  { id: 'prop-mt-6', difficulty: 'medium', question: 'x/5 = 12/15. Найдите x', options: ['4', '36', '9', '3'], correct: '4', explanation: 'x = 5 × 12/15 = 4' },
  // Hard (3)
  { id: 'prop-mt-7', difficulty: 'hard', question: 'Отношение 3:5 = ?:35', options: ['21', '15', '17.5', '7'], correct: '21', explanation: '? = 3 × 35/5 = 21' },
  { id: 'prop-mt-8', difficulty: 'hard', question: '(x+2)/6 = 5/3. Найдите x', options: ['8', '10', '4', '3'], correct: '8', explanation: 'x+2 = 6×5/3 = 10, x = 8' },
  { id: 'prop-mt-9', difficulty: 'hard', question: 'Деньги делят 2:3:5. Если всего 50, сколько получит средний?', options: ['15', '10', '25', '20'], correct: '15', explanation: '2+3+5=10, средний: 50×3/10 = 15' },
];

// ============================================
// TRIANGLES - Mini Tests (9 questions)
// ============================================
export const trianglesMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'tri-mt-1', difficulty: 'easy', question: 'Сумма углов треугольника равна:', options: ['180°', '360°', '90°', '270°'], correct: '180°', explanation: 'Сумма углов любого треугольника = 180°' },
  { id: 'tri-mt-2', difficulty: 'easy', question: 'Если два угла 60° и 70°, третий:', options: ['50°', '130°', '60°', '110°'], correct: '50°', explanation: '180° - 60° - 70° = 50°' },
  { id: 'tri-mt-3', difficulty: 'easy', question: 'В равностороннем треугольнике каждый угол:', options: ['60°', '90°', '45°', '120°'], correct: '60°', explanation: '180°/3 = 60°' },
  // Medium (3)
  { id: 'tri-mt-4', difficulty: 'medium', question: 'Площадь треугольника с основанием 8 и высотой 5:', options: ['20', '40', '13', '6.5'], correct: '20', explanation: 'S = (1/2) × 8 × 5 = 20' },
  { id: 'tri-mt-5', difficulty: 'medium', question: 'В прямоугольном треугольнике катеты 3 и 4. Гипотенуза:', options: ['5', '7', '12', '√7'], correct: '5', explanation: 'По теореме Пифагора: √(9+16) = 5' },
  { id: 'tri-mt-6', difficulty: 'medium', question: 'Внешний угол треугольника равен:', options: ['Сумме двух внутренних несмежных', '180°', '90°', 'Смежному углу'], correct: 'Сумме двух внутренних несмежных', explanation: 'Внешний угол = сумма двух несмежных внутренних' },
  // Hard (3)
  { id: 'tri-mt-7', difficulty: 'hard', question: 'В треугольнике стороны 5, 12, 13. Это:', options: ['Прямоугольный', 'Равнобедренный', 'Равносторонний', 'Тупоугольный'], correct: 'Прямоугольный', explanation: '5² + 12² = 13² (25 + 144 = 169)' },
  { id: 'tri-mt-8', difficulty: 'hard', question: 'Медиана делит треугольник на:', options: ['2 равновеликих', '2 равных', '3 части', '4 части'], correct: '2 равновеликих', explanation: 'Медиана делит на два треугольника равной площади' },
  { id: 'tri-mt-9', difficulty: 'hard', question: 'Периметр равностороннего △ с стороной 7:', options: ['21', '49', '14', '7'], correct: '21', explanation: 'P = 3 × 7 = 21' },
];

// ============================================
// COORDINATES - Mini Tests (9 questions)
// ============================================
export const coordinatesMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'coord-mt-1', difficulty: 'easy', question: 'Точка A(3, 5). Какова абсцисса?', options: ['3', '5', '8', '15'], correct: '3', explanation: 'Абсцисса — первая координата (x = 3)' },
  { id: 'coord-mt-2', difficulty: 'easy', question: 'В какой четверти точка (2, 3)?', options: ['I', 'II', 'III', 'IV'], correct: 'I', explanation: 'x > 0 и y > 0 → I четверть' },
  { id: 'coord-mt-3', difficulty: 'easy', question: 'Точка на оси X имеет координаты:', options: ['(a, 0)', '(0, b)', '(0, 0)', '(a, a)'], correct: '(a, 0)', explanation: 'На оси X ордината y = 0' },
  // Medium (3)
  { id: 'coord-mt-4', difficulty: 'medium', question: 'Расстояние между (0,0) и (3,4):', options: ['5', '7', '12', '1'], correct: '5', explanation: 'd = √(3² + 4²) = 5' },
  { id: 'coord-mt-5', difficulty: 'medium', question: 'Середина отрезка (2,4) и (6,8):', options: ['(4, 6)', '(8, 12)', '(4, 4)', '(3, 6)'], correct: '(4, 6)', explanation: '((2+6)/2, (4+8)/2) = (4, 6)' },
  { id: 'coord-mt-6', difficulty: 'medium', question: 'В какой четверти (-3, 5)?', options: ['II', 'I', 'III', 'IV'], correct: 'II', explanation: 'x < 0, y > 0 → II четверть' },
  // Hard (3)
  { id: 'coord-mt-7', difficulty: 'hard', question: 'Уравнение y = 2x проходит через:', options: ['(0, 0)', '(0, 2)', '(2, 0)', '(1, 1)'], correct: '(0, 0)', explanation: 'При x = 0, y = 0' },
  { id: 'coord-mt-8', difficulty: 'hard', question: 'Точка симметрична (3, -2) относительно оси X:', options: ['(3, 2)', '(-3, -2)', '(-3, 2)', '(3, -2)'], correct: '(3, 2)', explanation: 'Меняется знак y: (3, 2)' },
  { id: 'coord-mt-9', difficulty: 'hard', question: 'Расстояние между (1, 2) и (4, 6):', options: ['5', '7', '10', '3'], correct: '5', explanation: 'd = √(9 + 16) = 5' },
];

// ============================================
// FUNCTIONS - Mini Tests (9 questions)
// ============================================
export const functionsMiniTests: SimpleTestQuestion[] = [
  // Easy (3)
  { id: 'func-mt-1', difficulty: 'easy', question: 'Если f(x) = 2x, то f(3) = ?', options: ['6', '5', '23', '32'], correct: '6', explanation: 'f(3) = 2 × 3 = 6' },
  { id: 'func-mt-2', difficulty: 'easy', question: 'Если f(x) = x + 1, то f(0) = ?', options: ['1', '0', '-1', 'x'], correct: '1', explanation: 'f(0) = 0 + 1 = 1' },
  { id: 'func-mt-3', difficulty: 'easy', question: 'График y = 2 — это:', options: ['Горизонтальная прямая', 'Вертикальная прямая', 'Парабола', 'Наклонная прямая'], correct: 'Горизонтальная прямая', explanation: 'y = 2 — горизонтальная линия на уровне 2' },
  // Medium (3)
  { id: 'func-mt-4', difficulty: 'medium', question: 'Если f(x) = x², то f(-2) = ?', options: ['4', '-4', '2', '-2'], correct: '4', explanation: 'f(-2) = (-2)² = 4' },
  { id: 'func-mt-5', difficulty: 'medium', question: 'Для y = 3x + 2, угловой коэффициент:', options: ['3', '2', '5', '6'], correct: '3', explanation: 'В y = kx + b, k = 3' },
  { id: 'func-mt-6', difficulty: 'medium', question: 'Если f(x) = 2x - 1, найдите x при f(x) = 5', options: ['3', '4', '2', '9'], correct: '3', explanation: '2x - 1 = 5, x = 3' },
  // Hard (3)
  { id: 'func-mt-7', difficulty: 'hard', question: 'Область определения f(x) = 1/x:', options: ['x ≠ 0', 'Все числа', 'x > 0', 'x ≥ 0'], correct: 'x ≠ 0', explanation: 'Деление на 0 невозможно' },
  { id: 'func-mt-8', difficulty: 'hard', question: 'Если f(x) = x² + 1, то f(f(1)) = ?', options: ['5', '2', '4', '3'], correct: '5', explanation: 'f(1) = 2, f(2) = 5' },
  { id: 'func-mt-9', difficulty: 'hard', question: 'Точка пересечения y = x + 1 и y = -x + 3:', options: ['(1, 2)', '(2, 1)', '(0, 1)', '(1, 1)'], correct: '(1, 2)', explanation: 'x + 1 = -x + 3, x = 1, y = 2' },
];

// ============================================
// TOPIC → TEST MAPPING (NORMALIZED)
// ============================================
// Maps diagnostic topics to their test data
// ============================================

export const lessonTests: Record<string, { miniTests: SimpleTestQuestion[]; fullTest: SimpleTestQuestion[] }> = {
  // Core topics from diagnostic
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
  
  // Additional ORT topics (newly added)
  'decimal fractions': {
    miniTests: decimalFractionsMiniTests,
    fullTest: decimalFractionsFullTest,
  },
  decimalfractions: {
    miniTests: decimalFractionsMiniTests,
    fullTest: decimalFractionsFullTest,
  },
  decimals: {
    miniTests: decimalFractionsMiniTests,
    fullTest: decimalFractionsFullTest,
  },
  
  percentages: {
    miniTests: percentagesMiniTests,
    fullTest: percentagesFullTest,
  },
  percent: {
    miniTests: percentagesMiniTests,
    fullTest: percentagesFullTest,
  },
  
  'simple equations': {
    miniTests: simpleEquationsMiniTests,
    fullTest: simpleEquationsFullTest,
  },
  equations: {
    miniTests: simpleEquationsMiniTests,
    fullTest: simpleEquationsFullTest,
  },
  simpleequations: {
    miniTests: simpleEquationsMiniTests,
    fullTest: simpleEquationsFullTest,
  },
  
  'square root': {
    miniTests: squareRootMiniTests,
    fullTest: squareRootMiniTests.concat(squareRootMiniTests), // Extend for full test
  },
  squareroot: {
    miniTests: squareRootMiniTests,
    fullTest: squareRootMiniTests.concat(squareRootMiniTests),
  },
  
  proportions: {
    miniTests: proportionsMiniTests,
    fullTest: proportionsMiniTests.concat(proportionsMiniTests),
  },
  
  triangles: {
    miniTests: trianglesMiniTests,
    fullTest: trianglesMiniTests.concat(trianglesMiniTests),
  },
  
  coordinates: {
    miniTests: coordinatesMiniTests,
    fullTest: coordinatesMiniTests.concat(coordinatesMiniTests),
  },
  
  functions: {
    miniTests: functionsMiniTests,
    fullTest: functionsMiniTests.concat(functionsMiniTests),
  },
  
  // Aliases for common topic names
  'operations with fractions': {
    miniTests: fractionsMiniTests,
    fullTest: fractionsFullTest,
  },
  'operations with decimals': {
    miniTests: decimalFractionsMiniTests,
    fullTest: decimalFractionsFullTest,
  },
};

// ============================================
// HELPER: Get tests for any topic (with fallback)
// ============================================
export function getTestsForTopic(topicName: string): { miniTests: SimpleTestQuestion[]; fullTest: SimpleTestQuestion[] } | null {
  // Normalize topic name
  const normalized = topicName.toLowerCase().trim().replace(/\s+/g, '');
  
  // Direct match
  if (lessonTests[normalized]) {
    return lessonTests[normalized];
  }
  
  // Try lowercase with spaces
  const withSpaces = topicName.toLowerCase().trim();
  if (lessonTests[withSpaces]) {
    return lessonTests[withSpaces];
  }
  
  // Partial match
  for (const key of Object.keys(lessonTests)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return lessonTests[key];
    }
  }
  
  console.log(`No test data found for topic: ${topicName}`);
  return null;
}

// ============================================
// FALLBACK: Generate basic test if none found
// ============================================
export function generateFallbackMiniTest(topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): SimpleTestQuestion[] {
  console.log(`Generating fallback test for: ${topic}`);
  
  return [
    {
      id: `fallback-${topic}-1`,
      difficulty,
      question: `Тестовый вопрос по теме "${topic}" #1`,
      options: ['Ответ A', 'Ответ B', 'Ответ C', 'Ответ D'],
      correct: 'Ответ A',
      explanation: `Это резервный вопрос по теме "${topic}". Полные тесты скоро будут добавлены.`,
    },
    {
      id: `fallback-${topic}-2`,
      difficulty,
      question: `Тестовый вопрос по теме "${topic}" #2`,
      options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
      correct: 'Вариант 1',
      explanation: `Это резервный вопрос по теме "${topic}".`,
    },
    {
      id: `fallback-${topic}-3`,
      difficulty,
      question: `Тестовый вопрос по теме "${topic}" #3`,
      options: ['A', 'B', 'C', 'D'],
      correct: 'A',
      explanation: `Это резервный вопрос по теме "${topic}".`,
    },
  ];
}
