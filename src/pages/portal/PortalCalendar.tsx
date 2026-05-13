import { ClientPortalLayout } from "@/components/portal/ClientPortalLayout";
import { DeadlineCalendar } from "@/components/DeadlineCalendar";

export default function PortalCalendar() {
  return (
    <ClientPortalLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="font-display text-2xl">Calendar</h1>
          <p className="text-sm text-muted-foreground">Important dates for your transactions, all in one place.</p>
        </div>
        <DeadlineCalendar mode="client" />
      </div>
    </ClientPortalLayout>
  );
}
