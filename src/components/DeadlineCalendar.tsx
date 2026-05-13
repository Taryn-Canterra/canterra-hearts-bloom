import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEADLINE_DEFS, formatCountdown, urgency } from "@/lib/dealDeadlines";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

type Mode = "agent" | "client";

interface DeadlineEvent {
  dealId: string;
  dealLabel: string; // address or client name
  field: string;
  label: string;
  shortLabel: string;
  date: Date;
  iso: string;
  side: string;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const DeadlineCalendar = ({ mode }: { mode: Mode }) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDealId, setFilterDealId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    (async () => {
      // RLS scopes deals to: agent's own (assigned_to) or client's linked deals
      const { data } = await supabase
        .from("deals")
        .select("*")
        .not("stage", "in", "(closed_won,lost,withdrawn)");
      setDeals(data ?? []);
      setLoading(false);
    })();
  }, []);

  const events = useMemo<DeadlineEvent[]>(() => {
    const out: DeadlineEvent[] = [];
    for (const d of deals) {
      if (filterDealId !== "all" && d.id !== filterDealId) continue;
      const side = d.side ?? "buyer";
      const dealLabel = d.property_address || d.client_name || "Untitled deal";
      for (const def of DEADLINE_DEFS) {
        if (def.applies !== "both" && def.applies !== side) continue;
        const v = d[def.field] as string | null;
        if (!v) continue;
        out.push({
          dealId: d.id,
          dealLabel,
          field: def.field,
          label: def.label,
          shortLabel: def.shortLabel,
          date: new Date(v),
          iso: v,
          side,
        });
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [deals, filterDealId]);

  const eventDays = useMemo(() => events.map((e) => e.date), [events]);
  const selectedEvents = selectedDate ? events.filter((e) => sameDay(e.date, selectedDate)) : [];
  const upcoming = events.filter((e) => e.date.getTime() >= Date.now() - 24 * 3600 * 1000).slice(0, 8);

  const dealLink = (id: string) => (mode === "agent" ? `/dashboard/deals/${id}` : `/portal/deal/${id}`);

  if (loading) return <p className="text-muted-foreground">Loading calendar…</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="font-display text-xl">Deadlines calendar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Every key date across {mode === "agent" ? "your transactions" : "your deals"} in one view.
              </p>
            </div>
            <Select value={filterDealId} onValueChange={setFilterDealId}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filter…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All transactions</SelectItem>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.property_address || d.client_name || "Untitled"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[auto,1fr]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasEvent: eventDays }}
            modifiersClassNames={{
              hasEvent: "relative font-semibold text-primary after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
            }}
            className={cn("p-3 pointer-events-auto rounded-md border")}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-medium mb-3">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                : "Pick a date"}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines on this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e, i) => {
                  const u = urgency(e.iso);
                  return (
                    <Link
                      key={`${e.dealId}-${e.field}-${i}`}
                      to={dealLink(e.dealId)}
                      className="block border rounded-md p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.dealLabel}</p>
                        </div>
                        <Badge variant={u === "red" || u === "past" ? "destructive" : u === "amber" ? "default" : "secondary"}>
                          {formatCountdown(e.iso)}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on the horizon.</p>
          ) : (
            upcoming.map((e, i) => {
              const u = urgency(e.iso);
              return (
                <Link
                  key={`${e.dealId}-${e.field}-${i}`}
                  to={dealLink(e.dealId)}
                  className="flex items-center gap-3 py-2 border-b last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                >
                  <Clock className={cn(
                    "h-4 w-4",
                    u === "red" || u === "past" ? "text-destructive" :
                    u === "amber" ? "text-amber-600" : "text-muted-foreground",
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.label} · <span className="text-muted-foreground font-normal">{e.dealLabel}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {e.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={u === "red" || u === "past" ? "destructive" : u === "amber" ? "default" : "secondary"}>
                    {formatCountdown(e.iso)}
                  </Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
