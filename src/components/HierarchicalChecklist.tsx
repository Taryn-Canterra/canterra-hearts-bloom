import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, ExternalLink, Video, FileText, Link as LinkIcon, Check, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STAGES = [
  { key: "new_lead", label: "New Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "property_tour_or_listing_prep", label: "Tour / Listing Prep" },
  { key: "offer_drafted_or_listed", label: "Offer Drafted / Listed" },
  { key: "offer_accepted_under_contract", label: "Under Contract" },
  { key: "inspection_and_appraisal", label: "Inspection & Appraisal" },
  { key: "financing_and_title", label: "Financing & Title" },
  { key: "closing", label: "Closing" },
  { key: "closed_won", label: "Closed" },
];

function resourceIcon(kind: string) {
  if (kind === "loom" || kind === "video") return <Video className="h-3 w-3" />;
  if (kind === "google_doc" || kind === "sheet" || kind === "template") return <FileText className="h-3 w-3" />;
  return <LinkIcon className="h-3 w-3" />;
}

interface Props {
  dealId: string;
  readOnly?: boolean; // client portal mode
  clientVisibleOnly?: boolean; // portal filter
  currentUserId?: string; // for "assigned to you" highlight
}

export const HierarchicalChecklist = ({ dealId, readOnly = false, clientVisibleOnly = false, currentUserId }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: ci }, { data: pa }] = await Promise.all([
      supabase.from("deal_checklist_items").select("*").eq("deal_id", dealId).order("sort_order"),
      readOnly
        ? Promise.resolve({ data: [] as any[] })
        : supabase.from("deal_parties").select("*").eq("deal_id", dealId),
    ]);
    setItems(ci ?? []);
    setParties(pa ?? []);
    const taskIds = (ci ?? []).filter((i) => i.kind === "task").map((i) => i.id);
    if (taskIds.length) {
      const { data: r } = await supabase
        .from("deal_checklist_resources")
        .select("*")
        .in("checklist_item_id", taskIds);
      setResources(r ?? []);
    } else setResources([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dealId]);

  const toggleItem = async (item: any) => {
    if (readOnly) return;
    const completed = !item.completed;
    const { error } = await supabase
      .from("deal_checklist_items")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user!.id : null,
      })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else load();
  };

  const toggleVisibility = async (item: any) => {
    if (readOnly) return;
    await supabase.from("deal_checklist_items").update({ client_visible: !item.client_visible }).eq("id", item.id);
    load();
  };

  const assignParty = async (item: any, partyId: string) => {
    if (readOnly) return;
    const value = partyId === "_none" ? null : partyId;
    await supabase.from("deal_checklist_items").update({ assigned_party_id: value }).eq("id", item.id);
    load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading checklist…</p>;

  // Group: phase -> tasks
  const tasks = items.filter((i) => i.kind === "task");
  const stepsByTask = items.filter((i) => i.kind === "step").reduce<Record<string, any[]>>((acc, s) => {
    if (s.parent_task_id) (acc[s.parent_task_id] ||= []).push(s);
    return acc;
  }, {});
  const resourcesByTask = resources.reduce<Record<string, any[]>>((acc, r) => {
    (acc[r.checklist_item_id] ||= []).push(r);
    return acc;
  }, {});

  const groupedByStage = STAGES.map((s) => ({
    stage: s,
    tasks: tasks.filter((t) => t.stage === s.key && (!clientVisibleOnly || t.client_visible)),
  })).filter((g) => g.tasks.length > 0);

  if (groupedByStage.length === 0) {
    return <p className="text-sm text-muted-foreground">No checklist items yet.</p>;
  }

  return (
    <div className="space-y-3">
      {groupedByStage.map((g) => {
        const total = g.tasks.length;
        const done = g.tasks.filter((t) => t.completed).length;
        const allDone = total > 0 && done === total;
        return (
          <Collapsible key={g.stage.key} defaultOpen={!allDone}>
            <CollapsibleTrigger className="group w-full flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-muted/40 text-left">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                <h3 className="font-medium text-sm uppercase tracking-wider text-primary">{g.stage.label}</h3>
                <Badge variant={allDone ? "default" : "secondary"} className="text-xs">
                  {done}/{total}{allDone ? " ✓" : ""}
                </Badge>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 pt-2 pl-2">
                {g.tasks.map((task) => {
                  const steps = (stepsByTask[task.id] ?? []).filter(
                    (s) => !clientVisibleOnly || s.client_visible
                  );
                  const taskResources = resourcesByTask[task.id] ?? [];
                  const assignedParty = parties.find((p) => p.id === task.assigned_party_id);
                  const assignedToMe = currentUserId && assignedParty?.user_id === currentUserId;

                  return (
                    <Collapsible
                      key={task.id}
                      defaultOpen={!task.completed && (steps.length > 0 || taskResources.length > 0)}
                      className="border rounded-md"
                    >
                      <div className="flex items-start gap-3 p-3">
                        {readOnly ? (
                          task.completed
                            ? <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleItem(task)}
                            className="mt-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <CollapsibleTrigger className="group flex items-center gap-1 text-left flex-1 min-w-0">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 shrink-0" />
                              <span className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                {task.task_number ? `${task.task_number}. ` : ""}{task.label}
                              </span>
                            </CollapsibleTrigger>
                            {task.owner_role && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0">
                                {task.owner_role}
                              </Badge>
                            )}
                            {assignedToMe && (
                              <Badge className="text-[10px] shrink-0">Assigned to you</Badge>
                            )}
                          </div>
                          {task.completed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Completed {new Date(task.completed_at).toLocaleDateString()}
                            </p>
                          )}
                          {!readOnly && (
                            <div className="flex items-center gap-3 flex-wrap mt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Assign:</span>
                                <Select
                                  value={task.assigned_party_id ?? "_none"}
                                  onValueChange={(v) => assignParty(task, v)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-44">
                                    <SelectValue placeholder="Unassigned" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">Unassigned</SelectItem>
                                    {parties.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name} <span className="text-muted-foreground">({p.role})</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Visible to client</span>
                                <Switch
                                  checked={task.client_visible}
                                  onCheckedChange={() => toggleVisibility(task)}
                                />
                              </div>
                            </div>
                          )}
                          {readOnly && assignedParty && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assigned to: {assignedParty.name} ({assignedParty.role})
                            </p>
                          )}
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pl-10 space-y-3">
                          {steps.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Steps</p>
                              <ol className="space-y-1.5 list-decimal list-inside">
                                {steps.map((s) => (
                                  <li key={s.id} className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {s.body || s.label}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {taskResources.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resources</p>
                              <div className="flex flex-wrap gap-2">
                                {taskResources.map((r) => (
                                  <a
                                    key={r.id}
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border bg-muted/40 hover:bg-muted transition"
                                  >
                                    {resourceIcon(r.kind)}
                                    <span>{r.label}</span>
                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {steps.length === 0 && taskResources.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No additional details.</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};
