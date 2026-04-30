import { Search, BellRing, Compass } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Search the way you think.",
    body: "Filter by stalls, riding surface, water rights, or trail access — not just bedrooms and bathrooms. Use plain horse-person language; we handle the translation.",
  },
  {
    n: "02",
    icon: BellRing,
    title: "Save it. We'll watch the MLS.",
    body: "Drop your email and we'll email you the second a matching property hits the market. No daily refreshing, no paid alerts, no password to forget.",
  },
  {
    n: "03",
    icon: Compass,
    title: "Tour with someone who rides.",
    body: "Connect with a Horse & Hearth agent who knows the difference between a tack room and a feed room. They'll book the showing and walk the fenceline with you.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              How it works
            </span>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[1.1] text-primary md:text-5xl">
              Three steps. No spreadsheets.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            From "I wonder if anything's out there" to "we close Friday" — Canterra is built for
            the way horse buyers actually shop.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 transition-smooth hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated md:p-10"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-forest text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-display text-5xl font-medium text-primary/15 transition-colors group-hover:text-accent/40">
                  {n}
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-medium leading-tight text-primary">
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
