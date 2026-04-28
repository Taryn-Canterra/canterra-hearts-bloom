import { Sparkles, Database, Eye, Bell } from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "100% IDX coverage",
    body: "Every active listing in REcolorado and Pikes Peak MLS — not a pay-to-list directory.",
  },
  {
    icon: Sparkles,
    title: "AI photo tagging",
    body: "Computer vision detects stalls, arenas, wash racks, and round pens — even when the listing description forgets to mention them.",
  },
  {
    icon: Eye,
    title: "Equine vocabulary",
    body: "Search 'foaling stall' or 'wash rack' and find them — even when the agent wrote 'birthing stall' or 'shower stall'.",
  },
  {
    icon: Bell,
    title: "Magic-link alerts",
    body: "Save a search, get an email the moment a match hits the MLS. No password to forget.",
  },
];

export const ValueProps = () => {
  return (
    <section id="how" className="border-y border-border/60 bg-card py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Why Canterra
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium text-primary md:text-5xl">
            Built for the way horse people actually search.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Generic portals filter by acreage and hope for a barn. Canterra knows the difference
            between a run-in shed and a foaling stall.
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/70 bg-background p-6 transition-smooth hover:border-accent/40 hover:shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-forest text-primary-foreground transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-medium text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
