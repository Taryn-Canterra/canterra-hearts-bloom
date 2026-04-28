-- 1. Notifications center
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,                    -- 'deadline','stage_change','showing_request','offer','message','price_reduction','vendor_assigned','match_score'
  title text NOT NULL,
  body text,
  link text,                             -- in-app deep link
  deal_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read_at, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Lead routing rules (admin-managed)
CREATE TABLE public.lead_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,             -- higher = checked first
  match_lead_type text,                            -- 'property_inquiry' | 'saved_search' | NULL = any
  match_county text,                               -- optional county match
  match_min_price numeric,
  match_max_price numeric,
  assign_to uuid NOT NULL,                         -- agent id
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read routing rules" ON public.lead_routing_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage routing rules" ON public.lead_routing_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lead_routing_rules_updated
  BEFORE UPDATE ON public.lead_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Listing claims (agent claim-listing CTA)
CREATE TABLE public.listing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  claimant_name text NOT NULL,
  claimant_email text NOT NULL,
  claimant_phone text,
  brokerage text,
  license_number text,
  message text,
  status text NOT NULL DEFAULT 'pending',          -- pending | approved | rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_user_id uuid,                           -- agent user id once they sign up & verified
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_listing_claims_property ON public.listing_claims (property_id, status);
ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a listing claim" ON public.listing_claims
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(claimant_name) BETWEEN 1 AND 120
    AND char_length(claimant_email) BETWEEN 5 AND 254
    AND claimant_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
CREATE POLICY "Admins read all listing claims" ON public.listing_claims
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage listing claims" ON public.listing_claims
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Claimants read own claims" ON public.listing_claims
  FOR SELECT TO authenticated
  USING (approved_user_id = auth.uid() OR lower(claimant_email) = lower(coalesce((auth.jwt() ->> 'email'),'')));

-- 4. Link deal_vendors to directory vendors
ALTER TABLE public.deal_vendors
  ADD COLUMN IF NOT EXISTS vendor_id uuid;

-- 5. AI match scores on collection items
ALTER TABLE public.collection_items
  ADD COLUMN IF NOT EXISTS match_score integer,
  ADD COLUMN IF NOT EXISTS match_reasoning text,
  ADD COLUMN IF NOT EXISTS match_against_search uuid,  -- saved_search id used
  ADD COLUMN IF NOT EXISTS match_generated_at timestamptz;

-- 6. AI property intelligence reports (one per property, regenerable)
CREATE TABLE public.property_intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  summary text NOT NULL,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  watchouts jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_to_ask jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_intel_property ON public.property_intelligence_reports (property_id, created_at DESC);
ALTER TABLE public.property_intelligence_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read intel reports" ON public.property_intelligence_reports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create intel reports" ON public.property_intelligence_reports
  FOR INSERT TO authenticated WITH CHECK (generated_by = auth.uid());

-- 7. Showing requests from buyers (extend deal_showings)
ALTER TABLE public.deal_showings
  ADD COLUMN IF NOT EXISTS requested_by_role text,        -- 'agent' | 'client'
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Allow clients to insert showing requests on their deal
CREATE POLICY "Clients request showings on own deal" ON public.deal_showings
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_client_on_deal(deal_id, auth.uid()));
