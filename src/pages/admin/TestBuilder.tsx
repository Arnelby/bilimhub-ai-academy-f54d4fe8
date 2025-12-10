import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Construction } from 'lucide-react';

export default function TestBuilder() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Adaptive Test Builder</h2>
        <p className="text-muted-foreground">Create and configure adaptive tests</p>
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
            <FlaskConical className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Adaptive Test Builder
            </h3>
            <p className="text-muted-foreground max-w-md">
              Create custom adaptive tests with dynamic difficulty scaling, question pools,
              and AI-powered analysis. Configure tests for different subjects and learning objectives.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
