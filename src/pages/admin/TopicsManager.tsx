import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Construction } from 'lucide-react';

export default function TopicsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Управление темами</h2>
        <p className="text-muted-foreground">Управление учебным контентом</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            В разработке
          </CardTitle>
          <CardDescription>
            Темы управляются напрямую через базу данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground max-w-md">
              Учебные темы настроены в таблице topics. 
              Используйте Lovable Cloud для управления данными.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
