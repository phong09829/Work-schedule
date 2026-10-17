@echo off
title FocusFlow - Quan Ly Thoi Gian va Dang Nhap OTP
echo [*] Dang kiem tra may chu Backend (Port 5000)...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue; if (-not $conn) { $pw = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source; if ($pw) { Start-Process -FilePath $pw -ArgumentList 'server.py --no-browser' -WorkingDirectory '%~dp0' -WindowStyle Hidden } else { Start-Process 'wscript.exe' -ArgumentList '\"%~dp0start_server_background.vbs\"' }; Start-Sleep -Milliseconds 1200 }"

echo [*] May chu Backend da san sang!
echo [*] Dang mo trinh duyet tai http://localhost:5000 ...
start "" "http://localhost:5000"

timeout /t 2 > nul
