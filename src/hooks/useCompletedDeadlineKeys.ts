import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCompletedDeadlineKeys(dealId?: string | null) {
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!dealId) { setKeys(new Set()); return; }
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("deal_checklist_items")
        .select("deadline_key, completed")
        .eq("deal_id", dealId)
        .not("deadline_key", "is", null);
      if (!active) return;
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => { if (r.completed && r.deadline_key) set.add(r.deadline_key); });
      setKeys(set);
    };
    load();
    const channel = supabase
      .channel(`deadline-keys-${dealId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_checklist_items", filter: `deal_id=eq.${dealId}` }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [dealId]);

  return keys;
}
