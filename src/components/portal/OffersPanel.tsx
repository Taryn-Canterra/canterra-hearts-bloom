import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const OffersPanel = ({ deal }: { deal: any }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const isSeller = deal.side === "seller";

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data } = await supabase
        .from("deal_offers")
        .select("*")
        .eq("deal_id", deal.id)
        .order("submitted_at", { ascending: false });
      if (active) setOffers(data ?? []);
    };
    refresh();
    const channel = supabase
      .channel(`portal-offers-${deal.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_offers", filter: `deal_id=eq.${deal.id}` }, refresh)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [deal.id]);

  if (offers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isSeller ? "Offers received" : "Your offers"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {offers.map((o) => (
          <div key={o.id} className="border rounded-md p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-display text-lg font-semibold text-primary">
                ${Number(o.offer_price).toLocaleString()}
              </p>
              <Badge variant={
                o.status === "accepted" ? "default" :
                o.status === "rejected" || o.status === "withdrawn" ? "destructive" :
                "secondary"
              }>{o.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
              {o.financing_type && <span>Financing: <span className="text-foreground">{o.financing_type}</span></span>}
              {o.earnest_money && <span>Earnest: <span className="text-foreground">${Number(o.earnest_money).toLocaleString()}</span></span>}
              {o.proposed_close_date && <span>Close: <span className="text-foreground">{new Date(o.proposed_close_date).toLocaleDateString()}</span></span>}
              {o.buyer_or_offering_party && <span>{isSeller ? "Buyer" : "Counterparty"}: <span className="text-foreground">{o.buyer_or_offering_party}</span></span>}
            </div>
            {o.contingencies && (
              <p className="text-xs mt-2"><span className="font-medium">Contingencies:</span> {o.contingencies}</p>
            )}
            {o.agent_recommendation && (
              <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                <span className="font-medium">Your agent's note: </span>{o.agent_recommendation}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
