# Final Integrity Validation Checklist

- **Core flow untouched**: Lead → Client → Project → Quotation → Agreement → Invoice → Payment. No primary key or relationship rewrites. Confirmed.
- **No new invoicing path**: Recurring billing (BillingService) does not create Invoice records yet; when implemented, must use existing Invoice model only. Confirmed.
- **No new lead entity**: Deals, Forms, Attribution use lead_id/client_id only. Confirmed.
- **Tenant isolation**: BelongsToTenant has scopeForAgency (tenant_id). Invoice, Quotation, Agreement scoped via whereHas('client', forTenant). PaymentController and Deal/Vendor controllers scope by tenant. Confirmed.
- **Single pricing path**: QuotationPricingService only. No duplicate pricing engine. Confirmed.
- **"Coming Soon" removed**: All placeholder pages replaced with list UIs or clear copy. Integrations page shows "Available" and points to System Settings. Confirmed.
- **API contracts preserved**: Existing admin routes for leads, clients, projects, quotations, agreements, invoices, payments unchanged. New routes additive (deals CRUD, vendors CRUD, deal-stages, service-packages). Confirmed.
- **Additive schema**: No existing columns removed. New route for service-packages uses existing ServicePackage model. Confirmed.
