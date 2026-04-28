
-- ============================================================
-- Canterra build spec: Collections, Saved Searches v2, Vendor Directory
-- ============================================================

-- =================== COLLECTIONS ===================
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_user_id uuid,
  name text NOT NULL,
  description text,
  is_shared boolean NOT NULL DEFAULT false,
  share_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own collections"
  ON public.collections FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Linked agents read shared collections"
  ON public.collections FOR SELECT TO authenticated
  USING (is_shared = true AND agent_user_id = auth.uid());

CREATE POLICY "Public reads via share token (when shared)"
  ON public.collections FOR SELECT TO anon, authenticated
  USING (is_shared = true AND share_token IS NOT NULL);

CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.collection_item_status AS ENUM ('saved', 'toured', 'offer_made', 'eliminated');
CREATE TYPE public.collection_item_reaction AS ENUM ('love', 'like', 'maybe', 'no');

CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  status public.collection_item_status NOT NULL DEFAULT 'saved',
  reaction public.collection_item_reaction,
  buyer_notes text,
  agent_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, property_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items follow collection access"
  ON public.collection_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND (c.user_id = auth.uid() OR (c.is_shared AND c.agent_user_id = auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND (c.user_id = auth.uid() OR (c.is_shared AND c.agent_user_id = auth.uid()))
    )
  );

CREATE POLICY "Public read items via shared collection"
  ON public.collection_items FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.is_shared = true
        AND c.share_token IS NOT NULL
    )
  );

-- =================== USER SAVED SEARCHES (v2) ===================
-- Existing saved_searches table is for anonymous CTAs; create user-owned variant.
CREATE TABLE public.user_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own saved searches"
  ON public.user_saved_searches FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER user_saved_searches_updated_at
  BEFORE UPDATE ON public.user_saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== VENDOR DIRECTORY ===================
CREATE TYPE public.vendor_tier AS ENUM ('free', 'basic', 'featured');

CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  phone text,
  email text,
  website text,
  city text,
  state text NOT NULL DEFAULT 'CO',
  county text,
  service_counties text[] NOT NULL DEFAULT '{}',
  service_states text[] NOT NULL DEFAULT '{CO}',
  photo_url text,
  tier public.vendor_tier NOT NULL DEFAULT 'free',
  is_verified boolean NOT NULL DEFAULT false,
  rating numeric(3,2),
  review_count integer NOT NULL DEFAULT 0,
  claimed_by uuid,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published vendors"
  ON public.vendors FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins manage vendors"
  ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Claimed owners update own vendor"
  ON public.vendors FOR UPDATE TO authenticated
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendors_category ON public.vendors(category);
CREATE INDEX idx_vendors_state_county ON public.vendors(state, county);

-- Vendor reviews
CREATE TABLE public.vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  used_during_canterra_tx boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.vendor_reviews FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated users post own reviews"
  ON public.vendor_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers edit/delete own reviews"
  ON public.vendor_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Reviewers delete own reviews"
  ON public.vendor_reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid());
