import { useEffect, useState } from "react";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Mail, Trash2, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function PortalSavedVendors() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_saved_vendors")
      .select("id, notes, created_at, vendor_id, vendors(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []).filter((r: any) => r.vendors));
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("user_saved_vendors").delete().eq("id", id);
    toast.success("Removed");
    refresh();
  };

  return (
    <ClientPortalLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-primary">Your saved vendors</h1>
        <p className="text-muted-foreground text-sm mt-1">Quick contact for the pros you trust.</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && rows.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No saved vendors yet. Browse the <Link to="/vendors" className="text-primary underline">vendor directory</Link> and tap the heart to save.
        </CardContent></Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => {
          const v = r.vendors;
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/vendors/${v.id}`} className="font-medium text-primary hover:underline">{v.name}</Link>
                    <p className="text-xs text-muted-foreground">{v.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {v.is_verified && <Badge variant="secondary" className="text-[10px] gap-1"><BadgeCheck className="h-3 w-3" /> Verified</Badge>}
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {v.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="font-medium">{Number(v.rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({v.review_count})</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1 border-t">
                  {v.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.city}, {v.state}</span>}
                  {v.phone && <a href={`tel:${v.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" /> {v.phone}</a>}
                  {v.email && <a href={`mailto:${v.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" /> Email</a>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ClientPortalLayout>
  );
}
