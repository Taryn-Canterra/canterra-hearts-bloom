import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

const ROLES = [
  "co_agent", "assistant", "transaction_coordinator", "lender",
  "title", "inspector", "appraiser", "vendor", "client", "other",
];

export const DealPartiesManager = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [parties, setParties] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", role: "transaction_coordinator", email: "", phone: "", company: "" });

  const load = async () => {
    const { data } = await supabase.from("deal_parties").select("*").eq("deal_id", dealId).order("created_at");
    setParties(data ?? []);
  };
  useEffect(() => { load(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    const { error } = await supabase.from("deal_parties").insert({
      deal_id: dealId, added_by: user.id,
      name: form.name.trim(), role: form.role,
      email: form.email.trim() || null, phone: form.phone.trim() || null, company: form.company.trim() || null,
    });
    if (error) toast.error(error.message);
    else { setForm({ name: "", role: "transaction_coordinator", email: "", phone: "", company: "" }); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this party from the deal?")) return;
    await supabase.from("deal_parties").delete().eq("id", id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parties on this deal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Co-agents, transaction coordinators, lenders, vendors. Assign checklist tasks to them.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input className="md:col-span-2" placeholder="Name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit"><UserPlus className="h-4 w-4 mr-2" />Add</Button>
        </form>
        {parties.length === 0 && <p className="text-sm text-muted-foreground">No parties added yet.</p>}
        <div className="space-y-2">
          {parties.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <Badge variant="outline" className="text-[10px]">{p.role.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[p.email, p.phone, p.company].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
