import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  qualified: "Qualified",
  property_tour_or_listing_prep: "Tour / Listing Prep",
  offer_drafted_or_listed: "Offer Drafted / Listed",
  offer_accepted_under_contract: "Under Contract",
  inspection_and_appraisal: "Inspection & Appraisal",
  financing_and_title: "Financing & Title",
  closing: "Closing",
  closed_won: "Closed",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

export default function PortalHome() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_properties")
      .select("id, created_at, property:properties(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSaved(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: dealData }] = await Promise.all([
        supabase.from("deals").select("*").order("updated_at", { ascending: false }),
        loadSaved(),
      ]);
      setDeals(dealData ?? []);
      setLoading(false);
    })();
  }, [user]);

  const unsave = async (savedId: string) => {
    const { error } = await supabase.from("saved_properties").delete().eq("id", savedId);
    if (error) { toast.error(error.message); return; }
    toast("Removed");
    loadSaved();
  };

  return (
    <ClientPortalLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Your transactions</h1>
          <p className="text-muted-foreground">Track progress, exchange messages, and access shared documents.</p>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && deals.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No transactions yet. Your agent will invite you when a deal is opened.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {deals.map((d) => (
            <Link key={d.id} to={`/portal/deal/${d.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={d.side === "buyer" ? "default" : "outline"}>{d.side}</Badge>
                      <Badge variant="secondary">{STAGE_LABELS[d.stage] ?? d.stage}</Badge>
                    </div>
                    <h3 className="font-display text-xl font-medium text-primary">
                      {d.property_address ?? d.client_name}
                    </h3>
                    {d.price && <p className="text-sm text-muted-foreground mt-1">${Number(d.price).toLocaleString()}</p>}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Saved properties */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-primary">Saved properties</h2>
            <Badge variant="secondary">{saved.length}</Badge>
          </div>

          {saved.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                You haven't saved any properties yet. Click the <Heart className="inline h-3.5 w-3.5 mx-1" /> button on a listing to save it here.
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {saved.map((s) => {
              const p = s.property;
              if (!p) return null;
              return (
                <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Link to={`/listing/${p.id}`} className="block">
                    {p.primary_photo && (
                      <img
                        src={p.primary_photo}
                        alt={p.title ?? p.address ?? "Saved property"}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-primary truncate">
                        {p.title ?? p.address ?? "Property"}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {[p.city, p.state].filter(Boolean).join(", ")}
                      </p>
                      {p.price && (
                        <p className="text-sm font-semibold mt-2">${Number(p.price).toLocaleString()}</p>
                      )}
                    </CardContent>
                  </Link>
                  <div className="px-4 pb-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.preventDefault(); unsave(s.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
