import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Box,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  ClipboardCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  ReceiptText,
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
import ussLogo from "@/assets/uss-logo.png";

type NavItem = {
  title: string;
  description: string;
  url: string;
  icon: React.ElementType;
  matchPrefixes?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        description: "Your ultimate source of business",
        url: "/ops/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "CUSTOMERS & LEADS",
    items: [
      {
        title: "Leads / Customers",
        description: "Manage leads & customers",
        url: "/ops/customers",
        icon: Users,
      },
      {
        title: "Site Visits",
        description: "Schedule & track visits",
        url: "/ops/jobsheets",
        icon: MapPin,
      },
    ],
  },
  {
    label: "WORK",
    items: [
      {
        title: "Estimates",
        description: "Create & send estimates",
        url: "/ops/diagnosis",
        icon: ClipboardCheck,
      },
      {
        title: "Projects",
        description: "Manage jobs & progress",
        url: "/ops/projects",
        icon: Briefcase,
      },
      {
        title: "Invoices",
        description: "Send & track payments",
        url: "/ops/invoices",
        icon: ReceiptText,
        matchPrefixes: ["/ops/invoices", "/ops/payments"],
      },
      {
        title: "Schedule",
        description: "Calendar & appointments",
        url: "/ops/schedule",
        icon: Calendar,
        matchPrefixes: ["/ops/schedule", "/ops/jobs"],
      },
      {
        title: "Materials",
        description: "Inventory & supplies",
        url: "/ops/materials",
        icon: Box,
        matchPrefixes: ["/ops/materials", "/ops/inventory"],
      },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        title: "Reports",
        description: "Business insights & stats",
        url: "/ops/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      {
        title: "Settings",
        description: "Preferences & users",
        url: "/ops/settings",
        icon: Settings,
      },
    ],
  },
];

function isItemActive(item: NavItem, location: string): boolean {
  const prefixes = item.matchPrefixes ?? [item.url];
  return prefixes.some(
    (p) => location === p || location.startsWith(p + "/"),
  );
}

function findCurrentTitle(location: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isItemActive(item, location)) return item.title;
    }
  }
  return "Dashboard";
}

export function OpsLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    setLocation("/ops/login");
  };

  const currentTitle = findCurrentTitle(location);
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "JD";
  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "John Doe";
  const role = user?.role ?? "Administrator";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14rem",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="px-4 pt-5 pb-3 border-b border-sidebar-border">
            <Link
              href="/ops/dashboard"
              className="flex items-center justify-center"
              data-testid="link-sidebar-logo"
            >
              <img
                src={ussLogo}
                alt="USS — Ultimate Stain & Seal"
                className="h-14 w-auto object-contain"
              />
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 py-2 gap-1">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase px-3 h-6">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item, location);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            className="h-auto py-1.5 px-3 rounded-md group-data-[collapsible=icon]:justify-center"
                            tooltip={item.title}
                          >
                            <Link
                              href={item.url}
                              data-testid={`link-nav-${item.title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")}`}
                              className="flex items-start gap-3"
                            >
                              <item.icon className="mt-0.5 shrink-0" />
                              <span className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                                <span className="text-sm font-medium leading-tight truncate w-full">
                                  {item.title}
                                </span>
                                <span
                                  className={`text-[11px] leading-tight truncate w-full ${
                                    active
                                      ? "text-sidebar-accent-foreground/80"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:hidden">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">(000) 000-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">info@yourdomain.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">www.yourdomain.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">Your City, State ZIP</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b border-border bg-card flex items-center gap-4 px-4 md:px-6 shrink-0">
            <SidebarTrigger className="md:hidden" data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                USS OpS
              </h1>
              <span className="hidden lg:inline text-sm text-muted-foreground truncate">
                · {currentTitle}
              </span>
            </div>

            <div className="flex-1 max-w-xl mx-auto hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search customers, projects, invoices..."
                  className="pl-9 pr-14 h-9 bg-background"
                  data-testid="input-global-search"
                />
                <kbd className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                className="relative h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Notifications"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4 text-foreground" />
                <Badge
                  variant="default"
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full bg-accent text-accent-foreground border-0"
                >
                  3
                </Badge>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-muted transition-colors"
                    data-testid="button-user-menu"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-medium text-foreground">
                        {fullName}
                      </span>
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {role}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email ?? "—"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/ops/settings" data-testid="link-menu-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
