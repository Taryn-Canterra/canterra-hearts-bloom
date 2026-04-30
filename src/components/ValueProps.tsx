import { Sparkles, Eye, Database } from "lucide-react";

const ITEMS = [
  {
    icon: Sparkles,
    eyebrow: "Computer vision",
    title: "It sees what the listing description misses.",
    body: "Our AI scans every photo and detects stalls, arenas, wash racks, round pens, and run-in sheds — even when the agent only wrote 'outbuildings, see remarks.'",
    stat: "47",
    statLabel: "equine features tagged per property",
  },
  {
    icon: Eye,
    eyebrow: "Equine vocabulary",
    title: "Search like a horse person, not a database.",
    body: "Type 'foaling stall' and find one — even when the listing says 'birthing pen.' Canterra speaks barn, paddock, and pasture fluently in three dialects.",
    stat: "300+",
    statLabel: "synonyms mapped to MLS fields",
  },
  {
    icon: Database,
    eyebrow: "Full MLS coverage",
    title: "Every active listing. Not the ones that paid to be here.",
    body: "Direct IDX feeds from REcolorado and Pikes Peak MLS. If it's on the market in Colorado, it's on Canterra — no pay-to-list directory, no missing inventory.",
    stat: "100%",
    statLabel: "of active CO horse properties",
  },
];

export const ValueProps = () => {
  return (
    <section id="how" className="border-y border-border/60 bg-card py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Why Canterra
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium leading-[1.1] text-primary md:text-5xl">
            Generic portals filter by acreage <span className="italic text-accent">and hope for a barn.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            We built Canterra because eight acres with a falling-down loafing shed isn't the same
            as eight acres with a six-stall center-aisle. Your search should know the difference.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3 md:gap-8">
          {ITEMS.map(({ icon: Icon, eyebrow, title, body }) => (
            <div
              key={title}
              className="group relative flex flex-col rounded-3xl border border-border/70 bg-background p-8 shadow-card transition-smooth hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-forest text-primary-foreground shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {eyebrow}
              </div>
              <h3 className="mt-2 font-display text-xl font-medium leading-snug text-primary">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
