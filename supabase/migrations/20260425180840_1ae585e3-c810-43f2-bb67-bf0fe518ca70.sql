-- =====================================================================
-- Consumer Transaction Dashboard v2: deadlines, showings, offers,
-- listing metrics, price reductions, lender milestones, vendor directory,
-- maintenance reminders, e-sign stubs.
-- =====================================================================

-- 1. Extend deals with all critical contract dates + listing metadata
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS listed_at date,
  ADD COLUMN IF NOT EXISTS list_price numeric,
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS earnest_money_due date,
  ADD COLUMN IF NOT EXISTS earnest_money_amount numeric,
  ADD COLUMN IF NOT EXISTS inspection_deadline date,
  ADD COLUMN IF NOT EXISTS inspection_objection_deadline date,
  ADD COLUMN IF NOT EXISTS appraisal_deadline date,
  ADD COLUMN IF NOT EXISTS financing_contingency_deadline date,
  ADD COLUMN IF NOT EXISTS title_objection_deadline date,
  ADD COLUMN IF NOT EXISTS final_walkthrough_date date,
  ADD COLUMN IF NOT EXISTS possession_date date,
  ADD COLUMN IF NOT EXISTS lender_name text,
  ADD COLUMN IF NOT EXISTS lender_contact_name text,
  ADD COLUMN IF NOT EXISTS lender_contact_email text,
  ADD COLUMN IF NOT EXISTS lender_contact_phone text,
  ADD COLUMN IF NOT EXISTS title_company_name text,
  ADD COLUMN IF NOT EXISTS title_contact_name text,
  ADD COLUMN IF NOT EXISTS title_contact_email text,
  ADD COLUMN IF NOT EXISTS net_proceeds_estimate numeric,
  ADD COLUMN IF NOT EXISTS price_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Auto-calc deadlines from contract_date if user hasn't set them.
-- CO defaults: 10 days inspection, 14 days inspection-objection, 21 appraisal,
-- 30 financing, 14 title objection, 1 day pre-close walkthrough.
CREATE OR REPLACE FUNCTION public.auto_calc_deal_deadlines()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.contract_date IS NOT NULL AND
     (OLD IS NULL OR OLD.contract_date IS DISTINCT FROM NEW.contract_date) THEN

    IF NEW.earnest_money_due IS NULL THEN
      NEW.earnest_money_due := NEW.contract_date + INTERVAL '3 days';
    END IF;
    IF NEW.inspection_deadline IS NULL THEN
      NEW.inspection_deadline := NEW.contract_date + INTERVAL '10 days';
    END IF;
    IF NEW.inspection_objection_deadline IS NULL THEN
      NEW.inspection_objection_deadline := NEW.contract_date + INTERVAL '14 days';
    END IF;
    IF NEW.appraisal_deadline IS NULL THEN
      NEW.appraisal_deadline := NEW.contract_date + INTERVAL '21 days';
    END IF;
    IF NEW.financing_contingency_deadline IS NULL THEN
      NEW.financing_contingency_deadline := NEW.contract_date + INTERVAL '30 days';
    END IF;
    IF NEW.title_objection_deadline IS NULL THEN
      NEW.title_objection_deadline := NEW.contract_date + INTERVAL '14 days';
    END IF;
    IF NEW.expected_close_date IS NULL THEN
      NEW.expected_close_date := NEW.contract_date + INTERVAL '45 days';
    END IF;
    IF NEW.final_walkthrough_date IS NULL AND NEW.expected_close_date IS NOT NULL THEN
      NEW.final_walkthrough_date := NEW.expected_close_date - INTERVAL '1 day';
    END IF;
  END IF;

  -- Track price changes (sellers)
  IF NEW.list_price IS NOT NULL AND
     (OLD IS NULL OR OLD.list_price IS DISTINCT FROM NEW.list_price) THEN
    NEW.price_history := COALESCE(OLD.price_history, '[]'::jsonb) ||
      jsonb_build_object('price', NEW.list_price, 'changed_at', now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_calc_deal_deadlines_trg ON public.deals;
CREATE TRIGGER auto_calc_deal_deadlines_trg
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.auto_calc_deal_deadlines();

-- 3. Showings (seller side: who toured; buyer side: what is scheduled)
CREATE TABLE IF NOT EXISTS public.deal_showings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  buyer_agent_name text,
  buyer_agent_brokerage text,
  feedback text,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_showings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage showings on their deals"
  ON public.deal_showings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_showings.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_showings.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read showings on their deals"
  ON public.deal_showings FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

-- 4. Offers (both sides see; seller sees inbox, buyer sees their submitted)
CREATE TABLE IF NOT EXISTS public.deal_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  direction text NOT NULL, -- 'incoming' (seller side) or 'outgoing' (buyer side)
  offer_price numeric NOT NULL,
  earnest_money numeric,
  financing_type text, -- cash, conventional, fha, va, other
  contingencies text,
  proposed_close_date date,
  buyer_or_offering_party text,
  agent_recommendation text,
  status text NOT NULL DEFAULT 'submitted', -- submitted, countered, accepted, rejected, withdrawn
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage offers on their deals"
  ON public.deal_offers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_offers.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_offers.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read offers on their deals"
  ON public.deal_offers FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

-- 5. Listing-side metrics (seller dashboard)
CREATE TABLE IF NOT EXISTS public.deal_listing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  recorded_on date NOT NULL DEFAULT CURRENT_DATE,
  views integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  inquiries integer NOT NULL DEFAULT 0,
  showing_requests integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, recorded_on)
);
ALTER TABLE public.deal_listing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage metrics on their deals"
  ON public.deal_listing_metrics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_listing_metrics.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_listing_metrics.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read metrics on their deals"
  ON public.deal_listing_metrics FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

-- 6. Price reduction proposals (agent proposes → client approves → applied)
CREATE TABLE IF NOT EXISTS public.deal_price_reductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  proposed_price numeric NOT NULL,
  prior_price numeric NOT NULL,
  reasoning text,
  status text NOT NULL DEFAULT 'proposed', -- proposed, approved, declined, applied
  proposed_by uuid NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_price_reductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage price reductions"
  ON public.deal_price_reductions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_price_reductions.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_price_reductions.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read price reductions on their deals"
  ON public.deal_price_reductions FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

-- Clients can update status to approve/decline
CREATE POLICY "Clients update status of price reductions"
  ON public.deal_price_reductions FOR UPDATE TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()))
  WITH CHECK (is_client_on_deal(deal_id, auth.uid()));

-- 7. Lender milestones (buyer-side loan tracker)
CREATE TABLE IF NOT EXISTS public.deal_lender_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  milestone text NOT NULL, -- application, processing, conditional_approval, appraisal_review, clear_to_close, funded
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, complete, blocked
  notes text,
  reached_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_lender_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage lender milestones"
  ON public.deal_lender_milestones FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_lender_milestones.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_lender_milestones.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read lender milestones on their deals"
  ON public.deal_lender_milestones FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

CREATE TRIGGER update_lender_milestones_updated_at
  BEFORE UPDATE ON public.deal_lender_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. E-signature requests (integration stub — agent enters URL, client signs externally)
CREATE TABLE IF NOT EXISTS public.deal_esign_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  document_name text NOT NULL,
  signing_url text,
  external_provider text, -- docusign, dotloop, etc.
  external_envelope_id text,
  status text NOT NULL DEFAULT 'sent', -- sent, viewed, signed, declined, voided
  sent_to_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_esign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage esign requests"
  ON public.deal_esign_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_esign_requests.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_esign_requests.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read esign requests on their deals"
  ON public.deal_esign_requests FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

-- 9. Vendor directory + maintenance reminders (post-close hub)
CREATE TABLE IF NOT EXISTS public.deal_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  category text NOT NULL, -- farrier, vet, hay, fencing, electrician, plumber, well_service, septic, landscaper, other
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage vendors on their deals"
  ON public.deal_vendors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_vendors.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_vendors.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read vendors on their deals"
  ON public.deal_vendors FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.deal_maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_on date,
  recurrence text, -- monthly, quarterly, biannual, annual, none
  category text, -- equine_seasonal, well_septic, hvac, roof, fencing, other
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents/admins manage reminders on their deals"
  ON public.deal_maintenance_reminders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_maintenance_reminders.deal_id AND d.assigned_to = auth.uid()
  ))
  WITH CHECK (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_maintenance_reminders.deal_id AND d.assigned_to = auth.uid()
  ));

CREATE POLICY "Clients read reminders on their deals"
  ON public.deal_maintenance_reminders FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));

CREATE POLICY "Clients update reminder completion"
  ON public.deal_maintenance_reminders FOR UPDATE TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()))
  WITH CHECK (is_client_on_deal(deal_id, auth.uid()));

-- 10. Deadline reminder tracking (so 48h emails don't double-send)
CREATE TABLE IF NOT EXISTS public.deal_deadline_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  deadline_field text NOT NULL,
  deadline_value date NOT NULL,
  reminder_window text NOT NULL, -- '48h', '24h'
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, deadline_field, deadline_value, reminder_window)
);
ALTER TABLE public.deal_deadline_reminders_sent ENABLE ROW LEVEL SECURITY;
-- No client-facing policies; service role only.

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_deal_showings_deal ON public.deal_showings(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_offers_deal ON public.deal_offers(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_listing_metrics_deal ON public.deal_listing_metrics(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_lender_milestones_deal ON public.deal_lender_milestones(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_esign_requests_deal ON public.deal_esign_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_vendors_deal ON public.deal_vendors(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_maintenance_deal ON public.deal_maintenance_reminders(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_price_reductions_deal ON public.deal_price_reductions(deal_id);

-- Enable realtime for live updates on key tables
ALTER TABLE public.deal_offers REPLICA IDENTITY FULL;
ALTER TABLE public.deal_showings REPLICA IDENTITY FULL;
ALTER TABLE public.deal_lender_milestones REPLICA IDENTITY FULL;
ALTER TABLE public.deal_price_reductions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_showings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_lender_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_price_reductions;