import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { DEADLINE_DEFS, formatCountdown, urgency } from "@/lib/dealDeadlines";
import { cn } from "@/lib/utils";

interface DeadlineEvent {
  field: string;
  label: string;
  date: Date;
  iso: string;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const DealDeadlineCalendar = ({ deal, title = "Key dates & deadlines" }: { deal: any; title?: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events = useMemo<DeadlineEvent[]>(() => {
    if (!deal) return [];
    const side = deal.side ?? "buyer";
    const out: DeadlineEvent[] = [];
    for (const def of DEADLINE_DEFS) {
      if (def.applies !== "both" && def.applies !== side) continue;
      const v = deal[def.field] as string | null;
      if (!v) continue;
      out.push({ field: def.field, label: def.label, date: new Date(v), iso: v });
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [deal]);

  const eventDays = useMemo(() => events.map((e) => e.date), [events]);
  const selectedEvents = selectedDate ? events.filter((e) => sameDay(e.date, selectedDate)) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Tap a date to see deadlines that day.</p>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[auto,1fr]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ hasEvent: eventDays }}
          modifiersClassNames={{
            hasEvent:
              "relative font-semibold text-primary after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
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
              {selectedEvents.map((e) => {
                const u = urgency(e.iso);
                return (
                  <div key={e.field} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <Clock className={cn(
                      "h-4 w-4",
                      u === "red" || u === "past" ? "text-destructive" :
                      u === "amber" ? "text-amber-600" : "text-muted-foreground",
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Badge variant={u === "red" || u === "past" ? "destructive" : u === "amber" ? "default" : "secondary"}>
                      {formatCountdown(e.iso)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          {events.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">All deadlines</h4>
              <div className="space-y-2">
                {events.map((e) => {
                  const u = urgency(e.iso);
                  return (
                    <div key={e.field} className="flex items-center gap-3 py-1.5">
                      <Clock className={cn(
                        "h-4 w-4",
                        u === "red" || u === "past" ? "text-destructive" :
                        u === "amber" ? "text-amber-600" : "text-muted-foreground",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{e.label}</p>
                      </div>
                      <Badge variant={u === "red" || u === "past" ? "destructive" : u === "amber" ? "default" : "secondary"}>
                        {formatCountdown(e.iso)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
