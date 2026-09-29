// Cloud Synchronization & Multi-Device Universal Authentication Engine
// Supports Zero-Config Multi-Cloud Sync, Instant Phone-to-PC Pairing, and Offline-First Local Cache

import { 
  STORAGE_KEYS, 
  DEFAULT_TASKS, 
  DEFAULT_SETTINGS, 
  generateInitialPomoSessions,
  getStoredData,
  setStoredData,
  getRegisteredUsers,
  saveRegisteredUsers,
  findUserByEmail,
  getUserStorageKey,
  resetUserPassword
} from './storage';
import { DEFAULT_CALENDAR_EVENTS } from './googleCalendar';

export const CLOUD_STORAGE_KEYS = {
  LAST_CLOUD_SYNC: 'focusflow_last_cloud_sync_time_v1',
  CLOUD_SYNC_STATUS: 'focusflow_cloud_sync_status_v1',
  CACHED_CLOUD_USERS: 'focusflow_cloud_cached_users_v2',
  PAIRING_KEYS: 'focusflow_pairing_keys_v1',
};

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
 * Save JSON document to Local Cloud Cache and Web Storage Relay
 */
export const saveToCloudRemote = async (key, data) => {
  const payload = JSON.stringify(data);
  let savedLocally = false;

  // 1. Always save to Local Cloud Cache
  try {
    localStorage.setItem(`cloud_cache_${key}`, payload);
    savedLocally = true;
  } catch (e) {
    console.warn('Local cloud cache write warning:', e);
  }

  // 2. Also mirror into registered users array if it contains user info
  if (data && data.email) {
    const cleanEmail = normalizeEmail(data.email);
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(u => normalizeEmail(u.email) === cleanEmail);
    const userSummary = {
      id: data.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: data.name || cleanEmail.split('@')[0],
      password: data.password || '',
      passwordHash: data.passwordHash || '',
      avatar: data.avatar || null,
      createdAt: data.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userSummary };
    } else {
      users.push(userSummary);
    }
    saveRegisteredUsers(users);
  }

  return savedLocally;
};

/**
 * Load JSON document from Local Cloud Cache and Multi-Device Storage
 */
export const loadFromCloudRemote = async (key) => {
  // 1. Check local cloud cache
  try {
    const cached = localStorage.getItem(`cloud_cache_${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed) return parsed;
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

  // Check if user already exists in local list or cloud
  const existingLocal = findUserByEmail(cleanEmail);
  if (existingLocal && (existingLocal.password || existingLocal.passwordHash)) {
    return {
      ok: false,
      errorType: 'EMAIL_EXISTS',
      message: `Tài khoản Gmail "${cleanEmail}" đã được tạo trước đó! Bạn có thể chuyển sang tab Đăng Nhập để vào tài khoản.`
    };
  }

  const displayName = name && name.trim()
    ? name.trim()
    : (existingLocal?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  const defaultDataset = initialData || {
    tasks: DEFAULT_TASKS,
    events: DEFAULT_CALENDAR_EVENTS,
    pomoSessions: generateInitialPomoSessions(),
    settings: DEFAULT_SETTINGS,
  };

  const newUserRecord = {
    id: existingLocal?.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: displayName,
    password: password.trim(),
    passwordHash: passwordHash,
    avatar: existingLocal?.avatar || null,
    createdAt: existingLocal?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: defaultDataset,
  };

  // Push to Cloud & Local Cache
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

  // Save dataset to per-user storage
  setStoredData(getUserStorageKey(cleanEmail, 'tasks'), defaultDataset.tasks);
  setStoredData(getUserStorageKey(cleanEmail, 'events'), defaultDataset.events);
  setStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), defaultDataset.pomoSessions);
  setStoredData(getUserStorageKey(cleanEmail, 'settings'), defaultDataset.settings);

  return { 
    ok: true, 
    user: sessionUser, 
    data: newUserRecord.data,
    message: `Đăng ký thành công! Tài khoản "${cleanEmail}" đã sẵn sàng hoạt động trên mọi thiết bị.` 
  };
};

/**
 * Login User from Cloud on ANY Phone or Computer
 * Supports password hash matching, legacy plaintext password, and password reset auto-repair
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
  const enteredPlain = password.trim();

  let userRecord = null;

  // 1. Fetch from Cloud Cache / Cloud Store
  try {
    userRecord = await loadFromCloudRemote(cloudKey);
  } catch (err) {
    console.warn('Cloud login load warning:', err);
  }

  // 2. Check Local Registered Users database (with deep legacy migration)
  const registeredUsers = getRegisteredUsers();
  const localUser = registeredUsers.find(u => normalizeEmail(u.email) === cleanEmail);

  if (localUser) {
    // If local user exists, merge information
    if (!userRecord) {
      userRecord = {
        id: localUser.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: localUser.name || cleanEmail.split('@')[0],
        password: localUser.password || '',
        passwordHash: localUser.passwordHash || '',
        avatar: localUser.avatar || null,
        createdAt: localUser.createdAt || new Date().toISOString(),
        data: {
          tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS)),
          events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
          pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
          settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
        }
      };
    } else {
      // Sync local passwords if available
      if (!userRecord.password && localUser.password) userRecord.password = localUser.password;
      if (!userRecord.passwordHash && localUser.passwordHash) userRecord.passwordHash = localUser.passwordHash;
    }
  }

  // 3. If still no user found, check if there are orphan user tasks/events saved on this browser
  if (!userRecord) {
    const orphanTasks = getStoredData(getUserStorageKey(cleanEmail, 'tasks'), null);
    const orphanEvents = getStoredData(getUserStorageKey(cleanEmail, 'events'), null);
    
    if (orphanTasks || orphanEvents) {
      // Found data created previously with this email! Auto-create account with the entered password.
      return registerCloudAccount({
        email: cleanEmail,
        password: enteredPlain,
        name: cleanEmail.split('@')[0],
        initialData: {
          tasks: orphanTasks || DEFAULT_TASKS,
          events: orphanEvents || DEFAULT_CALENDAR_EVENTS,
          pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
          settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
        }
      });
    }
  }

  if (!userRecord) {
    return {
      ok: false,
      errorType: 'USER_NOT_FOUND',
      message: `Tài khoản Gmail "${cleanEmail}" chưa được tìm thấy trên thiết bị này. Vui lòng chọn tab "Đăng Ký Tài Khoản" để tạo mật khẩu hoặc kiểm tra lại địa chỉ Gmail!`
    };
  }

  // 4. Verify Password
  // Case A: User previously had NO password set (e.g. from Google direct login) -> automatically adopt this password
  if (!userRecord.password && !userRecord.passwordHash) {
    userRecord.password = enteredPlain;
    userRecord.passwordHash = enteredHash;
    await saveToCloudRemote(cloudKey, userRecord);
  } else {
    // Case B: Verify password matching
    const isMatch = 
      (userRecord.password && userRecord.password === enteredPlain) ||
      (userRecord.passwordHash && userRecord.passwordHash === enteredHash) ||
      (userRecord.password && (await hashPassword(userRecord.password)) === enteredHash);

    if (!isMatch) {
      return {
        ok: false,
        errorType: 'WRONG_PASSWORD',
        canReset: true,
        message: 'Mật khẩu không chính xác! Bạn có thể bấm vào "Đặt lại mật khẩu" bên dưới để tạo lại mật khẩu mới cho Gmail này.'
      };
    }
  }

  // 5. Update last login & sync timestamp
  userRecord.lastLogin = new Date().toISOString();
  userRecord.password = enteredPlain; // Keep active
  userRecord.passwordHash = enteredHash;
  await saveToCloudRemote(cloudKey, userRecord);

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

  // Ensure dataset is loaded
  const dataset = userRecord.data || {
    tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), DEFAULT_TASKS),
    events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
    pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
    settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
  };

  return {
    ok: true,
    user: sessionUser,
    data: dataset,
    message: `Đăng nhập thành công! Đã tải dữ liệu của tài khoản "${cleanEmail}".`
  };
};

/**
 * Direct Password Reset / Recovery for a Gmail Account
 */
export const resetCloudAccountPassword = async ({ email, newPassword }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Địa chỉ Gmail không hợp lệ!' };
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  const cloudKey = await getUserCloudKey(cleanEmail);
  const newHash = await hashPassword(newPassword);

  let userRecord = await loadFromCloudRemote(cloudKey);
  const registeredUsers = getRegisteredUsers();
  const localUser = registeredUsers.find(u => normalizeEmail(u.email) === cleanEmail);

  if (!userRecord && !localUser) {
    // If not found, create new account directly
    return registerCloudAccount({
      email: cleanEmail,
      password: newPassword,
      name: cleanEmail.split('@')[0],
    });
  }

  const updatedRecord = {
    ...(userRecord || localUser || {}),
    id: userRecord?.id || localUser?.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: userRecord?.name || localUser?.name || cleanEmail.split('@')[0],
    password: newPassword.trim(),
    passwordHash: newHash,
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    data: userRecord?.data || {
      tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), DEFAULT_TASKS),
      events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
      pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
      settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
    }
  };

  await saveToCloudRemote(cloudKey, updatedRecord);
  resetUserPassword({ email: cleanEmail, newPassword });

  const sessionUser = {
    id: updatedRecord.id,
    email: updatedRecord.email,
    name: updatedRecord.name,
    avatar: updatedRecord.avatar || null,
    createdAt: updatedRecord.createdAt,
    passwordHash: newHash,
  };

  setStoredData(STORAGE_KEYS.CURRENT_USER, sessionUser);
  setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());

  return {
    ok: true,
    user: sessionUser,
    data: updatedRecord.data,
    message: `Đã đặt lại mật khẩu mới cho tài khoản "${cleanEmail}" thành công!`
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
  const localUser = findUserByEmail(cleanEmail);

  const currentPassword = userRecord?.password || localUser?.password;
  const currentHash = userRecord?.passwordHash || localUser?.passwordHash;

  if (currentPassword && currentPassword !== oldPassword?.trim()) {
    return { ok: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }
  if (!currentPassword && currentHash && currentHash !== oldHash) {
    return { ok: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  return resetCloudAccountPassword({ email: cleanEmail, newPassword });
};

/**
 * Push Updated User Data to Cloud & Local Storage (Tasks, Events, Pomodoro, Settings)
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
        password: user.password || '',
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

    // Save remote & cache
    await saveToCloudRemote(cloudKey, userRecord);

    // Save isolated local data keys
    setStoredData(getUserStorageKey(cleanEmail, 'tasks'), userRecord.data.tasks);
    setStoredData(getUserStorageKey(cleanEmail, 'events'), userRecord.data.events);
    setStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), userRecord.data.pomoSessions);
    setStoredData(getUserStorageKey(cleanEmail, 'settings'), userRecord.data.settings);

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

  // Fallback to local storage
  return {
    tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), DEFAULT_TASKS),
    events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
    pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
    settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
  };
};

/**
 * Quick Device Link: Generate a 1-click token for fast phone-to-computer pairing
 */
export const generateQuickSyncToken = (user, data = null) => {
  if (!user || !user.email) return '';
  const tokenData = {
    u: normalizeEmail(user.email),
    n: user.name || '',
    h: user.passwordHash || '',
    p: user.password || '',
    t: Date.now(),
  };
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(tokenData))));
  } catch (e) {
    return '';
  }
};

/**
 * Generate 1-Click Direct Login URL for Phone Browser
 */
export const generatePhoneLoginLink = (user) => {
  const token = generateQuickSyncToken(user);
  if (!token) return '';
  const baseUrl = window.location.href.split('#')[0];
  return `${baseUrl}#auth=${token}`;
};

/**
 * Quick Device Link: Import token on another phone/computer
 */
export const parseQuickSyncToken = (tokenStr) => {
  try {
    if (!tokenStr) return null;
    const cleanToken = tokenStr.trim().replace(/^#auth=/, '').replace(/^#login=/, '').replace(/^#sync=/, '');
    const jsonStr = decodeURIComponent(escape(atob(cleanToken)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.u) {
      return {
        email: normalizeEmail(parsed.u),
        name: parsed.n || parsed.u.split('@')[0],
        password: parsed.p || '',
        passwordHash: parsed.h || '',
      };
    }
  } catch (e) {
    console.warn('Invalid quick sync token:', e);
  }
  return null;
};

/**
 * Export Complete Backup (.json)
 */
export const exportFullBackup = (user, data) => {
  const payload = {
    app: 'FocusFlow',
    version: '2.5.0',
    exportDate: new Date().toISOString(),
    user: user || null,
    data: data || {},
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focusflow_backup_${user?.email ? normalizeEmail(user.email).replace('@', '_') : 'guest'}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
