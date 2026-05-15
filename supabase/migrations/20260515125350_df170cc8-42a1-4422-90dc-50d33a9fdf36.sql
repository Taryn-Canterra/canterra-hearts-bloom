-- Replace buyer-side system master template with the full Horse & Hearth Buyer SOP
DO $$
DECLARE
  v_master_id UUID;
  v_old_ids UUID[];
  v_task UUID;
BEGIN
  -- Wipe existing buyer master(s) and any agent copies that haven't been edited (safe baseline)
  FOR v_master_id IN SELECT id FROM public.checklist_templates WHERE is_system_master = true AND side = 'buyer' LOOP
    DELETE FROM public.checklist_template_resources WHERE task_id IN (SELECT id FROM public.checklist_template_tasks WHERE template_id = v_master_id);
    DELETE FROM public.checklist_template_steps WHERE task_id IN (SELECT id FROM public.checklist_template_tasks WHERE template_id = v_master_id);
    DELETE FROM public.checklist_template_tasks WHERE template_id = v_master_id;
    DELETE FROM public.checklist_templates WHERE id = v_master_id;
  END LOOP;

  -- Insert new master
  INSERT INTO public.checklist_templates (owner_user_id, name, side, state, is_default, is_system_master, description)
  VALUES (NULL, 'Horse & Hearth Buyer SOP', 'buyer', 'CO', false, true, 'Master buyer transaction SOP — Horse & Hearth Group / eXp Realty Colorado')
  RETURNING id INTO v_master_id;

  -- Helper macro via inline inserts. PHASE 1 - new_lead
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'new_lead', 'Lead Intake & Setup', 1, 'Client Information', 'AGENT', false, 10) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Buyer 1: Full name, phone number, email address, home address, profession.', 1),
    (v_task, 'Buyer 2 (if applicable): Same fields as above.', 2),
    (v_task, 'Enter all data into Lofty before triggering any smart plans or outreach.', 3);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'new_lead', 'Lead Intake & Setup', 2, 'Enter Lead in CRM', 'TC', false, 20) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Log into Lofty. Navigate to People > Add New Lead.', 1),
    (v_task, 'Click Hide Details to simplify the entry screen.', 2),
    (v_task, 'Under Lead Type, select Buyer.', 3),
    (v_task, 'Fill in: Full Name, Email Address, Phone Number. If no phone number exists, use a placeholder temporarily.', 4),
    (v_task, 'Confirm opt-in preferences — mark Yes for all contact permissions.', 5),
    (v_task, 'Click Save. The lead is placed in the New Leads pipeline and a buyer-specific smart plan is automatically assigned.', 6),
    (v_task, 'Verify smart plan is active and automated emails/tasks have triggered (within 10 minutes of saving).', 7);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Enter Lead in CRM', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'new_lead', 'Lead Intake & Setup', 3, 'Initial Conversation with Buyer', 'AGENT', false, 30) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Review lead profile in Lofty — confirm smart plan is active and Get to Know You email has been sent.', 1),
    (v_task, 'Make a personal phone call: introduce yourself, confirm they received your contact card via text, build rapport.', 2),
    (v_task, 'Ask if they''ve completed the Get to Know You form. If not, guide them to find it in inbox/spam.', 3),
    (v_task, 'Assess their timeline. If ready or near-ready: connect them with a preferred lender via three-way text.', 4),
    (v_task, 'If hesitant: educate on soft credit pulls and early lender benefits. Offer a Scouting Trip as a casual entry point.', 5),
    (v_task, 'After lender contact, set up an MLS-connected home search based on their budget and preferences.', 6),
    (v_task, 'If buyer is not ready: invite them to follow on Instagram, Facebook, YouTube for market updates and nurture.', 7),
    (v_task, 'Note: Reserve a formal buyer consultation for in-person meetings and when clear signs of readiness emerge. Avoid early consultations with unqualified buyers.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Initial Buyer Conversation', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'new_lead', 'Lead Intake & Setup', 4, 'Verify Get to Know You Form & Input in CRM', 'TC', false, 40) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'In Lofty, open the lead''s profile. In a separate window open JotForm, find the Buyer Information form > More > Submissions.', 1),
    (v_task, 'Locate the client''s completed form and click View.', 2),
    (v_task, 'Enter into Lofty: property address (if provided), birthday, pet/family member names and birthdays.', 3),
    (v_task, 'Under Edit Details > Favorites: enter coffee shops, sports teams, restaurants, snacks, hobbies.', 4),
    (v_task, 'Enter any Professional Services listed (homeowners insurance, financial advisor, etc.).', 5),
    (v_task, 'If form not completed: text or email — "Hi [Client Name], just wanted to make sure you had a chance to complete this form so we can best tailor your experience. Here''s the link: [paste form link]. Thanks!"', 6),
    (v_task, 'Note: Keep pet and family member records current — update or remove as needed over time.', 7);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Upload Client Info to CRM', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'new_lead', 'Lead Intake & Setup', 5, 'Lender Connection', 'TC', true, 50) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Confirm all decision-makers (both buyers/spouses) are ready for lender introduction.', 1),
    (v_task, 'Confirm the lender''s availability and contact number.', 2),
    (v_task, 'Start a group text including: the lender AND all buying decision-makers.', 3),
    (v_task, 'Sample template: "Hi [Lender Name], meet [Client Name 1] and [Client Name 2]. [Insert background info and timeline]. I''ll let you all connect from here — please let me know when you have more information and we can get your search set up."', 4);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Lender Connection via Group Text', '#', 1);

  -- PHASE 2 - qualified
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'qualified', 'Buyer Engagement', 6, 'Determine: Scouting Trip or Buyer Consultation', 'AGENT', false, 60) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Choose a Scouting Trip when: buyer is not yet pre-approved or hesitant to talk to a lender; you want a casual, low-pressure way to build rapport; buyer wants to explore an area or price range before committing.', 1),
    (v_task, 'Choose a Buyer Consultation when: buyer is pre-approved and ready to actively search; in-person meeting is possible; clear signs of readiness and motivation are present.', 2);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Scouting Trip vs. Consultation Decision', '#', 1),
    (v_task, 'google_doc', 'Decision Guide (Google Doc)', '#', 2);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'qualified', 'Buyer Engagement', 7, 'Conduct Scouting Trip', 'AGENT', true, 70) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Ensure all decision-makers are present. Set a relaxed, exploratory tone: encourage open communication, even about differences of opinion.', 1),
    (v_task, 'Ask questions during each home: layout preferences, location requirements (e.g., avoid busy roads), functional needs (e.g., garage, barn).', 2),
    (v_task, 'Take notes — focus on patterns in feedback rather than individual opinions.', 3),
    (v_task, 'After the trip, create a short-term Exclusive Right to Buy agreement (1–2 days) if buyer is not yet formally under contract.', 4);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Scouting Trip Walkthrough', '#', 1),
    (v_task, 'google_doc', 'Scouting Trip Guide (Google Doc)', '#', 2);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'qualified', 'Buyer Engagement', 8, 'Conduct Buyer Consultation', 'AGENT', true, 80) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Prepare: Exclusive Right to Buy contract, one-sheet roadmap, buyer registration form, branded Canva presentation.', 1),
    (v_task, 'Define your role as a long-term advisor, not just a transaction guide. Ensure all decision-makers are present.', 2),
    (v_task, 'Walk through the buying process: pre-approval, home search, making offers, going under contract, closing.', 3),
    (v_task, 'Cover contract milestones: inspection, appraisal, title/HOA docs, escrow. Address common objections.', 4),
    (v_task, 'Educate on closing preparation: utilities setup, cash to close, required documents.', 5),
    (v_task, 'Set expectations for post-closing annual review: mortgage/equity check-in, insurance, contractor referrals.', 6),
    (v_task, 'Tips: suggest easy-to-remove shoes for showings; coach buyers to be discreet around recording devices.', 7);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Buyer Consultation', '#', 1),
    (v_task, 'template', 'eXp Buyer Representation Toolkit', '#', 2);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'qualified', 'Buyer Engagement', 9, 'Create/Review/Execute Exclusive Right to Buy Agreement', 'AGENT', true, 90) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Log into contract software. Select Create New Contract > Exclusive Right to Buy Listing Contract.', 1),
    (v_task, 'Enter contract dates: standard duration is 6 months.', 2),
    (v_task, 'Commission: enter 3% — this is the maximum you can negotiate on their behalf. If seller offers less, you negotiate within that range.', 3),
    (v_task, 'Clause 7.3.1: check the box allowing Seller''s Brokerage Firm or Seller to pay Buyer''s Agent commission.', 4),
    (v_task, 'Holdover period: enter 45 days to protect commission if buyer purchases after contract termination.', 5),
    (v_task, 'Confirm buyer is not under any other active buyer agency agreement.', 6),
    (v_task, 'For a Scouting Trip only: prepare a 1–2 day version. Once buyer decides to move forward, execute a full-term contract.', 7),
    (v_task, 'Save, present to buyer for review and signature. Terminate any prior agreements if replacing.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Exclusive Right to Buy Contract', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'qualified', 'Buyer Engagement', 10, 'Create Buyer Property Profile in CRM', 'TC', false, 100) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Open the client''s profile in Lofty. Create or update a note summarizing buyer non-negotiables gathered from the scouting trip or consultation.', 1),
    (v_task, 'Example note: "No busy roads. Must have open floor plan with island. Minimum 1-car garage."', 2),
    (v_task, 'Use these notes to vet homes before scheduling showings.', 3),
    (v_task, 'Update notes after every showing as preferences evolve (e.g., carport now acceptable instead of garage).', 4),
    (v_task, 'Alert client proactively when a property contradicts a listed preference before scheduling the showing.', 5),
    (v_task, 'Note: Maintaining accurate non-negotiables prevents unnecessary showings and repeat questions.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Buyer Property Profile & Non-Negotiables', '#', 1);

  -- PHASE 3 - property_tour_or_listing_prep
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'property_tour_or_listing_prep', 'Home Search & Showings', 11, 'Showing Houses & Narrowing the Search', 'AGENT', true, 110) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Continuously update and review CRM notes after each showing. Adjust the MLS search scope accordingly.', 1),
    (v_task, 'Maintain only 2 options (1A and 1B) in active consideration at any time to avoid decision fatigue.', 2),
    (v_task, 'Contact the listing agent before writing any offer: ask about other offers, seller priorities, and timelines.', 3),
    (v_task, 'Prepare the buyer to make an offer: even a low or likely-declined offer builds momentum and buyer clarity.', 4),
    (v_task, 'After every showing, update the CRM with new observations and buyer feedback.', 5),
    (v_task, 'Note: This phase is about vision clarity, not pressure. The goal is to build confidence and move buyers into offer mode.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Narrowing the Search', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'property_tour_or_listing_prep', 'Home Search & Showings', 12, 'Schedule & Conduct Showings / Update Property Profile', 'TC', true, 120) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Scheduling: Confirm 3–4 properties the buyer wants to view. Use MLS mapping to sequence homes logically.', 1),
    (v_task, 'Schedule 15–30 minutes per home with 15-minute drive intervals via ShowingTime.', 2),
    (v_task, 'Record showing instructions (lockbox codes, remove shoes, pet alerts) in your notes in case you lose service. Do NOT share lockbox codes with buyers.', 3),
    (v_task, 'During Showings: Let buyers explore independently; you observe and take notes.', 4),
    (v_task, 'Verbally note visible concerns (old HVAC, foundational cracks) — frame them as future inspection items, not deal-breakers.', 5),
    (v_task, 'Remind buyers to be mindful of recording devices (Ring doorbells, smart home devices).', 6),
    (v_task, 'After Showings: Update Lofty CRM notes for each property immediately after the showing.', 7),
    (v_task, 'Call listing agents for properties with buyer interest to gauge offer activity and build rapport.', 8),
    (v_task, 'Submit showing feedback immediately — be specific and constructive. Avoid anything that could violate Fair Housing laws.', 9),
    (v_task, 'Lock all doors, turn off lights, and follow all listing instructions.', 10);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Scheduling Showings & Updating CRM', '#', 1);

  -- PHASE 4 - offer_drafted_or_listed
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'offer_drafted_or_listed', 'Offer & Negotiation', 13, 'Create/Review/Execute Offer', 'AGENT', true, 130) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Access MLS and public records to verify: zoning, land details, well number, owner''s name, legal description, inclusions.', 1),
    (v_task, 'Call the listing agent: assess current offers, seller preferences, possession date requirements, specific property details.', 2),
    (v_task, 'Run comparables: identify similar properties by location, acreage, house size, condition, amenities.', 3),
    (v_task, 'Open a new contract in CTME. Enter accurate buyer names and details. Populate all fields from MLS data.', 4),
    (v_task, 'Specify: earnest money (typically 1% of purchase price), loan details, down payment, financing type.', 5),
    (v_task, 'Set all deadlines: earnest money, title, loan application, inspection, appraisal, closing.', 6),
    (v_task, 'Detail inclusions and exclusions (appliances, sheds, fixtures). Note encumbered inclusions and leased items.', 7),
    (v_task, 'Use a personal property agreement when significant personal items are included to avoid appraisal issues.', 8),
    (v_task, 'Add additional provisions as needed: well permits, water rights, due diligence conditions.', 9),
    (v_task, 'Verify all details for accuracy and completeness before submitting.', 10),
    (v_task, 'Note: For equine/ranch properties: confirm irrigation rights, water shares, ag tax status, and any grazing lease terms.', 11);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Creating & Reviewing the Offer', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'offer_drafted_or_listed', 'Offer & Negotiation', 14, 'Submit Offer', 'AGENT+TC', true, 140) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Agent finalizes the offer based on client approval and submits through CTME.', 1),
    (v_task, 'TC confirms submission and logs offer details in the transaction file.', 2),
    (v_task, 'Prepare a professional email to the listing agent summarizing the offer terms and buyer background.', 3);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'offer_drafted_or_listed', 'Offer & Negotiation', 15, 'Negotiate Offer with Listing Agent', 'AGENT', true, 150) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Before negotiating: use AI tools and public records to research the property and seller situation (Realist: open mortgages, time on market).', 1),
    (v_task, 'Review comparables to guide pricing strategy. Present findings to clients and confirm strategy.', 2),
    (v_task, 'Encourage strong initial offers when multiple offers are likely. Adjust strategy if the property has sat on the market.', 3),
    (v_task, 'Stay in contact with listing agent: ask about number of offers, when they''re being presented, seller priorities.', 4),
    (v_task, 'Share your buyer''s story: professions, motivations, personal connections to the home or lifestyle. Keep tone professional.', 5),
    (v_task, 'Pay attention to direct and indirect hints from the listing agent about what it will take to get accepted.', 6),
    (v_task, 'Relay information to buyers promptly. Adjust terms collaboratively if needed.', 7),
    (v_task, 'Note: Open communication is the top priority. Focus on small, strategic adjustments once the main offer is submitted.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Negotiation Strategy & Communication', '#', 1);

  -- PHASE 5a - offer_accepted_under_contract
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'offer_accepted_under_contract', 'Under Contract', 16, 'Under Contract Automation in Lofty', 'TC+AGENT', false, 160) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'AGENT: notify TC that contract is executed.', 1),
    (v_task, 'TC: notify lender and title company. Send Next Steps email to client.', 2),
    (v_task, 'After inspection is complete: check off inspection milestone in Lofty. Next Steps email (appraisal/title stage) goes out automatically.', 3),
    (v_task, 'After appraisal is cleared: check off appraisal milestone. Final Next Steps email (closing) goes out automatically.', 4),
    (v_task, 'Schedule final walkthrough and closing in Google Calendar.', 5),
    (v_task, 'Update pipeline stage in Lofty as each milestone is reached.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Under Contract Automation', '#', 1);

  -- PHASE 5b - inspection_and_appraisal
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 17, 'Confirm Inspection & Add to Agent Calendar', 'TC', true, 170) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Confirm inspection date and time with the client or inspector directly (typically via text after the client is connected to inspector).', 1),
    (v_task, 'Create calendar event: title format: "Inspection – [Property Address] – [Client Last Name]"', 2),
    (v_task, 'Duration: allow approximately 3 hours depending on property size.', 3),
    (v_task, 'Enter full property address in the Location field.', 4),
    (v_task, 'Add buyer email addresses so the appointment appears on their calendar.', 5),
    (v_task, 'Use the orange color for all production-related calendar events.', 6),
    (v_task, 'Double-check address spelling and time zone before saving.', 7);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Scheduling & Calendaring Inspection', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 18, 'Attend Inspection', 'AGENT', true, 180) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Review the Seller''s Property Disclosure before the inspection. Send it to the inspector so they''re aware of known issues.', 1),
    (v_task, 'Arrive on time and stay for the full inspection. Allow clients to ask the inspector questions directly.', 2),
    (v_task, 'Ask clarifying questions: "What''s the potential cost to replace this?" / "Is this urgent or long-term maintenance?"', 3),
    (v_task, 'Educate the client on the difference between minor issues and major concerns. Frame everything as information, not alarm.', 4),
    (v_task, 'After inspections and negotiations, prepare a Honey-Do Checklist of items the seller did not address. Send one month after closing.', 5),
    (v_task, 'Note: Your role is to guide and advise — not to replace the inspector''s professional expertise. Keep your tone educational, not adversarial.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Attending the Buyer Inspection', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 19, 'Review Inspection & Create/Review/Execute Inspection Objection', 'AGENT', false, 190) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Gather all inspection documents: general home inspection, septic, well, radon, and any specialized reports.', 1),
    (v_task, 'Use GPT to draft the inspection objection: input the prompt "Help me start an inspection objection with these items:" and upload all reports.', 2),
    (v_task, 'Review and edit GPT output: ensure clarity, group items by category (HVAC, Electrical, Plumbing, Structural, Safety), clean up language.', 3),
    (v_task, 'Example revisions: "Seller to hire licensed HVAC contractor to perform full evaluation, cleaning, and certification." / "Seller to install radon mitigation system with transferable warranty to ensure levels remain below 4.0."', 4),
    (v_task, 'Navigate to CTME > client property file > Create New Contract > Inspection Objection. Paste the cleaned draft.', 5),
    (v_task, 'Do NOT send yet — agent must review and approve first. Notify agent the objection is ready for review.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Inspection Objection Drafting', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 20, 'Negotiate Inspection Resolution', 'AGENT', true, 200) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Maintain a collaborative mindset — avoid adversarial energy. Stay client-focused and solution-seeking.', 1),
    (v_task, 'Submit the objection with strategic items included — not just the bare minimum. Know what the client is willing to compromise on.', 2),
    (v_task, 'Contact the listing agent directly after submission: "Let me know what you''re thinking." Engage in verbal negotiation before formal resolution.', 3),
    (v_task, 'Most experienced agents will reach a verbal agreement first. Once verbal agreement is reached, listing agent drafts resolution > you review > client signs.', 4),
    (v_task, 'Track all items from the inspection that were not resolved. Compile into a post-close Honey-Do Checklist.', 5),
    (v_task, 'One month after closing, send the client the checklist with contractor referrals.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Inspection Resolution Negotiation', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 21, 'Execute Inspection Resolution', 'AGENT', true, 210) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Once the client signs the inspection resolution, the transaction moves forward. All negotiated items are considered resolved.', 1),
    (v_task, 'File the signed resolution in the transaction folder.', 2),
    (v_task, 'Begin compiling the post-close Honey-Do Checklist from unresolved items.', 3);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Executing the Resolution', '#', 1),
    (v_task, 'template', 'Post-Close Honey-Do Checklist Template', '#', 2);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'inspection_and_appraisal', 'Inspection & Appraisal', 24, 'Verify Appraisal, Object & Resolve Any Issues', 'TC', false, 220) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Immediately after contract execution: confirm with the lender that the appraisal has been ordered. Track the appraisal deadline.', 1),
    (v_task, 'Follow up with lender to confirm when the appraisal is scheduled. Know when the report is expected.', 2),
    (v_task, 'Appraisals belong to the buyer — do not share with the listing agent unless required.', 3),
    (v_task, 'If appraisal is at value and as-is with no conditions: notify the other agent — "Appraisal is in at value, as is, no conditions." Do NOT share the dollar amount.', 4),
    (v_task, 'If appraisal comes in low or with conditions: work with lender to understand requirements. Prepare to share report to support renegotiation.', 5),
    (v_task, 'For FHA/VA/USDA loans: proactively identify likely appraiser flags during showings (chipping paint, broken window well covers, missing flooring, electrical panel covers).', 6),
    (v_task, 'Strategize early: address likely appraisal conditions at the inspection stage, not the original contract, to avoid red flags.', 7),
    (v_task, 'Note: If required repairs are not done before the appraisal visit, buyer may incur a revisit fee.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Managing Appraisals & Objections', '#', 1);

  -- PHASE 5c - financing_and_title
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'financing_and_title', 'Financing & Title', 22, 'Review Title & HOA Docs and Send to Buyer', 'AGENT', true, 230) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Title Review: Focus on the Requirements section first. Look for: liens outside the standard mortgage, court orders, lawsuits naming the client.', 1),
    (v_task, 'Contact the title company for anything questionable. Verify identity for common names — confirm flagged liens actually apply to your client.', 2),
    (v_task, 'HOA Review via Notebook LM: Download all HOA documents from the title or transaction portal.', 3),
    (v_task, 'In Notebook LM: create a new notebook, remove prior documents, upload all HOA docs.', 4),
    (v_task, 'Share the notebook with your client via Gmail invite or public share link.', 5),
    (v_task, 'Run common queries: "Does this HOA allow dogs?" / "Are there rental restrictions?" / "What is the fidelity insurance coverage?"', 6),
    (v_task, 'Provide client with a few starter questions and position yourself as their go-to resource for follow-up.', 7),
    (v_task, 'Note: Notebook LM is a tool, not a legal authority. Clients should read the actual documents — especially budgets and rules — and consult an attorney for complex concerns.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Title & HOA Document Review', '#', 1),
    (v_task, 'google_doc', 'Title/HOA Review Guide (Google Doc)', '#', 2);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'financing_and_title', 'Financing & Title', 23, 'Research & Resolve Buyer Concerns on Title/HOA Docs', 'AGENT', true, 240) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'For title document issues: refer client to the title escrow officer first. For complex legal concerns, advise consultation with an attorney.', 1),
    (v_task, 'For HOA document issues: direct client to the HOA management company or HOA board.', 2),
    (v_task, 'Explain the tax certificate: property taxes in Colorado are paid in arrears. Review prorations at closing.', 3),
    (v_task, 'Manage deadlines: confirm client has reviewed all documents before contractual Title Objection and HOA Termination deadlines.', 4),
    (v_task, 'If unacceptable HOA conditions are found (dog weight limits, leasing restrictions, unexpected fees): submit formal HOA Termination before the deadline.', 5),
    (v_task, 'Note: Always document that documents were delivered and clients were encouraged to review them thoroughly.', 6);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Responding to Title & HOA Concerns', '#', 1);

  -- PHASE - closing
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'closing', 'Closing', 25, 'Final Walkthrough & Handle Any Issues', 'AGENT', true, 250) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Conduct the walkthrough as close to closing as possible — ideally within 24 hours.', 1),
    (v_task, 'Verify property is in the same condition as when last inspected. For vacant properties: check heat, hot water, HVAC, and for any vandalism.', 2),
    (v_task, 'Confirm all agreed-upon inspection repairs have been completed and done properly.', 3),
    (v_task, 'Confirm all contract inclusions (washer, dryer, dishwasher, etc.) are still present.', 4),
    (v_task, 'Check that unwanted seller belongings have been removed.', 5),
    (v_task, 'Have your client record a video walkthrough — especially important with a post-closing occupancy agreement. Note date and time of recording.', 6),
    (v_task, 'If major issues are found: do NOT proceed with closing until resolved. Call the listing agent immediately. Involve your managing broker for guidance.', 7),
    (v_task, 'Note: The final walkthrough is the buyer''s last point of leverage before funds transfer. Once closing is complete and funds are disbursed, resolving issues requires small claims court.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES
    (v_task, 'loom', 'Watch Loom: Final Walkthrough SOP', '#', 1),
    (v_task, 'google_doc', 'Final Walkthrough Checklist (Google Doc)', '#', 2);

  -- PHASE 6 - closed_won
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'closed_won', 'Closing & Post-Closing Nurture', 26, 'Attend Closing & Create a Memorable Experience', 'AGENT', true, 260) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Confirm closing time, location, and required documents with all parties. Prepare closing gift.', 1),
    (v_task, 'Review transaction file — confirm all contingencies and tasks are complete before attending.', 2),
    (v_task, 'In Colorado, buyers typically sign only two main documents. Your presence ensures questions are answered and last-minute issues are handled.', 3),
    (v_task, 'Create a memorable experience: red carpet walk-in, limo ride, personalized gift presentation. Make it about the client''s achievement.', 4),
    (v_task, 'Social Media: Focus on the client''s story — you are the supporting character, not the main subject.', 5),
    (v_task, 'Do not share personal details, home addresses, or location specifics. Do not tag clients without explicit permission.', 6),
    (v_task, 'Post-Closing CRM: Return to CRM. Complete closing-related checklist items. Update pipeline to Closed.', 7),
    (v_task, 'Confirm automated post-closing communications are scheduled: testimonial request, follow-up emails, annual review reminders.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Closing Day Experience', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'closed_won', 'Closing & Post-Closing Nurture', 27, 'Finalize Smart Plan & Initiate Post-Closing Workflow', 'AGENT+TC', false, 270) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Once closing is confirmed and funded: complete the closing confirmation task in the buyer''s Under Contract template in Lofty.', 1),
    (v_task, 'Update possession date and time. If possession is immediate, proceed with the closing checklist. If delayed, adjust accordingly.', 2),
    (v_task, 'Once possession is confirmed: mark the possession task as complete. Pipeline automatically updates to Closed.', 3),
    (v_task, 'Lofty will trigger post-closing emails: Just Closed announcement, testimonial request, Pizza-for-the-move order email (if applicable).', 4),
    (v_task, 'Automated follow-ups continue: 3-day post-possession call, ongoing touchpoints.', 5),
    (v_task, 'For delayed possession (60+ days): consider removing buyer from Closed pipeline until possession occurs.', 6),
    (v_task, 'Or manually pause the smart plan: open record > Smart Plans > Pause or Delete > make manual adjustments before resuming.', 7),
    (v_task, 'Note: Automations require correct possession and closing updates to function. Use Pause strategically to prevent overwhelming clients during sensitive situations.', 8);
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order) VALUES (v_task, 'loom', 'Watch Loom: Post-Closing Smart Plan Workflow', '#', 1);

  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, sort_order)
  VALUES (v_master_id, 'closed_won', 'Closing & Post-Closing Nurture', 28, 'Ongoing Post-Closing Nurture', 'AGENT+TC', true, 280) RETURNING id INTO v_task;
  INSERT INTO public.checklist_template_steps (task_id, body, sort_order) VALUES
    (v_task, 'Send Honey-Do Checklist with contractor referrals one month after closing.', 1),
    (v_task, 'Annual homeownership review: mortgage and equity check-in, insurance review, contractor referrals for upgrades.', 2),
    (v_task, 'Quarterly market updates and periodic home maintenance reminders.', 3),
    (v_task, 'Holiday greetings, home anniversaries, and community event invitations.', 4),
    (v_task, 'Request Google review and video testimonial within 2 weeks of closing.', 5),
    (v_task, 'Tag client in CRM: Closed Buyer, property type (Equine/Acreage/Land/Residential), referral source.', 6);

  -- Re-clone master to existing agents who don't have a buyer template yet (preserve any custom edits)
  INSERT INTO public.checklist_templates (owner_user_id, name, side, state, is_default, is_system_master, description)
  SELECT ur.user_id, 'Horse & Hearth Buyer SOP (My Copy)', 'buyer', 'CO', true, false, 'Personal copy of the system master template. Edit freely to match your workflow.'
  FROM public.user_roles ur
  WHERE ur.role = 'agent'
    AND NOT EXISTS (SELECT 1 FROM public.checklist_templates t WHERE t.owner_user_id = ur.user_id AND t.side = 'buyer');

  -- Populate the freshly-cloned agent copies (those that match name and have no tasks yet)
  INSERT INTO public.checklist_template_tasks (template_id, phase_key, phase_label, task_number, title, owner_role, client_visible_default, default_assignee_role, notes, sort_order)
  SELECT t.id, mt.phase_key, mt.phase_label, mt.task_number, mt.title, mt.owner_role, mt.client_visible_default, mt.default_assignee_role, mt.notes, mt.sort_order
  FROM public.checklist_templates t
  CROSS JOIN public.checklist_template_tasks mt
  WHERE t.side = 'buyer'
    AND t.is_system_master = false
    AND t.name = 'Horse & Hearth Buyer SOP (My Copy)'
    AND mt.template_id = v_master_id
    AND NOT EXISTS (SELECT 1 FROM public.checklist_template_tasks tt WHERE tt.template_id = t.id);

  -- Steps for the new agent copies
  INSERT INTO public.checklist_template_steps (task_id, body, default_assignee_role, sort_order)
  SELECT new_t.id, ms.body, ms.default_assignee_role, ms.sort_order
  FROM public.checklist_template_tasks new_t
  JOIN public.checklist_templates tmpl ON tmpl.id = new_t.template_id AND tmpl.side = 'buyer' AND tmpl.is_system_master = false AND tmpl.name = 'Horse & Hearth Buyer SOP (My Copy)'
  JOIN public.checklist_template_tasks mt ON mt.template_id = v_master_id AND mt.task_number = new_t.task_number AND mt.phase_key = new_t.phase_key
  JOIN public.checklist_template_steps ms ON ms.task_id = mt.id;

  -- Resources for the new agent copies
  INSERT INTO public.checklist_template_resources (task_id, kind, label, url, sort_order)
  SELECT new_t.id, mr.kind, mr.label, mr.url, mr.sort_order
  FROM public.checklist_template_tasks new_t
  JOIN public.checklist_templates tmpl ON tmpl.id = new_t.template_id AND tmpl.side = 'buyer' AND tmpl.is_system_master = false AND tmpl.name = 'Horse & Hearth Buyer SOP (My Copy)'
  JOIN public.checklist_template_tasks mt ON mt.template_id = v_master_id AND mt.task_number = new_t.task_number AND mt.phase_key = new_t.phase_key
  JOIN public.checklist_template_resources mr ON mr.task_id = mt.id AND mr.step_id IS NULL;
END $$;