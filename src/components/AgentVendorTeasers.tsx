import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export const AgentVendorTeasers = () => {
  return (
    <section id="agents" className="bg-background py-24 md:py-32">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Agents */}
          <Link
            to="/auth"
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-primary p-10 text-primary-foreground transition-smooth hover:-translate-y-1 hover:shadow-elevated md:p-14"
          >
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-accent/30 blur-3xl transition-opacity group-hover:opacity-80" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
                For agents
              </span>
              <h3 className="mt-4 font-display text-3xl font-medium leading-[1.15] md:text-4xl">
                Stop competing on Zestimates. <span className="italic">Compete on horse sense.</span>
              </h3>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Claim your equine listings, run AI-powered property intelligence, and route warm
                buyer leads matched to the barns you already know.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium">
                Join the agent platform
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>

          {/* Vendors */}
          <Link
            to="/vendors"
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 transition-smooth hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated md:p-14"
          >
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-gradient-forest opacity-[0.08] blur-3xl" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                For new owners
              </span>
              <h3 className="mt-4 font-display text-3xl font-medium leading-[1.15] text-primary md:text-4xl">
                A vendor network for the <span className="italic">first 90 days.</span>
              </h3>
              <p className="mt-4 max-w-md text-muted-foreground">
                Vetted farriers, hay suppliers, large-animal vets, fencing crews, and trainers —
                the people every new horse property owner needs in their phone by week two.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Browse the network
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
