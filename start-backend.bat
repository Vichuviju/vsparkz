@echo off
title Vsparkz Backend API
cd /d "%~dp0backend"
echo Starting Laravel API on http://127.0.0.1:8000 ...
echo.
php8\php.exe artisan migrate --force
php8\php.exe artisan serve --host=127.0.0.1 --port=8000
pause
