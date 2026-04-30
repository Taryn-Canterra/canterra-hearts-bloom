import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, SlidersHorizontal, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  searchFiltersStore,
  useSearchFilters,
  ALL_STATES,
  CO_COUNTIES,
  ARENA_LABELS,
  FENCING_LABELS,
  FACILITY_LABELS,
  VIEW_LABELS,
  STATUS_LABELS,
  type ArenaType,
  type FencingType,
  type FacilityType,
  type ViewType,
  type ListingStatus,
} from "@/hooks/useSearchFilters";

interface Props { resultCount: number }

const formatPrice = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

export const FilterSidebar = ({ resultCount }: Props) => {
  const filters = useSearchFilters();
  const { user } = useAuth();
  const [showSave, setShowSave] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleArr = <T extends string>(key: keyof typeof filters, val: T) => {
    const arr = (filters as any)[key] as T[];
    const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
    searchFiltersStore.set({ [key]: next } as any);
  };

  const saveSearch = async () => {
    if (!user) {
      toast("Sign in to save searches", { description: "Free account, takes 10 seconds." });
      return;
    }
    if (!searchName.trim()) { toast.error("Give your search a name"); return; }
    setSaving(true);
    const { error } = await supabase.from("user_saved_searches").insert({
      user_id: user.id,
      name: searchName.trim(),
      filters: filters as any,
      alert_enabled: alertEnabled,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Search saved", { description: alertEnabled ? "We'll email you new matches." : "" });
    setShowSave(false);
    setSearchName("");
  };

  return (
    <aside className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 shadow-soft lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <SlidersHorizontal className="h-4 w-4" /> Refine
        </div>
        <button
          onClick={() => searchFiltersStore.reset()}
          className="text-xs font-medium uppercase tracking-wider text-accent hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Price */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-foreground">Price</label>
          <span className="text-xs text-muted-foreground">
            {formatPrice(filters.priceMin)} – {formatPrice(filters.priceMax)}
          </span>
        </div>
        <Slider
          value={[filters.priceMin, filters.priceMax]}
          onValueChange={([min, max]) => searchFiltersStore.set({ priceMin: min, priceMax: max })}
          min={250_000}
          max={10_000_000}
          step={50_000}
        />
      </div>

      {/* Acreage */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-foreground">Acreage</label>
          <span className="text-xs text-muted-foreground">
            {filters.acreageMin}+ {filters.acreageMax ? `to ${filters.acreageMax}` : ""} ac
          </span>
        </div>
        <Slider
          value={[filters.acreageMin]}
          onValueChange={([v]) => searchFiltersStore.set({ acreageMin: v })}
          min={0}
          max={500}
          step={5}
        />
      </div>

      {/* State / county */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">State</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArr("states" as any, s)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                filters.states.includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary"
              }`}
            >{s}</button>
          ))}
        </div>
        {filters.states.includes("CO") && (
          <div className="pt-2">
            <label className="text-xs text-muted-foreground">CO counties</label>
            <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1 pr-1">
              {CO_COUNTIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={filters.counties.includes(c)}
                    onCheckedChange={() => toggleArr("counties" as any, c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Property status</label>
        <div className="space-y-1.5">
          {(Object.keys(STATUS_LABELS) as ListingStatus[]).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.status.includes(s)}
                onCheckedChange={() => toggleArr("status" as any, s)}
              />
              {STATUS_LABELS[s]}
            </label>
          ))}
        </div>
      </div>

      {/* Beds / baths */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-foreground">Beds</label>
          <div className="mt-1.5 flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => searchFiltersStore.set({ bedsMin: n })}
                className={`flex-1 py-1 text-xs rounded border ${
                  filters.bedsMin === n ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >{n === 0 ? "Any" : `${n}+`}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Baths</label>
          <div className="mt-1.5 flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => searchFiltersStore.set({ bathsMin: n })}
                className={`flex-1 py-1 text-xs rounded border ${
                  filters.bathsMin === n ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >{n === 0 ? "Any" : `${n}+`}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stalls — kept inline as a primary equine filter */}
      <div className="border-t border-border/60 pt-4">
        <div className="flex justify-between">
          <label className="text-sm font-semibold">Stalls</label>
          <span className="text-xs text-muted-foreground">{filters.stallCountMin}+</span>
        </div>
        <div className="mt-1.5 flex gap-1">
          {[0, 2, 4, 6, 8, 10, 12].map((n) => (
            <button
              key={n}
              onClick={() => searchFiltersStore.set({ stallCountMin: n })}
              className={`flex-1 py-1 text-xs rounded border ${
                filters.stallCountMin === n ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >{n === 0 ? "Any" : `${n}+`}</button>
          ))}
        </div>
      </div>

      {/* Equine features — single dropdown checklist */}
      {(() => {
        const featureCount =
          filters.arenaTypes.length +
          filters.fencing.length +
          filters.facilities.length +
          filters.views.length +
          ["irrigated", "hayProduction", "waterRights", "hunting", "conservationEasement"].filter(
            (k) => (filters as any)[k]
          ).length;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-primary transition-colors"
              >
                <span className="font-semibold text-primary uppercase tracking-wider text-xs">
                  Equine features
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {featureCount > 0 ? `${featureCount} selected` : "Any"}
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="z-50 w-[min(92vw,22rem)] max-h-[70vh] overflow-y-auto bg-popover p-4 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arena</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(Object.keys(ARENA_LABELS) as ArenaType[]).map((a) => (
                    <label key={a} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={filters.arenaTypes.includes(a)}
                        onCheckedChange={() => toggleArr("arenaTypes" as any, a)}
                      />
                      {ARENA_LABELS[a]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facilities</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(Object.keys(FACILITY_LABELS) as FacilityType[]).map((f) => (
                    <label key={f} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={filters.facilities.includes(f)}
                        onCheckedChange={() => toggleArr("facilities" as any, f)}
                      />
                      {FACILITY_LABELS[f]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fencing</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(Object.keys(FENCING_LABELS) as FencingType[]).map((f) => (
                    <label key={f} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={filters.fencing.includes(f)}
                        onCheckedChange={() => toggleArr("fencing" as any, f)}
                      />
                      {FENCING_LABELS[f]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(Object.keys(VIEW_LABELS) as ViewType[]).map((v) => (
                    <label key={v} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={filters.views.includes(v)}
                        onCheckedChange={() => toggleArr("views" as any, v)}
                      />
                      {VIEW_LABELS[v]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Land</label>
                <div className="mt-2 space-y-2">
                  {[
                    ["irrigated", "Irrigated acreage"],
                    ["hayProduction", "Hay production"],
                    ["waterRights", "Water rights"],
                    ["hunting", "Hunting / GMU access"],
                    ["conservationEasement", "Conservation easement"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <Switch
                        checked={(filters as any)[key]}
                        onCheckedChange={(v) => searchFiltersStore.set({ [key]: v } as any)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between">
                    <label className="text-sm">Pasture acres</label>
                    <span className="text-xs text-muted-foreground">{filters.pastureAcresMin}+</span>
                  </div>
                  <Slider
                    className="mt-2"
                    value={[filters.pastureAcresMin]}
                    onValueChange={([v]) => searchFiltersStore.set({ pastureAcresMin: v })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </div>

              {featureCount > 0 && (
                <div className="flex justify-end border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      searchFiltersStore.set({
                        arenaTypes: [],
                        fencing: [],
                        facilities: [],
                        views: [],
                        irrigated: false,
                        hayProduction: false,
                        waterRights: false,
                        hunting: false,
                        conservationEasement: false,
                      })
                    }
                    className="text-xs font-medium uppercase tracking-wider text-accent hover:underline"
                  >
                    Clear features
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        );
      })()}

      {/* Save search */}
      <div className="border-t border-border/60 pt-4 space-y-2">
        {!showSave ? (
          <Button variant="outline" className="w-full" onClick={() => setShowSave(true)}>
            <Save className="mr-2 h-4 w-4" /> Save this search
          </Button>
        ) : (
          <div className="space-y-2 rounded-lg bg-muted/40 p-3">
            <input
              autoFocus
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Name (e.g. Douglas County 10-acre)"
              className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm"
            />
            <label className="flex items-center justify-between text-xs">
              <span>Email me new matches</span>
              <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
            </label>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={saveSearch} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSave(false)}>Cancel</Button>
            </div>
            {user && (
              <Link to="/portal/searches" className="block text-center text-[11px] text-accent hover:underline">
                View saved searches →
              </Link>
            )}
          </div>
        )}
        <Button className="w-full" size="lg">
          Show {resultCount} {resultCount === 1 ? "property" : "properties"}
        </Button>
      </div>
    </aside>
  );
};
