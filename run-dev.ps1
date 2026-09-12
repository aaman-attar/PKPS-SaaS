# Windows PowerShell Launcher for PKPS SaaS
# Starts Django Backend first, waits for health readiness, then starts React Frontend.

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting PKPS SaaS Development Servers   " -ForegroundColor Cyan
Write-Host "  1. Django Backend  (http://127.0.0.1:8000)" -ForegroundColor Yellow
Write-Host "  2. React Frontend  (http://localhost:5173)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

node scripts/start-dev.js
