import nodemailer from 'nodemailer';
import crypto from 'crypto';

// In-Memory store for Serverless (or persistent store)
// Note: In serverless instances, global memory is preserved across warm invocations
const otpStore = globalThis.__ff_otp_store || (globalThis.__ff_otp_store = new Map());

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const { email } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ ok: false, message: 'Địa chỉ Gmail không hợp lệ!' });
  }

  // Cooldown check (3s)
  const existing = otpStore.get(cleanEmail);
  const now = Date.now();
  if (existing && now - existing.createdAt < 3000) {
    const waitSec = Math.ceil((3000 - (now - existing.createdAt)) / 1000);
    return res.status(429).json({ ok: false, message: `Vui lòng đợi ${waitSec}s trước khi gửi lại mã!` });
  }

  // Generate real 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = now + 5 * 60 * 1000;

  otpStore.set(cleanEmail, {
    code: otpCode,
    expiresAt,
    attempts: 0,
    createdAt: now
  });

  const htmlContent = `
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
            Dưới đây là mã xác thực OTP 6 chữ số để đăng nhập vào tài khoản <strong style="color:#0f172a;">${cleanEmail}</strong>:
          </p>
          <div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${otpCode}</span>
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
  `;

  try {
    await transporter.sendMail({
      from: `"FocusFlow Auth" <${EMAIL_USER}>`,
      to: cleanEmail,
      subject: `🔐 Mã xác thực đăng nhập FocusFlow: ${otpCode}`,
      text: `Mã xác thực OTP FocusFlow của bạn là: ${otpCode} (Hiệu lực trong 5 phút).`,
      html: htmlContent
    });

    return res.status(200).json({
      ok: true,
      message: `Mã OTP 6 số đã được gửi tới ${cleanEmail}. Vui lòng kiểm tra hộp thư!`,
      expiresIn: 300
    });
  } catch (err) {
    console.error('SMTP Error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Không thể gửi email qua Gmail SMTP. Vui lòng kiểm tra lại cấu hình tài khoản gửi!',
      error: err.message
    });
  }
}
