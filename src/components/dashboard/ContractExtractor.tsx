import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  contract_date: "Contract date",
  earnest_money_due: "Earnest money due",
  earnest_money_amount: "Earnest money $",
  inspection_deadline: "Inspection deadline",
  inspection_objection_deadline: "Inspection objection",
  appraisal_deadline: "Appraisal deadline",
  title_objection_deadline: "Title objection",
  financing_contingency_deadline: "Financing contingency",
  final_walkthrough_date: "Final walkthrough",
  expected_close_date: "Closing day",
  possession_date: "Possession",
  price: "Purchase price",
  client_name: "Client name",
  property_address: "Property address",
};

// Map AI fields → deals table columns (most match 1:1; counterparty is informational only)
const DEAL_FIELDS = Object.keys(FIELD_LABELS);

const fmt = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
};

export const ContractExtractor = ({ deal, onSaved }: { deal: any; onSaved: () => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [counterparty, setCounterparty] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setBusy(true);
    try {
      // 1. Upload to storage under deal-documents/<deal_id>/contracts/<timestamp>.pdf
      const path = `${deal.id}/contracts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, file, {
        contentType: "application/pdf",
      });
      if (upErr) throw upErr;

      // 2. Record in deal_documents
      const { data: { user } } = await supabase.auth.getUser();
      const { data: docRow, error: docErr } = await supabase.from("deal_documents").insert({
        deal_id: deal.id,
        uploaded_by: user!.id,
        storage_path: path,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        category: "contract",
        visible_to_client: false,
      }).select().single();
      if (docErr) throw docErr;

      // 3. Invoke extraction
      const { data, error } = await supabase.functions.invoke("extract-contract-dates", {
        body: { deal_id: deal.id, document_id: docRow.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const ext = data.extracted || {};
      setCounterparty(ext.counterparty_name ?? null);
      setNotes(ext.confidence_notes ?? "");
      const cleaned: Record<string, any> = {};
      const initialPicks: Record<string, boolean> = {};
      for (const k of DEAL_FIELDS) {
        cleaned[k] = ext[k] ?? null;
        // Default: pick fields that have a new value AND deal is currently empty
        const current = deal[k];
        const hasNew = ext[k] !== null && ext[k] !== undefined && ext[k] !== "";
        const isEmpty = current === null || current === undefined || current === "";
        initialPicks[k] = hasNew && isEmpty;
      }
      setExtracted(cleaned);
      setPicked(initialPicks);
      toast.success("Extracted! Review and apply below.");
    } catch (e: any) {
      toast.error(e.message ?? "Extraction failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const apply = async () => {
    if (!extracted) return;
    setBusy(true);
    const payload: Record<string, any> = {};
    for (const k of DEAL_FIELDS) {
      if (picked[k] && extracted[k] !== null && extracted[k] !== undefined && extracted[k] !== "") {
        payload[k] = extracted[k];
      }
    }
    if (Object.keys(payload).length === 0) {
      setBusy(false);
      toast.info("Nothing selected to apply");
      return;
    }
    const { error } = await supabase.from("deals").update(payload as any).eq("id", deal.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Applied ${Object.keys(payload).length} field(s)`);
    setExtracted(null);
    onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Auto-extract from signed contract
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload the signed CTM/CTME PDF — we'll pull out the deadlines, price, and parties for review before saving.
        </p>
      </CardHeader>
      <CardContent>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="outline">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          {busy ? "Processing…" : "Upload contract & extract"}
        </Button>
      </CardContent>

      <Dialog open={!!extracted} onOpenChange={(o) => !o && setExtracted(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review extracted contract data</DialogTitle>
            <DialogDescription>
              Check the boxes for fields you want to apply. Existing values will be overwritten only for checked fields.
            </DialogDescription>
          </DialogHeader>

          {notes && (
            <div className="text-xs bg-muted p-3 rounded-md">
              <span className="font-semibold">AI notes: </span>{notes}
            </div>
          )}
          {counterparty && (
            <div className="text-xs text-muted-foreground">
              Counterparty detected: <span className="font-medium text-foreground">{counterparty}</span>
            </div>
          )}

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 w-12">Apply</th>
                  <th className="text-left px-3 py-2">Field</th>
                  <th className="text-left px-3 py-2">Current</th>
                  <th className="text-left px-3 py-2">Extracted</th>
                </tr>
              </thead>
              <tbody>
                {DEAL_FIELDS.map((k) => {
                  const newV = extracted?.[k];
                  const curV = deal[k];
                  const hasNew = newV !== null && newV !== undefined && newV !== "";
                  const changed = hasNew && String(newV) !== String(curV ?? "");
                  return (
                    <tr key={k} className={`border-t ${changed ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={!!picked[k]}
                          disabled={!hasNew}
                          onCheckedChange={(c) => setPicked((p) => ({ ...p, [k]: !!c }))}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{FIELD_LABELS[k]}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fmt(curV)}</td>
                      <td className="px-3 py-2">{fmt(newV)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtracted(null)} disabled={busy}>Cancel</Button>
            <Button onClick={apply} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Apply selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
