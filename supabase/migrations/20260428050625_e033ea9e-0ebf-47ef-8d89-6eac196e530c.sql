
-- Replace seed_deal_checklist with full Horse & Hearth seller SOP (60 tasks across 7 phases mapped to 9 stages).
-- Buyer side checklist is preserved unchanged.

CREATE OR REPLACE FUNCTION public.seed_deal_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.side = 'buyer' THEN
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible) VALUES
      (NEW.id, 'new_lead', 'Initial buyer consultation call', 1, true),
      (NEW.id, 'new_lead', 'Send buyer representation agreement', 2, true),
      (NEW.id, 'qualified', 'Confirm pre-approval / proof of funds', 1, true),
      (NEW.id, 'qualified', 'Define equine property requirements (acres, stalls, arena, etc.)', 2, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Schedule property showings', 1, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Walk pastures, fencing, water rights with buyer', 2, true),
      (NEW.id, 'offer_drafted_or_listed', 'Draft purchase offer', 1, true),
      (NEW.id, 'offer_drafted_or_listed', 'Submit offer to listing agent', 2, true),
      (NEW.id, 'offer_accepted_under_contract', 'Deliver earnest money', 1, true),
      (NEW.id, 'offer_accepted_under_contract', 'Open escrow / title', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Schedule home inspection', 1, true),
      (NEW.id, 'inspection_and_appraisal', 'Schedule well, septic, soil, water-rights inspections', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Order appraisal', 3, true),
      (NEW.id, 'inspection_and_appraisal', 'Negotiate inspection objections', 4, true),
      (NEW.id, 'financing_and_title', 'Submit final loan documents', 1, true),
      (NEW.id, 'financing_and_title', 'Review title commitment & HOA docs', 2, true),
      (NEW.id, 'financing_and_title', 'Confirm clear-to-close from lender', 3, true),
      (NEW.id, 'closing', 'Final walkthrough', 1, true),
      (NEW.id, 'closing', 'Sign closing documents', 2, true),
      (NEW.id, 'closing', 'Wire down payment & closing costs', 3, true),
      (NEW.id, 'closed_won', 'Deliver keys & welcome packet', 1, true),
      (NEW.id, 'closed_won', 'Request testimonial & referrals', 2, false);
  ELSE
    -- Horse & Hearth Listing SOP (60 tasks)
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible) VALUES
      -- PHASE 1 Pre-Listing Prep -> new_lead
      (NEW.id, 'new_lead', 'Add client to CRM (Lofty)', 1, false),
      (NEW.id, 'new_lead', 'Add listing appointment to agent calendar', 2, true),
      (NEW.id, 'new_lead', 'Send appointment confirmation email', 3, true),
      (NEW.id, 'new_lead', 'Prep pre-listing package / intake form (Google Forms)', 4, true),
      (NEW.id, 'new_lead', 'Send day-before reminder email/text', 5, true),
      (NEW.id, 'new_lead', 'Prepare CMA (REcolorado + Realist Tax + Lofty); order O&E', 6, false),
      (NEW.id, 'new_lead', 'Partially prep listing paperwork (CTM/CTME)', 7, false),
      (NEW.id, 'new_lead', 'Populate listing package (Canva)', 8, false),
      (NEW.id, 'new_lead', 'Send expectations video & walkthrough sheet', 9, true),
      (NEW.id, 'new_lead', 'Review seller questions list before appointment', 10, false),

      -- PHASE 2 Appointment & Follow-Up -> qualified
      (NEW.id, 'qualified', 'Conduct listing appointment', 1, true),
      (NEW.id, 'qualified', 'Add wrap-up notes to CRM (immediately after)', 2, false),
      (NEW.id, 'qualified', 'Send handwritten thank-you note', 3, true),
      (NEW.id, 'qualified', 'Send team intro email to client', 4, true),
      (NEW.id, 'qualified', 'Schedule follow-up pricing strategy meeting (within 48–72 hr)', 5, true),
      (NEW.id, 'qualified', 'Present marketing plan & pricing strategy', 6, true),
      (NEW.id, 'qualified', 'Finalize listing paperwork & get signatures (CTM/CTME)', 7, true),
      (NEW.id, 'qualified', 'Start file in SkySlope', 8, false),
      (NEW.id, 'qualified', 'Send timeline & schedule pre-photo property visit', 9, true),

      -- PHASE 3 Prep & Vendor Coordination -> property_tour_or_listing_prep
      (NEW.id, 'property_tour_or_listing_prep', 'Draft listing in MLS', 1, false),
      (NEW.id, 'property_tour_or_listing_prep', 'Schedule / confirm vendors as needed', 2, false),
      (NEW.id, 'property_tour_or_listing_prep', 'Schedule media day', 3, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Add photos & supplements to MLS — send draft to seller', 4, true),
      (NEW.id, 'property_tour_or_listing_prep', 'Setup ShowingTime', 5, false),
      (NEW.id, 'property_tour_or_listing_prep', 'Order flyers & brochures', 6, false),
      (NEW.id, 'property_tour_or_listing_prep', 'Enter listing into Land & Ranch Dashboard', 7, false),
      (NEW.id, 'property_tour_or_listing_prep', 'Activate listing as Coming Soon', 8, true),

      -- PHASE 4 Live & Marketing -> offer_drafted_or_listed
      (NEW.id, 'offer_drafted_or_listed', 'Make listing active in MLS', 1, true),
      (NEW.id, 'offer_drafted_or_listed', 'Schedule social media posts (IG, FB, TikTok, YouTube)', 2, false),
      (NEW.id, 'offer_drafted_or_listed', 'Attach QR code to listing landing page (QR Tiger + Lofty)', 3, false),
      (NEW.id, 'offer_drafted_or_listed', 'Schedule & host open house (if requested)', 4, true),
      (NEW.id, 'offer_drafted_or_listed', 'Promote open house online & via email blast', 5, false),
      (NEW.id, 'offer_drafted_or_listed', 'Weekly market report — every Tuesday (ongoing)', 6, true),
      (NEW.id, 'offer_drafted_or_listed', 'Collect price-drop data (if needed)', 7, false),

      -- PHASE 5a Under Contract -> offer_accepted_under_contract
      (NEW.id, 'offer_accepted_under_contract', 'Send intro email — client, broker, lender & title', 1, true),
      (NEW.id, 'offer_accepted_under_contract', 'Calendar all contract deadlines in Google Calendar', 2, true),
      (NEW.id, 'offer_accepted_under_contract', 'Change MLS status to Pending in all systems', 3, false),
      (NEW.id, 'offer_accepted_under_contract', 'Update disclosures with buyer info (CTME)', 4, false),

      -- PHASE 5b Inspection / Appraisal -> inspection_and_appraisal
      (NEW.id, 'inspection_and_appraisal', 'Schedule inspection & educate seller', 1, true),
      (NEW.id, 'inspection_and_appraisal', 'Handle inspection objections & draft resolution (CTM/CTME)', 2, true),
      (NEW.id, 'inspection_and_appraisal', 'Send vendor options to seller if needed', 3, false),
      (NEW.id, 'inspection_and_appraisal', 'Appraisal confirmation or negotiation', 4, true),

      -- PHASE 5c Title / Closing prep -> financing_and_title
      (NEW.id, 'financing_and_title', 'Schedule closing with title company', 1, true),
      (NEW.id, 'financing_and_title', 'Upload appraisal / title / HOA paperwork to SkySlope', 2, false),
      (NEW.id, 'financing_and_title', 'Order closing gift', 3, false),

      -- PHASE 6 Closing & Wrap-Up -> closing
      (NEW.id, 'closing', 'Confirm clear to close (written — lender & title)', 1, true),
      (NEW.id, 'closing', 'Notify seller of final walkthrough & coordinate time', 2, true),
      (NEW.id, 'closing', 'Send utility transfer checklist to seller', 3, true),
      (NEW.id, 'closing', 'Send utility contact sheet to buyer''s agent', 4, false),
      (NEW.id, 'closing', 'Schedule sign & lockbox pickup', 5, false),
      (NEW.id, 'closing', 'Mark property SOLD in MLS & all syndication platforms', 6, true),
      (NEW.id, 'closing', 'Close file in SkySlope (confirm compliance approval)', 7, false),

      -- PHASE 7 Post-Listing Nurture -> closed_won
      (NEW.id, 'closed_won', 'Send thank-you cards to all parties', 1, true),
      (NEW.id, 'closed_won', 'Add client to VIP Seller Smart Plan in Lofty', 2, false),
      (NEW.id, 'closed_won', 'Request Google review & video testimonial (within 2 weeks)', 3, true),
      (NEW.id, 'closed_won', 'Tag client in CRM: Closed Seller, property type, referral source', 4, false),
      (NEW.id, 'closed_won', 'Schedule annual check-in / property anniversary outreach', 5, false);
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill: add any missing SOP items to OPEN seller deals.
-- Skip already-closed/lost/withdrawn deals. Never duplicate existing labels.
WITH sop(stage, label, sort_order, client_visible) AS (
  VALUES
    ('new_lead'::deal_stage, 'Add client to CRM (Lofty)', 1, false),
    ('new_lead', 'Add listing appointment to agent calendar', 2, true),
    ('new_lead', 'Send appointment confirmation email', 3, true),
    ('new_lead', 'Prep pre-listing package / intake form (Google Forms)', 4, true),
    ('new_lead', 'Send day-before reminder email/text', 5, true),
    ('new_lead', 'Prepare CMA (REcolorado + Realist Tax + Lofty); order O&E', 6, false),
    ('new_lead', 'Partially prep listing paperwork (CTM/CTME)', 7, false),
    ('new_lead', 'Populate listing package (Canva)', 8, false),
    ('new_lead', 'Send expectations video & walkthrough sheet', 9, true),
    ('new_lead', 'Review seller questions list before appointment', 10, false),
    ('qualified', 'Conduct listing appointment', 1, true),
    ('qualified', 'Add wrap-up notes to CRM (immediately after)', 2, false),
    ('qualified', 'Send handwritten thank-you note', 3, true),
    ('qualified', 'Send team intro email to client', 4, true),
    ('qualified', 'Schedule follow-up pricing strategy meeting (within 48–72 hr)', 5, true),
    ('qualified', 'Present marketing plan & pricing strategy', 6, true),
    ('qualified', 'Finalize listing paperwork & get signatures (CTM/CTME)', 7, true),
    ('qualified', 'Start file in SkySlope', 8, false),
    ('qualified', 'Send timeline & schedule pre-photo property visit', 9, true),
    ('property_tour_or_listing_prep', 'Draft listing in MLS', 1, false),
    ('property_tour_or_listing_prep', 'Schedule / confirm vendors as needed', 2, false),
    ('property_tour_or_listing_prep', 'Schedule media day', 3, true),
    ('property_tour_or_listing_prep', 'Add photos & supplements to MLS — send draft to seller', 4, true),
    ('property_tour_or_listing_prep', 'Setup ShowingTime', 5, false),
    ('property_tour_or_listing_prep', 'Order flyers & brochures', 6, false),
    ('property_tour_or_listing_prep', 'Enter listing into Land & Ranch Dashboard', 7, false),
    ('property_tour_or_listing_prep', 'Activate listing as Coming Soon', 8, true),
    ('offer_drafted_or_listed', 'Make listing active in MLS', 1, true),
    ('offer_drafted_or_listed', 'Schedule social media posts (IG, FB, TikTok, YouTube)', 2, false),
    ('offer_drafted_or_listed', 'Attach QR code to listing landing page (QR Tiger + Lofty)', 3, false),
    ('offer_drafted_or_listed', 'Schedule & host open house (if requested)', 4, true),
    ('offer_drafted_or_listed', 'Promote open house online & via email blast', 5, false),
    ('offer_drafted_or_listed', 'Weekly market report — every Tuesday (ongoing)', 6, true),
    ('offer_drafted_or_listed', 'Collect price-drop data (if needed)', 7, false),
    ('offer_accepted_under_contract', 'Send intro email — client, broker, lender & title', 1, true),
    ('offer_accepted_under_contract', 'Calendar all contract deadlines in Google Calendar', 2, true),
    ('offer_accepted_under_contract', 'Change MLS status to Pending in all systems', 3, false),
    ('offer_accepted_under_contract', 'Update disclosures with buyer info (CTME)', 4, false),
    ('inspection_and_appraisal', 'Schedule inspection & educate seller', 1, true),
    ('inspection_and_appraisal', 'Handle inspection objections & draft resolution (CTM/CTME)', 2, true),
    ('inspection_and_appraisal', 'Send vendor options to seller if needed', 3, false),
    ('inspection_and_appraisal', 'Appraisal confirmation or negotiation', 4, true),
    ('financing_and_title', 'Schedule closing with title company', 1, true),
    ('financing_and_title', 'Upload appraisal / title / HOA paperwork to SkySlope', 2, false),
    ('financing_and_title', 'Order closing gift', 3, false),
    ('closing', 'Confirm clear to close (written — lender & title)', 1, true),
    ('closing', 'Notify seller of final walkthrough & coordinate time', 2, true),
    ('closing', 'Send utility transfer checklist to seller', 3, true),
    ('closing', 'Send utility contact sheet to buyer''s agent', 4, false),
    ('closing', 'Schedule sign & lockbox pickup', 5, false),
    ('closing', 'Mark property SOLD in MLS & all syndication platforms', 6, true),
    ('closing', 'Close file in SkySlope (confirm compliance approval)', 7, false),
    ('closed_won', 'Send thank-you cards to all parties', 1, true),
    ('closed_won', 'Add client to VIP Seller Smart Plan in Lofty', 2, false),
    ('closed_won', 'Request Google review & video testimonial (within 2 weeks)', 3, true),
    ('closed_won', 'Tag client in CRM: Closed Seller, property type, referral source', 4, false),
    ('closed_won', 'Schedule annual check-in / property anniversary outreach', 5, false)
)
INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible)
SELECT d.id, s.stage, s.label, s.sort_order, s.client_visible
FROM public.deals d
CROSS JOIN sop s
WHERE d.side = 'seller'
  AND d.stage NOT IN ('closed_won', 'lost', 'withdrawn')
  AND NOT EXISTS (
    SELECT 1 FROM public.deal_checklist_items ci
    WHERE ci.deal_id = d.id AND ci.label = s.label
  );
