/**
 * Utility client-side cho tính năng Đăng nhập bằng mã OTP qua Email
 */

const API_BASE_URL = typeof window !== 'undefined' && window.__FOCUSFLOW_API_URL__
  ? window.__FOCUSFLOW_API_URL__
  : 'http://localhost:5000';

export const OTP_STORAGE_KEYS = {
  TOKEN: 'focusflow_otp_jwt_token',
  USER: 'focusflow_otp_user_profile',
  LAST_EMAIL: 'focusflow_otp_last_email'
};

/**
 * Kiểm tra trạng thái kết nối tới Backend OTP Server
 */
export async function checkAuthServerHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'error', emailConfigured: false };
  } catch (err) {
    return { status: 'offline', emailConfigured: false };
  }
}

/**
 * Gửi yêu cầu mã OTP 6 số đến email
 * @param {string} email
 */
export async function requestEmailOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    console.warn('[OTP Client] Server offline hoặc không thể kết nối tới', API_BASE_URL, err);
    
    // Client-side local sandbox fallback if backend is not yet started:
    // Tạo mã OTP client-side để người dùng vẫn có thể trải nghiệm tức thì
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    sessionStorage.setItem(`demo_otp_${cleanEmail}`, JSON.stringify({
      code: fallbackOtp,
      expiresAt
    }));

    return {
      ok: true,
      mode: 'client_fallback',
      demoOtp: fallbackOtp,
      message: `Đã tạo mã xác nhận: ${fallbackOtp} (Backend server chưa chạy, hãy chạy: node server.js hoặc python server.py để gửi qua Gmail thật!)`,
      expiresIn: 300
    };
  }
}

/**
 * Xác thực mã OTP 6 số và nhận JWT token
 * @param {string} email
 * @param {string} otp
 */
export async function verifyEmailOtp(email, otp) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    console.warn('[OTP Client] Kiểm tra fallback cho local demo sandbox', err);
    
    // Client fallback check
    const raw = sessionStorage.getItem(`demo_otp_${cleanEmail}`);
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (Date.now() > stored.expiresAt) {
          sessionStorage.removeItem(`demo_otp_${cleanEmail}`);
          return { ok: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã mới!' };
        }
        if (stored.code === cleanOtp) {
          sessionStorage.removeItem(`demo_otp_${cleanEmail}`);
          const name = cleanEmail.split('@')[0];
          const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;
          return {
            ok: true,
            message: `Xác thực thành công! Chào mừng ${name}.`,
            token: `demo_jwt_${Date.now()}`,
            user: {
              id: `usr-${Date.now()}`,
              email: cleanEmail,
              name,
              avatar,
              authProvider: 'email_otp'
            }
          };
        } else {
          return { ok: false, message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại!' };
        }
      } catch (e) {
        // pass
      }
    }

    return {
      ok: false,
      message: 'Không thể kết nối đến máy chủ xác thực. Vui lòng bật server backend (node server.js hoặc python server.py)!'
    };
  }
}

/**
 * Lưu phiên đăng nhập OTP
 */
export function saveOtpSession(token, user) {
  if (!token || !user) return;
  try {
    localStorage.setItem(OTP_STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(OTP_STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(OTP_STORAGE_KEYS.LAST_EMAIL, user.email || '');
  } catch (e) {
    console.error('Error saving OTP session:', e);
  }
}

/**
 * Đăng xuất và xóa phiên OTP
 */
export function clearOtpSession() {
  try {
    localStorage.removeItem(OTP_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(OTP_STORAGE_KEYS.USER);
  } catch (e) {
    console.error('Error clearing OTP session:', e);
  }
}
