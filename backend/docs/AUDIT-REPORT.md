# V-Sparkz System Audit Report

Generated per Phase 1 of the Full System Completion Plan. Covers backend routes, controllers, models, services, middleware, frontend sidebar/routes, and "Coming Soon" inventory.

---

## 1. Executive Summary

- **Core flow**: Lead → Client → Project → Quotation → Agreement → Invoice → Payment is present and documented. Invoice/Quotation/Agreement controllers use client-based scoping.
- **Issues found**: PaymentController does not verify invoice belongs to tenant; Deals API is read-only (no POST/PUT/DELETE); Lead/Client/Project use `forAgency()` but model trait only provides `scopeForTenant` (scopeForAgency missing on BelongsToTenant); many DMOS routes are GET-only; 8+ frontend pages are "Coming Soon" placeholders; Integrations page shows "Coming soon" for all cards.
- **Tenancy**: Financial models correctly scoped via client. Tenant resolution middleware applied to admin routes. Payment listing not explicitly scoped (payments accessed via invoice).

---

## 2. Backend Scan

### 2.1 Routes (api.php)

- **Admin prefix**: All under `auth:sanctum`, `tenant`, `subscription`. No `EnsureFeature` middleware on DMOS routes.
- **Core**: Leads (CRUD + convert-to-client), Clients, Projects, Quotations, Agreements, Invoices, InvoiceAdjustments, Payments (POST only), PaymentGateway (createPayment, confirm) — all present.
- **Deals**: Only `GET /admin/deals`. Missing: `POST /admin/deals`, `GET/PUT/DELETE /admin/deals/{deal}`, stage transition endpoint.
- **DMOS read-only**: Keywords, contact-lists, vendors, brands, workflow-templates, knowledge-spaces, onboarding-questionnaires, automation-workflows, report-templates, forms — all only `GET` index/show. No create/update/delete routes.
- **Webhooks**: `/webhooks/razorpay`, `/webhooks/stripe` — no auth; signature verification present. Idempotency: `firstOrCreate` on `gateway_payment_id` (Razorpay/Stripe) — good.

### 2.2 Controllers – Tenant / Client Scoping

| Controller | Scoping | Notes |
|------------|---------|--------|
| InvoiceController | `whereHas('client', fn ($q) => $q->forTenant())` | Correct. |
| QuotationController | `whereHas('client', fn ($q) => $q->forTenant())` | Correct. |
| AgreementController | `whereHas('client', fn ($q) => $q->forTenant())` | Correct. |
| PaymentController | None | **Issue**: `store()` accepts `invoice_id` without verifying invoice belongs to current tenant (via invoice.client.tenant_id). Tenant A could post payment for Tenant B's invoice. |
| WebhookController | N/A | Uses invoice_id from gateway payload; no tenant check (acceptable for webhooks). |
| LeadController | `Lead::forTenant()` on index; `Lead::forAgency()->findOrFail()` on show/update | **Issue**: Lead model uses BelongsToTenant which has `scopeForTenant` only; no `scopeForAgency`. If tables use `tenant_id` (post-evolution), `forAgency()` expects `agency_id` column — will fail or rely on undefined behavior. Should use `forTenant()` or add `scopeForAgency` to BelongsToTenant (alias for tenant_id). |
| ClientController | `Client::forAgency()->findOrFail()` | Same as Lead. |
| ProjectController | `Project::forAgency()->findOrFail()` | Same as Lead. |
| DealController | `Deal::where('tenant_id', $tenantId)` via BaseController::getTenantId | Correct. |

### 2.3 Models

- **Lead, Client, Project, Campaign, Deal, and DMOS models**: Use `BelongsToTenant` and have `tenant_id` in fillable. TenantScope applied.
- **Quotation, Agreement, Invoice, Payment**: No global tenant scope; accessed via Client. Correct.
- **Invoice**: Has `scopeForAgency($tenantId)` using `whereHas('client', ...)`. Correct.

### 2.4 Services

- **QuotationPricingService**: Single pricing path for quotations — good.
- **BillingService**: Manages ClientSubscription, BillingCycle, Transaction. Does **not** create Invoice records. When recurring billing is fully implemented, it must only create Invoices via existing Invoice model/service (no second path).
- **DealService**: Exists; DealController does not use it (controller uses Deal model directly). No store/update in controller.
- Other DMOS services (SeoWorkspaceService, EmailAutomationService, VendorService, etc.): Present; many controllers only do index/show and do not delegate to services for create/update.

### 2.5 Middleware

- Admin group: `auth:sanctum`, `tenant`, `subscription`. No `EnsureFeature` on DMOS routes — feature flags not enforced at route level.

### 2.6 Recurring Billing

- BillingService and models (ClientSubscription, BillingCycle, Transaction) exist. No code path that creates Invoice from a billing cycle yet. Rule: when added, must use existing Invoice flow only.

---

## 3. Frontend Scan

### 3.1 Sidebar vs Routes

- Sidebar items (menuGroups) match App.jsx routes: `/deals`, `/social-planner`, `/ads`, `/seo-workspace`, `/email-automation`, `/workflows`, `/vendors`, `/knowledge-base`, `/service-packages`, `/brands`, `/compliance`, `/automation`, `/report-templates`, `/integrations`, etc. — all have corresponding routes. No dead sidebar links.

### 3.2 "Coming Soon" Inventory

| Page | Current state |
|------|----------------|
| AdsPerformance.jsx | "Coming soon" placeholder |
| EmailAutomation.jsx | "Coming soon" placeholder |
| KnowledgeBase.jsx | "Coming soon" placeholder |
| SeoWorkspace.jsx | "Coming soon" placeholder |
| SocialPlanner.jsx | "Coming soon" placeholder |
| Workflows.jsx | "Coming soon" placeholder |
| Compliance.jsx | "Coming soon" placeholder |
| ServicePackages.jsx | "Coming soon" placeholder |
| Integrations.jsx | All 4 cards "Coming soon" text + badge |

### 3.3 API Integration

- **Deals.jsx**: Calls `GET /admin/deals`; loading state; no create/edit/delete UI or API calls.
- **api.js**: Uses axios; Bearer token from localStorage; no explicit X-Tenant header (tenant may be derived server-side from auth).

### 3.4 Permissions (permissions.js)

- STAFF_BASE_PATHS include all DMOS paths (social-planner, ads, seo-workspace, etc.). PATH_TO_PERMISSION covers agreements, campaigns, agencies, team, services, plans, integrations. No feature-flag-based hiding in sidebar (only role/permission).

---

## 4. Logical / Architectural Issues

1. **PaymentController::store**: Must ensure `invoice_id` belongs to a client of the current tenant (e.g. load invoice and check `invoice->client` with `forTenant()` or `scopeForAgency`).
2. **forAgency vs forTenant**: Lead, Client, Project controllers call `Model::forAgency()` but BelongsToTenant only defines `scopeForTenant`. Tables use `tenant_id`. Add `scopeForAgency` to BelongsToTenant that scopes by `tenant_id` so existing controller code works.
3. **Deals**: Backend has no create/update/destroy or stage transition; frontend has no forms.
4. **DMOS CRUD**: Most DMOS modules have read-only API; full CRUD and service-layer usage needed per plan Phase 3.

---

## 5. Security & Tenancy

- **Tenancy violation**: PaymentController::store can associate payment with another tenant's invoice.
- **Webhooks**: Idempotent; no tenant check (correct for gateway callbacks).

---

## 6. Unused / Dead

- No dead admin routes identified. All registered routes have corresponding controllers.
- DealService exists but DealController does not use it for create/update.

---

## 7. Duplicate Pricing Logic

- Single pricing path identified: QuotationPricingService. No duplicate pricing engine found.

---

## 8. State Inconsistencies

- Invoice balance: Computed as total − payments − adjustments (credits) + debits. Ensure all code paths use same formula (Invoice model append or single service method).
- Project workflow_status: Constants defined on Project model; transition rules not centralized in one config/enum (Phase 4).

---

## 9. Summary of Fixes to Apply

| Priority | Item | Action |
|----------|------|--------|
| P1 | PaymentController::store | Scope invoice by client.tenant_id before creating payment. |
| P1 | BelongsToTenant | Add scopeForAgency that uses tenant_id so Lead/Client/Project forAgency() work. |
| P2 | Deals API | Add POST/PUT/DELETE and optional stage endpoint; use DealService. |
| P2 | DMOS modules | Add full CRUD routes and frontend (Phase 3). |
| P2 | Remove "Coming Soon" | Replace all placeholders with real UI (Phase 3/6). |
| P3 | Feature flags | Optional EnsureFeature on DMOS routes; sidebar hide by flag. |
| P3 | Recurring billing | When implementing invoice generation, use existing Invoice flow only. |
