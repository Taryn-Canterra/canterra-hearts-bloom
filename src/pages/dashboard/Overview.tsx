import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Inbox } from "lucide-react";

interface Stats {
  totalLeads: number;
  newLeads: number;
  openDeals: number;
  underContract: number;
  closedWon: number;
  pipelineValue: number;
}

const stageGroups = {
  open: ["new_lead", "qualified", "property_tour_or_listing_prep", "offer_drafted_or_listed"],
  underContract: ["offer_accepted_under_contract", "inspection_and_appraisal", "financing_and_title", "closing"],
};

export default function DashboardOverview() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const dealsQuery = isAdmin ? supabase.from("deals").select("*") : supabase.from("deals").select("*").eq("assigned_to", user.id);
      const leadsQuery = isAdmin ? supabase.from("lead_assignments").select("*") : supabase.from("lead_assignments").select("*").eq("assigned_to", user.id);

      const [{ data: deals }, { data: leads }] = await Promise.all([dealsQuery, leadsQuery]);

      const allDeals = deals ?? [];
      setStats({
        totalLeads: leads?.length ?? 0,
        newLeads: (leads ?? []).filter((l) => l.status === "new").length,
        openDeals: allDeals.filter((d) => stageGroups.open.includes(d.stage)).length,
        underContract: allDeals.filter((d) => stageGroups.underContract.includes(d.stage)).length,
        closedWon: allDeals.filter((d) => d.stage === "closed_won").length,
        pipelineValue: allDeals
          .filter((d) => !["closed_won", "lost", "withdrawn"].includes(d.stage))
          .reduce((sum, d) => sum + (Number(d.price) || 0), 0),
      });
    })();
  }, [user, isAdmin]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Overview</h1>
            <p className="text-muted-foreground">{isAdmin ? "All agents" : "Your"} leads & transactions at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard/leads"><Inbox className="mr-2 h-4 w-4" /> View leads</Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard/deals/new"><Plus className="mr-2 h-4 w-4" /> New deal</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total leads" value={stats?.totalLeads ?? "—"} to="/dashboard/leads" />
          <StatCard label="New (uncontacted)" value={stats?.newLeads ?? "—"} accent to="/dashboard/leads?filter=new" />
          <StatCard label="Open deals" value={stats?.openDeals ?? "—"} to="/dashboard/deals?filter=open" />
          <StatCard label="Under contract" value={stats?.underContract ?? "—"} to="/dashboard/deals?filter=under_contract" />
          <StatCard label="Closed won" value={stats?.closedWon ?? "—"} to="/dashboard/deals?filter=closed_won" />
          <StatCard
            label="Active pipeline value"
            value={stats ? `$${(stats.pipelineValue / 1_000_000).toFixed(2)}M` : "—"}
            to="/dashboard/deals"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

const StatCard = ({ label, value, accent, to }: { label: string; value: string | number; accent?: boolean; to?: string }) => {
  const card = (
    <Card className={`${accent ? "border-accent" : ""} ${to ? "cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-semibold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{card}</Link> : card;
};
