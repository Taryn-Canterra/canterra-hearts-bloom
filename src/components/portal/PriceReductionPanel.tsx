import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TrendingDown } from "lucide-react";

export const PriceReductionPanel = ({ deal }: { deal: any }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const refresh = async () => {
    const { data } = await supabase
      .from("deal_price_reductions")
      .select("*")
      .eq("deal_id", deal.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => { refresh(); }, [deal.id]);

  useEffect(() => {
    const ch = supabase
      .channel(`portal-pr-${deal.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_price_reductions", filter: `deal_id=eq.${deal.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [deal.id]);

  const respond = async (id: string, status: "approved" | "declined") => {
    const { error } = await supabase.from("deal_price_reductions")
      .update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(status === "approved" ? "Approved — your agent will update the listing." : "Declined."); refresh(); }
  };

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4" /> Price reduction proposals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="border rounded-md p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">From ${Number(p.prior_price).toLocaleString()}</p>
                <p className="font-display text-xl font-semibold text-primary">
                  ${Number(p.proposed_price).toLocaleString()}
                </p>
              </div>
              <Badge variant={
                p.status === "approved" || p.status === "applied" ? "default" :
                p.status === "declined" ? "destructive" : "secondary"
              }>{p.status}</Badge>
            </div>
            {p.reasoning && <p className="text-sm mt-2">{p.reasoning}</p>}
            {p.status === "proposed" && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => respond(p.id, "approved")}>Approve reduction</Button>
                <Button size="sm" variant="outline" onClick={() => respond(p.id, "declined")}>Decline</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
