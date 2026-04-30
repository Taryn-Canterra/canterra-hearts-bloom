
CREATE TABLE public.buyer_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  county TEXT,
  state TEXT NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  min_acres NUMERIC,
  bedrooms INTEGER,
  needs_financing BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (public form)
CREATE POLICY "Anyone can submit a buyer lead"
  ON public.buyer_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins/agents can view leads
CREATE POLICY "Admins and agents can view buyer leads"
  ON public.buyer_leads
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Admins and agents can update buyer leads"
  ON public.buyer_leads
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Admins can delete buyer leads"
  ON public.buyer_leads
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER buyer_leads_updated_at
  BEFORE UPDATE ON public.buyer_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
