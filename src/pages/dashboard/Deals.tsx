import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const STAGE_FILTERS: Record<string, { label: string; stages: string[] }> = {
  open: {
    label: "Open deals",
    stages: ["new_lead", "qualified", "property_tour_or_listing_prep", "offer_drafted_or_listed"],
  },
  under_contract: {
    label: "Under contract",
    stages: ["offer_accepted_under_contract", "inspection_and_appraisal", "financing_and_title", "closing"],
  },
  closed_won: { label: "Closed won", stages: ["closed_won"] },
};

const STAGES: { key: string; label: string }[] = [
  { key: "new_lead", label: "New Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "property_tour_or_listing_prep", label: "Tour / Listing Prep" },
  { key: "offer_drafted_or_listed", label: "Offer Drafted / Listed" },
  { key: "offer_accepted_under_contract", label: "Under Contract" },
  { key: "inspection_and_appraisal", label: "Inspection & Appraisal" },
  { key: "financing_and_title", label: "Financing & Title" },
  { key: "closing", label: "Closing" },
  { key: "closed_won", label: "Closed Won" },
  { key: "lost", label: "Lost" },
];

interface Deal {
  id: string; client_name: string; side: "buyer" | "seller"; stage: string;
  price: number | null; expected_close_date: string | null; property_address: string | null;
}

export default function Deals() {
  const { user, isAdmin } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const activeFilter = filter && STAGE_FILTERS[filter] ? STAGE_FILTERS[filter] : null;

  const visibleStages = useMemo(
    () => (activeFilter ? STAGES.filter((s) => activeFilter.stages.includes(s.key)) : STAGES),
    [activeFilter]
  );

  const load = async () => {
    const q = isAdmin
      ? supabase.from("deals").select("*").order("updated_at", { ascending: false })
      : supabase.from("deals").select("*").eq("assigned_to", user!.id).order("updated_at", { ascending: false });
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setDeals((data ?? []) as Deal[]);
  };

  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const moveStage = async (dealId: string, newStage: string) => {
    const { error } = await supabase.from("deals").update({ stage: newStage as any }).eq("id", dealId);
    if (error) toast.error(error.message);
    else load();
  };

  const onDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveStage(id, stage);
  };

  const clearFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("filter");
    setSearchParams(next);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Deals Pipeline</h1>
            <p className="text-muted-foreground">Drag cards between stages. Click a card to manage its checklist.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/deals/new")}>
            <Plus className="mr-2 h-4 w-4" /> New deal
          </Button>
        </div>

        {activeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              {activeFilter.label}
              <button
                onClick={clearFilter}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {visibleStages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              return (
                <div
                  key={stage.key}
                  className="w-72 flex-shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, stage.key)}
                >
                  <div className="bg-muted/40 rounded-lg p-2 min-h-[400px]">
                    <div className="flex items-center justify-between px-2 py-2 mb-2">
                      <h3 className="text-sm font-medium text-primary">{stage.label}</h3>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stageDeals.map((d) => (
                        <Link key={d.id} to={`/dashboard/deals/${d.id}`}>
                          <Card
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-sm">{d.client_name}</span>
                                <Badge variant={d.side === "buyer" ? "default" : "outline"} className="text-[10px]">
                                  {d.side}
                                </Badge>
                              </div>
                              {d.property_address && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{d.property_address}</p>
                              )}
                              {d.price && (
                                <p className="text-xs font-medium mt-1">${Number(d.price).toLocaleString()}</p>
                              )}
                              {d.expected_close_date && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Close: {new Date(d.expected_close_date).toLocaleDateString()}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
