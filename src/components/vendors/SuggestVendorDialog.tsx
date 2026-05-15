import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VENDOR_CATEGORIES } from "@/lib/vendorCategories";
import { ALL_STATES } from "@/hooks/useSearchFilters";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";

const schema = z.object({
  vendor_name: z.string().trim().min(2).max(120),
  vendor_email: z.string().trim().email().optional().or(z.literal("")),
  vendor_phone: z.string().trim().max(40).optional(),
  vendor_website: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().min(1),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
  personal_note: z.string().trim().max(1000).optional(),
});

export const SuggestVendorDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    vendor_name: "", vendor_email: "", vendor_phone: "", vendor_website: "",
    category: "", city: "", state: "", personal_note: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Please complete the form"); return; }
    setBusy(true);
    const { error } = await supabase.from("vendor_suggestions").insert({
      submitted_by: user.id,
      vendor_name: form.vendor_name.trim(),
      vendor_email: form.vendor_email.trim() || null,
      vendor_phone: form.vendor_phone.trim() || null,
      vendor_website: form.vendor_website.trim() || null,
      category: form.category,
      city: form.city.trim() || null,
      state: form.state || null,
      personal_note: form.personal_note.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks! We'll send them an invite to join Canterra.");
    setOpen(false);
    setForm({ vendor_name: "", vendor_email: "", vendor_phone: "", vendor_website: "", category: "", city: "", state: "", personal_note: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-1.5" /> Suggest a favorite vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recommend a favorite equine pro</DialogTitle>
          <DialogDescription>
            Help our community grow. We'll send them a friendly invite to claim their profile on Canterra.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-4 text-sm">
            Please <Link to="/auth" className="text-primary underline">sign in</Link> to suggest a vendor.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Vendor name *</Label>
              <Input value={form.vendor_name} onChange={(e) => set("vendor_name", e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.vendor_email} onChange={(e) => set("vendor_email", e.target.value)} type="email" placeholder="vendor@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.vendor_phone} onChange={(e) => set("vendor_phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.vendor_website} onChange={(e) => set("vendor_website", e.target.value)} placeholder="https://" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {ALL_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Why do you recommend them?</Label>
              <Textarea value={form.personal_note} onChange={(e) => set("personal_note", e.target.value)} maxLength={1000} rows={3} placeholder="Optional — we may include a snippet in the invite." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          {user && <Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send invite"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
