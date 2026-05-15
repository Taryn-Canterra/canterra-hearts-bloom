import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AddLeadDialog } from "@/components/dashboard/AddLeadDialog";

interface Inquiry {
  id: string; created_at: string; name: string; email: string; phone: string | null; message: string | null; property_id: string;
  _assignment?: { id: string; status: string; assigned_to: string };
}
interface SavedSearch {
  id: string; created_at: string; email: string; criteria: any; source: string;
  _assignment?: { id: string; status: string; assigned_to: string };
}
interface BuyerLead {
  id: string; created_at: string; name: string; email: string; phone: string | null;
  state: string; county: string | null; max_price: number | null; min_acres: number | null;
  min_stalls: number | null; bedrooms: number | null; notes: string | null; needs_financing: boolean;
  _assignment?: { id: string; status: string; assigned_to: string };
}

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [buyerLeads, setBuyerLeads] = useState<BuyerLead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data: allAssignments } = await supabase.from("lead_assignments").select("*");
    const myAssignments = allAssignments ?? [];

    const [{ data: inq }, { data: srch }, { data: bl }] = await Promise.all([
      supabase.from("property_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("saved_searches").select("*").order("created_at", { ascending: false }),
      supabase.from("buyer_leads").select("*").order("created_at", { ascending: false }),
    ]);

    const decorate = <T extends { id: string }>(rows: T[] | null, type: "property_inquiry" | "saved_search" | "buyer_lead") =>
      (rows ?? []).map((r) => ({
        ...r,
        _assignment: myAssignments.find((a) => a.lead_type === type && a.lead_id === r.id),
      }));

    setInquiries(decorate(inq, "property_inquiry") as Inquiry[]);
    setSearches(decorate(srch, "saved_search") as SavedSearch[]);
    setBuyerLeads(decorate(bl, "buyer_lead") as BuyerLead[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, isAdmin]);

  const claim = async (leadType: "property_inquiry" | "saved_search" | "buyer_lead", leadId: string) => {
    if (!user) return;
    const { error } = await supabase.from("lead_assignments").insert({
      lead_type: leadType, lead_id: leadId, assigned_to: user.id, status: "new",
    });
    if (error) toast.error(error.message);
    else { toast.success("Lead claimed"); load(); }
  };

  const updateStatus = async (assignmentId: string, status: string) => {
    const { error } = await supabase.from("lead_assignments").update({ status }).eq("id", assignmentId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); load(); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Leads</h1>
            <p className="text-muted-foreground">
              Track potential clients before they're under contract. Convert to a deal once they're ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddLeadDialog
              trigger={<Button variant="outline">+ Add lead</Button>}
              onCreated={load}
            />
            <Link to="/dashboard/deals/new">
              <Button>+ New deal (under contract)</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="manual">
          <TabsList>
            <TabsTrigger value="manual">My leads ({buyerLeads.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="searches">Saved searches ({searches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-3 mt-4">
            {loading && <p className="text-muted-foreground">Loading…</p>}
            {!loading && buyerLeads.length === 0 && (
              <p className="text-muted-foreground">No leads yet. Click "+ Add lead" to capture one.</p>
            )}
            {buyerLeads.map((l) => {
              const stats = [
                l.county && `${l.county}, ${l.state}`,
                l.max_price && `≤ $${Number(l.max_price).toLocaleString()}`,
                l.min_acres && `${l.min_acres}+ ac`,
                l.min_stalls && `${l.min_stalls}+ stalls`,
                l.bedrooms && `${l.bedrooms} bd`,
                l.needs_financing && "needs financing",
              ].filter(Boolean).join(" · ");
              return (
                <Card key={l.id}>
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-sm text-muted-foreground">{l.email}</span>
                        {l.phone && <span className="text-sm text-muted-foreground">{l.phone}</span>}
                        {l._assignment && <Badge variant="secondary">{l._assignment.status}</Badge>}
                      </div>
                      {stats && <p className="text-xs text-muted-foreground mt-1">{stats}</p>}
                      {l.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{l.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {!l._assignment ? (
                        <Button size="sm" onClick={() => claim("buyer_lead", l.id)}>Claim</Button>
                      ) : (
                        <>
                          {l._assignment.status === "new" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(l._assignment!.id, "contacted")}>Mark contacted</Button>
                          )}
                          {l._assignment.status === "contacted" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(l._assignment!.id, "nurturing")}>Mark nurturing</Button>
                          )}
                          {l._assignment.status !== "converted" && (
                            <Link to={`/dashboard/deals/new?buyer_lead=${l.id}`}>
                              <Button size="sm">Convert to deal</Button>
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-3 mt-4">
            {loading && <p className="text-muted-foreground">Loading…</p>}
            {!loading && inquiries.length === 0 && <p className="text-muted-foreground">No inquiries yet.</p>}
            {inquiries.map((i) => (
              <Card key={i.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{i.name}</span>
                      <span className="text-sm text-muted-foreground">{i.email}</span>
                      {i.phone && <span className="text-sm text-muted-foreground">{i.phone}</span>}
                      {i._assignment && <Badge variant="secondary">{i._assignment.status}</Badge>}
                    </div>
                    {i.message && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{i.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(i.created_at).toLocaleString()} ·{" "}
                      <Link to={`/listing/${i.property_id}`} className="underline">View property</Link>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!i._assignment ? (
                      <Button size="sm" onClick={() => claim("property_inquiry", i.id)}>Claim</Button>
                    ) : (
                      <>
                        {i._assignment.status === "new" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(i._assignment!.id, "contacted")}>Mark contacted</Button>
                        )}
                        {i._assignment.status !== "converted" && (
                          <Link to={`/dashboard/deals/new?inquiry=${i.id}`}>
                            <Button size="sm">Convert to deal</Button>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="searches" className="space-y-3 mt-4">
            {!loading && searches.length === 0 && <p className="text-muted-foreground">No saved searches yet.</p>}
            {searches.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{s.email}</span>
                      {s._assignment && <Badge variant="secondary">{s._assignment.status}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(s.created_at).toLocaleString()} · Source: {s.source}
                    </p>
                    <pre className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(s.criteria, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    {!s._assignment ? (
                      <Button size="sm" onClick={() => claim("saved_search", s.id)}>Claim</Button>
                    ) : (
                      s._assignment.status === "new" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(s._assignment!.id, "contacted")}>Mark contacted</Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
