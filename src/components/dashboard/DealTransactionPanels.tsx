import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const ShowingsManager = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ scheduled_at: "", buyer_agent_name: "", buyer_agent_brokerage: "" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_showings").select("*").eq("deal_id", dealId).order("scheduled_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduled_at) return;
    const { error } = await supabase.from("deal_showings").insert({
      deal_id: dealId,
      scheduled_at: form.scheduled_at,
      buyer_agent_name: form.buyer_agent_name || null,
      buyer_agent_brokerage: form.buyer_agent_brokerage || null,
      created_by: user!.id,
      requested_by_role: "agent",
      confirmed_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else { setForm({ scheduled_at: "", buyer_agent_name: "", buyer_agent_brokerage: "" }); refresh(); }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("deal_showings").update({ status }).eq("id", id);
    refresh();
  };
  const updateFeedback = async (id: string, feedback: string) => {
    await supabase.from("deal_showings").update({ feedback }).eq("id", id);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this showing?")) return;
    await supabase.from("deal_showings").delete().eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Showings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div>
            <Label className="text-xs">Date & time</Label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
          </div>
          <div>
            <Label className="text-xs">Buyer's agent</Label>
            <Input value={form.buyer_agent_name} onChange={(e) => setForm({ ...form, buyer_agent_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Brokerage</Label>
            <Input value={form.buyer_agent_brokerage} onChange={(e) => setForm({ ...form, buyer_agent_brokerage: e.target.value })} />
          </div>
          <Button type="submit">Add showing</Button>
        </form>

        <div className="space-y-2">
          {items.map((s) => {
            const pendingClient = s.requested_by_role === "client" && !s.confirmed_at;
            return (
              <div key={s.id} className={`border rounded p-3 space-y-2 ${pendingClient ? "border-primary/50 bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(s.scheduled_at).toLocaleString()}
                      {pendingClient && (
                        <Badge variant="default" className="ml-2 text-[10px]">Buyer requested</Badge>
                      )}
                      {s.confirmed_at && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Confirmed</Badge>
                      )}
                    </p>
                    {s.buyer_agent_name && <p className="text-xs text-muted-foreground">{s.buyer_agent_name}{s.buyer_agent_brokerage ? ` · ${s.buyer_agent_brokerage}` : ""}</p>}
                    {s.notes && <p className="text-xs text-muted-foreground italic mt-1">"{s.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingClient && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase
                            .from("deal_showings")
                            .update({ confirmed_at: new Date().toISOString(), status: "scheduled" })
                            .eq("id", s.id);
                          refresh();
                        }}
                      >
                        Confirm
                      </Button>
                    )}
                    <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No-show</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Textarea
                  rows={2} placeholder="Feedback from buyer's agent…"
                  defaultValue={s.feedback ?? ""}
                  onBlur={(e) => updateFeedback(s.id, e.target.value)}
                />
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No showings logged.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const OffersManager = ({ dealId, isSeller }: { dealId: string; isSeller: boolean }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    offer_price: "", earnest_money: "", financing_type: "conventional",
    proposed_close_date: "", buyer_or_offering_party: "", contingencies: "", agent_recommendation: "",
  });

  const refresh = async () => {
    const { data } = await supabase.from("deal_offers").select("*").eq("deal_id", dealId).order("submitted_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("deal_offers").insert({
      deal_id: dealId,
      direction: isSeller ? "incoming" : "outgoing",
      offer_price: Number(form.offer_price),
      earnest_money: form.earnest_money ? Number(form.earnest_money) : null,
      financing_type: form.financing_type,
      proposed_close_date: form.proposed_close_date || null,
      buyer_or_offering_party: form.buyer_or_offering_party || null,
      contingencies: form.contingencies || null,
      agent_recommendation: form.agent_recommendation || null,
      created_by: user!.id,
    });
    if (error) toast.error(error.message);
    else {
      setForm({ offer_price: "", earnest_money: "", financing_type: "conventional", proposed_close_date: "", buyer_or_offering_party: "", contingencies: "", agent_recommendation: "" });
      refresh();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("deal_offers").update({ status }).eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSeller ? "Offers received" : "Offers submitted"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Offer price" type="number" required value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} />
          <Input placeholder="Earnest money" type="number" value={form.earnest_money} onChange={(e) => setForm({ ...form, earnest_money: e.target.value })} />
          <Select value={form.financing_type} onValueChange={(v) => setForm({ ...form, financing_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["cash", "conventional", "fha", "va", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Proposed close date" type="date" value={form.proposed_close_date} onChange={(e) => setForm({ ...form, proposed_close_date: e.target.value })} />
          <Input placeholder={isSeller ? "Buyer name" : "Counterparty"} value={form.buyer_or_offering_party} onChange={(e) => setForm({ ...form, buyer_or_offering_party: e.target.value })} />
          <Input placeholder="Contingencies" value={form.contingencies} onChange={(e) => setForm({ ...form, contingencies: e.target.value })} />
          <Textarea className="md:col-span-3" rows={2} placeholder="Your recommendation to the client…"
            value={form.agent_recommendation} onChange={(e) => setForm({ ...form, agent_recommendation: e.target.value })} />
          <Button type="submit" className="md:col-span-3">Add offer</Button>
        </form>

        <div className="space-y-2">
          {items.map((o) => (
            <div key={o.id} className="border rounded p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-display text-lg font-semibold">${Number(o.offer_price).toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <Badge>{o.financing_type}</Badge>
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["submitted", "countered", "accepted", "rejected", "withdrawn"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {o.agent_recommendation && <p className="text-xs mt-2 italic">{o.agent_recommendation}</p>}
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No offers yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const LenderMilestonesManager = ({ dealId }: { dealId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ milestone: "application", notes: "" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_lender_milestones").select("*").eq("deal_id", dealId).order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const sort_order = items.length;
    await supabase.from("deal_lender_milestones").insert({
      deal_id: dealId, milestone: form.milestone, notes: form.notes || null, sort_order,
    });
    setForm({ milestone: "application", notes: "" });
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    const reached_at = status === "complete" ? new Date().toISOString() : null;
    await supabase.from("deal_lender_milestones").update({ status, reached_at }).eq("id", id);
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("deal_lender_milestones").delete().eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Lender milestones</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={form.milestone} onValueChange={(v) => setForm({ ...form, milestone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["application", "processing", "conditional_approval", "appraisal_review", "clear_to_close", "funded"].map((m) =>
                <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit">Add milestone</Button>
        </form>

        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border rounded p-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{m.milestone.replace(/_/g, " ")}</p>
                {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
              </div>
              <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending", "in_progress", "complete", "blocked"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const PriceReductionManager = ({ deal, onSaved }: { deal: any; onSaved: () => void }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ proposed_price: "", reasoning: "" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_price_reductions").select("*").eq("deal_id", deal.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [deal.id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const prior = deal.list_price ?? deal.price;
    if (!prior) return toast.error("Set list price first.");
    const { error } = await supabase.from("deal_price_reductions").insert({
      deal_id: deal.id,
      proposed_price: Number(form.proposed_price),
      prior_price: Number(prior),
      reasoning: form.reasoning || null,
      proposed_by: user!.id,
    });
    if (error) toast.error(error.message);
    else { setForm({ proposed_price: "", reasoning: "" }); refresh(); }
  };

  const apply = async (p: any) => {
    const { error } = await supabase.from("deals").update({ list_price: p.proposed_price }).eq("id", deal.id);
    if (error) return toast.error(error.message);
    await supabase.from("deal_price_reductions").update({ status: "applied", applied_at: new Date().toISOString() }).eq("id", p.id);
    toast.success("Price reduction applied.");
    refresh();
    onSaved();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Price reductions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Proposed new price" type="number" required value={form.proposed_price} onChange={(e) => setForm({ ...form, proposed_price: e.target.value })} />
          <Input placeholder="Reasoning to share with seller" value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} />
          <Button type="submit">Propose to seller</Button>
        </form>

        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm">${Number(p.prior_price).toLocaleString()} → <span className="font-semibold">${Number(p.proposed_price).toLocaleString()}</span></p>
                <Badge variant={p.status === "applied" || p.status === "approved" ? "default" : p.status === "declined" ? "destructive" : "secondary"}>{p.status}</Badge>
              </div>
              {p.reasoning && <p className="text-xs text-muted-foreground mt-1">{p.reasoning}</p>}
              {p.status === "approved" && (
                <Button size="sm" className="mt-2" onClick={() => apply(p)}>Apply to listing</Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const EsignManager = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ document_name: "", signing_url: "", external_provider: "docusign", sent_to_email: "" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_esign_requests").select("*").eq("deal_id", dealId).order("sent_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("deal_esign_requests").insert({
      deal_id: dealId,
      document_name: form.document_name,
      signing_url: form.signing_url || null,
      external_provider: form.external_provider,
      sent_to_email: form.sent_to_email,
      created_by: user!.id,
    });
    if (error) toast.error(error.message);
    else { setForm({ document_name: "", signing_url: "", external_provider: "docusign", sent_to_email: "" }); refresh(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const signed_at = status === "signed" ? new Date().toISOString() : null;
    await supabase.from("deal_esign_requests").update({ status, signed_at }).eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-signature requests</CardTitle>
        <p className="text-xs text-muted-foreground">Mirror DocuSign / Dotloop status here so the client can see it in their portal.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input placeholder="Document name" required value={form.document_name} onChange={(e) => setForm({ ...form, document_name: e.target.value })} />
          <Input placeholder="Signing URL" value={form.signing_url} onChange={(e) => setForm({ ...form, signing_url: e.target.value })} />
          <Input placeholder="Sent to email" type="email" required value={form.sent_to_email} onChange={(e) => setForm({ ...form, sent_to_email: e.target.value })} />
          <Select value={form.external_provider} onValueChange={(v) => setForm({ ...form, external_provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["docusign", "dotloop", "skyslope", "other"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" className="md:col-span-2">Log e-sign request</Button>
        </form>

        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="border rounded p-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.document_name}</p>
                <p className="text-xs text-muted-foreground">{e.sent_to_email} · {e.external_provider}</p>
              </div>
              <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["sent", "viewed", "signed", "declined", "voided"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const VendorsManager = ({ dealId }: { dealId: string }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "farrier", name: "", phone: "", email: "", notes: "", vendor_id: "" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_vendors").select("*").eq("deal_id", dealId).order("category");
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vendors")
        .select("id, name, category, phone, email")
        .eq("is_published", true)
        .order("name")
        .limit(200);
      setDirectory(data ?? []);
    })();
  }, []);

  const pickFromDirectory = (vendorId: string) => {
    const v = directory.find((d) => d.id === vendorId);
    if (!v) return;
    setForm({
      category: v.category,
      name: v.name,
      phone: v.phone ?? "",
      email: v.email ?? "",
      notes: "",
      vendor_id: v.id,
    });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("deal_vendors").insert({
      deal_id: dealId,
      category: form.category,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      vendor_id: form.vendor_id || null,
      added_by: user!.id,
    });
    setForm({ category: "farrier", name: "", phone: "", email: "", notes: "", vendor_id: "" });
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("deal_vendors").delete().eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Vendor directory (post-close)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {directory.length > 0 && (
          <div>
            <Label className="text-xs">Pick from Canterra directory</Label>
            <Select value={form.vendor_id} onValueChange={pickFromDirectory}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Search directory…" /></SelectTrigger>
              <SelectContent>
                {directory.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name} · {v.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["farrier", "vet", "hay", "fencing", "electrician", "plumber", "well_service", "septic", "landscaper", "other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input className="md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" className="md:col-span-3">Add vendor</Button>
        </form>

        <div className="space-y-1">
          {items.map((v) => (
            <div key={v.id} className="flex items-center gap-3 border rounded p-2">
              <Badge variant="outline" className="text-[10px]">{v.category}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-2">
                  {v.name}
                  {v.vendor_id && (
                    <Link to={`/vendors/${v.vendor_id}`} className="text-[10px] text-accent hover:underline">
                      directory ↗
                    </Link>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{[v.phone, v.email].filter(Boolean).join(" · ")}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const RemindersManager = ({ dealId }: { dealId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", due_on: "", recurrence: "annual", category: "equine_seasonal" });

  const refresh = async () => {
    const { data } = await supabase.from("deal_maintenance_reminders").select("*").eq("deal_id", dealId).order("due_on", { nullsFirst: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [dealId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("deal_maintenance_reminders").insert({
      deal_id: dealId,
      title: form.title,
      description: form.description || null,
      due_on: form.due_on || null,
      recurrence: form.recurrence,
      category: form.category,
    });
    setForm({ title: "", description: "", due_on: "", recurrence: "annual", category: "equine_seasonal" });
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("deal_maintenance_reminders").delete().eq("id", id);
    refresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Maintenance reminders (post-close)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Reminder title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input type="date" value={form.due_on} onChange={(e) => setForm({ ...form, due_on: e.target.value })} />
          <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["none", "monthly", "quarterly", "biannual", "annual"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" className="md:col-span-3">Add reminder</Button>
        </form>

        <div className="space-y-1">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border rounded p-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              </div>
              {r.due_on && <Badge variant="outline" className="text-[10px]">{new Date(r.due_on).toLocaleDateString()}</Badge>}
              <Badge variant="secondary" className="text-[10px]">{r.recurrence}</Badge>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
