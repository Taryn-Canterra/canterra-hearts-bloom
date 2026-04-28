import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, FileUp, Trash2, FileText, Eye, EyeOff } from "lucide-react";

const CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "disclosure", label: "Disclosure" },
  { value: "inspection", label: "Inspection" },
  { value: "appraisal", label: "Appraisal" },
  { value: "title", label: "Title" },
  { value: "financing", label: "Financing" },
  { value: "addendum", label: "Addendum / Amendment" },
  { value: "other", label: "Other" },
];

const fmtSize = (b?: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export const DealDocumentsManager = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string>("other");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("deal_documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
  };

  useEffect(() => { load(); }, [dealId]);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${dealId}/${pendingCategory}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("deal_documents").insert({
        deal_id: dealId,
        uploaded_by: user.id,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        category: pendingCategory,
        visible_to_client: true,
      });
      if (dbErr) throw dbErr;
      toast.success("Uploaded");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = async (doc: any) => {
    const { data, error } = await supabase.storage
      .from("deal-documents")
      .createSignedUrl(doc.storage_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (doc: any) => {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    await supabase.storage.from("deal-documents").remove([doc.storage_path]);
    const { error } = await supabase.from("deal_documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const toggleVisibility = async (doc: any) => {
    const { error } = await supabase
      .from("deal_documents")
      .update({ visible_to_client: !doc.visible_to_client })
      .eq("id", doc.id);
    if (error) toast.error(error.message);
    else load();
  };

  const updateCategory = async (doc: any, category: string) => {
    const { error } = await supabase.from("deal_documents").update({ category }).eq("id", doc.id);
    if (error) toast.error(error.message);
    else load();
  };

  const filtered = filter === "all" ? docs : docs.filter((d) => (d.category ?? "other") === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Documents & contracts
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              All deal files in one place. Toggle visibility to control what your client sees.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={pendingCategory} onValueChange={setPendingCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <FileUp className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({docs.length})
          </Button>
          {CATEGORIES.map((c) => {
            const count = docs.filter((d) => (d.category ?? "other") === c.value).length;
            if (count === 0) return null;
            return (
              <Button
                key={c.value}
                size="sm"
                variant={filter === c.value ? "default" : "outline"}
                onClick={() => setFilter(c.value)}
              >
                {c.label} ({count})
              </Button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No documents in this category yet.
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/30"
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                  {doc.size_bytes ? ` · ${fmtSize(doc.size_bytes)}` : ""}
                </p>
              </div>
              <Select
                value={doc.category ?? "other"}
                onValueChange={(v) => updateCategory(doc, v)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2" title={doc.visible_to_client ? "Client can see this" : "Hidden from client"}>
                {doc.visible_to_client
                  ? <Eye className="h-3.5 w-3.5 text-primary" />
                  : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                <Switch
                  checked={doc.visible_to_client}
                  onCheckedChange={() => toggleVisibility(doc)}
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => download(doc)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(doc)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
