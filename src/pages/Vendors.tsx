import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, MapPin, BadgeCheck, X, SlidersHorizontal } from "lucide-react";
import { ALL_STATES, CO_COUNTIES } from "@/hooks/useSearchFilters";
import { VENDOR_CATEGORIES } from "@/lib/vendorCategories";
import { SaveVendorButton } from "@/components/vendors/SaveVendorButton";
import { SuggestVendorDialog } from "@/components/vendors/SuggestVendorDialog";

const CATEGORIES = ["All", ...VENDOR_CATEGORIES];

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "rating", label: "Top rated" },
  { key: "reviews", label: "Most reviewed" },
  { key: "name", label: "Name (A–Z)" },
] as const;

export default function Vendors() {
  const [params, setParams] = useSearchParams();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.get("cat") ?? "All";
  const q = params.get("q") ?? "";
  const state = params.get("state") ?? "All";
  const county = params.get("county") ?? "All";
  const verifiedOnly = params.get("verified") === "1";
  const featuredOnly = params.get("featured") === "1";
  const minRating = Number(params.get("min_rating") ?? "0");
  const sort = (params.get("sort") ?? "recommended") as (typeof SORTS)[number]["key"];

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("vendors").select("*").eq("is_published", true);
      if (category !== "All") query = query.eq("category", category);
      if (state !== "All") query = query.eq("state", state);
      if (verifiedOnly) query = query.eq("is_verified", true);
      if (featuredOnly) query = query.eq("tier", "featured");
      if (minRating > 0) query = query.gte("rating", minRating);
      const { data } = await query;
      let list = data ?? [];

      if (county !== "All") {
        list = list.filter(
          (v) => v.county === county || (v.service_counties ?? []).includes(county),
        );
      }
      if (q.trim()) {
        const ql = q.toLowerCase();
        list = list.filter((v) =>
          v.name.toLowerCase().includes(ql) ||
          (v.description ?? "").toLowerCase().includes(ql) ||
          (v.county ?? "").toLowerCase().includes(ql) ||
          (v.city ?? "").toLowerCase().includes(ql) ||
          (v.category ?? "").toLowerCase().includes(ql) ||
          (v.service_counties ?? []).some((c: string) => c.toLowerCase().includes(ql)),
        );
      }

      list.sort((a, b) => {
        if (sort === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        if (sort === "reviews") return (b.review_count || 0) - (a.review_count || 0);
        if (sort === "name") return a.name.localeCompare(b.name);
        // recommended: featured first, then verified, then rating
        const tierRank = (v: any) => (v.tier === "featured" ? 2 : v.tier === "pro" ? 1 : 0);
        const t = tierRank(b) - tierRank(a);
        if (t !== 0) return t;
        const ver = Number(!!b.is_verified) - Number(!!a.is_verified);
        if (ver !== 0) return ver;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });

      setVendors(list);
      setLoading(false);
    })();
  }, [category, q, state, county, verifiedOnly, featuredOnly, minRating, sort]);

  const updateParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(params);
    if (val === null || val === "" || val === "All" || val === "0") next.delete(key);
    else next.set(key, val);
    // Reset county when state changes away from CO (since we only have CO list)
    if (key === "state" && val !== "CO") next.delete("county");
    setParams(next);
  };

  const counties = useMemo(() => (state === "CO" ? CO_COUNTIES : []), [state]);

  const activeFilterCount =
    (category !== "All" ? 1 : 0) +
    (state !== "All" ? 1 : 0) +
    (county !== "All" ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (q.trim() ? 1 : 0);

  const clearAll = () => setParams(new URLSearchParams());

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Equine industry directory</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Trusted vets, farriers, trainers, body workers, shippers, builders, and more — your full-service equine community for any new or existing horse property.
            </p>
          </div>
          <SuggestVendorDialog />
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-primary">Filters</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{activeFilterCount}</Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearAll}>
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
              <Input
                placeholder="Name, specialty, city…"
                defaultValue={q}
                onChange={(e) => updateParam("q", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category / role</Label>
              <Select value={category} onValueChange={(v) => updateParam("cat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">State</Label>
                <Select value={state} onValueChange={(v) => updateParam("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {ALL_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">County</Label>
                <Select
                  value={county}
                  onValueChange={(v) => updateParam("county", v)}
                  disabled={state !== "CO"}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Minimum rating</Label>
              <Select value={String(minRating)} onValueChange={(v) => updateParam("min_rating", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="3">3★ & up</SelectItem>
                  <SelectItem value="4">4★ & up</SelectItem>
                  <SelectItem value="4.5">4.5★ & up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={verifiedOnly}
                  onCheckedChange={(v) => updateParam("verified", v ? "1" : null)}
                />
                <BadgeCheck className="h-4 w-4 text-accent" /> Canterra-verified only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={featuredOnly}
                  onCheckedChange={(v) => updateParam("featured", v ? "1" : null)}
                />
                <Star className="h-4 w-4 text-accent" /> Featured partners
              </label>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${vendors.length} vendor${vendors.length === 1 ? "" : "s"}`}
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Sort</Label>
                <Select value={sort} onValueChange={(v) => updateParam("sort", v === "recommended" ? null : v)}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vendors.map((v) => (
                <Card key={v.id} className="h-full hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 z-10">
                    <SaveVendorButton vendorId={v.id} variant="ghost" size="icon" />
                  </div>
                  <Link to={`/vendors/${v.id}`} className="block">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2 pr-8">
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-medium text-primary truncate">{v.name}</h3>
                          <p className="text-xs text-muted-foreground">{v.category}</p>
                        </div>
                        {v.tier === "featured" && <Badge variant="default" className="text-[10px]">Featured</Badge>}
                      </div>
                      {v.is_verified && (
                        <div className="flex items-center gap-1 text-xs text-accent">
                          <BadgeCheck className="h-3.5 w-3.5" /> Canterra-verified
                        </div>
                      )}
                      {v.rating && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="font-medium">{Number(v.rating).toFixed(1)}</span>
                          <span className="text-muted-foreground">({v.review_count} reviews)</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                        {v.city && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.city}, {v.state}</p>}
                        <p>Serves: {(v.service_counties ?? []).slice(0, 3).join(", ")}{v.service_counties?.length > 3 ? "…" : ""}</p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {!loading && vendors.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
                No vendors match your filters. Try clearing some.
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
