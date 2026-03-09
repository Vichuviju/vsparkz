# V-Sparkz – Workflow & Project Documentation

This document describes the **end-to-end workflow** of the platform and how each module fits in.

---

## 1. Main Business Workflow (Lead → Delivery)

High-level sequence from first contact to project delivery and billing:

```
[Website]
     │
     ├── Contact form / Get quote / Pricing (package or custom)  →  POST /api/leads
     │     • Custom package: sub_service_ids, pricing_type (average | freelance), optional freelancer_selections
     │
     ▼
[Admin – Leads]
     │  • View, filter, assign lead; status; follow-up notes; timeline
     │  • Convert to Client → creates Client, links User (optional: send invite email with temp password for client login)
     │
     ▼
[Admin – Clients]
     │  • Client profile; link to projects, quotations, agreements, invoices
     │
     ▼
[Admin – Projects]
     │  • Add Project (from lead or manually); link to client; set project manager
     │  • Mark “requirement completed” → enables quotation build
     │
     ▼
[Admin – Quotations]
     │  • Build quotation from project (uses project services / sub-services; pricing from QuotationPricingService)
     │  • Generate PDF; send to client (client sees in portal)
     │
     ▼
[Client Portal – Quotations]
     │  • Client views quotation; approve / reject / request edit
     │
     ▼
[Admin – Agreements]
     │  • Create agreement from approved quotation; generate PDF
     │
     ▼
[Client Portal – Agreements]
     │  • Client views agreement; approve / reject / request rework
     │
     ▼
[Admin – Assign Project]
     │  • Assign freelancers or employees to project (per task / sub-service); project_assignments
     │
     ▼
[Portal – Assigned Work]
     │  • Freelancer/Employee: view assigned projects, update task status, submit task updates, log time
     │
     ▼
[Admin – Invoices & Payments]
     │  • Create invoice (from project/agreement); record payments; outstanding balance
     │
     ▼
[Admin – Reports / Work Dashboard]
     │  • Work progress, time logged, revenue, etc.
```

**Quick reference**

| Step | Where | Main actions |
|------|--------|--------------|
| 1 | Website | Contact, Get quote, or Pricing (select package / build custom with average or freelance + freelancer per service) |
| 2 | Admin → Leads | Triage, assign, status, follow-up, **Convert to Client** (optional: create login + send invite) |
| 3 | Admin → Clients | View/edit client; create **Project** from lead or manually |
| 4 | Admin → Projects | Set requirement completed → **Build Quotation** from project |
| 5 | Admin → Quotations | Build, PDF, client sees in portal |
| 6 | Client Portal | Quotation: approve/reject/edit → Agreement: approve/reject/rework |
| 7 | Admin → Assign Project | Assign freelancers/employees to project tasks |
| 8 | Portal (role: freelancer/employee) | Assigned projects, task updates, time logs |
| 9 | Admin → Invoices | Create invoice, record payments |
| 10 | Admin → Reports / Work Dashboard | Progress, time, revenue |

---

## 2. Website Flows

### 2.1 Contact & Get Quote

- **Contact** (`/contact`): Submit name, email, phone, message → `POST /api/leads` (source: `contact`).
- **Get Quote** (`/get-quote`): Submit with optional service → `POST /api/leads` (source: `get_quote`).

### 2.2 Pricing & Packages

- **Pricing page** (`/pricing` or offer document URL with `?offer=<id>`):
  - Loads **offer document** (multi-combo layout) from `GET /offer-documents` or `GET /offer-documents/:id` (with `?preview=1` for draft).
  - **Select package:** User picks a combo from the layout → “Get quote” → lead with `selected_combo_package_id`, `pricing_type: 'average'`.
  - **Build custom package:**
    1. Choose **pricing type:** **Average (in-house)** or **Freelance**.
    2. Select **services** (sub-services via checkboxes).
    3. If **Freelance:** For each selected sub-service, choose a **freelancer** from dropdown (list from `POST /custom-package-freelancers` with `sub_service_ids`). Estimated total uses selected freelancers’ rates from `freelancer_master_pricing` (monthly).
    4. “Get quote for custom package” → lead with `custom_package_data`: `{ sub_service_ids, pricing_type, freelancer_selections? }`.

**APIs used**

- `GET /offer-documents`, `GET /offer-documents/:id` – offer layout and combos.
- `GET /public/services`, `GET /public/sub-services` – for custom package service list.
- `POST /custom-package-preview` – estimated total (body: `sub_service_ids`, `pricing_type`, optional `freelancer_selections`).
- `POST /custom-package-freelancers` – freelancers per sub-service with price (body: `sub_service_ids`, optional `time_period`).
- `POST /leads` – submit quote (includes `selected_combo_package_id` or `custom_package_data`).

---

## 3. Lead → Client → Project (Admin)

1. **Leads**  
   List, filters, lead detail with timeline, assignee, follow-up notes, status. Lead can have `selected_combo_package_id` or `custom_package_data` (sub_service_ids, pricing_type, freelancer_selections).

2. **Convert to Client**  
   From lead detail: “Convert to Client”. Backend:
   - Creates or links **Client** (company, contact, etc.).
   - Option **Create login:** creates **User** (or links existing by email) with random temp password, sets `client_id` / `user_id`.
   - Option **Send invite email:** sends **ClientPortalInvite** with login link (`FRONTEND_URL`) and temp password (if created). Client can log in and use the portal.

3. **Add Project**  
   From lead or from Clients: create **Project** linked to **Client**. Optional: set project manager, dates, workflow status. Project can be created “from lead” so service/package context is available.

4. **Requirement completed**  
   Admin marks project’s requirement as completed → workflow moves to **quotation_processing** so a quotation can be built from this project.

---

## 4. Quotation & Agreement Workflow

1. **Build Quotation (Admin)**  
   From project (with requirement completed): **Build quotation**. Backend:
   - Uses project’s services / sub-services; pricing from **QuotationPricingService** (average/freelance as per project or defaults).
   - Creates **Quotation** and **quotation_services**; can generate PDF and store path.

2. **Client: Quotations (Portal)**  
   Client logs in → **Quotations** list and detail. Actions:
   - View quotation and PDF.
   - **Approve / Reject / Request edit** (PATCH) → status and any notes.

3. **Create Agreement (Admin)**  
   When quotation is approved, admin creates **Agreement** from quotation; PDF generated.

4. **Client: Agreements (Portal)**  
   Client sees agreement; can **Approve / Reject / Request rework**; view PDF.

5. **After agreement approved**  
   Project can move to “active”; **Assign Project** (assign freelancers/employees to tasks) becomes relevant.

---

## 5. Assign Project & Execution (Portal)

1. **Assign Project (Admin)**  
   On project: add **assignments** (e.g. freelancer or employee to task/sub-service). Uses **project_assignments** (assignable_type: Freelancer/User; link to project and optionally project_task).

2. **Portal – Assigned work**  
   User with role freelancer/employee/project_manager:
   - **Assigned projects** – list and detail.
   - **Task updates** – submit updates for tasks.
   - **Project tasks** – update task status (PATCH).
   - **Time logs** – view and create time logs.

3. **Work Dashboard (Admin)**  
   Reports: work progress, time logged (by project, assignee, etc.).

---

## 6. Package Generator & Offer Documents (Admin)

- **Offer documents**  
  Multi-combo layout for the **website pricing page**: one offer document = one “pricing view” with multiple combo packages, sidebar content, and layout options.

- **Package Generator (Admin)**  
  - Select multiple **combo packages**; set layout (title, tagline, columns, etc.).
  - **Preview** (live) and **Generate PDF**.
  - **Show to website** – offer document is visible on the site (public list/detail by id; pricing page can load by `?offer=<id>`).

- **Combos & sub-services**  
  - **Sub-services:** Belong to a service; have `average_price`, `freelance_price`, duration; used in combo items and in custom package pricing.
  - **Freelancer master pricing:** `freelancer_master_pricing` stores per-freelancer, per–sub-service rate (e.g. monthly). Used for custom package “Freelance” pricing and freelancer dropdown on pricing page.

---

## 7. Client Portal Summary

**Routes (website app, under client dashboard):**

| Path | Description |
|------|-------------|
| `/client` (or `/dashboard`) | Dashboard home |
| `/client/projects` | My projects (list, detail, approve/reject meeting, etc.) |
| `/client/quotations` | Quotations list & detail; approve/reject/edit; PDF |
| `/client/agreements` | Agreements list & detail; approve/reject/rework; PDF |
| `/client/invoices` | Invoices |
| `/client/reports` | Reports |
| `/client/support` | Support |
| `/portal/assigned-projects` | Assigned work (for freelancer/employee role) |

**Auth:** Client logs in with email + password (set on conversion invite or existing account). `FRONTEND_URL` in backend `.env` is used for invite link.

---

## 8. Module Overview (Current Features)

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs (leads, clients, projects), lead funnel, leads by source, revenue trend, theme toggle |
| **Leads** | List, filters, detail, timeline, assignee, follow-up, status, **Convert to Client** (with optional login + invite) |
| **Clients** | CRUD, profile, link to projects/quotations/agreements/invoices |
| **Projects** | CRUD, link to client; workflow status; requirement completed → quotation; project manager; **Assign Project** (assignments) |
| **Quotations** | Build from project, quotation_services, PDF; client approval in portal |
| **Agreements** | From quotation, PDF; client approval/rework in portal |
| **Project assignments** | Assign freelancer/employee to project (and tasks); project_assignments, project_tasks (sub_service_id, freelancer_id) |
| **Portal** | Client: projects, quotations, agreements, invoices, reports. Role-based: assigned projects, task updates, time logs |
| **Services / Sub-services / Combos** | Services, SubServices (average_price, freelance_price), PricingLevels, ComboPackages, freelancer_master_pricing |
| **Offer documents & Package generator** | Multi-combo offer layout, PDF, “Show to website”; pricing page uses it + custom package with freelance/freelancer selection |
| **Invoices & Payments** | Invoices CRUD, record payments, outstanding balance |
| **Reports & Work dashboard** | Reports; work progress and time logged |
| **Pages & Landing builder** | CMS pages by slug; Landing template/sections/blocks, media, animations for home |
| **Settings** | Site name, logo, SEO, etc. |

---

## 9. References

- **Setup & paths:** [DOCUMENTATION.md](DOCUMENTATION.md)
- **API details:** [API.md](API.md)
- **Setup steps:** [SETUP.md](SETUP.md)
- **PRD & roadmap:** [PRD-IMPLEMENTATION-ROADMAP.md](PRD-IMPLEMENTATION-ROADMAP.md)
