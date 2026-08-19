# Go Live — Backend + Frontend

Host the full Vsparkz platform for free using **Render** (API + database) and **GitHub Pages** (website + admin).

---

## Live URLs (after setup)

| App | URL |
|-----|-----|
| **Public website** | https://vichuviju.github.io/vsparkz/ |
| **Admin panel** | https://vichuviju.github.io/vsparkz/admin/ |
| **API** | https://vsparkz-api.onrender.com/api *(your Render URL)* |

---

## Step 1 — Deploy backend on Render (free)

1. Sign in at [render.com](https://render.com) with your GitHub account.
2. Click **New → Blueprint** and connect repo `Vichuviju/vsparkz`.
3. Render reads `render.yaml` and creates **vsparkz-api** automatically.
4. Wait for deploy to finish (~5 min). Copy your API URL, e.g. `https://vsparkz-api.onrender.com`.

**Or one-click:**  
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Vichuviju/vsparkz)

Verify: open `https://YOUR-API.onrender.com/api/health` — should show `"database":"connected"`.

> Free tier sleeps after 15 min idle. First request may take ~30 seconds to wake up.

---

## Step 2 — Connect frontends to the API

1. Open https://github.com/Vichuviju/vsparkz/settings/variables/actions
2. Add these **Repository variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://vsparkz-api.onrender.com/api` *(your Render URL + /api)* |
| `VITE_ADMIN_URL` | `https://vichuviju.github.io/vsparkz/admin` |

3. Go to **Actions → Deploy Frontends to GitHub Pages → Run workflow** (rebuild with API URL).

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
GitHub Pages (static)          Render (PHP + SQLite)
┌─────────────────────┐        ┌──────────────────────┐
│ /vsparkz/   website │───────▶│ vsparkz-api          │
│ /vsparkz/admin/     │  API   │ Laravel + database   │
└─────────────────────┘        └──────────────────────┘
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
