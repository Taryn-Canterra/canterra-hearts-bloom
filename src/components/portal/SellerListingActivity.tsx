import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, MessageSquare } from "lucide-react";

export const SellerListingActivity = ({ deal }: { deal: any }) => {
  const [showings, setShowings] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: s }, { data: m }] = await Promise.all([
        supabase.from("deal_showings").select("*").eq("deal_id", deal.id).order("scheduled_at", { ascending: false }).limit(10),
        supabase.from("deal_listing_metrics").select("*").eq("deal_id", deal.id).order("recorded_on", { ascending: false }).limit(1),
      ]);
      if (!active) return;
      setShowings(s ?? []);
      setLatestMetrics(m?.[0] ?? null);
    })();
    return () => { active = false; };
  }, [deal.id]);

  const dom = deal.listed_at
    ? Math.floor((Date.now() - new Date(deal.listed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Listing performance</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Stat icon={<Calendar className="h-4 w-4" />} label="Days on market" value={dom ?? "—"} />
          <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={latestMetrics?.views ?? 0} />
          <Stat icon={<Eye className="h-4 w-4" />} label="Saves" value={latestMetrics?.saves ?? 0} />
          <Stat icon={<MessageSquare className="h-4 w-4" />} label="Inquiries" value={latestMetrics?.inquiries ?? 0} />
          <Stat label="Showings booked" value={showings.length} />
          <Stat label="List price" value={deal.list_price ? `$${Number(deal.list_price).toLocaleString()}` : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Showing activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {showings.length === 0 && <p className="text-sm text-muted-foreground">No showings yet.</p>}
          {showings.map((s) => (
            <div key={s.id} className="border-b last:border-0 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {new Date(s.scheduled_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                <Badge variant={s.status === "completed" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"}>
                  {s.status}
                </Badge>
              </div>
              {s.buyer_agent_name && <p className="text-xs text-muted-foreground">{s.buyer_agent_name}{s.buyer_agent_brokerage ? ` · ${s.buyer_agent_brokerage}` : ""}</p>}
              {s.feedback && <p className="text-xs italic mt-1">"{s.feedback}"</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: any }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
      {icon}<span>{label}</span>
    </div>
    <p className="font-display text-xl font-medium mt-1">{value ?? "—"}</p>
  </div>
);
