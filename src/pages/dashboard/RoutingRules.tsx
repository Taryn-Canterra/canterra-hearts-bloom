import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function RoutingRules() {
  const { user, isAdmin, loading } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", priority: 0, match_lead_type: "any", match_county: "",
    match_min_price: "", match_max_price: "", assign_to: "",
  });

  const load = async () => {
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("lead_routing_rules").select("*").order("priority", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name, email").order("display_name"),
    ]);
    setRules(r ?? []);
    setAgents(a ?? []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <DashboardLayout><p>Loading…</p></DashboardLayout>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assign_to) { toast.error("Pick an agent"); return; }
    const { error } = await supabase.from("lead_routing_rules").insert({
      name: form.name,
      priority: Number(form.priority) || 0,
      match_lead_type: form.match_lead_type === "any" ? null : form.match_lead_type,
      match_county: form.match_county || null,
      match_min_price: form.match_min_price ? Number(form.match_min_price) : null,
      match_max_price: form.match_max_price ? Number(form.match_max_price) : null,
      assign_to: form.assign_to,
      created_by: user!.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Rule created");
    setForm({ name: "", priority: 0, match_lead_type: "any", match_county: "", match_min_price: "", match_max_price: "", assign_to: "" });
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("lead_routing_rules").update({ active }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await supabase.from("lead_routing_rules").delete().eq("id", id);
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Lead routing rules</h1>
          <p className="text-muted-foreground">Auto-assign incoming inquiries and saved searches based on county or price band. Higher priority rules match first.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">New rule</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div><Label className="text-xs">Priority</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} />
              </div>
              <div><Label className="text-xs">Lead type</Label>
                <Select value={form.match_lead_type} onValueChange={(v) => setForm({ ...form, match_lead_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="property_inquiry">Property inquiries</SelectItem>
                    <SelectItem value="saved_search">Saved searches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">County (contains)</Label>
                <Input value={form.match_county} onChange={(e) => setForm({ ...form, match_county: e.target.value })} placeholder="e.g. Elbert" />
              </div>
              <div><Label className="text-xs">Min price</Label>
                <Input type="number" value={form.match_min_price} onChange={(e) => setForm({ ...form, match_min_price: e.target.value })} />
              </div>
              <div><Label className="text-xs">Max price</Label>
                <Input type="number" value={form.match_max_price} onChange={(e) => setForm({ ...form, match_max_price: e.target.value })} />
              </div>
              <div className="sm:col-span-2"><Label className="text-xs">Assign to</Label>
                <Select value={form.assign_to} onValueChange={(v) => setForm({ ...form, assign_to: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick an agent…" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>{a.display_name ?? a.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="sm:col-span-2">Create rule</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {rules.length === 0 && <p className="text-sm text-muted-foreground">No rules yet.</p>}
          {rules.map((r) => {
            const agent = agents.find((a) => a.user_id === r.assign_to);
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                  <Switch checked={r.active} onCheckedChange={(v) => toggle(r.id, v)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.name} <Badge variant="secondary" className="ml-2 text-[10px]">priority {r.priority}</Badge></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.match_lead_type ?? "any"} · {r.match_county ? `county ~ ${r.match_county}` : "any county"} ·{" "}
                      {r.match_min_price || r.match_max_price
                        ? `$${(r.match_min_price ?? 0).toLocaleString()}–$${(r.match_max_price ?? "∞").toLocaleString()}`
                        : "any price"} → <span className="text-primary">{agent?.display_name ?? agent?.email ?? "—"}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
