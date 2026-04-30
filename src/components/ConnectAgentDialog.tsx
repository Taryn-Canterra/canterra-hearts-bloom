import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  state: z.string().trim().min(2, "State is required").max(50),
  county: z.string().trim().max(100).optional().or(z.literal("")),
  max_price: z.string().max(20).optional().or(z.literal("")),
  min_acres: z.string().max(20).optional().or(z.literal("")),
  min_stalls: z.string().max(20).optional().or(z.literal("")),
  bedrooms: z.string().max(10).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  needs_financing: z.boolean(),
});

type ConnectAgentDialogProps = {
  trigger: React.ReactNode;
};

export const ConnectAgentDialog = ({ trigger }: ConnectAgentDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    state: "CO",
    county: "",
    max_price: "",
    min_acres: "",
    min_stalls: "",
    bedrooms: "",
    notes: "",
    needs_financing: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Please check your info",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^0-9.]/g, "")));

    const { error } = await supabase.from("buyer_leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      state: parsed.data.state,
      county: parsed.data.county || null,
      min_price: toNum(parsed.data.min_price ?? ""),
      max_price: toNum(parsed.data.max_price ?? ""),
      min_acres: toNum(parsed.data.min_acres ?? ""),
      bedrooms: parsed.data.bedrooms ? Number(parsed.data.bedrooms) : null,
      notes: parsed.data.notes || null,
      needs_financing: parsed.data.needs_financing,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Request received",
      description: "A Canterra agent will reach out shortly.",
    });
    setOpen(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      state: "CO",
      county: "",
      min_price: "",
      max_price: "",
      min_acres: "",
      bedrooms: "",
      notes: "",
      needs_financing: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Connect with a Canterra agent</DialogTitle>
          <DialogDescription>
            Tell us what you're looking for. A licensed equine-savvy agent will reach out within
            one business day.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State *</Label>
              <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} required maxLength={50} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="county">County</Label>
              <Input id="county" value={form.county} onChange={(e) => update("county", e.target.value)} maxLength={100} placeholder="e.g. Douglas, El Paso" />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Search basics
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="min_acres">Min acres</Label>
                <Input id="min_acres" inputMode="numeric" value={form.min_acres} onChange={(e) => update("min_acres", e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_price">Max price</Label>
                <Input id="max_price" inputMode="numeric" value={form.max_price} onChange={(e) => update("max_price", e.target.value)} placeholder="$1,500,000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min_stalls">Min stalls</Label>
                <Input id="min_stalls" inputMode="numeric" value={form.min_stalls} onChange={(e) => update("min_stalls", e.target.value)} placeholder="4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" inputMode="numeric" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} placeholder="3" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Anything else? (barn must-haves, riding disciplines, timeline)</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} maxLength={1000} rows={3} />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-4">
            <Checkbox
              id="needs_financing"
              checked={form.needs_financing}
              onCheckedChange={(checked) => update("needs_financing", checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="needs_financing" className="cursor-pointer text-sm font-normal leading-snug">
              I'd also like to be connected with an equine property lender for financing.
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Sending…" : "Connect me with an agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
