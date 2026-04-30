ALTER TABLE public.buyer_leads ADD COLUMN IF NOT EXISTS min_stalls numeric;
ALTER TABLE public.buyer_leads DROP COLUMN IF EXISTS min_price;