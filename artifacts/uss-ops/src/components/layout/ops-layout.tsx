import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  ClipboardList, 
  Calendar,
  Box,
  BarChart,
  Settings,
  LogOut,
  Menu,
  Activity,
  CheckSquare
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/ops/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/ops/customers", icon: Users },
  { title: "Projects", url: "/ops/projects", icon: Briefcase },
  { title: "Diagnoses", url: "/ops/diagnosis", icon: CheckSquare },
  { title: "Schedule", url: "/ops/schedule", icon: Calendar },
  { title: "Jobsheets", url: "/ops/jobsheets", icon: ClipboardList },
  { title: "Invoices", url: "/ops/invoices", icon: FileText },
  { title: "Materials", url: "/ops/materials", icon: Box },
  { title: "Activity", url: "/ops/activity", icon: Activity },
  { title: "Reports", url: "/ops/reports", icon: BarChart },
  { title: "Settings", url: "/ops/settings", icon: Settings },
];

export function OpsLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    setLocation("/ops/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-14 flex items-center px-4">
            <div className="font-bold text-lg text-sidebar-primary-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-sidebar-ring flex items-center justify-center text-sidebar-foreground text-xs">U</div>
              <span className="truncate">USS OPS</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || location.startsWith(item.url + "/")}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-col flex overflow-hidden">
                <span className="text-sm font-medium truncate text-sidebar-foreground">{user?.firstName} {user?.lastName}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.role}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {navItems.find(i => location.startsWith(i.url))?.title || "Dashboard"}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
