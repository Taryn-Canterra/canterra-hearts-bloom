import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, Circle, Download, FileUp, Trash2 } from "lucide-react";

const STAGES = [
  { key: "new_lead", label: "New Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "property_tour_or_listing_prep", label: "Tour / Listing Prep" },
  { key: "offer_drafted_or_listed", label: "Offer Drafted / Listed" },
  { key: "offer_accepted_under_contract", label: "Under Contract" },
  { key: "inspection_and_appraisal", label: "Inspection & Appraisal" },
  { key: "financing_and_title", label: "Financing & Title" },
  { key: "closing", label: "Closing" },
  { key: "closed_won", label: "Closed" },
];

export default function PortalDeal() {
  const { id } = useParams();
  const { user } = useAuth();
  const [deal, setDeal] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const [{ data: d }, { data: ci }, { data: msgs }, { data: dd }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).maybeSingle(),
      supabase.from("deal_checklist_items").select("*").eq("deal_id", id).order("stage").order("sort_order"),
      supabase.from("deal_messages").select("*").eq("deal_id", id).order("created_at", { ascending: true }),
      supabase.from("deal_documents").select("*").eq("deal_id", id).order("created_at", { ascending: false }),
    ]);
    setDeal(d);
    setItems(ci ?? []);
    setMessages(msgs ?? []);
    setDocs(dd ?? []);

    if (d?.property_id) {
      const { data: p } = await supabase.from("properties").select("*").eq("id", d.property_id).maybeSingle();
      setProperty(p);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`deal-${id}-msgs`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${id}` },
        (payload) => setMessages((m) => [...m, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !id) return;
    const { error } = await supabase.from("deal_messages").insert({ deal_id: id, sender_id: user.id, body: newMsg });
    if (error) toast.error(error.message);
    else setNewMsg("");
  };

  const uploadFile = async (file: File) => {
    if (!user || !id) return;
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }

    const { error: dbErr } = await supabase.from("deal_documents").insert({
      deal_id: id, uploaded_by: user.id, filename: file.name,
      storage_path: path, mime_type: file.type, size_bytes: file.size, visible_to_client: true,
    });
    if (dbErr) toast.error(dbErr.message);
    else { toast.success("Uploaded"); load(); }
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("deal-documents").createSignedUrl(doc.storage_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (doc: any) => {
    if (doc.uploaded_by !== user?.id) return;
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    await supabase.storage.from("deal-documents").remove([doc.storage_path]);
    await supabase.from("deal_documents").delete().eq("id", doc.id);
    load();
  };

  if (loading) return <ClientPortalLayout><p>Loading…</p></ClientPortalLayout>;
  if (!deal) return <ClientPortalLayout><p>Transaction not found.</p></ClientPortalLayout>;

  const totalVisible = items.length;
  const completed = items.filter((i) => i.completed).length;
  const pct = totalVisible ? Math.round((completed / totalVisible) * 100) : 0;
  const currentStageIdx = STAGES.findIndex((s) => s.key === deal.stage);

  return (
    <ClientPortalLayout>
      <div className="space-y-6 max-w-5xl">
        <Link to="/portal" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> All transactions
        </Link>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={deal.side === "buyer" ? "default" : "outline"}>{deal.side}</Badge>
            </div>
            <CardTitle className="font-display text-2xl">{deal.property_address ?? deal.client_name}</CardTitle>
            {deal.price && <p className="text-muted-foreground mt-1">${Number(deal.price).toLocaleString()}</p>}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Overall progress</span>
              <span className="text-muted-foreground">{completed} / {totalVisible} steps complete</span>
            </div>
            <Progress value={pct} />
          </CardContent>
        </Card>

        {/* Stage tracker */}
        <Card>
          <CardHeader><CardTitle className="text-base">Where you are</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s, idx) => {
                const done = currentStageIdx > idx;
                const current = currentStageIdx === idx;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
                      current ? "bg-primary text-primary-foreground border-primary" :
                      done ? "bg-secondary text-secondary-foreground border-secondary" :
                      "bg-muted/30 text-muted-foreground border-border"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    {s.label}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Property */}
        {property && (
          <Card>
            <CardHeader><CardTitle className="text-base">Property details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {property.primary_photo && (
                <img src={property.primary_photo} alt={property.title ?? "Property"}
                  className="col-span-2 md:col-span-1 row-span-2 rounded-md object-cover h-32 w-full" />
              )}
              <Stat label="Beds" value={property.beds} />
              <Stat label="Baths" value={property.baths} />
              <Stat label="Sq ft" value={property.sqft?.toLocaleString()} />
              <Stat label="Acres" value={property.acres} />
              <Stat label="Stalls" value={property.stalls} />
              <Stat label="Paddocks" value={property.paddocks} />
              <Stat label="MLS #" value={property.mls_number} />
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction checklist</CardTitle>
            <p className="text-sm text-muted-foreground">Steps your agent is tracking on your behalf.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {STAGES.map((s) => {
              const stageItems = items.filter((i) => i.stage === s.key);
              if (stageItems.length === 0) return null;
              return (
                <div key={s.key}>
                  <h4 className="font-medium text-sm uppercase tracking-wider text-primary mb-2">{s.label}</h4>
                  <ul className="space-y-1.5">
                    {stageItems.map((i) => (
                      <li key={i.id} className="flex items-start gap-2 text-sm">
                        {i.completed
                          ? <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                        <span className={i.completed ? "text-muted-foreground line-through" : ""}>{i.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documents</CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
              />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents shared yet.</p>}
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.uploaded_by === user?.id ? "Uploaded by you" : "Shared by your agent"} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => downloadDoc(doc)}><Download className="h-4 w-4" /></Button>
                  {doc.uploaded_by === user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => deleteDoc(doc)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader><CardTitle className="text-base">Messages with your agent</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>}
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
              <Textarea rows={2} placeholder="Send a message…" value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }} />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  );
}

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-medium mt-1">{value ?? "—"}</p>
  </div>
);
