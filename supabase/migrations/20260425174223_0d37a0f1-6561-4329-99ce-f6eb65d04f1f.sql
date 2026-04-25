
-- ============ ADD CLIENT ROLE ============
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- ============ DEAL CLIENTS ============
CREATE TABLE public.deal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, client_email)
);

ALTER TABLE public.deal_clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_clients_email ON public.deal_clients(lower(client_email));
CREATE INDEX idx_deal_clients_user ON public.deal_clients(client_user_id);

-- Helper: is the current user the client on this deal?
CREATE OR REPLACE FUNCTION public.is_client_on_deal(_deal_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deal_clients
    WHERE deal_id = _deal_id AND client_user_id = _user_id
  )
$$;

CREATE POLICY "Agents/admins manage deal_clients for their deals"
  ON public.deal_clients FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
  );

CREATE POLICY "Clients see their own deal_clients link"
  ON public.deal_clients FOR SELECT TO authenticated
  USING (client_user_id = auth.uid());

-- ============ EXTEND DEAL ACCESS TO CLIENTS (READ ONLY) ============
CREATE POLICY "Clients can read their deals"
  ON public.deals FOR SELECT TO authenticated
  USING (public.is_client_on_deal(id, auth.uid()));

-- ============ EXTEND CHECKLIST: CLIENTS SEE ONLY VISIBLE ITEMS ============
CREATE POLICY "Clients read visible checklist items"
  ON public.deal_checklist_items FOR SELECT TO authenticated
  USING (
    client_visible = true
    AND public.is_client_on_deal(deal_id, auth.uid())
  );

-- ============ DEAL MESSAGES ============
CREATE TABLE public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_messages_deal ON public.deal_messages(deal_id, created_at DESC);

CREATE POLICY "Agents/admins read messages on their deals"
  ON public.deal_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
  );

CREATE POLICY "Clients read messages on their deals"
  ON public.deal_messages FOR SELECT TO authenticated
  USING (public.is_client_on_deal(deal_id, auth.uid()));

CREATE POLICY "Agents/admins send messages on their deals"
  ON public.deal_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Clients send messages on their deals"
  ON public.deal_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND public.is_client_on_deal(deal_id, auth.uid())
  );

CREATE POLICY "Authors update their own message read state"
  ON public.deal_messages FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid()) OR
    public.is_client_on_deal(deal_id, auth.uid())
  );

-- ============ DEAL DOCUMENTS ============
CREATE TABLE public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deal_documents_deal ON public.deal_documents(deal_id);

CREATE POLICY "Agents/admins manage docs on their deals"
  ON public.deal_documents FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid())
  );

CREATE POLICY "Clients read visible docs on their deals"
  ON public.deal_documents FOR SELECT TO authenticated
  USING (visible_to_client = true AND public.is_client_on_deal(deal_id, auth.uid()));

CREATE POLICY "Clients upload docs to their deals"
  ON public.deal_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND public.is_client_on_deal(deal_id, auth.uid())
  );

CREATE POLICY "Clients delete their own uploaded docs"
  ON public.deal_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() AND public.is_client_on_deal(deal_id, auth.uid()));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('deal-documents', 'deal-documents', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: path is "{deal_id}/{filename}"
CREATE POLICY "Agents/admins read deal docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'deal-documents' AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id::text = (storage.foldername(name))[1] AND d.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Clients read visible deal docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'deal-documents' AND
    public.is_client_on_deal(((storage.foldername(name))[1])::uuid, auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.deal_documents dd
      WHERE dd.storage_path = name AND dd.visible_to_client = true
    )
  );

CREATE POLICY "Agents/admins upload deal docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deal-documents' AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id::text = (storage.foldername(name))[1] AND d.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Clients upload deal docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deal-documents' AND
    public.is_client_on_deal(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Agents/admins delete deal docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'deal-documents' AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id::text = (storage.foldername(name))[1] AND d.assigned_to = auth.uid()
      )
    )
  );

-- ============ AUTO-LINK CLIENT ON SIGNUP ============
-- Replace handle_new_user to also link any pending deal_client invites by email
-- and grant the 'client' role when applicable.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  matched_invites INTEGER;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  -- Link any pending client invites by email (case-insensitive)
  UPDATE public.deal_clients
  SET client_user_id = NEW.id, accepted_at = now()
  WHERE lower(client_email) = lower(NEW.email) AND client_user_id IS NULL;

  GET DIAGNOSTICS matched_invites = ROW_COUNT;

  IF matched_invites > 0 THEN
    -- This user was invited as a client → grant client role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client')
      ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default new signup → agent role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agent')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
