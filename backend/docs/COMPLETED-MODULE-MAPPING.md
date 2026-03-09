# Completed Module Mapping (Post–Full System Completion)

## Core (locked – unchanged)

| Module    | Attachment        | Services              | Main routes                          |
|-----------|-------------------|------------------------|--------------------------------------|
| Leads     | tenant_id         | —                      | /admin/leads, POST .../convert-to-client |
| Clients   | tenant_id         | —                      | /admin/clients                       |
| Projects  | tenant_id, client_id | —                    | /admin/projects                      |
| Quotations| client_id, project_id | QuotationPricingService | /admin/quotations                 |
| Agreements| client_id, project_id, quotation_id | — | /admin/agreements                 |
| Invoices  | client_id, quotation_id | —                  | /admin/invoices                     |
| Payments  | invoice_id        | —                      | /admin/payments, gateway webhooks   |

## DMOS (additive)

| Module           | Attachment              | Services           | Main routes                                      |
|------------------|-------------------------|--------------------|--------------------------------------------------|
| Deals            | tenant_id, client_id, lead_id | DealService   | GET/POST /admin/deals, GET/PUT/DELETE /admin/deals/{id}, GET /admin/deal-stages |
| Vendors          | tenant_id               | VendorService      | GET/POST /admin/vendors, GET/PUT/DELETE /admin/vendors/{id} |
| Brands           | tenant_id               | BrandManagementService | GET /admin/brands, GET /admin/brands/{id}     |
| Workflow templates | tenant_id             | WorkflowEngineService | GET /admin/workflow-templates, GET .../{id}  |
| Knowledge spaces | tenant_id               | KnowledgeBaseService | GET /admin/knowledge-spaces, GET .../{id}    |
| Keywords (SEO)   | tenant_id               | SeoWorkspaceService | GET /admin/keywords, GET .../{id}             |
| Contact lists    | tenant_id               | EmailAutomationService | GET /admin/contact-lists                   |
| Onboarding       | tenant_id, client_id    | ClientOnboardingService | GET /admin/onboarding-questionnaires      |
| Automation workflows | tenant_id            | AutomationEngineService | GET /admin/automation-workflows         |
| Report templates | tenant_id               | —                   | GET /admin/report-templates, GET .../{id}       |
| Forms            | tenant_id               | FormPlatformService | GET /admin/forms, GET .../{id}                  |
| Service packages | tenant_id               | ProductizedServicesService | GET /admin/service-packages           |
| Branding         | tenant_id               | BrandingService    | GET /admin/branding                             |
| Content calendar | (project_id, campaign_id) | —               | /admin/content-calendar (apiResource)           |
| Campaigns        | tenant_id, client_id, project_id | CampaignService | /admin/campaigns (apiResource)              |

All financial access (Quotation, Agreement, Invoice, Payment) is scoped via `client.tenant_id`. No alternate invoicing path; recurring billing will only create Invoices via existing flow.
