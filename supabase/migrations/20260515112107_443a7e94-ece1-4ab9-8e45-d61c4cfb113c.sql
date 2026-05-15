
-- =========================================================================
-- 1. Checklist template tables
-- =========================================================================
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  name TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buyer','seller')),
  state TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system_master BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_templates_owner ON public.checklist_templates(owner_user_id);
CREATE INDEX idx_checklist_templates_master ON public.checklist_templates(is_system_master) WHERE is_system_master = true;

CREATE TABLE public.checklist_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  phase_key TEXT NOT NULL,
  phase_label TEXT NOT NULL,
  task_number INTEGER,
  title TEXT NOT NULL,
  owner_role TEXT,
  client_visible_default BOOLEAN NOT NULL DEFAULT true,
  default_assignee_role TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_template_tasks_template ON public.checklist_template_tasks(template_id, phase_key, sort_order);

CREATE TABLE public.checklist_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.checklist_template_tasks(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  default_assignee_role TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_template_steps_task ON public.checklist_template_steps(task_id, sort_order);

CREATE TABLE public.checklist_template_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.checklist_template_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.checklist_template_steps(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT resource_belongs_to_task_or_step CHECK (task_id IS NOT NULL OR step_id IS NOT NULL)
);
CREATE INDEX idx_template_resources_task ON public.checklist_template_resources(task_id);
CREATE INDEX idx_template_resources_step ON public.checklist_template_resources(step_id);

-- =========================================================================
-- 2. Deal parties
-- =========================================================================
CREATE TABLE public.deal_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT NOT NULL,
  notes TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deal_parties_deal ON public.deal_parties(deal_id);
CREATE INDEX idx_deal_parties_user ON public.deal_parties(user_id);

-- =========================================================================
-- 3. Extend deal_checklist_items
-- =========================================================================
ALTER TABLE public.deal_checklist_items
  ADD COLUMN parent_task_id UUID REFERENCES public.deal_checklist_items(id) ON DELETE CASCADE,
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'task' CHECK (kind IN ('task','step')),
  ADD COLUMN owner_role TEXT,
  ADD COLUMN assigned_party_id UUID REFERENCES public.deal_parties(id) ON DELETE SET NULL,
  ADD COLUMN assigned_user_id UUID,
  ADD COLUMN body TEXT,
  ADD COLUMN notes TEXT,
  ADD COLUMN source_template_task_id UUID,
  ADD COLUMN task_number INTEGER;
CREATE INDEX idx_checklist_items_parent ON public.deal_checklist_items(parent_task_id);

-- =========================================================================
-- 4. Per-deal resources
-- =========================================================================
CREATE TABLE public.deal_checklist_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES public.deal_checklist_items(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deal_checklist_resources_item ON public.deal_checklist_resources(checklist_item_id);

-- =========================================================================
-- 5. RLS
-- =========================================================================
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_checklist_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read system master templates"
  ON public.checklist_templates FOR SELECT TO authenticated
  USING (is_system_master = true OR owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert own templates"
  ON public.checklist_templates FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners update own templates"
  ON public.checklist_templates FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))
  WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete own templates"
  ON public.checklist_templates FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE POLICY "Tasks follow template access"
  ON public.checklist_template_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.checklist_templates t WHERE t.id = template_id AND (t.is_system_master OR t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.checklist_templates t WHERE t.id = template_id AND (t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))));

CREATE POLICY "Steps follow template access"
  ON public.checklist_template_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.checklist_template_tasks tt JOIN public.checklist_templates t ON t.id = tt.template_id WHERE tt.id = task_id AND (t.is_system_master OR t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.checklist_template_tasks tt JOIN public.checklist_templates t ON t.id = tt.template_id WHERE tt.id = task_id AND (t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))));

CREATE POLICY "Resources follow template access"
  ON public.checklist_template_resources FOR ALL TO authenticated
  USING (
    (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.checklist_template_tasks tt JOIN public.checklist_templates t ON t.id = tt.template_id WHERE tt.id = task_id AND (t.is_system_master OR t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
    OR (step_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.checklist_template_steps ts JOIN public.checklist_template_tasks tt ON tt.id = ts.task_id JOIN public.checklist_templates t ON t.id = tt.template_id WHERE ts.id = step_id AND (t.is_system_master OR t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
  )
  WITH CHECK (
    (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.checklist_template_tasks tt JOIN public.checklist_templates t ON t.id = tt.template_id WHERE tt.id = task_id AND (t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
    OR (step_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.checklist_template_steps ts JOIN public.checklist_template_tasks tt ON tt.id = ts.task_id JOIN public.checklist_templates t ON t.id = tt.template_id WHERE ts.id = step_id AND (t.owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
  );

CREATE POLICY "Agents/admins manage parties on their deals"
  ON public.deal_parties FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.assigned_to = auth.uid()));
CREATE POLICY "Clients read parties on their deals"
  ON public.deal_parties FOR SELECT TO authenticated
  USING (is_client_on_deal(deal_id, auth.uid()));
CREATE POLICY "Linked party users see their own party row"
  ON public.deal_parties FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Resources follow checklist item access"
  ON public.deal_checklist_resources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_checklist_items i JOIN public.deals d ON d.id = i.deal_id WHERE i.id = checklist_item_id AND (d.assigned_to = auth.uid() OR has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deal_checklist_items i JOIN public.deals d ON d.id = i.deal_id WHERE i.id = checklist_item_id AND (d.assigned_to = auth.uid() OR has_role(auth.uid(),'admin'))));
CREATE POLICY "Clients read resources for visible items"
  ON public.deal_checklist_resources FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_checklist_items i WHERE i.id = checklist_item_id AND i.client_visible = true AND is_client_on_deal(i.deal_id, auth.uid())));

CREATE TRIGGER trg_checklist_templates_updated
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 6. Seed system master templates
-- =========================================================================
DO $seed$
DECLARE
  v_template_id UUID;
  v_task_id UUID;
  v_buyer_template_id UUID;
  rec JSONB;
  step_text TEXT;
  res_rec JSONB;
  v_sort INT;
  v_step_sort INT;
  v_res_sort INT;
  sop JSONB := $json$
[
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":1,"title":"Add Client to CRM","owner_role":"AGENT+LC","client_visible":false,
   "steps":[
     "Log in to Lofty. Navigate to the lead section and click Add Lead.",
     "For single entries use the Add Lead button. Enable Hide Details if applicable.",
     "Mark as Personal Lead. Select the correct lead type: Buyer, Seller, Investor, Renter, Other. For Sphere contacts use Homeowner.",
     "Required fields: First & Last Name, Email Address, Phone Number. Ensure all opt-in fields are selected.",
     "Beneficial additional fields: Address, Birthday, Client Intake Form Data, Appointment Set Date.",
     "Input the lead Source; include referrer name if known.",
     "Set Pipeline stage to Attempted to Contact unless instructed otherwise.",
     "Notes section: record who added the lead and when. Do not send the welcome email from this section.",
     "Mass Import: use Import Leads, upload CSV, select Lead Type, verify mapping and documented consent."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Add Client to CRM","url":"https://www.loom.com/share/94ce5fae6d314101bf0a53712e87c576"}]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":2,"title":"Add Listing Appointment to Agent Calendar","owner_role":"LC","client_visible":true,
   "steps":[
     "Open Google Calendar and click Create or double-click the desired date.",
     "Confirm day and start time. Duration: Condos/smaller = 1 hour; Larger homes/farm & ranch = minimum 1.5 hours.",
     "Event title format: Listing Appointment — [Property Address] — [Client Last Name]",
     "Add all guests: Listing Agent + all sellers/clients.",
     "Enter full property address in the Location field for map integration.",
     "Click Save then Send to email calendar invites to all guests.",
     "Verify appointment appears correctly and that recipients received the invite."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Calendar Setup","url":"https://www.loom.com/share/94ce5fae6d314101bf0a53712e87c576"}]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":3,"title":"Send Appointment Confirmation Email","owner_role":"LC","client_visible":true,
   "steps":[
     "Subject: Your Listing Appointment is Booked — We are Excited to Meet!",
     "Thank client and confirm details. Ask them to have ready: recent updates, utility costs, HOA info, surveys, well/septic info, prior appraisals/inspections, notes about quirks, and (if applicable) boarding income, irrigation, ag zoning."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Appointment Confirmation","url":"https://www.loom.com/share/94ce5fae6d314101bf0a53712e87c576"}]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":4,"title":"Prep Pre-Listing Package (Listing Intake Form)","owner_role":"LC","client_visible":true,
   "steps":[
     "Go to Google Forms and create a new blank form. Customize fields, types, and required status.",
     "Use the provided intake form template or create a copy customized to your workflow.",
     "Publish the form and copy the responder link to use during the listing appointment.",
     "Fill out the form during the listing appointment with the client present. Pre-fill known data beforehand.",
     "Discuss critical items: HOA contact, listing brokerage compensation, showing instructions, pet info, access timing, marketing package, desired list price.",
     "Make non-critical questions optional for later completion.",
     "Use Individual responses tab (not Summary) to extract info for listing documents."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Listing Intake Form Setup","url":"https://www.loom.com/share/6962c9cd65b74195bf693e6012bc2fd7"}]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":5,"title":"Day-Before Reminder Email/Text","owner_role":"LC","client_visible":true,
   "steps":[
     "Subject: Quick Confirmation for Tomorrow Appointment",
     "Confirm date, time, and address. Remind seller to gather utility info, barn details, recent upgrades — reassure them whatever they have is fine."
   ],"resources":[]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":6,"title":"Prepare CMA & Order O&E Report","owner_role":"AGENT","client_visible":false,
   "steps":[
     "Order O&E from title.",
     "Locate property in Realist Tax: confirm square footage (finished/unfinished) and verify seller name.",
     "Enter property address in MLS. Filters: Active, Coming Soon, Pending, Closed. Date range: 90 days.",
     "Define square footage range: ±250 sqft from finished area.",
     "Apply style/layout filters: Ranch = One Story. Use Google Street View to confirm home style.",
     "Select comps: aim for 3 closed sales, 3 active listings, 1 pending sale.",
     "Analyze comps: cosmetic upgrades, structural differences, garage type, kitchen/bath condition.",
     "Create CMA in MLS and export to share with seller."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: CMA Preparation","url":"https://www.loom.com/share/523975b18f0b429bb87372f6e1c93cd2"}]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":7,"title":"Partially Prep Listing Paperwork (CTM/CTME)","owner_role":"LC","client_visible":false,
   "steps":["Pre-populate listing paperwork in CTM/CTME with known seller and property info ahead of the appointment."],"resources":[]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":8,"title":"Populate Listing Package (Canva)","owner_role":"LC","client_visible":false,
   "steps":["Open the listing package template in Canva. Update with property photos, agent bio, marketing plan, comps, and pricing strategy."],"resources":[]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":9,"title":"Send Expectations Video & Walkthrough Sheet","owner_role":"LC","client_visible":true,
   "steps":["Email seller the expectations video plus the walkthrough sheet so they can prep the property before the visit."],"resources":[]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Pre-Listing Prep","task_number":10,"title":"Review Seller Questions List","owner_role":"AGENT","client_visible":false,
   "steps":["Review the standard seller questions list before the listing appointment to ensure all key topics are covered."],"resources":[]},

  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":11,"title":"Conduct Listing Appointment","owner_role":"AGENT","client_visible":true,
   "steps":["Listing agent leads the appointment. LC attends to take notes and introduces themselves as the seller primary contact for ongoing communication."],"resources":[]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":12,"title":"Add Wrap-Up Notes to CRM (In Car)","owner_role":"AGENT+LC","client_visible":false,
   "steps":[
     "In car immediately after appointment: take handwritten notes on property details, seller comments, and showing preferences.",
     "Open Google Docs. Create new document: [Property Address] — Listing Notes.",
     "Enter all observations: square footage, updates, defects, yard condition, carpet, roof date, etc.",
     "Move document into appropriate Google Drive folder (team/brokerage access).",
     "Open Lofty CRM. Search the contact profile. Paste listing notes into the notes section. Save."
   ],
   "resources":[{"kind":"video","label":"Watch Zoom: CRM Wrap-Up Notes","url":"https://us06web.zoom.us/clips/share/Oin4NN-eSmG_naHo038wIA"}]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":13,"title":"Send Handwritten Thank-You Note","owner_role":"LC","client_visible":true,
   "steps":["Send same day or next morning. Thank the client and reaffirm commitment to a seamless closing."],"resources":[]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":14,"title":"Send Agent Intro Email to Client","owner_role":"LC","client_visible":true,
   "steps":[
     "Locate the Team Introduction Email Template in Google Drive.",
     "Copy entire body including subject line. Paste into new email draft. Cut subject into Subject field.",
     "Update all placeholders: Client First Name, agent name, TC name, etc. Remove duplicate signature.",
     "Recipients — To: Seller(s). CC: Listing Agent, TC, LC, and any other team members.",
     "Save as template named Team Introduction Email for future use.",
     "Send and confirm delivery."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Team Intro Email","url":"https://www.loom.com/share/402771299a8745faa7aa378821b0ccad"}]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":15,"title":"Schedule Follow-Up Pricing Strategy Meeting","owner_role":"AGENT","client_visible":true,
   "steps":["Schedule within 48–72 hours of listing appointment. Add to agent and seller calendars."],"resources":[]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":16,"title":"Present Marketing Plan & Pricing Strategy","owner_role":"AGENT+LC","client_visible":true,
   "steps":[
     "Access pricing strategy document in Canva. Validate CMA with listing agent before presenting.",
     "Comp data: screenshot comparables. Document sold price, concessions, sqft, beds/baths/garage, cosmetic condition.",
     "Document active listings: list price, sqft, beds/baths/garage, list date, condition notes.",
     "Recommend price based on CMA; justify with specific features. Note appraiser uses sold comps.",
     "Integrate Google Form intake data: updates, inspection considerations, living experience notes.",
     "Run mortgage calculator at suggested price: property tax (latest year ÷ 12), 7% interest rate, 3% down. Screenshot and insert."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Pricing Strategy Meeting","url":"https://www.loom.com/share/4e82604385f342a691dbe6bc509285b9"}]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":17,"title":"Finalize Listing Paperwork & Signatures","owner_role":"AGENT","client_visible":true,
   "steps":[
     "Navigate to Transactions, Client Profile, Create Transaction.",
     "Enter: Transaction Type, Sale Price, Commission Rate, Expected Close Date, Appointment Date, Expected List Date, Photography Date, staging/prep dates.",
     "Assign: Escrow/Title Company, Transaction Coordinator, Service Providers.",
     "Save and tag transaction as Pre-Listing. Verify data has saved correctly.",
     "Review contract draft: names, address, listing/close dates, compensation, marketing commitments, earnest money, inclusions/exclusions.",
     "Add Additional Provisions. Confirm closing instructions and seller property disclosure (including water info).",
     "Send finalized documents to listing agent or directly to clients. Agent does final review before activation."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Listing Paperwork & Signatures","url":"https://www.loom.com/share/d9a3c1c8346a45ba8b6e9b05f1244eef"}]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":18,"title":"Start File in SkySlope","owner_role":"LC","client_visible":false,
   "steps":[
     "Log in to SkySlope. Select Create Listing. Choose Colorado Office.",
     "Enter property address. Select Residential Listing and Seller.",
     "Enter preliminary data: listing price, listing expiration date, listing date.",
     "Add year built (from Realist Tax via Matrix). Add seller names, email, and phone.",
     "Enter commission. Confirm agent details.",
     "After documents are signed: download all as PDF and upload to SkySlope into respective fields.",
     "Check required documents (Lead-Based Paint form for homes built before 1978).",
     "Add Contacts tab: escrow officer and closer. Save to transaction."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: SkySlope File Setup","url":"https://www.loom.com/share/5b33b5a2ac114c52a3af1cdee382fc35"}]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Appointment & Follow-Up","task_number":19,"title":"Send Timeline & Schedule Pre-Photo Property Visit","owner_role":"LC","client_visible":true,
   "steps":["Send seller an email outlining the listing timeline and schedule the pre-photo property visit."],"resources":[]},

  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":20,"title":"Draft Listing in MLS","owner_role":"LC","client_visible":false,
   "steps":["Draft the listing in MLS with all property details, equine features, supplements, and compelling description. Save as draft for agent review."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":21,"title":"Vendor Scheduling Timeline","owner_role":"LC","client_visible":false,
   "steps":[
     "Day 1: Schedule cleaners. Cleaners must be confirmed before any visual media is booked.",
     "Day 1: Schedule stager. Ask if stager needs in-person or photos to consult.",
     "Day 1: Schedule photographer & videographer in a single block with Matterport if possible, post-clean/stage.",
     "Day 1: Schedule Matterport scan.",
     "Day 2: Order sign install via Rocketlister. Confirm HOA rules or property access if applicable.",
     "Day 2: Finalize custom sign design.",
     "Day 2: Order flyers and brochures."
   ],
   "resources":[{"kind":"sheet","label":"Vendor List & Instructions (Google Sheet)","url":"https://docs.google.com/spreadsheets/d/14ScgVvfMyLAsSVpKzk8ib511n08cRgkL/edit"}]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":22,"title":"Schedule Media Day","owner_role":"LC","client_visible":true,
   "steps":["Confirm media day with seller, photographer, videographer, and stager. Send a reminder the day before."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":23,"title":"Add Photos & Supplements to MLS — Send Draft to Seller","owner_role":"LC","client_visible":true,
   "steps":["Upload final photos and all supplements (HOA docs, surveys, disclosures, well/septic info) to MLS. Send draft listing to seller for approval before going live."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":24,"title":"Setup ShowingTime","owner_role":"LC","client_visible":false,
   "steps":["Configure ShowingTime with seller availability, instructions, lockbox info, and feedback questions."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":25,"title":"Order Flyers & Brochures","owner_role":"LC","client_visible":false,
   "steps":["Order printed flyers and brochures. Confirm delivery in time for go-live or open house."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":26,"title":"Enter Listing into Land & Ranch Dashboard","owner_role":"LC","client_visible":false,
   "steps":["Add the listing to the eXp Land & Ranch dashboard for cross-team visibility."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Prep & Vendor Coordination","task_number":27,"title":"Activate Listing as Coming Soon","owner_role":"LC","client_visible":true,
   "steps":["Mark listing Coming Soon in MLS to begin pre-market interest tracking."],"resources":[]},

  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":28,"title":"Make Listing Active in MLS","owner_role":"LC","client_visible":true,
   "steps":["Update MLS status from Coming Soon to Active on go-live date. Confirm syndication to Zillow, Realtor.com, Homes.com, etc."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":29,"title":"Schedule Social Media Posts","owner_role":"LC","client_visible":false,
   "steps":["Schedule launch posts across Instagram, Facebook, TikTok, and YouTube. Use the Horse & Hearth listing template."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":30,"title":"Attach QR Code to Listing Landing Page","owner_role":"LC","client_visible":false,
   "steps":[
     "In Lofty: Listings, On Market, select listing, Promotional Page, copy URL.",
     "Paste new URL into QR Tiger. Save. Download updated QR code as .png.",
     "Apply to For Sale sign design in Canva. For sold/inactive listings: redirect QR to homepage.",
     "Note: QR codes are dynamic and reusable. Avoid reprinting signs for each listing."
   ],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":31,"title":"Schedule & Host Open House","owner_role":"AGENT","client_visible":true,
   "steps":["Schedule in ShowingTime and promote across all channels. Coordinate with LC for signage and lead capture setup."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":32,"title":"Promote Open House Online & Via Email","owner_role":"LC","client_visible":false,
   "steps":["Promote via Instagram, Facebook, email blast to Horse & Hearth buyer list, and REcolorado open house input."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":33,"title":"Weekly Market Report (Tuesdays)","owner_role":"LC","client_visible":true,
   "steps":[
     "Use Listing Agent Playbook GPT for structured report compilation.",
     "ShowingTime: download Listing Activity Report as PDF. Note showings count and feedback themes.",
     "Collect Homes.com listing stats (screenshot from My Listings dashboard).",
     "Gather IG/FB insights: reach, engagement. YouTube: views and engagement.",
     "REcolorado InfoSparks (zip code): export Shows to Pending, Shows per Listing, Days on Market PDFs.",
     "Matrix: My Listings, Hit Counter (total hits, portal visits) and Reverse Prospecting (saves, interest icons).",
     "Compile all data in GPT. Request formatted Market Review outline. Save to Google Drive: [Date] Market Review.",
     "Notify agent when update is ready."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Weekly Market Review SOP","url":"https://www.loom.com/share/04c2d98bca9e46159210b91ceb9ee12f"}]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Live & Marketing","task_number":34,"title":"Collect Price Drop Data (if needed)","owner_role":"LC","client_visible":false,
   "steps":[
     "Conduct weekly review using engagement data and AI-generated insights.",
     "Analyze: total impressions, detailed page engagement, buyer feedback. Identify funnel weak points.",
     "Extract strategic takeaways and note specific pricing recommendation with supporting data.",
     "Utilize GPT 21-day relaunch strategy post-price drop.",
     "Create document: [40-Day Market Update — Price Reduction]. Share with agent for review."
   ],
   "resources":[
     {"kind":"loom","label":"Watch Loom: Price Reduction Strategy","url":"https://www.loom.com/share/03c859ef1c63428bad618e5f50419fa9"},
     {"kind":"loom","label":"Watch Loom: Price Drop Client Meeting","url":"https://www.loom.com/share/414324d7f3da4805b871e08fd3b1d9a2"}
   ]},

  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5a — Under Contract","task_number":35,"title":"Send Intro Email — Client, Broker, Lender & Title","owner_role":"LC","client_visible":true,
   "steps":["Send immediately upon contract execution. CC all parties: listing agent, TC, LC, lender, and title officer."],
   "resources":[{"kind":"google_doc","label":"Under Contract Intro Email Template","url":"https://docs.google.com/document/d/1jKSQoVlPp71PM24rYfUfDsYRSIk9aw65YOBcWFvz5xU/edit"}]},
  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5a — Under Contract","task_number":36,"title":"Calendar All Contract Deadlines","owner_role":"LC","client_visible":true,
   "steps":[
     "Add all contract deadlines to the shared team calendar: inspection, inspection objection, loan commitment, appraisal, closing date.",
     "Schedule reminder emails for each stage using the Under Contract email template series.",
     "Use CRM fields to auto-populate custom data (deadlines, contacts, escrow company info)."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Contract Deadline Calendaring","url":"https://www.loom.com/share/be55b0a048ce4061ad4df2071a9ce611"}]},
  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5a — Under Contract","task_number":37,"title":"Change MLS Status to Pending in All Systems","owner_role":"LC","client_visible":false,
   "steps":["Update listing status to Under Contract (Pending) in REcolorado. Verify status updates propagate to all syndicated platforms."],"resources":[]},
  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5a — Under Contract","task_number":38,"title":"Update Disclosures with Buyer Info (CTME)","owner_role":"LC","client_visible":false,
   "steps":[
     "Log in to CTME. Locate the property. Click View Offer to review offer and copy buyer names.",
     "Navigate to Disclosures section. Manually enter buyer name(s).",
     "Open contract and confirm buyer names appear correctly under signature lines.",
     "Check Allow Buyer Agent to View Disclosures for all applicable documents. Click Save."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: CTME Disclosures Update","url":"https://www.loom.com/share/024b359436e844bbb48557da85e32318"}]},

  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 5b — Inspection / Appraisal","task_number":39,"title":"Schedule Inspection & Educate Seller","owner_role":"LC+AGENT","client_visible":true,
   "steps":[
     "Seller should not be present during inspection — this is the buyer chance to measure and evaluate freely.",
     "Home should be show-ready: lights on, pets secured, clutter removed.",
     "If inspection occurs in summer, warn seller about radon test requirements and timeline implications."
   ],"resources":[]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 5b — Inspection / Appraisal","task_number":40,"title":"Handle Inspection Objections & Draft Resolution","owner_role":"AGENT","client_visible":true,
   "steps":[
     "Review inspection report: high vs. medium priority items. Use chat tool to generate resolution language.",
     "Navigate to CTM/CTME, Create Now, Inspection Resolution. Paste content. Remove emojis.",
     "Only include items that will be completed. Credits/concessions go in an amendment, not the resolution.",
     "Amendments must clearly reflect total concession amounts. Confirm validity with lender.",
     "Provide agents with editable resolution draft for review. Agent finalizes and submits for signing."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Inspection Objections & Resolutions","url":"https://www.loom.com/share/262f2f4fdd6b4d51928f59a55a4c543b"}]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 5b — Inspection / Appraisal","task_number":42,"title":"Send Vendor Options to Seller if Needed","owner_role":"LC","client_visible":false,
   "steps":[
     "Reach out to contractors with: relevant inspection report sections, task checklist, supporting photos.",
     "Upload received quotes to listing folder. Format: PropertyName_ContractorType_Quote#",
     "Send quotes to seller with context explaining each repair item.",
     "Use preferred contractors from the Horse & Hearth vendor list where possible."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Vendor Quotes to Seller","url":"https://www.loom.com/share/5fe9da6d48404dc7a8100ca29f756c50"}]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 5b — Inspection / Appraisal","task_number":43,"title":"Appraisal Confirmation or Negotiation","owner_role":"AGENT","client_visible":true,
   "steps":["Educate the seller on the appraisal process: what the appraiser measures, how comps are selected, typical timelines, and what to do if the appraisal comes in low."],"resources":[]},

  {"phase_key":"financing_and_title","phase_label":"Phase 5c — Title / Closing Prep","task_number":41,"title":"Schedule Closing with Title Company","owner_role":"LC","client_visible":true,
   "steps":["Coordinate signing date/time with title, lender, buyer agent, and seller. Confirm in writing."],"resources":[]},
  {"phase_key":"financing_and_title","phase_label":"Phase 5c — Title / Closing Prep","task_number":44,"title":"Upload Appraisal / Title / HOA Paperwork to SkySlope","owner_role":"LC","client_visible":false,
   "steps":[
     "Under Contract: Earnest money instructions, inspection process, lending initiation, property insurance, escrow info.",
     "After Inspection: Title commitment introduction, appraisal expectations, continued loan updates.",
     "HOA Documents: Request title company to pull complete HOA docs. Provide navigation guidance to clients.",
     "Post-Appraisal: Loan approval, closing preparation, moving guidance.",
     "Upload all documents to SkySlope and notify TC when complete."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Under Contract Email Workflow","url":"https://www.loom.com/share/76d848e98bcc45948480a0ff8cdb6592"}]},
  {"phase_key":"financing_and_title","phase_label":"Phase 5c — Title / Closing Prep","task_number":45,"title":"Order Closing Gift","owner_role":"LC","client_visible":false,
   "steps":["Order the seller closing gift in time for delivery at or before closing day."],"resources":[]},

  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":46,"title":"Confirm Clear to Close (Written, Lender & Title)","owner_role":"LC","client_visible":true,
   "steps":["Receive written confirmation from lender and title company. Notify all parties. Move to Closing & Wrap-Up in Trello."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":47,"title":"Notify Seller of Final Walkthrough & Coordinate Time","owner_role":"LC","client_visible":true,
   "steps":[
     "Choose a title company close to the property location. Request mobile notary if needed.",
     "Never communicate key handover until: seller has signed AND transaction has funded.",
     "Confirm with title company: signing appointments, funding status, disbursement readiness.",
     "Communicate to seller: closing timeline, signing order, possession timing, and transfer process.",
     "Possession timelines vary (immediate, 1 week, 30 days) — confirm in writing."
   ],
   "resources":[{"kind":"loom","label":"Watch Loom: Closing Procedures","url":"https://www.loom.com/share/b41b98b2c8a2461aa89fa841190c4ff4"}]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":48,"title":"Send Utility Transfer Checklist to Seller","owner_role":"LC","client_visible":true,
   "steps":["Send seller the Utility Transfer Checklist to ensure utilities are transferred out of their name by closing. Include: electric, gas, water, trash, HOA, internet, propane, well/septic services if applicable."],
   "resources":[{"kind":"google_doc","label":"Utility Transfer Checklist","url":"https://docs.google.com/document/d/1INM7Oeqz8SJZt-vsZsTbXcNYr--JReRNbUyoe7pbsA0/edit"}]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":49,"title":"Send Utility Contact Sheet to Buyer Agent","owner_role":"LC","client_visible":false,
   "steps":["Email the buyer agent a complete utility contact sheet for the property so the buyer can transfer service in their name."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":50,"title":"Schedule Sign & Lockbox Pickup","owner_role":"LC","client_visible":false,
   "steps":["Schedule sign and lockbox pickup with Rocketlister or in-house. Confirm timing with seller."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":51,"title":"Mark Property SOLD in MLS & All Syndication Platforms","owner_role":"LC","client_visible":true,
   "steps":["After funding, change MLS status to Sold. Verify status update flows to all syndicated platforms."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 6 — Closing & Wrap-Up","task_number":52,"title":"Close File in SkySlope (Confirm Compliance Approval)","owner_role":"LC","client_visible":false,
   "steps":["Upload all final documents. Submit file for compliance review. Confirm written approval before marking closed."],"resources":[]},

  {"phase_key":"closed_won","phase_label":"Phase 7 — Post-Listing Nurture","task_number":53,"title":"Send Thank-You Cards to All Parties","owner_role":"AGENT","client_visible":true,
   "steps":["Mail handwritten thank-you cards to seller, buyer agent, lender, title officer, and any vendors who went above and beyond."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 7 — Post-Listing Nurture","task_number":54,"title":"Add Client to VIP Seller Smart Plan in Lofty","owner_role":"LC","client_visible":false,
   "steps":["In Lofty, assign the client to the VIP Seller Smart Plan for ongoing nurture touches (anniversary, market updates, referrals)."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 7 — Post-Listing Nurture","task_number":55,"title":"Request Google Review & Video Testimonial (within 2 weeks)","owner_role":"AGENT","client_visible":true,
   "steps":["Send personalized request for a Google review and a short video testimonial within two weeks of closing."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 7 — Post-Listing Nurture","task_number":56,"title":"Tag Client in CRM (Closed Seller, Property Type, Referral Source)","owner_role":"LC","client_visible":false,
   "steps":["Apply CRM tags so the client surfaces correctly in future segmentation: Closed Seller, property type (residential / land / equine), and referral source."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 7 — Post-Listing Nurture","task_number":57,"title":"Schedule Annual Check-In / Property Anniversary Outreach","owner_role":"AGENT","client_visible":false,
   "steps":["Schedule annual property anniversary outreach (CMA update, market check-in, gift if appropriate)."],"resources":[]}
]
$json$::jsonb;

  buyer_sop JSONB := $json$
[
  {"phase_key":"new_lead","phase_label":"Phase 1 — Intake","task_number":1,"title":"Initial buyer consultation call","owner_role":"AGENT","client_visible":true,
   "steps":["Schedule and conduct discovery call covering goals, timeline, financing, and equine property requirements."],"resources":[]},
  {"phase_key":"new_lead","phase_label":"Phase 1 — Intake","task_number":2,"title":"Send buyer representation agreement","owner_role":"AGENT","client_visible":true,
   "steps":["Send buyer rep agreement for e-signature. Explain commission structure and exclusivity."],"resources":[]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Qualification","task_number":3,"title":"Confirm pre-approval / proof of funds","owner_role":"AGENT","client_visible":true,
   "steps":["Collect lender pre-approval letter or proof of funds. Verify financing type and max purchase price."],"resources":[]},
  {"phase_key":"qualified","phase_label":"Phase 2 — Qualification","task_number":4,"title":"Define equine property requirements","owner_role":"AGENT","client_visible":true,
   "steps":["Document needs: acreage, stalls, arena, water rights, fencing, pasture, hay storage, tack room, trailer access."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Property Search","task_number":5,"title":"Schedule property showings","owner_role":"AGENT","client_visible":true,
   "steps":["Coordinate showings with listing agents. Send buyer the schedule and walkthrough checklist."],"resources":[]},
  {"phase_key":"property_tour_or_listing_prep","phase_label":"Phase 3 — Property Search","task_number":6,"title":"Walk pastures, fencing, water rights with buyer","owner_role":"AGENT","client_visible":true,
   "steps":["On-site: walk perimeter fencing, inspect pasture quality, confirm water rights / well capacity, check arena footing."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Offer","task_number":7,"title":"Draft purchase offer","owner_role":"AGENT","client_visible":true,
   "steps":["Draft offer in CTM/CTME with price, contingencies, deadlines, earnest money, inclusions/exclusions."],"resources":[]},
  {"phase_key":"offer_drafted_or_listed","phase_label":"Phase 4 — Offer","task_number":8,"title":"Submit offer to listing agent","owner_role":"AGENT","client_visible":true,
   "steps":["Send offer with cover letter and pre-approval. Confirm receipt and request expected response time."],"resources":[]},
  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5 — Under Contract","task_number":9,"title":"Deliver earnest money","owner_role":"AGENT","client_visible":true,
   "steps":["Coordinate earnest money delivery to title within contract timeline. Confirm receipt in writing."],"resources":[]},
  {"phase_key":"offer_accepted_under_contract","phase_label":"Phase 5 — Under Contract","task_number":10,"title":"Open escrow / title","owner_role":"AGENT","client_visible":true,
   "steps":["Open escrow with title company. Confirm contacts for buyer, seller, lender, and both agents."],"resources":[]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 6 — Inspection & Appraisal","task_number":11,"title":"Schedule home inspection","owner_role":"AGENT","client_visible":true,
   "steps":["Schedule licensed home inspector. Send buyer prep info and inspection access details."],"resources":[]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 6 — Inspection & Appraisal","task_number":12,"title":"Schedule well, septic, soil, water-rights inspections","owner_role":"AGENT","client_visible":true,
   "steps":["Coordinate specialist inspections required for equine/rural property: well flow & potability, septic, soil, water rights review."],"resources":[]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 6 — Inspection & Appraisal","task_number":13,"title":"Order appraisal","owner_role":"AGENT","client_visible":true,
   "steps":["Confirm with lender that appraisal is ordered. Provide property access and supporting comps if needed."],"resources":[]},
  {"phase_key":"inspection_and_appraisal","phase_label":"Phase 6 — Inspection & Appraisal","task_number":14,"title":"Negotiate inspection objections","owner_role":"AGENT","client_visible":true,
   "steps":["Review inspection findings with buyer. Draft and submit objection / resolution per CTM/CTME."],"resources":[]},
  {"phase_key":"financing_and_title","phase_label":"Phase 7 — Financing & Title","task_number":15,"title":"Submit final loan documents","owner_role":"AGENT","client_visible":true,
   "steps":["Confirm buyer has submitted all final loan docs to lender. Track conditions to clear-to-close."],"resources":[]},
  {"phase_key":"financing_and_title","phase_label":"Phase 7 — Financing & Title","task_number":16,"title":"Review title commitment & HOA docs","owner_role":"AGENT","client_visible":true,
   "steps":["Review title commitment, exceptions, and HOA docs with buyer. Submit objections within deadline if needed."],"resources":[]},
  {"phase_key":"financing_and_title","phase_label":"Phase 7 — Financing & Title","task_number":17,"title":"Confirm clear-to-close from lender","owner_role":"AGENT","client_visible":true,
   "steps":["Get written clear-to-close from lender. Confirm closing disclosure delivered at least 3 business days before signing."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 8 — Closing","task_number":18,"title":"Final walkthrough","owner_role":"AGENT","client_visible":true,
   "steps":["Walk the property with buyer 24–48 hours before closing. Verify condition, repairs, included items."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 8 — Closing","task_number":19,"title":"Sign closing documents","owner_role":"AGENT","client_visible":true,
   "steps":["Attend signing with buyer. Confirm wire instructions and identification beforehand."],"resources":[]},
  {"phase_key":"closing","phase_label":"Phase 8 — Closing","task_number":20,"title":"Wire down payment & closing costs","owner_role":"AGENT","client_visible":true,
   "steps":["Confirm buyer wired funds per title verified instructions. Watch for wire fraud red flags."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 9 — Post-Close","task_number":21,"title":"Deliver keys & welcome packet","owner_role":"AGENT","client_visible":true,
   "steps":["Hand off keys, garage codes, gate fobs, well/septic records, vendor contacts, and welcome packet."],"resources":[]},
  {"phase_key":"closed_won","phase_label":"Phase 9 — Post-Close","task_number":22,"title":"Request testimonial & referrals","owner_role":"AGENT","client_visible":false,
   "steps":["Send personalized request for review, testimonial, and referrals 1–2 weeks after move-in."],"resources":[]}
]
$json$::jsonb;
BEGIN
  INSERT INTO public.checklist_templates (owner_user_id, name, side, state, is_default, is_system_master, description)
  VALUES (NULL, 'Horse & Hearth Listing SOP (Colorado)', 'seller', 'CO', true, true, 'Master listing SOP for The Horse & Hearth Group. New agents start with a personal copy they can edit.')
  RETURNING id INTO v_template_id;

  v_sort := 0;
  FOR rec IN SELECT * FROM jsonb_array_elements(sop) LOOP
    v_sort := v_sort + 1;
    INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
    VALUES (v_template_id, rec->>'phase_key', rec->>'phase_label', (rec->>'task_number')::int, rec->>'title', rec->>'owner_role', COALESCE((rec->>'client_visible')::bool, true), v_sort)
    RETURNING id INTO v_task_id;

    v_step_sort := 0;
    FOR step_text IN SELECT jsonb_array_elements_text(rec->'steps') LOOP
      v_step_sort := v_step_sort + 1;
      INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES (v_task_id, step_text, v_step_sort);
    END LOOP;

    v_res_sort := 0;
    FOR res_rec IN SELECT * FROM jsonb_array_elements(rec->'resources') LOOP
      v_res_sort := v_res_sort + 1;
      INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order)
      VALUES (v_task_id, res_rec->>'kind', res_rec->>'label', res_rec->>'url', v_res_sort);
    END LOOP;
  END LOOP;

  INSERT INTO public.checklist_templates (owner_user_id, name, side, state, is_default, is_system_master, description)
  VALUES (NULL, 'Horse & Hearth Buyer SOP (Colorado)', 'buyer', 'CO', true, true, 'Master buyer-side SOP.')
  RETURNING id INTO v_buyer_template_id;

  v_sort := 0;
  FOR rec IN SELECT * FROM jsonb_array_elements(buyer_sop) LOOP
    v_sort := v_sort + 1;
    INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
    VALUES (v_buyer_template_id, rec->>'phase_key', rec->>'phase_label', (rec->>'task_number')::int, rec->>'title', rec->>'owner_role', COALESCE((rec->>'client_visible')::bool, true), v_sort)
    RETURNING id INTO v_task_id;

    v_step_sort := 0;
    FOR step_text IN SELECT jsonb_array_elements_text(rec->'steps') LOOP
      v_step_sort := v_step_sort + 1;
      INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES (v_task_id, step_text, v_step_sort);
    END LOOP;
  END LOOP;
END;
$seed$;

-- =========================================================================
-- 7. Replace seed_deal_checklist trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.seed_deal_checklist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE
  v_template_id UUID;
  v_task RECORD;
  v_new_task_id UUID;
  v_step RECORD;
  v_res RECORD;
BEGIN
  SELECT id INTO v_template_id FROM public.checklist_templates
  WHERE owner_user_id = NEW.assigned_to AND side = NEW.side::text AND is_default = true LIMIT 1;

  IF v_template_id IS NULL THEN
    SELECT id INTO v_template_id FROM public.checklist_templates
    WHERE is_system_master = true AND side = NEW.side::text ORDER BY created_at LIMIT 1;
  END IF;

  IF v_template_id IS NULL THEN RETURN NEW; END IF;

  FOR v_task IN SELECT * FROM public.checklist_template_tasks WHERE template_id = v_template_id ORDER BY sort_order LOOP
    INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, owner_role, task_number, source_template_task_id)
    VALUES (NEW.id, v_task.phase_key::deal_stage, v_task.title, v_task.sort_order, v_task.client_visible_default, 'task', v_task.owner_role, v_task.task_number, v_task.id)
    RETURNING id INTO v_new_task_id;

    FOR v_step IN SELECT * FROM public.checklist_template_steps WHERE task_id = v_task.id ORDER BY sort_order LOOP
      INSERT INTO public.deal_checklist_items (deal_id, stage, label, sort_order, client_visible, kind, parent_task_id, body)
      VALUES (NEW.id, v_task.phase_key::deal_stage, v_step.body, v_step.sort_order, v_task.client_visible_default, 'step', v_new_task_id, v_step.body);
    END LOOP;

    FOR v_res IN SELECT * FROM public.checklist_template_resources WHERE task_id = v_task.id AND step_id IS NULL ORDER BY sort_order LOOP
      INSERT INTO public.deal_checklist_resources (checklist_item_id, kind, label, url, sort_order)
      VALUES (v_new_task_id, v_res.kind, v_res.label, v_res.url, v_res.sort_order);
    END LOOP;
  END LOOP;
  RETURN NEW;
END;
$func$;

-- =========================================================================
-- 8. Auto-clone master templates for new agents
-- =========================================================================
CREATE OR REPLACE FUNCTION public.clone_master_templates_for_new_agent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE
  m RECORD; new_template_id UUID; t RECORD; new_task_id UUID; s RECORD; r RECORD;
BEGIN
  IF NEW.role <> 'agent'::app_role THEN RETURN NEW; END IF;

  FOR m IN SELECT * FROM public.checklist_templates WHERE is_system_master = true LOOP
    IF EXISTS (SELECT 1 FROM public.checklist_templates WHERE owner_user_id = NEW.user_id AND side = m.side) THEN CONTINUE; END IF;

    INSERT INTO public.checklist_templates (owner_user_id, name, side, state, is_default, is_system_master, description)
    VALUES (NEW.user_id, m.name || ' (My Copy)', m.side, m.state, true, false, 'Personal copy of the system master template. Edit freely to match your workflow.')
    RETURNING id INTO new_template_id;

    FOR t IN SELECT * FROM public.checklist_template_tasks WHERE template_id = m.id ORDER BY sort_order LOOP
      INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, notes, sort_order)
      VALUES (new_template_id, t.phase_key, t.phase_label, t.task_number, t.title, t.owner_role, t.client_visible_default, t.default_assignee_role, t.notes, t.sort_order)
      RETURNING id INTO new_task_id;

      FOR s IN SELECT * FROM public.checklist_template_steps WHERE task_id = t.id ORDER BY sort_order LOOP
        INSERT INTO public.checklist_template_steps (task_id, body, default_assignee_role, sort_order)
        VALUES (new_task_id, s.body, s.default_assignee_role, s.sort_order);
      END LOOP;

      FOR r IN SELECT * FROM public.checklist_template_resources WHERE task_id = t.id AND step_id IS NULL ORDER BY sort_order LOOP
        INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order)
        VALUES (new_task_id, r.kind, r.label, r.url, r.sort_order);
      END LOOP;
    END LOOP;
  END LOOP;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_clone_master_templates_for_agent
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.clone_master_templates_for_new_agent();
