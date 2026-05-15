import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [side, setSide] = useState("seller");

  const load = async () => {
    const { data } = await supabase
      .from("checklist_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("checklist_templates").insert({
      owner_user_id: user.id, name: name.trim(), side, is_default: false,
    });
    if (error) toast.error(error.message);
    else { setName(""); load(); }
  };

  const setDefault = async (t: any) => {
    // Clear other defaults for this side, set this one
    await supabase
      .from("checklist_templates")
      .update({ is_default: false })
      .eq("owner_user_id", user!.id)
      .eq("side", t.side);
    await supabase.from("checklist_templates").update({ is_default: true }).eq("id", t.id);
    toast.success("Default updated");
    load();
  };

  const remove = async (t: any) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    const { error } = await supabase.from("checklist_templates").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else load();
  };

  const myTemplates = templates.filter((t) => t.owner_user_id === user?.id);
  const masters = templates.filter((t) => t.is_system_master);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-display text-2xl">Checklist templates</h1>
          <p className="text-sm text-muted-foreground">
            Edit your transaction checklists. Each new deal seeds from your default for the matching side.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Create new template</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="flex flex-col md:flex-row gap-2">
              <Input placeholder="Template name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit"><Plus className="h-4 w-4 mr-2" />Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">My templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {myTemplates.length === 0 && <p className="text-sm text-muted-foreground">No personal templates yet.</p>}
            {myTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{t.side}</Badge>
                    {t.is_default && <Badge className="text-[10px]">Default</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                </div>
                {!t.is_default && (
                  <Button size="sm" variant="ghost" onClick={() => setDefault(t)}>Set default</Button>
                )}
                <Link to={`/dashboard/templates/${t.id}`}>
                  <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {masters.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">System master templates</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Read-only reference. Your personal copies live above.</p>
              {masters.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{t.side}</Badge>
                  </div>
                  <Link to={`/dashboard/templates/${t.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
