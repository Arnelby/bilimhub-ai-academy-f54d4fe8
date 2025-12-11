export type LearningStyle = 'visual' | 'auditory' | 'text-based' | 'problem-solver' | 'adhd-friendly';

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  imagePlaceholder?: string;
}

export interface BasicLessonContent {
  theory: LessonSection[];
  examples: LessonSection[];
  practiceQuestions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    imagePlaceholder?: string;
  }[];
}

export interface MiniLessonContent {
  id: string;
  title: string;
  duration: string;
  concept: string;
  explanation: string;
  videoPlaceholder: string;
  keyTakeaway: string;
}

export interface DiagramContent {
  id: string;
  title: string;
  description: string;
  imagePlaceholder: string;
  type: 'cheat-sheet' | 'flowchart' | 'step-diagram';
}

export interface CommonMistake {
  id: string;
  mistake: string;
  explanation: string;
  fix: string[];
  imagePlaceholder?: string;
}

export interface MiniTestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
  imagePlaceholder?: string;
}

export interface FullTestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  imagePlaceholder?: string;
}

export interface DynamicLessonTemplate {
  learningStyle: LearningStyle;
  approach: string;
  contentFormat: string;
  pacing: string;
  visualAids: string;
}

export interface MathTopic {
  id: string;
  title: string;
  titleRu: string;
  titleKg: string;
  description: string;
  basicLesson: BasicLessonContent;
  miniLessons: MiniLessonContent[];
  diagrams: DiagramContent[];
  commonMistakes: CommonMistake[];
  miniTestQuestions: MiniTestQuestion[];
  fullTestQuestions: FullTestQuestion[];
  dynamicLessonTemplates: DynamicLessonTemplate[];
}

export const mathTopics: MathTopic[] = [
  {
    id: 'fractions',
    title: 'Fractions',
    titleRu: 'Дроби',
    titleKg: 'Бөлчөктөр',
    description: 'Learn to work with fractions: addition, subtraction, multiplication, and division',
    basicLesson: {
      theory: [
        {
          id: 'theory-1',
          title: 'What is a Fraction?',
          content: 'A fraction represents a part of a whole. It consists of a numerator (top number) and a denominator (bottom number). The denominator tells us how many equal parts the whole is divided into, and the numerator tells us how many parts we have.',
          imagePlaceholder: 'Image placeholder: Fraction diagram showing parts of a whole (to be uploaded)'
        },
        {
          id: 'theory-2',
          title: 'Types of Fractions',
          content: 'Proper fractions have a numerator smaller than the denominator (e.g., 3/4). Improper fractions have a numerator greater than or equal to the denominator (e.g., 5/3). Mixed numbers combine a whole number with a fraction (e.g., 2 1/2).',
          imagePlaceholder: 'Image placeholder: Visual comparison of fraction types (to be uploaded)'
        },
        {
          id: 'theory-3',
          title: 'Equivalent Fractions',
          content: 'Equivalent fractions are different fractions that represent the same value. For example, 1/2 = 2/4 = 3/6. You can create equivalent fractions by multiplying or dividing both the numerator and denominator by the same number.',
          imagePlaceholder: 'Image placeholder: Equivalent fractions visual (to be uploaded)'
        }
      ],
      examples: [
        {
          id: 'example-1',
          title: 'Adding Fractions with Same Denominator',
          content: 'To add fractions with the same denominator, add the numerators and keep the denominator the same.\n\nExample: 2/5 + 1/5 = (2+1)/5 = 3/5',
          imagePlaceholder: 'Image placeholder: Step-by-step addition diagram (to be uploaded)'
        },
        {
          id: 'example-2',
          title: 'Adding Fractions with Different Denominators',
          content: 'To add fractions with different denominators:\n1. Find a common denominator\n2. Convert each fraction\n3. Add the numerators\n\nExample: 1/3 + 1/4\n= 4/12 + 3/12\n= 7/12',
          imagePlaceholder: 'Image placeholder: LCD finding visual (to be uploaded)'
        },
        {
          id: 'example-3',
          title: 'Multiplying Fractions',
          content: 'To multiply fractions, multiply the numerators together and multiply the denominators together.\n\nExample: 2/3 × 3/4 = (2×3)/(3×4) = 6/12 = 1/2',
          imagePlaceholder: 'Image placeholder: Multiplication area model (to be uploaded)'
        }
      ],
      practiceQuestions: [
        {
          id: 'practice-1',
          question: 'What is 3/8 + 2/8?',
          options: ['5/8', '5/16', '6/8', '1/8'],
          correctAnswer: 0,
          explanation: 'When adding fractions with the same denominator, add the numerators: 3 + 2 = 5, keeping the denominator 8.'
        },
        {
          id: 'practice-2',
          question: 'Simplify 6/9 to its lowest terms.',
          options: ['2/3', '3/4', '1/2', '4/6'],
          correctAnswer: 0,
          explanation: 'Divide both numerator and denominator by their GCD (3): 6÷3 = 2, 9÷3 = 3, so 6/9 = 2/3.'
        },
        {
          id: 'practice-3',
          question: 'What is 1/2 × 2/3?',
          options: ['1/3', '2/5', '3/5', '1/6'],
          correctAnswer: 0,
          explanation: 'Multiply numerators (1×2=2) and denominators (2×3=6): 2/6 = 1/3.'
        }
      ]
    },
    miniLessons: [
      {
        id: 'mini-1',
        title: 'Understanding Numerator & Denominator',
        duration: '3 min',
        concept: 'The parts of a fraction',
        explanation: 'The numerator (top) counts how many parts you have. The denominator (bottom) tells you how many equal parts make up the whole.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Numerator = parts you have, Denominator = total equal parts'
      },
      {
        id: 'mini-2',
        title: 'Finding Common Denominators',
        duration: '4 min',
        concept: 'LCD for fraction operations',
        explanation: 'To add or subtract fractions, you need a common denominator. Find the Least Common Multiple (LCM) of both denominators.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'LCD = smallest number divisible by both denominators'
      },
      {
        id: 'mini-3',
        title: 'Simplifying Fractions',
        duration: '3 min',
        concept: 'Reducing to lowest terms',
        explanation: 'Divide both numerator and denominator by their Greatest Common Divisor (GCD) to get the simplest form.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Always simplify your final answer!'
      }
    ],
    diagrams: [
      {
        id: 'diagram-1',
        title: 'Fraction Operations Cheat Sheet',
        description: 'Quick reference for all fraction operations: addition, subtraction, multiplication, division',
        imagePlaceholder: 'Image placeholder: Fraction operations cheat sheet (to be uploaded)',
        type: 'cheat-sheet'
      },
      {
        id: 'diagram-2',
        title: 'Converting Between Fraction Types',
        description: 'Flowchart showing how to convert between proper, improper, and mixed fractions',
        imagePlaceholder: 'Image placeholder: Conversion flowchart (to be uploaded)',
        type: 'flowchart'
      },
      {
        id: 'diagram-3',
        title: 'Step-by-Step Division of Fractions',
        description: 'Visual guide: Keep-Change-Flip method for dividing fractions',
        imagePlaceholder: 'Image placeholder: Division steps diagram (to be uploaded)',
        type: 'step-diagram'
      }
    ],
    commonMistakes: [
      {
        id: 'mistake-1',
        mistake: 'Adding denominators when adding fractions',
        explanation: 'Students often add both numerators AND denominators. This is incorrect!',
        fix: [
          'Keep the denominator the same when adding fractions with like denominators',
          'Only add the numerators',
          'Example: 2/5 + 1/5 = 3/5 (NOT 3/10)'
        ],
        imagePlaceholder: 'Image placeholder: Correct vs incorrect addition (to be uploaded)'
      },
      {
        id: 'mistake-2',
        mistake: 'Forgetting to simplify the final answer',
        explanation: 'Many students get the right answer but forget to reduce it to lowest terms.',
        fix: [
          'Always check if your answer can be simplified',
          'Find the GCD of numerator and denominator',
          'Divide both by the GCD'
        ]
      },
      {
        id: 'mistake-3',
        mistake: 'Not finding LCD before adding unlike fractions',
        explanation: 'Adding fractions with different denominators directly gives wrong answers.',
        fix: [
          'First, find the Least Common Denominator',
          'Convert each fraction to equivalent fraction with LCD',
          'Then add the numerators'
        ],
        imagePlaceholder: 'Image placeholder: LCD finding process (to be uploaded)'
      }
    ],
    miniTestQuestions: [
      { id: 'mt-1', question: 'What is 1/4 + 1/4?', options: ['1/2', '2/8', '1/8', '2/4'], correctAnswer: 0, explanation: '1/4 + 1/4 = 2/4 = 1/2', difficulty: 1 },
      { id: 'mt-2', question: 'Simplify 8/12', options: ['2/3', '4/6', '3/4', '1/2'], correctAnswer: 0, explanation: 'GCD of 8 and 12 is 4. 8÷4=2, 12÷4=3', difficulty: 1 },
      { id: 'mt-3', question: 'What is 2/3 + 1/6?', options: ['5/6', '3/9', '1/2', '3/6'], correctAnswer: 0, explanation: 'LCD is 6. 2/3 = 4/6. 4/6 + 1/6 = 5/6', difficulty: 2 },
      { id: 'mt-4', question: 'Calculate 3/4 × 2/5', options: ['3/10', '6/20', '5/9', '6/9'], correctAnswer: 0, explanation: '(3×2)/(4×5) = 6/20 = 3/10', difficulty: 2 },
      { id: 'mt-5', question: 'What is 3/4 ÷ 1/2?', options: ['3/2', '3/8', '1/2', '6/4'], correctAnswer: 0, explanation: '3/4 × 2/1 = 6/4 = 3/2', difficulty: 2 },
      { id: 'mt-6', question: 'Convert 7/3 to a mixed number', options: ['2 1/3', '3 1/7', '1 4/3', '2 2/3'], correctAnswer: 0, explanation: '7 ÷ 3 = 2 remainder 1, so 2 1/3', difficulty: 2 },
      { id: 'mt-7', question: 'What is 5/6 - 1/4?', options: ['7/12', '4/2', '1/2', '6/10'], correctAnswer: 0, explanation: 'LCD is 12. 10/12 - 3/12 = 7/12', difficulty: 3 },
      { id: 'mt-8', question: 'Solve: (2/3 + 1/6) × 1/2', options: ['5/12', '3/9', '1/4', '5/6'], correctAnswer: 0, explanation: '(4/6 + 1/6) × 1/2 = 5/6 × 1/2 = 5/12', difficulty: 3 }
    ],
    fullTestQuestions: [
      { id: 'ft-1', question: 'What is the sum of 3/8 and 5/8?', options: ['1', '8/16', '8/8', '3/4'], correctAnswer: 0, explanation: '3/8 + 5/8 = 8/8 = 1', topic: 'Addition' },
      { id: 'ft-2', question: 'Which fraction is equivalent to 4/6?', options: ['2/3', '3/4', '1/2', '4/8'], correctAnswer: 0, explanation: '4/6 simplified by dividing by 2 gives 2/3', topic: 'Equivalence' },
      // Add more questions to reach 30...
      { id: 'ft-3', question: 'What is 7/8 - 3/8?', options: ['1/2', '4/8', '4/16', '10/8'], correctAnswer: 0, explanation: '7/8 - 3/8 = 4/8 = 1/2', topic: 'Subtraction' },
      { id: 'ft-4', question: 'Calculate 2/5 × 3/4', options: ['3/10', '6/20', '5/9', '6/9'], correctAnswer: 0, explanation: '(2×3)/(5×4) = 6/20 = 3/10', topic: 'Multiplication' },
      { id: 'ft-5', question: 'What is 4/5 ÷ 2/3?', options: ['6/5', '8/15', '2/5', '12/10'], correctAnswer: 0, explanation: '4/5 × 3/2 = 12/10 = 6/5', topic: 'Division' },
    ],
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Heavy use of diagrams, pie charts, and color-coded fraction bars', contentFormat: 'Infographics and animated visualizations', pacing: 'Medium pace with visual breaks', visualAids: 'Fraction circles, number lines, area models' },
      { learningStyle: 'auditory', approach: 'Audio explanations with verbal step-by-step walkthroughs', contentFormat: 'Podcast-style lessons with verbal examples', pacing: 'Slower pace with repetition', visualAids: 'Minimal, focus on spoken content' },
      { learningStyle: 'text-based', approach: 'Detailed written explanations with formulas', contentFormat: 'Structured text with bullet points and definitions', pacing: 'Self-paced reading', visualAids: 'Text-based examples and written solutions' },
      { learningStyle: 'problem-solver', approach: 'Practice-first methodology with immediate application', contentFormat: 'Problem sets with hints and solutions', pacing: 'Fast with many practice problems', visualAids: 'Solution walkthroughs' },
      { learningStyle: 'adhd-friendly', approach: 'Short bursts, gamified elements, frequent rewards', contentFormat: 'Bite-sized chunks with interactive elements', pacing: 'Very short segments (1-2 min each)', visualAids: 'Colorful, engaging, minimal text' }
    ]
  },
  {
    id: 'exponents',
    title: 'Exponents',
    titleRu: 'Степени',
    titleKg: 'Даражалар',
    description: 'Master the laws of exponents and their applications',
    basicLesson: {
      theory: [
        {
          id: 'theory-1',
          title: 'What are Exponents?',
          content: 'An exponent tells us how many times to multiply a number by itself. In the expression a^n, "a" is the base and "n" is the exponent. For example, 2³ = 2 × 2 × 2 = 8.',
          imagePlaceholder: 'Image placeholder: Exponent notation diagram (to be uploaded)'
        },
        {
          id: 'theory-2',
          title: 'Laws of Exponents',
          content: '1. Product Rule: a^m × a^n = a^(m+n)\n2. Quotient Rule: a^m ÷ a^n = a^(m-n)\n3. Power Rule: (a^m)^n = a^(m×n)\n4. Zero Exponent: a^0 = 1\n5. Negative Exponent: a^(-n) = 1/a^n',
          imagePlaceholder: 'Image placeholder: Laws of exponents chart (to be uploaded)'
        },
        {
          id: 'theory-3',
          title: 'Special Cases',
          content: 'Any number raised to the power of 1 equals itself: a¹ = a. Zero raised to any positive power equals zero: 0^n = 0 (n > 0). One raised to any power equals one: 1^n = 1.',
          imagePlaceholder: 'Image placeholder: Special cases visual (to be uploaded)'
        }
      ],
      examples: [
        {
          id: 'example-1',
          title: 'Product Rule Example',
          content: 'Simplify: 2³ × 2⁴\n\nUsing the product rule: a^m × a^n = a^(m+n)\n2³ × 2⁴ = 2^(3+4) = 2⁷ = 128',
          imagePlaceholder: 'Image placeholder: Product rule visualization (to be uploaded)'
        },
        {
          id: 'example-2',
          title: 'Negative Exponent Example',
          content: 'Simplify: 3^(-2)\n\nUsing the negative exponent rule: a^(-n) = 1/a^n\n3^(-2) = 1/3² = 1/9',
          imagePlaceholder: 'Image placeholder: Negative exponent diagram (to be uploaded)'
        },
        {
          id: 'example-3',
          title: 'Combined Laws Example',
          content: 'Simplify: (2³)² × 2^(-1)\n\nStep 1: (2³)² = 2^(3×2) = 2⁶\nStep 2: 2⁶ × 2^(-1) = 2^(6-1) = 2⁵ = 32',
          imagePlaceholder: 'Image placeholder: Combined laws step-by-step (to be uploaded)'
        }
      ],
      practiceQuestions: [
        {
          id: 'practice-1',
          question: 'What is 5² × 5³?',
          options: ['5⁵', '5⁶', '25⁵', '5¹'],
          correctAnswer: 0,
          explanation: 'Using the product rule: 5² × 5³ = 5^(2+3) = 5⁵'
        },
        {
          id: 'practice-2',
          question: 'Simplify: 10⁰',
          options: ['1', '0', '10', 'undefined'],
          correctAnswer: 0,
          explanation: 'Any non-zero number raised to the power of 0 equals 1.'
        },
        {
          id: 'practice-3',
          question: 'What is 2^(-3)?',
          options: ['1/8', '-8', '-6', '1/6'],
          correctAnswer: 0,
          explanation: '2^(-3) = 1/2³ = 1/8'
        }
      ]
    },
    miniLessons: [
      {
        id: 'mini-1',
        title: 'Understanding Base and Exponent',
        duration: '3 min',
        concept: 'Components of exponential notation',
        explanation: 'The base is the number being multiplied, and the exponent tells us how many times.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Base^Exponent means base multiplied exponent times'
      },
      {
        id: 'mini-2',
        title: 'The Zero Exponent Rule',
        duration: '3 min',
        concept: 'Why anything^0 = 1',
        explanation: 'Using the quotient rule: a^n ÷ a^n = a^(n-n) = a^0 = 1',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'a^0 = 1 for any non-zero number a'
      },
      {
        id: 'mini-3',
        title: 'Negative Exponents Made Easy',
        duration: '4 min',
        concept: 'Understanding reciprocals',
        explanation: 'A negative exponent means "take the reciprocal". a^(-n) = 1/a^n',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Negative exponent = flip to denominator'
      }
    ],
    diagrams: [
      {
        id: 'diagram-1',
        title: 'Exponent Laws Quick Reference',
        description: 'All exponent laws in one visual cheat sheet',
        imagePlaceholder: 'Image placeholder: Exponent laws cheat sheet (to be uploaded)',
        type: 'cheat-sheet'
      },
      {
        id: 'diagram-2',
        title: 'Simplifying Exponents Flowchart',
        description: 'Decision tree for which exponent rule to apply',
        imagePlaceholder: 'Image placeholder: Exponent rules flowchart (to be uploaded)',
        type: 'flowchart'
      },
      {
        id: 'diagram-3',
        title: 'Powers of 2 Visual Guide',
        description: 'Visual representation of 2^1 through 2^10',
        imagePlaceholder: 'Image placeholder: Powers of 2 diagram (to be uploaded)',
        type: 'step-diagram'
      }
    ],
    commonMistakes: [
      {
        id: 'mistake-1',
        mistake: 'Multiplying exponents instead of adding (product rule)',
        explanation: 'Students often do 2³ × 2² = 2⁶ instead of 2⁵',
        fix: [
          'Remember: same base, ADD exponents',
          '2³ × 2² = 2^(3+2) = 2⁵',
          'Multiply exponents only with power rule: (2³)² = 2⁶'
        ],
        imagePlaceholder: 'Image placeholder: Product vs power rule comparison (to be uploaded)'
      },
      {
        id: 'mistake-2',
        mistake: 'Thinking a^0 = 0',
        explanation: 'Zero exponent does NOT mean zero result!',
        fix: [
          'Any non-zero number to the 0 power equals 1',
          '5^0 = 1, 100^0 = 1, (-3)^0 = 1',
          'Only 0^0 is undefined'
        ]
      },
      {
        id: 'mistake-3',
        mistake: 'Confusing negative base with negative exponent',
        explanation: '(-2)³ vs 2^(-3) are completely different!',
        fix: [
          '(-2)³ = -8 (negative base)',
          '2^(-3) = 1/8 (negative exponent)',
          'Parentheses matter!'
        ],
        imagePlaceholder: 'Image placeholder: Negative base vs exponent (to be uploaded)'
      }
    ],
    miniTestQuestions: [
      { id: 'mt-1', question: 'What is 3² × 3³?', options: ['3⁵', '3⁶', '9⁵', '3¹'], correctAnswer: 0, explanation: 'Product rule: 3^(2+3) = 3⁵', difficulty: 1 },
      { id: 'mt-2', question: 'Simplify: 7⁰', options: ['1', '0', '7', 'undefined'], correctAnswer: 0, explanation: 'Any non-zero number^0 = 1', difficulty: 1 },
      { id: 'mt-3', question: 'What is (2²)³?', options: ['2⁶', '2⁵', '2⁸', '2¹'], correctAnswer: 0, explanation: 'Power rule: 2^(2×3) = 2⁶', difficulty: 2 },
      { id: 'mt-4', question: 'Simplify: 5⁴ ÷ 5²', options: ['5²', '5⁶', '5⁸', '1'], correctAnswer: 0, explanation: 'Quotient rule: 5^(4-2) = 5²', difficulty: 2 },
      { id: 'mt-5', question: 'What is 4^(-2)?', options: ['1/16', '-16', '-8', '1/8'], correctAnswer: 0, explanation: '4^(-2) = 1/4² = 1/16', difficulty: 2 },
      { id: 'mt-6', question: 'Simplify: (3^2)^2 × 3^(-2)', options: ['3²', '3⁶', '3⁴', '1'], correctAnswer: 0, explanation: '3⁴ × 3^(-2) = 3^(4-2) = 3²', difficulty: 3 },
      { id: 'mt-7', question: 'What is 2⁵ ÷ 2⁷?', options: ['1/4', '2²', '4', '2^(-2)'], correctAnswer: 0, explanation: '2^(5-7) = 2^(-2) = 1/4', difficulty: 3 },
      { id: 'mt-8', question: 'Evaluate: (-1)^100', options: ['1', '-1', '100', '0'], correctAnswer: 0, explanation: 'Even power of -1 equals 1', difficulty: 3 }
    ],
    fullTestQuestions: [
      { id: 'ft-1', question: 'What is 2⁴?', options: ['16', '8', '32', '6'], correctAnswer: 0, explanation: '2⁴ = 2×2×2×2 = 16', topic: 'Basic' },
      { id: 'ft-2', question: 'Simplify: x³ × x⁵', options: ['x⁸', 'x¹⁵', '2x⁸', 'x²'], correctAnswer: 0, explanation: 'Product rule: x^(3+5) = x⁸', topic: 'Product Rule' },
      { id: 'ft-3', question: 'What is 10^(-1)?', options: ['0.1', '-10', '1', '-1'], correctAnswer: 0, explanation: '10^(-1) = 1/10 = 0.1', topic: 'Negative Exponents' },
      { id: 'ft-4', question: 'Simplify: (5²)⁰', options: ['1', '25', '0', '5'], correctAnswer: 0, explanation: 'Anything^0 = 1', topic: 'Zero Exponent' },
      { id: 'ft-5', question: 'What is 8^(1/3)?', options: ['2', '4', '3', '8/3'], correctAnswer: 0, explanation: '8^(1/3) = ∛8 = 2', topic: 'Fractional Exponents' },
    ],
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Color-coded exponent rules, animated multiplication sequences', contentFormat: 'Visual step-by-step breakdowns', pacing: 'Medium with visual pauses', visualAids: 'Exponent trees, multiplication diagrams' },
      { learningStyle: 'auditory', approach: 'Verbal patterns and rhymes for rules', contentFormat: 'Audio explanations with mnemonics', pacing: 'Repetitive for memorization', visualAids: 'Minimal' },
      { learningStyle: 'text-based', approach: 'Formal definitions and proofs', contentFormat: 'Mathematical notation with explanations', pacing: 'Self-paced reading', visualAids: 'Formula sheets' },
      { learningStyle: 'problem-solver', approach: 'Challenge problems first, rules derived from patterns', contentFormat: 'Problem sets with increasing difficulty', pacing: 'Fast-paced challenges', visualAids: 'Solution patterns' },
      { learningStyle: 'adhd-friendly', approach: 'Gamified exponent battles, quick wins', contentFormat: 'Interactive games, 2-min challenges', pacing: 'Very short with rewards', visualAids: 'Colorful, animated' }
    ]
  },
  {
    id: 'quadratic-equations',
    title: 'Quadratic Equations',
    titleRu: 'Квадратные уравнения',
    titleKg: 'Квадраттык теңдемелер',
    description: 'Solve quadratic equations using multiple methods',
    basicLesson: {
      theory: [
        {
          id: 'theory-1',
          title: 'What is a Quadratic Equation?',
          content: 'A quadratic equation is a polynomial equation of degree 2, written in standard form as ax² + bx + c = 0, where a ≠ 0. The solutions are called roots or zeros of the equation.',
          imagePlaceholder: 'Image placeholder: Quadratic equation parts diagram (to be uploaded)'
        },
        {
          id: 'theory-2',
          title: 'The Quadratic Formula',
          content: 'The quadratic formula gives us the solutions:\nx = (-b ± √(b² - 4ac)) / 2a\n\nThe discriminant D = b² - 4ac tells us:\n- D > 0: Two distinct real roots\n- D = 0: One repeated root\n- D < 0: No real roots',
          imagePlaceholder: 'Image placeholder: Quadratic formula visual (to be uploaded)'
        },
        {
          id: 'theory-3',
          title: 'Factoring Method',
          content: 'If ax² + bx + c can be factored as a(x - r₁)(x - r₂), then r₁ and r₂ are the roots. Look for two numbers that multiply to give ac and add to give b.',
          imagePlaceholder: 'Image placeholder: Factoring process diagram (to be uploaded)'
        }
      ],
      examples: [
        {
          id: 'example-1',
          title: 'Solving by Factoring',
          content: 'Solve: x² - 5x + 6 = 0\n\nFind two numbers that multiply to 6 and add to -5: -2 and -3\n(x - 2)(x - 3) = 0\nx = 2 or x = 3',
          imagePlaceholder: 'Image placeholder: Factoring step-by-step (to be uploaded)'
        },
        {
          id: 'example-2',
          title: 'Using the Quadratic Formula',
          content: 'Solve: 2x² + 3x - 2 = 0\n\na=2, b=3, c=-2\nD = 9 - 4(2)(-2) = 9 + 16 = 25\nx = (-3 ± 5) / 4\nx = 1/2 or x = -2',
          imagePlaceholder: 'Image placeholder: Formula substitution visual (to be uploaded)'
        },
        {
          id: 'example-3',
          title: 'Completing the Square',
          content: 'Solve: x² + 6x + 5 = 0\n\nx² + 6x = -5\nx² + 6x + 9 = -5 + 9\n(x + 3)² = 4\nx + 3 = ±2\nx = -1 or x = -5',
          imagePlaceholder: 'Image placeholder: Completing square visual (to be uploaded)'
        }
      ],
      practiceQuestions: [
        {
          id: 'practice-1',
          question: 'Solve: x² - 4 = 0',
          options: ['x = 2, x = -2', 'x = 4', 'x = 2', 'x = -4'],
          correctAnswer: 0,
          explanation: 'x² = 4, so x = ±√4 = ±2'
        },
        {
          id: 'practice-2',
          question: 'What is the discriminant of x² + 2x + 1 = 0?',
          options: ['0', '4', '-4', '1'],
          correctAnswer: 0,
          explanation: 'D = b² - 4ac = 4 - 4(1)(1) = 0'
        },
        {
          id: 'practice-3',
          question: 'Solve: x² - x - 6 = 0',
          options: ['x = 3, x = -2', 'x = 6, x = -1', 'x = 2, x = -3', 'x = 1, x = -6'],
          correctAnswer: 0,
          explanation: '(x-3)(x+2) = 0, so x = 3 or x = -2'
        }
      ]
    },
    miniLessons: [
      {
        id: 'mini-1',
        title: 'Identifying a, b, and c',
        duration: '3 min',
        concept: 'Standard form coefficients',
        explanation: 'In ax² + bx + c = 0: a is the coefficient of x², b is the coefficient of x, c is the constant term.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Always rewrite in standard form first!'
      },
      {
        id: 'mini-2',
        title: 'The Discriminant Secret',
        duration: '4 min',
        concept: 'Predicting solution types',
        explanation: 'Calculate D = b² - 4ac before solving to know what kind of roots to expect.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'D > 0 = 2 roots, D = 0 = 1 root, D < 0 = no real roots'
      },
      {
        id: 'mini-3',
        title: 'Quick Factoring Tricks',
        duration: '5 min',
        concept: 'Spotting factorable quadratics',
        explanation: 'Look for perfect squares, difference of squares, and simple integer factors.',
        videoPlaceholder: 'Video placeholder: YouTube link will be added later',
        keyTakeaway: 'Try factoring before using the formula!'
      }
    ],
    diagrams: [
      {
        id: 'diagram-1',
        title: 'Quadratic Solution Methods Cheat Sheet',
        description: 'When to use factoring, formula, or completing the square',
        imagePlaceholder: 'Image placeholder: Methods comparison cheat sheet (to be uploaded)',
        type: 'cheat-sheet'
      },
      {
        id: 'diagram-2',
        title: 'Choosing Your Solution Method',
        description: 'Flowchart to select the best approach for any quadratic',
        imagePlaceholder: 'Image placeholder: Method selection flowchart (to be uploaded)',
        type: 'flowchart'
      },
      {
        id: 'diagram-3',
        title: 'Quadratic Formula Step-by-Step',
        description: 'Visual guide through each step of applying the formula',
        imagePlaceholder: 'Image placeholder: Formula steps diagram (to be uploaded)',
        type: 'step-diagram'
      }
    ],
    commonMistakes: [
      {
        id: 'mistake-1',
        mistake: 'Forgetting the ± in the quadratic formula',
        explanation: 'The formula gives TWO solutions (usually), must use both + and -',
        fix: [
          'Always write ± when using the formula',
          'Calculate both: (-b + √D)/2a AND (-b - √D)/2a',
          'Check: D = 0 means only one solution'
        ],
        imagePlaceholder: 'Image placeholder: Plus-minus importance visual (to be uploaded)'
      },
      {
        id: 'mistake-2',
        mistake: 'Sign errors with negative b',
        explanation: 'When b is negative, -b becomes positive!',
        fix: [
          'Write out -b explicitly',
          'If b = -5, then -b = -(-5) = +5',
          'Double-check signs before calculating'
        ]
      },
      {
        id: 'mistake-3',
        mistake: 'Not checking solutions',
        explanation: 'Calculation errors are common; always verify!',
        fix: [
          'Substitute each solution back into original equation',
          'Both sides should equal zero',
          'If not, re-check your work'
        ],
        imagePlaceholder: 'Image placeholder: Solution verification example (to be uploaded)'
      }
    ],
    miniTestQuestions: [
      { id: 'mt-1', question: 'In 3x² - 5x + 2 = 0, what is b?', options: ['-5', '3', '2', '5'], correctAnswer: 0, explanation: 'b is the coefficient of x', difficulty: 1 },
      { id: 'mt-2', question: 'Solve: x² = 9', options: ['x = ±3', 'x = 3', 'x = 81', 'x = ±81'], correctAnswer: 0, explanation: 'x = ±√9 = ±3', difficulty: 1 },
      { id: 'mt-3', question: 'What is the discriminant of x² + 4x + 4 = 0?', options: ['0', '16', '-16', '4'], correctAnswer: 0, explanation: 'D = 16 - 16 = 0', difficulty: 2 },
      { id: 'mt-4', question: 'Solve: x² - 9 = 0', options: ['x = 3, x = -3', 'x = 9', 'x = -9', 'x = 3'], correctAnswer: 0, explanation: 'Difference of squares: (x-3)(x+3) = 0', difficulty: 2 },
      { id: 'mt-5', question: 'How many real roots does x² + 1 = 0 have?', options: ['0', '1', '2', 'Infinite'], correctAnswer: 0, explanation: 'D = 0 - 4 = -4 < 0, no real roots', difficulty: 2 },
      { id: 'mt-6', question: 'Solve: 2x² - 8x = 0', options: ['x = 0, x = 4', 'x = 4', 'x = 2', 'x = 0, x = 2'], correctAnswer: 0, explanation: '2x(x - 4) = 0', difficulty: 2 },
      { id: 'mt-7', question: 'Solve: x² + 5x + 6 = 0', options: ['x = -2, x = -3', 'x = 2, x = 3', 'x = -6, x = 1', 'x = 6, x = -1'], correctAnswer: 0, explanation: '(x+2)(x+3) = 0', difficulty: 3 },
      { id: 'mt-8', question: 'If D = 25 for a quadratic, how many real roots?', options: ['2', '1', '0', '25'], correctAnswer: 0, explanation: 'D > 0 means two distinct real roots', difficulty: 3 }
    ],
    fullTestQuestions: [
      { id: 'ft-1', question: 'Solve: x² - 1 = 0', options: ['x = 1, x = -1', 'x = 1', 'x = -1', 'x = 0'], correctAnswer: 0, explanation: '(x-1)(x+1) = 0', topic: 'Factoring' },
      { id: 'ft-2', question: 'What are the coefficients a, b, c in 5x² - 3x + 7 = 0?', options: ['5, -3, 7', '5, 3, 7', '-3, 5, 7', '5, 7, -3'], correctAnswer: 0, explanation: 'a=5, b=-3, c=7', topic: 'Standard Form' },
      { id: 'ft-3', question: 'Calculate the discriminant of 2x² + 4x + 2 = 0', options: ['0', '8', '-8', '16'], correctAnswer: 0, explanation: 'D = 16 - 16 = 0', topic: 'Discriminant' },
      { id: 'ft-4', question: 'Solve: x² + 2x - 3 = 0', options: ['x = 1, x = -3', 'x = -1, x = 3', 'x = 3, x = -1', 'x = -3, x = 1'], correctAnswer: 0, explanation: '(x+3)(x-1) = 0', topic: 'Factoring' },
      { id: 'ft-5', question: 'Using the quadratic formula, solve x² - 4x + 3 = 0', options: ['x = 1, x = 3', 'x = 2, x = 2', 'x = -1, x = -3', 'x = 4, x = 0'], correctAnswer: 0, explanation: 'x = (4 ± 2)/2', topic: 'Quadratic Formula' },
    ],
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Parabola graphs showing roots visually', contentFormat: 'Interactive graphing with colored regions', pacing: 'Medium with graph exploration', visualAids: 'Coordinate planes, parabola animations' },
      { learningStyle: 'auditory', approach: 'Formula sung/chanted, verbal walkthroughs', contentFormat: 'Audio lessons with formula memorization', pacing: 'Slower with repetition', visualAids: 'Minimal, voice-focused' },
      { learningStyle: 'text-based', approach: 'Detailed algebraic derivations', contentFormat: 'Step-by-step written proofs', pacing: 'Self-paced reading', visualAids: 'Written equations and solutions' },
      { learningStyle: 'problem-solver', approach: 'Real-world quadratic problems', contentFormat: 'Application problems (projectiles, areas)', pacing: 'Challenge-based progression', visualAids: 'Problem scenarios' },
      { learningStyle: 'adhd-friendly', approach: 'Quick method selection games', contentFormat: '2-min solving challenges', pacing: 'Very short with instant feedback', visualAids: 'Colorful, gamified interface' }
    ]
  }
];

export const contentTypeLabels = {
  basicLesson: { en: 'Basic Lesson', ru: 'Базовый урок', kg: 'Негизги сабак', icon: '📚' },
  miniLessons: { en: 'Mini Lessons', ru: 'Мини-уроки', kg: 'Мини сабактар', icon: '⚡' },
  diagrams: { en: 'Diagrams & Schemes', ru: 'Диаграммы и схемы', kg: 'Диаграммалар', icon: '📊' },
  commonMistakes: { en: 'Common Mistakes', ru: 'Частые ошибки', kg: 'Жалпы каталар', icon: '⚠️' },
  miniTests: { en: 'Mini-tests', ru: 'Мини-тесты', kg: 'Мини-тесттер', icon: '✏️' },
  fullTests: { en: 'Full Tests', ru: 'Полные тесты', kg: 'Толук тесттер', icon: '📝' },
  dynamicLessons: { en: 'AI Lessons', ru: 'ИИ-уроки', kg: 'AI сабактар', icon: '🤖' }
};
