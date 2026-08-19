#!/bin/sh
set -e

echo "[startup] Running migrations..."
if ! php artisan migrate --force 2>&1; then
    echo "[startup] Some migrations failed — attempting fresh migration..."
    php artisan migrate:fresh --force --seed
fi

echo "[startup] Seeding (if needed)..."
php artisan db:seed --force 2>&1 || true

echo "[startup] Starting server on port ${PORT:-10000}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
