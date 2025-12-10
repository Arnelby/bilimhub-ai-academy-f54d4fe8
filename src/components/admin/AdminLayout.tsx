import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
