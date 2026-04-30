import { Sparkles, Eye, Bell, Database } from "lucide-react";

const ROWS = [
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
  {
    icon: Bell,
    eyebrow: "Magic-link alerts",
    title: "Be the first call your agent gets to make.",
    body: "Save a search, get an email the moment a match hits the MLS. No password to forget, no daily refresh — the right barn finds you.",
    stat: "<5min",
    statLabel: "from MLS to your inbox",
  },
];

export const ValueProps = () => {
  return (
    <section id="how" className="border-y border-border/60 bg-card py-24 md:py-32">
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

        <div className="mt-20 space-y-20 md:space-y-28">
          {ROWS.map(({ icon: Icon, eyebrow, title, body, stat, statLabel }, idx) => (
            <div
              key={title}
              className={`grid items-center gap-10 md:grid-cols-12 md:gap-16 ${
                idx % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="md:col-span-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-forest text-primary-foreground shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {eyebrow}
                </div>
                <h3 className="mt-3 font-display text-3xl font-medium leading-[1.15] text-primary md:text-4xl">
                  {title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
              </div>
              <div className="md:col-span-7">
                <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background p-10 shadow-card md:p-14">
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-forest opacity-[0.06] blur-2xl" />
                  <div className="relative">
                    <div className="font-display text-7xl font-medium leading-none text-primary md:text-8xl">
                      {stat}
                    </div>
                    <div className="mt-4 max-w-xs text-sm uppercase tracking-[0.18em] text-muted-foreground">
                      {statLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
