import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Construction } from 'lucide-react';

export default function DatasetManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Training Datasets</h2>
        <p className="text-muted-foreground">Manage datasets for AI model fine-tuning</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            This feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              AI Training Dataset Manager
            </h3>
            <p className="text-muted-foreground max-w-md">
              Soon you'll be able to create, manage, and export training datasets for fine-tuning
              AI models. This will enable personalized content generation for different learning styles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
