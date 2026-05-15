
-- ============ VENDOR REVIEWS ENHANCEMENTS ============
ALTER TABLE public.vendor_reviews
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS verified_buyer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.vendor_reviews;
CREATE POLICY "Anyone can read published reviews" ON public.vendor_reviews
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can write reviews" ON public.vendor_reviews;
CREATE POLICY "Authenticated users can write reviews" ON public.vendor_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_user_id = auth.uid() AND rating BETWEEN 1 AND 5);

DROP POLICY IF EXISTS "Authors update own reviews" ON public.vendor_reviews;
CREATE POLICY "Authors update own reviews" ON public.vendor_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_user_id = auth.uid())
  WITH CHECK (reviewer_user_id = auth.uid());

DROP POLICY IF EXISTS "Authors or admins delete reviews" ON public.vendor_reviews;
CREATE POLICY "Authors or admins delete reviews" ON public.vendor_reviews
  FOR DELETE TO authenticated
  USING (reviewer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage all reviews" ON public.vendor_reviews;
CREATE POLICY "Admins manage all reviews" ON public.vendor_reviews
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto verify buyer if reviewer is a client on a deal where the vendor is attached
CREATE OR REPLACE FUNCTION public.set_review_verified_buyer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.reviewer_user_id IS NOT NULL THEN
    NEW.verified_buyer := EXISTS (
      SELECT 1 FROM public.deal_vendors dv
      JOIN public.deal_clients dc ON dc.deal_id = dv.deal_id
      WHERE dv.vendor_id = NEW.vendor_id AND dc.client_user_id = NEW.reviewer_user_id
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_review_verified_buyer ON public.vendor_reviews;
CREATE TRIGGER trg_set_review_verified_buyer
  BEFORE INSERT OR UPDATE ON public.vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_review_verified_buyer();

-- Recompute vendor rating + count after review changes
CREATE OR REPLACE FUNCTION public.recompute_vendor_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  v_id := COALESCE(NEW.vendor_id, OLD.vendor_id);
  UPDATE public.vendors v SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.vendor_reviews WHERE vendor_id = v_id AND status = 'published'),
    review_count = (SELECT COUNT(*) FROM public.vendor_reviews WHERE vendor_id = v_id AND status = 'published')
  WHERE v.id = v_id;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_recompute_vendor_rating ON public.vendor_reviews;
CREATE TRIGGER trg_recompute_vendor_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_vendor_rating();

-- ============ REVIEW REPORTS ============
CREATE TABLE IF NOT EXISTS public.vendor_review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  reporter_user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, reporter_user_id)
);
ALTER TABLE public.vendor_review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report a review" ON public.vendor_review_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "Reporters and admins can read" ON public.vendor_review_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage reports" ON public.vendor_review_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-hide reviews with 3+ reports
CREATE OR REPLACE FUNCTION public.bump_review_report_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.vendor_review_reports WHERE review_id = NEW.review_id;
  UPDATE public.vendor_reviews
  SET report_count = v_count,
      status = CASE WHEN v_count >= 3 AND status = 'published' THEN 'hidden' ELSE status END,
      hidden_at = CASE WHEN v_count >= 3 AND hidden_at IS NULL THEN now() ELSE hidden_at END
  WHERE id = NEW.review_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_bump_review_report_count ON public.vendor_review_reports;
CREATE TRIGGER trg_bump_review_report_count
  AFTER INSERT ON public.vendor_review_reports
  FOR EACH ROW EXECUTE FUNCTION public.bump_review_report_count();

-- ============ USER SAVED VENDORS (favorites) ============
CREATE TABLE IF NOT EXISTS public.user_saved_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);
ALTER TABLE public.user_saved_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved vendors" ON public.user_saved_vendors
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ VENDOR SUGGESTIONS (suggest a favorite vendor to invite) ============
CREATE TABLE IF NOT EXISTS public.vendor_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  vendor_name text NOT NULL,
  vendor_email text,
  vendor_phone text,
  vendor_website text,
  category text,
  city text,
  state text,
  personal_note text,
  invite_email_sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users submit suggestions" ON public.vendor_suggestions
  FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Users read own suggestions" ON public.vendor_suggestions
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage suggestions" ON public.vendor_suggestions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ AGENT VENDOR LISTS (curated lists, templates + per-deal copies) ============
CREATE TABLE IF NOT EXISTS public.agent_vendor_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  cover_emoji text,
  is_template boolean NOT NULL DEFAULT true,
  deal_id uuid,
  source_list_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_vendor_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own vendor lists" ON public.agent_vendor_lists
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients read lists shared to their deal" ON public.agent_vendor_lists
  FOR SELECT TO authenticated
  USING (deal_id IS NOT NULL AND is_client_on_deal(deal_id, auth.uid()));

CREATE TRIGGER trg_agent_vendor_lists_touch
  BEFORE UPDATE ON public.agent_vendor_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.agent_vendor_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  agent_note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, vendor_id)
);
ALTER TABLE public.agent_vendor_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items follow list access (owner)" ON public.agent_vendor_list_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agent_vendor_lists l WHERE l.id = list_id AND (l.owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agent_vendor_lists l WHERE l.id = list_id AND (l.owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Clients read items in lists shared to their deal" ON public.agent_vendor_list_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agent_vendor_lists l WHERE l.id = list_id AND l.deal_id IS NOT NULL AND is_client_on_deal(l.deal_id, auth.uid())));

-- Helper function: clone a template list into a deal-scoped copy
CREATE OR REPLACE FUNCTION public.clone_vendor_list_to_deal(_template_id uuid, _deal_id uuid, _custom_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_template RECORD; v_new_id uuid; v_caller uuid;
BEGIN
  v_caller := auth.uid();
  -- Verify caller owns the template AND the deal
  SELECT * INTO v_template FROM public.agent_vendor_lists WHERE id = _template_id AND owner_user_id = v_caller;
  IF v_template IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.deals WHERE id = _deal_id AND assigned_to = v_caller) THEN
    RAISE EXCEPTION 'Not authorized for deal';
  END IF;

  INSERT INTO public.agent_vendor_lists (owner_user_id, name, description, cover_emoji, is_template, deal_id, source_list_id)
  VALUES (v_caller, COALESCE(_custom_name, v_template.name), v_template.description, v_template.cover_emoji, false, _deal_id, _template_id)
  RETURNING id INTO v_new_id;

  INSERT INTO public.agent_vendor_list_items (list_id, vendor_id, agent_note, sort_order)
  SELECT v_new_id, vendor_id, agent_note, sort_order FROM public.agent_vendor_list_items WHERE list_id = _template_id;

  RETURN v_new_id;
END; $$;
