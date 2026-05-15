
# Robust Transaction Checklist System

This is a substantial build. Here's the plan, broken into 4 phases you can approve as one or in stages.

---

## Phase A — Data model upgrades (one migration)

New + modified tables:

1. **`checklist_templates`** — agent-owned, editable SOP templates
   - `id`, `owner_user_id` (null = system master), `name`, `side` (buyer/seller), `state` (e.g. "CO"), `is_default`, timestamps
2. **`checklist_template_tasks`** — main tasks (the checkbox rows)
   - `template_id`, `phase_key` (new_lead, qualified, …), `phase_label`, `task_number`, `title`, `owner_role` (AGENT / LC / etc.), `client_visible_default`, `sort_order`
3. **`checklist_template_steps`** — sub-steps under each task
   - `task_id`, `body` (markdown), `sort_order`, `default_assignee_role`
4. **`checklist_template_resources`** — videos, templates, supplements
   - `task_id` (or step_id), `kind` (loom/video/google_doc/sheet/template/note), `label`, `url`
5. **`deal_parties`** — people involved in a deal (beyond agent + client)
   - `deal_id`, `user_id` (nullable for non-users), `name`, `email`, `phone`, `role` (co_agent / assistant / TC / lender / title / inspector / vendor / client / other), `company`
6. **Modify `deal_checklist_items`**: add `parent_task_id` (self-FK), `kind` (`task` | `step`), `assigned_party_id` (FK → deal_parties), `assigned_user_id`, `notes`
7. **New `deal_checklist_resources`**: per-deal copies of resource links (so agents can override per deal)

RLS:
- Templates: owner can CRUD their own; everyone reads system master (owner_user_id IS NULL)
- Parties / resources: follow existing deal access pattern (agent + admin manage; clients read where appropriate)

Trigger update:
- Replace `seed_deal_checklist()` to copy from the agent's default template (falling back to system master) — preserving phases → tasks → steps → resources.

Migration also seeds the **system master listing template** with all 50+ tasks, steps, and resource URLs from your SOP doc, plus a buyer-side master from the existing buyer checklist.

---

## Phase B — Agent template editor

New page **`/dashboard/templates`** + **`/dashboard/templates/:id`**:

- List the agent's templates (cloned from master on signup) + "Create new"
- Editor shows the same hierarchy as the deal view: Phase → Task → Steps → Resources
- Drag-to-reorder (sortable), inline edit titles / step body / resource URLs
- "Reset to master" button per task
- "Set as default for buyer / seller" toggles
- Auto-create on signup: trigger that clones the system master template into the new agent's account

---

## Phase C — Hierarchical checklist UI on `DealDetail` and `PortalDeal`

Replace the current flat checklist with:

```text
▼ Phase: Pre-Listing Prep                                     [3/10]
   ▼ ☐ Task 1 — Add Client to CRM           Owner: AGENT+LC  [client-visible ⚪] [Assign ▾]
        Steps:
        - Log in to Lofty. Navigate to leads…
        - Mark as Personal Lead…
        Resources:
        ▶ Watch Loom: Add Client to CRM     [open]
        Assigned to: Sarah (TC)             Due: —            [✓ Mark complete]
   ▶ ☐ Task 2 — Add Listing Appointment …
```

- Phases stay collapsible (existing pattern)
- Tasks are expandable to reveal steps + resources (default collapsed once complete)
- Each task shows: owner role badge, assigned party dropdown, client-visibility toggle, completion checkbox
- Resources render as tagged pill links (Loom, Google Doc, Template) with icons
- Per-deal step overrides editable inline by the agent
- Client portal renders the same hierarchy but read-only, only `client_visible = true` items, with a "task assigned to: you" call-out for items assigned to them

---

## Phase D — Deal Parties manager

New panel on `DealDetail` **Client & messaging** tab → renamed **Parties**:

- Add/remove parties with role, name, email, phone, company
- "Invite to portal" sends the existing portal invite (creates user → grants `client` or new `partner` role → links via `deal_parties`)
- The Assign dropdown on each task pulls from this list
- Notifications fire to assigned parties when tasks are assigned/completed (extends existing `notifications` flow)

---

## Out of scope for this plan (flag for later)
- Bulk-edit / import templates from CSV
- Conditional/branching tasks (only show if "boarding income = yes")
- E-signatures or document fills attached to a step
- State-by-state preset libraries (we ship CO master; agents clone & edit)

---

## Recommended approval order
1. **Approve Phase A** — I run the migration (creates all tables + seeds the CO Listing SOP master template with all 50 tasks, ~250 steps, and ~25 resource links)
2. Then build B + C + D in one pass (UI work, no further DB changes)

Phase A is the irreversible part — once you OK it I'll write the SQL and you'll approve the migration before code lands.

Want me to proceed with Phase A?
