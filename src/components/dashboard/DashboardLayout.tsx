import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Inbox, Briefcase, LogOut, Home, Sparkles, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Leads", url: "/dashboard/leads", icon: Inbox },
  { title: "Deals", url: "/dashboard/deals", icon: Briefcase },
  { title: "AI tools", url: "/dashboard/ai-tools", icon: Sparkles },
  { title: "Vendors", url: "/vendors", icon: Store },
];

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { session, loading, user, isAdmin, isAgent, isClient, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  // Clients without agent/admin role get redirected to their portal
  if (isClient && !isAgent && !isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="px-4 py-5">
              <span className="font-display text-xl font-semibold text-primary">Canterra</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Agent Portal</p>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.end} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-3 space-y-2">
            <NavLink to="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
              <Home className="mr-2 h-4 w-4" /> Public site
            </NavLink>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <div className="ml-4 text-sm">
              <span className="text-muted-foreground">Signed in as</span>{" "}
              <span className="font-medium">{user?.email}</span>
              {isAdmin && <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground rounded">Admin</span>}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
