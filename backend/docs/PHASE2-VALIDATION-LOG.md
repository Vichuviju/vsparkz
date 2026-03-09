# Phase 2 — Logical Validation Log

## Validated Rules

1. **Lead → Client**: `POST /admin/leads/{lead}/convert-to-client` creates Client with `lead_id`, sets `Lead.converted_to_client_id` and `status = converted`, in DB transaction. One lead → one client. No parallel lead entity. **OK.**

2. **Project workflow**: Constants on Project model (WORKFLOW_*). Transitions not in single config; recommended for Phase 4.

3. **Quotation → Agreement**: Agreement has quotation_id, project_id; enforced in validation. **OK.**

4. **Invoice → Payment**: Invoice has `balance_due` accessor (total − payments − credit_notes + debit_notes). PaymentController now scopes invoice by `whereHas('client', forTenant)` before creating payment. **Fixed.**

5. **Recurring billing**: BillingService does not create Invoices. When implemented, must use existing Invoice model only. **OK.**

6. **Deals / Forms / Attribution**: Deal has lead_id, client_id only. **OK.**

7. **Tenant isolation**: BelongsToTenant trait now has `scopeForAgency` (alias for tenant_id scoping). Lead/Client/Project controllers using forAgency() now work. PaymentController store scopes invoice by client. **Fixed.**

8. **Global scopes**: Quotation, Agreement, Invoice, Payment have no global tenant scope; access via client. **OK.**

## Fixes Applied (Phase 2)

- `backend/app/Models/Concerns/BelongsToTenant.php`: Added `scopeForAgency()` that delegates to `scopeForTenant()` so existing controller calls to `Model::forAgency()` work with tenant_id.
- `backend/app/Http/Controllers/Admin/PaymentController.php`: Before creating a payment, invoice is loaded with `whereHas('client', fn ($q) => $q->forTenant())`; 404 if not found (tenant isolation).
