import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  searchFiltersStore,
  useSearchFilters,
  ARENA_LABELS,
  FACILITY_LABELS,
  VIEW_LABELS,
  type ArenaType,
  type FacilityType,
  type ViewType,
} from "@/hooks/useSearchFilters";
import { Checkbox } from "@/components/ui/checkbox";

type FeatureGroup = {
  title: string;
  items: { key: string; label: string; type: "arena" | "facility" | "view" | "toggle" }[];
};

const GROUPS: FeatureGroup[] = [
  {
    title: "Arena",
    items: (Object.keys(ARENA_LABELS) as ArenaType[]).map((k) => ({
      key: k,
      label: ARENA_LABELS[k],
      type: "arena",
    })),
  },
  {
    title: "Facilities",
    items: (Object.keys(FACILITY_LABELS) as FacilityType[]).map((k) => ({
      key: k,
      label: FACILITY_LABELS[k],
      type: "facility",
    })),
  },
  {
    title: "Land",
    items: [
      { key: "irrigated", label: "Irrigated acreage", type: "toggle" },
      { key: "hayProduction", label: "Hay production", type: "toggle" },
      { key: "waterRights", label: "Water rights", type: "toggle" },
      { key: "hunting", label: "Hunting / GMU access", type: "toggle" },
    ],
  },
  {
    title: "Views",
    items: (Object.keys(VIEW_LABELS) as ViewType[]).map((k) => ({
      key: k,
      label: VIEW_LABELS[k],
      type: "view",
    })),
  },
];

export const SearchBar = () => {
  const filters = useSearchFilters();

  const isChecked = (type: string, key: string) => {
    if (type === "arena") return filters.arenaTypes.includes(key as ArenaType);
    if (type === "facility") return filters.facilities.includes(key as FacilityType);
    if (type === "view") return filters.views.includes(key as ViewType);
    if (type === "toggle") return Boolean((filters as any)[key]);
    return false;
  };

  const toggle = (type: string, key: string) => {
    if (type === "arena") {
      const arr = filters.arenaTypes;
      searchFiltersStore.set({
        arenaTypes: arr.includes(key as ArenaType)
          ? arr.filter((x) => x !== key)
          : [...arr, key as ArenaType],
      });
    } else if (type === "facility") {
      const arr = filters.facilities;
      searchFiltersStore.set({
        facilities: arr.includes(key as FacilityType)
          ? arr.filter((x) => x !== key)
          : [...arr, key as FacilityType],
      });
    } else if (type === "view") {
      const arr = filters.views;
      searchFiltersStore.set({
        views: arr.includes(key as ViewType)
          ? arr.filter((x) => x !== key)
          : [...arr, key as ViewType],
      });
    } else if (type === "toggle") {
      searchFiltersStore.set({ [key]: !(filters as any)[key] } as any);
    }
  };

  const selectedCount =
    filters.arenaTypes.length +
    filters.facilities.length +
    filters.views.length +
    ["irrigated", "hayProduction", "waterRights", "hunting"].filter(
      (k) => (filters as any)[k]
    ).length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-border/40 bg-card/95 p-3 shadow-elevated backdrop-blur-md md:grid-cols-[1.5fr_1.25fr_auto]"
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

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/60"
          >
            <Check className="h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Equine features
              </div>
              <div className="truncate text-sm font-medium text-foreground">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : "Any features"}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-50 w-[min(92vw,28rem)] max-h-[70vh] overflow-y-auto bg-popover p-0"
        >
          <div className="p-4 space-y-4">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60"
                    >
                      <Checkbox
                        checked={isChecked(item.type, item.key)}
                        onCheckedChange={() => toggle(item.type, item.key)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {selectedCount > 0 && (
              <div className="flex justify-end border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    searchFiltersStore.set({
                      arenaTypes: [],
                      facilities: [],
                      views: [],
                      irrigated: false,
                      hayProduction: false,
                      waterRights: false,
                      hunting: false,
                    })
                  }
                  className="text-xs font-medium uppercase tracking-wider text-accent hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button type="submit" size="lg" className="h-auto rounded-xl px-6">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  );
};
