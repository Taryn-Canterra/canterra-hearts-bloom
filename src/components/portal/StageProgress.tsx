import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FULL_STAGES } from "@/lib/dealDeadlines";

export const StageProgress = ({ currentStage }: { currentStage: string }) => {
  const idx = FULL_STAGES.findIndex((s) => s.key === currentStage);
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex items-stretch gap-1 min-w-max">
        {FULL_STAGES.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={s.key} className="flex items-center gap-1 first:ml-0">
              <div className={cn(
                "flex flex-col items-center text-center px-3 py-2 rounded-md min-w-[110px] border",
                current && "bg-primary text-primary-foreground border-primary shadow-sm",
                done && "bg-secondary text-secondary-foreground border-secondary",
                !current && !done && "bg-muted/30 text-muted-foreground border-border",
              )}>
                <div className="flex items-center justify-center h-6 w-6 mb-1">
                  {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <span className="text-[11px] font-medium leading-tight">{s.label}</span>
              </div>
              {i < FULL_STAGES.length - 1 && (
                <div className={cn("h-px w-3", i < idx ? "bg-secondary" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
