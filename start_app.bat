@echo off
chcp 65001 > nul
title FocusFlow - Khoi Chay Web & OTP Server
cls
echo =======================================================================
echo          ⏱️ FOCUSFLOW - QUẢN LÝ THỜI GIAN & ĐĂNG NHẬP OTP EMAIL
echo =======================================================================
echo.
echo [1/2] Đang khởi động Máy chủ Backend (Python Unified Server)...
start /b python server.py
echo [2/2] Đang mở ứng dụng trên trình duyệt web...
timeout /t 2 /nobreak > nul
start http://localhost:5000
echo.
echo ✅ Hệ thống đã sẵn sàng tại: http://localhost:5000
echo.
echo Bạn có thể thu nhỏ cửa sổ này lại khi đang sử dụng.
echo Để tắt máy chủ, đóng cửa sổ này hoặc nhấn Ctrl + C.
echo =======================================================================
python server.py
pause
