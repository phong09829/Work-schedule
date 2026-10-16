@echo off
title FocusFlow - Dung May Chu Backend
echo [*] Dang tim va dung may chu FocusFlow dang chay tai port 5000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host '[OK] Da tat may chu PID:' $_.OwningProcess }"
echo [OK] Da hoan tat.
timeout /t 2 > nul
