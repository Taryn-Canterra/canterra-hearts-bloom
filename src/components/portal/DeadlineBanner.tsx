import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCountdown, getActiveDeadlines, urgency } from "@/lib/dealDeadlines";

export const DeadlineBanner = ({ deal }: { deal: any }) => {
  const upcoming = getActiveDeadlines(deal)
    .map((d) => ({ ...d, urgency: urgency(d.value) }))
    .filter((d) => d.urgency === "amber" || d.urgency === "red" || d.urgency === "past")
    .sort((a, b) => new Date(a.value!).getTime() - new Date(b.value!).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-destructive bg-destructive/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Action needed soon
        </div>
        <div className="space-y-1.5">
          {upcoming.map((d) => (
            <div key={d.field} className="flex items-center gap-2 text-sm">
              <Clock className={cn(
                "h-3.5 w-3.5",
                d.urgency === "red" || d.urgency === "past" ? "text-destructive" : "text-amber-600",
              )} />
              <span className="flex-1">{d.label}</span>
              <span className={cn(
                "font-medium",
                d.urgency === "red" || d.urgency === "past" ? "text-destructive" : "text-amber-700",
              )}>
                {formatCountdown(d.value)}
              </span>
              <span className="text-muted-foreground text-xs">
                ({new Date(d.value!).toLocaleDateString()})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
