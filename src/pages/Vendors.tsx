import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Phone, Mail, MapPin, BadgeCheck } from "lucide-react";

const CATEGORIES = [
  "All", "Farrier", "Equine veterinarian", "Equine dentist", "Barn builder",
  "Fence contractor", "Hay supplier", "Equine inspector", "Horse transporter",
  "Trainer", "Feed store", "Ranch hand / caretaker", "Water well specialist",
  "Irrigation contractor", "Real estate attorney", "Land surveyor",
];

export default function Vendors() {
  const [params, setParams] = useSearchParams();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const category = params.get("cat") ?? "All";
  const q = params.get("q") ?? "";

  useEffect(() => {
    (async () => {
      let query = supabase.from("vendors").select("*").eq("is_published", true)
        .order("tier", { ascending: false }).order("rating", { ascending: false });
      if (category !== "All") query = query.eq("category", category);
      const { data } = await query;
      let list = data ?? [];
      if (q.trim()) {
        const ql = q.toLowerCase();
        list = list.filter((v) =>
          v.name.toLowerCase().includes(ql) ||
          (v.county ?? "").toLowerCase().includes(ql) ||
          (v.city ?? "").toLowerCase().includes(ql) ||
          (v.service_counties ?? []).some((c: string) => c.toLowerCase().includes(ql)),
        );
      }
      setVendors(list);
      setLoading(false);
    })();
  }, [category, q]);

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val && val !== "All") next.set(key, val); else next.delete(key);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold text-primary">Equine vendor directory</h1>
          <p className="text-muted-foreground mt-2">
            Trusted farriers, vets, barn builders, and more — vetted for the equine real estate community.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_240px] mb-8">
          <Input
            placeholder="Search by name, city, or county…"
            defaultValue={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />
          <Select value={category} onValueChange={(v) => updateParam("cat", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Link key={v.id} to={`/vendors/${v.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
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
              </Card>
            </Link>
          ))}
        </div>

        {!loading && vendors.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
            No vendors match your search.
          </CardContent></Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
