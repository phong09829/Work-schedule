/**
 * Utility client-side cho tính năng Đăng nhập bằng mã OTP qua Email
 */

const API_BASE_URL = typeof window !== 'undefined' && window.__FOCUSFLOW_API_URL__
  ? window.__FOCUSFLOW_API_URL__
  : (typeof window !== 'undefined' && window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:5000');

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
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    console.error('[OTP Client] Không thể kết nối tới máy chủ gửi mail', API_BASE_URL, err);
    return {
      ok: false,
      message: 'Không thể kết nối đến máy chủ gửi email. Vui lòng đảm bảo bạn đã mở máy chủ (file start_app.bat)!'
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
    console.error('[OTP Client] Không thể kết nối đến máy chủ xác thực', err);
    return {
      ok: false,
      message: 'Không thể kết nối đến máy chủ xác thực OTP. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ!'
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
