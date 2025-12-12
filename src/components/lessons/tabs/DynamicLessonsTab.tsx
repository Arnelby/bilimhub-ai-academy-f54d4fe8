import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { LessonData } from '@/hooks/useLessonData';
import { Sparkles, Eye, Ear, BookOpen, Puzzle, Zap } from 'lucide-react';

interface DynamicLessonsTabProps {
  data: LessonData['dynamic_lessons'];
}

function getText(obj: { en: string; ru: string; kg: string } | string | undefined, lang: Language): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
}

type LearningStyle = 'visual' | 'auditory' | 'text-based' | 'problem-solver' | 'adhd-friendly';

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  visual: <Eye className="h-5 w-5" />,
  auditory: <Ear className="h-5 w-5" />,
  'text-based': <BookOpen className="h-5 w-5" />,
  'problem-solver': <Puzzle className="h-5 w-5" />,
  'adhd-friendly': <Zap className="h-5 w-5" />,
};

export function DynamicLessonsTab({ data }: DynamicLessonsTabProps) {
  const { language } = useLanguage();
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(null);

  const t = {
    title: language === 'ru' ? 'Динамический урок (AI)' : language === 'kg' ? 'Динамикалык сабак (AI)' : 'Dynamic Lesson (AI)',
    selectStyle: language === 'ru' ? 'Выберите стиль обучения' : language === 'kg' ? 'Окуу стилин тандаңыз' : 'Select Your Learning Style',
    visual: language === 'ru' ? 'Визуальный' : language === 'kg' ? 'Визуалдык' : 'Visual',
    auditory: language === 'ru' ? 'Аудиальный' : language === 'kg' ? 'Аудиалдык' : 'Auditory',
    'text-based': language === 'ru' ? 'Текстовый' : language === 'kg' ? 'Тексттик' : 'Text-based',
    'problem-solver': language === 'ru' ? 'Практический' : language === 'kg' ? 'Практикалык' : 'Problem-solver',
    'adhd-friendly': language === 'ru' ? 'СДВГ-дружественный' : language === 'kg' ? 'ADHD-достук' : 'ADHD-friendly',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    changeStyle: language === 'ru' ? 'Изменить стиль' : language === 'kg' ? 'Стилди өзгөртүү' : 'Change Style',
  };

  const styleDescriptions: Record<LearningStyle, string> = {
    visual: language === 'ru' 
      ? 'Обучение через изображения, диаграммы и визуальные представления' 
      : language === 'kg' 
        ? 'Сүрөттөр, диаграммалар жана визуалдык элементтер аркылуу окуу'
        : 'Learning through images, diagrams, and visual representations',
    auditory: language === 'ru'
      ? 'Обучение через прослушивание и обсуждение'
      : language === 'kg'
        ? 'Угуу жана талкуулоо аркылуу окуу'
        : 'Learning through listening and discussion',
    'text-based': language === 'ru'
      ? 'Обучение через чтение и письменные материалы'
      : language === 'kg'
        ? 'Окуу жана жазуу материалдары аркылуу окуу'
        : 'Learning through reading and written materials',
    'problem-solver': language === 'ru'
      ? 'Обучение через решение задач и практику'
      : language === 'kg'
        ? 'Маселе чечүү жана практика аркылуу окуу'
        : 'Learning through problem-solving and hands-on practice',
    'adhd-friendly': language === 'ru'
      ? 'Короткие уроки с частыми перерывами и интерактивными элементами'
      : language === 'kg'
        ? 'Кыска сабактар, тез-тез тыныгуу жана интерактивдик элементтер'
        : 'Short lessons with frequent breaks and interactive elements',
  };

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {language === 'ru' ? 'Динамические уроки пока не добавлены' : language === 'kg' ? 'Динамикалык сабактар жок' : 'No dynamic lessons available yet'}
      </div>
    );
  }

  const styles: LearningStyle[] = ['visual', 'auditory', 'text-based', 'problem-solver', 'adhd-friendly'];
  const selectedLesson = selectedStyle ? data[selectedStyle] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-purple-500/20">
          AI Personalized
        </Badge>
      </div>

      {!selectedStyle ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.selectStyle}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              onValueChange={(value) => setSelectedStyle(value as LearningStyle)}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {styles.map((style) => (
                <div key={style}>
                  <RadioGroupItem
                    value={style}
                    id={style}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={style}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary">
                      {styleIcons[style]}
                    </div>
                    <span className="text-lg font-semibold mb-2">{t[style]}</span>
                    <span className="text-sm text-muted-foreground text-center">
                      {styleDescriptions[style]}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ) : selectedLesson ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {styleIcons[selectedStyle]}
              </div>
              <div>
                <h3 className="font-semibold">{getText(selectedLesson.title, language)}</h3>
                <p className="text-sm text-muted-foreground">{t[selectedStyle]}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedStyle(null)}>
              {t.changeStyle}
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-lg">
                  {getText(selectedLesson.content, language)}
                </p>
              </div>
            </CardContent>
          </Card>

          {selectedLesson.examples && selectedLesson.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.examples}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLesson.examples.map((example, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      {language === 'ru' ? 'Пример' : language === 'kg' ? 'Мисал' : 'Example'} {idx + 1}
                    </Badge>
                    <p className="text-foreground whitespace-pre-wrap">{getText(example, language)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
