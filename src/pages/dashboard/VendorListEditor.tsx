import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Star, Search, Share2, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function VendorListEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const [list, setList] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDealId, setShareDealId] = useState<string>("");
  const [shareName, setShareName] = useState("");
  const [editingMeta, setEditingMeta] = useState(false);
  const [meta, setMeta] = useState({ name: "", description: "", cover_emoji: "" });

  const refresh = async () => {
    if (!id) return;
    const { data: l } = await supabase.from("agent_vendor_lists").select("*").eq("id", id).maybeSingle();
    setList(l);
    if (l) setMeta({ name: l.name, description: l.description ?? "", cover_emoji: l.cover_emoji ?? "" });
    const { data: it } = await supabase
      .from("agent_vendor_list_items")
      .select("*, vendors(*)")
      .eq("list_id", id)
      .order("sort_order");
    setItems(it ?? []);
  };

  useEffect(() => { refresh(); }, [id]);
  useEffect(() => {
    supabase.from("vendors").select("id, name, category, city, state, rating, review_count, is_verified").eq("is_published", true).then(({ data }) => setAllVendors(data ?? []));
    if (user) supabase.from("deals").select("id, client_name, property_address").eq("assigned_to", user.id).order("created_at", { ascending: false }).then(({ data }) => setDeals(data ?? []));
  }, [user]);

  const existingIds = useMemo(() => new Set(items.map((i) => i.vendor_id)), [items]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allVendors.filter((v) => !existingIds.has(v.id) && (!q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || (v.city ?? "").toLowerCase().includes(q)));
  }, [allVendors, existingIds, search]);

  const addVendor = async (vendor_id: string) => {
    const { error } = await supabase.from("agent_vendor_list_items").insert({ list_id: id, vendor_id, sort_order: items.length });
    if (error) toast.error(error.message); else refresh();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("agent_vendor_list_items").delete().eq("id", itemId);
    refresh();
  };

  const updateNote = async (itemId: string, note: string) => {
    await supabase.from("agent_vendor_list_items").update({ agent_note: note }).eq("id", itemId);
  };

  const saveMeta = async () => {
    await supabase.from("agent_vendor_lists").update({
      name: meta.name.trim(), description: meta.description.trim() || null, cover_emoji: meta.cover_emoji.trim() || null,
    }).eq("id", id);
    setEditingMeta(false);
    refresh();
  };

  const shareToDeal = async () => {
    if (!shareDealId) { toast.error("Pick a client deal"); return; }
    const { data, error } = await supabase.rpc("clone_vendor_list_to_deal", {
      _template_id: id, _deal_id: shareDealId, _custom_name: shareName.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Shared with client. They'll see it in their portal.");
    setShareOpen(false);
    setShareDealId(""); setShareName("");
  };

  if (!list) return <DashboardLayout><p className="text-sm text-muted-foreground">Loading…</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <Link to="/dashboard/vendor-lists" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> All lists
      </Link>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{list.cover_emoji ?? "📋"}</span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">{list.name}</h1>
            {list.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{list.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={list.is_template ? "secondary" : "outline"} className="text-[10px]">{list.is_template ? "Template" : "Client copy"}</Badge>
              <Badge variant="outline" className="text-[10px]">{items.length} vendors</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingMeta(true)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
          {list.is_template && (
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Share2 className="h-4 w-4 mr-1" /> Share with client</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Share "{list.name}" with a client</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">A customized copy will be created and shown in that client's portal. You can edit it without affecting the template.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Client deal</Label>
                    <Select value={shareDealId} onValueChange={setShareDealId}>
                      <SelectTrigger><SelectValue placeholder="Choose a deal" /></SelectTrigger>
                      <SelectContent>
                        {deals.map((d) => <SelectItem key={d.id} value={d.id}>{d.client_name} {d.property_address ? `— ${d.property_address}` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rename for client (optional)</Label>
                    <Input value={shareName} onChange={(e) => setShareName(e.target.value)} placeholder={list.name} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShareOpen(false)}>Cancel</Button>
                  <Button onClick={shareToDeal}>Share</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Dialog open={editingMeta} onOpenChange={setEditingMeta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit list</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="space-y-1.5"><Label>Icon</Label><Input value={meta.cover_emoji} onChange={(e) => setMeta({ ...meta, cover_emoji: e.target.value })} maxLength={4} /></div>
              <div className="space-y-1.5"><Label>Name</Label><Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMeta(false)}>Cancel</Button>
            <Button onClick={saveMeta}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          {items.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">No vendors yet — search the directory on the right to add some.</CardContent></Card>
          )}
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/vendors/${it.vendor_id}`} className="font-medium text-primary hover:underline">{it.vendors?.name}</Link>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{it.vendors?.category}</span>
                    {it.vendors?.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" /> {Number(it.vendors.rating).toFixed(1)}</span>}
                    {it.vendors?.city && <span>· {it.vendors.city}, {it.vendors.state}</span>}
                  </div>
                  <Textarea
                    defaultValue={it.agent_note ?? ""}
                    onBlur={(e) => updateNote(it.id, e.target.value)}
                    placeholder="Add a personal note for the client (optional)…"
                    rows={2}
                    className="mt-2 text-xs"
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit sticky top-4">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add vendors</p>
              <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…" className="pl-7 h-9" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y">
              {filtered.slice(0, 50).map((v) => (
                <div key={v.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{v.category} {v.city && `· ${v.city}, ${v.state}`}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addVendor(v.id)}>Add</Button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-muted-foreground py-2">No more vendors match.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
