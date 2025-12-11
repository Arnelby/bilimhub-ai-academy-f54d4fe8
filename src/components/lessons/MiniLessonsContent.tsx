import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Video, Lightbulb } from 'lucide-react';
import { MiniLessonContent } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface MiniLessonsContentProps {
  lessons: MiniLessonContent[];
  topicTitle: string;
}

export function MiniLessonsContent({ lessons, topicTitle }: MiniLessonsContentProps) {
  const { language } = useLanguage();

  const t = {
    title: language === 'ru' ? 'Мини-уроки' : language === 'kg' ? 'Мини сабактар' : 'Mini Lessons',
    concept: language === 'ru' ? 'Концепция' : language === 'kg' ? 'Концепция' : 'Concept',
    keyTakeaway: language === 'ru' ? 'Главное' : language === 'kg' ? 'Негизгиси' : 'Key Takeaway',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topicTitle}: {t.title}</h2>
        <Badge variant="secondary">⚡ {lessons.length} {language === 'ru' ? 'уроков' : 'lessons'}</Badge>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson, index) => (
          <Card key={lesson.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{t.concept}: {lesson.concept}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{lesson.explanation}</p>
              
              {/* Video Placeholder */}
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/20">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{lesson.videoPlaceholder}</p>
              </div>

              {/* Key Takeaway */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                <Lightbulb className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-warning">{t.keyTakeaway}</p>
                  <p className="text-sm text-foreground mt-1">{lesson.keyTakeaway}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
