import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Construction } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Monitor student performance and platform usage</p>
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
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-muted-foreground max-w-md">
              View comprehensive analytics on student performance, topic mastery rates,
              test completion statistics, and engagement metrics across the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
