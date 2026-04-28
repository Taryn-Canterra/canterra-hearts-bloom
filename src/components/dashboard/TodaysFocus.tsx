import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Calendar, Inbox } from "lucide-react";
import { differenceInCalendarDays, isPast } from "date-fns";

interface FocusItem {
  id: string;
  type: "deadline" | "showing_request" | "unclaimed_lead";
  severity: "overdue" | "urgent" | "soon";
  title: string;
  subtitle?: string;
  link: string;
  daysOut?: number;
}

const DEADLINE_FIELDS: { field: string; label: string }[] = [
  { field: "earnest_money_due", label: "Earnest money due" },
  { field: "inspection_deadline", label: "Inspection" },
  { field: "inspection_objection_deadline", label: "Inspection objection" },
  { field: "appraisal_deadline", label: "Appraisal" },
  { field: "financing_contingency_deadline", label: "Financing contingency" },
  { field: "title_objection_deadline", label: "Title objection" },
  { field: "final_walkthrough_date", label: "Final walkthrough" },
  { field: "expected_close_date", label: "Expected close" },
];

export function TodaysFocus() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const dealsQ = isAdmin
        ? supabase.from("deals").select("*")
        : supabase.from("deals").select("*").eq("assigned_to", user.id);
      const showingsQ = supabase
        .from("deal_showings")
        .select("*")
        .eq("status", "scheduled")
        .is("confirmed_at", null);
      const unclaimedQ = supabase
        .from("property_inquiries")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      const [{ data: deals }, { data: showings }, { data: inquiries }] = await Promise.all([
        dealsQ,
        showingsQ,
        unclaimedQ,
      ]);

      const focus: FocusItem[] = [];
      const today = new Date();

      for (const d of deals ?? []) {
        for (const f of DEADLINE_FIELDS) {
          const val = (d as any)[f.field] as string | null;
          if (!val) continue;
          const dt = new Date(val);
          const days = differenceInCalendarDays(dt, today);
          if (days > 7) continue;
          if (["closed_won", "lost", "withdrawn"].includes(d.stage)) continue;
          let severity: FocusItem["severity"] = "soon";
          if (days < 0) severity = "overdue";
          else if (days <= 2) severity = "urgent";
          focus.push({
            id: `${d.id}-${f.field}`,
            type: "deadline",
            severity,
            title: `${f.label}: ${d.client_name}`,
            subtitle: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`,
            link: `/dashboard/deals/${d.id}`,
            daysOut: days,
          });
        }
      }

      const myDealIds = new Set((deals ?? []).map((d) => d.id));
      for (const s of showings ?? []) {
        if (!myDealIds.has(s.deal_id)) continue;
        const dt = new Date(s.scheduled_at);
        if (isPast(dt) && differenceInCalendarDays(today, dt) > 1) continue;
        focus.push({
          id: `showing-${s.id}`,
          type: "showing_request",
          severity: "urgent",
          title: `Showing request needs confirmation`,
          subtitle: `${dt.toLocaleString()} · ${s.buyer_agent_name ?? "Buyer"}`,
          link: `/dashboard/deals/${s.deal_id}`,
        });
      }

      // Unclaimed leads that *I* could claim (no assignment row exists)
      const { data: assignments } = await supabase
        .from("lead_assignments")
        .select("lead_id, lead_type");
      const assignedSet = new Set(
        (assignments ?? []).map((a) => `${a.lead_type}:${a.lead_id}`)
      );
      for (const inq of (inquiries ?? []).slice(0, 5)) {
        if (assignedSet.has(`property_inquiry:${inq.id}`)) continue;
        const days = differenceInCalendarDays(today, new Date(inq.created_at));
        if (days > 3) continue;
        focus.push({
          id: `lead-${inq.id}`,
          type: "unclaimed_lead",
          severity: days >= 1 ? "urgent" : "soon",
          title: `New inquiry from ${inq.name}`,
          subtitle: days === 0 ? "Today" : `${days}d ago`,
          link: `/dashboard/leads`,
        });
      }

      // Sort by severity then by daysOut
      const sevWeight = { overdue: 0, urgent: 1, soon: 2 } as const;
      focus.sort((a, b) => {
        if (sevWeight[a.severity] !== sevWeight[b.severity]) return sevWeight[a.severity] - sevWeight[b.severity];
        return (a.daysOut ?? 999) - (b.daysOut ?? 999);
      });

      setItems(focus.slice(0, 12));
      setLoading(false);
    })();
  }, [user, isAdmin]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Today's Focus
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Deadlines, showing requests, and fresh leads that need your attention.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Scanning your pipeline…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing urgent. Nice work staying ahead of it.</p>
        )}
        {items.map((it) => (
          <Link
            key={it.id}
            to={it.link}
            className="flex items-center gap-3 rounded-md border p-2.5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0">
              {it.type === "deadline" && <Calendar className="h-4 w-4 text-muted-foreground" />}
              {it.type === "showing_request" && <Clock className="h-4 w-4 text-muted-foreground" />}
              {it.type === "unclaimed_lead" && <Inbox className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.title}</p>
              {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
            </div>
            <Badge
              variant={it.severity === "overdue" ? "destructive" : it.severity === "urgent" ? "default" : "secondary"}
              className="text-[10px]"
            >
              {it.severity}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
