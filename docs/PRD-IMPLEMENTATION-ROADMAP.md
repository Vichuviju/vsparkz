# V-Sparkz – PRD Implementation Roadmap

This document maps the **Product Requirement & Functional Specification** to the current codebase and tracks implemented vs missing modules.

---

## 1. Implemented / In Place

| PRD Section | Current State | Notes |
|-------------|---------------|------|
| **Lead → Client conversion** | ✅ Lead detail has "Convert to Client"; status change to "Converted" also creates client | `LeadController::convertToClient`, `update()` |
| **Lead management** | ✅ Leads list, detail, status, assignee, follow-up, timeline, activities, convert | Multiple sources, manual create |
| **Client management** | ✅ Add/List/Profile (ClientDetail), from lead or manual | Source shown |
| **Project creation** | ✅ Client link, name, campaign type, status, start/end dates, stage, next appointment | Service selection added in roadmap |
| **Requirement gathering** | ✅ Client, project, service_ids, expectations, selected_requirements; list/view/edit | File uploads & templates in progress |
| **Strategy report** | ✅ CRUD, PDF, send/approve, estimated budget | |
| **Quotation & Agreement** | ✅ CRUD, approval tracking | |
| **Invoicing & payments** | ✅ Invoices, payments, PDF | |
| **Services / Sub-services / Pricing / Combo** | ✅ Masters: Services, SubServices, PricingLevels, ServicePrices, ComboPackages | |
| **Freelancers** | ✅ FreelancersAdmin CRUD | |
| **Influencers** | ✅ CRUD, public onboarding form | |
| **Dashboard** | ✅ KPIs, funnel, sources, revenue, theme | |
| **Landing builder** | ✅ Templates, sections, blocks, media, animations | |
| **Auth** | ✅ Login, Sanctum, role-aware | Register/OAuth/2FA = future |
| **Public website** | ✅ Landing, contact, get-quote, influencer form, CMS pages | Pricing section = roadmap |

---

## 2. Gaps & Roadmap (Priority Order)

### Phase 1 – Quick wins (this implementation)

| Item | Action | Status |
|------|--------|--------|
| Convert to Client button | Already on lead detail; ensure prominent | ✅ Done |
| Project creation | Add **service selection** (service_id), full **timeline** (stage, next appointment) in form | ✅ Done |
| Requirement gathering | **File uploads** (documents), **predefined requirement templates** | ✅ Done |
| **SEO Analyzer** | Admin tool page wired to POST /tools/seo-analyze; public page already uses it | ✅ Done |
| Public landing | **Pricing section** (DefaultLanding uses GET /plans); Plans admin + PlanSeeder | ✅ Done |
| **Print/display templates** | Quotation PDF ✅; Invoice PDF ✅; Agreement PDF ✅; Download buttons in admin | ✅ Done |
| **Requirement templates** | Admin CRUD page (list/create/edit); backend index supports ?active_only=1 | ✅ Done |

### Phase 2 – PRD alignment

| Module | Gaps |
|--------|------|
| **Public site** | Pricing plans block, SEO Analyzer demo (1 free use → login), testimonials |
| **Auth** | Register, Forgot password, Google/Facebook OAuth, 2FA |
| **Client dashboard** | SEO Analyzer, Strategy Planner, Campaign reports, Invoices, Influencer/Freelancer hire |
| **Master config** | Service: Category, Type (one-time/recurring), Default duration, Dependencies |
| **Freelancer** | Portfolio, pricing levels, commission %, availability, matching on assign |
| **Influencer** | Platform, followers, gender/location ratio, pricing per post/reel, bulk message |
| **Project & follow-up** | Requirement calls log, next appointment, stage tracking (partially done) |
| **Enrollment & plan** | Monthly/Yearly/Custom, dynamic pricing, freelancer vs team selection |
| **Financial** | Advance, milestones, change request, credit/debit notes, GST reports, Razorpay/Stripe |
| **Execution** | Service-wise tasks, freelancer access, content approvals |
| **Content & campaign** | Calendar, content types, influencer mapping, campaign types |
| **Reporting** | SEO/SMM/Ads/Influencer report types, PDF/Excel export |
| **AI** | SEO recommendations, keyword planner, strategy, content ideas |
| **SaaS / multi-tenant** | Agency onboarding, white-label, agency pricing, usage limits |

### Phase 3 – Future

- Client portal mobile app  
- WhatsApp bot, auto proposal, AI contract analysis  
- Marketplace for services  

---

## 3. Tech Stack (per PRD)

| Layer | Tech |
|-------|------|
| Frontend | React + Tailwind ✅ |
| Backend | Laravel ✅ |
| Auth | Sanctum ✅ |
| DB | MySQL / SQLite ✅ |
| AI | OpenAI / Gemini (future) |
| Hosting | AWS / DigitalOcean |

---

## 4. Workflow Summary

1. **Lead** (website forms / manual / Meta/Google) → Lead list/detail → Status, assignee, follow-up → **Convert to Client** → Client created, lead linked.
2. **Client** → Add project (client, service, timeline) → Requirement gathering (forms, files, templates) → Strategy report → Quotation → Agreement.
3. **Project** → Tasks, campaigns, execution → Invoicing & payments → Reporting.

---

*Last updated from PRD and codebase review.*
