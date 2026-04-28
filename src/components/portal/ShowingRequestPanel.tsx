import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/hooks/useNotifications";

export function ShowingRequestPanel({ deal }: { deal: any }) {
  const { user } = useAuth();
  const [showings, setShowings] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("deal_showings")
      .select("*")
      .eq("deal_id", deal.id)
      .order("scheduled_at", { ascending: false })
      .limit(10);
    setShowings(data ?? []);
  };

  useEffect(() => {
    load();
  }, [deal.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduled || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("deal_showings").insert({
      deal_id: deal.id,
      scheduled_at: scheduled,
      created_by: user.id,
      requested_by_role: "client",
      status: "scheduled",
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Showing request sent to your agent");
    // Notify the agent
    if (deal.assigned_to) {
      notify({
        userId: deal.assigned_to,
        kind: "showing_request",
        title: "New showing request from your buyer",
        body: `${deal.client_name ?? "Buyer"} requested a showing on ${new Date(scheduled).toLocaleString()}`,
        link: `/dashboard/deals/${deal.id}`,
        dealId: deal.id,
      });
    }
    setScheduled("");
    setNotes("");
    load();
  };

  if (deal.side !== "buyer") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Showings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <div>
              <Label htmlFor="showing-when" className="text-xs">Preferred date & time</Label>
              <Input
                id="showing-when"
                type="datetime-local"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="showing-notes" className="text-xs">Notes for your agent (optional)</Label>
              <Textarea
                id="showing-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything specific you want to look at?"
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting || !scheduled}>
            {submitting ? "Sending…" : "Request showing"}
          </Button>
        </form>

        {showings.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
            {showings.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</p>
                  {s.notes && <p className="text-xs text-muted-foreground italic">"{s.notes}"</p>}
                </div>
                {s.confirmed_at ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Confirmed
                  </Badge>
                ) : s.status === "scheduled" ? (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" /> Awaiting agent
                  </Badge>
                ) : (
                  <Badge variant="secondary">{s.status}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
