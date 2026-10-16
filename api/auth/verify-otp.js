import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'focusflow_stateless_otp_secret_key_2026_xyz';
const otpStore = globalThis.__ff_otp_store || (globalThis.__ff_otp_store = new Map());

function verifyOtpSignature(email, otp, otpSign) {
  if (!otpSign || typeof otpSign !== 'string') return { valid: false, reason: 'missing_sign' };
  const parts = otpSign.split('.');
  if (parts.length !== 2) return { valid: false, reason: 'invalid_format' };

  const [expStr, signature] = parts;
  const expiresAt = parseInt(expStr, 10);
  if (isNaN(expiresAt)) return { valid: false, reason: 'invalid_exp' };

  const now = Date.now();
  const expMs = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt;
  if (now > expMs) {
    return { valid: false, expired: true, reason: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã mới!' };
  }

  const payload = `${email}:${otp}:${expStr}`;
  const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);

  if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: true };
  }
  return { valid: false, reason: 'Mã OTP không chính xác. Vui lòng kiểm tra lại!' };
}

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

  const { email, otp, otpSign } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!cleanEmail || !cleanOtp || cleanOtp.length !== 6) {
    return res.status(400).json({ ok: false, message: 'Mã OTP phải bao gồm đúng 6 chữ số!' });
  }

  const now = Date.now();
  let isValid = false;

  // 1. Kiểm tra qua Stateless HMAC Signature (ưu tiên: hoạt động trơn tru trên mọi Serverless lambda độc lập)
  if (otpSign) {
    const signResult = verifyOtpSignature(cleanEmail, cleanOtp, otpSign);
    if (signResult.valid) {
      isValid = true;
    } else if (signResult.expired) {
      return res.status(400).json({ ok: false, message: signResult.reason });
    } else if (!otpStore.has(cleanEmail)) {
      return res.status(400).json({ ok: false, message: signResult.reason || 'Mã OTP không chính xác. Vui lòng kiểm tra lại!' });
    }
  }

  // 2. Fallback kiểm tra qua In-Memory Store nếu lambda có lưu
  if (!isValid) {
    const record = otpStore.get(cleanEmail);
    if (record) {
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

      isValid = true;
    }
  }

  if (!isValid) {
    return res.status(400).json({ ok: false, message: 'Không tìm thấy yêu cầu OTP hoặc mã đã hết hạn. Vui lòng bấm gửi lại mã!' });
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
