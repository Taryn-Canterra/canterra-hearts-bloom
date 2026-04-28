CREATE TABLE public.saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX idx_saved_properties_user ON public.saved_properties(user_id);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved properties"
  ON public.saved_properties FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users save properties for self"
  ON public.saved_properties FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users unsave own properties"
  ON public.saved_properties FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());