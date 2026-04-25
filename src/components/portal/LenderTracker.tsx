import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const MILESTONE_LABELS: Record<string, string> = {
  application: "Loan application submitted",
  processing: "In processing / underwriting",
  conditional_approval: "Conditional approval",
  appraisal_review: "Appraisal review",
  clear_to_close: "Clear to close",
  funded: "Funded",
};

export const LenderTracker = ({ deal }: { deal: any }) => {
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("deal_lender_milestones")
        .select("*")
        .eq("deal_id", deal.id)
        .order("sort_order", { ascending: true });
      if (active) setMilestones(data ?? []);
    })();

    const channel = supabase
      .channel(`portal-lender-${deal.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_lender_milestones", filter: `deal_id=eq.${deal.id}` },
        async () => {
          const { data } = await supabase
            .from("deal_lender_milestones")
            .select("*").eq("deal_id", deal.id).order("sort_order");
          setMilestones(data ?? []);
        })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [deal.id]);

  if (milestones.length === 0 && !deal.lender_name) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Loan progress</CardTitle>
        {deal.lender_name && (
          <p className="text-sm text-muted-foreground">
            {deal.lender_name}{deal.lender_contact_name ? ` · ${deal.lender_contact_name}` : ""}
            {deal.lender_contact_phone ? ` · ${deal.lender_contact_phone}` : ""}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {milestones.length === 0 && (
          <p className="text-sm text-muted-foreground">Your agent will post lender milestones as they occur.</p>
        )}
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0">
            {m.status === "complete"
              ? <CheckCircle2 className="h-4 w-4 text-primary" />
              : m.status === "in_progress"
                ? <Clock className="h-4 w-4 text-amber-600" />
                : <Circle className="h-4 w-4 text-muted-foreground" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{MILESTONE_LABELS[m.milestone] ?? m.milestone}</p>
              {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
              {m.reached_at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(m.reached_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge variant={m.status === "complete" ? "default" : m.status === "blocked" ? "destructive" : "secondary"}>
              {m.status.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
