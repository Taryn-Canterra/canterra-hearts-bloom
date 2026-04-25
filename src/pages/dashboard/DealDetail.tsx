import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, ArrowLeft } from "lucide-react";
import { DealClientPanel } from "@/components/dashboard/DealClientPanel";

const STAGES = [
  { key: "new_lead", label: "New Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "property_tour_or_listing_prep", label: "Tour / Listing Prep" },
  { key: "offer_drafted_or_listed", label: "Offer Drafted / Listed" },
  { key: "offer_accepted_under_contract", label: "Under Contract" },
  { key: "inspection_and_appraisal", label: "Inspection & Appraisal" },
  { key: "financing_and_title", label: "Financing & Title" },
  { key: "closing", label: "Closing" },
  { key: "closed_won", label: "Closed Won" },
  { key: "lost", label: "Lost" },
  { key: "withdrawn", label: "Withdrawn" },
];

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const [{ data: d }, { data: ci }, { data: n }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).maybeSingle(),
      supabase.from("deal_checklist_items").select("*").eq("deal_id", id).order("stage").order("sort_order"),
      supabase.from("deal_notes").select("*").eq("deal_id", id).order("created_at", { ascending: false }),
    ]);
    setDeal(d);
    setItems(ci ?? []);

    // Fetch author display names separately (no FK between deal_notes.author_id and profiles)
    const authorIds = Array.from(new Set((n ?? []).map((x) => x.author_id)));
    let profileMap: Record<string, string> = {};
    if (authorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,display_name").in("user_id", authorIds);
      profileMap = Object.fromEntries((profs ?? []).map((p) => [p.user_id, p.display_name ?? "Agent"]));
    }
    setNotes((n ?? []).map((x) => ({ ...x, author_name: profileMap[x.author_id] ?? "Agent" })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const toggleItem = async (item: any) => {
    const completed = !item.completed;
    const { error } = await supabase
      .from("deal_checklist_items")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user!.id : null,
      })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else load();
  };

  const toggleVisibility = async (item: any) => {
    await supabase.from("deal_checklist_items").update({ client_visible: !item.client_visible }).eq("id", item.id);
    load();
  };

  const updateStage = async (stage: string) => {
    await supabase.from("deals").update({ stage: stage as any }).eq("id", id);
    load();
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from("deal_notes").insert({ deal_id: id, author_id: user.id, body: newNote });
    if (error) toast.error(error.message);
    else { setNewNote(""); load(); }
  };

  const deleteDeal = async () => {
    if (!confirm("Delete this deal and its checklist? This cannot be undone.")) return;
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deal deleted"); navigate("/dashboard/deals"); }
  };

  if (loading) return <DashboardLayout><p>Loading…</p></DashboardLayout>;
  if (!deal) return <DashboardLayout><p>Deal not found.</p></DashboardLayout>;

  // Group items by stage
  const groupedItems = STAGES.map((s) => ({
    stage: s,
    items: items.filter((i) => i.stage === s.key),
  })).filter((g) => g.items.length > 0);

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const pct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to pipeline
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={deal.side === "buyer" ? "default" : "outline"}>{deal.side}</Badge>
                  <Badge variant="secondary">{pct}% complete</Badge>
                </div>
                <CardTitle className="font-display text-2xl">{deal.client_name}</CardTitle>
                {deal.property_address && <p className="text-muted-foreground mt-1">{deal.property_address}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={deleteDeal}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Stage</p>
              <Select value={deal.stage} onValueChange={updateStage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Price</p>
              <p className="font-medium mt-2">{deal.price ? `$${Number(deal.price).toLocaleString()}` : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
              <p className="font-medium mt-2">{deal.client_email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Expected close</p>
              <p className="font-medium mt-2">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Items marked client-visible will appear on the buyer/seller's transparency dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {groupedItems.map((g) => (
              <div key={g.stage.key}>
                <h3 className="font-medium text-sm uppercase tracking-wider text-primary mb-2">{g.stage.label}</h3>
                <div className="space-y-2">
                  {g.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
                      <Checkbox checked={i.completed} onCheckedChange={() => toggleItem(i)} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${i.completed ? "line-through text-muted-foreground" : ""}`}>{i.label}</p>
                        {i.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed {new Date(i.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Visible to client</span>
                        <Switch checked={i.client_visible} onCheckedChange={() => toggleVisibility(i)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea rows={2} placeholder="Add a note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <Button onClick={addNote}>Add</Button>
            </div>
            <div className="space-y-2">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-primary/30 pl-3 py-1">
                  <p className="text-sm">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.author_name} · {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
