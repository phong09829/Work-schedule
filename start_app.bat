@echo off
chcp 65001 > nul
title FocusFlow - Trình Quản Lý Thời Gian & Đăng Nhập OTP
cls
echo =======================================================================
echo          ⏱️ FOCUSFLOW - QUẢN LÝ THỜI GIAN & ĐĂNG NHẬP OTP EMAIL
echo =======================================================================
echo.
echo [1/2] Đang mở ứng dụng trên trình duyệt web...
start http://localhost:5000
echo.
echo [2/2] Đang khởi động Máy chủ Backend (Python Unified Server)...
echo ✅ Hệ thống đang chạy tại: http://localhost:5000
echo.
echo Bạn có thể thu nhỏ cửa sổ này lại khi đang sử dụng.
echo Để tắt máy chủ, đóng cửa sổ này hoặc nhấn phím Ctrl + C.
echo =======================================================================
python server.py
pause
