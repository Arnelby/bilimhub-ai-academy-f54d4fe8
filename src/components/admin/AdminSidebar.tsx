import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookOpen,
  Database,
  FlaskConical,
  Route,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const mainMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Topics Manager', url: '/admin/topics', icon: BookOpen },
];

const futureMenuItems = [
  { title: 'AI Training Datasets', url: '/admin/datasets', icon: Database },
  { title: 'Adaptive Test Builder', url: '/admin/test-builder', icon: FlaskConical },
  { title: 'Learning Plan Constructor', url: '/admin/learning-plans', icon: Route },
  { title: 'Analytics Dashboard', url: '/admin/analytics', icon: BarChart3 },
];

const settingsMenuItems = [
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">BilimHub Admin</h2>
            <p className="text-xs text-muted-foreground">Content Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className="flex items-center gap-2"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Coming Soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {futureMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 opacity-60"
                      activeClassName="bg-accent text-accent-foreground opacity-100"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
