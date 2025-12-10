import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, Construction } from 'lucide-react';

export default function LearningPlanConstructor() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Learning Plan Constructor</h2>
        <p className="text-muted-foreground">Design personalized learning paths</p>
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
            <Route className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Learning Plan Constructor
            </h3>
            <p className="text-muted-foreground max-w-md">
              Build custom learning plans with topic sequencing, prerequisite mapping,
              and milestone tracking. Create templates for different student profiles and goals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
