import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export function ClaimListingDialog({
  propertyId,
  propertyAddress,
}: {
  propertyId: string;
  propertyAddress?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.from("listing_claims").insert({
      property_id: propertyId,
      claimant_name: String(fd.get("name") ?? ""),
      claimant_email: String(fd.get("email") ?? ""),
      claimant_phone: String(fd.get("phone") ?? "") || null,
      brokerage: String(fd.get("brokerage") ?? "") || null,
      license_number: String(fd.get("license") ?? "") || null,
      message: String(fd.get("message") ?? "") || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Claim submitted — we'll be in touch shortly.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSubmitted(false); }}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline">
          <BadgeCheck className="h-3 w-3" /> Are you the listing agent? Claim this listing
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this listing</DialogTitle>
          <DialogDescription>
            {submitted
              ? "Thanks! Our team will verify your license and reach out within one business day."
              : `Verify you represent ${propertyAddress ?? "this property"} and we'll route inquiries to you on Canterra.`}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button asChild>
              <Link to="/auth">Create my agent account</Link>
            </Button>
          </DialogFooter>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="claim-name">Full name</Label>
                <Input id="claim-name" name="name" required maxLength={120} />
              </div>
              <div>
                <Label htmlFor="claim-email">Email</Label>
                <Input id="claim-email" name="email" type="email" required maxLength={254} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="claim-phone">Phone</Label>
                <Input id="claim-phone" name="phone" type="tel" />
              </div>
              <div>
                <Label htmlFor="claim-license">License #</Label>
                <Input id="claim-license" name="license" />
              </div>
            </div>
            <div>
              <Label htmlFor="claim-brokerage">Brokerage</Label>
              <Input id="claim-brokerage" name="brokerage" />
            </div>
            <div>
              <Label htmlFor="claim-message">Anything we should know? (optional)</Label>
              <Textarea id="claim-message" name="message" rows={2} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit claim"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
