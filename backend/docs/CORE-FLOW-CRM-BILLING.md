# Core CRM & Billing Flow — Locked Specification

This document defines the **existing, production** flow that all DMOS extensions must preserve. No changes to this flow are allowed except strictly additive extensions.

---

## 1. Flow Overview

```
Lead (tenant_id) ──convert──> Client (tenant_id)
                                    │
                                    ├── projects (Project)
                                    ├── quotations (Quotation)
                                    ├── agreements (Agreement)
                                    └── invoices (Invoice)

Project (tenant_id, client_id) ── workflow_status ──> quotation_processing
                        │
                        ├── quotation_id (Quotation)
                        ├── agreement_id (Agreement)
                        ├── projectTasks (ProjectTask)
                        ├── assignments (ProjectAssignment)
                        └── timeLogs (TimeLog)

Quotation (client_id, project_id) ── quotation_services (QuotationService)
Agreement (client_id, project_id, quotation_id)
Invoice (client_id, quotation_id) ── payments (Payment), adjustments (InvoiceAdjustment)
```

---

## 2. Tenancy

- **Source of truth**: `tenant_id` on `tenants` table (evolved from `agencies`). All business data is scoped by tenant.
- **Models with direct `tenant_id`**: Lead, Client, Project, Freelancer, Campaign, Integration, and most DMOS tables. They use the `BelongsToTenant` trait and global scope.
- **Models scoped via relation only**: Quotation, Agreement, Invoice, Payment have no global tenant scope; access is **always** via `client` (and thus `client.tenant_id`). Controllers must filter by `whereHas('client', fn ($q) => $q->where('tenant_id', $tenantId))` or use the appropriate scope (e.g. `scopeForAgency` which must use `client.tenant_id` after agencies→tenants migration).

---

## 3. Lead → Client Conversion

- **Lead**: `tenant_id`, status (new, contacted, rejected, hold, follow_back, closed), `converted_to_client_id` (nullable).
- **Client**: `tenant_id`, `lead_id` (nullable). When a lead is converted, `Client` is created and `Lead.converted_to_client_id` is set.
- **Constraint**: One lead converts to at most one client. New modules (e.g. Deals) must reference `Lead` and/or `Client`; they must **not** introduce a parallel “lead” entity.

---

## 4. Project Lifecycle

- **Project**: `tenant_id`, `client_id`, `service_id`, `quotation_id`, `agreement_id`, `workflow_status`, etc.
- **Workflow statuses** (do not remove or repurpose):  
  `project_initialized`, `requirement_gathering`, `quotation_processing`, `quotation_generated`, `quotation_rejected`, `quotation_resubmitted`, `agreement_generation`, `agreement_rework`, `work_in_progress`, `completed`, `cancelled`.
- **Constraint**: Quotation and Agreement are created in the context of a Project; Invoice may be linked to Quotation. New modules (e.g. Campaign) may **link** to Project (e.g. `campaign.project_id` nullable) but must not replace or bypass this lifecycle.

---

## 5. Quotation → Agreement → Invoice

- **Quotation**: `client_id`, `project_id`, `number`, `title`, `items` (array), `subtotal`, `tax_*`, `total`, `status` (draft, sent, accepted, rejected), `quotation_services` (line items). Pricing is orchestrated by `QuotationPricingService` (ServicePrice, FreelancerMasterPricing, SubService).
- **Agreement**: `client_id`, `project_id`, `quotation_id`, `title`, `scope`, `timeline`, `payment_terms`, `status`, `signed_at`, `file_path`.
- **Invoice**: `client_id`, `quotation_id`, `number`, `items`, `subtotal`, `tax_*`, `total`, `status` (draft, sent, paid, overdue), `due_date`, `paid_at`. Balance due = total − payments − credit_notes + debit_notes (via `payments` and `adjustments`).
- **Payment**: `invoice_id`, `amount`, `method`, `gateway`, `gateway_payment_id`, `paid_at`. Gateways: `PaymentGatewayInterface` (Razorpay, Stripe); webhooks update Invoice/Payment.

**Constraint**: Do not replace or duplicate this pipeline. Recurring Billing (DMOS Module 13) must **drive** creation of Invoices via this model, not introduce a parallel invoicing path.

---

## 6. Extension Rules (Strict)

1. **No rewrites**: Do not change primary keys, unique constraints, or core behavior of Lead, Client, Project, Quotation, Agreement, Invoice, Payment, or their existing relationships.
2. **Additive only**: New tables link via foreign keys (e.g. `deal.client_id`, `deal.lead_id`) or polymorphic (e.g. `threads.threadable_type/id`). New columns on existing tables must be nullable or have safe defaults.
3. **Tenant scoping**: All new business tables must have `tenant_id` and use `BelongsToTenant` (or equivalent) unless they are purely global config. Financial models remain scoped via `client.tenant_id` in controllers/scopes.
4. **Reuse pricing**: Any new pricing or packaging (e.g. productized services) must extend `QuotationPricingService` or reuse ServicePrice / SubService / ComboPackage, not duplicate logic.
5. **Preserve routes**: Existing API routes for leads, clients, projects, quotations, agreements, invoices, and payments must remain; new modules get new routes and new sidebar entries.

---

## 7. Reference: Key Models and Paths

| Entity   | Model    | Tenant scope        | Key relations                          |
|----------|----------|---------------------|----------------------------------------|
| Lead     | Lead     | tenant_id (direct)  | Client (convertedToClient), Service    |
| Client   | Client   | tenant_id (direct)  | Lead, Project, Quotation, Agreement, Invoice |
| Project  | Project  | tenant_id (direct)  | Client, Quotation, Agreement, ProjectTask, TimeLog |
| Quotation| Quotation| via client          | Client, Project, QuotationService, Invoice |
| Agreement| Agreement| via client          | Client, Project, Quotation             |
| Invoice  | Invoice  | via client          | Client, Quotation, Payment, InvoiceAdjustment |
| Payment  | Payment  | via invoice→client  | Invoice                                |

This document is the single source of truth for “what must not break” when implementing DMOS extensions.
