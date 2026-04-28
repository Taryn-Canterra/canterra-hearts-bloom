import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Check, Circle, FileText, EyeOff } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  qualified: "Qualified",
  property_tour_or_listing_prep: "Tour / Listing Prep",
  offer_drafted_or_listed: "Offer Drafted / Listed",
  offer_accepted_under_contract: "Under Contract",
  inspection_and_appraisal: "Inspection & Appraisal",
  financing_and_title: "Financing & Title",
  closing: "Closing",
  closed_won: "Closed",
};

export const ClientViewPreview = ({ dealId }: { dealId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [hiddenItemCount, setHiddenItemCount] = useState(0);
  const [hiddenDocCount, setHiddenDocCount] = useState(0);

  const load = async () => {
    setLoading(true);
    const [{ data: allItems }, { data: allDocs }] = await Promise.all([
      supabase.from("deal_checklist_items").select("*").eq("deal_id", dealId).order("stage").order("sort_order"),
      supabase.from("deal_documents").select("*").eq("deal_id", dealId).order("created_at", { ascending: false }),
    ]);
    const visibleItems = (allItems ?? []).filter((i) => i.client_visible);
    const visibleDocs = (allDocs ?? []).filter((d) => d.visible_to_client);
    setItems(visibleItems);
    setDocs(visibleDocs);
    setHiddenItemCount((allItems?.length ?? 0) - visibleItems.length);
    setHiddenDocCount((allDocs?.length ?? 0) - visibleDocs.length);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open, dealId]);

  // Group checklist by stage
  const grouped = Object.entries(
    items.reduce((acc: Record<string, any[]>, i) => {
      (acc[i.stage] ||= []).push(i);
      return acc;
    }, {})
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Client view preview
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            What your client sees
          </SheetTitle>
          <SheetDescription>
            Exactly the checklist items and documents currently visible on your client's portal for this deal.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{items.length} visible task{items.length === 1 ? "" : "s"}</Badge>
              <Badge variant="secondary">{docs.length} visible doc{docs.length === 1 ? "" : "s"}</Badge>
              {hiddenItemCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <EyeOff className="h-3 w-3" /> {hiddenItemCount} task{hiddenItemCount === 1 ? "" : "s"} hidden
                </Badge>
              )}
              {hiddenDocCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <EyeOff className="h-3 w-3" /> {hiddenDocCount} doc{hiddenDocCount === 1 ? "" : "s"} hidden
                </Badge>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction checklist (client view)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {grouped.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks are visible to the client yet.</p>
                )}
                {grouped.map(([stage, list]) => {
                  const arr = list as any[];
                  return (
                  <div key={stage}>
                    <h4 className="font-medium text-xs uppercase tracking-wider text-primary mb-2">
                      {STAGE_LABELS[stage] ?? stage}
                    </h4>
                    <ul className="space-y-1.5">
                      {arr.map((i) => (
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents (client view)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents are shared with the client yet.</p>
                )}
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded border">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.category ? `${d.category} · ` : ""}
                        {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
