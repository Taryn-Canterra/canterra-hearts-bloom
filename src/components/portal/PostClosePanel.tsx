import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Phone, Mail, Wrench } from "lucide-react";

export const PostClosePanel = ({ deal }: { deal: any }) => {
  const { user, isClient } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  const refresh = async () => {
    const [{ data: v }, { data: r }] = await Promise.all([
      supabase.from("deal_vendors").select("*").eq("deal_id", deal.id).order("category"),
      supabase.from("deal_maintenance_reminders").select("*").eq("deal_id", deal.id).order("due_on", { nullsFirst: false }),
    ]);
    setVendors(v ?? []);
    setReminders(r ?? []);
  };

  useEffect(() => { refresh(); }, [deal.id]);

  const toggleReminder = async (r: any) => {
    if (!isClient) return;
    await supabase.from("deal_maintenance_reminders").update({ completed: !r.completed }).eq("id", r.id);
    refresh();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Property maintenance
          </CardTitle>
          <p className="text-xs text-muted-foreground">Seasonal reminders for your horse property.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {reminders.length === 0 && <p className="text-sm text-muted-foreground">Your agent will add reminders after closing.</p>}
          {reminders.map((r) => (
            <div key={r.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
              <Checkbox checked={r.completed} onCheckedChange={() => toggleReminder(r)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${r.completed ? "line-through text-muted-foreground" : ""}`}>{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  {r.due_on && <Badge variant="outline" className="text-[10px]">{new Date(r.due_on).toLocaleDateString()}</Badge>}
                  {r.recurrence && r.recurrence !== "none" && <Badge variant="secondary" className="text-[10px]">{r.recurrence}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor directory</CardTitle>
          <p className="text-xs text-muted-foreground">Local pros for your property.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {vendors.length === 0 && <p className="text-sm text-muted-foreground">Your agent will populate trusted vendors.</p>}
          {vendors.map((v) => (
            <div key={v.id} className="border rounded p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{v.name}</p>
                <Badge variant="outline" className="text-[10px]">{v.category}</Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                {v.phone && <a href={`tel:${v.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />{v.phone}</a>}
                {v.email && <a href={`mailto:${v.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{v.email}</a>}
              </div>
              {v.notes && <p className="text-xs mt-1">{v.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
