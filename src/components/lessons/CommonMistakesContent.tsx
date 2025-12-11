import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ImageIcon } from 'lucide-react';
import { CommonMistake } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommonMistakesContentProps {
  mistakes: CommonMistake[];
  topicTitle: string;
}

export function CommonMistakesContent({ mistakes, topicTitle }: CommonMistakesContentProps) {
  const { language } = useLanguage();

  const t = {
    title: language === 'ru' ? 'Частые ошибки' : language === 'kg' ? 'Жалпы каталар' : 'Common Mistakes',
    mistake: language === 'ru' ? 'Ошибка' : language === 'kg' ? 'Ката' : 'Mistake',
    why: language === 'ru' ? 'Почему это неправильно' : language === 'kg' ? 'Эмне үчүн туура эмес' : 'Why this is wrong',
    howToFix: language === 'ru' ? 'Как исправить' : language === 'kg' ? 'Кантип оңдоо' : 'How to fix',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topicTitle}: {t.title}</h2>
        <Badge variant="destructive">⚠️ {mistakes.length} {language === 'ru' ? 'ошибок' : 'mistakes'}</Badge>
      </div>

      <div className="space-y-6">
        {mistakes.map((mistake, index) => (
          <Card key={mistake.id} className="overflow-hidden border-destructive/30">
            <CardHeader className="bg-destructive/5 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-destructive uppercase">{t.mistake}</span>
                  </div>
                  <CardTitle className="text-lg text-destructive">{mistake.mistake}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Why it's wrong */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t.why}:</h4>
                <p className="text-foreground">{mistake.explanation}</p>
              </div>

              {/* Image Placeholder */}
              {mistake.imagePlaceholder && (
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center bg-muted/20">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{mistake.imagePlaceholder}</p>
                </div>
              )}

              {/* How to fix */}
              <div className="bg-success/5 border border-success/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <h4 className="text-sm font-semibold text-success">{t.howToFix}:</h4>
                </div>
                <ul className="space-y-2">
                  {mistake.fix.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 text-success text-xs flex items-center justify-center font-medium">
                        {stepIndex + 1}
                      </span>
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
