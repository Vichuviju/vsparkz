# Vsparkz Digital – Agency Platform

Professional digital marketing agency platform: API-first Laravel backend + React admin panel.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)** | **Single file:** all paths, setup, running admin + website, API summary, troubleshooting |
| **[docs/WORKFLOW-AND-MODULES.md](docs/WORKFLOW-AND-MODULES.md)** | **Workflow:** Lead → Client → Project → Quotation → Agreement → Assign Project → Portal; pricing, custom package, freelancer selection, package generator |
| **[docs/GIT-GITHUB.md](docs/GIT-GITHUB.md)** | **Connect to GitHub:** init, remote, commit, push |
| **[README.md](README.md)** (this file) | Overview, quick start, links |
| **[docs/SETUP.md](docs/SETUP.md)** | Step-by-step setup (backend + admin + website) |
| **[docs/API.md](docs/API.md)** | Full API reference (endpoints, request/response) |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Project structure, modules, database, auth flow |

---

## Tech stack

- **Backend:** Laravel 12, MySQL or SQLite, Laravel Sanctum (API tokens)
- **Admin UI:** React 19, Vite, Tailwind CSS, React Router, Axios
- **Architecture:** REST API only (no Blade views)

---

## Quick start

### 1. Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
```

**Database:** Use SQLite (default) or MySQL. For SQLite, create `backend/database/database.sqlite` if missing.

```bash
php artisan migrate
php artisan db:seed
php artisan serve
```

API runs at **http://127.0.0.1:8000**. Leave this terminal running.

**Default admin:** `admin@vsparkzdigital.com` / `password`

### 2. Admin + Public website (React)

From the **project root** (so both admin and landing run):

```bash
npm install
npm run install:all
npm run dev
```

- **Admin panel:** http://localhost:5173 (log in with the credentials above)
- **Public website (landing):** http://localhost:5174

To run only one app: `npm run dev:admin` (admin) or `npm run dev:website` (landing). See **[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)** for all paths and details.

---

## Project structure

```
vsparkz/
├── backend/     # Laravel API (controllers, models, migrations, routes)
├── admin/       # React admin panel (port 5173)
├── website/     # React public website – landing (port 5174)
├── docs/        # Documentation (DOCUMENTATION, SETUP, API, ARCHITECTURE)
├── package.json # Root scripts: npm run dev (both), dev:admin, dev:website
└── README.md
```

---

## Modules

| Module | Description |
|--------|-------------|
| **Auth** | Login / logout, token in localStorage, protected routes |
| **Dashboard** | Total leads, leads this month, top service, recent enquiries |
| **Leads** | List, filter, search; update status (new/contacted/closed) and internal notes |
| **Services** | CMS: agency services (title, slug, description, active) |
| **Pages** | CMS: website pages + SEO (meta title, description, keywords) |
| **Campaigns** | Influencer campaigns (name, client, reach, engagement, result) |
| **Settings** | Site name, default SEO, contact info |

---

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | No | Login → token |
| GET | `/api/health` | No | Health check |
| POST | `/api/admin/logout` | Yes | Logout |
| GET | `/api/admin/me` | Yes | Current user |
| GET | `/api/admin/dashboard` | Yes | Dashboard stats |
| CRUD | `/api/admin/leads` | Yes | Leads |
| CRUD | `/api/admin/services` | Yes | Services |
| CRUD | `/api/admin/pages` | Yes | Pages (CMS + SEO) |
| CRUD | `/api/admin/campaigns` | Yes | Campaigns |
| GET/PUT | `/api/admin/settings` | Yes | Settings & SEO |

All admin routes require header: `Authorization: Bearer <token>`.

Full reference: **[docs/API.md](docs/API.md)**

---

## Environment

**Backend (`backend/.env`):**

- `APP_KEY` – Required (run `php artisan key:generate`)
- `DB_CONNECTION`, `DB_DATABASE`, etc. – Database
- `CORS_ALLOWED_ORIGINS` – Optional; default allows `http://localhost:5173`, `http://127.0.0.1:5173`

**Admin (`admin/.env`):**

- `VITE_API_URL` – Optional; default `http://127.0.0.1:8000/api`

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Backend not connected” | Run `php artisan serve` from the **backend** folder and leave it running. |
| 500 on login | Run `php artisan migrate` and `php artisan db:seed` in backend. Check `backend/storage/logs/laravel.log`. |
| CORS error | Ensure backend is running from **backend** and `.env` has correct `CORS_ALLOWED_ORIGINS`. Admin uses direct URL `http://127.0.0.1:8000/api`. |

More: **[docs/SETUP.md](docs/SETUP.md)** (Troubleshooting section).

---

## Deployment (outline)

- **Laravel API:** Deploy to VPS (e.g. Nginx + PHP-FPM), domain e.g. `api.vsparkzdigital.com`
- **React admin:** `cd admin && npm run build`, deploy `admin/dist` to e.g. `admin.vsparkzdigital.com`
- Set `VITE_API_URL` at build time to your production API URL
- Set backend `.env`: `CORS_ALLOWED_ORIGINS=https://admin.vsparkzdigital.com`

---

Built for **Vsparkz Digital**. Clean, maintainable, scalable for agency use and future SaaS.
"# vsparkz" 
