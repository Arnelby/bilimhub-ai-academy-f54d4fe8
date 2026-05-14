import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Construction } from 'lucide-react';

export default function TopicsManager() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('adminTopics.heading')}</h2>
        <p className="text-muted-foreground">{t('adminTopics.subheading')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            {t('adminTopics.comingSoon')}
          </CardTitle>
          <CardDescription>{t('adminTopics.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground max-w-md">{t('adminTopics.details')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
