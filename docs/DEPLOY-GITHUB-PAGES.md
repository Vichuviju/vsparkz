# Deploy Public Website on GitHub Pages

Your public React website (`website/`) can go live automatically from GitHub whenever you push to `main`.

**Live URL (after setup):** https://vichuviju.github.io/vsparkz/

---

## One-time setup on GitHub

### 1. Enable GitHub Pages

1. Open https://github.com/Vichuviju/vsparkz/settings/pages
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Save (no branch selection needed — the workflow handles deployment)

### 2. (Optional) Set production API URLs

If your Laravel API is already hosted somewhere, add repository variables so the live site can talk to it:

1. Go to **Settings → Secrets and variables → Actions → Variables**
2. Add:
   - `VITE_API_URL` — e.g. `https://api.yourdomain.com/api`
   - `VITE_ADMIN_URL` — e.g. `https://admin.yourdomain.com`

Without these, the site still loads but login, CMS pages, and forms will call `http://127.0.0.1:8000` (localhost) and fail in production.

### 3. Push the deployment files

Commit and push the workflow + website config to `main`:

```powershell
cd C:\xampp\htdocs\vsparkz
git add .github/workflows/deploy-website.yml website/vite.config.js website/src/main.jsx website/package.json website/.env.pages package.json docs/DEPLOY-GITHUB-PAGES.md
git commit -m "Add GitHub Pages deployment for public website"
git push origin main
```

### 4. Verify deployment

1. Open **Actions** tab on GitHub — workflow **Deploy Website to GitHub Pages** should run
2. When it finishes, visit https://vichuviju.github.io/vsparkz/

---

## How it works

| Piece | Purpose |
|-------|---------|
| `.github/workflows/deploy-website.yml` | Builds `website/` and publishes to GitHub Pages |
| `website/.env.pages` | Sets base path `/vsparkz/` for project-page URLs |
| `npm run build:pages` | Local test build matching GitHub Pages output |
| `404.html` copy | Lets React Router handle direct links (e.g. `/contact`) |

The workflow runs when:

- You push to `main` and change files under `website/` or the workflow file
- You manually trigger it from **Actions → Deploy Website to GitHub Pages → Run workflow**

---

## Test build locally

```powershell
cd website
npm install
npm run build:pages
npm run preview
```

Open the preview URL shown in the terminal. Routes use the `/vsparkz/` prefix like on GitHub Pages.

---

## Custom domain (optional)

1. Add a `website/public/CNAME` file with your domain (e.g. `www.vsparkzdigital.com`)
2. In GitHub **Settings → Pages**, set the custom domain
3. Update `website/.env.pages` to use `VITE_BASE_PATH=/` instead of `/vsparkz/`
4. Point your DNS A/CNAME records to GitHub Pages

---

## Backend note

GitHub Pages serves **static files only**. The Laravel API (`backend/`) must be deployed separately (VPS, Railway, Render, etc.). See [README.md](../README.md) deployment section.

For full platform hosting options, see [GIT-GITHUB.md](GIT-GITHUB.md) for pushing code and this file for the public site.
