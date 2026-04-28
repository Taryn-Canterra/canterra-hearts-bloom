import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ClientSuggestion = {
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  side: string;
  property_address: string | null;
};

export default function NewDeal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inquiryId = params.get("inquiry");

  const [side, setSide] = useState<"buyer" | "seller">("buyer");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill from inquiry if converting
  useEffect(() => {
    if (!inquiryId) return;
    (async () => {
      const { data: inq } = await supabase.from("property_inquiries").select("*").eq("id", inquiryId).maybeSingle();
      if (inq) {
        setClientName(inq.name);
        setClientEmail(inq.email);
        setClientPhone(inq.phone ?? "");
        setNotes(inq.message ?? "");
        setPropertyId(inq.property_id);
        const { data: prop } = await supabase.from("properties").select("address,city,state,price").eq("id", inq.property_id).maybeSingle();
        if (prop) {
          setPropertyAddress([prop.address, prop.city, prop.state].filter(Boolean).join(", "));
          if (prop.price) setPrice(String(prop.price));
        }
      }
    })();
  }, [inquiryId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("deals").insert({
      assigned_to: user.id,
      side,
      stage: "new_lead",
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      property_address: propertyAddress || null,
      property_id: propertyId,
      price: price ? Number(price) : null,
      expected_close_date: expectedClose || null,
      notes: notes || null,
      source_lead_type: inquiryId ? "property_inquiry" : "manual",
      source_lead_id: inquiryId,
    }).select().single();

    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    // Mark inquiry assignment as converted
    if (inquiryId) {
      await supabase.from("lead_assignments")
        .update({ status: "converted" })
        .eq("lead_type", "property_inquiry")
        .eq("lead_id", inquiryId);
    }

    toast.success("Deal created with checklist seeded");
    navigate(`/dashboard/deals/${data.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">New Deal</h1>
          <p className="text-muted-foreground">A standard transaction checklist will be created automatically based on the side.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Deal details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Side</Label>
                  <Select value={side} onValueChange={(v) => setSide(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer representation</SelectItem>
                      <SelectItem value="seller">Seller / listing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected close date</Label>
                  <Input type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client name *</Label>
                <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Client phone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Property address</Label>
                <Input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Street, City, State" />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1250000" />
              </div>
              <div className="space-y-2">
                <Label>Internal notes</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create deal"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
