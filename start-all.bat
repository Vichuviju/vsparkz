@echo off
title Vsparkz - Backend + Admin + Website
cd /d "%~dp0"

echo [1/2] Starting backend API in a new window...
start "Vsparkz Backend" cmd /k "%~dp0start-backend.bat"

echo [2/2] Starting admin + website...
timeout /t 3 /nobreak >nul
npm run dev
