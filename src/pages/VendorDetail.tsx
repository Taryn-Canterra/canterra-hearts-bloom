import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, Mail, Globe, MapPin, BadgeCheck, ArrowLeft, Flag } from "lucide-react";
import { ReviewForm } from "@/components/vendors/ReviewForm";
import { SaveVendorButton } from "@/components/vendors/SaveVendorButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: v }, { data: r }] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", id).maybeSingle(),
        supabase.from("vendor_reviews").select("*").eq("vendor_id", id).order("created_at", { ascending: false }),
      ]);
      setVendor(v); setReviews(r ?? []); setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><Header /><main className="container py-20 text-center text-muted-foreground">Loading…</main><Footer /></div>;
  if (!vendor) return <div className="min-h-screen bg-background"><Header /><main className="container py-20 text-center"><h1 className="font-display text-3xl text-primary">Vendor not found</h1></main><Footer /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <Link to="/vendors" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> All vendors
        </Link>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{vendor.category}</Badge>
                  {vendor.tier === "featured" && <Badge>Featured</Badge>}
                  {vendor.is_verified && (
                    <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl font-semibold text-primary">{vendor.name}</h1>
                {vendor.rating && (
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-medium">{Number(vendor.rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 min-w-48">
                {vendor.phone && (
                  <Button asChild variant="outline" size="sm"><a href={`tel:${vendor.phone}`}><Phone className="mr-2 h-4 w-4" /> {vendor.phone}</a></Button>
                )}
                {vendor.email && (
                  <Button asChild variant="outline" size="sm"><a href={`mailto:${vendor.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
                )}
                {vendor.website && (
                  <Button asChild variant="ghost" size="sm"><a href={vendor.website} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" /> Website</a></Button>
                )}
              </div>
            </div>

            {vendor.description && (
              <p className="text-foreground/85 leading-relaxed border-t pt-4">{vendor.description}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Based in</p>
                <p className="flex items-center gap-1.5 mt-1"><MapPin className="h-4 w-4" /> {[vendor.city, vendor.state].filter(Boolean).join(", ")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Service area</p>
                <p className="mt-1">{(vendor.service_counties ?? []).join(", ") || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="font-display text-2xl font-medium text-primary mb-3">Reviews</h2>
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                      ))}
                    </div>
                    {r.used_during_canterra_tx && (
                      <Badge variant="secondary" className="text-xs">Used during Canterra transaction</Badge>
                    )}
                  </div>
                  {r.body && <p className="text-sm text-foreground/85">{r.body}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
