import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bookmark, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  propertyId: string;
  /** controlled open trigger; otherwise uses internal Button */
  trigger?: React.ReactNode;
}

interface Collection {
  id: string;
  name: string;
  has_property?: boolean;
}

export const AddToCollectionDialog = ({ propertyId, trigger }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data: cs } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const { data: items } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("property_id", propertyId);
      const has = new Set((items ?? []).map((i) => i.collection_id));
      setCollections((cs ?? []).map((c) => ({ ...c, has_property: has.has(c.id) })));
    })();
  }, [open, user, propertyId]);

  const handleOpen = (next: boolean) => {
    if (next && !user) {
      toast("Sign in to use Collections", {
        action: { label: "Sign in", onClick: () => navigate("/auth") },
      });
      return;
    }
    setOpen(next);
  };

  const toggleAdd = async (c: Collection) => {
    if (!user) return;
    setBusy(c.id);
    if (c.has_property) {
      await supabase.from("collection_items").delete().eq("collection_id", c.id).eq("property_id", propertyId);
      toast(`Removed from ${c.name}`);
    } else {
      const { error } = await supabase.from("collection_items").insert({ collection_id: c.id, property_id: propertyId });
      if (error) { setBusy(null); toast.error(error.message); return; }
      toast.success(`Saved to ${c.name}`);
    }
    setBusy(null);
    setCollections((prev) => prev.map((x) => x.id === c.id ? { ...x, has_property: !x.has_property } : x));
  };

  const createAndAdd = async () => {
    if (!user || !newName.trim()) return;
    setBusy("new");
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: newName.trim() })
      .select("id, name")
      .single();
    if (error || !data) { setBusy(null); toast.error(error?.message ?? "Failed"); return; }
    await supabase.from("collection_items").insert({ collection_id: data.id, property_id: propertyId });
    setNewName("");
    setBusy(null);
    setCollections((prev) => [{ ...data, has_property: true }, ...prev]);
    toast.success(`Created “${data.name}” and added property`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Bookmark className="mr-2 h-4 w-4" /> Save to collection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {collections.length === 0 && (
            <p className="text-sm text-muted-foreground">No collections yet — create your first one below.</p>
          )}
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleAdd(c)}
              disabled={busy === c.id}
              className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/40 text-left"
            >
              <span className="text-sm">{c.name}</span>
              {c.has_property ? <Check className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
            </button>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Create new collection</p>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Douglas County must-sees"
            />
            <Button onClick={createAndAdd} disabled={!newName.trim() || busy === "new"}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
