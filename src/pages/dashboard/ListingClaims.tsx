import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BadgeCheck, X, ExternalLink, Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Claim {
  id: string;
  property_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  brokerage: string | null;
  license_number: string | null;
  message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function ListingClaims() {
  const { isAdmin, loading } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [propertyMap, setPropertyMap] = useState<Record<string, { address: string | null; city: string | null }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState("pending");

  const load = async () => {
    const { data } = await supabase
      .from("listing_claims")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Claim[];
    setClaims(list);
    const ids = Array.from(new Set(list.map((c) => c.property_id)));
    if (ids.length) {
      const { data: props } = await supabase
        .from("properties")
        .select("id,address,city")
        .in("id", ids);
      const map: Record<string, { address: string | null; city: string | null }> = {};
      (props ?? []).forEach((p: any) => { map[p.id] = { address: p.address, city: p.city }; });
      setPropertyMap(map);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const review = async (claim: Claim, status: "approved" | "rejected") => {
    setBusyId(claim.id);
    const { error } = await supabase
      .from("listing_claims")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", claim.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Claim ${status}`);
    load();
  };

  const filtered = claims.filter((c) => c.status === tab);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-semibold">Listing claims</h1>
          <p className="text-sm text-muted-foreground">Review agent claim requests for unclaimed listings.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending <Badge variant="secondary" className="ml-2">{claims.filter((c) => c.status === "pending").length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-3 mt-4">
            {filtered.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No {tab} claims.</CardContent></Card>
            ) : filtered.map((claim) => {
              const prop = propertyMap[claim.property_id];
              return (
                <Card key={claim.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{claim.claimant_name}</CardTitle>
                        <Link to={`/listing/${claim.property_id}`} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1">
                          {prop?.address ?? "Listing"}{prop?.city ? `, ${prop.city}` : ""} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{claim.claimant_email}</div>
                      {claim.claimant_phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{claim.claimant_phone}</div>}
                      {claim.brokerage && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{claim.brokerage}</div>}
                      {claim.license_number && <div className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />License #{claim.license_number}</div>}
                    </div>
                    {claim.message && (
                      <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{claim.message}</p>
                    )}
                    {tab === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" disabled={busyId === claim.id} onClick={() => review(claim, "approved")}>
                          <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyId === claim.id} onClick={() => review(claim, "rejected")}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
