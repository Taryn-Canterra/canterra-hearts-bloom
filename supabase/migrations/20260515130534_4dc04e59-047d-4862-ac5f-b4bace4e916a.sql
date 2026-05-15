
ALTER TABLE public.checklist_template_tasks ADD COLUMN IF NOT EXISTS deadline_key TEXT;
ALTER TABLE public.deal_checklist_items ADD COLUMN IF NOT EXISTS deadline_key TEXT;
CREATE INDEX IF NOT EXISTS idx_deal_checklist_items_deadline_key ON public.deal_checklist_items(deal_id, deadline_key) WHERE deadline_key IS NOT NULL;

DO $$
DECLARE
  buyer_tpl UUID; seller_tpl UUID; new_task_id UUID;
BEGIN
  SELECT id INTO buyer_tpl FROM public.checklist_templates WHERE is_system_master AND side='buyer' LIMIT 1;
  SELECT id INTO seller_tpl FROM public.checklist_templates WHERE is_system_master AND side='seller' LIMIT 1;

  UPDATE public.checklist_template_tasks SET deadline_key='contract_date' WHERE template_id=buyer_tpl AND task_number=16;
  UPDATE public.checklist_template_tasks SET deadline_key='inspection_deadline' WHERE template_id=buyer_tpl AND task_number=18;
  UPDATE public.checklist_template_tasks SET deadline_key='inspection_objection_deadline' WHERE template_id=buyer_tpl AND task_number=19;
  UPDATE public.checklist_template_tasks SET deadline_key='appraisal_deadline' WHERE template_id=buyer_tpl AND task_number=24;
  UPDATE public.checklist_template_tasks SET deadline_key='title_objection_deadline' WHERE template_id=buyer_tpl AND task_number=22;
  UPDATE public.checklist_template_tasks SET deadline_key='final_walkthrough_date' WHERE template_id=buyer_tpl AND task_number=25;
  UPDATE public.checklist_template_tasks SET deadline_key='expected_close_date' WHERE template_id=buyer_tpl AND task_number=26;

  UPDATE public.checklist_template_tasks SET deadline_key='listed_at' WHERE template_id=seller_tpl AND task_number=28;
  UPDATE public.checklist_template_tasks SET deadline_key='contract_date' WHERE template_id=seller_tpl AND task_number=35;
  UPDATE public.checklist_template_tasks SET deadline_key='inspection_deadline' WHERE template_id=seller_tpl AND task_number=39;
  UPDATE public.checklist_template_tasks SET deadline_key='inspection_objection_deadline' WHERE template_id=seller_tpl AND task_number=40;
  UPDATE public.checklist_template_tasks SET deadline_key='appraisal_deadline' WHERE template_id=seller_tpl AND task_number=43;
  UPDATE public.checklist_template_tasks SET deadline_key='final_walkthrough_date' WHERE template_id=seller_tpl AND task_number=47;
  UPDATE public.checklist_template_tasks SET deadline_key='expected_close_date' WHERE template_id=seller_tpl AND task_number=46;

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (buyer_tpl, 'offer_accepted_under_contract', 'Under Contract', 161, 'Confirm Earnest Money Deposited', 'agent', true, 'agent', 161, 'earnest_money_due');

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (buyer_tpl, 'closing', 'Closing', 249, 'Confirm Clear to Close', 'agent', true, 'agent', 249, 'financing_contingency_deadline')
  RETURNING id INTO new_task_id;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (new_task_id, 'Confirm closing appointment has been scheduled with title company', 1),
    (new_task_id, 'Ensure closing gift is purchased, wrapped, and ready', 2),
    (new_task_id, 'Send closing checklist email to buyer (template TBD)', 3);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (buyer_tpl, 'closing', 'Closing', 251, 'Confirm Possession Transfer', 'agent', true, 'agent', 251, 'possession_date');

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (seller_tpl, 'offer_accepted_under_contract', 'Under Contract', 361, 'Confirm Earnest Money Received', 'agent', true, 'agent', 361, 'earnest_money_due');

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (seller_tpl, 'financing_and_title', 'Financing & Title', 411, 'Review & Respond to Title Objections', 'agent', true, 'agent', 411, 'title_objection_deadline');

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
  VALUES (seller_tpl, 'closing', 'Closing', 471, 'Confirm Possession Transfer', 'agent', true, 'agent', 471, 'possession_date');
END $$;

-- Cascade deadline_key into personal templates (corrected JOIN order)
UPDATE public.checklist_template_tasks pt
SET deadline_key = sub.deadline_key
FROM (
  SELECT mt.title, mt.deadline_key, mtpl.side
  FROM public.checklist_template_tasks mt
  JOIN public.checklist_templates mtpl ON mtpl.id = mt.template_id AND mtpl.is_system_master
  WHERE mt.deadline_key IS NOT NULL
) sub
JOIN public.checklist_templates ptpl ON ptpl.side = sub.side AND ptpl.is_system_master = false
WHERE pt.template_id = ptpl.id
  AND pt.title = sub.title
  AND pt.deadline_key IS NULL;

-- Insert missing new tasks into personal templates
INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, sort_order, deadline_key)
SELECT ptpl.id, mt.phase_key, mt.phase_label, mt.task_number, mt.title, mt.owner_role, mt.client_visible_default, mt.default_assignee_role, mt.sort_order, mt.deadline_key
FROM public.checklist_template_tasks mt
JOIN public.checklist_templates mtpl ON mtpl.id = mt.template_id AND mtpl.is_system_master
JOIN public.checklist_templates ptpl ON ptpl.side = mtpl.side AND ptpl.is_system_master = false
WHERE mt.task_number IN (161, 249, 251, 361, 411, 471)
  AND NOT EXISTS (
    SELECT 1 FROM public.checklist_template_tasks pt
    WHERE pt.template_id = ptpl.id AND pt.title = mt.title
  );

-- Clone steps for clear-to-close into personal templates
INSERT INTO public.checklist_template_steps (task_id, body, sort_order)
SELECT pt.id, ms.body, ms.sort_order
FROM public.checklist_template_steps ms
JOIN public.checklist_template_tasks mt ON mt.id = ms.task_id
JOIN public.checklist_templates mtpl ON mtpl.id = mt.template_id AND mtpl.is_system_master
JOIN public.checklist_templates ptpl ON ptpl.side = mtpl.side AND ptpl.is_system_master = false
JOIN public.checklist_template_tasks pt ON pt.template_id = ptpl.id AND pt.title = mt.title
WHERE mt.task_number = 249
  AND NOT EXISTS (
    SELECT 1 FROM public.checklist_template_steps ps WHERE ps.task_id = pt.id AND ps.body = ms.body
  );

-- Backfill deadline_key on existing deal checklist items
UPDATE public.deal_checklist_items dci
SET deadline_key = tt.deadline_key
FROM public.checklist_template_tasks tt
WHERE dci.source_template_task_id = tt.id
  AND tt.deadline_key IS NOT NULL
  AND dci.deadline_key IS NULL;

-- Insert new tasks into existing deals' checklists
INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, owner_role, task_number, source_template_task_id, deadline_key)
SELECT d.id, mt.phase_key::deal_stage, mt.title, mt.sort_order, mt.client_visible_default, 'task', mt.owner_role, mt.task_number, mt.id, mt.deadline_key
FROM public.deals d
JOIN public.checklist_templates ptpl ON ptpl.owner_user_id = d.assigned_to AND ptpl.side = d.side::text AND ptpl.is_default = true
JOIN public.checklist_template_tasks mt ON mt.template_id = ptpl.id AND mt.task_number IN (161, 249, 251, 361, 411, 471)
WHERE NOT EXISTS (
  SELECT 1 FROM public.deal_checklist_items existing
  WHERE existing.deal_id = d.id AND existing.label = mt.title
);

-- Clone steps for clear-to-close into existing deal checklists
INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, parent_task_id, body)
SELECT dci.deal_id, dci.stage, ts.body, ts.sort_order, dci.client_visible, 'step', dci.id, ts.body
FROM public.deal_checklist_items dci
JOIN public.checklist_template_tasks tt ON tt.id = dci.source_template_task_id
JOIN public.checklist_template_steps ts ON ts.task_id = tt.id
WHERE tt.task_number = 249
  AND NOT EXISTS (
    SELECT 1 FROM public.deal_checklist_items existing
    WHERE existing.parent_task_id = dci.id AND existing.body = ts.body
  );
