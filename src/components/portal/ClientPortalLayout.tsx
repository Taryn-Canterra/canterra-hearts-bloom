import { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { LogOut, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const ClientPortalLayout = ({ children }: { children: ReactNode }) => {
  const { session, loading, user, isClient, isAgent, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  // If user is an agent/admin (not a client) accidentally landing here, send them to dashboard
  if (!isClient && (isAgent || isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/portal" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-primary">Canterra</span>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:inline">Client Portal</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-muted-foreground">{user?.email}</span>
            <Link to="/" className="text-muted-foreground hover:text-primary"><Home className="h-4 w-4" /></Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
};
