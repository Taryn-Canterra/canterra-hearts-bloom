
CREATE OR REPLACE FUNCTION public.seed_deal_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id UUID; v_task RECORD; v_new_task_id UUID; v_step RECORD; v_res RECORD;
BEGIN
  SELECT id INTO v_template_id FROM public.checklist_templates
  WHERE owner_user_id = NEW.assigned_to AND side = NEW.side::text AND is_default = true LIMIT 1;

  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id FROM public.checklist_templates
    WHERE is_system_master = true AND side = NEW.side::text ORDER BY created_at LIMIT 1;
  END IF;

  IF v_template_id IS NULL THEN RETURN NEW; END IF;

  FOR v_task IN SELECT * FROM public.checklist_template_tasks WHERE template_id = v_template_id ORDER BY sort_order LOOP
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, owner_role, task_number, source_template_task_id, deadline_key)
    VALUES (NEW.id, v_task.phase_key::deal_stage, v_task.title, v_task.sort_order, v_task.client_visible_default, 'task', v_task.owner_role, v_task.task_number, v_task.id, v_task.deadline_key)
    RETURNING id INTO v_new_task_id;

    FOR v_step IN SELECT * FROM public.checklist_template_steps WHERE task_id = v_task.id ORDER BY sort_order LOOP
      INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, parent_task_id, body)
      VALUES (NEW.id, v_task.phase_key::deal_stage, v_step.body, v_step.sort_order, v_task.client_visible_default, 'step', v_new_task_id, v_step.body);
    END LOOP;

    FOR v_res IN SELECT * FROM public.checklist_template_resources WHERE task_id = v_task.id AND step_id IS NULL ORDER BY sort_order LOOP
      INSERT INTO public.deal_checklist_resources (checklist_item_id, kind, label, url, sort_order)
      VALUES (v_new_task_id, v_res.kind, v_res.label, v_res.url, v_res.sort_order);
    END LOOP;
  END LOOP;
  RETURN NEW;
END;
$function$;
