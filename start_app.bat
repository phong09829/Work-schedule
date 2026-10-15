@echo off
chcp 65001 > nul
title FocusFlow - Trình Quản Lý Thời Gian & Đăng Nhập OTP Email
cls
echo =======================================================================
echo          ⏱️ FOCUSFLOW - QUẢN LÝ THỜI GIAN & ĐĂNG NHẬP OTP EMAIL
echo =======================================================================
echo.
echo [*] Đang khởi động Máy chủ Backend (Python Unified Server)...
echo [*] Trình duyệt web sẽ tự động mở tại: http://localhost:5000
echo.
echo Bạn có thể thu nhỏ cửa sổ này lại khi đang sử dụng ứng dụng.
echo Để tắt máy chủ, đóng cửa sổ này hoặc nhấn tổ hợp phím Ctrl + C.
echo =======================================================================
python server.py
pause
