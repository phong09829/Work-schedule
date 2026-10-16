import crypto from 'crypto';

const otpStore = globalThis.__ff_otp_store || (globalThis.__ff_otp_store = new Map());

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const { email, otp } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!cleanEmail || !cleanOtp || cleanOtp.length !== 6) {
    return res.status(400).json({ ok: false, message: 'Mã OTP phải bao gồm đúng 6 chữ số!' });
  }

  const record = otpStore.get(cleanEmail);
  const now = Date.now();

  if (!record) {
    return res.status(400).json({ ok: false, message: 'Không tìm thấy yêu cầu OTP hoặc mã đã hết hạn. Vui lòng bấm gửi lại mã!' });
  }

  if (now > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ ok: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới!' });
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ ok: false, message: 'Bạn đã nhập sai quá 5 lần. Mã này đã bị vô hiệu hóa!' });
  }

  if (record.code !== cleanOtp) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return res.status(400).json({ ok: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử!` });
  }

  // OTP hợp lệ! Xóa khỏi store
  otpStore.delete(cleanEmail);

  const namePart = cleanEmail.split('@')[0];
  const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;
  const token = `jwt-${crypto.randomBytes(16).toString('hex')}`;

  return res.status(200).json({
    ok: true,
    message: `Đăng nhập thành công! Chào mừng ${name}.`,
    token,
    user: {
      id: `usr-${crypto.randomBytes(6).toString('hex')}`,
      email: cleanEmail,
      name,
      avatar,
      authProvider: 'email_otp'
    }
  });
}
