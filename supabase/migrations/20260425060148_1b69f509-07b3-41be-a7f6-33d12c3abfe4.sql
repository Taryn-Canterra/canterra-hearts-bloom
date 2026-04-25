-- Enums
CREATE TYPE public.listing_status AS ENUM ('active', 'pending', 'sold', 'withdrawn');
CREATE TYPE public.analysis_status AS ENUM ('pending', 'analyzing', 'analyzed', 'failed');

-- Properties: every MLS listing we ingest, equine or not
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- MLS identity
  mls_number TEXT UNIQUE,
  source TEXT NOT NULL DEFAULT 'seed', -- 'trestle', 'seed', 'manual'
  -- Raw listing data
  title TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  county TEXT,
  state TEXT NOT NULL DEFAULT 'CO',
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  price NUMERIC,
  beds NUMERIC,
  baths NUMERIC,
  sqft INTEGER,
  acres NUMERIC,
  property_type TEXT,
  status public.listing_status NOT NULL DEFAULT 'active',
  days_on_market INTEGER,
  photos TEXT[] NOT NULL DEFAULT '{}',
  primary_photo TEXT,
  listing_agent_name TEXT,
  listing_agent_phone TEXT,
  listing_agent_email TEXT,
  brokerage_name TEXT,
  -- AI verdict
  analysis_status public.analysis_status NOT NULL DEFAULT 'pending',
  is_equine BOOLEAN,
  equine_confidence NUMERIC, -- 0.0 to 1.0
  equine_reasoning TEXT,
  equine_features TEXT[] NOT NULL DEFAULT '{}',
  ai_tags TEXT[] NOT NULL DEFAULT '{}',
  stalls INTEGER,
  paddocks INTEGER,
  analyzed_at TIMESTAMPTZ,
  -- Bookkeeping
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_is_equine ON public.properties(is_equine) WHERE is_equine = true;
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_acres ON public.properties(acres);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_analysis_status ON public.properties(analysis_status);

-- Audit log for AI runs
CREATE TABLE public.listing_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_runs_property ON public.listing_analysis_runs(property_id);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_analysis_runs ENABLE ROW LEVEL SECURITY;

-- Public can read equine properties (and everything during dev)
CREATE POLICY "Anyone can view properties"
ON public.properties FOR SELECT
USING (true);

-- Only service role writes (no client-facing policy needed for inserts/updates;
-- service role bypasses RLS)

-- Analysis runs are admin-only. No SELECT policy = no client access.
-- Service role bypasses RLS for backend reads.

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();