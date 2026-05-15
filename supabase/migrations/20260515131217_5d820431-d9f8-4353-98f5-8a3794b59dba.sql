
CREATE POLICY "Clients update tasks assigned to them"
ON public.deal_checklist_items
FOR UPDATE
TO authenticated
USING (
  client_visible = true
  AND public.is_client_on_deal(deal_id, auth.uid())
  AND assigned_party_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.deal_parties p
    WHERE p.id = deal_checklist_items.assigned_party_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  client_visible = true
  AND public.is_client_on_deal(deal_id, auth.uid())
  AND assigned_party_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.deal_parties p
    WHERE p.id = deal_checklist_items.assigned_party_id
      AND p.user_id = auth.uid()
  )
);
