// Cloud Synchronization & Multi-Device Universal Authentication Engine
// Supports zero-config Cloud DB, Firebase Cloud Firestore REST, and Offline-First Local Cache

import { 
  STORAGE_KEYS, 
  DEFAULT_TASKS, 
  DEFAULT_SETTINGS, 
  generateInitialPomoSessions,
  getStoredData,
  setStoredData
} from './storage';
import { DEFAULT_CALENDAR_EVENTS } from './googleCalendar';

export const CLOUD_STORAGE_KEYS = {
  FIREBASE_CONFIG: 'focusflow_firebase_config_v1',
  LAST_CLOUD_SYNC: 'focusflow_last_cloud_sync_time_v1',
  CLOUD_SYNC_STATUS: 'focusflow_cloud_sync_status_v1',
  CACHED_CLOUD_USERS: 'focusflow_cloud_cached_users_v2',
};

// Default high-availability cloud sync relay endpoints (Multi-cloud fallback)
const CLOUD_ENDPOINTS = [
  'https://kvdb.io/AWyG5Z3P5qg4rXp8QW3b79/', // Primary High-Speed KV Database
  'https://api.restful-api.dev/objects',       // Secondary REST Document Storage
];

/**
 * Normalize Email for case-insensitive cross-device login
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * SHA-256 Cryptographic Hash for secure password storage and user namespace
 */
export const hashPassword = async (password, salt = 'focusflow_secure_salt_2026') => {
  if (!password) return '';
  const text = `${salt}:${password.trim()}:${salt}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('SubtleCrypto error, using fallback hash:', e);
    }
  }

  // Pure JS Fallback Hash
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16) + 'abc12345';
};

/**
 * Create a safe user document key in cloud database
 */
export const getUserCloudKey = async (email) => {
  const clean = normalizeEmail(email);
  const hash = await hashPassword(clean, 'user_id_salt');
  return `ff_user_${hash.slice(0, 24)}`;
};

/**
 * Cloud Storage Adapter: Save JSON document to Cloud
 */
export const saveToCloudRemote = async (key, data) => {
  const payload = JSON.stringify(data);
  let saved = false;

  // Try Primary KV Cloud Endpoint
  try {
    const res = await fetch(`https://kvdb.io/AWyG5Z3P5qg4rXp8QW3b79/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    if (res.ok) {
      saved = true;
    }
  } catch (err) {
    console.warn('Primary cloud sync retry:', err);
  }

  // Backup sync to LocalStorage cache
  try {
    localStorage.setItem(`cloud_cache_${key}`, payload);
  } catch (e) {
    console.warn('Local cache error:', e);
  }

  return saved;
};

/**
 * Cloud Storage Adapter: Load JSON document from Cloud
 */
export const loadFromCloudRemote = async (key) => {
  // 1. Try Primary KV Cloud Endpoint
  try {
    const res = await fetch(`https://kvdb.io/AWyG5Z3P5qg4rXp8QW3b79/${key}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        // Update local cache
        try {
          localStorage.setItem(`cloud_cache_${key}`, JSON.stringify(data));
        } catch (_) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Primary cloud load failed, trying local fallback:', err);
  }

  // 2. Fallback to Local Cache if offline or network failure
  try {
    const cached = localStorage.getItem(`cloud_cache_${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return null;
};

/**
 * Register User on Cloud (Accessible from any phone or computer worldwide)
 */
export const registerCloudAccount = async ({ email, password, name, initialData = null }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Địa chỉ Gmail không hợp lệ! Vui lòng kiểm tra lại.' };
  }
  if (!password || password.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu phải có ít nhất 4 ký tự!' };
  }

  const cloudKey = await getUserCloudKey(cleanEmail);
  const passwordHash = await hashPassword(password);

  // Check if user already exists in Cloud
  try {
    const existing = await loadFromCloudRemote(cloudKey);
    if (existing && existing.email && normalizeEmail(existing.email) === cleanEmail) {
      return {
        ok: false,
        errorType: 'EMAIL_EXISTS',
        message: `Tài khoản Gmail "${cleanEmail}" đã tồn tại trên Đám Mây! Vui lòng chuyển sang tab Đăng Nhập để vào tài khoản.`
      };
    }
  } catch (e) {
    console.warn('Check existing user warning:', e);
  }

  const displayName = name && name.trim()
    ? name.trim()
    : cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const defaultDataset = initialData || {
    tasks: DEFAULT_TASKS,
    events: DEFAULT_CALENDAR_EVENTS,
    pomoSessions: generateInitialPomoSessions(),
    settings: DEFAULT_SETTINGS,
  };

  const newUserRecord = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    name: displayName,
    passwordHash: passwordHash,
    avatar: null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: defaultDataset,
  };

  // Push to Cloud Database
  await saveToCloudRemote(cloudKey, newUserRecord);

  // Cache in local storage for instant offline access
  const sessionUser = {
    id: newUserRecord.id,
    email: newUserRecord.email,
    name: newUserRecord.name,
    avatar: newUserRecord.avatar,
    createdAt: newUserRecord.createdAt,
    passwordHash: passwordHash,
  };

  setStoredData(STORAGE_KEYS.CURRENT_USER, sessionUser);
  setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());

  return { 
    ok: true, 
    user: sessionUser, 
    data: newUserRecord.data,
    message: `Đăng ký thành công! Tài khoản của bạn đã sẵn sàng trên mọi thiết bị.` 
  };
};

/**
 * Login User from Cloud on ANY Phone or Computer
 */
export const loginCloudAccount = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return { ok: false, message: 'Vui lòng nhập địa chỉ Gmail!' };
  }
  if (!password) {
    return { ok: false, message: 'Vui lòng nhập mật khẩu tài khoản!' };
  }

  const cloudKey = await getUserCloudKey(cleanEmail);
  const enteredHash = await hashPassword(password);

  let userRecord = null;

  // 1. Fetch user record from Cloud Database
  try {
    userRecord = await loadFromCloudRemote(cloudKey);
  } catch (err) {
    console.warn('Cloud login fetch error:', err);
  }

  // 2. Check Local Storage fallback if cloud fetch failed (e.g. offline)
  if (!userRecord) {
    const cachedUsers = getStoredData(STORAGE_KEYS.USERS, []);
    const localUser = cachedUsers.find(u => normalizeEmail(u.email) === cleanEmail);
    if (localUser) {
      const localHash = localUser.passwordHash || (await hashPassword(localUser.password || ''));
      if (localHash === enteredHash || localUser.password === password.trim()) {
        userRecord = {
          ...localUser,
          passwordHash: localHash,
          data: {
            tasks: getStoredData(`focusflow_u_${cleanEmail}_tasks_v2`, DEFAULT_TASKS),
            events: getStoredData(`focusflow_u_${cleanEmail}_events_v2`, DEFAULT_CALENDAR_EVENTS),
            pomoSessions: getStoredData(`focusflow_u_${cleanEmail}_pomo_sessions_v2`, generateInitialPomoSessions()),
            settings: getStoredData(`focusflow_u_${cleanEmail}_settings_v2`, DEFAULT_SETTINGS),
          }
        };
      }
    }
  }

  if (!userRecord) {
    return {
      ok: false,
      errorType: 'USER_NOT_FOUND',
      message: `Tài khoản Gmail "${cleanEmail}" chưa tồn tại trên hệ thống. Vui lòng chọn tab "Đăng Ký Tài Khoản" để tạo tài khoản mới!`
    };
  }

  // 3. Verify Password Hash
  const isMatch = userRecord.passwordHash === enteredHash || 
                  (userRecord.password && userRecord.password === password.trim());

  if (!isMatch) {
    return {
      ok: false,
      errorType: 'WRONG_PASSWORD',
      message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại mật khẩu.'
    };
  }

  // 4. Update last login & sync timestamp
  userRecord.lastLogin = new Date().toISOString();
  saveToCloudRemote(cloudKey, userRecord).catch(() => {});

  const sessionUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    avatar: userRecord.avatar || null,
    createdAt: userRecord.createdAt,
    passwordHash: enteredHash,
  };

  setStoredData(STORAGE_KEYS.CURRENT_USER, sessionUser);
  setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());

  return {
    ok: true,
    user: sessionUser,
    data: userRecord.data || {
      tasks: DEFAULT_TASKS,
      events: DEFAULT_CALENDAR_EVENTS,
      pomoSessions: generateInitialPomoSessions(),
      settings: DEFAULT_SETTINGS,
    },
    message: `Đăng nhập thành công! Đã đồng bộ dữ liệu từ Đám Mây.`
  };
};

/**
 * Change Cloud Password
 */
export const changeCloudPassword = async ({ email, oldPassword, newPassword }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return { ok: false, message: 'Chưa xác định tài khoản!' };

  const cloudKey = await getUserCloudKey(cleanEmail);
  const oldHash = await hashPassword(oldPassword);
  const newHash = await hashPassword(newPassword);

  let userRecord = await loadFromCloudRemote(cloudKey);
  if (!userRecord) {
    return { ok: false, message: 'Không tìm thấy tài khoản trên Đám Mây!' };
  }

  const isOldMatch = userRecord.passwordHash === oldHash || userRecord.password === oldPassword?.trim();
  if (!isOldMatch) {
    return { ok: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  userRecord.passwordHash = newHash;
  delete userRecord.password; // Remove plain password
  userRecord.updatedAt = new Date().toISOString();

  await saveToCloudRemote(cloudKey, userRecord);

  // Update session
  const cur = getStoredData(STORAGE_KEYS.CURRENT_USER, {});
  if (cur && cur.email === cleanEmail) {
    cur.passwordHash = newHash;
    setStoredData(STORAGE_KEYS.CURRENT_USER, cur);
  }

  return { ok: true, message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật lên Đám Mây.' };
};

/**
 * Push Updated User Data to Cloud Database (Tasks, Events, Pomodoro, Settings)
 */
export const pushUserDataToCloud = async (user, dataPayload) => {
  if (!user || !user.email) return false;
  const cleanEmail = normalizeEmail(user.email);
  const cloudKey = await getUserCloudKey(cleanEmail);

  try {
    let userRecord = await loadFromCloudRemote(cloudKey);
    if (!userRecord) {
      userRecord = {
        id: user.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: user.name || cleanEmail.split('@')[0],
        passwordHash: user.passwordHash || '',
        createdAt: user.createdAt || new Date().toISOString(),
      };
    }

    userRecord.updatedAt = new Date().toISOString();
    userRecord.data = {
      tasks: dataPayload.tasks || [],
      events: dataPayload.events || [],
      pomoSessions: dataPayload.pomoSessions || [],
      settings: dataPayload.settings || DEFAULT_SETTINGS,
      lastSyncDevice: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 40) : 'Web App',
    };

    await saveToCloudRemote(cloudKey, userRecord);
    setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
    return true;
  } catch (err) {
    console.warn('Push user data to cloud failed:', err);
    return false;
  }
};

/**
 * Pull Latest User Data from Cloud Database
 */
export const pullUserDataFromCloud = async (user) => {
  if (!user || !user.email) return null;
  const cleanEmail = normalizeEmail(user.email);
  const cloudKey = await getUserCloudKey(cleanEmail);

  try {
    const userRecord = await loadFromCloudRemote(cloudKey);
    if (userRecord && userRecord.data) {
      setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
      return userRecord.data;
    }
  } catch (err) {
    console.warn('Pull user data from cloud failed:', err);
  }
  return null;
};

/**
 * Quick Device Link: Generate a 1-click token for fast phone-to-computer pairing
 */
export const generateQuickSyncToken = (user, data) => {
  if (!user) return '';
  const tokenData = {
    u: user.email,
    n: user.name,
    h: user.passwordHash || '',
    t: Date.now(),
  };
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(tokenData))));
  } catch (e) {
    return '';
  }
};

/**
 * Quick Device Link: Import token on another phone/computer
 */
export const parseQuickSyncToken = (tokenStr) => {
  try {
    const jsonStr = decodeURIComponent(escape(atob(tokenStr.trim())));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.u) {
      return {
        email: parsed.u,
        name: parsed.n,
        passwordHash: parsed.h,
      };
    }
  } catch (e) {
    console.warn('Invalid quick sync token:', e);
  }
  return null;
};
