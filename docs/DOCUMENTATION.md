# Vsparkz Digital – Full Documentation

Single reference for the Vsparkz Digital platform: backend API, admin panel, and public website.

---

## 1. Overview

| Part | Tech | Purpose |
|------|------|---------|
| **Backend** | Laravel 12, MySQL/SQLite, Sanctum | REST API only (no Blade). Auth, CRUD, block CMS, leads, clients, projects, invoices, reports. |
| **Admin** | React 19, Vite, Tailwind | Internal panel: dashboard, CMS, leads, clients, influencers, projects, campaigns, invoices, reports, tasks, settings. |
| **Website** | React 19, Vite, Tailwind | Public landing: block-based pages, contact/get-quote/influencer forms. |

**Default admin login:** `admin@vsparkzdigital.com` / `password`

---

## 2. Running the Apps

### Option A: Run everything from project root (recommended)

From the **project root** (`vsparkz/`):

```bash
# One-time: install root dependency (concurrently) and frontend deps
npm install
npm run install:all

# Start backend (in one terminal)
cd backend && php artisan serve

# Start both admin + website (in another terminal, from root)
npm run dev
```

- **Admin:** http://localhost:5173  
- **Public website (landing):** http://localhost:5174  

So: **landing page = website app on port 5174.**

### Option B: Run admin and website separately

**Backend (required for both):**

```bash
cd backend
cp .env.example .env
php artisan key:generate
# Configure DB (SQLite or MySQL), then:
php artisan migrate
php artisan db:seed
php artisan serve
```

**Admin only:**

```bash
cd admin
npm install
npm run dev
# → http://localhost:5173
```

**Website (landing) only:**

```bash
cd website
npm install
npm run dev
# → http://localhost:5174
```

If you only run `npm run dev` from inside `admin/`, you get the admin panel. The landing page is the **website** app; run it from `website/` or use root `npm run dev` to run both.

---

## 3. All Paths (Routes)

### 3.1 Public website (port 5174)

| Path | Page / behaviour |
|------|-------------------|
| `/` | Home: **Landing Page Builder** (active template) or CMS page `home` if no active template |
| `/about` | About (slug: `about`) |
| `/services` | Services (slug: `services`) |
| `/influencer-marketing` | Influencer marketing |
| `/case-studies` | Case studies |
| `/clients` | Clients |
| `/contact` | Contact form |
| `/get-quote` | Get quote form |
| `/influencer-onboarding` | Influencer sign-up form |

All CMS pages (except contact, get-quote, influencer-onboarding) load content from the API by slug; contact and forms POST to the API.

### 3.2 Admin panel (port 5173)

| Path | Page |
|------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/leads` | Leads list |
| `/leads/:id` | Lead detail (timeline, assignee, follow-up) |
| `/services` | Services CMS |
| `/pages` | Pages list |
| `/pages/:id` | Page editor (sections & blocks) |
| `/landing-builder` | **Landing Page Builder** (templates, sections, blocks, media, animations) |
| `/influencers` | Influencers |
| `/clients` | Clients |
| `/projects` | Projects (with tasks) |
| `/campaigns` | Campaigns |
| `/reports` | Reports (generate & view) |
| `/invoices` | Invoices |
| `/settings` | Settings & SEO |
| `/integrations` | Integrations (placeholders) |
| `/tasks-hr` | Standalone tasks |

### 3.3 Backend API (base: `http://127.0.0.1:8000/api`)

**Public (no auth):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/pages/{slug}` | Published page by slug (sections & blocks) |
| GET | `/landing` | **Active landing template** (template + ordered sections + blocks + media + animation config) |
| GET | `/site-settings` | **Site settings** (site_name, logo_url, site_tagline) for header/footer |
| POST | `/leads` | Submit contact / get-quote form |
| POST | `/influencers` | Submit influencer onboarding |
| POST | `/login` | Login → token |

**Admin (auth: `Authorization: Bearer <token>`):**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/logout` | Logout |
| GET | `/admin/me` | Current user |
| GET | `/admin/dashboard` | Dashboard stats (funnel, leads by source, etc.) |
| GET | `/admin/users` | Users list (for assignees) |
| CRUD | `/admin/leads` | Leads |
| CRUD | `/admin/services` | Services |
| CRUD | `/admin/pages` | Pages |
| GET/POST | `/admin/pages/{page}/sections` | Page sections |
| PUT/DELETE | `/admin/page-sections/{section}` | Section update/delete |
| POST | `/admin/page-sections/reorder` | Reorder sections |
| GET/POST | `/admin/page-sections/{section}/blocks` | Section blocks |
| PUT/DELETE | `/admin/page-blocks/{block}` | Block update/delete |
| POST | `/admin/page-blocks/reorder` | Reorder blocks |
| GET/POST | `/admin/media` | Media list / upload |
| GET/POST/PUT/DELETE | `/admin/landing-templates` | Landing templates (list, create, show, update, delete) |
| POST | `/admin/landing-templates/{template}/activate` | Set template as active (only one active for public) |
| GET/POST | `/admin/landing-templates/{template}/sections` | Template sections (list, create) |
| PUT/DELETE | `/admin/landing-sections/{section}` | Section update/delete |
| POST | `/admin/landing-sections/reorder` | Reorder sections |
| GET/POST | `/admin/landing-sections/{section}/blocks` | Section blocks (list, create) |
| PUT/DELETE | `/admin/landing-blocks/{block}` | Block update/delete |
| POST | `/admin/landing-blocks/reorder` | Reorder blocks |
| CRUD | `/admin/influencers` | Influencers |
| CRUD | `/admin/clients` | Clients |
| CRUD | `/admin/projects` | Projects |
| GET/POST | `/admin/projects/{project}/tasks` | Project tasks |
| PUT/DELETE | `/admin/project-tasks/{projectTask}` | Project task update/delete |
| CRUD | `/admin/campaigns` | Campaigns |
| GET/POST | `/admin/reports` | Reports (generate) |
| GET | `/admin/reports/{report}` | Report detail |
| CRUD | `/admin/quotations` | Quotations |
| CRUD | `/admin/invoices` | Invoices |
| POST | `/admin/payments` | Record payment |
| CRUD | `/admin/tasks` | Standalone tasks |
| GET/POST | `/admin/time-logs` | Time logs |
| DELETE | `/admin/time-logs/{timeLog}` | Delete time log |
| CRUD | `/admin/leaves` | Leaves |
| CRUD | `/admin/payrolls` | Payrolls |
| GET/PUT | `/admin/settings` | Settings |

---

## 4. Project structure

```
vsparkz/
├── backend/           # Laravel API
│   ├── app/Http/Controllers/Admin/   # Admin API controllers
│   ├── app/Http/Controllers/Public/ # Public Page, Lead, Influencer
│   ├── app/Models/
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── routes/api.php
│   └── public/
├── admin/             # React admin (port 5173)
│   ├── src/pages/
│   ├── src/components/
│   ├── src/lib/api.js
│   └── vite.config.js
├── website/           # React public site – landing (port 5174)
│   ├── src/pages/
│   ├── src/components/blocks/
│   ├── src/lib/api.js
│   └── vite.config.js
├── docs/
│   ├── DOCUMENTATION.md   # This file
│   ├── API.md
│   ├── SETUP.md
│   └── ARCHITECTURE.md
├── package.json       # Root scripts: dev, dev:admin, dev:website
└── README.md
```

---

## 5. Modules summary

| Area | Backend | Admin | Website |
|------|---------|-------|---------|
| Auth | Sanctum, login | Login, ProtectedRoute | — |
| Dashboard | DashboardController | Dashboard (funnel, sources) | — |
| Leads / CRM | LeadController, LeadStatusHistory | Leads, LeadDetail (assignee, follow-up, timeline) | Contact / Get quote forms → POST /leads |
| Block CMS | PageController, PageSection, PageBlock, Media | Pages list, PageEditor (sections/blocks/media) | PageBySlug, BlockRenderer |
| **Landing Page Builder** | LandingTemplate, LandingSection, LandingBlock; Public LandingController; Admin Landing*Controllers | Landing Builder: template selection, activate, sections/blocks CRUD, media, animations | Home (`/`): LandingPage fetches `/landing`, renders sections via LandingSectionRenderer + AnimatedBlock |
| Services | ServiceController | Services CRUD | — |
| Influencers | InfluencerController (admin + public) | Influencers CRUD | Influencer onboarding form |
| Clients | ClientController | Clients CRUD | — |
| Projects | ProjectController, ProjectTaskController | Projects + tasks | — |
| Campaigns | CampaignController | Campaigns (client/project) | — |
| Reports | ReportController | Reports (generate, view payload) | — |
| Invoices | Quotation, Invoice, Payment controllers | Invoices list & form | — |
| Tasks / Time / HR | Task, TimeLog, Leave, Payroll controllers | Tasks (TasksHR) | — |
| Settings | SettingController | Settings page | — |
| Integrations | — | Placeholder cards | — |

---

## 5.1 Landing Page Builder (summary)

The **Landing Page Builder** is a visual CMS for the **public home page** (`/`). Only **one template** can be active at a time; the website fetches `GET /api/landing` and renders that template’s sections and blocks.

**Admin:** Open **Landing Page Builder** from the sidebar. You can:

- **Templates:** Choose from 4 built-in templates (AI Agency, Enterprise Marketing, Influencer Marketing, Startup/SaaS). Activate one; it becomes the live home page.
- **Sections:** Per template, enable/disable sections, change layout variant (e.g. left-image, centered), set an optional **background image** (pick from library or upload new), and reorder (↑/↓).
- **Blocks:** Each section has blocks (headline, subheadline, paragraph, CTA, image, video, logo grid, icon list, counter). Edit content (JSON), attach media from the library, set aspect ratio (16:9, 1:1, 4:5), alignment, object fit, and **animation** (type, delay, duration, trigger: onLoad / onScroll).
- **Media:** When picking media for a block or section background, use **Upload new** in the media modal to upload an image (or video); it appears in the library and can be selected. Section background images are shown on the public site with a dark overlay for text readability.
- **Site logo:** In **Settings** (sidebar), under **General**, use **Site logo** → **Pick logo from library** to choose an image (PNG/SVG). It appears in the header and footer of the public website. Use **Remove logo** to revert to text-only.

**Public:** The home route loads `LandingPage`, which calls `GET /api/landing`. If an active template exists with sections, it renders them with `LandingSectionRenderer` and block-level animations (fade, slide up/left/right, zoom). If no active template or no data, it falls back to the CMS page with slug `home`.

**Seed data:** Run `php artisan db:seed` (or the `LandingSeeder`) to create the 4 templates with dummy sections and blocks. Edit or replace this content from the admin.

---

## 6. Environment

**Backend (`backend/.env`):**

- `APP_KEY` (required, run `php artisan key:generate`)
- `DB_*` (SQLite or MySQL)
- `CORS_ALLOWED_ORIGINS` – include `http://localhost:5173` and `http://localhost:5174` for local dev

**Admin (`admin/.env`):**

- `VITE_API_URL` – optional; default `http://127.0.0.1:8000/api`

**Website (`website/.env`):**

- `VITE_API_URL` – optional; default `http://127.0.0.1:8000/api`  
- Dev server uses proxy for `/api` when running from Vite (see `website/vite.config.js`).

---

## 7. Troubleshooting

| Issue | What to do |
|-------|------------|
| "The file failed to upload" or high-quality images rejected | Backend allows up to **50 MB**. If you use **php artisan serve** (no WAMP): run `php --ini` in `backend/`, edit the **Loaded Configuration File** php.ini, set `upload_max_filesize = 50M` and `post_max_size = 52M`, then **restart** `php artisan serve`. See `backend/php-upload-limits.txt`. |
| Only admin shows, no landing | Landing = **website** app. Run from root: `npm run dev` (starts admin on 5173 + website on 5174). Or run `cd website && npm run dev` and open http://localhost:5174. |
| “Backend not connected” | Start API: `cd backend && php artisan serve` (keep it running). |
| 500 on login | Run `php artisan migrate` and `php artisan db:seed` in `backend/`. Check `backend/storage/logs/laravel.log`. |
| CORS errors | Ensure backend is running and `.env` has correct `CORS_ALLOWED_ORIGINS` (e.g. `http://localhost:5173,http://localhost:5174`). |
| Root `npm run dev` fails | Run `npm install` in project root (installs `concurrently`). Ensure `admin` and `website` have their deps: `npm run install:all`. |

---

## 8. Build & deploy

- **Backend:** Deploy Laravel (e.g. Nginx + PHP-FPM). Set `APP_ENV=production`, CORS origins for production admin/website URLs.
- **Admin:** `npm run build:admin` (or `cd admin && npm run build`). Deploy `admin/dist`. Set `VITE_API_URL` at build time.
- **Website:** `npm run build:website` (or `cd website && npm run build`). Deploy `website/dist` as the main marketing/landing site.

---

**Workflow & modules:** End-to-end workflow (Lead → Client → Project → Quotation → Agreement → Assign Project → Portal), website pricing/custom package with freelancer selection, client portal, and package generator: **[WORKFLOW-AND-MODULES.md](WORKFLOW-AND-MODULES.md)**.

**PRD implementation:** Product requirements, implemented vs gaps, and phase plan: **[PRD-IMPLEMENTATION-ROADMAP.md](PRD-IMPLEMENTATION-ROADMAP.md)**.

For more detail: **API** → [docs/API.md](API.md), **Setup** → [docs/SETUP.md](SETUP.md), **Architecture** → [docs/ARCHITECTURE.md](ARCHITECTURE.md).
