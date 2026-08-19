# Neon PostgreSQL — Free Database Setup

Connect a **free, persistent** PostgreSQL database to your live Vsparkz API on Render.

---

## Why Neon?

| | SQLite (current fallback) | Neon PostgreSQL |
|--|---------------------------|-----------------|
| **Cost** | Free | Free (0.5 GB) |
| **Data persists** | No (resets on redeploy) | Yes |
| **View data** | Render shell only | Neon SQL Editor + admin panel |
| **Credit card** | — | Not required |

---

## Step 1 — Create Neon database

1. Go to https://neon.tech and sign up (free, no card).
2. Click **New Project** → name it `vsparkz`.
3. Open your project → **Dashboard** → **Connection details**.
4. Copy the **connection string** (starts with `postgresql://...`).

Example:
```
postgresql://neondb_owner:abc123@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Step 2 — Add to Render

1. Open [Render Dashboard](https://dashboard.render.com) → **vsparkz-api** → **Environment**.
2. Add or update:

| Key | Value |
|-----|-------|
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | *(paste full Neon connection string)* |
| `DB_SSLMODE` | `require` |

3. **Remove** old SQLite vars if present:
   - `DB_DATABASE=/var/www/database/database.sqlite`

4. Click **Save Changes** — Render redeploys automatically.

---

## Step 3 — Verify

After deploy (~5 min):

1. **API health:** https://vsparkz-api.onrender.com/api/health  
   Should show: `"database":"connected"`

2. **Admin login:** https://vichuviju.github.io/vsparkz/admin/login  
   - Email: `admin@vsparkzdigital.com`  
   - Password: `password`

3. **Neon console:** https://console.neon.tech → your project → **Tables**  
   You should see Laravel tables (`users`, `leads`, `clients`, etc.)

---

## View / query data in Neon

1. Neon Dashboard → your project → **SQL Editor**
2. Example queries:

```sql
SELECT id, name, email, role FROM users LIMIT 10;
SELECT id, name, email, status FROM leads ORDER BY created_at DESC LIMIT 20;
SELECT COUNT(*) FROM clients;
```

---

## Use Neon locally (optional)

In `backend/.env`, replace SQLite with:

```env
DB_CONNECTION=pgsql
DB_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

Then run:

```powershell
cd backend
.\php8\php.exe artisan migrate --force
.\php8\php.exe artisan db:seed --force
.\php8\php.exe artisan serve
```

Local and live will share the same database.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `database: disconnected` on health | Check `DB_URL` in Render; ensure `sslmode=require` |
| Migration fails on deploy | Check Render **Logs**; verify Neon project is active |
| Neon paused (cold start) | Free tier pauses after inactivity — first query wakes it (~1s) |
| Connection refused | Copy connection string again from Neon; password may have special chars — URL-encode if needed |

---

## Alternative: Supabase

Same steps — use Supabase **Project Settings → Database → Connection string (URI)** as `DB_URL` in Render.
