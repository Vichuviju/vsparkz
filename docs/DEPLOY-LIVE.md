# Go Live — Backend + Frontend

Host the full Vsparkz platform for free using **Render** (API), **Neon** (PostgreSQL database), and **GitHub Pages** (website + admin).

---

## Live URLs (after setup)

| App | URL |
|-----|-----|
| **Public website** | https://vichuviju.github.io/vsparkz/ |
| **Admin panel** | https://vichuviju.github.io/vsparkz/admin/ |
| **API** | https://vsparkz-api.onrender.com/api |
| **Database** | [Neon Console](https://console.neon.tech) *(after setup)* |

---

## Step 1 — Deploy backend on Render (free)

Render free tier uses **Docker** (no native PHP, no disks).

1. Sign in at [render.com](https://render.com) with GitHub.
2. **New → Blueprint** → repo `Vichuviju/vsparkz`, branch `main`, path `render.yaml`.
3. Click **Apply** — creates **vsparkz-api** (Docker).

Verify: `https://vsparkz-api.onrender.com/api/health`

> Free tier sleeps after ~15 min idle (first request can take ~30s).

---

## Step 1b — Connect Neon PostgreSQL (free, persistent)

Without Neon, data resets on every redeploy. **Recommended for production.**

1. Create free DB at https://neon.tech (no credit card).
2. Copy the **connection string** (`postgresql://...?sslmode=require`).
3. Render → **vsparkz-api** → **Environment** → set:
   - `DB_CONNECTION` = `pgsql`
   - `DB_URL` = *(paste Neon connection string)*
   - `DB_SSLMODE` = `require`
4. Save — Render redeploys. Check `/api/health` shows `"database":"connected"`.

Full guide: **[docs/NEON-DATABASE.md](NEON-DATABASE.md)**

---

## Step 2 — Connect frontends to the API

1. Open https://github.com/Vichuviju/vsparkz/settings/variables/actions
2. Add these **Repository variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://vsparkz-api.onrender.com/api` |
| `VITE_ADMIN_URL` | `https://vichuviju.github.io/vsparkz/admin` |

> The deploy workflow already uses these URLs by default if variables are not set.

3. Go to **Actions → Deploy Frontends to GitHub Pages → Run workflow** (or push to `main` to auto-deploy).

### Render outbound IPs (optional)

If an external service needs to allowlist Render traffic from `vsparkz-api`, use:

- `74.220.48.0/24`
- `74.220.56.0/24`

These are stored in `render.yaml` as `RENDER_OUTBOUND_IP_RANGES` for reference.

---

## Step 3 — Enable GitHub Pages

1. Open https://github.com/Vichuviju/vsparkz/settings/pages
2. **Source** → **GitHub Actions**

---

## Step 4 — Log in

- **Admin:** https://vichuviju.github.io/vsparkz/admin/login  
- **Email:** `admin@vsparkzdigital.com`  
- **Password:** `password`

---

## Local development

Double-click **`start-all.bat`** in the project root, or:

```powershell
.\start-backend.bat    # API on :8000
npm run dev            # admin :5173 + website :5174
```

---

## Architecture

```
GitHub Pages (static)          Render (Docker)              Neon (PostgreSQL)
┌─────────────────────┐        ┌──────────────────────┐     ┌─────────────────┐
│ /vsparkz/   website │───────▶│ vsparkz-api          │────▶│ Free persistent │
│ /vsparkz/admin/     │  API   │ Laravel API          │     │ database        │
└─────────────────────┘        └──────────────────────┘     └─────────────────┘
```

GitHub Pages cannot run PHP or a database — only Render (or similar) can host the backend.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Website shows default landing only | Set `VITE_API_URL` in GitHub variables and re-run deploy workflow |
| Admin says "Backend not connected" | Check Render API is awake; visit `/api/health` |
| CORS error | Ensure `CORS_ALLOWED_ORIGINS` in Render includes `https://vichuviju.github.io` |
| Slow first load | Render free tier waking from sleep — normal |

More: [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md)
