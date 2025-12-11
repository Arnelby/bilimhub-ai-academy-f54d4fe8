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

export interface DynamicLessonContent {
  learningStyle: LearningStyle;
  title: string;
  approach: string;
  introduction: string;
  mainContent: string[];
  examples: string[];
  practicePrompts: string[];
  summary: string;
  tips: string[];
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
  dynamicLessonContents: DynamicLessonContent[];
}

// ==================== FRACTIONS TOPIC ====================
const fractionsBasicLesson: BasicLessonContent = {
  theory: [
    {
      id: 'theory-1',
      title: 'What is a Fraction?',
      content: `A fraction represents a part of a whole. It consists of two parts:

• **Numerator** (top number): Tells us how many parts we have
• **Denominator** (bottom number): Tells us how many equal parts the whole is divided into

For example, in the fraction 3/4:
- The numerator is 3 (we have 3 parts)
- The denominator is 4 (the whole is divided into 4 equal parts)

Think of a pizza cut into 4 slices. If you eat 3 slices, you've eaten 3/4 of the pizza.`,
      imagePlaceholder: 'Image placeholder: Fraction diagram showing 3/4 of a pizza (to be uploaded)'
    },
    {
      id: 'theory-2',
      title: 'Types of Fractions',
      content: `There are three main types of fractions:

**1. Proper Fractions**
- Numerator < Denominator
- Value is less than 1
- Examples: 1/2, 3/4, 5/8

**2. Improper Fractions**
- Numerator ≥ Denominator
- Value is 1 or greater
- Examples: 5/3, 7/4, 9/9

**3. Mixed Numbers**
- Combination of a whole number and a proper fraction
- Examples: 2½, 3¼, 5⅔

Converting improper to mixed: 7/4 = 1¾ (7÷4 = 1 remainder 3)
Converting mixed to improper: 2⅓ = 7/3 (2×3 + 1 = 7)`,
      imagePlaceholder: 'Image placeholder: Visual comparison of fraction types with number line (to be uploaded)'
    },
    {
      id: 'theory-3',
      title: 'Equivalent Fractions',
      content: `Equivalent fractions are different fractions that represent the same value.

**How to create equivalent fractions:**
Multiply or divide BOTH numerator and denominator by the same number.

Examples:
• 1/2 = 2/4 = 3/6 = 4/8 = 5/10
• 2/3 = 4/6 = 6/9 = 8/12

**Why this works:**
Multiplying by 2/2, 3/3, etc. is like multiplying by 1, which doesn't change the value.

**Simplifying Fractions:**
To simplify, divide both parts by their Greatest Common Divisor (GCD).
• 8/12: GCD of 8 and 12 is 4
• 8÷4 / 12÷4 = 2/3`,
      imagePlaceholder: 'Image placeholder: Equivalent fractions visual with fraction bars (to be uploaded)'
    },
    {
      id: 'theory-4',
      title: 'Adding and Subtracting Fractions',
      content: `**Same Denominator (Easy!)**
Just add/subtract numerators, keep the denominator:
• 2/7 + 3/7 = 5/7
• 5/8 - 2/8 = 3/8

**Different Denominators**
Step 1: Find the Least Common Denominator (LCD)
Step 2: Convert each fraction to an equivalent with the LCD
Step 3: Add/subtract numerators
Step 4: Simplify if needed

Example: 1/3 + 1/4
• LCD of 3 and 4 = 12
• 1/3 = 4/12 and 1/4 = 3/12
• 4/12 + 3/12 = 7/12`,
      imagePlaceholder: 'Image placeholder: Step-by-step addition with visual models (to be uploaded)'
    },
    {
      id: 'theory-5',
      title: 'Multiplying Fractions',
      content: `**The Rule is Simple:**
Multiply numerators together, multiply denominators together.

**Formula:** a/b × c/d = (a×c)/(b×d)

**Examples:**
• 2/3 × 4/5 = 8/15
• 3/4 × 2/7 = 6/28 = 3/14

**Pro Tip - Cross-Cancel First!**
Before multiplying, simplify diagonally:
• 2/3 × 3/4 = (2×3)/(3×4) → Cancel the 3s = 2/4 = 1/2

**Multiplying by Whole Numbers:**
Write the whole number as a fraction over 1:
• 3 × 2/5 = 3/1 × 2/5 = 6/5 = 1⅕`,
      imagePlaceholder: 'Image placeholder: Multiplication area model showing 2/3 × 3/4 (to be uploaded)'
    },
    {
      id: 'theory-6',
      title: 'Dividing Fractions',
      content: `**The "Keep-Change-Flip" Method:**
1. KEEP the first fraction
2. CHANGE division to multiplication
3. FLIP the second fraction (reciprocal)

**Formula:** a/b ÷ c/d = a/b × d/c

**Examples:**
• 3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 3/2 = 1½
• 2/5 ÷ 3/7 = 2/5 × 7/3 = 14/15

**Why does this work?**
Dividing by a fraction is the same as multiplying by its reciprocal.
Division asks "how many times does the divisor fit?" - flipping gives us that answer.

**Dividing by Whole Numbers:**
• 3/4 ÷ 2 = 3/4 ÷ 2/1 = 3/4 × 1/2 = 3/8`,
      imagePlaceholder: 'Image placeholder: Keep-Change-Flip visual guide (to be uploaded)'
    }
  ],
  examples: [
    {
      id: 'example-1',
      title: 'Adding Fractions with Same Denominator',
      content: `**Problem:** Calculate 2/5 + 1/5

**Solution:**
Step 1: Check denominators - they're the same (5) ✓
Step 2: Add numerators: 2 + 1 = 3
Step 3: Keep denominator: 5
Step 4: Check if simplification needed: 3/5 is already simplified

**Answer: 3/5**`,
      imagePlaceholder: 'Image placeholder: Visual showing 2/5 + 1/5 with fraction bars (to be uploaded)'
    },
    {
      id: 'example-2',
      title: 'Adding Fractions with Different Denominators',
      content: `**Problem:** Calculate 1/3 + 1/4

**Solution:**
Step 1: Find LCD of 3 and 4
  - Multiples of 3: 3, 6, 9, 12...
  - Multiples of 4: 4, 8, 12...
  - LCD = 12

Step 2: Convert each fraction
  - 1/3 = 4/12 (multiply by 4/4)
  - 1/4 = 3/12 (multiply by 3/3)

Step 3: Add
  - 4/12 + 3/12 = 7/12

**Answer: 7/12**`,
      imagePlaceholder: 'Image placeholder: LCD finding and conversion visual (to be uploaded)'
    },
    {
      id: 'example-3',
      title: 'Multiplying Fractions',
      content: `**Problem:** Calculate 2/3 × 3/4

**Solution:**
Method 1 - Direct multiplication:
  (2×3)/(3×4) = 6/12 = 1/2

Method 2 - Cross-cancel first (recommended):
  2/3 × 3/4
  Cancel the 3s: 2/1 × 1/4 = 2/4 = 1/2

**Answer: 1/2**`,
      imagePlaceholder: 'Image placeholder: Cross-cancellation visual (to be uploaded)'
    },
    {
      id: 'example-4',
      title: 'Dividing Fractions',
      content: `**Problem:** Calculate 3/4 ÷ 2/5

**Solution:**
Step 1: Keep first fraction: 3/4
Step 2: Change ÷ to ×
Step 3: Flip second fraction: 2/5 → 5/2

3/4 × 5/2 = 15/8 = 1⅞

**Answer: 15/8 or 1⅞**`,
      imagePlaceholder: 'Image placeholder: Keep-Change-Flip example (to be uploaded)'
    },
    {
      id: 'example-5',
      title: 'Mixed Number Operations',
      content: `**Problem:** Calculate 2⅓ + 1¾

**Solution:**
Step 1: Convert to improper fractions
  - 2⅓ = 7/3 (2×3 + 1 = 7)
  - 1¾ = 7/4 (1×4 + 3 = 7)

Step 2: Find LCD of 3 and 4 = 12
  - 7/3 = 28/12
  - 7/4 = 21/12

Step 3: Add
  - 28/12 + 21/12 = 49/12

Step 4: Convert back
  - 49/12 = 4 1/12

**Answer: 4 1/12**`,
      imagePlaceholder: 'Image placeholder: Mixed number conversion process (to be uploaded)'
    }
  ],
  practiceQuestions: [
    { id: 'pq-1', question: 'What is 3/8 + 2/8?', options: ['5/8', '5/16', '6/8', '1/8'], correctAnswer: 0, explanation: 'Same denominators: add numerators 3+2=5, keep denominator 8.' },
    { id: 'pq-2', question: 'Simplify 6/9 to its lowest terms.', options: ['2/3', '3/4', '1/2', '4/6'], correctAnswer: 0, explanation: 'GCD of 6 and 9 is 3. Divide both: 6÷3=2, 9÷3=3.' },
    { id: 'pq-3', question: 'What is 1/2 × 2/3?', options: ['1/3', '2/5', '3/5', '1/6'], correctAnswer: 0, explanation: 'Multiply: (1×2)/(2×3) = 2/6 = 1/3.' },
    { id: 'pq-4', question: 'Calculate 3/4 ÷ 1/2', options: ['3/2', '3/8', '1/2', '6/4'], correctAnswer: 0, explanation: 'Keep-Change-Flip: 3/4 × 2/1 = 6/4 = 3/2.' },
    { id: 'pq-5', question: 'What is 2/5 + 1/3?', options: ['11/15', '3/8', '3/15', '1/4'], correctAnswer: 0, explanation: 'LCD=15: 6/15 + 5/15 = 11/15.' },
    { id: 'pq-6', question: 'Convert 11/4 to a mixed number.', options: ['2¾', '2½', '3¼', '2¼'], correctAnswer: 0, explanation: '11÷4 = 2 remainder 3, so 2¾.' },
    { id: 'pq-7', question: 'What is 5/6 - 1/4?', options: ['7/12', '4/2', '1/2', '6/10'], correctAnswer: 0, explanation: 'LCD=12: 10/12 - 3/12 = 7/12.' },
    { id: 'pq-8', question: 'Simplify 15/25.', options: ['3/5', '5/3', '1/5', '5/25'], correctAnswer: 0, explanation: 'GCD=5: 15÷5=3, 25÷5=5.' },
    { id: 'pq-9', question: 'What is 3/7 × 14/9?', options: ['2/3', '42/63', '17/16', '1/3'], correctAnswer: 0, explanation: 'Cross-cancel: (3×14)/(7×9) = 42/63 = 2/3.' },
    { id: 'pq-10', question: 'Calculate 2/3 ÷ 4/5', options: ['5/6', '8/15', '6/5', '10/12'], correctAnswer: 0, explanation: '2/3 × 5/4 = 10/12 = 5/6.' }
  ]
};

const fractionsMiniLessons: MiniLessonContent[] = [
  {
    id: 'ml-1',
    title: 'Understanding Numerator & Denominator',
    duration: '3 min',
    concept: 'The parts of a fraction',
    explanation: `The numerator (top number) tells you HOW MANY parts you have.
The denominator (bottom number) tells you HOW MANY EQUAL PARTS make up the whole.

Think of it like slices of pizza:
- Denominator = total slices the pizza was cut into
- Numerator = slices you're eating

Memory trick: "Denominator is DOWN below!"`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Numerator and Denominator Explained"',
    keyTakeaway: 'Numerator = parts you have, Denominator = total equal parts'
  },
  {
    id: 'ml-2',
    title: 'Finding Common Denominators',
    duration: '4 min',
    concept: 'LCD for fraction operations',
    explanation: `To add or subtract fractions, you NEED a common denominator.

Finding the LCD (Least Common Denominator):
1. List multiples of each denominator
2. Find the smallest number in BOTH lists

Example: LCD of 4 and 6
- Multiples of 4: 4, 8, 12, 16...
- Multiples of 6: 6, 12, 18...
- LCD = 12

Quick method for small numbers: Multiply denominators if you can't spot LCD quickly.`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Finding LCD Made Easy"',
    keyTakeaway: 'LCD = smallest number divisible by both denominators'
  },
  {
    id: 'ml-3',
    title: 'Simplifying Fractions',
    duration: '3 min',
    concept: 'Reducing to lowest terms',
    explanation: `A fraction is in simplest form when numerator and denominator share no common factors except 1.

Steps to simplify:
1. Find the GCD (Greatest Common Divisor) of numerator and denominator
2. Divide both by the GCD

Example: Simplify 12/18
- Factors of 12: 1, 2, 3, 4, 6, 12
- Factors of 18: 1, 2, 3, 6, 9, 18
- GCD = 6
- 12÷6 / 18÷6 = 2/3`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Simplifying Fractions Step by Step"',
    keyTakeaway: 'Always simplify your final answer!'
  },
  {
    id: 'ml-4',
    title: 'Converting Mixed Numbers',
    duration: '4 min',
    concept: 'Mixed ↔ Improper conversions',
    explanation: `Mixed to Improper:
Formula: (whole × denominator) + numerator / denominator
Example: 3⅖ = (3×5 + 2)/5 = 17/5

Improper to Mixed:
1. Divide numerator by denominator
2. Quotient = whole number
3. Remainder = new numerator
Example: 17/5 = 3 remainder 2 = 3⅖`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Mixed Numbers Conversion"',
    keyTakeaway: 'Convert to improper fractions before calculating!'
  },
  {
    id: 'ml-5',
    title: 'The Keep-Change-Flip Method',
    duration: '3 min',
    concept: 'Dividing fractions easily',
    explanation: `Dividing fractions is easy with Keep-Change-Flip:

1. KEEP the first fraction as is
2. CHANGE the ÷ sign to ×
3. FLIP the second fraction (swap numerator and denominator)

Example: 2/3 ÷ 4/5
- Keep: 2/3
- Change: ÷ becomes ×
- Flip: 4/5 becomes 5/4
- Calculate: 2/3 × 5/4 = 10/12 = 5/6`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Keep Change Flip Song"',
    keyTakeaway: 'Keep-Change-Flip makes division multiplication!'
  },
  {
    id: 'ml-6',
    title: 'Cross-Cancellation Trick',
    duration: '3 min',
    concept: 'Simplify before multiplying',
    explanation: `Before multiplying fractions, simplify diagonally!

Example: 4/9 × 3/8
- Can we simplify 4 and 8? Yes! Both ÷ 4 → 1 and 2
- Can we simplify 9 and 3? Yes! Both ÷ 3 → 3 and 1
- Now multiply: 1/3 × 1/2 = 1/6

This gives the same answer as multiplying first then simplifying, but with smaller numbers!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Cross Cancellation Made Simple"',
    keyTakeaway: 'Simplify diagonally before multiplying for easier math!'
  }
];

const fractionsDiagrams: DiagramContent[] = [
  { id: 'diag-1', title: 'Fraction Operations Cheat Sheet', description: 'Complete reference for all fraction operations: addition, subtraction, multiplication, division formulas with examples', imagePlaceholder: 'Image placeholder: Comprehensive fraction operations cheat sheet (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-2', title: 'Converting Between Fraction Types', description: 'Flowchart showing step-by-step process to convert between proper, improper, and mixed fractions', imagePlaceholder: 'Image placeholder: Fraction conversion flowchart (to be uploaded)', type: 'flowchart' },
  { id: 'diag-3', title: 'Step-by-Step Division of Fractions', description: 'Visual guide showing the Keep-Change-Flip method with examples', imagePlaceholder: 'Image placeholder: Division steps diagram (to be uploaded)', type: 'step-diagram' },
  { id: 'diag-4', title: 'Finding LCD Flowchart', description: 'Decision tree for finding the Least Common Denominator efficiently', imagePlaceholder: 'Image placeholder: LCD finding flowchart (to be uploaded)', type: 'flowchart' },
  { id: 'diag-5', title: 'Equivalent Fractions Visual', description: 'Fraction bars and circles showing equivalent fractions from 1/2 to 12/24', imagePlaceholder: 'Image placeholder: Equivalent fractions visual comparison (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-6', title: 'Simplification Process Diagram', description: 'Step-by-step visual for finding GCD and simplifying fractions', imagePlaceholder: 'Image placeholder: GCD and simplification steps (to be uploaded)', type: 'step-diagram' }
];

const fractionsCommonMistakes: CommonMistake[] = [
  {
    id: 'cm-1',
    mistake: 'Adding denominators when adding fractions',
    explanation: 'Students often add BOTH numerators AND denominators: 2/5 + 1/5 = 3/10. This is WRONG!',
    fix: ['Keep the denominator the SAME when adding fractions with like denominators', 'Only add the numerators', 'Correct: 2/5 + 1/5 = 3/5 (NOT 3/10)'],
    imagePlaceholder: 'Image placeholder: Correct vs incorrect addition comparison (to be uploaded)'
  },
  {
    id: 'cm-2',
    mistake: 'Forgetting to find LCD before adding unlike fractions',
    explanation: 'Adding fractions with different denominators directly gives wrong answers: 1/2 + 1/3 ≠ 2/5',
    fix: ['ALWAYS find the LCD first', 'Convert each fraction to equivalent with LCD', 'Then add numerators', 'Correct: 1/2 + 1/3 = 3/6 + 2/6 = 5/6'],
    imagePlaceholder: 'Image placeholder: LCD conversion process (to be uploaded)'
  },
  {
    id: 'cm-3',
    mistake: 'Forgetting to simplify the final answer',
    explanation: 'Many students get correct answers but forget to reduce to lowest terms.',
    fix: ['Always check if numerator and denominator share common factors', 'Divide both by their GCD', 'Example: 4/8 should be simplified to 1/2']
  },
  {
    id: 'cm-4',
    mistake: 'Flipping the wrong fraction when dividing',
    explanation: 'In Keep-Change-Flip, some flip the FIRST fraction instead of the second.',
    fix: ['KEEP the first fraction exactly as it is', 'CHANGE division to multiplication', 'FLIP only the SECOND fraction', '3/4 ÷ 2/5 = 3/4 × 5/2 (flip 2/5, NOT 3/4)'],
    imagePlaceholder: 'Image placeholder: Correct flip demonstration (to be uploaded)'
  },
  {
    id: 'cm-5',
    mistake: 'Not converting mixed numbers before operations',
    explanation: 'Trying to add 2½ + 1¼ without converting leads to confusion and errors.',
    fix: ['Convert all mixed numbers to improper fractions first', '2½ = 5/2, 1¼ = 5/4', 'Then perform the operation', 'Convert back to mixed if needed']
  },
  {
    id: 'cm-6',
    mistake: 'Cross-multiplying when adding fractions',
    explanation: 'Cross-multiplication is for solving equations, NOT for adding fractions.',
    fix: ['Cross-multiplication: a/b = c/d means ad = bc', 'For addition: find LCD, convert, then add', 'These are completely different operations!']
  },
  {
    id: 'cm-7',
    mistake: 'Thinking bigger denominator means bigger fraction',
    explanation: '1/8 is NOT bigger than 1/4, even though 8 > 4.',
    fix: ['Bigger denominator = more pieces = SMALLER pieces', '1/8 < 1/4 because eighths are smaller than quarters', 'Compare: convert to same denominator first'],
    imagePlaceholder: 'Image placeholder: Fraction size comparison visual (to be uploaded)'
  }
];

const fractionsMiniTestQuestions: MiniTestQuestion[] = [
  { id: 'mt-1', question: 'What is 1/4 + 1/4?', options: ['1/2', '2/8', '1/8', '2/4'], correctAnswer: 0, explanation: '1/4 + 1/4 = 2/4 = 1/2', difficulty: 1 },
  { id: 'mt-2', question: 'Simplify 8/12', options: ['2/3', '4/6', '3/4', '1/2'], correctAnswer: 0, explanation: 'GCD of 8 and 12 is 4. 8÷4=2, 12÷4=3', difficulty: 1 },
  { id: 'mt-3', question: 'What is 3/5 + 1/5?', options: ['4/5', '4/10', '3/10', '2/5'], correctAnswer: 0, explanation: 'Same denominator: 3+1=4, keep 5', difficulty: 1 },
  { id: 'mt-4', question: 'What is 2/3 + 1/6?', options: ['5/6', '3/9', '1/2', '3/6'], correctAnswer: 0, explanation: 'LCD=6: 4/6 + 1/6 = 5/6', difficulty: 2 },
  { id: 'mt-5', question: 'Calculate 3/4 × 2/5', options: ['3/10', '6/20', '5/9', '6/9'], correctAnswer: 0, explanation: '(3×2)/(4×5) = 6/20 = 3/10', difficulty: 2 },
  { id: 'mt-6', question: 'What is 3/4 ÷ 1/2?', options: ['3/2', '3/8', '1/2', '6/4'], correctAnswer: 0, explanation: '3/4 × 2/1 = 6/4 = 3/2', difficulty: 2 },
  { id: 'mt-7', question: 'Convert 7/3 to a mixed number', options: ['2⅓', '3⅐', '1⁴/₃', '2⅔'], correctAnswer: 0, explanation: '7÷3 = 2 remainder 1, so 2⅓', difficulty: 2 },
  { id: 'mt-8', question: 'What is 5/6 - 1/4?', options: ['7/12', '4/2', '1/2', '6/10'], correctAnswer: 0, explanation: 'LCD=12: 10/12 - 3/12 = 7/12', difficulty: 2 },
  { id: 'mt-9', question: 'Solve: (2/3 + 1/6) × 1/2', options: ['5/12', '3/9', '1/4', '5/6'], correctAnswer: 0, explanation: '(4/6 + 1/6) × 1/2 = 5/6 × 1/2 = 5/12', difficulty: 3 },
  { id: 'mt-10', question: 'What is 4/5 ÷ 2/3?', options: ['6/5', '8/15', '2/5', '12/10'], correctAnswer: 0, explanation: '4/5 × 3/2 = 12/10 = 6/5', difficulty: 2 },
  { id: 'mt-11', question: 'Simplify 24/36', options: ['2/3', '4/6', '12/18', '3/4'], correctAnswer: 0, explanation: 'GCD=12: 24/12=2, 36/12=3', difficulty: 2 },
  { id: 'mt-12', question: 'Calculate 5/8 - 1/4', options: ['3/8', '4/4', '6/12', '1/2'], correctAnswer: 0, explanation: 'LCD=8: 5/8 - 2/8 = 3/8', difficulty: 2 },
  { id: 'mt-13', question: 'What is 2⅓ as an improper fraction?', options: ['7/3', '5/3', '8/3', '6/3'], correctAnswer: 0, explanation: '2×3 + 1 = 7, over 3 = 7/3', difficulty: 2 },
  { id: 'mt-14', question: 'Calculate (3/4)²', options: ['9/16', '6/8', '9/8', '3/8'], correctAnswer: 0, explanation: '3²/4² = 9/16', difficulty: 3 },
  { id: 'mt-15', question: 'What is 7/8 - 3/8 + 1/8?', options: ['5/8', '5/24', '11/8', '4/8'], correctAnswer: 0, explanation: '7-3+1=5, keep 8', difficulty: 2 },
  { id: 'mt-16', question: 'Solve: 2/3 × 3/4 × 4/5', options: ['2/5', '24/60', '1/3', '9/20'], correctAnswer: 0, explanation: 'Cross-cancel: 2/5 (3s cancel, 4s cancel)', difficulty: 3 },
  { id: 'mt-17', question: 'What is 1/2 + 1/3 + 1/6?', options: ['1', '3/11', '3/6', '5/6'], correctAnswer: 0, explanation: 'LCD=6: 3/6 + 2/6 + 1/6 = 6/6 = 1', difficulty: 3 },
  { id: 'mt-18', question: 'Calculate 15/20 in simplest form', options: ['3/4', '5/7', '15/20', '1/2'], correctAnswer: 0, explanation: 'GCD=5: 15/5=3, 20/5=4', difficulty: 1 }
];

const fractionsFullTestQuestions: FullTestQuestion[] = [
  { id: 'ft-1', question: 'What is the sum of 3/8 and 5/8?', options: ['1', '8/16', '8/8', '3/4'], correctAnswer: 0, explanation: '3/8 + 5/8 = 8/8 = 1', topic: 'Addition' },
  { id: 'ft-2', question: 'Which fraction is equivalent to 4/6?', options: ['2/3', '3/4', '1/2', '4/8'], correctAnswer: 0, explanation: '4/6 ÷ 2/2 = 2/3', topic: 'Equivalence' },
  { id: 'ft-3', question: 'What is 7/8 - 3/8?', options: ['1/2', '4/8', '4/16', '10/8'], correctAnswer: 0, explanation: '7/8 - 3/8 = 4/8 = 1/2', topic: 'Subtraction' },
  { id: 'ft-4', question: 'Calculate 2/5 × 3/4', options: ['3/10', '6/20', '5/9', '6/9'], correctAnswer: 0, explanation: '(2×3)/(5×4) = 6/20 = 3/10', topic: 'Multiplication' },
  { id: 'ft-5', question: 'What is 4/5 ÷ 2/3?', options: ['6/5', '8/15', '2/5', '12/10'], correctAnswer: 0, explanation: '4/5 × 3/2 = 12/10 = 6/5', topic: 'Division' },
  { id: 'ft-6', question: 'Simplify 18/24 to lowest terms.', options: ['3/4', '9/12', '6/8', '2/3'], correctAnswer: 0, explanation: 'GCD=6: 18÷6=3, 24÷6=4', topic: 'Simplification' },
  { id: 'ft-7', question: 'Convert 15/4 to a mixed number.', options: ['3¾', '4¾', '3½', '4½'], correctAnswer: 0, explanation: '15÷4 = 3 remainder 3', topic: 'Conversion' },
  { id: 'ft-8', question: 'What is 1/3 + 1/4?', options: ['7/12', '2/7', '2/12', '1/7'], correctAnswer: 0, explanation: 'LCD=12: 4/12 + 3/12 = 7/12', topic: 'Addition' },
  { id: 'ft-9', question: 'Calculate 5/6 - 2/9', options: ['11/18', '3/3', '7/15', '1/2'], correctAnswer: 0, explanation: 'LCD=18: 15/18 - 4/18 = 11/18', topic: 'Subtraction' },
  { id: 'ft-10', question: 'What is 7/10 × 5/14?', options: ['1/4', '35/140', '12/24', '1/2'], correctAnswer: 0, explanation: 'Cross-cancel: 1/2 × 1/2 = 1/4', topic: 'Multiplication' },
  { id: 'ft-11', question: 'Divide: 9/10 ÷ 3/5', options: ['3/2', '27/50', '6/10', '12/50'], correctAnswer: 0, explanation: '9/10 × 5/3 = 45/30 = 3/2', topic: 'Division' },
  { id: 'ft-12', question: 'Which is greater: 3/5 or 5/9?', options: ['3/5', '5/9', 'They are equal', 'Cannot determine'], correctAnswer: 0, explanation: '3/5 = 27/45, 5/9 = 25/45. 27>25', topic: 'Comparison' },
  { id: 'ft-13', question: 'What is 2½ + 1¾?', options: ['4¼', '3¾', '4½', '3½'], correctAnswer: 0, explanation: '5/2 + 7/4 = 10/4 + 7/4 = 17/4 = 4¼', topic: 'Mixed Numbers' },
  { id: 'ft-14', question: 'Calculate (2/3)³', options: ['8/27', '6/9', '8/9', '2/9'], correctAnswer: 0, explanation: '2³/3³ = 8/27', topic: 'Powers' },
  { id: 'ft-15', question: 'Simplify: 5/8 + 3/8 - 1/4', options: ['3/4', '7/8', '1/2', '5/8'], correctAnswer: 0, explanation: '5/8 + 3/8 = 8/8 = 1. 1 - 1/4 = 3/4', topic: 'Mixed Operations' },
  { id: 'ft-16', question: 'What is 4/7 of 21?', options: ['12', '84/7', '15', '9'], correctAnswer: 0, explanation: '4/7 × 21 = 4 × 3 = 12', topic: 'Word Problems' },
  { id: 'ft-17', question: 'Convert 3⅖ to an improper fraction.', options: ['17/5', '15/5', '8/5', '13/5'], correctAnswer: 0, explanation: '3×5 + 2 = 17', topic: 'Conversion' },
  { id: 'ft-18', question: 'What is the reciprocal of 5/7?', options: ['7/5', '5/7', '-5/7', '1'], correctAnswer: 0, explanation: 'Flip numerator and denominator', topic: 'Reciprocals' },
  { id: 'ft-19', question: 'Solve: 3/4 × 8/9 ÷ 2/3', options: ['1', '2/3', '3/4', '4/3'], correctAnswer: 0, explanation: '3/4 × 8/9 = 2/3. 2/3 × 3/2 = 1', topic: 'Mixed Operations' },
  { id: 'ft-20', question: 'What is 7/12 + 5/12 - 3/12?', options: ['3/4', '9/12', '1/4', '1/2'], correctAnswer: 0, explanation: '(7+5-3)/12 = 9/12 = 3/4', topic: 'Combined Operations' },
  { id: 'ft-21', question: 'If 3/x = 1/4, what is x?', options: ['12', '3', '4', '7'], correctAnswer: 0, explanation: 'Cross multiply: 3×4 = 1×x, x = 12', topic: 'Equations' },
  { id: 'ft-22', question: 'What is 5/6 as a percentage?', options: ['83.3%', '56%', '65%', '80%'], correctAnswer: 0, explanation: '5÷6 = 0.833... ≈ 83.3%', topic: 'Conversion' },
  { id: 'ft-23', question: 'Calculate 1⅓ × 2¼', options: ['3', '3¼', '2½', '3½'], correctAnswer: 0, explanation: '4/3 × 9/4 = 36/12 = 3', topic: 'Mixed Numbers' },
  { id: 'ft-24', question: 'What fraction of 1 hour is 45 minutes?', options: ['3/4', '45/100', '9/12', '4/5'], correctAnswer: 0, explanation: '45/60 = 3/4', topic: 'Word Problems' },
  { id: 'ft-25', question: 'Simplify: (1/2 + 1/3) ÷ (1/4)', options: ['10/3', '5/24', '5/6', '2'], correctAnswer: 0, explanation: '5/6 × 4 = 20/6 = 10/3', topic: 'Order of Operations' }
];

const fractionsDynamicContents: DynamicLessonContent[] = [
  {
    learningStyle: 'visual',
    title: 'Fractions: A Visual Journey',
    approach: 'Heavy use of diagrams, pie charts, and color-coded fraction bars',
    introduction: 'Welcome to the visual world of fractions! We\'ll use colors, shapes, and diagrams to make fractions crystal clear. Get ready to SEE math in action!',
    mainContent: [
      '🟢 **Picture This:** A fraction is like a pizza! The denominator (bottom) tells you how many slices, and the numerator (top) tells you how many you\'re eating.',
      '🔵 **Color-Coded Parts:** Imagine a circle divided into 4 equal parts. Color 3 of them blue. You\'ve just created 3/4! The whole circle = denominator, colored parts = numerator.',
      '🟡 **Equivalent Fractions Visual:** Draw two identical rectangles. Divide one into 2 parts, shade 1. Divide the other into 4 parts, shade 2. They look the same because 1/2 = 2/4!',
      '🟣 **Adding Fractions Visually:** To add 1/4 + 2/4, imagine combining colored sections. 1 blue quarter + 2 blue quarters = 3 blue quarters = 3/4.',
      '🔴 **Multiplication as Area:** To multiply 1/2 × 1/3, draw a rectangle. Divide horizontally in 2, vertically in 3. The overlapping shaded region shows 1/6 of the whole!'
    ],
    examples: [
      'Visual Example 1: Draw a circle, divide into 8 equal parts, shade 5. You\'ve drawn 5/8!',
      'Visual Example 2: Use fraction bars to show 2/3 = 4/6 (same length, different divisions)',
      'Visual Example 3: Multiplication area model - shade 1/2 of a rectangle, then 1/3 of that. Result: 1/6'
    ],
    practicePrompts: [
      'Draw a rectangle divided into 6 equal parts. Shade 4 parts. What fraction is shaded?',
      'Using circles, show that 1/2 = 3/6',
      'Draw an area model for 2/3 × 3/4'
    ],
    summary: 'Fractions become easy when you can SEE them! Remember: denominators divide the whole, numerators count the parts. Use diagrams to check your work!',
    tips: [
      'Always draw a picture when confused',
      'Use different colors for different fractions',
      'Check your answer by shading a diagram'
    ]
  },
  {
    learningStyle: 'auditory',
    title: 'Fractions: Listen and Learn',
    approach: 'Audio explanations with verbal step-by-step walkthroughs',
    introduction: 'Let\'s talk through fractions together! Listen carefully to the patterns and rhythms in how we say and solve fraction problems.',
    mainContent: [
      '🎵 **Say It Out Loud:** "Three-fourths" means three out of four equal parts. Practice saying fractions: "five-eighths," "two-thirds," "seven-tenths."',
      '🗣️ **The Adding Chant:** "Same bottom, add the top, simplify and never stop!" When denominators match, just add numerators.',
      '🎤 **LCD Song:** "Find the smallest number that both go into, that\'s your LCD, it\'s what you need to do!"',
      '📢 **Division Rap:** "Keep the first, change the sign, flip the second, works every time!" This is Keep-Change-Flip for division.',
      '🔊 **Simplify Reminder:** "Find the biggest number that divides both, divide them out, that\'s the approach!"'
    ],
    examples: [
      'Talk through: "1/3 plus 1/4... I need LCD of 3 and 4... that\'s 12... 1/3 becomes 4/12... 1/4 becomes 3/12... 4 plus 3 is 7... answer is 7/12!"',
      'Verbalize: "To divide 3/4 by 2/5, I KEEP 3/4, CHANGE to times, FLIP 2/5 to 5/2... 3/4 times 5/2 equals 15/8!"',
      'Say aloud: "To simplify 12/18, what\'s the biggest number dividing both? 6! 12 divided by 6 is 2, 18 divided by 6 is 3. Answer: 2/3!"'
    ],
    practicePrompts: [
      'Say out loud: "To add 2/5 + 1/3, I need to..." and complete the sentence with each step',
      'Explain to an imaginary friend how to multiply 3/4 × 2/5',
      'Record yourself solving 7/8 - 1/4, talking through every step'
    ],
    summary: 'Speaking math helps you remember it! Use the chants and patterns to guide your solving. Talk through problems step by step.',
    tips: [
      'Read problems out loud',
      'Explain steps as if teaching someone',
      'Create your own rhymes and songs'
    ]
  },
  {
    learningStyle: 'text-based',
    title: 'Fractions: Complete Written Guide',
    approach: 'Detailed written explanations with formulas',
    introduction: 'This comprehensive text guide covers all fraction operations with precise definitions, formulas, and step-by-step procedures.',
    mainContent: [
      '**Definition:** A fraction a/b represents a parts of a whole divided into b equal parts, where a is the numerator and b is the denominator (b ≠ 0).',
      '**Fundamental Property:** a/b = (a×n)/(b×n) for any non-zero n. This creates equivalent fractions without changing value.',
      '**Addition/Subtraction Rule:** For fractions with same denominator: a/c ± b/c = (a±b)/c. For different denominators, first find LCD, convert, then add/subtract numerators.',
      '**Multiplication Rule:** a/b × c/d = (a×c)/(b×d). Multiply numerators together and denominators together. Simplify result.',
      '**Division Rule:** a/b ÷ c/d = a/b × d/c. Multiply by the reciprocal of the divisor.',
      '**Simplification:** To reduce a/b to lowest terms, divide both a and b by their GCD(a,b).'
    ],
    examples: [
      'Example 1 (Addition): 3/4 + 5/6. LCD(4,6)=12. Convert: 9/12 + 10/12 = 19/12 = 1 7/12.',
      'Example 2 (Multiplication): 5/8 × 4/15. Cross-cancel: (5,15)→(1,3) and (4,8)→(1,2). Result: 1/6.',
      'Example 3 (Division): 7/9 ÷ 14/27. Flip and multiply: 7/9 × 27/14 = 189/126 = 3/2.'
    ],
    practicePrompts: [
      'Write out the complete solution for 5/12 + 7/18, showing all steps',
      'Document the process of converting 47/8 to a mixed number',
      'Create a written proof that 2/3 × 3/4 = 1/2'
    ],
    summary: 'Master fractions through understanding the underlying rules: same denominators for adding/subtracting, multiply straight across, flip and multiply for division.',
    tips: [
      'Write out all steps - don\'t skip!',
      'Keep formulas handy for reference',
      'Check work by substituting back'
    ]
  },
  {
    learningStyle: 'problem-solver',
    title: 'Fractions: Challenge Mode',
    approach: 'Practice-first methodology with immediate application',
    introduction: 'Ready to tackle fraction problems head-on? Let\'s dive into challenges that will sharpen your skills through practice!',
    mainContent: [
      '💪 **Challenge Approach:** Don\'t memorize - discover! Try problems first, then learn the rule from patterns you notice.',
      '🧩 **Pattern Recognition:** What do 1/2, 2/4, 3/6, 4/8 have in common? They\'re all equal! Multiplying top and bottom by same number keeps value.',
      '⚡ **Speed Strategy:** For addition with different denominators, multiply the denominators for a quick (not always smallest) common denominator.',
      '🎯 **Problem-Solving Tip:** For word problems, identify: What\'s the whole? What fraction of it? Then translate to math.',
      '🏆 **Advanced Technique:** When multiplying multiple fractions, cross-cancel everything possible BEFORE multiplying to keep numbers small.'
    ],
    examples: [
      'Challenge: Find the pattern - 1/2 + 1/4 = 3/4, 1/2 + 1/4 + 1/8 = 7/8, 1/2 + 1/4 + 1/8 + 1/16 = ?',
      'Puzzle: If 3/x = 9/15, what is x? (Hint: Cross multiply!)',
      'Brain teaser: A recipe needs 2/3 cup flour. You want to make 1½ times the recipe. How much flour?'
    ],
    practicePrompts: [
      'Solve 10 addition problems in 5 minutes - focus on speed!',
      'Create your own word problem involving fractions',
      'Find 3 different ways to prove 1/2 = 2/4'
    ],
    summary: 'The best way to learn fractions is by doing! Challenge yourself with harder problems, find patterns, and build intuition through practice.',
    tips: [
      'Try before looking at hints',
      'Time yourself for speed practice',
      'Create your own challenge problems'
    ]
  },
  {
    learningStyle: 'adhd-friendly',
    title: 'Fractions: Quick Wins! 🎮',
    approach: 'Short bursts, gamified elements, frequent rewards',
    introduction: '⚡ Quick, fun, rewarding! Let\'s conquer fractions in small, exciting chunks. Ready? Let\'s GO!',
    mainContent: [
      '🎯 **QUICK FACT:** Fraction = Part/Whole. TOP = what you have. BOTTOM = total pieces. DONE! ✓',
      '⚡ **SPEED RULE - ADDING:** Same bottom? Just add tops! 2/5 + 1/5 = 3/5. BOOM! 💥',
      '🚀 **HACK - MULTIPLYING:** Straight across! 2/3 × 4/5 = 8/15. No LCD needed! Easy! 🎉',
      '🔥 **DIVISION TRICK:** Keep-Change-Flip! Say it! Keep first, change ÷ to ×, flip second! WIN! 🏆',
      '✨ **SIMPLIFY FAST:** Both even? Divide by 2! 6/8 → 3/4. Repeat until you can\'t! LEVEL UP! ⬆️'
    ],
    examples: [
      '⚡ 1-MINUTE CHALLENGE: 1/2 + 1/2 = ? (Answer: 1) YOU GOT THIS! 🎯',
      '🎮 QUICK SOLVE: 3/4 × 2/3 = 6/12 = 1/2. Cancel those numbers! WINNER! 🏆',
      '💪 SPEED RUN: 8/10 simplified = 4/5 (÷2). 3 SECONDS! NEW RECORD! 🔥'
    ],
    practicePrompts: [
      '30-second challenge: Simplify 4/8 (Hint: both are even!)',
      '1-minute sprint: Add 1/3 + 1/3 + 1/3',
      'Quick win: What\'s 1/2 of 1/2? Multiply!'
    ],
    summary: '🎯 You did it! Fractions = top/bottom. Add same bottoms. Multiply across. Flip to divide. Simplify always! YOU\'RE A FRACTION MASTER! 🏆',
    tips: [
      'Work in 5-min bursts 🎯',
      'Reward yourself after each problem! 🎉',
      'Stand up and move between problems! 🏃'
    ]
  }
];

// ==================== EXPONENTS TOPIC ====================
const exponentsBasicLesson: BasicLessonContent = {
  theory: [
    {
      id: 'theory-1',
      title: 'What are Exponents?',
      content: `An exponent tells us how many times to multiply a number by itself.

**Notation:** In aⁿ
• a = base (the number being multiplied)
• n = exponent (how many times)

**Examples:**
• 2³ = 2 × 2 × 2 = 8 (2 multiplied 3 times)
• 5² = 5 × 5 = 25 (5 multiplied 2 times)  
• 10⁴ = 10 × 10 × 10 × 10 = 10,000

The exponent is also called the "power" - so 2³ is "2 to the third power" or "2 cubed."`,
      imagePlaceholder: 'Image placeholder: Exponent notation diagram showing base and power (to be uploaded)'
    },
    {
      id: 'theory-2',
      title: 'Laws of Exponents - Product Rule',
      content: `**Product Rule:** When multiplying same bases, ADD exponents.

**Formula:** aᵐ × aⁿ = aᵐ⁺ⁿ

**Why it works:**
2³ × 2⁴ = (2×2×2) × (2×2×2×2) = 2⁷

We have 3 twos, then 4 more twos = 7 twos total!

**Examples:**
• 3² × 3⁵ = 3⁷
• x⁴ × x³ = x⁷
• 5 × 5³ = 5¹ × 5³ = 5⁴

**Important:** Bases MUST be the same! 2³ × 3² ≠ 6⁵`,
      imagePlaceholder: 'Image placeholder: Product rule visual with grouped multiplications (to be uploaded)'
    },
    {
      id: 'theory-3',
      title: 'Laws of Exponents - Quotient Rule',
      content: `**Quotient Rule:** When dividing same bases, SUBTRACT exponents.

**Formula:** aᵐ ÷ aⁿ = aᵐ⁻ⁿ

**Why it works:**
2⁵ ÷ 2³ = (2×2×2×2×2) ÷ (2×2×2)
Cancel 3 twos from top and bottom = 2² = 4

**Examples:**
• 7⁶ ÷ 7² = 7⁴
• x⁸ ÷ x³ = x⁵
• 10⁴ ÷ 10⁴ = 10⁰ = 1

**Remember:** Top exponent MINUS bottom exponent!`,
      imagePlaceholder: 'Image placeholder: Quotient rule with cancellation visual (to be uploaded)'
    },
    {
      id: 'theory-4',
      title: 'Laws of Exponents - Power Rule',
      content: `**Power Rule:** When raising a power to a power, MULTIPLY exponents.

**Formula:** (aᵐ)ⁿ = aᵐˣⁿ

**Why it works:**
(2³)² = 2³ × 2³ = (2×2×2) × (2×2×2) = 2⁶

We have 2 groups of 3 twos = 6 twos total!

**Examples:**
• (5²)³ = 5⁶
• (x⁴)² = x⁸
• (3³)³ = 3⁹

**Watch out:** (2³)² ≠ 2⁵ (multiply, don't add!)`,
      imagePlaceholder: 'Image placeholder: Power rule expansion visual (to be uploaded)'
    },
    {
      id: 'theory-5',
      title: 'Zero and Negative Exponents',
      content: `**Zero Exponent Rule:** Any non-zero number to the 0 power equals 1.

**Formula:** a⁰ = 1 (where a ≠ 0)

**Why?** Using quotient rule: aⁿ ÷ aⁿ = aⁿ⁻ⁿ = a⁰
But aⁿ ÷ aⁿ = 1, so a⁰ = 1

**Negative Exponent Rule:** Negative exponent = reciprocal with positive exponent.

**Formula:** a⁻ⁿ = 1/aⁿ

**Examples:**
• 2⁻³ = 1/2³ = 1/8
• 10⁻² = 1/10² = 1/100 = 0.01
• x⁻¹ = 1/x`,
      imagePlaceholder: 'Image placeholder: Zero and negative exponent examples (to be uploaded)'
    },
    {
      id: 'theory-6',
      title: 'Fractional Exponents',
      content: `**Fractional exponents represent roots!**

**Formula:** a^(1/n) = ⁿ√a (nth root of a)

**Examples:**
• 9^(1/2) = √9 = 3 (square root)
• 8^(1/3) = ∛8 = 2 (cube root)
• 16^(1/4) = ⁴√16 = 2 (fourth root)

**Combined fractional exponents:**
a^(m/n) = ⁿ√(aᵐ) = (ⁿ√a)ᵐ

**Examples:**
• 8^(2/3) = (∛8)² = 2² = 4
• 27^(2/3) = (∛27)² = 3² = 9`,
      imagePlaceholder: 'Image placeholder: Fractional exponents and roots connection (to be uploaded)'
    }
  ],
  examples: [
    {
      id: 'example-1',
      title: 'Product Rule Example',
      content: `**Problem:** Simplify 2³ × 2⁴

**Solution:**
Using the product rule: aᵐ × aⁿ = aᵐ⁺ⁿ

2³ × 2⁴ = 2³⁺⁴ = 2⁷

To verify: 2⁷ = 128
Check: 2³ = 8, 2⁴ = 16, 8 × 16 = 128 ✓

**Answer: 2⁷ = 128**`,
      imagePlaceholder: 'Image placeholder: Product rule step-by-step (to be uploaded)'
    },
    {
      id: 'example-2',
      title: 'Quotient Rule Example',
      content: `**Problem:** Simplify 5⁶ ÷ 5²

**Solution:**
Using the quotient rule: aᵐ ÷ aⁿ = aᵐ⁻ⁿ

5⁶ ÷ 5² = 5⁶⁻² = 5⁴

To verify: 5⁴ = 625
Check: 5⁶ = 15625, 5² = 25, 15625 ÷ 25 = 625 ✓

**Answer: 5⁴ = 625**`,
      imagePlaceholder: 'Image placeholder: Quotient rule demonstration (to be uploaded)'
    },
    {
      id: 'example-3',
      title: 'Power Rule Example',
      content: `**Problem:** Simplify (3²)⁴

**Solution:**
Using the power rule: (aᵐ)ⁿ = aᵐˣⁿ

(3²)⁴ = 3²ˣ⁴ = 3⁸

To verify: 3⁸ = 6561
Check: 3² = 9, 9⁴ = 6561 ✓

**Answer: 3⁸ = 6561**`,
      imagePlaceholder: 'Image placeholder: Power rule visualization (to be uploaded)'
    },
    {
      id: 'example-4',
      title: 'Negative Exponent Example',
      content: `**Problem:** Simplify 4⁻²

**Solution:**
Using the negative exponent rule: a⁻ⁿ = 1/aⁿ

4⁻² = 1/4² = 1/16

**Answer: 1/16 = 0.0625**`,
      imagePlaceholder: 'Image placeholder: Negative exponent flip to denominator (to be uploaded)'
    },
    {
      id: 'example-5',
      title: 'Combined Laws Example',
      content: `**Problem:** Simplify (2³)² × 2⁻¹

**Solution:**
Step 1: Apply power rule to (2³)²
(2³)² = 2⁶

Step 2: Apply product rule
2⁶ × 2⁻¹ = 2⁶⁺⁽⁻¹⁾ = 2⁵

**Answer: 2⁵ = 32**`,
      imagePlaceholder: 'Image placeholder: Multi-step exponent problem (to be uploaded)'
    }
  ],
  practiceQuestions: [
    { id: 'pq-1', question: 'What is 5² × 5³?', options: ['5⁵', '5⁶', '25⁵', '5¹'], correctAnswer: 0, explanation: 'Product rule: 5² × 5³ = 5²⁺³ = 5⁵' },
    { id: 'pq-2', question: 'Simplify: 10⁰', options: ['1', '0', '10', 'undefined'], correctAnswer: 0, explanation: 'Any non-zero number to the power of 0 equals 1.' },
    { id: 'pq-3', question: 'What is 2⁻³?', options: ['1/8', '-8', '-6', '1/6'], correctAnswer: 0, explanation: '2⁻³ = 1/2³ = 1/8' },
    { id: 'pq-4', question: 'Simplify: (3²)³', options: ['3⁶', '3⁵', '3⁸', '9³'], correctAnswer: 0, explanation: 'Power rule: 3²ˣ³ = 3⁶' },
    { id: 'pq-5', question: 'What is 8⁴ ÷ 8²?', options: ['8²', '8⁶', '8⁸', '1'], correctAnswer: 0, explanation: 'Quotient rule: 8⁴⁻² = 8²' },
    { id: 'pq-6', question: 'Calculate 9^(1/2)', options: ['3', '4.5', '81', '18'], correctAnswer: 0, explanation: '9^(1/2) = √9 = 3' },
    { id: 'pq-7', question: 'What is (-2)⁴?', options: ['16', '-16', '-8', '8'], correctAnswer: 0, explanation: '(-2)⁴ = (-2)×(-2)×(-2)×(-2) = 16 (even power makes positive)' },
    { id: 'pq-8', question: 'Simplify: 4³ × 4⁻²', options: ['4¹', '4⁵', '4⁻⁶', '4⁶'], correctAnswer: 0, explanation: '4³⁺⁽⁻²⁾ = 4¹ = 4' },
    { id: 'pq-9', question: 'What is (5⁰)³?', options: ['1', '0', '5³', '5⁰'], correctAnswer: 0, explanation: '5⁰ = 1, and 1³ = 1' },
    { id: 'pq-10', question: 'Calculate 27^(1/3)', options: ['3', '9', '27', '81'], correctAnswer: 0, explanation: '27^(1/3) = ∛27 = 3' }
  ]
};

const exponentsMiniLessons: MiniLessonContent[] = [
  {
    id: 'ml-1',
    title: 'Understanding Base and Exponent',
    duration: '3 min',
    concept: 'Components of exponential notation',
    explanation: `The BASE is the number being multiplied. The EXPONENT tells you how many times.

In 5³:
• 5 is the BASE
• 3 is the EXPONENT
• Meaning: 5 × 5 × 5 = 125

Think of it as a shorthand for repeated multiplication!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Base and Exponent Basics"',
    keyTakeaway: 'Base^Exponent means base multiplied "exponent" times'
  },
  {
    id: 'ml-2',
    title: 'The Zero Exponent Rule',
    duration: '3 min',
    concept: 'Why anything^0 = 1',
    explanation: `Any non-zero number to the power of 0 equals 1. Seems weird, but here's why:

Using the quotient rule:
a³ ÷ a³ = a³⁻³ = a⁰

But a³ ÷ a³ = 1 (anything divided by itself is 1)

So a⁰ = 1!

Examples: 5⁰ = 1, 100⁰ = 1, (-7)⁰ = 1`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Why a^0 = 1"',
    keyTakeaway: 'a⁰ = 1 for any non-zero number a'
  },
  {
    id: 'ml-3',
    title: 'Negative Exponents Made Easy',
    duration: '4 min',
    concept: 'Understanding reciprocals',
    explanation: `A negative exponent means "take the reciprocal."

a⁻ⁿ = 1/aⁿ

Examples:
• 2⁻¹ = 1/2
• 3⁻² = 1/3² = 1/9
• 10⁻³ = 1/10³ = 1/1000 = 0.001

Think of the negative sign as "flip to the other side of the fraction."`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Negative Exponents Explained"',
    keyTakeaway: 'Negative exponent = flip to denominator'
  },
  {
    id: 'ml-4',
    title: 'Product vs Power Rule',
    duration: '4 min',
    concept: 'Know when to add vs multiply exponents',
    explanation: `These two rules are often confused:

PRODUCT RULE: aᵐ × aⁿ = aᵐ⁺ⁿ (ADD exponents)
- Use when MULTIPLYING same bases
- 2³ × 2² = 2⁵

POWER RULE: (aᵐ)ⁿ = aᵐˣⁿ (MULTIPLY exponents)
- Use when raising a power TO a power
- (2³)² = 2⁶

Look for parentheses to know which rule applies!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Product vs Power Rule"',
    keyTakeaway: 'Multiplying bases? ADD exponents. Power of power? MULTIPLY exponents.'
  },
  {
    id: 'ml-5',
    title: 'Fractional Exponents = Roots',
    duration: '4 min',
    concept: 'Connecting exponents to roots',
    explanation: `Fractional exponents are another way to write roots!

a^(1/2) = √a (square root)
a^(1/3) = ∛a (cube root)
a^(1/n) = ⁿ√a (nth root)

For combined fractions:
a^(m/n) = (ⁿ√a)ᵐ

Example: 8^(2/3) = (∛8)² = 2² = 4`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Fractional Exponents as Roots"',
    keyTakeaway: 'The denominator of the exponent is the root!'
  },
  {
    id: 'ml-6',
    title: 'Negative Bases: Even vs Odd Powers',
    duration: '3 min',
    concept: 'How sign changes with exponents',
    explanation: `When the BASE is negative:

EVEN exponent → POSITIVE result
(-2)² = 4
(-3)⁴ = 81

ODD exponent → NEGATIVE result
(-2)³ = -8
(-3)⁵ = -243

Why? Even number of negatives multiply to positive!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Negative Base Rules"',
    keyTakeaway: 'Even power = positive, Odd power = negative (for negative bases)'
  }
];

const exponentsDiagrams: DiagramContent[] = [
  { id: 'diag-1', title: 'Exponent Laws Quick Reference', description: 'All exponent laws in one visual cheat sheet: product, quotient, power, zero, negative, fractional', imagePlaceholder: 'Image placeholder: Comprehensive exponent laws cheat sheet (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-2', title: 'Simplifying Exponents Flowchart', description: 'Decision tree showing which exponent rule to apply based on the problem structure', imagePlaceholder: 'Image placeholder: Exponent rules decision flowchart (to be uploaded)', type: 'flowchart' },
  { id: 'diag-3', title: 'Powers of 2 Visual Guide', description: 'Visual representation of 2¹ through 2¹⁰ with values: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024', imagePlaceholder: 'Image placeholder: Powers of 2 diagram with tree structure (to be uploaded)', type: 'step-diagram' },
  { id: 'diag-4', title: 'Negative Exponent Flip Diagram', description: 'Visual showing how negative exponents move between numerator and denominator', imagePlaceholder: 'Image placeholder: Negative exponent flip visual (to be uploaded)', type: 'step-diagram' },
  { id: 'diag-5', title: 'Fractional Exponents = Roots', description: 'Visual connection between fractional exponents and root notation', imagePlaceholder: 'Image placeholder: Exponent-root equivalence chart (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-6', title: 'Powers of 10 Reference', description: 'Scientific notation reference showing 10⁻³ to 10⁶ with values', imagePlaceholder: 'Image placeholder: Powers of 10 scale diagram (to be uploaded)', type: 'cheat-sheet' }
];

const exponentsCommonMistakes: CommonMistake[] = [
  {
    id: 'cm-1',
    mistake: 'Multiplying exponents instead of adding (product rule)',
    explanation: 'Students often do 2³ × 2² = 2⁶ instead of 2⁵',
    fix: ['Remember: same base, ADD exponents', '2³ × 2² = 2³⁺² = 2⁵', 'MULTIPLY exponents only with power rule: (2³)² = 2⁶'],
    imagePlaceholder: 'Image placeholder: Product vs power rule comparison (to be uploaded)'
  },
  {
    id: 'cm-2',
    mistake: 'Thinking a⁰ = 0',
    explanation: 'Zero exponent does NOT mean zero result!',
    fix: ['Any non-zero number to the 0 power equals 1', '5⁰ = 1, 100⁰ = 1, (-3)⁰ = 1', 'Only 0⁰ is undefined']
  },
  {
    id: 'cm-3',
    mistake: 'Confusing negative base with negative exponent',
    explanation: '(-2)³ and 2⁻³ are completely different!',
    fix: ['(-2)³ = -8 (negative base, multiply three times)', '2⁻³ = 1/8 (positive base, negative exponent means reciprocal)', 'Parentheses matter!'],
    imagePlaceholder: 'Image placeholder: Negative base vs exponent comparison (to be uploaded)'
  },
  {
    id: 'cm-4',
    mistake: 'Forgetting parentheses with negative bases',
    explanation: '-3² = -9, but (-3)² = 9. They are different!',
    fix: ['-3² means -(3²) = -9 (square 3, then negate)', '(-3)² means (-3)×(-3) = 9 (square negative 3)', 'When in doubt, use parentheses!']
  },
  {
    id: 'cm-5',
    mistake: 'Adding exponents when bases are different',
    explanation: '2³ × 3² ≠ 6⁵. The rule only works with SAME bases!',
    fix: ['Product rule requires SAME base', '2³ × 3² = 8 × 9 = 72 (calculate separately)', 'Can only combine exponents when bases match']
  },
  {
    id: 'cm-6',
    mistake: 'Wrong order of operations with exponents',
    explanation: '2 × 3² = 18, not 36. Exponents come before multiplication!',
    fix: ['Remember PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract', 'Calculate exponents before multiplying', '2 × 3² = 2 × 9 = 18']
  },
  {
    id: 'cm-7',
    mistake: 'Distributing exponents incorrectly',
    explanation: '(2 + 3)² ≠ 2² + 3². Exponents don\'t distribute over addition!',
    fix: ['(2 + 3)² = 5² = 25', '2² + 3² = 4 + 9 = 13', 'ONLY distribute over multiplication: (2 × 3)² = 2² × 3²'],
    imagePlaceholder: 'Image placeholder: Exponent distribution rules (to be uploaded)'
  }
];

const exponentsMiniTestQuestions: MiniTestQuestion[] = [
  { id: 'mt-1', question: 'What is 3² × 3³?', options: ['3⁵', '3⁶', '9⁵', '3¹'], correctAnswer: 0, explanation: 'Product rule: 3²⁺³ = 3⁵', difficulty: 1 },
  { id: 'mt-2', question: 'Simplify: 7⁰', options: ['1', '0', '7', 'undefined'], correctAnswer: 0, explanation: 'Any non-zero number^0 = 1', difficulty: 1 },
  { id: 'mt-3', question: 'What is (2²)³?', options: ['2⁶', '2⁵', '2⁸', '2¹'], correctAnswer: 0, explanation: 'Power rule: 2²ˣ³ = 2⁶', difficulty: 2 },
  { id: 'mt-4', question: 'Simplify: 5⁴ ÷ 5²', options: ['5²', '5⁶', '5⁸', '1'], correctAnswer: 0, explanation: 'Quotient rule: 5⁴⁻² = 5²', difficulty: 2 },
  { id: 'mt-5', question: 'What is 4⁻²?', options: ['1/16', '-16', '-8', '1/8'], correctAnswer: 0, explanation: '4⁻² = 1/4² = 1/16', difficulty: 2 },
  { id: 'mt-6', question: 'Simplify: (3²)² × 3⁻²', options: ['3²', '3⁶', '3⁴', '1'], correctAnswer: 0, explanation: '3⁴ × 3⁻² = 3⁴⁻² = 3²', difficulty: 3 },
  { id: 'mt-7', question: 'What is 2⁵ ÷ 2⁷?', options: ['1/4', '2²', '4', '2⁻²'], correctAnswer: 0, explanation: '2⁵⁻⁷ = 2⁻² = 1/4', difficulty: 3 },
  { id: 'mt-8', question: 'Evaluate: (-1)¹⁰⁰', options: ['1', '-1', '100', '0'], correctAnswer: 0, explanation: 'Even power of -1 equals 1', difficulty: 2 },
  { id: 'mt-9', question: 'What is 16^(1/4)?', options: ['2', '4', '8', '64'], correctAnswer: 0, explanation: '16^(1/4) = ⁴√16 = 2', difficulty: 2 },
  { id: 'mt-10', question: 'Simplify: 10² × 10³ ÷ 10⁴', options: ['10¹', '10⁵', '10⁹', '10⁻¹'], correctAnswer: 0, explanation: '10²⁺³⁻⁴ = 10¹', difficulty: 3 },
  { id: 'mt-11', question: 'What is (-3)³?', options: ['-27', '27', '-9', '9'], correctAnswer: 0, explanation: '(-3)³ = -27 (odd power keeps negative)', difficulty: 2 },
  { id: 'mt-12', question: 'Calculate: 8^(2/3)', options: ['4', '8', '16', '2'], correctAnswer: 0, explanation: '(∛8)² = 2² = 4', difficulty: 3 },
  { id: 'mt-13', question: 'What is 5⁻¹ + 5⁻¹?', options: ['2/5', '1/10', '5⁻²', '1/25'], correctAnswer: 0, explanation: '1/5 + 1/5 = 2/5', difficulty: 3 },
  { id: 'mt-14', question: 'Simplify: (x³)⁴', options: ['x¹²', 'x⁷', 'x¹', '4x³'], correctAnswer: 0, explanation: 'Power rule: x³ˣ⁴ = x¹²', difficulty: 2 },
  { id: 'mt-15', question: 'What is (2 × 3)²?', options: ['36', '12', '13', '6²'], correctAnswer: 0, explanation: '(2 × 3)² = 6² = 36', difficulty: 2 },
  { id: 'mt-16', question: 'Evaluate: 2⁴ + 2⁴', options: ['2⁵', '32', '2⁸', '16'], correctAnswer: 1, explanation: '16 + 16 = 32 (not 2⁵!)', difficulty: 3 },
  { id: 'mt-17', question: 'What is (1/2)⁻²?', options: ['4', '1/4', '-4', '2'], correctAnswer: 0, explanation: '(1/2)⁻² = 2² = 4', difficulty: 3 },
  { id: 'mt-18', question: 'Simplify: 6⁰ × 6¹', options: ['6', '36', '1', '0'], correctAnswer: 0, explanation: '1 × 6 = 6', difficulty: 1 }
];

const exponentsFullTestQuestions: FullTestQuestion[] = [
  { id: 'ft-1', question: 'What is 2⁴?', options: ['16', '8', '32', '6'], correctAnswer: 0, explanation: '2⁴ = 2×2×2×2 = 16', topic: 'Basic' },
  { id: 'ft-2', question: 'Simplify: x³ × x⁵', options: ['x⁸', 'x¹⁵', '2x⁸', 'x²'], correctAnswer: 0, explanation: 'Product rule: x³⁺⁵ = x⁸', topic: 'Product Rule' },
  { id: 'ft-3', question: 'What is 10⁻¹?', options: ['0.1', '-10', '1', '-1'], correctAnswer: 0, explanation: '10⁻¹ = 1/10 = 0.1', topic: 'Negative Exponents' },
  { id: 'ft-4', question: 'Simplify: (5²)⁰', options: ['1', '25', '0', '5'], correctAnswer: 0, explanation: 'Anything^0 = 1', topic: 'Zero Exponent' },
  { id: 'ft-5', question: 'What is 8^(1/3)?', options: ['2', '4', '3', '8/3'], correctAnswer: 0, explanation: '8^(1/3) = ∛8 = 2', topic: 'Fractional Exponents' },
  { id: 'ft-6', question: 'Calculate: 3⁴ ÷ 3²', options: ['9', '3⁶', '81', '3'], correctAnswer: 0, explanation: '3⁴⁻² = 3² = 9', topic: 'Quotient Rule' },
  { id: 'ft-7', question: 'What is (-2)⁵?', options: ['-32', '32', '-10', '10'], correctAnswer: 0, explanation: 'Odd power of negative = negative', topic: 'Negative Bases' },
  { id: 'ft-8', question: 'Simplify: (2³)⁴', options: ['2¹²', '2⁷', '2¹', '8⁴'], correctAnswer: 0, explanation: 'Power rule: 2³ˣ⁴ = 2¹²', topic: 'Power Rule' },
  { id: 'ft-9', question: 'What is 5⁻²?', options: ['1/25', '-25', '-10', '0.04'], correctAnswer: 0, explanation: '5⁻² = 1/5² = 1/25', topic: 'Negative Exponents' },
  { id: 'ft-10', question: 'Calculate: 4^(3/2)', options: ['8', '6', '12', '64'], correctAnswer: 0, explanation: '(√4)³ = 2³ = 8', topic: 'Fractional Exponents' },
  { id: 'ft-11', question: 'Simplify: 10² × 10⁻³', options: ['1/10', '10⁵', '10⁻¹', '100'], correctAnswer: 0, explanation: '10²⁻³ = 10⁻¹ = 0.1 = 1/10', topic: 'Combined Rules' },
  { id: 'ft-12', question: 'What is (3 × 4)²?', options: ['144', '25', '24', '49'], correctAnswer: 0, explanation: '12² = 144', topic: 'Order of Operations' },
  { id: 'ft-13', question: 'Evaluate: 2³ + 2³', options: ['16', '2⁶', '2⁴', '8'], correctAnswer: 0, explanation: '8 + 8 = 16 (NOT 2⁶)', topic: 'Common Mistakes' },
  { id: 'ft-14', question: 'What is 125^(1/3)?', options: ['5', '25', '15', '625'], correctAnswer: 0, explanation: '∛125 = 5', topic: 'Fractional Exponents' },
  { id: 'ft-15', question: 'Simplify: (x⁴y²)³', options: ['x¹²y⁶', 'x⁷y⁵', 'x¹²y²', '3x⁴y²'], correctAnswer: 0, explanation: 'x⁴ˣ³y²ˣ³ = x¹²y⁶', topic: 'Power Rule' },
  { id: 'ft-16', question: 'What is 16^(3/4)?', options: ['8', '12', '64', '4'], correctAnswer: 0, explanation: '(⁴√16)³ = 2³ = 8', topic: 'Fractional Exponents' },
  { id: 'ft-17', question: 'Calculate: 9⁻¹/²', options: ['1/3', '-3', '3', '-1/3'], correctAnswer: 0, explanation: '9⁻¹/² = 1/√9 = 1/3', topic: 'Combined Rules' },
  { id: 'ft-18', question: 'Simplify: a⁵ × a⁻² × a³', options: ['a⁶', 'a¹⁰', 'a⁰', '3a⁶'], correctAnswer: 0, explanation: 'a⁵⁻²⁺³ = a⁶', topic: 'Product Rule' },
  { id: 'ft-19', question: 'What is (1/3)⁻¹?', options: ['3', '1/3', '-3', '-1/3'], correctAnswer: 0, explanation: '(1/3)⁻¹ = 3/1 = 3', topic: 'Negative Exponents' },
  { id: 'ft-20', question: 'Evaluate: (-1)⁹⁹', options: ['-1', '1', '99', '-99'], correctAnswer: 0, explanation: 'Odd power of -1 = -1', topic: 'Negative Bases' },
  { id: 'ft-21', question: 'Simplify: (2⁴)^(1/2)', options: ['4', '8', '16', '2'], correctAnswer: 0, explanation: '2⁴ˣ¹/² = 2² = 4', topic: 'Combined Rules' },
  { id: 'ft-22', question: 'What is 64^(2/3)?', options: ['16', '32', '8', '4'], correctAnswer: 0, explanation: '(∛64)² = 4² = 16', topic: 'Fractional Exponents' },
  { id: 'ft-23', question: 'Calculate: 5² × 2²', options: ['100', '49', '50', '10⁴'], correctAnswer: 0, explanation: '25 × 4 = 100 (different bases, multiply values)', topic: 'Mixed Bases' },
  { id: 'ft-24', question: 'What is x⁶ ÷ x⁻²?', options: ['x⁸', 'x⁴', 'x³', 'x⁻¹²'], correctAnswer: 0, explanation: 'x⁶⁻⁽⁻²⁾ = x⁶⁺² = x⁸', topic: 'Quotient Rule' },
  { id: 'ft-25', question: 'Simplify: (3⁻²)⁻¹', options: ['9', '1/9', '3²', '3⁻²'], correctAnswer: 0, explanation: '3⁽⁻²⁾ˣ⁽⁻¹⁾ = 3² = 9', topic: 'Power Rule' }
];

const exponentsDynamicContents: DynamicLessonContent[] = [
  {
    learningStyle: 'visual',
    title: 'Exponents: See the Pattern',
    approach: 'Color-coded exponent rules, animated multiplication sequences',
    introduction: 'Welcome to the visual world of exponents! We\'ll use colors, trees, and patterns to make these laws unforgettable.',
    mainContent: [
      '🔵 **Exponent Tower:** Imagine 2³ as a tower of 3 blocks, each labeled "2". Stack them: 2 × 2 × 2 = 8.',
      '🟢 **Product Rule Visual:** 2² × 2³ = stack 2 blocks, then 3 more blocks = 5 blocks total = 2⁵. Adding exponents = stacking towers!',
      '🟡 **Quotient Rule Visual:** 2⁵ ÷ 2² = 5 blocks remove 2 blocks = 3 blocks left = 2³. Subtracting = removing from tower.',
      '🔴 **Power Rule Visual:** (2²)³ = 3 copies of 2-block tower = 2 + 2 + 2 = 6 blocks = 2⁶. Multiplying = copying towers!',
      '⬜ **Zero Exponent:** Any tower with 0 blocks... what\'s left? Just the base "1"! That\'s why a⁰ = 1.'
    ],
    examples: [
      'Draw 3⁴: Four blocks labeled "3" stacked → 3 × 3 × 3 × 3 = 81',
      'Visual for 5² × 5³: Two 5-towers (2 + 3 = 5 blocks) → 5⁵ = 3125',
      'Power rule picture: (2³)² = Two copies of 3-block tower = 6 blocks = 2⁶ = 64'
    ],
    practicePrompts: [
      'Draw the tower for 4³ and count the total value',
      'Illustrate 3² × 3⁴ using the block method',
      'Show why a⁰ = 1 using the tower visualization'
    ],
    summary: 'Exponents are just multiplication towers! Product = stack towers, Quotient = remove blocks, Power = copy towers.',
    tips: ['Draw towers for every problem', 'Use colors for different bases', 'Count blocks to verify answers']
  },
  {
    learningStyle: 'auditory',
    title: 'Exponents: Listen & Learn',
    approach: 'Verbal patterns and rhymes for rules',
    introduction: 'Let\'s turn exponent rules into memorable phrases and rhymes! Say them out loud as you learn.',
    mainContent: [
      '🎵 **The Base Chant:** "The BASE is what we multiply, the EXPONENT tells us how many times to try!"',
      '🗣️ **Product Rule Song:** "Same base, times sign? ADD those powers, works just fine! Two-three times two-four equals two-seven, math rule heaven!"',
      '📢 **Quotient Rule Rhyme:** "Same base, divide sign, SUBTRACT and you\'ll be fine! Five to the six over five to the two equals five to the four, that\'s what we do!"',
      '🎤 **Power Rule Beat:** "Power of a power, what do we do? MULTIPLY exponents, see it through! Two-cubed to the fourth equals two-twelve, exponent wealth!"',
      '🔊 **Zero Rule Reminder:** "Anything to zero power equals one, that\'s how it\'s done! 5⁰, 100⁰, million to zero - all equal ONE, our hero!"'
    ],
    examples: [
      'Say: "3² times 3⁴... same base, add powers... 3⁶... equals 729!"',
      'Recite: "10⁵ divided by 10²... same base, subtract... 10³... equals 1000!"',
      'Chant: "2-squared to the fifth... power of power, multiply... 2¹⁰... equals 1024!"'
    ],
    practicePrompts: [
      'Say the product rule out loud, then solve 4² × 4³',
      'Recite the negative exponent rule: "Negative power means flip and flower"',
      'Create your own rhyme for the quotient rule'
    ],
    summary: 'Rhymes and rhythms make exponent rules stick! Say them out loud every time you solve.',
    tips: ['Read problems aloud', 'Create your own memory rhymes', 'Teach someone else using verbal explanations']
  },
  {
    learningStyle: 'text-based',
    title: 'Exponents: Complete Reference Guide',
    approach: 'Formal definitions and proofs',
    introduction: 'This comprehensive text guide provides precise definitions, formal proofs, and systematic procedures for all exponent operations.',
    mainContent: [
      '**Definition:** For any real number a and positive integer n, aⁿ = a × a × ... × a (n factors of a). Here, a is the base and n is the exponent.',
      '**Product of Powers:** For same base a: aᵐ × aⁿ = aᵐ⁺ⁿ. Proof: aᵐ has m factors of a, aⁿ has n factors, total = m+n factors = aᵐ⁺ⁿ.',
      '**Quotient of Powers:** For same base a (a≠0): aᵐ ÷ aⁿ = aᵐ⁻ⁿ. Derived from canceling common factors.',
      '**Power of a Power:** (aᵐ)ⁿ = aᵐⁿ. Proof: (aᵐ)ⁿ means n copies of aᵐ multiplied, using product rule: aᵐ⁺ᵐ⁺...⁺ᵐ = aᵐⁿ.',
      '**Zero Exponent:** a⁰ = 1 (a≠0). Proof: aⁿ ÷ aⁿ = aⁿ⁻ⁿ = a⁰, and aⁿ ÷ aⁿ = 1, therefore a⁰ = 1.',
      '**Negative Exponents:** a⁻ⁿ = 1/aⁿ. Definition extending exponents to negative integers while preserving quotient rule consistency.'
    ],
    examples: [
      'Example 1: 2⁵ × 2³ = 2⁵⁺³ = 2⁸ = 256. Verification: 32 × 8 = 256 ✓',
      'Example 2: (3²)⁴ = 3²ˣ⁴ = 3⁸ = 6561. Verification: 9⁴ = 6561 ✓',
      'Example 3: 4⁻³ = 1/4³ = 1/64. Using negative exponent definition.'
    ],
    practicePrompts: [
      'Write a formal proof that (ab)ⁿ = aⁿbⁿ',
      'Derive why a^(m/n) = ⁿ√(aᵐ) using exponent rules',
      'Prove that (a/b)⁻ⁿ = (b/a)ⁿ'
    ],
    summary: 'Exponent laws form a consistent system based on repeated multiplication. Each rule follows logically from the definition.',
    tips: ['Write out complete steps', 'Verify with numerical examples', 'Understand proofs, don\'t just memorize']
  },
  {
    learningStyle: 'problem-solver',
    title: 'Exponents: Challenge Mode',
    approach: 'Challenge problems first, rules derived from patterns',
    introduction: 'Ready for exponent challenges? Discover the rules by solving problems first, then understand why they work!',
    mainContent: [
      '💪 **Challenge Approach:** Try 2³ × 2² first. Count: (2×2×2) × (2×2) = 32. Now count 2s: 5. So 2³ × 2² = 2⁵. Pattern: ADD exponents!',
      '🧩 **Pattern Hunt:** Calculate 3⁵÷3², 4⁶÷4³, 5⁴÷5¹. What\'s the pattern? (Answer: subtract exponents!)',
      '⚡ **Speed Challenge:** Simplify (2²)³ three ways: expand fully, use rule, calculate value. All should give 64!',
      '🎯 **Real-World:** A bacteria doubles every hour. After 5 hours: 2⁵ bacteria. After 8 hours: 2⁸. Ratio? 2⁸/2⁵ = 2³ = 8 times more!',
      '🏆 **Boss Level:** Simplify: (3² × 3⁻¹)² ÷ 3. Use all rules! Answer: (3¹)² ÷ 3¹ = 3² ÷ 3 = 3¹ = 3.'
    ],
    examples: [
      'Challenge: What is 2¹⁰ ÷ 2⁷? (Think: how many 2s remain after canceling 7?) Answer: 2³ = 8',
      'Puzzle: If 5ˣ = 125, what is x? (Hint: 125 = 5 × 5 × 5) Answer: x = 3',
      'Brain teaser: Simplify 8^(2/3) without a calculator. (Hint: 8 = 2³)'
    ],
    practicePrompts: [
      'Solve 10 exponent problems in 3 minutes - go!',
      'Create your own exponent puzzle for a friend',
      'Find the pattern: 2¹, 2², 2³, 2⁴... what comes at 2¹⁰?'
    ],
    summary: 'The best way to master exponents is through challenge and discovery! Find patterns, test your theories, level up!',
    tips: ['Try before looking at rules', 'Look for patterns in your answers', 'Challenge yourself with harder problems']
  },
  {
    learningStyle: 'adhd-friendly',
    title: 'Exponents: Power-Up! ⚡',
    approach: 'Gamified exponent battles, quick wins',
    introduction: '🎮 Ready to level up your exponent powers? Quick lessons, instant rewards, let\'s GO!',
    mainContent: [
      '⚡ **POWER FACT:** 2³ = 2×2×2 = 8. That\'s it! Exponent = how many times to multiply. BOOM! 💥',
      '🎯 **QUICK RULE 1 - MULTIPLY:** Same base? ADD powers! 5² × 5³ = 5⁵. Done! ✓',
      '🔥 **QUICK RULE 2 - DIVIDE:** Same base? SUBTRACT! 7⁵ ÷ 7² = 7³. Easy! ✓',
      '🚀 **QUICK RULE 3 - POWER²:** Power of power? MULTIPLY! (2³)² = 2⁶. Yes! ✓',
      '💎 **ZERO POWER:** Anything⁰ = 1. Always. 5⁰ = 1. 1000⁰ = 1. MEMORIZED! ✓'
    ],
    examples: [
      '⚡ 30-SECOND: 4² = ? (16) YOU GOT IT! 🎉',
      '🎮 QUICK MATCH: 3² × 3³ = 3? (5) PERFECT! 🏆',
      '💪 SPEED RUN: 2⁰ = ? (1) 2¹ = ? (2) 2² = ? (4) STREAK! 🔥'
    ],
    practicePrompts: [
      '⏱️ 1-minute challenge: How many powers of 2 can you list?',
      '🎯 Quick solve: 10⁰ + 10¹ = ?',
      '💥 Speed round: 5² × 5⁰ = ?'
    ],
    summary: '🏆 YOU CRUSHED IT! Multiply = ADD powers. Divide = SUBTRACT. Power² = MULTIPLY. Zero power = 1. CHAMPION! 🎮',
    tips: ['Set 5-min timers ⏰', 'Reward yourself after each problem 🎉', 'Move around between challenges! 🏃']
  }
];

// ==================== QUADRATIC EQUATIONS TOPIC ====================
const quadraticsBasicLesson: BasicLessonContent = {
  theory: [
    {
      id: 'theory-1',
      title: 'What is a Quadratic Equation?',
      content: `A quadratic equation is a polynomial equation of degree 2.

**Standard Form:** ax² + bx + c = 0

Where:
• a = coefficient of x² (must not be 0)
• b = coefficient of x
• c = constant term

**Examples:**
• x² - 5x + 6 = 0 (a=1, b=-5, c=6)
• 2x² + 3x - 2 = 0 (a=2, b=3, c=-2)
• x² - 9 = 0 (a=1, b=0, c=-9)

The solutions are called **roots** or **zeros** of the equation.`,
      imagePlaceholder: 'Image placeholder: Quadratic equation parts labeled (to be uploaded)'
    },
    {
      id: 'theory-2',
      title: 'The Quadratic Formula',
      content: `The quadratic formula solves ANY quadratic equation:

**Formula:** x = (-b ± √(b² - 4ac)) / 2a

**The Discriminant:** D = b² - 4ac

The discriminant tells us about the solutions:
• D > 0: Two different real solutions
• D = 0: One repeated real solution
• D < 0: No real solutions (complex numbers)

**Memory Tip:** "Negative b, plus or minus the square root, of b squared minus 4ac, all over 2a"`,
      imagePlaceholder: 'Image placeholder: Quadratic formula with discriminant cases (to be uploaded)'
    },
    {
      id: 'theory-3',
      title: 'Solving by Factoring',
      content: `If ax² + bx + c can be factored, this is often the fastest method!

**For x² + bx + c = 0:**
Find two numbers that:
1. MULTIPLY to give c
2. ADD to give b

**Example:** x² - 5x + 6 = 0
• Need: multiply to 6, add to -5
• Numbers: -2 and -3
• Factor: (x - 2)(x - 3) = 0
• Solutions: x = 2 or x = 3

**Zero Product Property:** If AB = 0, then A = 0 or B = 0.`,
      imagePlaceholder: 'Image placeholder: Factoring process flowchart (to be uploaded)'
    },
    {
      id: 'theory-4',
      title: 'Completing the Square',
      content: `This method creates a perfect square trinomial.

**Steps:**
1. Move c to the right side
2. Add (b/2)² to both sides
3. Factor left side as (x + b/2)²
4. Take square root of both sides
5. Solve for x

**Example:** x² + 6x + 5 = 0
• x² + 6x = -5
• x² + 6x + 9 = -5 + 9 (add (6/2)² = 9)
• (x + 3)² = 4
• x + 3 = ±2
• x = -3 + 2 = -1 or x = -3 - 2 = -5`,
      imagePlaceholder: 'Image placeholder: Completing the square step-by-step (to be uploaded)'
    },
    {
      id: 'theory-5',
      title: 'Special Cases',
      content: `Some quadratics have quick solutions:

**Difference of Squares:** x² - a² = 0
• Factor: (x + a)(x - a) = 0
• Solutions: x = a or x = -a
• Example: x² - 16 = 0 → x = ±4

**Perfect Square:** x² + 2ax + a² = 0
• Factor: (x + a)² = 0
• One solution: x = -a
• Example: x² + 6x + 9 = 0 → (x+3)² = 0 → x = -3

**No x-term:** ax² + c = 0
• Solve: x² = -c/a
• Example: x² - 25 = 0 → x² = 25 → x = ±5`,
      imagePlaceholder: 'Image placeholder: Special case patterns (to be uploaded)'
    },
    {
      id: 'theory-6',
      title: 'Graphical Interpretation',
      content: `A quadratic equation corresponds to a parabola y = ax² + bx + c.

**Solutions = x-intercepts** (where the parabola crosses the x-axis)

**What the discriminant tells us graphically:**
• D > 0: Parabola crosses x-axis twice (2 solutions)
• D = 0: Parabola touches x-axis once (1 solution)
• D < 0: Parabola doesn't touch x-axis (no real solutions)

**Vertex:** The turning point is at x = -b/(2a)

**Direction:**
• a > 0: Opens upward (U-shape)
• a < 0: Opens downward (∩-shape)`,
      imagePlaceholder: 'Image placeholder: Parabola showing different discriminant cases (to be uploaded)'
    }
  ],
  examples: [
    {
      id: 'example-1',
      title: 'Solving by Factoring',
      content: `**Problem:** Solve x² - 5x + 6 = 0

**Solution:**
Step 1: Identify a=1, b=-5, c=6
Step 2: Find two numbers that multiply to 6 and add to -5
  - Factors of 6: (1,6), (2,3)
  - Which add to -5? -2 and -3 ✓

Step 3: Factor
  (x - 2)(x - 3) = 0

Step 4: Apply zero product property
  x - 2 = 0  →  x = 2
  x - 3 = 0  →  x = 3

**Answer: x = 2 or x = 3**`,
      imagePlaceholder: 'Image placeholder: Factoring solution steps (to be uploaded)'
    },
    {
      id: 'example-2',
      title: 'Using the Quadratic Formula',
      content: `**Problem:** Solve 2x² + 3x - 2 = 0

**Solution:**
Step 1: Identify a=2, b=3, c=-2

Step 2: Calculate discriminant
  D = b² - 4ac = 9 - 4(2)(-2) = 9 + 16 = 25

Step 3: Apply formula
  x = (-3 ± √25) / (2×2)
  x = (-3 ± 5) / 4

Step 4: Find both solutions
  x = (-3 + 5) / 4 = 2/4 = 1/2
  x = (-3 - 5) / 4 = -8/4 = -2

**Answer: x = 1/2 or x = -2**`,
      imagePlaceholder: 'Image placeholder: Quadratic formula substitution (to be uploaded)'
    },
    {
      id: 'example-3',
      title: 'Completing the Square',
      content: `**Problem:** Solve x² + 4x - 5 = 0

**Solution:**
Step 1: Move constant
  x² + 4x = 5

Step 2: Complete the square (add (4/2)² = 4)
  x² + 4x + 4 = 5 + 4
  (x + 2)² = 9

Step 3: Take square root
  x + 2 = ±3

Step 4: Solve
  x = -2 + 3 = 1
  x = -2 - 3 = -5

**Answer: x = 1 or x = -5**`,
      imagePlaceholder: 'Image placeholder: Completing square visual (to be uploaded)'
    },
    {
      id: 'example-4',
      title: 'Difference of Squares',
      content: `**Problem:** Solve x² - 49 = 0

**Solution:**
This is a difference of squares: a² - b² = (a+b)(a-b)

x² - 49 = x² - 7²
= (x + 7)(x - 7) = 0

Solutions:
x + 7 = 0  →  x = -7
x - 7 = 0  →  x = 7

**Answer: x = 7 or x = -7 (often written x = ±7)**`,
      imagePlaceholder: 'Image placeholder: Difference of squares pattern (to be uploaded)'
    },
    {
      id: 'example-5',
      title: 'When Discriminant is Zero',
      content: `**Problem:** Solve x² - 6x + 9 = 0

**Solution:**
Method 1 - Factoring:
  x² - 6x + 9 = (x - 3)(x - 3) = (x - 3)²
  x = 3 (repeated root)

Method 2 - Discriminant check:
  D = (-6)² - 4(1)(9) = 36 - 36 = 0
  D = 0 means ONE solution

  x = -(-6) / 2(1) = 6/2 = 3

**Answer: x = 3 (double root)**`,
      imagePlaceholder: 'Image placeholder: Perfect square trinomial (to be uploaded)'
    }
  ],
  practiceQuestions: [
    { id: 'pq-1', question: 'Solve: x² - 4 = 0', options: ['x = ±2', 'x = 4', 'x = 2', 'x = -4'], correctAnswer: 0, explanation: 'x² = 4, so x = ±√4 = ±2' },
    { id: 'pq-2', question: 'What is the discriminant of x² + 2x + 1 = 0?', options: ['0', '4', '-4', '1'], correctAnswer: 0, explanation: 'D = b² - 4ac = 4 - 4(1)(1) = 0' },
    { id: 'pq-3', question: 'Solve: x² - x - 6 = 0', options: ['x = 3, x = -2', 'x = 6, x = -1', 'x = 2, x = -3', 'x = 1, x = -6'], correctAnswer: 0, explanation: '(x-3)(x+2) = 0, so x = 3 or x = -2' },
    { id: 'pq-4', question: 'In 3x² - 5x + 2 = 0, what is b?', options: ['-5', '3', '2', '5'], correctAnswer: 0, explanation: 'b is the coefficient of x' },
    { id: 'pq-5', question: 'Solve: x² + 4x + 4 = 0', options: ['x = -2', 'x = 2', 'x = ±2', 'x = 4'], correctAnswer: 0, explanation: '(x+2)² = 0, so x = -2 (double root)' },
    { id: 'pq-6', question: 'How many real solutions does x² + 1 = 0 have?', options: ['0', '1', '2', 'Infinite'], correctAnswer: 0, explanation: 'x² = -1 has no real solutions (D < 0)' },
    { id: 'pq-7', question: 'Solve: 2x² - 8x = 0', options: ['x = 0, x = 4', 'x = 4', 'x = 2', 'x = 0, x = 2'], correctAnswer: 0, explanation: '2x(x - 4) = 0, so x = 0 or x = 4' },
    { id: 'pq-8', question: 'What is the sum of roots of x² - 7x + 12 = 0?', options: ['7', '12', '-7', '3'], correctAnswer: 0, explanation: 'Sum of roots = -b/a = 7' },
    { id: 'pq-9', question: 'Solve: x² - 5x = 0', options: ['x = 0, x = 5', 'x = 5', 'x = -5', 'x = 0'], correctAnswer: 0, explanation: 'x(x - 5) = 0, so x = 0 or x = 5' },
    { id: 'pq-10', question: 'If D = 25 for a quadratic, how many solutions?', options: ['2', '1', '0', '25'], correctAnswer: 0, explanation: 'D > 0 means two distinct real solutions' }
  ]
};

const quadraticsMiniLessons: MiniLessonContent[] = [
  {
    id: 'ml-1',
    title: 'Identifying a, b, and c',
    duration: '3 min',
    concept: 'Standard form coefficients',
    explanation: `In ax² + bx + c = 0:
• a = coefficient of x² (NEVER zero!)
• b = coefficient of x (can be zero)
• c = constant term (can be zero)

Examples:
• 2x² + 5x - 3 = 0: a=2, b=5, c=-3
• x² - 4 = 0: a=1, b=0, c=-4
• 3x² + x = 0: a=3, b=1, c=0

Always rewrite in standard form first!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Finding a, b, c in Quadratics"',
    keyTakeaway: 'Always rewrite in standard form ax² + bx + c = 0 first!'
  },
  {
    id: 'ml-2',
    title: 'The Discriminant Secret',
    duration: '4 min',
    concept: 'Predicting solution types',
    explanation: `The discriminant D = b² - 4ac tells you everything about solutions BEFORE solving!

• D > 0: Two different solutions ✓✓
• D = 0: One repeated solution ✓
• D < 0: No real solutions ✗

Example: For x² + 2x + 5 = 0
D = 4 - 20 = -16 < 0
No real solutions! Don't waste time solving.`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Discriminant Magic"',
    keyTakeaway: 'D > 0 = 2 roots, D = 0 = 1 root, D < 0 = no real roots'
  },
  {
    id: 'ml-3',
    title: 'Quick Factoring Tricks',
    duration: '5 min',
    concept: 'Spotting factorable quadratics',
    explanation: `Before using the formula, try factoring!

Clues it might factor nicely:
1. c is a small number with few factors
2. a = 1 (simpler factoring)
3. Sum of roots (-b/a) and product (c/a) are integers

For x² + bx + c: find numbers that multiply to c, add to b.

Example: x² - 7x + 10
Factors of 10: (1,10), (2,5)
Which add to -7? -2 and -5 ✓
Factor: (x-2)(x-5) = 0`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Fast Factoring"',
    keyTakeaway: 'Try factoring before using the formula!'
  },
  {
    id: 'ml-4',
    title: 'The ± Symbol Explained',
    duration: '3 min',
    concept: 'Plus or minus means TWO answers',
    explanation: `The ± symbol means you calculate TWICE:

x = (-b + √D) / 2a  AND  x = (-b - √D) / 2a

Example: x = (4 ± 6) / 2
Solution 1: (4 + 6) / 2 = 10/2 = 5
Solution 2: (4 - 6) / 2 = -2/2 = -1

Don't forget the second solution!

Exception: If D = 0, √D = 0, so both give the same answer.`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Plus or Minus in Quadratics"',
    keyTakeaway: 'The ± creates TWO solutions - never forget!'
  },
  {
    id: 'ml-5',
    title: 'Completing the Square Method',
    duration: '5 min',
    concept: 'Creating perfect square trinomials',
    explanation: `Turn ax² + bx into a perfect square!

For x² + bx:
Add (b/2)² to complete the square.

x² + 6x + ? = (x + 3)²
Missing piece: (6/2)² = 9

So: x² + 6x + 9 = (x + 3)²

This works because:
(x + a)² = x² + 2ax + a²

If you see 2a, then a² is what you need!`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Complete the Square Step by Step"',
    keyTakeaway: 'Add (b/2)² to create a perfect square trinomial'
  },
  {
    id: 'ml-6',
    title: 'Choosing Your Method',
    duration: '4 min',
    concept: 'Which solving method is best?',
    explanation: `Choose wisely based on the equation:

**Use FACTORING when:**
- c has small factors
- Equation looks simple
- a = 1

**Use FORMULA when:**
- Factoring doesn't work
- Coefficients are messy
- You need exact answers

**Use SQUARE ROOT when:**
- No x-term (ax² + c = 0)
- Perfect square form

**Use COMPLETING SQUARE when:**
- You need vertex form
- Learning the concept`,
    videoPlaceholder: 'Video placeholder: YouTube link will be added - "Best Method Selection"',
    keyTakeaway: 'Try factoring first, use formula as backup!'
  }
];

const quadraticsDiagrams: DiagramContent[] = [
  { id: 'diag-1', title: 'Quadratic Solution Methods Cheat Sheet', description: 'When to use factoring, formula, or completing the square - all methods compared', imagePlaceholder: 'Image placeholder: Methods comparison cheat sheet (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-2', title: 'Choosing Your Solution Method', description: 'Flowchart to select the best approach for any quadratic equation', imagePlaceholder: 'Image placeholder: Method selection decision tree (to be uploaded)', type: 'flowchart' },
  { id: 'diag-3', title: 'Quadratic Formula Step-by-Step', description: 'Visual guide through each step of applying the quadratic formula', imagePlaceholder: 'Image placeholder: Formula application steps (to be uploaded)', type: 'step-diagram' },
  { id: 'diag-4', title: 'Discriminant Visual Guide', description: 'How D relates to parabola and x-axis intersections', imagePlaceholder: 'Image placeholder: Discriminant cases with parabolas (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-5', title: 'Factoring Pattern Recognition', description: 'Common factoring patterns: difference of squares, perfect square trinomials', imagePlaceholder: 'Image placeholder: Factoring patterns chart (to be uploaded)', type: 'cheat-sheet' },
  { id: 'diag-6', title: 'Completing the Square Process', description: 'Step-by-step visual for the completing the square method', imagePlaceholder: 'Image placeholder: Complete the square flowchart (to be uploaded)', type: 'step-diagram' }
];

const quadraticsCommonMistakes: CommonMistake[] = [
  {
    id: 'cm-1',
    mistake: 'Forgetting the ± in the quadratic formula',
    explanation: 'The formula gives TWO solutions (usually). Must use both + and -',
    fix: ['Always write ± when using the formula', 'Calculate BOTH: (-b + √D)/2a AND (-b - √D)/2a', 'Only exception: D = 0 gives one answer'],
    imagePlaceholder: 'Image placeholder: Plus-minus importance visual (to be uploaded)'
  },
  {
    id: 'cm-2',
    mistake: 'Sign errors with negative b',
    explanation: 'When b is negative, -b becomes POSITIVE! Example: if b = -5, then -b = -(-5) = +5',
    fix: ['Write out -b explicitly before substituting', 'Double-check signs at each step', 'Use parentheses: -(-5) not just --5']
  },
  {
    id: 'cm-3',
    mistake: 'Not putting equation in standard form',
    explanation: 'The formula only works for ax² + bx + c = 0. Everything must be on one side!',
    fix: ['Always move all terms to left side first', 'Right side must equal 0', 'Example: x² = 5x - 6 becomes x² - 5x + 6 = 0'],
    imagePlaceholder: 'Image placeholder: Standard form conversion (to be uploaded)'
  },
  {
    id: 'cm-4',
    mistake: 'Dividing only the numerator by 2a',
    explanation: 'The ENTIRE numerator (-b ± √D) is divided by 2a, not just √D',
    fix: ['Use parentheses: (-b ± √D) / (2a)', 'The division applies to everything on top', 'Calculate numerator completely before dividing']
  },
  {
    id: 'cm-5',
    mistake: 'Wrong sign when factoring',
    explanation: 'For x² - 5x + 6, factors are (x - 2)(x - 3), not (x + 2)(x + 3)',
    fix: ['Check: factors must multiply to c and add to b', '(-2) × (-3) = +6 ✓', '(-2) + (-3) = -5 ✓']
  },
  {
    id: 'cm-6',
    mistake: 'Not checking solutions',
    explanation: 'Calculation errors are common. Always verify by substituting back!',
    fix: ['Plug each solution into the ORIGINAL equation', 'Both sides should equal when substituted', 'If not, recheck your work'],
    imagePlaceholder: 'Image placeholder: Solution verification example (to be uploaded)'
  },
  {
    id: 'cm-7',
    mistake: 'Confusion with a=1 versus a≠1',
    explanation: 'When a≠1, factoring is trickier. May need to factor out a first or use AC method.',
    fix: ['If a≠1, consider using the formula instead', 'Or use AC method: multiply a×c, factor, then split', 'Example: 2x² + 5x + 2 = (2x + 1)(x + 2)']
  }
];

const quadraticsMiniTestQuestions: MiniTestQuestion[] = [
  { id: 'mt-1', question: 'In 3x² - 5x + 2 = 0, what is b?', options: ['-5', '3', '2', '5'], correctAnswer: 0, explanation: 'b is the coefficient of x', difficulty: 1 },
  { id: 'mt-2', question: 'Solve: x² = 9', options: ['x = ±3', 'x = 3', 'x = 81', 'x = ±81'], correctAnswer: 0, explanation: 'x = ±√9 = ±3', difficulty: 1 },
  { id: 'mt-3', question: 'What is the discriminant of x² + 4x + 4 = 0?', options: ['0', '16', '-16', '4'], correctAnswer: 0, explanation: 'D = 16 - 16 = 0', difficulty: 2 },
  { id: 'mt-4', question: 'Solve: x² - 9 = 0', options: ['x = 3, x = -3', 'x = 9', 'x = -9', 'x = 3'], correctAnswer: 0, explanation: 'Difference of squares: (x-3)(x+3) = 0', difficulty: 1 },
  { id: 'mt-5', question: 'How many real roots does x² + 1 = 0 have?', options: ['0', '1', '2', 'Infinite'], correctAnswer: 0, explanation: 'D = 0 - 4 = -4 < 0, no real roots', difficulty: 2 },
  { id: 'mt-6', question: 'Solve: 2x² - 8x = 0', options: ['x = 0, x = 4', 'x = 4', 'x = 2', 'x = 0, x = 2'], correctAnswer: 0, explanation: '2x(x - 4) = 0', difficulty: 2 },
  { id: 'mt-7', question: 'Solve: x² + 5x + 6 = 0', options: ['x = -2, x = -3', 'x = 2, x = 3', 'x = -6, x = 1', 'x = 6, x = -1'], correctAnswer: 0, explanation: '(x+2)(x+3) = 0', difficulty: 2 },
  { id: 'mt-8', question: 'If D = 25 for a quadratic, how many real roots?', options: ['2', '1', '0', '25'], correctAnswer: 0, explanation: 'D > 0 means two distinct real roots', difficulty: 2 },
  { id: 'mt-9', question: 'What completes x² + 6x + ___ to a perfect square?', options: ['9', '6', '36', '3'], correctAnswer: 0, explanation: '(6/2)² = 9', difficulty: 2 },
  { id: 'mt-10', question: 'Solve: x² - 4x + 3 = 0', options: ['x = 1, x = 3', 'x = -1, x = -3', 'x = 4, x = -1', 'x = 2, x = 2'], correctAnswer: 0, explanation: '(x-1)(x-3) = 0', difficulty: 2 },
  { id: 'mt-11', question: 'The sum of roots of x² - 7x + 10 = 0 is:', options: ['7', '10', '-7', '3'], correctAnswer: 0, explanation: 'Sum = -b/a = 7', difficulty: 3 },
  { id: 'mt-12', question: 'Solve: x² + 6x + 9 = 0', options: ['x = -3', 'x = 3', 'x = ±3', 'x = 9'], correctAnswer: 0, explanation: '(x+3)² = 0, x = -3 (double root)', difficulty: 2 },
  { id: 'mt-13', question: 'For 2x² + 3x - 5 = 0, what is D?', options: ['49', '9', '-31', '25'], correctAnswer: 0, explanation: 'D = 9 - 4(2)(-5) = 9 + 40 = 49', difficulty: 3 },
  { id: 'mt-14', question: 'Solve: (x - 2)² = 16', options: ['x = 6, x = -2', 'x = 4', 'x = 2', 'x = 6'], correctAnswer: 0, explanation: 'x - 2 = ±4, so x = 6 or x = -2', difficulty: 3 },
  { id: 'mt-15', question: 'The product of roots of x² - 3x + 2 = 0 is:', options: ['2', '3', '-3', '6'], correctAnswer: 0, explanation: 'Product = c/a = 2', difficulty: 3 },
  { id: 'mt-16', question: 'Solve: 3x² - 12 = 0', options: ['x = ±2', 'x = ±4', 'x = 4', 'x = 2'], correctAnswer: 0, explanation: '3x² = 12, x² = 4, x = ±2', difficulty: 2 },
  { id: 'mt-17', question: 'Which is a quadratic equation?', options: ['x² + 2x - 1 = 0', 'x³ + 1 = 0', '2x + 3 = 0', '1/x + 2 = 0'], correctAnswer: 0, explanation: 'Quadratic has highest power 2', difficulty: 1 },
  { id: 'mt-18', question: 'Solve: x(x - 5) = 0', options: ['x = 0, x = 5', 'x = 5', 'x = 0', 'x = -5'], correctAnswer: 0, explanation: 'Zero product: x = 0 or x - 5 = 0', difficulty: 1 }
];

const quadraticsFullTestQuestions: FullTestQuestion[] = [
  { id: 'ft-1', question: 'Solve: x² - 1 = 0', options: ['x = 1, x = -1', 'x = 1', 'x = -1', 'x = 0'], correctAnswer: 0, explanation: '(x-1)(x+1) = 0', topic: 'Factoring' },
  { id: 'ft-2', question: 'What are a, b, c in 5x² - 3x + 7 = 0?', options: ['5, -3, 7', '5, 3, 7', '-3, 5, 7', '5, 7, -3'], correctAnswer: 0, explanation: 'a=5, b=-3, c=7', topic: 'Standard Form' },
  { id: 'ft-3', question: 'Calculate D for 2x² + 4x + 2 = 0', options: ['0', '8', '-8', '16'], correctAnswer: 0, explanation: 'D = 16 - 16 = 0', topic: 'Discriminant' },
  { id: 'ft-4', question: 'Solve: x² + 2x - 3 = 0', options: ['x = 1, x = -3', 'x = -1, x = 3', 'x = 3, x = -1', 'x = -3, x = 1'], correctAnswer: 0, explanation: '(x+3)(x-1) = 0', topic: 'Factoring' },
  { id: 'ft-5', question: 'Using the formula, solve x² - 4x + 3 = 0', options: ['x = 1, x = 3', 'x = 2, x = 2', 'x = -1, x = -3', 'x = 4, x = 0'], correctAnswer: 0, explanation: 'x = (4 ± 2)/2 = 3 or 1', topic: 'Quadratic Formula' },
  { id: 'ft-6', question: 'Solve: x² - 25 = 0', options: ['x = ±5', 'x = 5', 'x = -5', 'x = 25'], correctAnswer: 0, explanation: 'Difference of squares', topic: 'Special Cases' },
  { id: 'ft-7', question: 'How many solutions: x² - 2x + 1 = 0?', options: ['1', '2', '0', '3'], correctAnswer: 0, explanation: 'D = 0, one repeated root', topic: 'Discriminant' },
  { id: 'ft-8', question: 'Solve: 3x² - 6x = 0', options: ['x = 0, x = 2', 'x = 2', 'x = 3', 'x = 0, x = 3'], correctAnswer: 0, explanation: '3x(x - 2) = 0', topic: 'Factoring' },
  { id: 'ft-9', question: 'Complete: x² + 8x + ___ = (x + 4)²', options: ['16', '8', '64', '4'], correctAnswer: 0, explanation: '(8/2)² = 16', topic: 'Completing Square' },
  { id: 'ft-10', question: 'Solve: x² + x - 12 = 0', options: ['x = 3, x = -4', 'x = -3, x = 4', 'x = 12, x = -1', 'x = 6, x = -2'], correctAnswer: 0, explanation: '(x-3)(x+4) = 0', topic: 'Factoring' },
  { id: 'ft-11', question: 'Calculate D for x² + 5x + 7 = 0', options: ['-3', '25', '3', '-25'], correctAnswer: 0, explanation: 'D = 25 - 28 = -3', topic: 'Discriminant' },
  { id: 'ft-12', question: 'Solve: (x + 1)² = 9', options: ['x = 2, x = -4', 'x = 3', 'x = -3', 'x = 8'], correctAnswer: 0, explanation: 'x + 1 = ±3', topic: 'Square Root Method' },
  { id: 'ft-13', question: 'Sum of roots of x² - 5x + 6 = 0?', options: ['5', '6', '-5', '11'], correctAnswer: 0, explanation: 'Sum = -b/a = 5', topic: 'Vieta\'s Formulas' },
  { id: 'ft-14', question: 'Solve: 4x² - 9 = 0', options: ['x = ±3/2', 'x = ±2/3', 'x = 9/4', 'x = ±3'], correctAnswer: 0, explanation: 'x² = 9/4, x = ±3/2', topic: 'Special Cases' },
  { id: 'ft-15', question: 'Product of roots of x² + 2x - 8 = 0?', options: ['-8', '2', '8', '-2'], correctAnswer: 0, explanation: 'Product = c/a = -8', topic: 'Vieta\'s Formulas' },
  { id: 'ft-16', question: 'Solve: x² - 10x + 25 = 0', options: ['x = 5', 'x = -5', 'x = ±5', 'x = 25'], correctAnswer: 0, explanation: '(x-5)² = 0, double root', topic: 'Perfect Square' },
  { id: 'ft-17', question: 'For 6x² + x - 2 = 0, find D', options: ['49', '1', '47', '-47'], correctAnswer: 0, explanation: 'D = 1 + 48 = 49', topic: 'Discriminant' },
  { id: 'ft-18', question: 'Solve: x² - 3x = 10', options: ['x = 5, x = -2', 'x = 5', 'x = -2', 'x = 10'], correctAnswer: 0, explanation: 'x² - 3x - 10 = 0, (x-5)(x+2) = 0', topic: 'Standard Form' },
  { id: 'ft-19', question: 'Which has no real solutions?', options: ['x² + 4 = 0', 'x² - 4 = 0', 'x² + 4x = 0', 'x² - 4x + 4 = 0'], correctAnswer: 0, explanation: 'x² = -4 has no real solutions', topic: 'Discriminant' },
  { id: 'ft-20', question: 'Solve: 2x² + 7x + 3 = 0', options: ['x = -1/2, x = -3', 'x = 1/2, x = 3', 'x = -1, x = -3/2', 'x = 1, x = 3'], correctAnswer: 0, explanation: '(2x+1)(x+3) = 0', topic: 'Factoring' },
  { id: 'ft-21', question: 'Vertex x-coordinate of y = x² - 6x + 5?', options: ['3', '-3', '6', '5'], correctAnswer: 0, explanation: 'x = -b/2a = 6/2 = 3', topic: 'Graphing' },
  { id: 'ft-22', question: 'Solve: (2x - 1)(x + 3) = 0', options: ['x = 1/2, x = -3', 'x = 2, x = -3', 'x = -1/2, x = 3', 'x = 1, x = 3'], correctAnswer: 0, explanation: '2x - 1 = 0 or x + 3 = 0', topic: 'Factored Form' },
  { id: 'ft-23', question: 'If roots are 2 and 5, the equation is:', options: ['x² - 7x + 10 = 0', 'x² + 7x + 10 = 0', 'x² - 3x + 10 = 0', 'x² + 3x - 10 = 0'], correctAnswer: 0, explanation: 'Sum = 7, Product = 10', topic: 'Vieta\'s Formulas' },
  { id: 'ft-24', question: 'Solve: x² = 5x', options: ['x = 0, x = 5', 'x = 5', 'x = √5', 'x = 0'], correctAnswer: 0, explanation: 'x² - 5x = 0, x(x-5) = 0', topic: 'Factoring' },
  { id: 'ft-25', question: 'The equation x² - 4x + k = 0 has one solution when k =', options: ['4', '0', '2', '-4'], correctAnswer: 0, explanation: 'D = 16 - 4k = 0, k = 4', topic: 'Discriminant' }
];

const quadraticsDynamicContents: DynamicLessonContent[] = [
  {
    learningStyle: 'visual',
    title: 'Quadratics: See the Parabola',
    approach: 'Parabola graphs showing roots visually',
    introduction: 'Welcome to the visual world of quadratics! We\'ll use parabolas, colors, and graphs to make solving equations intuitive.',
    mainContent: [
      '🔵 **The Parabola Shape:** Every quadratic y = ax² + bx + c graphs as a U-shape (or upside-down U if a < 0). The solutions are where it crosses the x-axis!',
      '🟢 **Two Solutions Visual:** When the parabola crosses the x-axis at two points, you have two solutions. The discriminant D > 0 means two crossing points.',
      '🟡 **One Solution Visual:** When the parabola just touches the x-axis at one point (vertex on x-axis), D = 0 and you have one repeated solution.',
      '🔴 **No Solutions Visual:** When the parabola floats above (or below) the x-axis without touching it, D < 0 and there are no real solutions.',
      '⬜ **The Vertex:** The turning point is at x = -b/(2a). This is the highest or lowest point of the parabola!'
    ],
    examples: [
      'For x² - 4 = 0: Draw y = x² - 4. It crosses x-axis at x = -2 and x = 2. Solutions: x = ±2!',
      'For x² - 2x + 1 = 0: Draw y = x² - 2x + 1. Vertex touches x-axis at x = 1. One solution!',
      'For x² + 1 = 0: Draw y = x² + 1. Parabola is entirely above x-axis. No real solutions!'
    ],
    practicePrompts: [
      'Sketch y = x² - 5x + 6 and identify where it crosses the x-axis',
      'Draw a parabola with exactly one x-intercept',
      'Graph y = x² + 2 and explain why there are no real roots'
    ],
    summary: 'Quadratic solutions are where the parabola meets the x-axis. See the graph, see the solutions!',
    tips: ['Always sketch the parabola first', 'Check if it opens up or down (sign of a)', 'Vertex helps predict solution count']
  },
  {
    learningStyle: 'auditory',
    title: 'Quadratics: The Formula Song',
    approach: 'Formula sung/chanted, verbal walkthroughs',
    introduction: 'Let\'s make the quadratic formula unforgettable through rhythm and repetition!',
    mainContent: [
      '🎵 **The Formula Song:** "X equals negative b, plus or minus the square root, of b squared minus 4 a c, all over 2 a!"',
      '🗣️ **Standard Form Chant:** "A X squared, B X, C equals zero - that\'s the form we need, let\'s go!"',
      '📢 **Discriminant Rhyme:** "B squared minus 4 A C tells the tale: Positive means two, zero means one, negative means no real ones!"',
      '🎤 **Factoring Pattern:** "Find two numbers, here\'s the clue: multiply to C, add to B - that\'s what you do!"',
      '🔊 **Sign Check Reminder:** "Negative B means flip the sign, double-check your work - answers will be fine!"'
    ],
    examples: [
      'Chant through x² - 5x + 6 = 0: "Multiply to 6, add to negative 5... that\'s -2 and -3! (x-2)(x-3) = 0!"',
      'Sing the formula for 2x² + 3x - 2 = 0: "Negative 3, plus or minus root of 9 plus 16, all over 4!"',
      'Recite: "D equals 9 minus 4 times 2 times negative 2, equals 9 plus 16, equals 25! Two solutions!"'
    ],
    practicePrompts: [
      'Sing the quadratic formula three times',
      'Talk through solving x² - 7x + 12 = 0 step by step',
      'Create a rhyme for completing the square'
    ],
    summary: 'Rhythm helps memory! Sing the formula, chant the steps, and you\'ll never forget.',
    tips: ['Sing the formula daily', 'Talk through every step out loud', 'Create your own memory songs']
  },
  {
    learningStyle: 'text-based',
    title: 'Quadratics: Complete Reference',
    approach: 'Detailed algebraic derivations',
    introduction: 'This comprehensive guide covers all aspects of quadratic equations with formal definitions and systematic procedures.',
    mainContent: [
      '**Definition:** A quadratic equation has the form ax² + bx + c = 0 where a, b, c ∈ ℝ and a ≠ 0.',
      '**Quadratic Formula Derivation:** Starting from ax² + bx + c = 0, divide by a, complete the square, solve for x to obtain x = (-b ± √(b² - 4ac)) / 2a.',
      '**Discriminant Analysis:** D = b² - 4ac. If D > 0, two distinct real roots; D = 0, one repeated root; D < 0, two complex conjugate roots.',
      '**Vieta\'s Formulas:** For roots r₁ and r₂: Sum r₁ + r₂ = -b/a; Product r₁ · r₂ = c/a.',
      '**Solution Methods:** (1) Factoring - find factors of c that sum to b; (2) Quadratic Formula - direct substitution; (3) Completing Square - create perfect square trinomial.',
      '**Vertex Form:** y = a(x - h)² + k where vertex is (h, k) and h = -b/(2a), k = c - b²/(4a).'
    ],
    examples: [
      'Formal solution of x² - 5x + 6 = 0: Factor as (x - 2)(x - 3) = 0. By zero product property, x = 2 or x = 3. Verify: 2² - 5(2) + 6 = 0 ✓',
      'Deriving the formula: x² + (b/a)x + (c/a) = 0 → (x + b/2a)² = b²/(4a²) - c/a → x = (-b ± √D)/(2a)',
      'Using Vieta: If roots are 2 and 3, then equation is x² - (2+3)x + (2·3) = x² - 5x + 6 = 0'
    ],
    practicePrompts: [
      'Derive the completing the square method from scratch',
      'Prove that sum of roots equals -b/a',
      'Write a complete solution with all steps justified'
    ],
    summary: 'Quadratic equations form a complete solvable system. Master the formula, understand the derivation, apply systematically.',
    tips: ['Write complete derivations', 'Verify every solution', 'Understand why formulas work']
  },
  {
    learningStyle: 'problem-solver',
    title: 'Quadratics: Challenge Arena',
    approach: 'Real-world quadratic problems',
    introduction: 'Ready to tackle real quadratic challenges? These problems appear in physics, engineering, and everyday life!',
    mainContent: [
      '💪 **Projectile Motion:** Height h = -16t² + v₀t + h₀. When does object hit ground? Solve h = 0!',
      '🧩 **Area Problems:** A rectangle has perimeter 20m. What dimensions give area 24m²? Set up: x(10-x) = 24.',
      '⚡ **Number Puzzles:** Two numbers differ by 3 and multiply to 40. Set up: x(x+3) = 40.',
      '🎯 **Optimization:** Maximum area with fixed perimeter? Vertex of the parabola gives the answer!',
      '🏆 **Revenue Problems:** If price is p and quantity sold is (100-2p), revenue R = p(100-2p) = -2p² + 100p. Maximize R!'
    ],
    examples: [
      'A ball is thrown up at 48 ft/s from 64 ft high: h = -16t² + 48t + 64. When does it land? -16t² + 48t + 64 = 0 → t = 4 seconds',
      'Find two consecutive integers whose product is 72: n(n+1) = 72 → n² + n - 72 = 0 → n = 8, so integers are 8 and 9',
      'Maximum revenue: R = -2p² + 100p. Max at p = -100/(-4) = 25. Maximum R = $1250!'
    ],
    practicePrompts: [
      'A garden is twice as long as wide, area = 50m². Find dimensions.',
      'Ball thrown upward at 32 ft/s. When is it 12 ft high?',
      'Product of two numbers is 100, sum is 29. Find them.'
    ],
    summary: 'Quadratics solve real problems! Translate words to equations, solve, interpret the answer.',
    tips: ['Draw a diagram for geometry problems', 'Check that answers make sense in context', 'Look for maximum/minimum at the vertex']
  },
  {
    learningStyle: 'adhd-friendly',
    title: 'Quadratics: Quick Solve! ⚡',
    approach: 'Quick method selection games, 2-min challenges',
    introduction: '🎮 Fast, focused, fun! Let\'s crack quadratics in quick bursts!',
    mainContent: [
      '⚡ **FORMULA SHORTCUT:** x = (-b ± √D) / 2a. Memorize it. Use it. WIN! 💥',
      '🎯 **QUICK CHECK:** D = b² - 4ac. Positive = 2 answers. Zero = 1 answer. Negative = 0 real answers. DONE! ✓',
      '🔥 **FACTORING FAST:** x² - 5x + 6? Find numbers that × to 6, + to -5? That\'s -2, -3! Roots: 2 and 3! 🏆',
      '🚀 **SPECIAL CASE:** x² - 16 = 0? That\'s x² = 16. So x = ±4. 3 SECONDS! ⏱️',
      '💎 **x² = number?** Square root both sides, add ±. x² = 25 → x = ±5. INSTANT! ✓'
    ],
    examples: [
      '⚡ SPEED SOLVE: x² - 4 = 0? x² = 4, x = ±2. DONE in 5 seconds! 🎉',
      '🎮 QUICK FACTOR: x² - x - 6 = 0? Multiply -6, add -1... that\'s -3 and 2! x = 3 or -2! 🏆',
      '💪 FORMULA SPRINT: x² + 2x - 3 = 0. D = 4 + 12 = 16. x = (-2 ± 4)/2 = 1 or -3. WIN! 🔥'
    ],
    practicePrompts: [
      '⏱️ 30 seconds: Solve x² = 49',
      '🎯 1 minute: Factor x² - 7x + 10 = 0',
      '💥 Quick! Is D positive, zero, or negative for x² + 2x + 5 = 0?'
    ],
    summary: '🏆 QUADRATICS CONQUERED! Formula in your head, discriminant check, factor when easy. YOU\'RE A MATH CHAMPION! 🎮',
    tips: ['Set 2-min timers ⏰', 'Celebrate each solved problem 🎉', 'Take breaks between problem sets! 🏃']
  }
];

// ==================== EXPORT ALL DATA ====================
export const mathTopics: MathTopic[] = [
  {
    id: 'fractions',
    title: 'Fractions',
    titleRu: 'Дроби',
    titleKg: 'Бөлчөктөр',
    description: 'Learn to work with fractions: addition, subtraction, multiplication, and division',
    basicLesson: fractionsBasicLesson,
    miniLessons: fractionsMiniLessons,
    diagrams: fractionsDiagrams,
    commonMistakes: fractionsCommonMistakes,
    miniTestQuestions: fractionsMiniTestQuestions,
    fullTestQuestions: fractionsFullTestQuestions,
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Heavy use of diagrams, pie charts, and color-coded fraction bars', contentFormat: 'Infographics and animated visualizations', pacing: 'Medium pace with visual breaks', visualAids: 'Fraction circles, number lines, area models' },
      { learningStyle: 'auditory', approach: 'Audio explanations with verbal step-by-step walkthroughs', contentFormat: 'Podcast-style lessons with verbal examples', pacing: 'Slower pace with repetition', visualAids: 'Minimal, focus on spoken content' },
      { learningStyle: 'text-based', approach: 'Detailed written explanations with formulas', contentFormat: 'Structured text with bullet points and definitions', pacing: 'Self-paced reading', visualAids: 'Text-based examples and written solutions' },
      { learningStyle: 'problem-solver', approach: 'Practice-first methodology with immediate application', contentFormat: 'Problem sets with hints and solutions', pacing: 'Fast with many practice problems', visualAids: 'Solution walkthroughs' },
      { learningStyle: 'adhd-friendly', approach: 'Short bursts, gamified elements, frequent rewards', contentFormat: 'Bite-sized chunks with interactive elements', pacing: 'Very short segments (1-2 min each)', visualAids: 'Colorful, engaging, minimal text' }
    ],
    dynamicLessonContents: fractionsDynamicContents
  },
  {
    id: 'exponents',
    title: 'Exponents',
    titleRu: 'Степени',
    titleKg: 'Даражалар',
    description: 'Master the laws of exponents and their applications',
    basicLesson: exponentsBasicLesson,
    miniLessons: exponentsMiniLessons,
    diagrams: exponentsDiagrams,
    commonMistakes: exponentsCommonMistakes,
    miniTestQuestions: exponentsMiniTestQuestions,
    fullTestQuestions: exponentsFullTestQuestions,
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Color-coded exponent rules, animated multiplication sequences', contentFormat: 'Visual step-by-step breakdowns', pacing: 'Medium with visual pauses', visualAids: 'Exponent trees, multiplication diagrams' },
      { learningStyle: 'auditory', approach: 'Verbal patterns and rhymes for rules', contentFormat: 'Audio explanations with mnemonics', pacing: 'Repetitive for memorization', visualAids: 'Minimal' },
      { learningStyle: 'text-based', approach: 'Formal definitions and proofs', contentFormat: 'Mathematical notation with explanations', pacing: 'Self-paced reading', visualAids: 'Formula sheets' },
      { learningStyle: 'problem-solver', approach: 'Challenge problems first, rules derived from patterns', contentFormat: 'Problem sets with increasing difficulty', pacing: 'Fast-paced challenges', visualAids: 'Solution patterns' },
      { learningStyle: 'adhd-friendly', approach: 'Gamified exponent battles, quick wins', contentFormat: 'Interactive games, 2-min challenges', pacing: 'Very short with rewards', visualAids: 'Colorful, animated' }
    ],
    dynamicLessonContents: exponentsDynamicContents
  },
  {
    id: 'quadratic-equations',
    title: 'Quadratic Equations',
    titleRu: 'Квадратные уравнения',
    titleKg: 'Квадраттык теңдемелер',
    description: 'Solve quadratic equations using multiple methods',
    basicLesson: quadraticsBasicLesson,
    miniLessons: quadraticsMiniLessons,
    diagrams: quadraticsDiagrams,
    commonMistakes: quadraticsCommonMistakes,
    miniTestQuestions: quadraticsMiniTestQuestions,
    fullTestQuestions: quadraticsFullTestQuestions,
    dynamicLessonTemplates: [
      { learningStyle: 'visual', approach: 'Parabola graphs showing roots visually', contentFormat: 'Interactive graphing with colored regions', pacing: 'Medium with graph exploration', visualAids: 'Coordinate planes, parabola animations' },
      { learningStyle: 'auditory', approach: 'Formula sung/chanted, verbal walkthroughs', contentFormat: 'Audio lessons with formula memorization', pacing: 'Slower with repetition', visualAids: 'Minimal, voice-focused' },
      { learningStyle: 'text-based', approach: 'Detailed algebraic derivations', contentFormat: 'Step-by-step written proofs', pacing: 'Self-paced reading', visualAids: 'Written equations and solutions' },
      { learningStyle: 'problem-solver', approach: 'Real-world quadratic problems', contentFormat: 'Application problems (projectiles, areas)', pacing: 'Challenge-based progression', visualAids: 'Problem scenarios' },
      { learningStyle: 'adhd-friendly', approach: 'Quick method selection games', contentFormat: '2-min solving challenges', pacing: 'Very short with instant feedback', visualAids: 'Colorful, gamified interface' }
    ],
    dynamicLessonContents: quadraticsDynamicContents
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
