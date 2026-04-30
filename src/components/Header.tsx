import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { User, Briefcase, Store } from "lucide-react";

export const Header = () => {
  const { user, isAgent, isAdmin, isClient, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const dashboardHref = isAgent || isAdmin ? "/dashboard" : isClient ? "/portal" : "/dashboard";
  const dashboardLabel = isClient && !isAgent && !isAdmin ? "Client portal" : "Dashboard";

  const signInOptions = [
    {
      label: "Client sign in",
      description: "Saved searches, collections, and your buying portal.",
      href: "/auth?role=client",
      icon: User,
    },
    {
      label: "Agent sign in",
      description: "Your dashboard, deals, leads, and listing tools.",
      href: "/auth?role=agent",
      icon: Briefcase,
    },
    {
      label: "Vendor sign in",
      description: "Manage your vendor profile and inquiries.",
      href: "/auth?role=vendor",
      icon: Store,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-primary">
            Canterra
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            Horse Properties
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#search" className="text-foreground/80 transition-colors hover:text-primary">
            Search
          </a>
          <a href="#how" className="text-foreground/80 transition-colors hover:text-primary">
            How it works
          </a>
          <Link to="/vendors" className="text-foreground/80 transition-colors hover:text-primary">
            Vendors
          </Link>
          <a href="#agents" className="text-foreground/80 transition-colors hover:text-primary">
            For agents
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to={dashboardHref}>
                <Button variant="ghost" size="sm">
                  {dashboardLabel}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Sign in</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sign in to Canterra</DialogTitle>
                  <DialogDescription>
                    Choose the account type that fits how you use Canterra.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 flex flex-col gap-2">
                  {signInOptions.map(({ label, description, href, icon: Icon }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={() => setSignInOpen(false)}
                      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
};

