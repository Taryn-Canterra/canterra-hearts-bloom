import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, Trash2, Bell } from "lucide-react";

export default function PortalSearches() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSearches(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const toggleAlert = async (id: string, val: boolean) => {
    await supabase.from("user_saved_searches").update({ alert_enabled: val }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("user_saved_searches").delete().eq("id", id);
    toast("Deleted"); load();
  };

  return (
    <ClientPortalLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Search className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Saved searches</h1>
            <p className="text-muted-foreground text-sm">Your saved filter sets — toggle email alerts per search.</p>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && searches.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
            No saved searches yet. Open the search page and click <strong>Save this search</strong>.
          </CardContent></Card>
        )}

        <div className="grid gap-3">
          {searches.map((s) => {
            const f = (s.filters ?? {}) as any;
            const summary = [
              f.acreageMin ? `${f.acreageMin}+ ac` : null,
              f.stallCountMin ? `${f.stallCountMin}+ stalls` : null,
              f.waterRights ? "water rights" : null,
              f.arenaTypes?.length ? `${f.arenaTypes.join("/")} arena` : null,
              f.counties?.length ? `${f.counties.join(", ")}` : null,
            ].filter(Boolean).join(" · ");
            return (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary">{s.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{summary || "All listings"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Switch checked={s.alert_enabled} onCheckedChange={(v) => toggleAlert(s.id, v)} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ClientPortalLayout>
  );
}
