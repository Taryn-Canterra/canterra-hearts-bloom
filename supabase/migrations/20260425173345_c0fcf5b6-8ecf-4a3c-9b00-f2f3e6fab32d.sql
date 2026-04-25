
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'agent');

CREATE TYPE public.deal_side AS ENUM ('buyer', 'seller');

CREATE TYPE public.deal_stage AS ENUM (
  'new_lead',
  'qualified',
  'property_tour_or_listing_prep',
  'offer_drafted_or_listed',
  'offer_accepted_under_contract',
  'inspection_and_appraisal',
  'financing_and_title',
  'closing',
  'closed_won',
  'lost',
  'withdrawn'
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  brokerage TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ LEAD ASSIGNMENTS ============
-- Links existing public-write lead rows (saved_searches / property_inquiries) to an owning agent.
CREATE TABLE public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL CHECK (lead_type IN ('saved_search', 'property_inquiry')),
  lead_id UUID NOT NULL,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_type, lead_id)
);

ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own assignments, admins view all"
  ON public.lead_assignments FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents and admins create assignments"
  ON public.lead_assignments FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents update own assignments, admins all"
  ON public.lead_assignments FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete assignments"
  ON public.lead_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lead_assignments_updated_at
  BEFORE UPDATE ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow assigned agent (or admin) to read the underlying lead rows.
CREATE POLICY "Assigned agents read saved searches"
  ON public.saved_searches FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.lead_assignments la
      WHERE la.lead_type = 'saved_search' AND la.lead_id = saved_searches.id AND la.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admins read all saved searches"
  ON public.saved_searches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned agents read property inquiries"
  ON public.property_inquiries FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.lead_assignments la
      WHERE la.lead_type = 'property_inquiry' AND la.lead_id = property_inquiries.id AND la.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admins read all property inquiries"
  ON public.property_inquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ DEALS ============
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side public.deal_side NOT NULL,
  stage public.deal_stage NOT NULL DEFAULT 'new_lead',
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  property_address TEXT,
  price NUMERIC,
  commission_pct NUMERIC,
  expected_close_date DATE,
  actual_close_date DATE,
  source_lead_type TEXT CHECK (source_lead_type IN ('saved_search', 'property_inquiry', 'manual')),
  source_lead_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own deals, admins all"
  ON public.deals FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents create deals assigned to self"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents update own deals, admins all"
  ON public.deals FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents delete own deals, admins all"
  ON public.deals FOR DELETE TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX idx_deals_stage ON public.deals(stage);

-- ============ DEAL CHECKLIST ITEMS ============
CREATE TABLE public.deal_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  stage public.deal_stage NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checklist follows deal access"
  ON public.deal_checklist_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER deal_checklist_updated_at
  BEFORE UPDATE ON public.deal_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_checklist_deal ON public.deal_checklist_items(deal_id);

-- ============ DEAL NOTES ============
CREATE TABLE public.deal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes follow deal access (read)"
  ON public.deal_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Notes follow deal access (insert)"
  ON public.deal_notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Authors delete own notes"
  ON public.deal_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_deal_notes_deal ON public.deal_notes(deal_id);

-- ============ AUTO-SEED CHECKLIST ON DEAL CREATE ============
CREATE OR REPLACE FUNCTION public.seed_deal_checklist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.side = 'buyer' THEN
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible) VALUES
      (NEW.id, 'new_lead', 'Initial buyer consultation call', 1, true),
      (NEW.id, 'new_lead', 'Send buyer representation agreement', 2, true),
      (NEW.id, 'qualified', 'Confirm pre-approval / proof of funds', 1, true),
      (NEW.id, 'qualified', 'Define equine property requirements (acres, stalls, arena, etc.)', 2, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Schedule property showings', 1, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Walk pastures, fencing, water rights with buyer', 2, true),
      (NEW.id, 'offer_drafted_or_listed', 'Draft purchase offer', 1, true),
      (NEW.id, 'offer_drafted_or_listed', 'Submit offer to listing agent', 2, true),
      (NEW.id, 'offer_accepted_under_contract', 'Deliver earnest money', 1, true),
      (NEW.id, 'offer_accepted_under_contract', 'Open escrow / title', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Schedule home inspection', 1, true),
      (NEW.id, 'inspection_and_appraisal', 'Schedule well, septic, soil, water-rights inspections', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Order appraisal', 3, true),
      (NEW.id, 'inspection_and_appraisal', 'Negotiate inspection objections', 4, true),
      (NEW.id, 'financing_and_title', 'Submit final loan documents', 1, true),
      (NEW.id, 'financing_and_title', 'Review title commitment & HOA docs', 2, true),
      (NEW.id, 'financing_and_title', 'Confirm clear-to-close from lender', 3, true),
      (NEW.id, 'closing', 'Final walkthrough', 1, true),
      (NEW.id, 'closing', 'Sign closing documents', 2, true),
      (NEW.id, 'closing', 'Wire down payment & closing costs', 3, true),
      (NEW.id, 'closed_won', 'Deliver keys & welcome packet', 1, true),
      (NEW.id, 'closed_won', 'Request testimonial & referrals', 2, false);
  ELSE
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible) VALUES
      (NEW.id, 'new_lead', 'Initial seller consultation', 1, true),
      (NEW.id, 'new_lead', 'Tour property & assess equine features', 2, true),
      (NEW.id, 'qualified', 'Comparative market analysis (CMA)', 1, true),
      (NEW.id, 'qualified', 'Sign listing agreement', 2, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Professional photography & drone footage', 1, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Write equine-focused listing description', 2, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Stage barn, pastures, and home', 3, true),
      (NEW.id, 'offer_drafted_or_listed', 'Publish to MLS & syndication', 1, true),
      (NEW.id, 'offer_drafted_or_listed', 'Host showings & open houses', 2, true),
      (NEW.id, 'offer_accepted_under_contract', 'Review & negotiate offers', 1, true),
      (NEW.id, 'offer_accepted_under_contract', 'Execute contract & deliver to title', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Coordinate buyer inspections (home/well/septic)', 1, true),
      (NEW.id, 'inspection_and_appraisal', 'Respond to inspection objections', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Coordinate appraisal access', 3, true),
      (NEW.id, 'financing_and_title', 'Provide title with required disclosures', 1, true),
      (NEW.id, 'financing_and_title', 'Confirm buyer financing', 2, true),
      (NEW.id, 'closing', 'Coordinate move-out & livestock transition', 1, true),
      (NEW.id, 'closing', 'Sign closing documents', 2, true),
      (NEW.id, 'closed_won', 'Confirm funds disbursed', 1, true),
      (NEW.id, 'closed_won', 'Request testimonial & referrals', 2, false);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_deal_created_seed_checklist
  AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.seed_deal_checklist();
