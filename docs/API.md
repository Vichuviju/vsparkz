# Vsparkz Digital – API Reference

Base URL (local): `http://127.0.0.1:8000/api`

All protected endpoints require the header: `Authorization: Bearer <token>`.

---

## Authentication

### POST /api/login

Login and get a Sanctum token.

**Request**

```json
{
  "email": "admin@vsparkzdigital.com",
  "password": "password"
}
```

**Response (200)**

```json
{
  "token": "1|abc...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@vsparkzdigital.com",
    "role": "admin"
  }
}
```

**Errors**

- `422` – Validation (invalid email/password or missing fields)
- `500` – Server error (e.g. database not set up)

---

### POST /api/admin/logout

Revoke the current token. Requires auth.

**Response (200)**

```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/admin/me

Get the current authenticated user. Requires auth.

**Response (200)**

```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@vsparkzdigital.com",
  "role": "admin"
}
```

---

## Health

### GET /api/health

Health check (no auth, no database). Use to verify the API is up.

**Response (200)**

```json
{
  "ok": true,
  "message": "Vsparkz API"
}
```

---

## Dashboard

### GET /api/admin/dashboard

Dashboard analytics. Requires auth.

**Response (200)**

```json
{
  "total_leads": 10,
  "leads_this_month": 3,
  "top_requested_service": {
    "service_id": 1,
    "title": "SEO",
    "count": 5
  },
  "recent_enquiries": [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com",
      "status": "new",
      "service": { "id": 1, "title": "SEO" },
      "created_at": "2026-01-31T12:00:00.000000Z"
    }
  ]
}
```

---

## Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/leads | List leads (query: `status`, `search`, `page`, `per_page`) |
| POST | /api/admin/leads | Create lead |
| GET | /api/admin/leads/{id} | Get lead |
| PUT | /api/admin/leads/{id} | Update lead (status, notes) |
| DELETE | /api/admin/leads/{id} | Delete lead |

**Lead statuses:** `new`, `contacted`, `closed`

**Create lead (POST) body example**

```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Acme",
  "service_id": 1,
  "subject": "Enquiry",
  "message": "Hello...",
  "status": "new",
  "source": "website"
}
```

**Update lead (PUT) body example**

```json
{
  "status": "contacted",
  "notes": "Called back on 31 Jan."
}
```

---

## Services (CMS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/services | List services |
| POST | /api/admin/services | Create service |
| GET | /api/admin/services/{id} | Get service |
| PUT | /api/admin/services/{id} | Update service |
| DELETE | /api/admin/services/{id} | Delete service |

**Create/update body:** `title`, `slug` (optional), `description`, `icon`, `image`, `sort_order`, `is_active`

---

## Pages (CMS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/pages | List pages |
| POST | /api/admin/pages | Create page |
| GET | /api/admin/pages/{id} | Get page |
| PUT | /api/admin/pages/{id} | Update page |
| DELETE | /api/admin/pages/{id} | Delete page |

**Create/update body:** `slug`, `title`, `content`, `meta_title`, `meta_description`, `meta_keywords`, `og_image`, `is_published`

---

## Campaigns (Influencer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/campaigns | List campaigns (query: `status`, `page`, `per_page`) |
| POST | /api/admin/campaigns | Create campaign |
| GET | /api/admin/campaigns/{id} | Get campaign |
| PUT | /api/admin/campaigns/{id} | Update campaign |
| DELETE | /api/admin/campaigns/{id} | Delete campaign |

**Create/update body:** `name`, `client`, `influencer_name`, `platform`, `influencer_reach`, `engagement_rate`, `result_summary`, `start_date`, `end_date`, `status` (`active`, `completed`, `paused`)

---

## Settings

### GET /api/admin/settings

Get all settings as key-value. Requires auth.

**Response (200)**

```json
{
  "site_name": "Vsparkz Digital",
  "meta_title": "...",
  "contact_email": "..."
}
```

### PUT /api/admin/settings

Update settings. Requires auth.

**Request**

```json
{
  "settings": {
    "site_name": "Vsparkz Digital",
    "meta_title": "Vsparkz Digital – Agency",
    "contact_email": "hello@vsparkzdigital.com"
  }
}
```

**Response (200)** – Same as GET (full settings object).

---

## Errors

- **401 Unauthorized** – Missing or invalid token. Clear token and redirect to login.
- **422 Unprocessable Entity** – Validation errors; response includes `message` and/or `errors`.
- **500 Internal Server Error** – Server error; when `APP_DEBUG=true`, response may include `message` with details.
