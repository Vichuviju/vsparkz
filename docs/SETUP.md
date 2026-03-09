# Vsparkz Digital – Setup Guide

## Requirements

- **PHP** 8.2+ (with extensions: pdo, mbstring, openssl, tokenizer, xml, ctype, json)
- **Composer**
- **Node.js** 18+ and **npm**
- **MySQL** or **SQLite** (for local dev)

---

## 1. Clone / open project

```bash
cd c:\wamp64\www\vsparkz
```

---

## 2. Backend (Laravel)

### 2.1 Install and configure

```bash
cd backend
cp .env.example .env
php artisan key:generate
```

### 2.2 Database

**Option A – SQLite (simplest for local)**

```bash
# Windows (PowerShell)
New-Item -Path database\database.sqlite -ItemType File -Force

# Or create empty file: backend/database/database.sqlite
```

In `.env` keep:

```
DB_CONNECTION=sqlite
```

**Option B – MySQL**

In `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vsparkz
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create the database (e.g. in MySQL):

```sql
CREATE DATABASE vsparkz;
```

### 2.3 Migrate and seed

```bash
php artisan migrate
php artisan db:seed
```

After pulling new code, run `php artisan migrate` again to apply new migrations (e.g. `plans` table, `service_id` on projects). Running `db:seed` will seed sample plans for the landing pricing section.

### 2.4 Start the API server

```bash
php artisan serve
```

You should see: **Server running on [http://127.0.0.1:8000]**

Leave this terminal open. Default admin:

- **Email:** `admin@vsparkzdigital.com`
- **Password:** `password`

### 2.5 Composer / PDF (troubleshooting)

If `composer install` or `composer update` times out (e.g. when installing `barryvdh/laravel-dompdf` or updating Laravel), or you see "laravel/framework ... No such file or directory":

1. **Use dist and a longer timeout** (already set in `composer.json`: `process-timeout: 900`, `preferred-install: dist`).
2. From `backend`, run:
   ```bash
   composer install --prefer-dist
   ```
   If it still times out, run it again; Composer will resume. You can also run `composer config process-timeout 1200` for a 20-minute timeout.
3. **PDF generation** uses `app('dompdf.wrapper')` and requires the package `barryvdh/laravel-dompdf` to be installed. Once `composer install` completes, PDF downloads (invoices, quotations, agreements, strategy reports) will work.

### 2.6 Optional: CORS / admin URL

If the admin runs on a different origin, set in `backend/.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 3. Admin (React)

### 3.1 Install

```bash
cd admin
npm install
```

### 3.2 API URL (optional)

If the API is not at `http://127.0.0.1:8000`, create `admin/.env`:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

### 3.3 Start dev server

```bash
npm run dev
```

Open **http://localhost:5173** and log in with the backend credentials above.

---

## 4. Verify

1. **Backend:** Open **http://127.0.0.1:8000/api/health** – you should see `{"ok":true,"message":"Vsparkz API"}`.
2. **Admin:** Open **http://localhost:5173/login** – you should see “Backend connected” and be able to log in.

---

## 5. Build for production (admin)

```bash
cd admin
# Set your production API URL
echo VITE_API_URL=https://api.yourdomain.com/api > .env.production
npm run build
```

Deploy the contents of `admin/dist` to your web server or CDN.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Backend not connected” | Ensure `php artisan serve` is running from the `backend` folder. |
| 500 on login | Run `php artisan migrate` and `php artisan db:seed` in `backend`. Check `backend/storage/logs/laravel.log`. |
| CORS error | Ensure you use the correct API URL and that `backend/.env` has `CORS_ALLOWED_ORIGINS` for your admin URL. |
| Port 8000 in use | Stop the other process or run `php artisan serve --port=8001` and set `VITE_API_URL=http://127.0.0.1:8001/api` in admin. |
