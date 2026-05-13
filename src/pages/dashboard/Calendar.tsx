import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DeadlineCalendar } from "@/components/DeadlineCalendar";

export default function DashboardCalendar() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-4">
        <div>
          <h1 className="font-display text-2xl">Calendar</h1>
          <p className="text-sm text-muted-foreground">All transaction deadlines across your pipeline.</p>
        </div>
        <DeadlineCalendar mode="agent" />
      </div>
    </DashboardLayout>
  );
}
