import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
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
          <a href="#vendors" className="text-foreground/80 transition-colors hover:text-primary">
            Vendors
          </a>
          <a href="#agents" className="text-foreground/80 transition-colors hover:text-primary">
            For agents
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Agent sign in
            </Button>
          </Link>
          <Button size="sm" asChild>
            <a href="#search">Save searches</a>
          </Button>
        </div>
      </div>
    </header>
  );
};
