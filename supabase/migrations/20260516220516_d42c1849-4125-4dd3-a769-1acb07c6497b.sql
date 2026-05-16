
-- 1. BEFORE INSERT trigger on deal_clients: if a profile already exists for that email, link it & mark accepted
CREATE OR REPLACE FUNCTION public.link_deal_client_to_existing_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.client_user_id IS NULL AND NEW.client_email IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.profiles
    WHERE lower(email) = lower(NEW.client_email)
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      NEW.client_user_id := v_user_id;
      NEW.accepted_at := COALESCE(NEW.accepted_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_deal_client_to_existing_profile ON public.deal_clients;
CREATE TRIGGER trg_link_deal_client_to_existing_profile
BEFORE INSERT ON public.deal_clients
FOR EACH ROW EXECUTE FUNCTION public.link_deal_client_to_existing_profile();

-- 2. AFTER INSERT: if we linked a user, make sure they have the client role
CREATE OR REPLACE FUNCTION public.grant_client_role_on_invite_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.client_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_client_role_on_invite_link ON public.deal_clients;
CREATE TRIGGER trg_grant_client_role_on_invite_link
AFTER INSERT OR UPDATE OF client_user_id ON public.deal_clients
FOR EACH ROW EXECUTE FUNCTION public.grant_client_role_on_invite_link();

-- 3. Auto-invite from deals.client_email
CREATE OR REPLACE FUNCTION public.auto_invite_deal_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_email IS NOT NULL AND length(trim(NEW.client_email)) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.deal_clients
      WHERE deal_id = NEW.id AND lower(client_email) = lower(NEW.client_email)
    ) THEN
      INSERT INTO public.deal_clients (deal_id, client_email, invited_by)
      VALUES (NEW.id, lower(trim(NEW.client_email)), NEW.assigned_to);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_invite_deal_client ON public.deals;
CREATE TRIGGER trg_auto_invite_deal_client
AFTER INSERT OR UPDATE OF client_email ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.auto_invite_deal_client();

-- 4. Backfill: create invites for every existing deal with a client_email
INSERT INTO public.deal_clients (deal_id, client_email, invited_by)
SELECT d.id, lower(trim(d.client_email)), d.assigned_to
FROM public.deals d
WHERE d.client_email IS NOT NULL
  AND length(trim(d.client_email)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.deal_clients dc
    WHERE dc.deal_id = d.id AND lower(dc.client_email) = lower(d.client_email)
  );
