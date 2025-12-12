import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { LessonData } from '@/hooks/useLessonData';
import { VideoEmbed } from '../storage/VideoEmbed';
import { BookOpen, Lightbulb, Calculator } from 'lucide-react';

interface BasicLessonTabProps {
  data: LessonData['basic_lesson'];
}

function getText(obj: { en: string; ru: string; kg: string } | string | undefined, lang: Language): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
}

function getRulesArray(rules: any, lang: Language): string[] {
  if (!rules) return [];
  if (rules[lang] && Array.isArray(rules[lang])) return rules[lang];
  if (Array.isArray(rules)) return rules.map((r: any) => getText(r, lang));
  return [];
}

function getTheoryText(data: any, lang: Language): string {
  if (data.theory) return getText(data.theory, lang);
  if (data.content) return getText(data.content, lang);
  return '';
}

function getExamples(data: any): any[] {
  return data.examples || data.worked_examples || [];
}

export function BasicLessonTab({ data }: BasicLessonTabProps) {
  const { language } = useLanguage();

  const t = {
    theory: language === 'ru' ? 'Теория' : language === 'kg' ? 'Теория' : 'Theory',
    definitions: language === 'ru' ? 'Определения' : language === 'kg' ? 'Аныктамалар' : 'Definitions',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    rules: language === 'ru' ? 'Правила' : language === 'kg' ? 'Эрежелер' : 'Rules',
    solution: language === 'ru' ? 'Решение' : language === 'kg' ? 'Чечим' : 'Solution',
    videoLesson: language === 'ru' ? 'Видео урок' : language === 'kg' ? 'Видео сабак' : 'Video Lesson',
  };

  const rulesArr = getRulesArray(data.rules, language);
  const examples = getExamples(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{getText(data.title, language)}</h2>
      </div>

      {data.video && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🎬 {t.videoLesson}</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoEmbed url={data.video} title={getText(data.title, language)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📚 {t.theory}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{getTheoryText(data, language)}</p>
        </CardContent>
      </Card>

      {data.definitions && data.definitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" /> {t.definitions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.definitions.map((def, idx) => (
              <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground">{getText(def.term, language)}</p>
                <p className="text-muted-foreground mt-1">{getText(def.definition, language)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rulesArr.length > 0 && (
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
      )}

      {examples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> {t.examples}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {examples.map((example: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <Badge variant="outline" className="mb-3">{t.examples} {idx + 1}</Badge>
                <h4 className="font-semibold text-foreground mb-2">{getText(example.title, language)}</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="text-foreground">{getText(example.problem, language)}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded">
                    <p className="text-sm font-medium text-primary mb-1">{t.solution}:</p>
                    <p className="text-foreground whitespace-pre-wrap">{getText(example.solution, language)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
