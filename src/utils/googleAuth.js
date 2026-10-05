// =========================================================================================
// 🚀 GOOGLE IDENTITY SERVICES (GIS) INTEGRATION UTILITY
// Sử dụng thư viện chuẩn mới nhất của Google: https://accounts.google.com/gsi/client
// =========================================================================================

import { GOOGLE_CLIENT_ID } from '../config/authConfig';

export const GOOGLE_AUTH_STORAGE_KEYS = {
  CLIENT_ID: 'focusflow_google_client_id_v2',
  USER_PROFILE: 'focusflow_google_user_profile_v2',
  ID_TOKEN: 'focusflow_google_id_token_v2',
  ACCESS_TOKEN: 'focusflow_google_access_token_v2',
};

// Default Google OAuth Scopes
export const GOOGLE_DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

/**
 * Tải thư viện Google Identity Services (GIS) vào trang web nếu chưa có
 */
export const loadGoogleIdentityScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Môi trường window không tồn tại.'));
    }

    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }

    const existingScript = document.getElementById('google-identity-services-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (e) => reject(new Error('Không thể tải Google Identity Services SDK.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services-sdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        resolve(window.google);
      } else {
        // Chờ thêm 100ms nếu script load xong nhưng global object chưa gắn kịp
        setTimeout(() => {
          if (window.google?.accounts) resolve(window.google);
          else reject(new Error('Google Identity Services SDK tải thất bại.'));
        }, 100);
      }
    };
    script.onerror = () => reject(new Error('Lỗi kết nối khi tải script Google Identity Services.'));
    document.head.appendChild(script);
  });
};

/**
 * Giải mã Google ID Token JWT (Credential Response)
 * Trích xuất trực tiếp: Name, Email, Picture, Sub (User ID), Email_verified
 */
export const decodeGoogleJwt = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.sub,
      googleId: payload.sub,
      name: payload.name || payload.given_name || payload.email?.split('@')[0] || 'Người dùng Google',
      email: payload.email,
      emailVerified: payload.email_verified,
      picture: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.email || 'google_user'}`,
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      locale: payload.locale || 'vi',
      rawPayload: payload,
    };
  } catch (err) {
    console.error('Lỗi khi giải mã Google JWT Token:', err);
    return null;
  }
};

/**
 * Khởi tạo Google Identity Services (GIS) Sign In with Google
 * @param {Object} options
 * @param {string} options.clientId - Google OAuth Client ID
 * @param {Function} options.onSuccess - Callback khi đăng nhập thành công ({ user, credential, rawResponse })
 * @param {Function} options.onError - Callback khi xảy ra lỗi
 * @param {HTMLElement|string} options.buttonContainer - Phần tử DOM để render nút Google chính thức
 * @param {boolean} options.renderButton - Có render nút Google chuẩn GIS không
 * @param {boolean} options.promptOneTap - Có hiển thị One Tap không
 */
export const setupGoogleIdentitySignIn = async ({
  clientId = GOOGLE_CLIENT_ID,
  onSuccess,
  onError,
  buttonContainer = null,
  renderButton = true,
  promptOneTap = false,
  buttonConfig = {},
}) => {
  try {
    const google = await loadGoogleIdentityScript();

    const activeClientId = (clientId && clientId !== 'ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY')
      ? clientId
      : (localStorage.getItem(GOOGLE_AUTH_STORAGE_KEYS.CLIENT_ID) || GOOGLE_CLIENT_ID);

    // Xử lý callback khi Google trả về JWT Credential
    const handleCredentialResponse = (response) => {
      if (!response || !response.credential) {
        if (onError) onError(new Error('Không nhận được credential từ Google.'));
        return;
      }

      const decodedUser = decodeGoogleJwt(response.credential);
      if (!decodedUser || !decodedUser.email) {
        if (onError) onError(new Error('Không thể trích xuất thông tin người dùng từ Google Token.'));
        return;
      }

      // Lưu trữ thông tin đăng nhập
      try {
        localStorage.setItem(GOOGLE_AUTH_STORAGE_KEYS.ID_TOKEN, response.credential);
        localStorage.setItem(GOOGLE_AUTH_STORAGE_KEYS.USER_PROFILE, JSON.stringify(decodedUser));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      if (onSuccess) {
        onSuccess({
          user: decodedUser,
          credential: response.credential,
          raw: response,
        });
      }
    };

    // Khởi tạo Google ID Client
    google.accounts.id.initialize({
      client_id: activeClientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render nút Google chuẩn form nếu có container
    if (renderButton) {
      let targetElement = typeof buttonContainer === 'string'
        ? document.getElementById(buttonContainer)
        : buttonContainer;

      if (targetElement) {
        targetElement.innerHTML = ''; // Làm sạch trước khi render
        google.accounts.id.renderButton(targetElement, {
          type: 'standard',
          theme: buttonConfig.theme || 'outline', // 'outline' | 'filled_blue' | 'filled_black'
          size: buttonConfig.size || 'large', // 'large' | 'medium' | 'small'
          text: buttonConfig.text || 'signin_with', // 'signin_with' | 'signup_with' | 'continue_with'
          shape: buttonConfig.shape || 'rectangular', // 'rectangular' | 'pill' | 'circle'
          logo_alignment: buttonConfig.logo_alignment || 'left',
          width: buttonConfig.width || 320,
          locale: 'vi',
        });
      }
    }

    // Hiển thị One Tap nếu được bật và Client ID hợp lệ
    if (promptOneTap && activeClientId && activeClientId !== 'ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY') {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Bỏ qua hoặc đóng thông báo
        }
      });
    }

    return true;
  } catch (error) {
    console.warn('Setup Google Identity Services warning:', error);
    if (onError) onError(error);
    return false;
  }
};

/**
 * Khởi tạo luồng OAuth 2.0 Popup (lấy Access Token cho Google Calendar / APIs)
 */
export const openGoogleOAuthPopup = async ({
  clientId = GOOGLE_CLIENT_ID,
  scope = GOOGLE_DEFAULT_SCOPES,
  onSuccess,
  onError,
}) => {
  try {
    const google = await loadGoogleIdentityScript();
    const activeClientId = (clientId && clientId !== 'ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY')
      ? clientId
      : (localStorage.getItem(GOOGLE_AUTH_STORAGE_KEYS.CLIENT_ID) || GOOGLE_CLIENT_ID);

    if (!activeClientId || activeClientId === 'ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY') {
      throw new Error('Vui lòng cấu hình GOOGLE_CLIENT_ID hợp lệ để kết nối Google OAuth.');
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: activeClientId,
      scope: scope,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          if (onError) onError(tokenResponse);
          return;
        }

        try {
          // Lấy thông tin người dùng từ UserInfo endpoint
          const profile = await fetchGoogleUserInfo(tokenResponse.access_token);
          if (onSuccess) {
            onSuccess({
              accessToken: tokenResponse.access_token,
              expiresIn: tokenResponse.expires_in,
              tokenResponse,
              user: profile,
            });
          }
        } catch (err) {
          if (onError) onError(err);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (error) {
    if (onError) onError(error);
  }
};

/**
 * Lấy thông tin Profile người dùng từ Google UserInfo API thông qua Access Token
 */
export const fetchGoogleUserInfo = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`UserInfo request failed with status: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.sub,
    googleId: data.sub,
    name: data.name || data.email?.split('@')[0] || 'Google User',
    email: data.email,
    picture: data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.email}`,
    locale: data.locale || 'vi',
  };
};

/**
 * Đăng xuất Google Session khỏi bộ nhớ
 */
export const signOutGoogle = () => {
  try {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (e) {
    console.warn('Disable auto select error:', e);
  }

  localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEYS.ID_TOKEN);
  localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEYS.USER_PROFILE);
};
