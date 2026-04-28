import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FolderHeart, Plus, ArrowRight, Share2 } from "lucide-react";

export default function PortalCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("collections")
      .select("*, collection_items(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCollections(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("collections").insert({ user_id: user.id, name: name.trim() });
    if (error) { toast.error(error.message); return; }
    setName("");
    toast.success("Collection created");
    load();
  };

  const share = async (id: string) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("collections")
      .update({ is_shared: true, share_token: token })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    const url = `${window.location.origin}/c/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied", { description: url });
    load();
  };

  return (
    <ClientPortalLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <FolderHeart className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Collections</h1>
            <p className="text-muted-foreground text-sm">Named shortlists you can share with your agent.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New collection name" />
            <Button onClick={create} disabled={!name.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </CardContent>
        </Card>

        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {collections.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-medium text-primary">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {c.collection_items?.[0]?.count ?? 0} properties
                    </p>
                  </div>
                  {c.is_shared && <Badge variant="secondary">Shared</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/portal/collections/${c.id}`}>
                      Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => share(c.id)}>
                    <Share2 className="mr-1.5 h-4 w-4" /> Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && collections.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No collections yet. Create one above, then click <strong>Save to collection</strong> on any listing.
            </CardContent>
          </Card>
        )}
      </div>
    </ClientPortalLayout>
  );
}
