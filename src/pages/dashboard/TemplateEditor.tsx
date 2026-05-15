import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Plus, Trash2, Save } from "lucide-react";

const PHASES = [
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

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tmpl, setTmpl] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const readOnly = tmpl?.is_system_master && tmpl?.owner_user_id !== user?.id;

  const load = async () => {
    if (!id) return;
    const { data: t } = await supabase.from("checklist_templates").select("*").eq("id", id).maybeSingle();
    setTmpl(t);
    const { data: tk } = await supabase
      .from("checklist_template_tasks")
      .select("*")
      .eq("template_id", id)
      .order("sort_order");
    setTasks(tk ?? []);
    const taskIds = (tk ?? []).map((x) => x.id);
    if (taskIds.length) {
      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.from("checklist_template_steps").select("*").in("task_id", taskIds).order("sort_order"),
        supabase.from("checklist_template_resources").select("*").in("task_id", taskIds).order("sort_order"),
      ]);
      setSteps(s ?? []);
      setResources(r ?? []);
    } else { setSteps([]); setResources([]); }
  };
  useEffect(() => { load(); }, [id]);

  const addTask = async (phase_key: string, phase_label: string) => {
    const order = tasks.filter((t) => t.phase_key === phase_key).length;
    const num = (tasks.filter((t) => t.phase_key === phase_key).reduce((m, t) => Math.max(m, t.task_number ?? 0), 0)) + 1;
    const { error } = await supabase.from("checklist_template_tasks").insert({
      template_id: id, phase_key, phase_label, title: "New task", sort_order: order, task_number: num,
    });
    if (error) toast.error(error.message); else load();
  };
  const updateTask = async (taskId: string, patch: any) => {
    await supabase.from("checklist_template_tasks").update(patch).eq("id", taskId);
    load();
  };
  const removeTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from("checklist_template_steps").delete().eq("task_id", taskId);
    await supabase.from("checklist_template_resources").delete().eq("task_id", taskId);
    await supabase.from("checklist_template_tasks").delete().eq("id", taskId);
    load();
  };
  const addStep = async (taskId: string) => {
    const order = steps.filter((s) => s.task_id === taskId).length;
    await supabase.from("checklist_template_steps").insert({ task_id: taskId, body: "New step", sort_order: order });
    load();
  };
  const updateStep = async (stepId: string, body: string) => {
    await supabase.from("checklist_template_steps").update({ body }).eq("id", stepId);
  };
  const removeStep = async (stepId: string) => {
    await supabase.from("checklist_template_steps").delete().eq("id", stepId);
    load();
  };
  const addResource = async (taskId: string) => {
    const order = resources.filter((r) => r.task_id === taskId).length;
    await supabase.from("checklist_template_resources").insert({
      task_id: taskId, kind: "link", label: "New resource", url: "", sort_order: order,
    });
    load();
  };
  const updateResource = async (rid: string, patch: any) => {
    await supabase.from("checklist_template_resources").update(patch).eq("id", rid);
  };
  const removeResource = async (rid: string) => {
    await supabase.from("checklist_template_resources").delete().eq("id", rid);
    load();
  };
  const updateTemplateMeta = async (patch: any) => {
    await supabase.from("checklist_templates").update(patch).eq("id", id);
    load();
  };

  if (!tmpl) return <DashboardLayout><p>Loading…</p></DashboardLayout>;

  const grouped = PHASES.map((p) => ({ ...p, tasks: tasks.filter((t) => t.phase_key === p.key) }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Link to="/dashboard/templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> All templates
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <Input
                  className="font-display text-xl border-0 px-0 focus-visible:ring-0"
                  value={tmpl.name}
                  disabled={readOnly}
                  onChange={(e) => setTmpl({ ...tmpl, name: e.target.value })}
                  onBlur={() => !readOnly && updateTemplateMeta({ name: tmpl.name })}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{tmpl.side}</Badge>
                  {tmpl.is_default && <Badge>Default</Badge>}
                  {tmpl.is_system_master && <Badge variant="secondary">System master</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {readOnly && (
          <p className="text-sm text-muted-foreground italic">
            This is the system master. To customize, go back and edit your personal copy (auto-created on signup).
          </p>
        )}

        {grouped.map((phase) => (
          <Collapsible key={phase.key} defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full group">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:-rotate-90" />
                    <CardTitle className="text-base">{phase.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{phase.tasks.length}</Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {phase.tasks.map((task) => {
                    const taskSteps = steps.filter((s) => s.task_id === task.id);
                    const taskRes = resources.filter((r) => r.task_id === task.id);
                    return (
                      <div key={task.id} className="border rounded p-3 space-y-3">
                        <div className="flex items-start gap-2">
                          <Input
                            className="flex-1 font-medium"
                            defaultValue={task.title}
                            disabled={readOnly}
                            onBlur={(e) => !readOnly && e.target.value !== task.title && updateTask(task.id, { title: e.target.value })}
                          />
                          {!readOnly && (
                            <Button size="sm" variant="ghost" onClick={() => removeTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Owner</Label>
                            <Input
                              className="h-7 w-24 text-xs"
                              defaultValue={task.owner_role ?? ""}
                              placeholder="AGENT"
                              disabled={readOnly}
                              onBlur={(e) => !readOnly && updateTask(task.id, { owner_role: e.target.value || null })}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Client visible</Label>
                            <Switch
                              checked={task.client_visible_default}
                              disabled={readOnly}
                              onCheckedChange={(v) => updateTask(task.id, { client_visible_default: v })}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Steps</p>
                          <div className="space-y-1.5">
                            {taskSteps.map((s) => (
                              <div key={s.id} className="flex items-start gap-2">
                                <Textarea
                                  rows={2}
                                  className="text-sm"
                                  defaultValue={s.body}
                                  disabled={readOnly}
                                  onBlur={(e) => !readOnly && e.target.value !== s.body && updateStep(s.id, e.target.value)}
                                />
                                {!readOnly && (
                                  <Button size="sm" variant="ghost" onClick={() => removeStep(s.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {!readOnly && (
                              <Button size="sm" variant="outline" onClick={() => addStep(task.id)}>
                                <Plus className="h-3 w-3 mr-1" />Add step
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resources</p>
                          <div className="space-y-1.5">
                            {taskRes.map((r) => (
                              <div key={r.id} className="flex items-center gap-2">
                                <Select
                                  defaultValue={r.kind}
                                  disabled={readOnly}
                                  onValueChange={(v) => updateResource(r.id, { kind: v })}
                                >
                                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["loom", "video", "google_doc", "sheet", "template", "link", "note"].map((k) => (
                                      <SelectItem key={k} value={k}>{k}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  className="h-8 text-xs flex-1"
                                  defaultValue={r.label}
                                  placeholder="Label"
                                  disabled={readOnly}
                                  onBlur={(e) => !readOnly && updateResource(r.id, { label: e.target.value })}
                                />
                                <Input
                                  className="h-8 text-xs flex-1"
                                  defaultValue={r.url ?? ""}
                                  placeholder="URL"
                                  disabled={readOnly}
                                  onBlur={(e) => !readOnly && updateResource(r.id, { url: e.target.value })}
                                />
                                {!readOnly && (
                                  <Button size="sm" variant="ghost" onClick={() => removeResource(r.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {!readOnly && (
                              <Button size="sm" variant="outline" onClick={() => addResource(task.id)}>
                                <Plus className="h-3 w-3 mr-1" />Add resource
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!readOnly && (
                    <Button size="sm" variant="outline" onClick={() => addTask(phase.key, phase.label)}>
                      <Plus className="h-4 w-4 mr-2" />Add task to {phase.label}
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </DashboardLayout>
  );
}
