import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, FileUp, Trash2, UserPlus, Mail, CheckCircle2 } from "lucide-react";

export const DealClientPanel = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data: c }, { data: m }, { data: d }] = await Promise.all([
      supabase.from("deal_clients").select("*").eq("deal_id", dealId),
      supabase.from("deal_messages").select("*").eq("deal_id", dealId).order("created_at", { ascending: true }),
      supabase.from("deal_documents").select("*").eq("deal_id", dealId).order("created_at", { ascending: false }),
    ]);
    setClients(c ?? []);
    setMessages(m ?? []);
    setDocs(d ?? []);
  };

  useEffect(() => { load(); }, [dealId]);

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`agent-deal-${dealId}-msgs`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${dealId}` },
        (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dealId]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail.trim()) return;
    const { error } = await supabase.from("deal_clients").insert({
      deal_id: dealId, client_email: inviteEmail.trim().toLowerCase(), invited_by: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Client invited. They'll see this deal once they sign up with that email.");
      setInviteEmail("");
      load();
    }
  };

  const removeClient = async (id: string) => {
    if (!confirm("Remove this client from the deal?")) return;
    await supabase.from("deal_clients").delete().eq("id", id);
    load();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    const { error } = await supabase.from("deal_messages").insert({ deal_id: dealId, sender_id: user.id, body: newMsg });
    if (error) toast.error(error.message);
    else setNewMsg("");
  };

  const uploadFile = async (file: File) => {
    if (!user) return;
    const path = `${dealId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { error: dbErr } = await supabase.from("deal_documents").insert({
      deal_id: dealId, uploaded_by: user.id, filename: file.name,
      storage_path: path, mime_type: file.type, size_bytes: file.size, visible_to_client: true,
    });
    if (dbErr) toast.error(dbErr.message);
    else { toast.success("Uploaded"); load(); }
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("deal-documents").createSignedUrl(doc.storage_path, 60);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank");
  };

  const toggleDocVisibility = async (doc: any) => {
    await supabase.from("deal_documents").update({ visible_to_client: !doc.visible_to_client }).eq("id", doc.id);
    load();
  };

  const deleteDoc = async (doc: any) => {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    await supabase.storage.from("deal-documents").remove([doc.storage_path]);
    await supabase.from("deal_documents").delete().eq("id", doc.id);
    load();
  };

  return (
    <>
      {/* Clients on this deal */}
      <Card>
        <CardHeader><CardTitle>Client access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={invite} className="flex gap-2">
            <Input
              type="email" required placeholder="client@example.com"
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button type="submit"><UserPlus className="mr-2 h-4 w-4" /> Invite</Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Client signs up at <code className="px-1 bg-muted rounded">/auth</code> with this email and instantly gets access to a read-only portal for this deal.
          </p>
          {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients invited yet.</p>}
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-2 rounded border">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.client_email}</p>
                <p className="text-xs text-muted-foreground">
                  {c.accepted_at
                    ? <><CheckCircle2 className="inline h-3 w-3 mr-1" /> Joined {new Date(c.accepted_at).toLocaleDateString()}</>
                    : "Pending — waiting for signup"}
                </p>
              </div>
              {!c.accepted_at && <Badge variant="secondary">Pending</Badge>}
              <Button size="sm" variant="ghost" onClick={() => removeClient(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <div>
            <input ref={fileRef} type="file" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.uploaded_by === user?.id ? "Uploaded by you" : "Uploaded by client"} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Visible</Label>
                  <Switch checked={doc.visible_to_client} onCheckedChange={() => toggleDocVisibility(doc)} />
                </div>
                <Button size="sm" variant="ghost" onClick={() => downloadDoc(doc)}><Download className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteDoc(doc)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader><CardTitle>Messages with client</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Textarea rows={2} placeholder="Reply…" value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }} />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
