#!/usr/bin/env python3
"""
FocusFlow - Unified Web & OTP Authentication Server
===================================================
Tự động phục vụ giao diện Web (index.html) và cung cấp API gửi/xác thực OTP qua Gmail SMTP.
Chạy bằng lệnh: python server.py
"""

import http.server
import socketserver
import json
import os
import re
import time
import secrets
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 5000))
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_APP_PASSWORD = os.environ.get("EMAIL_APP_PASSWORD", "").replace(" ", "")

# In-Memory OTP Store: { email: { "code": "123456", "expires_at": timestamp, "attempts": 0, "created_at": timestamp } }
OTP_STORE = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_env_file():
    global EMAIL_USER, EMAIL_APP_PASSWORD, PORT
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'").strip('"')
                    if k == "EMAIL_USER" and not EMAIL_USER:
                        EMAIL_USER = v
                    elif k == "EMAIL_APP_PASSWORD" and not EMAIL_APP_PASSWORD:
                        EMAIL_APP_PASSWORD = v.replace(" ", "")
                    elif k == "PORT":
                        try:
                            PORT = int(v)
                        except ValueError:
                            pass

def save_env_file(user, app_password):
    global EMAIL_USER, EMAIL_APP_PASSWORD
    EMAIL_USER = user.strip().lower()
    EMAIL_APP_PASSWORD = app_password.replace(" ", "")
    
    env_path = os.path.join(BASE_DIR, ".env")
    env_content = f"""# =========================================================================================
# 🔐 CẤU HÌNH BIẾN MÔI TRƯỜNG ĐĂNG NHẬP OTP QUA EMAIL (GMAIL SMTP)
# =========================================================================================

PORT={PORT}
EMAIL_USER={EMAIL_USER}
EMAIL_APP_PASSWORD={EMAIL_APP_PASSWORD}
JWT_SECRET=focusflow_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
"""
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
    print(f"[Config] Đã cập nhật cấu hình Gmail SMTP: {EMAIL_USER}")

load_env_file()

def is_valid_email(email):
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email.strip().lower()))

def send_smtp_email(to_email, otp_code):
    if not EMAIL_USER or not EMAIL_APP_PASSWORD or EMAIL_USER == "your_email@gmail.com":
        return False, "Chưa cấu hình EMAIL_USER hoặc EMAIL_APP_PASSWORD trong file .env"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Mã xác nhận đăng nhập FocusFlow: {otp_code}"
        msg["From"] = f"FocusFlow Auth <{EMAIL_USER}>"
        msg["To"] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:40px 15px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 30px;text-align:center;">
                <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:48px;font-size:24px;">⏱️</div>
                <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:22px;font-weight:800;">FocusFlow</h1>
                <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Xác Thực Đăng Nhập Không Cần Mật Khẩu</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;color:#334155;line-height:1.6;">
                <p style="margin:0 0 16px 0;font-size:15px;color:#1e293b;font-weight:600;">Xin chào,</p>
                <p style="margin:0 0 24px 0;font-size:14px;color:#475569;">
                  Dưới đây là mã xác thực OTP 6 chữ số để đăng nhập vào tài khoản <strong style="color:#0f172a;">{to_email}</strong>:
                </p>
                <div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
                  <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#4f46e5;">{otp_code}</span>
                </div>
                <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
                  <p style="margin:0;font-size:13px;color:#1e40af;">⏱️ <strong>Lưu ý:</strong> Mã có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 FocusFlow • Quản lý thời gian & lịch trình thông minh</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(f"Mã xác thực OTP FocusFlow của bạn là: {otp_code} (Hiệu lực trong 5 phút).", "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(EMAIL_USER, EMAIL_APP_PASSWORD)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())

        return True, "Email đã được gửi thành công!"
    except Exception as e:
        return False, str(e)


class UnifiedHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/api/health", "/health", "/api/auth/status"]:
            is_configured = bool(EMAIL_USER and EMAIL_APP_PASSWORD and EMAIL_USER != "your_email@gmail.com")
            self._send_json(200, {
                "status": "ok",
                "server": "FocusFlow Python OTP & Web Server",
                "emailConfigured": is_configured,
                "emailUser": re.sub(r"(.{2})(.*)(@.*)", r"\1***\3", EMAIL_USER) if is_configured else "Chưa cấu hình"
            })
        elif parsed.path.startswith("/api/"):
            self._send_json(404, {"error": "API endpoint not found"})
        else:
            # Phục vụ static files (index.html, src, etc.)
            if parsed.path == "/" or parsed.path == "":
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        
        try:
            body = json.loads(post_body.decode("utf-8"))
        except Exception:
            body = {}

        if parsed.path == "/api/auth/send-otp":
            email = (body.get("email") or "").strip().lower()
            if not is_valid_email(email):
                return self._send_json(400, {"ok": False, "message": "Địa chỉ email không hợp lệ!"})

            # Check cooldown 30s
            existing = OTP_STORE.get(email)
            now = time.time()
            if existing and now - existing["created_at"] < 30:
                wait_sec = int(30 - (now - existing["created_at"]))
                return self._send_json(429, {"ok": False, "message": f"Vui lòng đợi {wait_sec}s trước khi gửi lại mã!"})

            # Generate 6-digit OTP
            otp_code = f"{secrets.randbelow(900000) + 100000}"
            expires_at = now + 300  # 5 phút

            OTP_STORE[email] = {
                "code": otp_code,
                "expires_at": expires_at,
                "attempts": 0,
                "created_at": now
            }

            print(f"[OTP] Tạo mã OTP cho {email}: {otp_code} (Hết hạn lúc: {time.strftime('%H:%M:%S', time.localtime(expires_at))})")

            # Gửi qua SMTP
            success, msg = send_smtp_email(email, otp_code)
            if success:
                return self._send_json(200, {
                    "ok": True,
                    "message": f"Mã OTP 6 số đã được gửi tới {email}. Vui lòng kiểm tra hộp thư!",
                    "expiresIn": 300,
                    "mode": "smtp_sent"
                })
            else:
                # Mode test / demo
                return self._send_json(200, {
                    "ok": True,
                    "message": f"Mã OTP đã được tạo (Chế độ Test/Demo). Vui lòng cấu hình EMAIL_APP_PASSWORD trong .env để gửi qua Gmail thật!",
                    "expiresIn": 300,
                    "mode": "demo_dev",
                    "demoOtp": otp_code
                })

        elif parsed.path == "/api/auth/verify-otp":
            email = (body.get("email") or "").strip().lower()
            otp = (body.get("otp") or "").strip()

            if not is_valid_email(email):
                return self._send_json(400, {"ok": False, "message": "Địa chỉ email không hợp lệ!"})

            if len(otp) != 6:
                return self._send_json(400, {"ok": False, "message": "Mã OTP phải bao gồm đúng 6 chữ số!"})

            record = OTP_STORE.get(email)
            now = time.time()

            if not record:
                return self._send_json(400, {"ok": False, "message": "Không tìm thấy yêu cầu OTP hoặc mã đã hết hạn. Vui lòng bấm gửi lại mã!"})

            if now > record["expires_at"]:
                del OTP_STORE[email]
                return self._send_json(400, {"ok": False, "message": "Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới!"})

            if record["attempts"] >= 5:
                del OTP_STORE[email]
                return self._send_json(400, {"ok": False, "message": "Bạn đã nhập sai quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do bảo mật!"})

            if record["code"] != otp:
                record["attempts"] += 1
                rem = 5 - record["attempts"]
                return self._send_json(400, {"ok": False, "message": f"Mã OTP không chính xác. Bạn còn {rem} lần thử!"})

            # Valid! Consume OTP
            del OTP_STORE[email]

            name = email.split("@")[0]
            avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={email}"
            token = f"session_jwt_{secrets.token_hex(16)}"

            return self._send_json(200, {
                "ok": True,
                "message": f"Đăng nhập thành công! Chào mừng {name}.",
                "token": token,
                "user": {
                    "id": f"usr-{secrets.token_hex(6)}",
                    "email": email,
                    "name": name,
                    "avatar": avatar,
                    "authProvider": "email_otp"
                }
            })

        elif parsed.path == "/api/auth/save-smtp-config":
            user = (body.get("emailUser") or "").strip().lower()
            pwd = (body.get("emailAppPassword") or "").replace(" ", "")

            if not is_valid_email(user):
                return self._send_json(400, {"ok": False, "message": "Địa chỉ Gmail không hợp lệ!"})
            if len(pwd) < 8:
                return self._send_json(400, {"ok": False, "message": "Mật khẩu ứng dụng phải có 16 chữ cái!"})

            save_env_file(user, pwd)
            return self._send_json(200, {
                "ok": True,
                "message": f"Đã lưu và kích hoạt cấu hình Gmail SMTP cho '{user}' thành công!"
            })

        else:
            self._send_json(404, {"error": "Endpoint not found"})


def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), UnifiedHandler) as httpd:
        print("=======================================================================")
        print(f"🚀 FocusFlow Server đang chạy toàn diện tại: http://localhost:{PORT}")
        print(f"🌐 Mở trình duyệt tại: http://localhost:{PORT}")
        is_cfg = bool(EMAIL_USER and EMAIL_APP_PASSWORD and EMAIL_USER != "your_email@gmail.com")
        print(f"📧 Trạng thái SMTP Gmail: {'✅ Đã cấu hình (' + EMAIL_USER + ')' if is_cfg else '⚠️ Chưa cấu hình (Chế độ mô phỏng/Demo)'}")
        print("=======================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐã dừng server.")

if __name__ == "__main__":
    run()
