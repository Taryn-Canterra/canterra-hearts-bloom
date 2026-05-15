import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FULL_STAGES } from "@/lib/dealDeadlines";

export const StageProgress = ({
  currentStage,
  percent,
}: {
  currentStage: string;
  percent?: number;
}) => {
  const idx = Math.max(0, FULL_STAGES.findIndex((s) => s.key === currentStage));
  const total = FULL_STAGES.length;
  // Position fill so it lands on the center of the current stage marker
  const stagePct = ((idx + 0.5) / total) * 100;
  const fillPct = typeof percent === "number" ? Math.max(stagePct * 0.6 + percent * 0.4, stagePct) : stagePct;

  return (
    <div className="space-y-3">
      {/* Header / legend */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
            Transaction status
          </p>
          <p className="font-display text-lg leading-tight">
            {FULL_STAGES[idx]?.label ?? "In progress"}
          </p>
        </div>
        {typeof percent === "number" && (
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-primary leading-none">
              {percent}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">complete</p>
          </div>
        )}
      </div>

      {/* Gradient progress track with stage markers */}
      <div className="relative pt-2 pb-8">
        {/* Track */}
        <div className="relative h-3 w-full rounded-full bg-secondary/70 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${fillPct}%`,
              background:
                "linear-gradient(90deg, hsl(var(--primary-glow)) 0%, hsl(var(--primary)) 55%, hsl(var(--accent)) 100%)",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
            }}
          />
        </div>

        {/* Stage markers */}
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {FULL_STAGES.map((s, i) => {
            const done = i < idx;
            const current = i === idx;
            const pos = ((i + 0.5) / total) * 100;
            return (
              <div
                key={s.key}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pos}%` }}
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    done && "bg-primary border-primary text-primary-foreground",
                    current &&
                      "bg-background border-primary ring-4 ring-primary/20 scale-110",
                    !done && !current && "bg-background border-border",
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : current ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-2 text-[9.5px] leading-tight text-center max-w-[64px] hidden sm:block",
                    current
                      ? "text-foreground font-semibold"
                      : done
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70",
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stage indicator (since labels are hidden on small screens) */}
      <p className="text-xs text-muted-foreground sm:hidden">
        Stage {idx + 1} of {total}
      </p>
    </div>
  );
};
