import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Phone, Mail, Star, ListChecks, BadgeCheck } from "lucide-react";

export const SharedVendorLists = ({ dealId }: { dealId: string }) => {
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("agent_vendor_lists")
        .select("*, agent_vendor_list_items(agent_note, sort_order, vendors(*))")
        .eq("deal_id", dealId)
        .order("created_at");
      setLists(data ?? []);
    })();
  }, [dealId]);

  if (lists.length === 0) return null;

  return (
    <div className="space-y-4">
      {lists.map((l) => {
        const items = (l.agent_vendor_list_items ?? []).filter((i: any) => i.vendors).sort((a: any, b: any) => a.sort_order - b.sort_order);
        return (
          <Card key={l.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{l.cover_emoji ?? "📋"}</span>
                {l.name}
                <Badge variant="secondary" className="text-[10px] gap-1"><ListChecks className="h-3 w-3" /> Curated by your agent</Badge>
              </CardTitle>
              {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((it: any) => (
                <div key={it.vendors.id} className="border rounded p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/vendors/${it.vendors.id}`} className="font-medium text-primary hover:underline">{it.vendors.name}</Link>
                    {it.vendors.is_verified && <Badge variant="secondary" className="text-[10px] gap-1"><BadgeCheck className="h-3 w-3" /> Verified</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{it.vendors.category}</span>
                    {it.vendors.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" /> {Number(it.vendors.rating).toFixed(1)}</span>}
                    {it.vendors.city && <span>· {it.vendors.city}, {it.vendors.state}</span>}
                  </div>
                  {it.agent_note && <p className="text-xs italic text-foreground/80 mt-1.5 border-l-2 border-accent pl-2">"{it.agent_note}"</p>}
                  <div className="flex flex-wrap gap-3 text-xs mt-1.5">
                    {it.vendors.phone && <a href={`tel:${it.vendors.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Phone className="h-3 w-3" /> {it.vendors.phone}</a>}
                    {it.vendors.email && <a href={`mailto:${it.vendors.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Mail className="h-3 w-3" /> Email</a>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">Your agent hasn't added any vendors to this list yet.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
