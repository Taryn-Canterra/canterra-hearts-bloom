const STATS = [
  { value: "12,000+", label: "Colorado horse properties indexed" },
  { value: "47", label: "Equine features tagged per listing" },
  { value: "2", label: "MLS feeds, fully covered" },
  { value: "<5 min", label: "From MLS to your inbox" },
];

export const ProofBand = () => {
  return (
    <section className="border-y border-border/60 bg-gradient-warm py-16 md:py-20">
      <div className="container">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-x-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center md:border-r md:border-border/60 md:px-4 md:last:border-r-0">
              <div className="font-display text-4xl font-medium text-primary md:text-5xl">
                {value}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Built by <span className="font-medium text-primary">Horse &amp; Hearth Group</span> at eXp Realty —
          horse owners, riders, and licensed Colorado agents.
        </p>
      </div>
    </section>
  );
};
