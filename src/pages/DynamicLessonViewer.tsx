import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLessonData, useStorageImage, LessonData } from '@/hooks/useLessonData';
import { 
  BookOpen, 
  PlayCircle, 
  LayoutGrid, 
  AlertTriangle, 
  Brain, 
  FileText, 
  Sparkles,
  Globe,
  ArrowLeft,
  Clock,
  Lightbulb,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  Ear,
  Puzzle,
  Zap,
  ImageIcon,
  StickyNote,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language } from '@/lib/i18n';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Import exponent images
import exponentRulesCheatsheet from '@/assets/lessons/exponent-rules-cheatsheet.png';
import exponentSimplificationFlowchart from '@/assets/lessons/exponent-simplification-flowchart.png';
import exponentNegativeZeroDiagram from '@/assets/lessons/exponent-negative-zero-diagram.png';

// Import fraction images
import fractionOperationsCheatsheet from '@/assets/lessons/fraction-operations-cheatsheet.png';
import fractionConversionFlowchart from '@/assets/lessons/fraction-conversion-flowchart.png';
import fractionDivisionSteps from '@/assets/lessons/fraction-division-steps.png';

// Static image maps per topic
const topicImages: Record<string, Record<string, string>> = {
  fractions: {
    'diag-1': fractionOperationsCheatsheet,
    'diag-2': fractionConversionFlowchart,
    'diag-3': fractionDivisionSteps,
  },
  exponents: {
    'diag-1': exponentRulesCheatsheet,
    'diag-2': exponentSimplificationFlowchart,
    'diag-3': exponentNegativeZeroDiagram,
  },
};

// Video URL overrides per topic (overrides JSON values)
const topicVideos: Record<string, string> = {
  fractions: 'https://youtu.be/UJbYTA-1rYc',
  exponents: 'https://youtu.be/4-j-tKt6gIo',
};

// Fallback mini test questions for fractions
const fractionsMiniTests = [
  {
    id: 'frac-mt-1',
    difficulty: 'easy',
    question: { en: 'What is 1/2 + 1/4?', ru: 'Чему равно 1/2 + 1/4?', kg: '1/2 + 1/4 канча?' },
    options: {
      A: { en: '3/4', ru: '3/4', kg: '3/4' },
      B: { en: '2/6', ru: '2/6', kg: '2/6' },
      C: { en: '1/6', ru: '1/6', kg: '1/6' },
      D: { en: '2/4', ru: '2/4', kg: '2/4' }
    },
    correct: 'A',
    explanation: { en: '1/2 = 2/4, so 2/4 + 1/4 = 3/4', ru: '1/2 = 2/4, поэтому 2/4 + 1/4 = 3/4', kg: '1/2 = 2/4, ошондуктан 2/4 + 1/4 = 3/4' }
  },
  {
    id: 'frac-mt-2',
    difficulty: 'easy',
    question: { en: 'Simplify 4/8', ru: 'Сократите дробь 4/8', kg: '4/8 кыскартыңыз' },
    options: {
      A: { en: '2/4', ru: '2/4', kg: '2/4' },
      B: { en: '1/2', ru: '1/2', kg: '1/2' },
      C: { en: '1/4', ru: '1/4', kg: '1/4' },
      D: { en: '4/4', ru: '4/4', kg: '4/4' }
    },
    correct: 'B',
    explanation: { en: '4/8 ÷ 4/4 = 1/2', ru: '4/8 ÷ 4/4 = 1/2', kg: '4/8 ÷ 4/4 = 1/2' }
  },
  {
    id: 'frac-mt-3',
    difficulty: 'easy',
    question: { en: 'What is 3/5 × 2?', ru: 'Чему равно 3/5 × 2?', kg: '3/5 × 2 канча?' },
    options: {
      A: { en: '5/5', ru: '5/5', kg: '5/5' },
      B: { en: '3/10', ru: '3/10', kg: '3/10' },
      C: { en: '6/5', ru: '6/5', kg: '6/5' },
      D: { en: '6/10', ru: '6/10', kg: '6/10' }
    },
    correct: 'C',
    explanation: { en: '3/5 × 2 = 6/5 = 1 1/5', ru: '3/5 × 2 = 6/5 = 1 1/5', kg: '3/5 × 2 = 6/5 = 1 1/5' }
  },
  {
    id: 'frac-mt-4',
    difficulty: 'medium',
    question: { en: 'What is 2/3 ÷ 1/2?', ru: 'Чему равно 2/3 ÷ 1/2?', kg: '2/3 ÷ 1/2 канча?' },
    options: {
      A: { en: '1/3', ru: '1/3', kg: '1/3' },
      B: { en: '4/3', ru: '4/3', kg: '4/3' },
      C: { en: '2/6', ru: '2/6', kg: '2/6' },
      D: { en: '3/4', ru: '3/4', kg: '3/4' }
    },
    correct: 'B',
    explanation: { en: '2/3 ÷ 1/2 = 2/3 × 2/1 = 4/3', ru: '2/3 ÷ 1/2 = 2/3 × 2/1 = 4/3', kg: '2/3 ÷ 1/2 = 2/3 × 2/1 = 4/3' }
  },
  {
    id: 'frac-mt-5',
    difficulty: 'medium',
    question: { en: 'What is 3/4 - 1/3?', ru: 'Чему равно 3/4 - 1/3?', kg: '3/4 - 1/3 канча?' },
    options: {
      A: { en: '2/1', ru: '2/1', kg: '2/1' },
      B: { en: '5/12', ru: '5/12', kg: '5/12' },
      C: { en: '2/7', ru: '2/7', kg: '2/7' },
      D: { en: '1/12', ru: '1/12', kg: '1/12' }
    },
    correct: 'B',
    explanation: { en: '3/4 = 9/12, 1/3 = 4/12, so 9/12 - 4/12 = 5/12', ru: '3/4 = 9/12, 1/3 = 4/12, поэтому 9/12 - 4/12 = 5/12', kg: '3/4 = 9/12, 1/3 = 4/12, ошондуктан 9/12 - 4/12 = 5/12' }
  },
  {
    id: 'frac-mt-6',
    difficulty: 'medium',
    question: { en: 'Convert 7/4 to a mixed number', ru: 'Преобразуйте 7/4 в смешанное число', kg: '7/4 аралаш санга айландырыңыз' },
    options: {
      A: { en: '1 3/4', ru: '1 3/4', kg: '1 3/4' },
      B: { en: '2 1/4', ru: '2 1/4', kg: '2 1/4' },
      C: { en: '1 1/2', ru: '1 1/2', kg: '1 1/2' },
      D: { en: '3 1/4', ru: '3 1/4', kg: '3 1/4' }
    },
    correct: 'A',
    explanation: { en: '7 ÷ 4 = 1 remainder 3, so 7/4 = 1 3/4', ru: '7 ÷ 4 = 1 остаток 3, поэтому 7/4 = 1 3/4', kg: '7 ÷ 4 = 1 калдык 3, ошондуктан 7/4 = 1 3/4' }
  },
  {
    id: 'frac-mt-7',
    difficulty: 'hard',
    question: { en: 'What is (2/3 + 1/4) × 6?', ru: 'Чему равно (2/3 + 1/4) × 6?', kg: '(2/3 + 1/4) × 6 канча?' },
    options: {
      A: { en: '5 1/2', ru: '5 1/2', kg: '5 1/2' },
      B: { en: '11/2', ru: '11/2', kg: '11/2' },
      C: { en: '6', ru: '6', kg: '6' },
      D: { en: '4', ru: '4', kg: '4' }
    },
    correct: 'B',
    explanation: { en: '2/3 + 1/4 = 8/12 + 3/12 = 11/12. Then 11/12 × 6 = 66/12 = 11/2', ru: '2/3 + 1/4 = 8/12 + 3/12 = 11/12. Затем 11/12 × 6 = 66/12 = 11/2', kg: '2/3 + 1/4 = 8/12 + 3/12 = 11/12. Анан 11/12 × 6 = 66/12 = 11/2' }
  },
  {
    id: 'frac-mt-8',
    difficulty: 'hard',
    question: { en: 'Simplify: (5/6 - 1/3) ÷ 1/2', ru: 'Упростите: (5/6 - 1/3) ÷ 1/2', kg: 'Жөнөкөйлөтүңүз: (5/6 - 1/3) ÷ 1/2' },
    options: {
      A: { en: '1', ru: '1', kg: '1' },
      B: { en: '1/4', ru: '1/4', kg: '1/4' },
      C: { en: '1/2', ru: '1/2', kg: '1/2' },
      D: { en: '2', ru: '2', kg: '2' }
    },
    correct: 'A',
    explanation: { en: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2. Then 1/2 ÷ 1/2 = 1', ru: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2. Затем 1/2 ÷ 1/2 = 1', kg: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2. Анан 1/2 ÷ 1/2 = 1' }
  },
  {
    id: 'frac-mt-9',
    difficulty: 'hard',
    question: { en: 'If 3/x = 1/4, what is x?', ru: 'Если 3/x = 1/4, чему равен x?', kg: 'Эгер 3/x = 1/4 болсо, x канча?' },
    options: {
      A: { en: '12', ru: '12', kg: '12' },
      B: { en: '3/4', ru: '3/4', kg: '3/4' },
      C: { en: '4/3', ru: '4/3', kg: '4/3' },
      D: { en: '7', ru: '7', kg: '7' }
    },
    correct: 'A',
    explanation: { en: '3/x = 1/4 → x = 3 × 4 = 12', ru: '3/x = 1/4 → x = 3 × 4 = 12', kg: '3/x = 1/4 → x = 3 × 4 = 12' }
  }
];

// Fallback full test questions for fractions (20 questions)
const fractionsFullTest = [
  {
    id: 'ft-1',
    question: { en: 'What is 1/2 + 1/3?', ru: 'Чему равно 1/2 + 1/3?', kg: '1/2 + 1/3 канча?' },
    options: {
      A: { en: '2/5', ru: '2/5', kg: '2/5' },
      B: { en: '5/6', ru: '5/6', kg: '5/6' },
      C: { en: '2/6', ru: '2/6', kg: '2/6' },
      D: { en: '1/5', ru: '1/5', kg: '1/5' }
    },
    correct: 'B',
    explanation: { en: '1/2 = 3/6, 1/3 = 2/6, so 3/6 + 2/6 = 5/6', ru: '1/2 = 3/6, 1/3 = 2/6, поэтому 3/6 + 2/6 = 5/6', kg: '1/2 = 3/6, 1/3 = 2/6, ошондуктан 3/6 + 2/6 = 5/6' }
  },
  {
    id: 'ft-2',
    question: { en: 'Which fraction is equivalent to 4/6?', ru: 'Какая дробь равна 4/6?', kg: 'Кайсы бөлчөк 4/6 барабар?' },
    options: {
      A: { en: '2/3', ru: '2/3', kg: '2/3' },
      B: { en: '3/4', ru: '3/4', kg: '3/4' },
      C: { en: '1/2', ru: '1/2', kg: '1/2' },
      D: { en: '4/8', ru: '4/8', kg: '4/8' }
    },
    correct: 'A',
    explanation: { en: '4/6 ÷ 2/2 = 2/3', ru: '4/6 ÷ 2/2 = 2/3', kg: '4/6 ÷ 2/2 = 2/3' }
  },
  {
    id: 'ft-3',
    question: { en: 'What is 3/4 × 2/5?', ru: 'Чему равно 3/4 × 2/5?', kg: '3/4 × 2/5 канча?' },
    options: {
      A: { en: '6/20', ru: '6/20', kg: '6/20' },
      B: { en: '5/9', ru: '5/9', kg: '5/9' },
      C: { en: '3/10', ru: '3/10', kg: '3/10' },
      D: { en: '6/9', ru: '6/9', kg: '6/9' }
    },
    correct: 'C',
    explanation: { en: '3/4 × 2/5 = 6/20 = 3/10', ru: '3/4 × 2/5 = 6/20 = 3/10', kg: '3/4 × 2/5 = 6/20 = 3/10' }
  },
  {
    id: 'ft-4',
    question: { en: 'What is 5/6 - 1/2?', ru: 'Чему равно 5/6 - 1/2?', kg: '5/6 - 1/2 канча?' },
    options: {
      A: { en: '4/4', ru: '4/4', kg: '4/4' },
      B: { en: '1/3', ru: '1/3', kg: '1/3' },
      C: { en: '2/6', ru: '2/6', kg: '2/6' },
      D: { en: '4/6', ru: '4/6', kg: '4/6' }
    },
    correct: 'B',
    explanation: { en: '5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3', ru: '5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3', kg: '5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3' }
  },
  {
    id: 'ft-5',
    question: { en: 'What is 3/5 ÷ 1/2?', ru: 'Чему равно 3/5 ÷ 1/2?', kg: '3/5 ÷ 1/2 канча?' },
    options: {
      A: { en: '3/10', ru: '3/10', kg: '3/10' },
      B: { en: '6/5', ru: '6/5', kg: '6/5' },
      C: { en: '5/6', ru: '5/6', kg: '5/6' },
      D: { en: '1/5', ru: '1/5', kg: '1/5' }
    },
    correct: 'B',
    explanation: { en: '3/5 ÷ 1/2 = 3/5 × 2/1 = 6/5', ru: '3/5 ÷ 1/2 = 3/5 × 2/1 = 6/5', kg: '3/5 ÷ 1/2 = 3/5 × 2/1 = 6/5' }
  },
  {
    id: 'ft-6',
    question: { en: 'Simplify 12/18', ru: 'Сократите 12/18', kg: '12/18 кыскартыңыз' },
    options: {
      A: { en: '6/9', ru: '6/9', kg: '6/9' },
      B: { en: '4/6', ru: '4/6', kg: '4/6' },
      C: { en: '2/3', ru: '2/3', kg: '2/3' },
      D: { en: '3/4', ru: '3/4', kg: '3/4' }
    },
    correct: 'C',
    explanation: { en: '12/18 ÷ 6/6 = 2/3', ru: '12/18 ÷ 6/6 = 2/3', kg: '12/18 ÷ 6/6 = 2/3' }
  },
  {
    id: 'ft-7',
    question: { en: 'Convert 11/4 to a mixed number', ru: 'Преобразуйте 11/4 в смешанное число', kg: '11/4 аралаш санга айландырыңыз' },
    options: {
      A: { en: '2 3/4', ru: '2 3/4', kg: '2 3/4' },
      B: { en: '2 1/4', ru: '2 1/4', kg: '2 1/4' },
      C: { en: '3 1/4', ru: '3 1/4', kg: '3 1/4' },
      D: { en: '1 3/4', ru: '1 3/4', kg: '1 3/4' }
    },
    correct: 'A',
    explanation: { en: '11 ÷ 4 = 2 remainder 3, so 11/4 = 2 3/4', ru: '11 ÷ 4 = 2 остаток 3, поэтому 11/4 = 2 3/4', kg: '11 ÷ 4 = 2 калдык 3, ошондуктан 11/4 = 2 3/4' }
  },
  {
    id: 'ft-8',
    question: { en: 'What is 2 1/2 + 1 3/4?', ru: 'Чему равно 2 1/2 + 1 3/4?', kg: '2 1/2 + 1 3/4 канча?' },
    options: {
      A: { en: '3 5/4', ru: '3 5/4', kg: '3 5/4' },
      B: { en: '4 1/4', ru: '4 1/4', kg: '4 1/4' },
      C: { en: '3 1/4', ru: '3 1/4', kg: '3 1/4' },
      D: { en: '4 3/4', ru: '4 3/4', kg: '4 3/4' }
    },
    correct: 'B',
    explanation: { en: '2 1/2 = 5/2 = 10/4, 1 3/4 = 7/4, so 10/4 + 7/4 = 17/4 = 4 1/4', ru: '2 1/2 = 5/2 = 10/4, 1 3/4 = 7/4, поэтому 10/4 + 7/4 = 17/4 = 4 1/4', kg: '2 1/2 = 5/2 = 10/4, 1 3/4 = 7/4, ошондуктан 10/4 + 7/4 = 17/4 = 4 1/4' }
  },
  {
    id: 'ft-9',
    question: { en: 'Which fraction is greater: 3/5 or 2/3?', ru: 'Какая дробь больше: 3/5 или 2/3?', kg: 'Кайсы бөлчөк чоңураак: 3/5 же 2/3?' },
    options: {
      A: { en: '3/5', ru: '3/5', kg: '3/5' },
      B: { en: '2/3', ru: '2/3', kg: '2/3' },
      C: { en: 'They are equal', ru: 'Они равны', kg: 'Алар барабар' },
      D: { en: 'Cannot determine', ru: 'Нельзя определить', kg: 'Аныктоого мүмкүн эмес' }
    },
    correct: 'B',
    explanation: { en: '3/5 = 9/15, 2/3 = 10/15. 10/15 > 9/15, so 2/3 > 3/5', ru: '3/5 = 9/15, 2/3 = 10/15. 10/15 > 9/15, поэтому 2/3 > 3/5', kg: '3/5 = 9/15, 2/3 = 10/15. 10/15 > 9/15, ошондуктан 2/3 > 3/5' }
  },
  {
    id: 'ft-10',
    question: { en: 'What is 7/8 × 4/7?', ru: 'Чему равно 7/8 × 4/7?', kg: '7/8 × 4/7 канча?' },
    options: {
      A: { en: '1/2', ru: '1/2', kg: '1/2' },
      B: { en: '28/56', ru: '28/56', kg: '28/56' },
      C: { en: '4/8', ru: '4/8', kg: '4/8' },
      D: { en: '11/15', ru: '11/15', kg: '11/15' }
    },
    correct: 'A',
    explanation: { en: '7/8 × 4/7 = 28/56 = 1/2 (or cancel 7s: 4/8 = 1/2)', ru: '7/8 × 4/7 = 28/56 = 1/2 (или сокращаем 7: 4/8 = 1/2)', kg: '7/8 × 4/7 = 28/56 = 1/2 (же 7 кыскартылат: 4/8 = 1/2)' }
  },
  {
    id: 'ft-11',
    question: { en: 'Convert 3 2/5 to an improper fraction', ru: 'Преобразуйте 3 2/5 в неправильную дробь', kg: '3 2/5 туура эмес бөлчөккө айландырыңыз' },
    options: {
      A: { en: '15/5', ru: '15/5', kg: '15/5' },
      B: { en: '17/5', ru: '17/5', kg: '17/5' },
      C: { en: '13/5', ru: '13/5', kg: '13/5' },
      D: { en: '11/5', ru: '11/5', kg: '11/5' }
    },
    correct: 'B',
    explanation: { en: '3 2/5 = (3 × 5 + 2)/5 = 17/5', ru: '3 2/5 = (3 × 5 + 2)/5 = 17/5', kg: '3 2/5 = (3 × 5 + 2)/5 = 17/5' }
  },
  {
    id: 'ft-12',
    question: { en: 'What is 5/8 - 3/8?', ru: 'Чему равно 5/8 - 3/8?', kg: '5/8 - 3/8 канча?' },
    options: {
      A: { en: '2/8', ru: '2/8', kg: '2/8' },
      B: { en: '1/4', ru: '1/4', kg: '1/4' },
      C: { en: '1/8', ru: '1/8', kg: '1/8' },
      D: { en: '2/16', ru: '2/16', kg: '2/16' }
    },
    correct: 'B',
    explanation: { en: '5/8 - 3/8 = 2/8 = 1/4', ru: '5/8 - 3/8 = 2/8 = 1/4', kg: '5/8 - 3/8 = 2/8 = 1/4' }
  },
  {
    id: 'ft-13',
    question: { en: 'What is 2/3 ÷ 4/5?', ru: 'Чему равно 2/3 ÷ 4/5?', kg: '2/3 ÷ 4/5 канча?' },
    options: {
      A: { en: '8/15', ru: '8/15', kg: '8/15' },
      B: { en: '10/12', ru: '10/12', kg: '10/12' },
      C: { en: '5/6', ru: '5/6', kg: '5/6' },
      D: { en: '6/5', ru: '6/5', kg: '6/5' }
    },
    correct: 'C',
    explanation: { en: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6', ru: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6', kg: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6' }
  },
  {
    id: 'ft-14',
    question: { en: 'If 1/4 of a number is 12, what is the number?', ru: 'Если 1/4 числа равна 12, чему равно число?', kg: 'Эгерде сандын 1/4 12ге барабар болсо, ал сан канча?' },
    options: {
      A: { en: '3', ru: '3', kg: '3' },
      B: { en: '48', ru: '48', kg: '48' },
      C: { en: '16', ru: '16', kg: '16' },
      D: { en: '36', ru: '36', kg: '36' }
    },
    correct: 'B',
    explanation: { en: 'If 1/4 × x = 12, then x = 12 × 4 = 48', ru: 'Если 1/4 × x = 12, тогда x = 12 × 4 = 48', kg: 'Эгерде 1/4 × x = 12 болсо, анда x = 12 × 4 = 48' }
  },
  {
    id: 'ft-15',
    question: { en: 'What is 1/6 + 1/4 + 1/3?', ru: 'Чему равно 1/6 + 1/4 + 1/3?', kg: '1/6 + 1/4 + 1/3 канча?' },
    options: {
      A: { en: '3/13', ru: '3/13', kg: '3/13' },
      B: { en: '3/4', ru: '3/4', kg: '3/4' },
      C: { en: '9/12', ru: '9/12', kg: '9/12' },
      D: { en: '1/2', ru: '1/2', kg: '1/2' }
    },
    correct: 'B',
    explanation: { en: 'LCD = 12. 1/6 = 2/12, 1/4 = 3/12, 1/3 = 4/12. Sum = 9/12 = 3/4', ru: 'НОЗ = 12. 1/6 = 2/12, 1/4 = 3/12, 1/3 = 4/12. Сумма = 9/12 = 3/4', kg: 'ЭКБ = 12. 1/6 = 2/12, 1/4 = 3/12, 1/3 = 4/12. Сумма = 9/12 = 3/4' }
  },
  {
    id: 'ft-16',
    question: { en: 'Simplify (2/3)²', ru: 'Упростите (2/3)²', kg: '(2/3)² жөнөкөйлөтүңүз' },
    options: {
      A: { en: '4/6', ru: '4/6', kg: '4/6' },
      B: { en: '4/9', ru: '4/9', kg: '4/9' },
      C: { en: '2/6', ru: '2/6', kg: '2/6' },
      D: { en: '6/9', ru: '6/9', kg: '6/9' }
    },
    correct: 'B',
    explanation: { en: '(2/3)² = 2²/3² = 4/9', ru: '(2/3)² = 2²/3² = 4/9', kg: '(2/3)² = 2²/3² = 4/9' }
  },
  {
    id: 'ft-17',
    question: { en: 'What is 5 - 2 3/4?', ru: 'Чему равно 5 - 2 3/4?', kg: '5 - 2 3/4 канча?' },
    options: {
      A: { en: '2 1/4', ru: '2 1/4', kg: '2 1/4' },
      B: { en: '3 1/4', ru: '3 1/4', kg: '3 1/4' },
      C: { en: '2 3/4', ru: '2 3/4', kg: '2 3/4' },
      D: { en: '3 3/4', ru: '3 3/4', kg: '3 3/4' }
    },
    correct: 'A',
    explanation: { en: '5 = 20/4, 2 3/4 = 11/4. 20/4 - 11/4 = 9/4 = 2 1/4', ru: '5 = 20/4, 2 3/4 = 11/4. 20/4 - 11/4 = 9/4 = 2 1/4', kg: '5 = 20/4, 2 3/4 = 11/4. 20/4 - 11/4 = 9/4 = 2 1/4' }
  },
  {
    id: 'ft-18',
    question: { en: 'What is 3/4 of 24?', ru: 'Чему равно 3/4 от 24?', kg: '24дүн 3/4 канча?' },
    options: {
      A: { en: '16', ru: '16', kg: '16' },
      B: { en: '18', ru: '18', kg: '18' },
      C: { en: '20', ru: '20', kg: '20' },
      D: { en: '6', ru: '6', kg: '6' }
    },
    correct: 'B',
    explanation: { en: '3/4 × 24 = 72/4 = 18', ru: '3/4 × 24 = 72/4 = 18', kg: '3/4 × 24 = 72/4 = 18' }
  },
  {
    id: 'ft-19',
    question: { en: 'What is the reciprocal of 5/7?', ru: 'Чему равна обратная дробь от 5/7?', kg: '5/7дин карама-каршы бөлчөгү канча?' },
    options: {
      A: { en: '-5/7', ru: '-5/7', kg: '-5/7' },
      B: { en: '7/5', ru: '7/5', kg: '7/5' },
      C: { en: '1/5', ru: '1/5', kg: '1/5' },
      D: { en: '5/1', ru: '5/1', kg: '5/1' }
    },
    correct: 'B',
    explanation: { en: 'The reciprocal of a/b is b/a. So reciprocal of 5/7 is 7/5', ru: 'Обратная дробь к a/b равна b/a. Поэтому обратная к 5/7 равна 7/5', kg: 'a/b бөлчөгүнүн карама-каршысы b/a. Ошондуктан 5/7дин карама-каршысы 7/5' }
  },
  {
    id: 'ft-20',
    question: { en: 'Solve: x/3 = 4/9', ru: 'Решите: x/3 = 4/9', kg: 'Чечиңиз: x/3 = 4/9' },
    options: {
      A: { en: 'x = 4/3', ru: 'x = 4/3', kg: 'x = 4/3' },
      B: { en: 'x = 12/9', ru: 'x = 12/9', kg: 'x = 12/9' },
      C: { en: 'x = 4/27', ru: 'x = 4/27', kg: 'x = 4/27' },
      D: { en: 'x = 12/27', ru: 'x = 12/27', kg: 'x = 12/27' }
    },
    correct: 'A',
    explanation: { en: 'x/3 = 4/9 → x = 3 × 4/9 = 12/9 = 4/3', ru: 'x/3 = 4/9 → x = 3 × 4/9 = 12/9 = 4/3', kg: 'x/3 = 4/9 → x = 3 × 4/9 = 12/9 = 4/3' }
  }
];

// Fallback mini test questions for exponents (9 questions: 3 easy, 3 medium, 3 hard)
const exponentsMiniTests = [
  {
    id: 'exp-mt-1',
    difficulty: 'easy',
    question: { en: 'What is 2³?', ru: 'Чему равно 2³?', kg: '2³ канча?' },
    options: {
      A: { en: '6', ru: '6', kg: '6' },
      B: { en: '8', ru: '8', kg: '8' },
      C: { en: '9', ru: '9', kg: '9' },
      D: { en: '5', ru: '5', kg: '5' }
    },
    correct: 'B',
    explanation: { en: '2³ = 2 × 2 × 2 = 8', ru: '2³ = 2 × 2 × 2 = 8', kg: '2³ = 2 × 2 × 2 = 8' }
  },
  {
    id: 'exp-mt-2',
    difficulty: 'easy',
    question: { en: 'What is 5⁰?', ru: 'Чему равно 5⁰?', kg: '5⁰ канча?' },
    options: {
      A: { en: '0', ru: '0', kg: '0' },
      B: { en: '5', ru: '5', kg: '5' },
      C: { en: '1', ru: '1', kg: '1' },
      D: { en: 'undefined', ru: 'не определено', kg: 'аныкталбаган' }
    },
    correct: 'C',
    explanation: { en: 'Any number raised to power 0 equals 1 (except 0⁰)', ru: 'Любое число в степени 0 равно 1 (кроме 0⁰)', kg: 'Ар кандай сан 0 даражасына барабар 1 (0⁰ден башка)' }
  },
  {
    id: 'exp-mt-3',
    difficulty: 'easy',
    question: { en: 'What is 10²?', ru: 'Чему равно 10²?', kg: '10² канча?' },
    options: {
      A: { en: '20', ru: '20', kg: '20' },
      B: { en: '100', ru: '100', kg: '100' },
      C: { en: '1000', ru: '1000', kg: '1000' },
      D: { en: '12', ru: '12', kg: '12' }
    },
    correct: 'B',
    explanation: { en: '10² = 10 × 10 = 100', ru: '10² = 10 × 10 = 100', kg: '10² = 10 × 10 = 100' }
  },
  {
    id: 'exp-mt-4',
    difficulty: 'medium',
    question: { en: 'Simplify: 2³ × 2⁴', ru: 'Упростите: 2³ × 2⁴', kg: 'Жөнөкөйлөтүңүз: 2³ × 2⁴' },
    options: {
      A: { en: '2⁷', ru: '2⁷', kg: '2⁷' },
      B: { en: '2¹²', ru: '2¹²', kg: '2¹²' },
      C: { en: '4⁷', ru: '4⁷', kg: '4⁷' },
      D: { en: '2¹', ru: '2¹', kg: '2¹' }
    },
    correct: 'A',
    explanation: { en: 'When multiplying with same base, add exponents: 2³ × 2⁴ = 2³⁺⁴ = 2⁷', ru: 'При умножении с одинаковым основанием складываем показатели: 2³ × 2⁴ = 2³⁺⁴ = 2⁷', kg: 'Бирдей негиз менен көбөйтүүдө даражаларды кошобуз: 2³ × 2⁴ = 2³⁺⁴ = 2⁷' }
  },
  {
    id: 'exp-mt-5',
    difficulty: 'medium',
    question: { en: 'What is 3⁻²?', ru: 'Чему равно 3⁻²?', kg: '3⁻² канча?' },
    options: {
      A: { en: '-9', ru: '-9', kg: '-9' },
      B: { en: '1/9', ru: '1/9', kg: '1/9' },
      C: { en: '-6', ru: '-6', kg: '-6' },
      D: { en: '9', ru: '9', kg: '9' }
    },
    correct: 'B',
    explanation: { en: 'Negative exponent means reciprocal: 3⁻² = 1/3² = 1/9', ru: 'Отрицательный показатель означает обратное число: 3⁻² = 1/3² = 1/9', kg: 'Терс даража карама-каршыны билдирет: 3⁻² = 1/3² = 1/9' }
  },
  {
    id: 'exp-mt-6',
    difficulty: 'medium',
    question: { en: 'Simplify: (2³)²', ru: 'Упростите: (2³)²', kg: 'Жөнөкөйлөтүңүз: (2³)²' },
    options: {
      A: { en: '2⁵', ru: '2⁵', kg: '2⁵' },
      B: { en: '2⁶', ru: '2⁶', kg: '2⁶' },
      C: { en: '2⁹', ru: '2⁹', kg: '2⁹' },
      D: { en: '4⁶', ru: '4⁶', kg: '4⁶' }
    },
    correct: 'B',
    explanation: { en: 'Power of a power: multiply exponents: (2³)² = 2³ˣ² = 2⁶', ru: 'Степень степени: умножаем показатели: (2³)² = 2³ˣ² = 2⁶', kg: 'Даражанын даражасы: даражаларды көбөйтөбүз: (2³)² = 2³ˣ² = 2⁶' }
  },
  {
    id: 'exp-mt-7',
    difficulty: 'hard',
    question: { en: 'Simplify: 5⁴ ÷ 5²', ru: 'Упростите: 5⁴ ÷ 5²', kg: 'Жөнөкөйлөтүңүз: 5⁴ ÷ 5²' },
    options: {
      A: { en: '5²', ru: '5²', kg: '5²' },
      B: { en: '5⁶', ru: '5⁶', kg: '5⁶' },
      C: { en: '1²', ru: '1²', kg: '1²' },
      D: { en: '5⁸', ru: '5⁸', kg: '5⁸' }
    },
    correct: 'A',
    explanation: { en: 'When dividing with same base, subtract exponents: 5⁴ ÷ 5² = 5⁴⁻² = 5²', ru: 'При делении с одинаковым основанием вычитаем показатели: 5⁴ ÷ 5² = 5⁴⁻² = 5²', kg: 'Бирдей негиз менен бөлүүдө даражаларды кемитебиз: 5⁴ ÷ 5² = 5⁴⁻² = 5²' }
  },
  {
    id: 'exp-mt-8',
    difficulty: 'hard',
    question: { en: 'What is (2 × 3)³?', ru: 'Чему равно (2 × 3)³?', kg: '(2 × 3)³ канча?' },
    options: {
      A: { en: '18', ru: '18', kg: '18' },
      B: { en: '36', ru: '36', kg: '36' },
      C: { en: '216', ru: '216', kg: '216' },
      D: { en: '72', ru: '72', kg: '72' }
    },
    correct: 'C',
    explanation: { en: '(2 × 3)³ = 6³ = 216, or 2³ × 3³ = 8 × 27 = 216', ru: '(2 × 3)³ = 6³ = 216, или 2³ × 3³ = 8 × 27 = 216', kg: '(2 × 3)³ = 6³ = 216, же 2³ × 3³ = 8 × 27 = 216' }
  },
  {
    id: 'exp-mt-9',
    difficulty: 'hard',
    question: { en: 'Simplify: (x²)³ × x⁴', ru: 'Упростите: (x²)³ × x⁴', kg: 'Жөнөкөйлөтүңүз: (x²)³ × x⁴' },
    options: {
      A: { en: 'x⁹', ru: 'x⁹', kg: 'x⁹' },
      B: { en: 'x¹⁰', ru: 'x¹⁰', kg: 'x¹⁰' },
      C: { en: 'x²⁴', ru: 'x²⁴', kg: 'x²⁴' },
      D: { en: 'x⁸', ru: 'x⁸', kg: 'x⁸' }
    },
    correct: 'B',
    explanation: { en: '(x²)³ = x⁶, then x⁶ × x⁴ = x¹⁰', ru: '(x²)³ = x⁶, затем x⁶ × x⁴ = x¹⁰', kg: '(x²)³ = x⁶, анан x⁶ × x⁴ = x¹⁰' }
  }
];

// Fallback full test questions for exponents (20 questions)
const exponentsFullTest = [
  {
    id: 'exp-ft-1',
    question: { en: 'What is 3⁴?', ru: 'Чему равно 3⁴?', kg: '3⁴ канча?' },
    options: {
      A: { en: '12', ru: '12', kg: '12' },
      B: { en: '81', ru: '81', kg: '81' },
      C: { en: '64', ru: '64', kg: '64' },
      D: { en: '27', ru: '27', kg: '27' }
    },
    correct: 'B',
    explanation: { en: '3⁴ = 3 × 3 × 3 × 3 = 81', ru: '3⁴ = 3 × 3 × 3 × 3 = 81', kg: '3⁴ = 3 × 3 × 3 × 3 = 81' }
  },
  {
    id: 'exp-ft-2',
    question: { en: 'What is 2⁵?', ru: 'Чему равно 2⁵?', kg: '2⁵ канча?' },
    options: {
      A: { en: '10', ru: '10', kg: '10' },
      B: { en: '25', ru: '25', kg: '25' },
      C: { en: '32', ru: '32', kg: '32' },
      D: { en: '16', ru: '16', kg: '16' }
    },
    correct: 'C',
    explanation: { en: '2⁵ = 2 × 2 × 2 × 2 × 2 = 32', ru: '2⁵ = 2 × 2 × 2 × 2 × 2 = 32', kg: '2⁵ = 2 × 2 × 2 × 2 × 2 = 32' }
  },
  {
    id: 'exp-ft-3',
    question: { en: 'Simplify: 4² × 4³', ru: 'Упростите: 4² × 4³', kg: 'Жөнөкөйлөтүңүз: 4² × 4³' },
    options: {
      A: { en: '4⁵', ru: '4⁵', kg: '4⁵' },
      B: { en: '4⁶', ru: '4⁶', kg: '4⁶' },
      C: { en: '16⁵', ru: '16⁵', kg: '16⁵' },
      D: { en: '8⁵', ru: '8⁵', kg: '8⁵' }
    },
    correct: 'A',
    explanation: { en: 'Same base multiplication: 4² × 4³ = 4²⁺³ = 4⁵', ru: 'Умножение с одинаковым основанием: 4² × 4³ = 4²⁺³ = 4⁵', kg: 'Бирдей негиз менен көбөйтүү: 4² × 4³ = 4²⁺³ = 4⁵' }
  },
  {
    id: 'exp-ft-4',
    question: { en: 'What is 7⁰?', ru: 'Чему равно 7⁰?', kg: '7⁰ канча?' },
    options: {
      A: { en: '0', ru: '0', kg: '0' },
      B: { en: '7', ru: '7', kg: '7' },
      C: { en: '1', ru: '1', kg: '1' },
      D: { en: '-1', ru: '-1', kg: '-1' }
    },
    correct: 'C',
    explanation: { en: 'Any non-zero number to the power of 0 equals 1', ru: 'Любое ненулевое число в степени 0 равно 1', kg: 'Ар кандай нөлдөн башка сан 0 даражасына барабар 1' }
  },
  {
    id: 'exp-ft-5',
    question: { en: 'What is 2⁻³?', ru: 'Чему равно 2⁻³?', kg: '2⁻³ канча?' },
    options: {
      A: { en: '-8', ru: '-8', kg: '-8' },
      B: { en: '1/8', ru: '1/8', kg: '1/8' },
      C: { en: '-6', ru: '-6', kg: '-6' },
      D: { en: '8', ru: '8', kg: '8' }
    },
    correct: 'B',
    explanation: { en: '2⁻³ = 1/2³ = 1/8', ru: '2⁻³ = 1/2³ = 1/8', kg: '2⁻³ = 1/2³ = 1/8' }
  },
  {
    id: 'exp-ft-6',
    question: { en: 'Simplify: (3²)³', ru: 'Упростите: (3²)³', kg: 'Жөнөкөйлөтүңүз: (3²)³' },
    options: {
      A: { en: '3⁵', ru: '3⁵', kg: '3⁵' },
      B: { en: '3⁶', ru: '3⁶', kg: '3⁶' },
      C: { en: '9⁶', ru: '9⁶', kg: '9⁶' },
      D: { en: '3⁸', ru: '3⁸', kg: '3⁸' }
    },
    correct: 'B',
    explanation: { en: 'Power of power: (3²)³ = 3²ˣ³ = 3⁶', ru: 'Степень степени: (3²)³ = 3²ˣ³ = 3⁶', kg: 'Даражанын даражасы: (3²)³ = 3²ˣ³ = 3⁶' }
  },
  {
    id: 'exp-ft-7',
    question: { en: 'What is 6⁸ ÷ 6⁵?', ru: 'Чему равно 6⁸ ÷ 6⁵?', kg: '6⁸ ÷ 6⁵ канча?' },
    options: {
      A: { en: '6³', ru: '6³', kg: '6³' },
      B: { en: '6¹³', ru: '6¹³', kg: '6¹³' },
      C: { en: '1³', ru: '1³', kg: '1³' },
      D: { en: '36³', ru: '36³', kg: '36³' }
    },
    correct: 'A',
    explanation: { en: 'Same base division: 6⁸ ÷ 6⁵ = 6⁸⁻⁵ = 6³', ru: 'Деление с одинаковым основанием: 6⁸ ÷ 6⁵ = 6⁸⁻⁵ = 6³', kg: 'Бирдей негиз менен бөлүү: 6⁸ ÷ 6⁵ = 6⁸⁻⁵ = 6³' }
  },
  {
    id: 'exp-ft-8',
    question: { en: 'What is (5²)⁰?', ru: 'Чему равно (5²)⁰?', kg: '(5²)⁰ канча?' },
    options: {
      A: { en: '25', ru: '25', kg: '25' },
      B: { en: '0', ru: '0', kg: '0' },
      C: { en: '1', ru: '1', kg: '1' },
      D: { en: '5', ru: '5', kg: '5' }
    },
    correct: 'C',
    explanation: { en: 'Any expression to the power of 0 equals 1', ru: 'Любое выражение в степени 0 равно 1', kg: 'Ар кандай туюнтма 0 даражасына барабар 1' }
  },
  {
    id: 'exp-ft-9',
    question: { en: 'Simplify: 2⁴ × 3⁴', ru: 'Упростите: 2⁴ × 3⁴', kg: 'Жөнөкөйлөтүңүз: 2⁴ × 3⁴' },
    options: {
      A: { en: '6⁴', ru: '6⁴', kg: '6⁴' },
      B: { en: '6⁸', ru: '6⁸', kg: '6⁸' },
      C: { en: '5⁸', ru: '5⁸', kg: '5⁸' },
      D: { en: '2⁴ + 3⁴', ru: '2⁴ + 3⁴', kg: '2⁴ + 3⁴' }
    },
    correct: 'A',
    explanation: { en: 'Same exponent: 2⁴ × 3⁴ = (2 × 3)⁴ = 6⁴', ru: 'Одинаковый показатель: 2⁴ × 3⁴ = (2 × 3)⁴ = 6⁴', kg: 'Бирдей даража: 2⁴ × 3⁴ = (2 × 3)⁴ = 6⁴' }
  },
  {
    id: 'exp-ft-10',
    question: { en: 'What is 10⁻¹?', ru: 'Чему равно 10⁻¹?', kg: '10⁻¹ канча?' },
    options: {
      A: { en: '-10', ru: '-10', kg: '-10' },
      B: { en: '0.1', ru: '0,1', kg: '0.1' },
      C: { en: '-1', ru: '-1', kg: '-1' },
      D: { en: '10', ru: '10', kg: '10' }
    },
    correct: 'B',
    explanation: { en: '10⁻¹ = 1/10 = 0.1', ru: '10⁻¹ = 1/10 = 0,1', kg: '10⁻¹ = 1/10 = 0.1' }
  },
  {
    id: 'exp-ft-11',
    question: { en: 'Simplify: x⁵ × x³', ru: 'Упростите: x⁵ × x³', kg: 'Жөнөкөйлөтүңүз: x⁵ × x³' },
    options: {
      A: { en: 'x¹⁵', ru: 'x¹⁵', kg: 'x¹⁵' },
      B: { en: 'x⁸', ru: 'x⁸', kg: 'x⁸' },
      C: { en: 'x²', ru: 'x²', kg: 'x²' },
      D: { en: '2x⁸', ru: '2x⁸', kg: '2x⁸' }
    },
    correct: 'B',
    explanation: { en: 'x⁵ × x³ = x⁵⁺³ = x⁸', ru: 'x⁵ × x³ = x⁵⁺³ = x⁸', kg: 'x⁵ × x³ = x⁵⁺³ = x⁸' }
  },
  {
    id: 'exp-ft-12',
    question: { en: 'What is (1/2)²?', ru: 'Чему равно (1/2)²?', kg: '(1/2)² канча?' },
    options: {
      A: { en: '1', ru: '1', kg: '1' },
      B: { en: '1/4', ru: '1/4', kg: '1/4' },
      C: { en: '2', ru: '2', kg: '2' },
      D: { en: '1/2', ru: '1/2', kg: '1/2' }
    },
    correct: 'B',
    explanation: { en: '(1/2)² = 1²/2² = 1/4', ru: '(1/2)² = 1²/2² = 1/4', kg: '(1/2)² = 1²/2² = 1/4' }
  },
  {
    id: 'exp-ft-13',
    question: { en: 'Simplify: a⁶ ÷ a²', ru: 'Упростите: a⁶ ÷ a²', kg: 'Жөнөкөйлөтүңүз: a⁶ ÷ a²' },
    options: {
      A: { en: 'a⁴', ru: 'a⁴', kg: 'a⁴' },
      B: { en: 'a³', ru: 'a³', kg: 'a³' },
      C: { en: 'a⁸', ru: 'a⁸', kg: 'a⁸' },
      D: { en: 'a¹²', ru: 'a¹²', kg: 'a¹²' }
    },
    correct: 'A',
    explanation: { en: 'a⁶ ÷ a² = a⁶⁻² = a⁴', ru: 'a⁶ ÷ a² = a⁶⁻² = a⁴', kg: 'a⁶ ÷ a² = a⁶⁻² = a⁴' }
  },
  {
    id: 'exp-ft-14',
    question: { en: 'What is 4⁻¹?', ru: 'Чему равно 4⁻¹?', kg: '4⁻¹ канча?' },
    options: {
      A: { en: '-4', ru: '-4', kg: '-4' },
      B: { en: '1/4', ru: '1/4', kg: '1/4' },
      C: { en: '4', ru: '4', kg: '4' },
      D: { en: '-1/4', ru: '-1/4', kg: '-1/4' }
    },
    correct: 'B',
    explanation: { en: '4⁻¹ = 1/4', ru: '4⁻¹ = 1/4', kg: '4⁻¹ = 1/4' }
  },
  {
    id: 'exp-ft-15',
    question: { en: 'Simplify: (xy)³', ru: 'Упростите: (xy)³', kg: 'Жөнөкөйлөтүңүз: (xy)³' },
    options: {
      A: { en: 'x³y', ru: 'x³y', kg: 'x³y' },
      B: { en: 'xy³', ru: 'xy³', kg: 'xy³' },
      C: { en: 'x³y³', ru: 'x³y³', kg: 'x³y³' },
      D: { en: '3xy', ru: '3xy', kg: '3xy' }
    },
    correct: 'C',
    explanation: { en: '(xy)³ = x³y³', ru: '(xy)³ = x³y³', kg: '(xy)³ = x³y³' }
  },
  {
    id: 'exp-ft-16',
    question: { en: 'What is 9^(1/2)?', ru: 'Чему равно 9^(1/2)?', kg: '9^(1/2) канча?' },
    options: {
      A: { en: '4.5', ru: '4,5', kg: '4.5' },
      B: { en: '3', ru: '3', kg: '3' },
      C: { en: '81', ru: '81', kg: '81' },
      D: { en: '18', ru: '18', kg: '18' }
    },
    correct: 'B',
    explanation: { en: '9^(1/2) = √9 = 3', ru: '9^(1/2) = √9 = 3', kg: '9^(1/2) = √9 = 3' }
  },
  {
    id: 'exp-ft-17',
    question: { en: 'Simplify: (2³)⁴', ru: 'Упростите: (2³)⁴', kg: 'Жөнөкөйлөтүңүз: (2³)⁴' },
    options: {
      A: { en: '2⁷', ru: '2⁷', kg: '2⁷' },
      B: { en: '2¹²', ru: '2¹²', kg: '2¹²' },
      C: { en: '8⁴', ru: '8⁴', kg: '8⁴' },
      D: { en: '6⁴', ru: '6⁴', kg: '6⁴' }
    },
    correct: 'B',
    explanation: { en: '(2³)⁴ = 2³ˣ⁴ = 2¹²', ru: '(2³)⁴ = 2³ˣ⁴ = 2¹²', kg: '(2³)⁴ = 2³ˣ⁴ = 2¹²' }
  },
  {
    id: 'exp-ft-18',
    question: { en: 'What is 5² + 5³?', ru: 'Чему равно 5² + 5³?', kg: '5² + 5³ канча?' },
    options: {
      A: { en: '5⁵', ru: '5⁵', kg: '5⁵' },
      B: { en: '150', ru: '150', kg: '150' },
      C: { en: '10⁵', ru: '10⁵', kg: '10⁵' },
      D: { en: '250', ru: '250', kg: '250' }
    },
    correct: 'B',
    explanation: { en: '5² + 5³ = 25 + 125 = 150', ru: '5² + 5³ = 25 + 125 = 150', kg: '5² + 5³ = 25 + 125 = 150' }
  },
  {
    id: 'exp-ft-19',
    question: { en: 'Simplify: (a/b)³', ru: 'Упростите: (a/b)³', kg: 'Жөнөкөйлөтүңүз: (a/b)³' },
    options: {
      A: { en: 'a³/b', ru: 'a³/b', kg: 'a³/b' },
      B: { en: 'a/b³', ru: 'a/b³', kg: 'a/b³' },
      C: { en: 'a³/b³', ru: 'a³/b³', kg: 'a³/b³' },
      D: { en: '3a/3b', ru: '3a/3b', kg: '3a/3b' }
    },
    correct: 'C',
    explanation: { en: '(a/b)³ = a³/b³', ru: '(a/b)³ = a³/b³', kg: '(a/b)³ = a³/b³' }
  },
  {
    id: 'exp-ft-20',
    question: { en: 'If 2ˣ = 16, what is x?', ru: 'Если 2ˣ = 16, чему равен x?', kg: 'Эгер 2ˣ = 16 болсо, x канча?' },
    options: {
      A: { en: '2', ru: '2', kg: '2' },
      B: { en: '3', ru: '3', kg: '3' },
      C: { en: '4', ru: '4', kg: '4' },
      D: { en: '8', ru: '8', kg: '8' }
    },
    correct: 'C',
    explanation: { en: '2⁴ = 16, so x = 4', ru: '2⁴ = 16, значит x = 4', kg: '2⁴ = 16, ошондуктан x = 4' }
  }
];

type TabType = 'basic' | 'mini' | 'diagrams' | 'mistakes' | 'miniTests' | 'fullTest' | 'dynamic';
type LearningStyle = 'visual' | 'auditory' | 'text-based' | 'problem-solver' | 'adhd-friendly';
type Difficulty = 'easy' | 'medium' | 'hard';

const tabIcons: Record<TabType, React.ReactNode> = {
  basic: <BookOpen className="h-4 w-4" />,
  mini: <PlayCircle className="h-4 w-4" />,
  diagrams: <LayoutGrid className="h-4 w-4" />,
  mistakes: <AlertTriangle className="h-4 w-4" />,
  miniTests: <Brain className="h-4 w-4" />,
  fullTest: <FileText className="h-4 w-4" />,
  dynamic: <Sparkles className="h-4 w-4" />,
};

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  visual: <Eye className="h-5 w-5" />,
  auditory: <Ear className="h-5 w-5" />,
  'text-based': <BookOpen className="h-5 w-5" />,
  'problem-solver': <Puzzle className="h-5 w-5" />,
  'adhd-friendly': <Zap className="h-5 w-5" />,
};

// Helper to get text from multilang object or string
function getText(obj: { en: string; ru: string; kg: string } | string | undefined, lang: Language): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
}

// Helper to get rules as array (handles both array of multilang objects and multilang object with arrays)
function getRulesArray(rules: any, lang: Language): string[] {
  if (!rules) return [];
  // If it's a multilang object with arrays (like exponents)
  if (rules[lang] && Array.isArray(rules[lang])) {
    return rules[lang];
  }
  // If it's an array of multilang objects (like fractions)
  if (Array.isArray(rules)) {
    return rules.map(r => getText(r, lang));
  }
  return [];
}

// Helper to get examples from either examples or worked_examples
function getExamples(basicLesson: any): any[] {
  if (basicLesson.examples && Array.isArray(basicLesson.examples)) {
    return basicLesson.examples;
  }
  if (basicLesson.worked_examples && Array.isArray(basicLesson.worked_examples)) {
    return basicLesson.worked_examples;
  }
  return [];
}

// Helper to get theory/content
function getTheoryText(basicLesson: any, lang: Language): string {
  if (basicLesson.theory) return getText(basicLesson.theory, lang);
  if (basicLesson.content) return getText(basicLesson.content, lang);
  return '';
}

// Video Embed component
function VideoEmbed({ url }: { url?: string }) {
  const { language } = useLanguage();
  
  if (!url) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
        <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Видео будет добавлено скоро' : language === 'kg' ? 'Видео жакында кошулат' : 'Video will be added soon'}
        </p>
      </div>
    );
  }

  // Extract YouTube video ID
  const getYouTubeId = (urlStr: string) => {
    const match = urlStr.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);
  
  if (videoId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {language === 'ru' ? 'Смотреть видео' : language === 'kg' ? 'Видеону көрүү' : 'Watch video'}
    </a>
  );
}

// Diagram Image component with auto-generate fallback
function DiagramImage({ imagePath, diagramId, title, topicId }: { imagePath: string; diagramId: string; title: string; topicId: string }) {
  const images = topicImages[topicId] || {};
  
  // First check if we have a static image for this diagram ID
  const staticImage = images[diagramId];
  if (staticImage) {
    return (
      <img 
        src={staticImage} 
        alt={title}
        className="w-full rounded-lg shadow-md"
      />
    );
  }
  
  // Check if it's an auto-generate placeholder
  if (imagePath === 'auto-generate' || !imagePath) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
        <p className="text-muted-foreground text-sm">{title}</p>
        <Badge variant="outline" className="mt-2">AI Generated</Badge>
      </div>
    );
  }

  // Otherwise try to load from storage
  return <StorageImage path={imagePath} alt={title} />;
}

// Storage Image component
function StorageImage({ path, alt }: { path: string; alt: string }) {
  const url = useStorageImage(path);
  
  if (!url) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{alt}</p>
      </div>
    );
  }

  return <img src={url} alt={alt} className="w-full rounded-lg shadow-md" />;
}

export default function DynamicLessonViewer() {
  const { topicId } = useParams<{ topicId: string }>();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Normalize topicId to handle singular/plural variants
  const normalizedTopicId = topicId === 'exponent' ? 'exponents' : topicId;
  
  // Mapping from topic IDs to lesson JSON files in storage (exact paths in bucket)
  const lessonPathMap: Record<string, string> = {
    fractions: 'fractions/fraction.json',
    exponents: 'exponents/exponents.json',
  };

  // Fetch lesson data from storage (JSON is the single source of truth)
  const bucketPath =
    (normalizedTopicId && lessonPathMap[normalizedTopicId]) ||
    (normalizedTopicId ? `${normalizedTopicId}/${normalizedTopicId}.json` : '');

  const { data, loading, error } = useLessonData(bucketPath);
  
  // Mini-tests state
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [miniTestIndex, setMiniTestIndex] = useState(0);
  const [miniTestAnswer, setMiniTestAnswer] = useState<string | null>(null);
  const [miniTestShowResult, setMiniTestShowResult] = useState(false);
  const [miniTestScore, setMiniTestScore] = useState(0);
  const [miniTestTotal, setMiniTestTotal] = useState(0);
  
  // Full test state
  const [fullTestIndex, setFullTestIndex] = useState(0);
  const [fullTestAnswers, setFullTestAnswers] = useState<Record<number, string>>({});
  const [fullTestSubmitted, setFullTestSubmitted] = useState(false);
  
  // Dynamic lesson state
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [aiPracticeAnswers, setAiPracticeAnswers] = useState<Record<number, number>>({});
  const [showAiResults, setShowAiResults] = useState(false);
  
  // Notes state
  const [lessonNotes, setLessonNotes] = useState<string>(() => {
    return localStorage.getItem(`${normalizedTopicId}_lesson_notes`) || '';
  });

  const saveNotes = () => {
    localStorage.setItem(`${normalizedTopicId}_lesson_notes`, lessonNotes);
    toast.success(language === 'ru' ? 'Заметки сохранены!' : 'Notes saved!');
  };

  // AI Lesson generation
  const fetchStudentResults = async () => {
    if (!user) return null;
    try {
      const { data: miniTestResults } = await supabase
        .from('mini_test_results')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      const { data: testResults } = await supabase
        .from('user_tests')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      let totalCorrect = 0;
      let totalQuestions = 0;
      if (miniTestResults) {
        miniTestResults.forEach(r => {
          totalCorrect += r.score || 0;
          totalQuestions += r.total_questions || 0;
        });
      }
      if (testResults) {
        testResults.forEach(r => {
          totalCorrect += r.score || 0;
          totalQuestions += r.total_questions || 0;
        });
      }

      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 50;
      const weakAreas = accuracy < 60 ? ['Сложение дробей', 'Вычитание дробей'] : accuracy < 80 ? ['Умножение дробей'] : [];

      return {
        accuracy,
        testsCompleted: (miniTestResults?.length || 0) + (testResults?.length || 0),
        weakAreas,
        strongAreas: accuracy > 70 ? ['Основы дробей'] : [],
        recentMistakes: []
      };
    } catch (error) {
      console.error('Error fetching student results:', error);
      return null;
    }
  };

  const generateAILesson = async (style: LearningStyle) => {
    setIsGeneratingLesson(true);
    setGeneratedLesson(null);
    setAiPracticeAnswers({});
    setShowAiResults(false);

    try {
      const studentResults = await fetchStudentResults();
      const topicName = normalizedTopicId === 'fractions' ? 'Дроби (Fractions)' : normalizedTopicId === 'exponents' ? 'Степени (Exponents)' : normalizedTopicId;

      const { data, error } = await supabase.functions.invoke('ai-generate-lesson', {
        body: { topic: topicName, learningStyle: style, studentResults, language }
      });

      if (error) throw error;
      if (data.status === 'ok') {
        setGeneratedLesson(data);
      } else {
        throw new Error(data.error || 'Failed to generate lesson');
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast.error(language === 'ru' ? 'Ошибка генерации урока' : 'Error generating lesson');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleStyleSelect = (style: LearningStyle) => {
    setSelectedStyle(style);
    generateAILesson(style);
  };

  const handleAiAnswerSelect = (qIdx: number, oIdx: number) => {
    if (showAiResults) return;
    setAiPracticeAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const checkAiAnswers = () => setShowAiResults(true);
  const resetAiPractice = () => { setAiPracticeAnswers({}); setShowAiResults(false); };

  const t = {
    title: data ? getText({ en: data.topic, ru: data.topic_ru || data.topic, kg: data.topic_kg || data.topic }, language) : '',
    subtitle: language === 'ru' ? 'Полный интерактивный урок' : language === 'kg' ? 'Толук интерактивдик сабак' : 'Complete Interactive Lesson',
    back: language === 'ru' ? 'Назад к урокам' : language === 'kg' ? 'Сабактарга кайтуу' : 'Back to Lessons',
    tabs: {
      basic: language === 'ru' ? 'Основной урок' : language === 'kg' ? 'Негизги сабак' : 'Basic Lesson',
      mini: language === 'ru' ? 'Мини-уроки' : language === 'kg' ? 'Мини-сабактар' : 'Mini Lessons',
      diagrams: language === 'ru' ? 'Диаграммы' : language === 'kg' ? 'Диаграммалар' : 'Diagrams',
      mistakes: language === 'ru' ? 'Типичные ошибки' : language === 'kg' ? 'Типтүү каталар' : 'Common Mistakes',
      miniTests: language === 'ru' ? 'Мини-тесты' : language === 'kg' ? 'Мини-тесттер' : 'Mini-Tests',
      fullTest: language === 'ru' ? 'Полный тест' : language === 'kg' ? 'Толук тест' : 'Full Test',
      dynamic: language === 'ru' ? 'AI Урок' : language === 'kg' ? 'AI Сабак' : 'AI Lesson',
    },
    theory: language === 'ru' ? 'Теория' : language === 'kg' ? 'Теория' : 'Theory',
    definitions: language === 'ru' ? 'Определения' : language === 'kg' ? 'Аныктамалар' : 'Definitions',
    rules: language === 'ru' ? 'Правила' : language === 'kg' ? 'Эрежелер' : 'Rules',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    restart: language === 'ru' ? 'Начать заново' : language === 'kg' ? 'Кайра баштоо' : 'Restart',
    submit: language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти бүтүрүү' : 'Submit Test',
    retake: language === 'ru' ? 'Пройти заново' : language === 'kg' ? 'Кайра өтүү' : 'Retake Test',
    score: language === 'ru' ? 'Ваш результат' : language === 'kg' ? 'Сиздин жыйынтык' : 'Your Score',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окуу стилин тандаңыз' : 'Select Your Learning Style',
    changeStyle: language === 'ru' ? 'Изменить стиль' : language === 'kg' ? 'Стилди өзгөртүү' : 'Change Style',
    difficulty: {
      easy: language === 'ru' ? 'Легкий' : language === 'kg' ? 'Жеңил' : 'Easy',
      medium: language === 'ru' ? 'Средний' : language === 'kg' ? 'Орточо' : 'Medium',
      hard: language === 'ru' ? 'Сложный' : language === 'kg' ? 'Кыйын' : 'Hard',
    },
    styleNames: {
      visual: language === 'ru' ? 'Визуальный' : language === 'kg' ? 'Визуалдык' : 'Visual',
      auditory: language === 'ru' ? 'Аудиальный' : language === 'kg' ? 'Аудиалдык' : 'Auditory',
      'text-based': language === 'ru' ? 'Текстовый' : language === 'kg' ? 'Тексттик' : 'Text-based',
      'problem-solver': language === 'ru' ? 'Практический' : language === 'kg' ? 'Практикалык' : 'Problem-solver',
      'adhd-friendly': language === 'ru' ? 'СДВГ-дружественный' : language === 'kg' ? 'ADHD-достук' : 'ADHD-friendly',
    },
    styleDescriptions: {
      visual: language === 'ru' ? 'Обучение через изображения' : language === 'kg' ? 'Сүрөттөр аркылуу окуу' : 'Learning through images',
      auditory: language === 'ru' ? 'Обучение через прослушивание' : language === 'kg' ? 'Угуу аркылуу окуу' : 'Learning through listening',
      'text-based': language === 'ru' ? 'Обучение через чтение' : language === 'kg' ? 'Окуу аркылуу үйрөнүү' : 'Learning through reading',
      'problem-solver': language === 'ru' ? 'Обучение через практику' : language === 'kg' ? 'Практика аркылуу окуу' : 'Learning through practice',
      'adhd-friendly': language === 'ru' ? 'Короткие интерактивные уроки' : language === 'kg' ? 'Кыска интерактивдик сабактар' : 'Short interactive lessons',
    },
    notesPlaceholder: language === 'ru' ? 'Запишите свои заметки здесь...' : language === 'kg' ? 'Жазууларыңызды бул жерге жазыңыз...' : 'Write your notes here...',
    saveNotes: language === 'ru' ? 'Сохранить заметки' : language === 'kg' ? 'Жазууларды сактоо' : 'Save Notes',
  };

  // Mini-test logic - use fallback questions for fractions if no mini_tests in data
  // Helper to get fallback mini tests by topic
  const getMiniTestFallback = () => {
    if (normalizedTopicId === 'fractions') return fractionsMiniTests;
    if (normalizedTopicId === 'exponents') return exponentsMiniTests;
    return [];
  };
  
  const miniTestSource = (data?.mini_tests && data.mini_tests.length > 0) 
    ? data.mini_tests 
    : getMiniTestFallback();
  const filteredMiniTestQuestions = miniTestSource.filter((q: any) => q.difficulty === currentDifficulty) || [];
  const currentMiniTestQuestion = filteredMiniTestQuestions[miniTestIndex];

  const handleMiniTestAnswer = (answer: string) => {
    if (miniTestShowResult) return;
    setMiniTestAnswer(answer);
  };

  const checkMiniTestAnswer = () => {
    if (miniTestAnswer === null || !currentMiniTestQuestion) return;
    setMiniTestShowResult(true);
    setMiniTestTotal(prev => prev + 1);
    if (miniTestAnswer === currentMiniTestQuestion.correct) {
      setMiniTestScore(prev => prev + 1);
      // Increase difficulty
      if (currentDifficulty === 'easy') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium') setCurrentDifficulty('hard');
    } else {
      // Decrease difficulty
      if (currentDifficulty === 'hard') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium') setCurrentDifficulty('easy');
    }
  };

  const nextMiniTestQuestion = () => {
    const miniTestSrc = (data?.mini_tests && data.mini_tests.length > 0) 
      ? data.mini_tests 
      : getMiniTestFallback();
    const newFilteredQuestions = miniTestSrc.filter((q: any) => q.difficulty === currentDifficulty) || [];
    if (newFilteredQuestions.length === 0) {
      setMiniTestIndex(0);
    } else {
      setMiniTestIndex((prev) => (prev + 1) % newFilteredQuestions.length);
    }
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
  };

  const restartMiniTest = () => {
    setCurrentDifficulty('easy');
    setMiniTestIndex(0);
    setMiniTestAnswer(null);
    setMiniTestShowResult(false);
    setMiniTestScore(0);
    setMiniTestTotal(0);
  };

  // Helper to get fallback full test by topic
  const getFullTestFallback = () => {
    if (normalizedTopicId === 'fractions') return fractionsFullTest;
    if (normalizedTopicId === 'exponents') return exponentsFullTest;
    return [];
  };
  
  // Full test logic - use fallback questions if no full_test in data
  const fullTestSource = (data?.full_test && data.full_test.length > 0)
    ? data.full_test
    : getFullTestFallback();
  const currentFullTestQuestion = fullTestSource[fullTestIndex];
  const fullTestAnsweredCount = Object.keys(fullTestAnswers).length;

  const handleFullTestAnswer = (answer: string) => {
    setFullTestAnswers(prev => ({ ...prev, [fullTestIndex]: answer }));
  };

  const calculateFullTestScore = () => {
    let correct = 0;
    fullTestSource.forEach((q: any, idx: number) => {
      if (fullTestAnswers[idx] === q.correct) correct++;
    });
    return correct;
  };

  const restartFullTest = () => {
    setFullTestIndex(0);
    setFullTestAnswers({});
    setFullTestSubmitted(false);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {language === 'ru' ? 'Урок не найден' : 'Lesson not found'}
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link to="/lessons">{t.back}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lessons">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {t.back}
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-lg border overflow-hidden">
              {(['en', 'ru', 'kg'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    language === lang 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              <TabsList className="w-full flex-wrap h-auto gap-1 mb-6">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab}
                    className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tabIcons[tab]}
                    <span className="text-xs hidden sm:inline">{t.tabs[tab]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Basic Lesson Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{getText(data.basic_lesson.title, language)}</h2>
                </div>
                
                {/* Video */}
                {data.basic_lesson.video && (
                  <Card>
                    <CardContent className="pt-6">
                      <VideoEmbed url={topicVideos[normalizedTopicId!] || data.basic_lesson.video} />
                    </CardContent>
                  </Card>
                )}

                {/* Theory/Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">📚 {t.theory}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{getTheoryText(data.basic_lesson, language)}</p>
                  </CardContent>
                </Card>

                {/* Definitions */}
                {data.basic_lesson.definitions && data.basic_lesson.definitions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">📖 {t.definitions}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.basic_lesson.definitions.map((def, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-primary">{getText(def.term, language)}</h4>
                          <p className="text-muted-foreground mt-1">{getText(def.definition, language)}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Rules */}
                {(() => {
                  const rulesArr = getRulesArray(data.basic_lesson.rules, language);
                  if (rulesArr.length === 0) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">📐 {t.rules}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {rulesArr.map((rule, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <p className="text-muted-foreground">{rule}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Examples */}
                {(() => {
                  const examples = getExamples(data.basic_lesson);
                  if (examples.length === 0) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">💡 {t.examples}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {examples.map((example, idx) => (
                          <div key={idx} className="p-4 border rounded-lg space-y-3">
                            <Badge variant="outline">{t.examples} {idx + 1}</Badge>
                            <h4 className="font-semibold">{getText(example.title, language)}</h4>
                            <div className="bg-muted/50 p-3 rounded">
                              <p className="font-medium">{getText(example.problem, language)}</p>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded border-l-4 border-green-500">
                              <p>{getText(example.solution, language)}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5" />
                      {language === 'ru' ? 'Мои заметки' : 'My Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                      placeholder={t.notesPlaceholder}
                      className="min-h-[120px]"
                    />
                    <Button onClick={saveNotes} size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      {t.saveNotes}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mini Lessons Tab */}
              <TabsContent value="mini" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.mini}</h2>
                  <Badge variant="outline">{data.mini_lessons?.length || 0} {language === 'ru' ? 'уроков' : 'lessons'}</Badge>
                </div>

                {data.mini_lessons?.map((lesson, idx) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Badge>{idx + 1}</Badge>
                          {getText(lesson.title, language)}
                        </CardTitle>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {lesson.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{getText(lesson.summary, language)}</p>
                      <VideoEmbed url={lesson.video} />
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{getText(lesson.content, language)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Diagrams Tab */}
              <TabsContent value="diagrams" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.diagrams}</h2>
                  <Badge variant="outline">{data.diagrams?.length || 0}</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {data.diagrams?.map((diagram) => (
                    <Card key={diagram.id}>
                      <CardHeader>
                        <CardTitle>{getText(diagram.title, language)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">{getText(diagram.description, language)}</p>
                        <DiagramImage 
                          imagePath={diagram.image} 
                          diagramId={diagram.id}
                          title={getText(diagram.title, language)} 
                          topicId={normalizedTopicId || ''} 
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Common Mistakes Tab */}
              <TabsContent value="mistakes" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <h2 className="text-2xl font-bold">{t.tabs.mistakes}</h2>
                  <Badge variant="outline">{data.common_mistakes?.length || 0}</Badge>
                </div>

                {data.common_mistakes?.map((mistake, idx) => (
                  <Card key={mistake.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-6 w-6 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-destructive">{language === 'ru' ? 'Ошибка' : 'Mistake'} {idx + 1}</h4>
                          <p className="text-muted-foreground">{getText(mistake.mistake, language)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-6 w-6 text-warning mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-warning">{language === 'ru' ? 'Почему это неправильно' : 'Why it is wrong'}</h4>
                          <p className="text-muted-foreground">{getText(mistake.why, language)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-500">{language === 'ru' ? 'Как исправить' : 'How to fix'}</h4>
                          <p className="text-muted-foreground">{getText(mistake.fix, language)}</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="font-medium mb-1">{language === 'ru' ? 'Пример' : 'Example'}</h4>
                        <p className="font-mono text-sm">{getText(mistake.example, language)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Mini-Tests Tab */}
              <TabsContent value="miniTests" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{t.tabs.miniTests}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentDifficulty === 'easy' ? 'default' : 'outline'}>
                      {t.difficulty.easy}
                    </Badge>
                    <Badge variant={currentDifficulty === 'medium' ? 'default' : 'outline'}>
                      {t.difficulty.medium}
                    </Badge>
                    <Badge variant={currentDifficulty === 'hard' ? 'default' : 'outline'}>
                      {t.difficulty.hard}
                    </Badge>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{language === 'ru' ? 'Счёт' : 'Score'}: {miniTestScore}/{miniTestTotal}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={restartMiniTest}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        {t.restart}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentMiniTestQuestion ? (
                      <>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{getText(currentMiniTestQuestion.question, language)}</p>
                        </div>
                        
                        <div className="grid gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((option) => (
                            <Button
                              key={option}
                              variant="outline"
                              className={cn(
                                'justify-start h-auto py-3 px-4',
                                miniTestAnswer === option && !miniTestShowResult && 'border-primary bg-primary/10',
                                miniTestShowResult && option === currentMiniTestQuestion.correct && 'border-green-500 bg-green-500/10',
                                miniTestShowResult && miniTestAnswer === option && option !== currentMiniTestQuestion.correct && 'border-destructive bg-destructive/10'
                              )}
                              onClick={() => handleMiniTestAnswer(option)}
                              disabled={miniTestShowResult}
                            >
                              <span className="font-bold mr-2">{option}.</span>
                              {getText(currentMiniTestQuestion.options[option], language)}
                            </Button>
                          ))}
                        </div>

                        {miniTestShowResult && (
                          <div className={cn(
                            'p-4 rounded-lg',
                            miniTestAnswer === currentMiniTestQuestion.correct ? 'bg-green-500/10' : 'bg-destructive/10'
                          )}>
                            {miniTestAnswer === currentMiniTestQuestion.correct ? (
                              <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">{language === 'ru' ? 'Правильно!' : 'Correct!'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-destructive">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">{language === 'ru' ? 'Неправильно' : 'Incorrect'}</span>
                              </div>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                              {getText(currentMiniTestQuestion.explanation, language)}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!miniTestShowResult ? (
                            <Button onClick={checkMiniTestAnswer} disabled={miniTestAnswer === null}>
                              {language === 'ru' ? 'Проверить' : 'Check'}
                            </Button>
                          ) : (
                            <Button onClick={nextMiniTestQuestion}>
                              {t.next}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ru' ? 'Нет вопросов для текущего уровня сложности' : 'No questions for current difficulty'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Full Test Tab */}
              <TabsContent value="fullTest" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.fullTest}</h2>
                  <Badge variant="outline">{fullTestSource.length} {language === 'ru' ? 'вопросов' : 'questions'}</Badge>
                </div>

                {fullTestSubmitted ? (
                  // Results
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.score}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-6">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {calculateFullTestScore()}/{fullTestSource.length}
                        </div>
                        <div className="text-2xl text-muted-foreground">
                          {Math.round((calculateFullTestScore() / (fullTestSource.length || 1)) * 100)}%
                        </div>
                        <Progress 
                          value={(calculateFullTestScore() / (fullTestSource.length || 1)) * 100} 
                          className="h-3 mt-4"
                        />
                      </div>

                      <Button onClick={restartFullTest} className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t.retake}
                      </Button>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold">{language === 'ru' ? 'Обзор ответов' : 'Answer Review'}</h3>
                        {fullTestSource.map((q: any, idx: number) => {
                          const userAnswer = fullTestAnswers[idx];
                          const isCorrect = userAnswer === q.correct;
                          return (
                            <div key={q.id} className={cn(
                              'p-4 rounded-lg border',
                              isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-destructive/5 border-destructive/30'
                            )}>
                              <div className="flex items-start gap-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{idx + 1}. {getText(q.question, language)}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {language === 'ru' ? 'Ваш ответ' : 'Your answer'}: {userAnswer || '-'} | {language === 'ru' ? 'Правильный' : 'Correct'}: {q.correct}
                                  </p>
                                  <p className="text-sm mt-2">{getText(q.explanation, language)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Test taking
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {language === 'ru' ? 'Вопрос' : 'Question'} {fullTestIndex + 1}/{fullTestSource.length}
                        </CardTitle>
                        <Badge variant="outline">
                          {fullTestAnsweredCount}/{fullTestSource.length} {language === 'ru' ? 'отвечено' : 'answered'}
                        </Badge>
                      </div>
                      <Progress value={(fullTestAnsweredCount / (fullTestSource.length || 1)) * 100} className="h-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentFullTestQuestion && (
                        <>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-medium">{getText(currentFullTestQuestion.question, language)}</p>
                          </div>

                          <div className="grid gap-2">
                            {(['A', 'B', 'C', 'D'] as const).map((option) => (
                              <Button
                                key={option}
                                variant="outline"
                                className={cn(
                                  'justify-start h-auto py-3 px-4',
                                  fullTestAnswers[fullTestIndex] === option && 'border-primary bg-primary/10'
                                )}
                                onClick={() => handleFullTestAnswer(option)}
                              >
                                <span className="font-bold mr-2">{option}.</span>
                                {getText(currentFullTestQuestion.options[option], language)}
                              </Button>
                            ))}
                          </div>

                          <div className="flex justify-between pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setFullTestIndex(prev => Math.max(0, prev - 1))}
                              disabled={fullTestIndex === 0}
                            >
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              {language === 'ru' ? 'Назад' : 'Previous'}
                            </Button>

                            {fullTestIndex === fullTestSource.length - 1 ? (
                              <Button 
                                onClick={() => setFullTestSubmitted(true)}
                                disabled={fullTestAnsweredCount < fullTestSource.length}
                              >
                                {t.submit}
                              </Button>
                            ) : (
                              <Button onClick={() => setFullTestIndex(prev => prev + 1)}>
                                {t.next}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Question navigation */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            {fullTestSource.map((_: any, idx: number) => (
                              <Button
                                key={idx}
                                variant={fullTestAnswers[idx] ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                  'w-10 h-10',
                                  fullTestIndex === idx && 'ring-2 ring-primary ring-offset-2'
                                )}
                                onClick={() => setFullTestIndex(idx)}
                              >
                                {idx + 1}
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Dynamic Lessons Tab */}
              <TabsContent value="dynamic" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t.tabs.dynamic}</h2>
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    AI Personalized
                  </Badge>
                </div>

                {!selectedStyle ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.selectStyle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(Object.keys(styleIcons) as LearningStyle[]).map((style) => (
                          <button
                            key={style}
                            onClick={() => handleStyleSelect(style)}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent hover:border-primary cursor-pointer transition-all"
                          >
                            <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                              {styleIcons[style]}
                            </div>
                            <span className="font-semibold mb-2">{t.styleNames[style]}</span>
                            <span className="text-xs text-muted-foreground text-center">{t.styleDescriptions[style]}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : isGeneratingLesson ? (
                  <Card>
                    <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-lg text-muted-foreground">{language === 'ru' ? 'Генерация урока...' : 'Generating lesson...'}</p>
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Анализируем ваш прогресс и создаем персональный урок...' : 'Analyzing your progress...'}</p>
                    </CardContent>
                  </Card>
                ) : generatedLesson ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-base py-1 px-3">{styleIcons[selectedStyle]}<span className="ml-2">{t.styleNames[selectedStyle]}</span></Badge>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStyle(null); setGeneratedLesson(null); }}><RotateCcw className="h-4 w-4 mr-1" />{t.changeStyle}</Button>
                    </div>

                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{language === 'ru' ? 'Введение' : 'Introduction'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground text-lg leading-relaxed">{generatedLesson.lesson.introduction}</p></CardContent></Card>

                    <Card><CardHeader><CardTitle>{language === 'ru' ? 'Основной материал' : 'Core Lesson'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground whitespace-pre-wrap leading-relaxed">{generatedLesson.lesson.core_lesson}</p></CardContent></Card>

                    {generatedLesson.lesson.weakness_training?.length > 0 && (
                      <Card><CardHeader><CardTitle>{language === 'ru' ? 'Работа над слабыми местами' : 'Weakness Training'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                          {generatedLesson.lesson.weakness_training.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-3">
                              <Badge variant="secondary">{item.area}</Badge>
                              <p className="text-foreground">{item.explanation}</p>
                              <div className="p-3 bg-background rounded border"><p className="font-medium text-sm text-muted-foreground mb-1">{language === 'ru' ? 'Пример:' : 'Example:'}</p><p className="text-foreground">{item.example}</p></div>
                              {item.exercises?.length > 0 && (<ul className="list-disc list-inside space-y-1">{item.exercises.map((ex: string, i: number) => (<li key={i} className="text-foreground">{ex}</li>))}</ul>)}
                              {item.tip && (<div className="flex items-start gap-2 p-2 bg-primary/10 rounded"><span className="text-primary">💡</span><p className="text-sm text-foreground"><strong>{language === 'ru' ? 'Совет:' : 'Tip:'}</strong> {item.tip}</p></div>)}
                            </div>
                          ))}
                        </CardContent></Card>
                    )}

                    {generatedLesson.lesson.practice_questions?.length > 0 && (
                      <Card><CardHeader><CardTitle>{language === 'ru' ? 'Практика' : 'Practice'}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                          {generatedLesson.lesson.practice_questions.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="p-4 border rounded-lg space-y-3">
                              <p className="font-medium text-foreground">{qIdx + 1}. {q.question}</p>
                              <div className="grid gap-2">
                                {q.options.map((option: string, oIdx: number) => {
                                  const isSelected = aiPracticeAnswers[qIdx] === oIdx;
                                  const isCorrect = q.correct === oIdx;
                                  let cls = "text-left p-3 rounded border transition-all ";
                                  if (showAiResults) { cls += isCorrect ? "bg-green-100 border-green-500 dark:bg-green-900/30" : isSelected ? "bg-red-100 border-red-500 dark:bg-red-900/30" : "bg-muted/50"; }
                                  else { cls += isSelected ? "bg-primary/20 border-primary" : "bg-muted/50 hover:bg-muted"; }
                                  return (<button key={oIdx} onClick={() => handleAiAnswerSelect(qIdx, oIdx)} className={cls} disabled={showAiResults}>
                                    <div className="flex items-center gap-2">{showAiResults && isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}{showAiResults && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}<span>{String.fromCharCode(65 + oIdx)}. {option}</span></div>
                                  </button>);
                                })}
                              </div>
                              {showAiResults && (<div className="p-3 bg-muted/50 rounded text-sm"><strong>{language === 'ru' ? 'Объяснение:' : 'Explanation:'}</strong> {q.explanation}</div>)}
                            </div>
                          ))}
                          <div className="flex gap-3 pt-4">
                            {!showAiResults ? (<Button onClick={checkAiAnswers} disabled={Object.keys(aiPracticeAnswers).length < generatedLesson.lesson.practice_questions.length}>{language === 'ru' ? 'Проверить ответы' : 'Check Answers'}</Button>) : (<Button variant="outline" onClick={resetAiPractice}>{language === 'ru' ? 'Попробовать снова' : 'Try Again'}</Button>)}
                          </div>
                        </CardContent></Card>
                    )}

                    <Card><CardHeader><CardTitle>{language === 'ru' ? 'Итоги' : 'Summary'}</CardTitle></CardHeader>
                      <CardContent><p className="text-foreground whitespace-pre-wrap leading-relaxed">{generatedLesson.lesson.final_summary}</p></CardContent></Card>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Lesson Tree */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{language === 'ru' ? 'Содержание' : 'Contents'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(Object.keys(tabIcons) as TabType[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabIcons[tab]}
                    {t.tabs[tab]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
