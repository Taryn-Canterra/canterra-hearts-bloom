import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  dealId: string;
}

export const ClientActionItems = ({ dealId }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    // Find party rows for this deal that link to current user
    const { data: parties } = await supabase
      .from("deal_parties")
      .select("id")
      .eq("deal_id", dealId)
      .eq("user_id", user.id);
    const partyIds = (parties ?? []).map((p) => p.id);
    if (partyIds.length === 0) { setItems([]); setLoading(false); return; }

    const { data: tasks } = await supabase
      .from("deal_checklist_items")
      .select("*")
      .eq("deal_id", dealId)
      .eq("kind", "task")
      .eq("client_visible", true)
      .in("assigned_party_id", partyIds)
      .order("sort_order");
    setItems(tasks ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dealId, user?.id]);

  useEffect(() => {
    if (!dealId) return;
    const channel = supabase
      .channel(`my-tasks-${dealId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_checklist_items", filter: `deal_id=eq.${dealId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dealId, user?.id]);

  const toggle = async (item: any) => {
    const next = !item.completed;
    const { error } = await supabase
      .from("deal_checklist_items")
      .update({
        completed: next,
        completed_at: next ? new Date().toISOString() : null,
        completed_by: next ? user!.id : null,
      })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else load();
  };

  if (loading) return null;
  if (items.length === 0) return null;

  const open = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed).length;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            Your action items
          </CardTitle>
          <Badge variant="secondary">{open.length} open · {done} done</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Tasks your agent has assigned to you. Check them off as you finish.</p>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> All caught up — nice work!
          </div>
        ) : (
          <ul className="space-y-2">
            {open.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-background/60">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggle(item)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.body && <p className="text-xs text-muted-foreground mt-0.5">{item.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
