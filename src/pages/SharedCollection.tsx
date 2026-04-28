import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Heart, ThumbsUp, Meh, X as XIcon } from "lucide-react";

const REACTION_ICON: Record<string, any> = { love: Heart, like: ThumbsUp, maybe: Meh, no: XIcon };

export default function SharedCollection() {
  const { token } = useParams();
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: c } = await supabase
        .from("collections")
        .select("*")
        .eq("share_token", token)
        .eq("is_shared", true)
        .maybeSingle();
      if (c) {
        const { data: its } = await supabase
          .from("collection_items")
          .select("*, property:properties(*)")
          .eq("collection_id", c.id)
          .order("added_at", { ascending: false });
        setCollection(c);
        setItems(its ?? []);
      }
      setLoading(false);
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 max-w-5xl">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && !collection && (
          <div className="text-center py-20">
            <h1 className="font-display text-3xl text-primary">Collection not found</h1>
            <p className="text-muted-foreground mt-2">This share link may have been disabled.</p>
          </div>
        )}
        {collection && (
          <>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-2">Shared collection</Badge>
              <h1 className="font-display text-4xl font-semibold text-primary">{collection.name}</h1>
              <p className="text-muted-foreground mt-1">{items.length} properties</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((it) => {
                const p = it.property;
                if (!p) return null;
                const Icon = it.reaction ? REACTION_ICON[it.reaction] : null;
                return (
                  <Card key={it.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <Link to={`/listing/${p.id}`}>
                      {p.primary_photo && (
                        <img src={p.primary_photo} alt={p.title ?? ""} className="w-full h-48 object-cover" />
                      )}
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-lg font-medium text-primary truncate">
                              {p.title ?? p.address ?? "Property"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {[p.city, p.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                          {Icon && <Icon className="h-5 w-5 text-accent shrink-0" />}
                        </div>
                        {p.price && <p className="font-semibold">${Number(p.price).toLocaleString()}</p>}
                        <Badge variant="outline" className="text-xs">{it.status}</Badge>
                        {it.buyer_notes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">"{it.buyer_notes}"</p>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
