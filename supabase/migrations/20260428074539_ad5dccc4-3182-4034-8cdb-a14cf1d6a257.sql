
-- Auto-notify on deal stage changes and new offers

CREATE OR REPLACE FUNCTION public.notify_on_deal_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_record RECORD;
  stage_label TEXT;
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    stage_label := replace(initcap(replace(NEW.stage::text, '_', ' ')), 'Or', 'or');

    -- Notify the assigned agent
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link, deal_id)
      VALUES (
        NEW.assigned_to,
        'deal_stage_change',
        'Deal moved to ' || stage_label,
        COALESCE(NEW.client_name, 'Deal') || ' — ' || COALESCE(NEW.property_address, ''),
        '/dashboard/deals/' || NEW.id::text,
        NEW.id
      );
    END IF;

    -- Notify all linked clients
    FOR client_record IN
      SELECT client_user_id FROM public.deal_clients
      WHERE deal_id = NEW.id AND client_user_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (user_id, kind, title, body, link, deal_id)
      VALUES (
        client_record.client_user_id,
        'deal_stage_change',
        'Your transaction is now: ' || stage_label,
        COALESCE(NEW.property_address, 'Your deal') || ' has progressed.',
        '/portal/deal/' || NEW.id::text,
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_deal_stage ON public.deals;
CREATE TRIGGER trg_notify_deal_stage
AFTER UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.notify_on_deal_stage_change();


CREATE OR REPLACE FUNCTION public.notify_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d RECORD;
  client_record RECORD;
BEGIN
  SELECT assigned_to, client_name, property_address INTO d
  FROM public.deals WHERE id = NEW.deal_id;

  IF d.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, deal_id)
    VALUES (
      d.assigned_to,
      'new_offer',
      'New ' || NEW.direction || ' offer: $' || to_char(NEW.offer_price, 'FM999,999,999'),
      COALESCE(d.property_address, d.client_name),
      '/dashboard/deals/' || NEW.deal_id::text,
      NEW.deal_id
    );
  END IF;

  FOR client_record IN
    SELECT client_user_id FROM public.deal_clients
    WHERE deal_id = NEW.deal_id AND client_user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, kind, title, body, link, deal_id)
    VALUES (
      client_record.client_user_id,
      'new_offer',
      'New offer logged on your deal',
      'Offer of $' || to_char(NEW.offer_price, 'FM999,999,999') || ' — review in your portal.',
      '/portal/deal/' || NEW.deal_id::text,
      NEW.deal_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_offer ON public.deal_offers;
CREATE TRIGGER trg_notify_new_offer
AFTER INSERT ON public.deal_offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_offer();


-- Notify agent when a buyer requests a showing
CREATE OR REPLACE FUNCTION public.notify_on_showing_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d RECORD;
BEGIN
  IF NEW.requested_by_role = 'client' THEN
    SELECT assigned_to, client_name, property_address INTO d
    FROM public.deals WHERE id = NEW.deal_id;

    IF d.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link, deal_id)
      VALUES (
        d.assigned_to,
        'showing_request',
        'New showing request from ' || COALESCE(d.client_name, 'client'),
        'Requested for ' || to_char(NEW.scheduled_at, 'Mon DD, HH24:MI'),
        '/dashboard/deals/' || NEW.deal_id::text,
        NEW.deal_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_showing_request ON public.deal_showings;
CREATE TRIGGER trg_notify_showing_request
AFTER INSERT ON public.deal_showings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_showing_request();
