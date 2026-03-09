# Environment variables for production

Required and recommended environment variables for deploying V-Sparkz backend.

## Required

- **APP_NAME** – Application name (e.g. `V-Sparkz`).
- **APP_ENV** – Set to `production`.
- **APP_KEY** – Run `php artisan key:generate` and set in env.
- **APP_DEBUG** – Set to `false` in production.
- **APP_URL** – Full URL of the API (e.g. `https://api.example.com`).

- **DB_CONNECTION**, **DB_HOST**, **DB_PORT**, **DB_DATABASE**, **DB_USERNAME**, **DB_PASSWORD** – Database credentials.

- **CORS_ALLOWED_ORIGINS** – Comma-separated origins for the admin frontend (e.g. `https://admin.example.com`).
- **SANCTUM_STATEFUL_DOMAINS** – Comma-separated domains for cookie-based Sanctum auth (e.g. `admin.example.com`).

## Recommended

- **SESSION_DRIVER** – `database` or `redis` for multi-instance.
- **CACHE_STORE** – `redis` or `database` for production.
- **QUEUE_CONNECTION** – `redis` or `database` for async jobs.
- **MAIL_MAILER**, **MAIL_*** – SMTP or mail service for notifications and password reset.
- **LOG_CHANNEL**, **LOG_LEVEL** – e.g. `stack`, `error` in production.

## Optional (features)

- Payment gateways (Razorpay, Stripe): set respective keys and webhook secrets.
- AI/OpenAI: set in System Settings or env if used by the app.
- File storage: **FILESYSTEM_DISK**, **AWS_*** or equivalent for S3.

## Tenant resolution

Subscription and tenant resolution use the authenticated user’s `tenant_id`. For domain-based tenant resolution (e.g. subdomain), ensure middleware and config align with your deployment (e.g. `tenant` middleware and `APP_URL`).
