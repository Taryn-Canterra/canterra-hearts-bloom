import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchFiltersStore, useSearchFilters } from "@/hooks/useSearchFilters";

export const SearchBar = () => {
  const filters = useSearchFilters();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-border/40 bg-card/95 p-3 shadow-elevated backdrop-blur-md md:grid-cols-[1.5fr_1fr_1fr_auto]"
    >
      <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/60">
        <MapPin className="h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Location
          </div>
          <input
            value={filters.location}
            onChange={(e) => searchFiltersStore.set({ location: e.target.value })}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="City, county, or ZIP"
          />
        </div>
      </label>
      <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/60">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Min acres
          </div>
          <select
            value={filters.minAcres}
            onChange={(e) => searchFiltersStore.set({ minAcres: Number(e.target.value) })}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
          >
            <option value="0">Any acres</option>
            <option value="2">2+ acres</option>
            <option value="5">5+ acres</option>
            <option value="10">10+ acres</option>
            <option value="20">20+ acres</option>
            <option value="40">40+ acres</option>
          </select>
        </div>
      </label>
      <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/60">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stalls
          </div>
          <select
            value={filters.minStalls}
            onChange={(e) => searchFiltersStore.set({ minStalls: Number(e.target.value) })}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
          >
            <option value="0">Any stalls</option>
            <option value="2">2+ stalls</option>
            <option value="4">4+ stalls</option>
            <option value="6">6+ stalls</option>
            <option value="8">8+ stalls</option>
            <option value="10">10+ stalls</option>
          </select>
        </div>
      </label>
      <Button type="submit" size="lg" className="h-auto rounded-xl px-6">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  );
};
