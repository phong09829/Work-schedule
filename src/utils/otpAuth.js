/**
 * Utility client-side cho tính năng Đăng nhập bằng mã OTP qua Email
 */

let cachedWorkingApiUrl = null;

export function getApiBaseCandidates() {
  const list = [];
  if (cachedWorkingApiUrl) {
    list.push(cachedWorkingApiUrl);
  }
  if (typeof window !== 'undefined' && window.__FOCUSFLOW_API_URL__) {
    list.push(window.__FOCUSFLOW_API_URL__);
  }
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    list.push(window.location.origin);
    if (window.location.port !== '5000') {
      list.push(`${window.location.protocol}//${window.location.hostname}:5000`);
    }
  }
  list.push('http://localhost:5000');
  list.push('http://127.0.0.1:5000');
  return [...new Set(list.filter(Boolean))];
}

export const OTP_STORAGE_KEYS = {
  TOKEN: 'focusflow_otp_jwt_token',
  USER: 'focusflow_otp_user_profile',
  LAST_EMAIL: 'focusflow_otp_last_email'
};

/**
 * Kiểm tra trạng thái kết nối tới Backend OTP Server
 */
export async function checkAuthServerHealth() {
  const candidates = getApiBaseCandidates();
  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${base}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        cachedWorkingApiUrl = base;
        return { ...data, apiUrl: base };
      }
    } catch (err) {
      // thử candidate tiếp theo
    }
  }
  return { status: 'offline', emailConfigured: false };
}

/**
 * Gửi yêu cầu mã OTP 6 số đến email
 * @param {string} email
 */
export async function requestEmailOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const candidates = getApiBaseCandidates();

  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${base}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.ok) {
        cachedWorkingApiUrl = base;
        return { ok: true, status: res.status, ...data };
      }
      if (res.status === 429) {
        return { ok: false, message: data.message || 'Vui lòng chờ ít giây trước khi gửi lại mã.' };
      }
      if (data && data.message) {
        return { ok: false, message: data.message };
      }
    } catch (err) {
      // Backend tại candidate này chưa phản hồi, thử tiếp
    }
  }

  return {
    ok: false,
    message: 'Không thể kết nối đến máy chủ gửi email. Vui lòng đảm bảo máy chủ backend đang hoạt động!'
  };
}

/**
 * Xác thực mã OTP 6 số và nhận JWT token
 * @param {string} email
 * @param {string} otp
 */
export async function verifyEmailOtp(email, otp) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  const candidates = getApiBaseCandidates();
  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.ok) {
        cachedWorkingApiUrl = base;
        return { ok: true, status: res.status, ...data };
      }
      if (data && data.message) {
        return { ok: false, message: data.message };
      }
    } catch (err) {
      // Thử candidate tiếp theo
    }
  }

  return {
    ok: false,
    message: 'Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại!'
  };
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
