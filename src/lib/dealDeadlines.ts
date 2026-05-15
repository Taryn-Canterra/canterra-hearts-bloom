// Deadline configuration + countdown utilities for the consumer dashboard.
// Both buyer and seller views use these helpers.

export type DeadlineUrgency = "ok" | "amber" | "red" | "past";

export interface DeadlineDef {
  field: string;
  label: string;
  shortLabel: string;
  applies: "buyer" | "seller" | "both";
  stage: string;
}

export const DEADLINE_DEFS: DeadlineDef[] = [
  { field: "earnest_money_due", label: "Earnest money due", shortLabel: "Earnest money", applies: "buyer", stage: "offer_accepted_under_contract" },
  { field: "inspection_deadline", label: "Inspection completion deadline", shortLabel: "Inspection", applies: "both", stage: "inspection_and_appraisal" },
  { field: "inspection_objection_deadline", label: "Inspection objection deadline", shortLabel: "Inspection objection", applies: "both", stage: "inspection_and_appraisal" },
  { field: "appraisal_deadline", label: "Appraisal deadline", shortLabel: "Appraisal", applies: "both", stage: "inspection_and_appraisal" },
  { field: "title_objection_deadline", label: "Title objection deadline", shortLabel: "Title objection", applies: "both", stage: "financing_and_title" },
  { field: "financing_contingency_deadline", label: "Financing contingency deadline", shortLabel: "Financing", applies: "both", stage: "financing_and_title" },
  { field: "final_walkthrough_date", label: "Final walkthrough", shortLabel: "Walkthrough", applies: "both", stage: "closing" },
  { field: "expected_close_date", label: "Closing day", shortLabel: "Closing", applies: "both", stage: "closing" },
  { field: "possession_date", label: "Possession transfer", shortLabel: "Possession", applies: "both", stage: "closing" },
];

export const FULL_STAGES = [
  { key: "active", label: "Active", description: "Browsing or live on market" },
  { key: "offer_activity", label: "Offer Activity", description: "Negotiating terms" },
  { key: "under_contract", label: "Under Contract", description: "Deal accepted" },
  { key: "inspection", label: "Inspection Period", description: "Property inspections" },
  { key: "appraisal", label: "Appraisal", description: "Lender valuation" },
  { key: "financing", label: "Financing", description: "Loan approval" },
  { key: "pre_closing", label: "Pre-Closing", description: "Final preparations" },
  { key: "closing_day", label: "Closing Day", description: "Sign and transfer" },
  { key: "post_close", label: "Post-Close", description: "Move-in & beyond" },
];

// Map stored deal.stage → 9-stage UX stage
export function resolveDisplayStage(dealStage: string, deal: any): string {
  switch (dealStage) {
    case "new_lead":
    case "qualified":
    case "property_tour_or_listing_prep":
      return "active";
    case "offer_drafted_or_listed":
      return "offer_activity";
    case "offer_accepted_under_contract":
      return "under_contract";
    case "inspection_and_appraisal":
      // refine inspection vs appraisal by deadlines passed
      if (deal?.inspection_deadline && new Date(deal.inspection_deadline) < new Date()) return "appraisal";
      return "inspection";
    case "financing_and_title":
      return "financing";
    case "closing":
      return "pre_closing";
    case "closed_won":
      return "post_close";
    default:
      return "active";
  }
}

export function urgency(targetDate: string | null | undefined): DeadlineUrgency {
  if (!targetDate) return "ok";
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const hours = (target - now) / (1000 * 60 * 60);
  if (hours < 0) return "past";
  if (hours <= 24) return "red";
  if (hours <= 72) return "amber";
  return "ok";
}

export function formatCountdown(targetDate: string | null | undefined): string {
  if (!targetDate) return "—";
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const past = diffMs < 0;
  const hours = Math.abs(diffMs) / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  if (past) {
    if (days >= 1) return `${days}d overdue`;
    return `${Math.floor(hours)}h overdue`;
  }
  if (days >= 2) return `in ${days} days`;
  if (hours >= 24) return `in ${Math.floor(hours)} hours`;
  return `in ${Math.max(1, Math.floor(hours))}h`;
}

export function getActiveDeadlines(deal: any) {
  const side = deal?.side ?? "buyer";
  return DEADLINE_DEFS
    .filter((d) => d.applies === "both" || d.applies === side)
    .map((d) => ({ ...d, value: deal?.[d.field] as string | null }))
    .filter((d) => d.value);
}
