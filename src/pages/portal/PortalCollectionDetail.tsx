import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Heart, ThumbsUp, Meh, X as XIcon, Share2, Trash2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABELS = {
  saved: "Saved",
  toured: "Toured",
  offer_made: "Offer made",
  eliminated: "Eliminated",
} as const;

const REACTIONS = [
  { key: "love", icon: Heart, label: "Love" },
  { key: "like", icon: ThumbsUp, label: "Like" },
  { key: "maybe", icon: Meh, label: "Maybe" },
  { key: "no", icon: XIcon, label: "No" },
] as const;

export default function PortalCollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<string>("");
  const [scoring, setScoring] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
    const { data: its } = await supabase
      .from("collection_items")
      .select("*, property:properties(*)")
      .eq("collection_id", id)
      .order("added_at", { ascending: false });
    setCollection(c);
    setItems(its ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_saved_searches")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSavedSearches(data ?? []);
      if (data && data.length > 0) setSelectedSearch(data[0].id);
    })();
  }, [user]);

  const scoreItems = async () => {
    setScoring(true);
    const { data, error } = await supabase.functions.invoke("collection-match-score", {
      body: { collection_id: id, saved_search_id: selectedSearch || undefined },
    });
    setScoring(false);
    if (error) {
      toast.error(error.message ?? "Scoring failed");
      return;
    }
    if (data?.error) {
      toast.error(data.error);
      return;
    }
    toast.success(`Scored ${data?.scored ?? 0} properties`);
    load();
  };

  const updateItem = async (itemId: string, patch: any) => {
    const { error } = await supabase.from("collection_items").update(patch).eq("id", itemId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from("collection_items").delete().eq("id", itemId);
    if (error) { toast.error(error.message); return; }
    toast("Removed");
    load();
  };

  const share = async () => {
    if (!collection) return;
    const token = collection.share_token ?? crypto.randomUUID().replace(/-/g, "");
    if (!collection.is_shared) {
      await supabase.from("collections").update({ is_shared: true, share_token: token }).eq("id", collection.id);
    }
    const url = `${window.location.origin}/c/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied", { description: url });
    load();
  };

  if (loading) return <ClientPortalLayout><p>Loading…</p></ClientPortalLayout>;
  if (!collection) return <ClientPortalLayout><p>Collection not found.</p></ClientPortalLayout>;

  return (
    <ClientPortalLayout>
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portal/collections")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> All collections
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">{collection.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} properties</p>
          </div>
          <Button variant="outline" onClick={share}>
            <Share2 className="mr-2 h-4 w-4" /> {collection.is_shared ? "Copy share link" : "Share with agent"}
          </Button>
        </div>

        {items.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
            No properties yet. Browse <Link to="/" className="text-accent hover:underline">listings</Link> and click <strong>Save to collection</strong>.
          </CardContent></Card>
        )}

        <div className="grid gap-4">
          {items.map((it) => {
            const p = it.property;
            return (
              <Card key={it.id} className="overflow-hidden">
                <CardContent className="p-0 grid sm:grid-cols-[200px_1fr] gap-0">
                  {p?.primary_photo && (
                    <Link to={`/listing/${p.id}`}>
                      <img src={p.primary_photo} alt={p.title ?? "Property"} className="h-full w-full object-cover min-h-32" />
                    </Link>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/listing/${p?.id}`} className="font-display text-lg font-medium text-primary hover:underline">
                          {p?.title ?? p?.address ?? "Property"}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {[p?.city, p?.state].filter(Boolean).join(", ")}
                          {p?.price && ` · $${Number(p.price).toLocaleString()}`}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeItem(it.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={it.status} onValueChange={(v) => updateItem(it.id, { status: v })}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1">
                        {REACTIONS.map((r) => {
                          const Icon = r.icon;
                          const active = it.reaction === r.key;
                          return (
                            <button
                              key={r.key}
                              onClick={() => updateItem(it.id, { reaction: active ? null : r.key })}
                              title={r.label}
                              className={`h-8 w-8 rounded-md flex items-center justify-center border ${
                                active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>

                      {it.status && <Badge variant="secondary" className="text-xs">{STATUS_LABELS[it.status as keyof typeof STATUS_LABELS]}</Badge>}
                    </div>

                    <Textarea
                      defaultValue={it.buyer_notes ?? ""}
                      placeholder="Your notes…"
                      rows={2}
                      onBlur={(e) => {
                        if (e.target.value !== (it.buyer_notes ?? "")) {
                          updateItem(it.id, { buyer_notes: e.target.value });
                        }
                      }}
                      className="text-sm"
                    />
                    {it.agent_notes && (
                      <div className="text-xs bg-secondary/40 rounded p-2 border-l-2 border-accent">
                        <span className="font-medium">Agent: </span>{it.agent_notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ClientPortalLayout>
  );
}
