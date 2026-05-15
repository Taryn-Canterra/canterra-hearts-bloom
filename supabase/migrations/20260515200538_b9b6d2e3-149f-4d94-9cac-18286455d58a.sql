-- Make email and phone nullable on buyer_leads so leads can be captured without them
ALTER TABLE public.buyer_leads ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.buyer_leads ALTER COLUMN phone DROP NOT NULL;