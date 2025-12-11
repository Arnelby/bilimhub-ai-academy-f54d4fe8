import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, FileText, GitBranch, ListOrdered } from 'lucide-react';
import { DiagramContent } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface DiagramsContentProps {
  diagrams: DiagramContent[];
  topicTitle: string;
}

const typeIcons = {
  'cheat-sheet': FileText,
  'flowchart': GitBranch,
  'step-diagram': ListOrdered,
};

const typeLabels = {
  'cheat-sheet': { en: 'Cheat Sheet', ru: 'Шпаргалка', kg: 'Шпаргалка' },
  'flowchart': { en: 'Flowchart', ru: 'Блок-схема', kg: 'Блок-схема' },
  'step-diagram': { en: 'Step Diagram', ru: 'Пошаговая схема', kg: 'Кадам схемасы' },
};

export function DiagramsContent({ diagrams, topicTitle }: DiagramsContentProps) {
  const { language } = useLanguage();

  const t = {
    title: language === 'ru' ? 'Диаграммы и схемы' : language === 'kg' ? 'Диаграммалар жана схемалар' : 'Diagrams & Visual Schemes',
  };

  const getTypeLabel = (type: DiagramContent['type']) => {
    const labels = typeLabels[type];
    return language === 'kg' ? labels.kg : language === 'ru' ? labels.ru : labels.en;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topicTitle}: {t.title}</h2>
        <Badge variant="secondary">📊 {diagrams.length}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {diagrams.map((diagram) => {
          const Icon = typeIcons[diagram.type];
          return (
            <Card key={diagram.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(diagram.type)}
                  </Badge>
                </div>
                <CardTitle className="text-base">{diagram.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{diagram.description}</p>
                
                {/* Image Placeholder */}
                <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center bg-muted/20 aspect-video flex flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground px-4">{diagram.imagePlaceholder}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
