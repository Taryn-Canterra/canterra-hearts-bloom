import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { FilterSidebar } from "./FilterSidebar";
import { ListingCard } from "./ListingCard";

export const SearchResults = () => {
  const filters = useSearchFilters();
  const [sort, setSort] = useState<"newest" | "price_low" | "price_high" | "acres">("newest");
  const { listings, loading, usingMock } = useProperties();

  const filtered = useMemo(() => {
    const loc = filters.location.trim().toLowerCase();
    const result = listings.filter((l) => {
      if (l.acres < filters.minAcres) return false;
      if (l.stalls < filters.minStalls) return false;
      if (l.price > filters.priceMax) return false;
      if (!filters.features.every((f) => l.features.includes(f))) return false;
      if (loc) {
        const hay = `${l.city} ${l.county} ${l.address}`.toLowerCase();
        if (!hay.includes(loc)) return false;
      }
      return true;
    });
    return [...result].sort((a, b) => {
      switch (sort) {
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "acres":
          return b.acres - a.acres;
        default:
          return a.daysOnMarket - b.daysOnMarket;
      }
    });
  }, [filters, sort, listings]);

  return (
    <section id="search" className="bg-gradient-warm py-12 md:py-16">
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Active inventory
            </span>
            <h2 className="mt-2 font-display text-4xl font-medium text-primary md:text-5xl">
              Colorado horse properties
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Every active MLS listing — pulled via IDX, photo-tagged by AI for the features that
              matter to equine buyers.
            </p>
            {usingMock && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" />
                Showing seed data — connect IDX feed to load live MLS
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-transparent font-medium text-primary outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="acres">Most acres</option>
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <FilterSidebar resultCount={filtered.length} />
          <div>
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-2xl bg-card/60"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
                <p className="font-display text-xl text-primary">No properties match yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try widening acreage or removing a feature.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filtered.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
