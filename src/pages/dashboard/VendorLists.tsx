import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function VendorLists() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", cover_emoji: "🐎" });

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("agent_vendor_lists")
      .select("*, agent_vendor_list_items(count)")
      .eq("owner_user_id", user.id)
      .eq("is_template", true)
      .order("created_at", { ascending: false });
    setLists(data ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const create = async () => {
    if (!user || !form.name.trim()) { toast.error("Name is required"); return; }
    const { data, error } = await supabase.from("agent_vendor_lists").insert({
      owner_user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      cover_emoji: form.cover_emoji.trim() || null,
      is_template: true,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setCreating(false);
    setForm({ name: "", description: "", cover_emoji: "🐎" });
    nav(`/dashboard/vendor-lists/${data.id}`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this list?")) return;
    await supabase.from("agent_vendor_lists").delete().eq("id", id);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Curated vendor lists</h1>
          <p className="text-sm text-muted-foreground mt-1">Build reusable vendor playbooks (e.g. "New Horse Property Support Team") and share customized copies with each client.</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New list</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a vendor list template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <Input value={form.cover_emoji} onChange={(e) => setForm({ ...form, cover_emoji: e.target.value })} maxLength={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Quick Start Equine Industry Contacts" maxLength={120} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={create}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && lists.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No lists yet. Create your first curated playbook.
        </CardContent></Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => (
          <Card key={l.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <Link to={`/dashboard/vendor-lists/${l.id}`} className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{l.cover_emoji ?? "📋"}</span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-primary truncate">{l.name}</h3>
                    {l.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{l.description}</p>}
                  </div>
                </Link>
                <Button size="icon" variant="ghost" onClick={() => remove(l.id)} className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t">
                <Badge variant="outline" className="text-[10px]">
                  <ListChecks className="h-3 w-3 mr-1" />
                  {l.agent_vendor_list_items?.[0]?.count ?? 0} vendors
                </Badge>
                <Badge variant="secondary" className="text-[10px]">Template</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
