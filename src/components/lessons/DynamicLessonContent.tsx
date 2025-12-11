import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Eye, Ear, FileText, Puzzle, Zap, Loader2 } from 'lucide-react';
import { LearningStyle, DynamicLessonTemplate, MathTopic } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DynamicLessonContentProps {
  templates: DynamicLessonTemplate[];
  topic: MathTopic;
}

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  'visual': <Eye className="h-5 w-5" />,
  'auditory': <Ear className="h-5 w-5" />,
  'text-based': <FileText className="h-5 w-5" />,
  'problem-solver': <Puzzle className="h-5 w-5" />,
  'adhd-friendly': <Zap className="h-5 w-5" />,
};

const styleLabels: Record<LearningStyle, { en: string; ru: string; kg: string }> = {
  'visual': { en: 'Visual Learner', ru: 'Визуальный', kg: 'Визуалдык' },
  'auditory': { en: 'Auditory Learner', ru: 'Аудиальный', kg: 'Угуу аркылуу' },
  'text-based': { en: 'Text-Based Learner', ru: 'Текстовый', kg: 'Текст аркылуу' },
  'problem-solver': { en: 'Problem Solver', ru: 'Практик', kg: 'Практик' },
  'adhd-friendly': { en: 'ADHD-Friendly', ru: 'СДВГ-дружественный', kg: 'ADHD-достун' },
};

export function DynamicLessonContent({ templates, topic }: DynamicLessonContentProps) {
  const { language } = useLanguage();
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<string | null>(null);

  const t = {
    title: language === 'ru' ? 'ИИ-персонализированный урок' : language === 'kg' ? 'AI жекелештирилген сабак' : 'AI Personalized Lesson',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окутуу стилин тандаңыз' : 'Select Your Learning Style',
    generate: language === 'ru' ? 'Создать урок' : language === 'kg' ? 'Сабак түзүү' : 'Generate Lesson',
    generating: language === 'ru' ? 'Создание...' : language === 'kg' ? 'Түзүлүүдө...' : 'Generating...',
    approach: language === 'ru' ? 'Подход' : language === 'kg' ? 'Ыкма' : 'Approach',
    format: language === 'ru' ? 'Формат' : language === 'kg' ? 'Формат' : 'Format',
    pacing: language === 'ru' ? 'Темп' : language === 'kg' ? 'Темп' : 'Pacing',
    visualAids: language === 'ru' ? 'Визуальные материалы' : language === 'kg' ? 'Визуалдык материалдар' : 'Visual Aids',
  };

  const getStyleLabel = (style: LearningStyle) => {
    const labels = styleLabels[style];
    return language === 'kg' ? labels.kg : language === 'ru' ? labels.ru : labels.en;
  };

  const selectedTemplate = templates.find(t => t.learningStyle === selectedStyle);

  const generateLesson = async () => {
    if (!selectedStyle || !selectedTemplate) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-lesson', {
        body: {
          topic: topic.title,
          level: 3,
          learningStyle: selectedStyle,
          language: language
        }
      });

      if (error) throw error;

      setGeneratedLesson(JSON.stringify(data, null, 2));
      toast.success(language === 'ru' ? 'Урок создан!' : 'Lesson generated!');
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast.error(language === 'ru' ? 'Ошибка создания урока' : 'Failed to generate lesson');
      // Show mock content for demo
      setGeneratedLesson(`
# ${topic.title} - ${getStyleLabel(selectedStyle)} Version

## Introduction
This is a personalized lesson generated for ${getStyleLabel(selectedStyle)} learning style.

## Key Concepts
- Concept 1: Tailored explanation for your learning style
- Concept 2: Examples designed for optimal retention
- Concept 3: Practice activities matching your preferences

## Interactive Section
[Content would be dynamically generated based on your learning style preferences]

## Summary
Key takeaways formatted for ${getStyleLabel(selectedStyle)} learners.
      `);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topic.title}: {t.title}</h2>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.selectStyle}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedStyle || ''}
            onValueChange={(value) => setSelectedStyle(value as LearningStyle)}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {templates.map((template) => (
              <div key={template.learningStyle}>
                <RadioGroupItem
                  value={template.learningStyle}
                  id={template.learningStyle}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={template.learningStyle}
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                    {styleIcons[template.learningStyle]}
                  </div>
                  <span className="font-medium text-center">
                    {getStyleLabel(template.learningStyle)}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {styleIcons[selectedStyle!]}
              {getStyleLabel(selectedStyle!)} {language === 'ru' ? 'Подход' : 'Approach'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">{t.approach}</h4>
                <p className="text-sm">{selectedTemplate.approach}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">{t.format}</h4>
                <p className="text-sm">{selectedTemplate.contentFormat}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">{t.pacing}</h4>
                <p className="text-sm">{selectedTemplate.pacing}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">{t.visualAids}</h4>
                <p className="text-sm">{selectedTemplate.visualAids}</p>
              </div>
            </div>

            <Button 
              onClick={generateLesson} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t.generate}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {language === 'ru' ? 'Созданный урок' : 'Generated Lesson'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                {generatedLesson}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
