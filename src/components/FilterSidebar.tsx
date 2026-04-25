import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { FEATURE_LABELS, type EquineFeature } from "@/data/listings";
import { SlidersHorizontal } from "lucide-react";

export interface FilterState {
  minAcres: number;
  minStalls: number;
  priceMax: number;
  features: EquineFeature[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as EquineFeature[];

export const FilterSidebar = ({ filters, onChange, resultCount }: FilterSidebarProps) => {
  const toggleFeature = (f: EquineFeature) => {
    const has = filters.features.includes(f);
    onChange({
      ...filters,
      features: has ? filters.features.filter((x) => x !== f) : [...filters.features, f],
    });
  };

  const reset = () =>
    onChange({ minAcres: 0, minStalls: 0, priceMax: 5_000_000, features: [] });

  return (
    <aside className="space-y-7 rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <SlidersHorizontal className="h-4 w-4" />
          Refine
        </div>
        <button
          onClick={reset}
          className="text-xs font-medium uppercase tracking-wider text-accent hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-foreground">Acres</label>
          <span className="text-sm text-muted-foreground">{filters.minAcres}+ ac</span>
        </div>
        <Slider
          value={[filters.minAcres]}
          onValueChange={([v]) => onChange({ ...filters, minAcres: v })}
          min={0}
          max={50}
          step={1}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-foreground">Stalls</label>
          <span className="text-sm text-muted-foreground">{filters.minStalls}+ stalls</span>
        </div>
        <Slider
          value={[filters.minStalls]}
          onValueChange={([v]) => onChange({ ...filters, minStalls: v })}
          min={0}
          max={12}
          step={1}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-foreground">Max price</label>
          <span className="text-sm text-muted-foreground">
            ${(filters.priceMax / 1_000_000).toFixed(1)}M
          </span>
        </div>
        <Slider
          value={[filters.priceMax]}
          onValueChange={([v]) => onChange({ ...filters, priceMax: v })}
          min={500_000}
          max={5_000_000}
          step={50_000}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">Equine features</div>
        <div className="space-y-2.5">
          {ALL_FEATURES.map((f) => (
            <label
              key={f}
              className="flex cursor-pointer items-center gap-3 text-sm text-foreground/85"
            >
              <Checkbox
                checked={filters.features.includes(f)}
                onCheckedChange={() => toggleFeature(f)}
              />
              {FEATURE_LABELS[f]}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-5">
        <Button className="w-full" size="lg">
          Show {resultCount} {resultCount === 1 ? "property" : "properties"}
        </Button>
      </div>
    </aside>
  );
};
