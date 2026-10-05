import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'focusflow_super_secret_jwt_key_2026';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-Memory Temporary OTP Store
// Structure: Map<email, { code: string, expiresAt: number, attempts: number, createdAt: number }>
const otpStore = new Map();

// Helper to validate email format
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
};

// Helper: Normalize Email
const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// Helper: Clean up expired OTPs periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 10 * 60 * 1000);

// Helper: Create Nodemailer Gmail Transporter
const createMailTransporter = () => {
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD || EMAIL_USER === 'your_email@gmail.com') {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
};

// Helper: HTML Email Template for OTP
const generateOtpEmailHtml = (otpCode, targetEmail) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã xác nhận đăng nhập FocusFlow</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 15px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden;">
            
            <!-- Header with Gradient Accent -->
            <tr>
              <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 30px; text-align: center;">
                <div style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 14px; line-height: 48px; font-size: 24px;">⏱️</div>
                <h1 style="margin: 12px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FocusFlow</h1>
                <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Xác Thực Đăng Nhập Không Cần Mật Khẩu</p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 36px 32px 24px 32px; color: #334155; line-height: 1.6;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; font-weight: 600;">
                  Xin chào,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569;">
                  Chúng tôi nhận được yêu cầu đăng nhập vào tài khoản <strong style="color: #0f172a;">${targetEmail}</strong>. Dưới đây là mã xác thực OTP 6 chữ số của bạn:
                </p>

                <!-- OTP Code Display Card -->
                <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
                    ${otpCode}
                  </span>
                </div>

                <!-- Notice & Security -->
                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #1e40af;">
                    ⏱️ <strong>Lưu ý:</strong> Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.
                  </p>
                </div>

                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc kiểm tra lại bảo mật tài khoản.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                  © 2026 FocusFlow • Nền tảng quản lý thời gian & lịch trình thông minh
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

// =========================================================================================
// API 1: TẠO VÀ GỬI MÃ OTP ĐẾN EMAIL
// POST /api/auth/send-otp
// Body: { email }
// =========================================================================================
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        message: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại!'
      });
    }

    const cleanEmail = normalizeEmail(email);

    // Kiểm tra cooldown gửi lại mã (3 giây để chống spam nhẹ mà không làm kẹt người dùng)
    const existing = otpStore.get(cleanEmail);
    if (existing && Date.now() - existing.createdAt < 3 * 1000) {
      const waitSeconds = Math.ceil((3 * 1000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        ok: false,
        message: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu gửi lại mã mới!`
      });
    }

    // Tạo mã OTP ngẫu nhiên gồm 6 chữ số (100000 - 999999)
    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Lưu tạm thời mã OTP với thời hạn 5 phút (300,000 ms)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    console.log(`[OTP] Đã tạo mã OTP cho ${cleanEmail}: ${otpCode} (Hết hạn lúc: ${new Date(expiresAt).toLocaleTimeString()})`);

    // Gửi email qua Gmail SMTP nếu đã cấu hình
    const transporter = createMailTransporter();
    
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"FocusFlow Auth" <${EMAIL_USER}>`,
          to: cleanEmail,
          subject: `🔐 Mã xác nhận đăng nhập FocusFlow: ${otpCode}`,
          html: generateOtpEmailHtml(otpCode, cleanEmail),
        });

        console.log(`[SMTP] Đã gửi thành công email OTP tới: ${cleanEmail}`);
        return res.json({
          ok: true,
          message: `Mã OTP 6 chữ số đã được gửi tới email ${cleanEmail}. Vui lòng kiểm tra hòm thư (kể cả mục Spam)!`,
          expiresIn: 300, // 5 phút
          mode: 'smtp_sent'
        });
      } catch (mailError) {
        console.error('[SMTP Error] Lỗi khi gửi mail qua Gmail SMTP:', mailError);
        return res.status(500).json({
          ok: false,
          message: 'Không thể gửi email do lỗi cấu hình SMTP Gmail. Vui lòng kiểm tra lại EMAIL_USER và EMAIL_APP_PASSWORD trong file .env!',
          error: mailError.message
        });
      }
    } else {
      return res.json({
        ok: true,
        message: `Mã OTP 6 số đã được gửi tới email ${cleanEmail}. Vui lòng kiểm tra hòm thư!`,
        expiresIn: 300,
        mode: 'dev_mode'
      });
    }

  } catch (error) {
    console.error('[Send OTP Error]:', error);
    return res.status(500).json({
      ok: false,
      message: 'Có lỗi xảy ra khi xử lý gửi mã OTP. Vui lòng thử lại sau!'
    });
  }
});

// =========================================================================================
// API 2: KIỂM TRA MÃ OTP VÀ TẠO PHIÊN ĐĂNG NHẬP / JWT TOKEN
// POST /api/auth/verify-otp
// Body: { email, otp }
// =========================================================================================
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        message: 'Địa chỉ email không hợp lệ!'
      });
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({
        ok: false,
        message: 'Mã OTP phải bao gồm đúng 6 chữ số!'
      });
    }

    const cleanEmail = normalizeEmail(email);
    const inputOtp = otp.trim();

    const record = otpStore.get(cleanEmail);

    // 1. Kiểm tra mã có tồn tại không
    if (!record) {
      return res.status(400).json({
        ok: false,
        message: 'Không tìm thấy yêu cầu OTP cho email này hoặc mã đã hết hạn. Vui lòng bấm "Gửi lại mã"!'
      });
    }

    // 2. Kiểm tra thời hạn 5 phút
    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        ok: false,
        message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới!'
      });
    }

    // 3. Kiểm tra số lần nhập sai (chặn brute-force)
    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        ok: false,
        message: 'Bạn đã nhập sai quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do bảo mật. Vui lòng yêu cầu mã mới!'
      });
    }

    // 4. So khớp mã OTP
    if (record.code !== inputOtp) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return res.status(400).json({
        ok: false,
        message: `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử!`
      });
    }

    // 5. OTP hợp lệ! Xóa OTP đã sử dụng để chống dùng lại (Replay Attack)
    otpStore.delete(cleanEmail);

    // 6. Tạo JWT token và thông tin người dùng
    const displayName = cleanEmail.split('@')[0];
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;

    const userPayload = {
      id: `usr-${crypto.randomBytes(6).toString('hex')}`,
      email: cleanEmail,
      name: displayName,
      avatar: avatarUrl,
      authProvider: 'email_otp',
      verifiedAt: new Date().toISOString()
    };

    const token = jwt.sign(
      { 
        sub: userPayload.id, 
        email: cleanEmail,
        name: displayName 
      },
      JWT_SECRET,
      { expiresIn: '30d' } // Phiên đăng nhập 30 ngày
    );

    console.log(`[Auth Success] Người dùng ${cleanEmail} đã đăng nhập OTP thành công!`);

    return res.json({
      ok: true,
      message: `Đăng nhập thành công! Chào mừng ${displayName}.`,
      token,
      user: userPayload
    });

  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    return res.status(500).json({
      ok: false,
      message: 'Có lỗi xảy ra khi xác thực mã OTP.'
    });
  }
});

// API 3: Cập nhật cấu hình Gmail SMTP từ UI
app.post('/api/auth/save-smtp-config', (req, res) => {
  try {
    const { emailUser, emailAppPassword } = req.body;
    if (!emailUser || !isValidEmail(emailUser)) {
      return res.status(400).json({ ok: false, message: 'Địa chỉ Gmail không hợp lệ!' });
    }
    const cleanPwd = (emailAppPassword || '').replace(/\s+/g, '');
    if (cleanPwd.length < 8) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu ứng dụng Google phải có 16 chữ cái!' });
    }

    process.env.EMAIL_USER = emailUser.trim().toLowerCase();
    process.env.EMAIL_APP_PASSWORD = cleanPwd;

    // Cập nhật file .env
    const envPath = path.join(__dirname, '.env');
    const envData = `# Cấu hình Gmail SMTP tự động cập nhật
PORT=${PORT}
EMAIL_USER=${process.env.EMAIL_USER}
EMAIL_APP_PASSWORD=${process.env.EMAIL_APP_PASSWORD}
JWT_SECRET=${JWT_SECRET}
CLIENT_URL=http://localhost:5173
`;
    import('fs').then(fs => {
      fs.writeFileSync(envPath, envData, 'utf-8');
      console.log(`[Config] Đã cập nhật file .env với email: ${process.env.EMAIL_USER}`);
    });

    return res.json({
      ok: true,
      message: `Đã lưu và kích hoạt cấu hình Gmail SMTP cho '${emailUser}' thành công!`
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Lỗi khi lưu cấu hình SMTP.' });
  }
});

// Health check API
app.get('/api/health', (req, res) => {
  const currentEmail = process.env.EMAIL_USER || EMAIL_USER;
  const currentPass = process.env.EMAIL_APP_PASSWORD || EMAIL_APP_PASSWORD;
  const isEmailConfigured = Boolean(currentEmail && currentPass && currentEmail !== 'your_email@gmail.com');
  res.json({
    status: 'ok',
    server: 'FocusFlow Auth Server (Node.js/Express)',
    emailConfigured: isEmailConfigured,
    emailUser: isEmailConfigured ? currentEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Chưa cấu hình'
  });
});

// Phục vụ giao diện web tĩnh
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 FocusFlow Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📧 Trạng thái SMTP Gmail: ${Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_USER !== 'your_email@gmail.com') ? '✅ Đã cấu hình' : '⚠️ Chưa cấu hình (Chế độ mô phỏng/Demo)'}`);
  console.log(`=======================================================`);
});
