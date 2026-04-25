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

interface Inquiry {
  id: string; created_at: string; name: string; email: string; phone: string | null; message: string | null; property_id: string;
  _assignment?: { id: string; status: string; assigned_to: string };
}
interface SavedSearch {
  id: string; created_at: string; email: string; criteria: any; source: string;
  _assignment?: { id: string; status: string; assigned_to: string };
}

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data: assignments } = await supabase
      .from("lead_assignments")
      .select("*")
      .eq(isAdmin ? "id" : "assigned_to", isAdmin ? "" : user.id);
    // For admin, get all assignments
    const { data: allAssignments } = isAdmin
      ? await supabase.from("lead_assignments").select("*")
      : { data: assignments };

    const myAssignments = allAssignments ?? [];

    // Admin sees ALL leads; agents see only those assigned to them via RLS
    const [{ data: inq }, { data: srch }] = await Promise.all([
      supabase.from("property_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("saved_searches").select("*").order("created_at", { ascending: false }),
    ]);

    const decorate = <T extends { id: string }>(rows: T[] | null, type: "property_inquiry" | "saved_search") =>
      (rows ?? []).map((r) => ({
        ...r,
        _assignment: myAssignments.find((a) => a.lead_type === type && a.lead_id === r.id),
      }));

    setInquiries(decorate(inq, "property_inquiry") as Inquiry[]);
    setSearches(decorate(srch, "saved_search") as SavedSearch[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, isAdmin]);

  const claim = async (leadType: "property_inquiry" | "saved_search", leadId: string) => {
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
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Leads</h1>
          <p className="text-muted-foreground">Property inquiries and saved-search signups.</p>
        </div>

        <Tabs defaultValue="inquiries">
          <TabsList>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="searches">Saved searches ({searches.length})</TabsTrigger>
          </TabsList>

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
