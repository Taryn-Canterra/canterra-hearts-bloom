import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FIELDS: { key: string; label: string; type: "date" | "number" | "text" }[] = [
  { key: "list_price", label: "List price", type: "number" },
  { key: "listed_at", label: "Date listed", type: "date" },
  { key: "contract_date", label: "Contract date (auto-fills deadlines)", type: "date" },
  { key: "earnest_money_amount", label: "Earnest money $", type: "number" },
  { key: "earnest_money_due", label: "Earnest money due", type: "date" },
  { key: "inspection_deadline", label: "Inspection deadline", type: "date" },
  { key: "inspection_objection_deadline", label: "Inspection objection deadline", type: "date" },
  { key: "appraisal_deadline", label: "Appraisal deadline", type: "date" },
  { key: "title_objection_deadline", label: "Title objection deadline", type: "date" },
  { key: "financing_contingency_deadline", label: "Financing contingency", type: "date" },
  { key: "final_walkthrough_date", label: "Final walkthrough", type: "date" },
  { key: "expected_close_date", label: "Closing day", type: "date" },
  { key: "possession_date", label: "Possession date", type: "date" },
  { key: "net_proceeds_estimate", label: "Net proceeds estimate (seller)", type: "number" },
  { key: "lender_name", label: "Lender", type: "text" },
  { key: "lender_contact_name", label: "Lender contact", type: "text" },
  { key: "lender_contact_phone", label: "Lender phone", type: "text" },
  { key: "lender_contact_email", label: "Lender email", type: "text" },
  { key: "title_company_name", label: "Title company", type: "text" },
  { key: "title_contact_name", label: "Title contact", type: "text" },
  { key: "title_contact_email", label: "Title email", type: "text" },
];

export const DealKeyDatesEditor = ({ deal, onSaved }: { deal: any; onSaved: () => void }) => {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, deal[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload: any = {};
    for (const f of FIELDS) {
      const v = form[f.key];
      if (v === "" || v == null) payload[f.key] = null;
      else if (f.type === "number") payload[f.key] = Number(v);
      else payload[f.key] = v;
    }
    const { error } = await supabase.from("deals").update(payload).eq("id", deal.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); onSaved(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key dates, contacts & contract terms</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the contract date and we'll auto-fill standard CO deadlines. Override any field as needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </CardContent>
    </Card>
  );
};
