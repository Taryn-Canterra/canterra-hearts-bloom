import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEADLINE_DEFS, formatCountdown, urgency } from "@/lib/dealDeadlines";

export const DeadlineList = ({ deal }: { deal: any }) => {
  const side = deal?.side ?? "buyer";
  const rows = DEADLINE_DEFS
    .filter((d) => d.applies === "both" || d.applies === side)
    .map((d) => ({ ...d, value: deal?.[d.field] as string | null }));

  const hasAny = rows.some((r) => r.value);
  if (!hasAny) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Key dates</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deadlines will appear here once you go under contract.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Key dates & deadlines</CardTitle>
        <p className="text-sm text-muted-foreground">Live countdown — amber under 72 hours, red under 24.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => {
          const u = urgency(r.value);
          return (
            <div key={r.field} className="flex items-center gap-3 py-2 border-b last:border-0">
              <Clock className={cn(
                "h-4 w-4",
                u === "red" || u === "past" ? "text-destructive" :
                u === "amber" ? "text-amber-600" : "text-muted-foreground",
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {r.value ? new Date(r.value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Not set"}
                </p>
              </div>
              {r.value && (
                <Badge variant={u === "red" || u === "past" ? "destructive" : u === "amber" ? "default" : "secondary"}>
                  {formatCountdown(r.value)}
                </Badge>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
