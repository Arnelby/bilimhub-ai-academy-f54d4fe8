import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Construction } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Settings</h2>
        <p className="text-muted-foreground">Configure platform settings and preferences</p>
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
            <Settings className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Platform Settings
            </h3>
            <p className="text-muted-foreground max-w-md">
              Configure global platform settings, manage admin users, set up integrations,
              and customize the learning experience for your students.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
