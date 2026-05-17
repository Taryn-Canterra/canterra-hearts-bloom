import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { User, Briefcase, Store, Menu } from "lucide-react";

export const Header = () => {
  const { user, isAgent, isAdmin, isClient, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const dashboardHref = isAgent || isAdmin ? "/dashboard" : isClient ? "/portal" : "/dashboard";
  const dashboardLabel = isClient && !isAgent && !isAdmin ? "Client portal" : "Dashboard";

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  const mobileNavLinks = (
    <>
      <button
        onClick={() => { setMobileOpen(false); scrollToSection('search'); }}
        className="text-left text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        Search
      </button>
      <button
        onClick={() => { setMobileOpen(false); scrollToSection('how'); }}
        className="text-left text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        How it works
      </button>
      <Link
        to="/vendors"
        onClick={() => setMobileOpen(false)}
        className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        Vendors
      </Link>
      <button
        onClick={() => { setMobileOpen(false); scrollToSection('agents'); }}
        className="text-left text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
      >
        For agents
      </button>
    </>
  );

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
          <button onClick={() => scrollToSection('search')} className="text-foreground/80 transition-colors hover:text-primary">
            Search
          </button>
          <button onClick={() => scrollToSection('how')} className="text-foreground/80 transition-colors hover:text-primary">
            How it works
          </button>
          <Link to="/vendors" className="text-foreground/80 transition-colors hover:text-primary">
            Vendors
          </Link>
          <button onClick={() => scrollToSection('agents')} className="text-foreground/80 transition-colors hover:text-primary">
            For agents
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-6">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold tracking-tight text-primary">
                  Canterra
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Horse Properties
                </span>
              </Link>
              <nav className="flex flex-col gap-4">
                {mobileNavLinks}
              </nav>
              <Separator />
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link to={dashboardHref} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      {dashboardLabel}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); signOut(); }}>
                    Sign out
                  </Button>
                </div>
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
            </SheetContent>
          </Sheet>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2">
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
      </div>
    </header>
  );
};

