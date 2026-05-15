import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  state: z.string().trim().min(2).max(50),
  county: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type Props = { trigger: React.ReactNode; onCreated?: () => void };

export const AddLeadDialog = ({ trigger, onCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", state: "CO", county: "",
    max_price: "", min_acres: "", min_stalls: "", bedrooms: "",
    notes: "", needs_financing: false,
  });

  const update = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setSaving(true);
    const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^0-9.]/g, "")));

    const { data: lead, error } = await supabase.from("buyer_leads").insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      state: parsed.data.state,
      county: parsed.data.county || null,
      max_price: toNum(form.max_price),
      min_acres: toNum(form.min_acres),
      min_stalls: toNum(form.min_stalls),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      notes: parsed.data.notes || null,
      needs_financing: form.needs_financing,
    }).select().single();

    if (error || !lead) { setSaving(false); toast.error(error?.message ?? "Failed"); return; }

    if (form.claim_to_self && user) {
      await supabase.from("lead_assignments").insert({
        lead_type: "buyer_lead", lead_id: lead.id, assigned_to: user.id, status: "new",
      });
    }

    setSaving(false);
    setOpen(false);
    setForm({
      name: "", email: "", phone: "", state: "CO", county: "",
      max_price: "", min_acres: "", min_stalls: "", bedrooms: "",
      notes: "", needs_financing: false, claim_to_self: true,
    });
    toast.success("Lead added");
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a new lead</DialogTitle>
          <DialogDescription>
            Capture a lead before they're under contract. You can convert them to a deal later when they're ready.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ld-name">Name *</Label>
              <Input id="ld-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-email">Email</Label>
              <Input id="ld-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-phone">Phone</Label>
              <Input id="ld-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-state">State *</Label>
              <Input id="ld-state" required value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ld-county">County</Label>
              <Input id="ld-county" value={form.county} onChange={(e) => update("county", e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Search basics (optional)</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ld-acres">Min acres</Label>
                <Input id="ld-acres" inputMode="numeric" value={form.min_acres} onChange={(e) => update("min_acres", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ld-price">Max price</Label>
                <Input id="ld-price" inputMode="numeric" value={form.max_price} onChange={(e) => update("max_price", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ld-stalls">Min stalls</Label>
                <Input id="ld-stalls" inputMode="numeric" value={form.min_stalls} onChange={(e) => update("min_stalls", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ld-beds">Bedrooms</Label>
                <Input id="ld-beds" inputMode="numeric" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ld-notes">Notes</Label>
            <Textarea id="ld-notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
            <Checkbox id="ld-financing" checked={form.needs_financing} onCheckedChange={(c) => update("needs_financing", c === true)} className="mt-0.5" />
            <Label htmlFor="ld-financing" className="cursor-pointer text-sm font-normal">Needs financing referral</Label>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
            <Checkbox id="ld-claim" checked={form.claim_to_self} onCheckedChange={(c) => update("claim_to_self", c === true)} className="mt-0.5" />
            <Label htmlFor="ld-claim" className="cursor-pointer text-sm font-normal">Assign this lead to me</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
