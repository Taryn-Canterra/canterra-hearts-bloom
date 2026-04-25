import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // RLS will only return deals where the user is linked via deal_clients
      const { data } = await supabase.from("deals").select("*").order("updated_at", { ascending: false });
      setDeals(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <ClientPortalLayout>
      <div className="space-y-6 max-w-4xl">
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
      </div>
    </ClientPortalLayout>
  );
}
