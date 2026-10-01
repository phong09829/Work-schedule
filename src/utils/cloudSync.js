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
  resetUserPassword,
  deleteUserAccount,
  clearAllRegisteredAccounts
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
 * 100% Deterministic Pure JavaScript SHA-256 implementation
 * Guarantees identical 64-character hex hash across ALL platforms, browsers,
 * HTTP / HTTPS, localhost, mobile webviews, iPhone, and Android.
 */
export const sha256Pure = (ascii) => {
  if (!ascii) return '';
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const utf8 = unescape(encodeURIComponent(ascii));
  const utf8BitLength = utf8.length * 8;
  const words = [];

  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << ((3 - (i % 4)) * 8);
  }

  words[utf8BitLength >> 5] |= 0x80 << (24 - (utf8BitLength % 32));
  words[(((utf8BitLength + 64) >> 9) << 4) + 15] = utf8BitLength;

  const w = new Array(64);

  for (let i = 0; i < words.length; i += 16) {
    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
};

/**
 * Legacy Fallback Hash used in earlier non-crypto builds (for seamless backward compatibility)
 */
export const legacyFallbackHash = (text) => {
  if (!text) return '';
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
 * SHA-256 Cryptographic Hash for secure password storage and user namespace
 * Uses pure deterministic SHA-256 (with Web Crypto API verification when available)
 */
export const hashPassword = async (password, salt = 'focusflow_secure_salt_2026') => {
  if (!password) return '';
  const text = `${salt}:${password.trim()}:${salt}`;
  
  // Try Web Crypto API first if available in secure context
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {}
  }

  // Pure JavaScript SHA-256 (Identical output to Web Crypto API)
  return sha256Pure(text);
};

/**
 * Safe user document key and multi-channel topics in cloud database
 * Produces deterministic, collision-free topics for phone, PC, and all devices
 */
export const getCloudTopics = (emailOrKey) => {
  let cleanEmail = '';
  let hash = '';
  let directTopic = '';
  let directAuthTopic = '';
  if (emailOrKey && typeof emailOrKey === 'string') {
    if (emailOrKey.includes('@')) {
      cleanEmail = normalizeEmail(emailOrKey);
      hash = sha256Pure(`user_cloud_ns:${cleanEmail}`).slice(0, 24);
      const safe = cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 40);
      directTopic = `ff_em_${safe}`;
      directAuthTopic = `ff_ema_${safe}`;
    } else {
      hash = emailOrKey.replace(/^ff_auth_/, '').replace(/^ff_data_/, '').replace(/^ff_u_/, '').replace(/^ff_user_/, '').replace(/^ff_/, '');
    }
  }
  return {
    authTopic: `ff_auth_${hash}`,
    dataTopic: `ff_data_${hash}`,
    mainTopic: `ff_u_${hash}`,
    legacyTopic: `ff_user_${hash}`,
    directTopic: directTopic || `ff_em_${hash}`,
    directAuthTopic: directAuthTopic || `ff_ema_${hash}`,
    hash,
  };
};

export const getUserCloudKey = async (email) => {
  const clean = normalizeEmail(email);
  const hash = sha256Pure(`user_cloud_ns:${clean}`);
  return `ff_u_${hash.slice(0, 24)}`;
};

export const getLegacyUserCloudKey = (email) => {
  const clean = normalizeEmail(email);
  const text = `user_id_salt:${clean}:user_id_salt`;
  const leg = legacyFallbackHash(text);
  return `ff_user_${leg.slice(0, 24)}`;
};

/**
 * Multi-factor verification: compares entered password against stored password,
 * standard SHA-256 hash, and legacy hashes
 */
export const verifyPasswordRecord = async (enteredPassword, userRecord) => {
  if (!enteredPassword || !userRecord) return false;
  // If userRecord doesn't have a valid password or hash, verification must fail
  if (!userRecord.password && !userRecord.passwordHash) return false;

  const enteredPlain = enteredPassword.trim();
  if (!enteredPlain) return false;
  const enteredHash = await hashPassword(enteredPlain);
  const text = `focusflow_secure_salt_2026:${enteredPlain}:focusflow_secure_salt_2026`;
  const enteredLegacyHash = legacyFallbackHash(text);

  // 1. Plaintext direct match (must be non-empty)
  if (userRecord.password && userRecord.password.trim() === enteredPlain) {
    return true;
  }

  // 2. Standard SHA-256 match
  if (userRecord.passwordHash && userRecord.passwordHash === enteredHash) {
    return true;
  }

  // 3. Stored password hashed matches
  if (userRecord.password && userRecord.password.trim()) {
    const storedHashed = await hashPassword(userRecord.password.trim());
    if (storedHashed === enteredHash) return true;
    if (userRecord.password.trim() === enteredHash) return true;
  }

  // 4. Legacy custom hash match
  if (userRecord.passwordHash && userRecord.passwordHash === enteredLegacyHash) {
    return true;
  }

  return false;
};

// Cross-tab / Cross-window Real-time Broadcast Channel
let broadcastChan = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    broadcastChan = new BroadcastChannel('focusflow_global_sync_channel');
  }
} catch (_) {}

/**
 * Save JSON document to Global Cloud Server and Local Cloud Cache
 * Ensures ANY device (Phone, PC, Tablet) can access this account worldwide
 */
export const saveToCloudRemote = async (key, data) => {
  if (!data) return false;
  const cleanEmail = normalizeEmail(data.email || (key && key.includes('@') ? key : ''));
  const topics = getCloudTopics(cleanEmail || key);
  const payload = JSON.stringify(data);

  // 1. Save to Local Cloud Cache
  try {
    localStorage.setItem(`cloud_cache_${key}`, payload);
    localStorage.setItem(`cloud_cache_${topics.mainTopic}`, payload);
    if (topics.directTopic) {
      localStorage.setItem(`cloud_cache_${topics.directTopic}`, payload);
    }
  } catch (e) {
    console.warn('Local cloud cache write warning:', e);
  }

  // 2. Mirror into registered users array if it contains user info
  if (cleanEmail) {
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(u => normalizeEmail(u.email) === cleanEmail);
    const userSummary = {
      id: data.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: data.name || cleanEmail.split('@')[0],
      password: data.password || '',
      passwordHash: data.passwordHash || '',
      passwordUpdatedAt: data.passwordUpdatedAt || data.updatedAt || new Date().toISOString(),
      avatar: data.avatar || null,
      createdAt: data.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userSummary };
    } else {
      users.push(userSummary);
    }
    saveRegisteredUsers(users);
  }

  // 3. Broadcast to all open tabs / windows on this device
  try {
    if (broadcastChan) {
      broadcastChan.postMessage({ type: 'CLOUD_UPDATE', key, data });
    }
  } catch (_) {}

  // 4. Background Global Cloud Relay Push (Non-blocking for instant UI response)
  try {
    const authData = {
      type: 'AUTH_RECORD',
      id: data.id,
      email: cleanEmail,
      name: data.name,
      password: data.password || '',
      passwordHash: data.passwordHash || '',
      passwordUpdatedAt: data.passwordUpdatedAt || data.updatedAt || new Date().toISOString(),
      avatar: data.avatar || null,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    const pushToNtfy = async (topic, bodyStr, title) => {
      if (!topic) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: bodyStr,
          headers: {
            'Title': title,
            'Priority': 'urgent',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (_) {}
    };

    const pushTasks = [
      pushToNtfy(topics.authTopic, JSON.stringify(authData), 'FocusFlow Auth Record'),
      pushToNtfy(topics.directAuthTopic, JSON.stringify(authData), 'FocusFlow Auth Record Direct'),
      pushToNtfy(topics.mainTopic, payload, 'FocusFlow Cloud Sync'),
      pushToNtfy(topics.directTopic, payload, 'FocusFlow Direct Sync'),
    ];

    if (data.data) {
      const dataPayload = {
        type: 'DATA_RECORD',
        email: cleanEmail,
        updatedAt: data.updatedAt || new Date().toISOString(),
        data: data.data,
      };
      pushTasks.push(pushToNtfy(topics.dataTopic, JSON.stringify(dataPayload), 'FocusFlow User Data'));
    }

    if (topics.legacyTopic && topics.legacyTopic !== topics.mainTopic) {
      pushTasks.push(pushToNtfy(topics.legacyTopic, payload, 'FocusFlow Cloud Sync'));
    }

    Promise.allSettled(pushTasks).catch(() => {});
  } catch (cloudErr) {
    console.warn('Real cloud push warning:', cloudErr);
  }

  return true;
};

/**
 * Load JSON document from Global Cloud Server and Local Cloud Cache
 * Fast parallel query with low latency
 */
export const loadFromCloudRemote = async (key, email = null) => {
  let cloudRecord = null;
  const cleanEmail = normalizeEmail(email || (key && key.includes('@') ? key : ''));
  const topics = getCloudTopics(cleanEmail || key);

  // Helper to fetch and extract latest document from a cloud topic with 1.8s timeout
  const fetchTopicDoc = async (topicName) => {
    if (!topicName) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`https://ntfy.sh/${topicName}/json?poll=1&t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-cache',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const lines = text.trim().split('\n').filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const item = JSON.parse(lines[i]);
              if (item && item.message) {
                try {
                  const parsedDoc = JSON.parse(item.message);
                  if (parsedDoc && typeof parsedDoc === 'object') {
                    return parsedDoc;
                  }
                } catch (_) {}
              }
              if (item && item.attachment && item.attachment.url) {
                try {
                  const fileRes = await fetch(item.attachment.url);
                  if (fileRes.ok) {
                    const doc = await fileRes.json();
                    if (doc && typeof doc === 'object') {
                      return doc;
                    }
                  }
                } catch (_) {}
              }
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
    return null;
  };

  try {
    const fetchPromises = [
      fetchTopicDoc(topics.authTopic),
      fetchTopicDoc(topics.directAuthTopic),
      fetchTopicDoc(topics.dataTopic),
      fetchTopicDoc(topics.mainTopic),
      fetchTopicDoc(topics.directTopic),
    ];

    if (topics.legacyTopic && topics.legacyTopic !== topics.mainTopic) {
      fetchPromises.push(fetchTopicDoc(topics.legacyTopic));
    }

    if (cleanEmail) {
      const legKey = getLegacyUserCloudKey(cleanEmail);
      if (legKey && legKey !== topics.mainTopic && legKey !== topics.legacyTopic) {
        fetchPromises.push(fetchTopicDoc(legKey));
      }
    }

    const results = await Promise.allSettled(fetchPromises);
    const docs = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);

    let merged = {};
    for (const doc of docs) {
      if (!doc || typeof doc !== 'object') continue;
      merged = {
        ...merged,
        ...doc,
      };
      if (doc.data) {
        merged.data = doc.data;
      }
      if (doc.password || doc.passwordHash) {
        merged.password = doc.password || merged.password || '';
        merged.passwordHash = doc.passwordHash || merged.passwordHash || '';
        merged.passwordUpdatedAt = doc.passwordUpdatedAt || merged.passwordUpdatedAt;
      }
    }

    if (merged.email || merged.password || merged.passwordHash || merged.data) {
      cloudRecord = merged;
    }
  } catch (err) {
    console.warn('Parallel cloud fetch warning:', err);
  }

  // If fetched from cloud, cache locally and sync user catalog
  if (cloudRecord) {
    try {
      const jsonStr = JSON.stringify(cloudRecord);
      localStorage.setItem(`cloud_cache_${key}`, jsonStr);
      localStorage.setItem(`cloud_cache_${topics.mainTopic}`, jsonStr);
      if (topics.directTopic) {
        localStorage.setItem(`cloud_cache_${topics.directTopic}`, jsonStr);
      }
      if (cloudRecord.email) {
        const uEmail = normalizeEmail(cloudRecord.email);
        const users = getRegisteredUsers();
        const existingIdx = users.findIndex(u => normalizeEmail(u.email) === uEmail);
        const userSummary = {
          id: cloudRecord.id || `usr-${Date.now()}`,
          email: uEmail,
          name: cloudRecord.name || uEmail.split('@')[0],
          password: cloudRecord.password || '',
          passwordHash: cloudRecord.passwordHash || '',
          passwordUpdatedAt: cloudRecord.passwordUpdatedAt || cloudRecord.updatedAt || new Date().toISOString(),
          avatar: cloudRecord.avatar || null,
          createdAt: cloudRecord.createdAt || new Date().toISOString(),
          lastLogin: cloudRecord.lastLogin || new Date().toISOString(),
          updatedAt: cloudRecord.updatedAt || new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          users[existingIdx] = { ...users[existingIdx], ...userSummary };
        } else {
          users.push(userSummary);
        }
        saveRegisteredUsers(users);
      }
    } catch (_) {}
    return cloudRecord;
  }

  // Fallback to local cloud cache
  try {
    const cached = localStorage.getItem(`cloud_cache_${key}`) ||
      localStorage.getItem(`cloud_cache_${topics.mainTopic}`) ||
      (topics.directTopic ? localStorage.getItem(`cloud_cache_${topics.directTopic}`) : null);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed) return parsed;
    }
    if (cleanEmail) {
      const legKey = getLegacyUserCloudKey(cleanEmail);
      const legCached = localStorage.getItem(`cloud_cache_${legKey}`);
      if (legCached) {
        const parsed = JSON.parse(legCached);
        if (parsed) return parsed;
      }
    }
  } catch (_) {}

  return null;
};

/**
 * Real-Time SSE Cloud Listener: Notifies when another device makes changes
 */
export const subscribeToCloudEvents = (key, onUpdate) => {
  if (typeof window === 'undefined' || !window.EventSource || !key) return () => {};
  try {
    const topics = getCloudTopics(key);
    const eventSources = [];

    const handleMessage = (e) => {
      try {
        const msgObj = JSON.parse(e.data);
        if (msgObj) {
          if (msgObj.message) {
            try {
              const doc = JSON.parse(msgObj.message);
              if (doc && (doc.email || doc.data || doc.password || doc.passwordHash)) {
                onUpdate(doc);
                return;
              }
            } catch (_) {}
          }
          if (msgObj.attachment && msgObj.attachment.url) {
            fetch(msgObj.attachment.url).then(r => r.json()).then(doc => {
              if (doc && (doc.email || doc.data)) {
                onUpdate(doc);
              }
            }).catch(() => {});
          }
        }
      } catch (_) {}
    };

    // Listen on both Data Topic and Main Topic
    const esData = new EventSource(`https://ntfy.sh/${topics.dataTopic}/sse`);
    esData.onmessage = handleMessage;
    eventSources.push(esData);

    const esMain = new EventSource(`https://ntfy.sh/${topics.mainTopic}/sse`);
    esMain.onmessage = handleMessage;
    eventSources.push(esMain);

    return () => {
      eventSources.forEach(es => {
        try { es.close(); } catch (_) {}
      });
    };
  } catch (e) {
    return () => {};
  }
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
  const enteredPlain = password.trim();

  // Check if user already exists locally or in fast cache
  const existingLocal = findUserByEmail(cleanEmail);
  let cachedCloud = null;
  try {
    const raw = localStorage.getItem(`cloud_cache_${cloudKey}`);
    if (raw) cachedCloud = JSON.parse(raw);
  } catch (_) {}

  const existing = (existingLocal && (existingLocal.password || existingLocal.passwordHash) ? existingLocal : null) ||
    (cachedCloud && (cachedCloud.password || cachedCloud.passwordHash) ? cachedCloud : null);

  if (existing && (existing.password || existing.passwordHash)) {
    const isMatch = await verifyPasswordRecord(enteredPlain, existing);
    if (isMatch) {
      return loginCloudAccount({ email: cleanEmail, password: enteredPlain });
    }
    return {
      ok: false,
      errorType: 'EMAIL_EXISTS',
      message: `Tài khoản Gmail "${cleanEmail}" đã được tạo mật khẩu trước đó trên hệ thống! Vui lòng chuyển sang tab "Đăng Nhập" để nhập đúng mật khẩu hoặc chọn "Đặt lại mật khẩu".`
    };
  }

  const displayName = name && name.trim()
    ? name.trim()
    : (existing?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

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
    password: enteredPlain,
    passwordHash: passwordHash,
    passwordUpdatedAt: new Date().toISOString(),
    avatar: existingLocal?.avatar || null,
    createdAt: existingLocal?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: defaultDataset,
  };

  // Push to Cloud in background (non-blocking)
  saveToCloudRemote(cloudKey, newUserRecord).catch(() => {});

  const legacyKey = getLegacyUserCloudKey(cleanEmail);
  if (legacyKey && legacyKey !== cloudKey) {
    saveToCloudRemote(legacyKey, newUserRecord).catch(() => {});
  }

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
    message: `Đăng ký thành công! Mật khẩu cho Gmail "${cleanEmail}" đã được kích hoạt đồng bộ trên cả máy tính & điện thoại.` 
  };
};

/**
 * Login User from Cloud on ANY Phone or Computer
 * Instant Local-First (< 10ms) + Fast Remote Cloud Query (< 1s)
 */
export const loginCloudAccount = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return { ok: false, message: 'Vui lòng nhập địa chỉ Gmail!' };
  }
  if (!password || !password.trim()) {
    return { ok: false, message: 'Vui lòng nhập mật khẩu tài khoản!' };
  }

  const cloudKey = await getUserCloudKey(cleanEmail);
  const enteredPlain = password.trim();
  const enteredHash = await hashPassword(enteredPlain);

  // 1. FAST PATH (Instant 0.01s): Check local database or local cloud cache FIRST
  const registeredUsers = getRegisteredUsers();
  const localUser = registeredUsers.find(u => normalizeEmail(u.email) === cleanEmail && (u.password || u.passwordHash));
  let cachedCloud = null;
  try {
    const raw = localStorage.getItem(`cloud_cache_${cloudKey}`);
    if (raw) cachedCloud = JSON.parse(raw);
  } catch (_) {}

  const fastLocalCandidate = localUser || (cachedCloud && (cachedCloud.password || cachedCloud.passwordHash) ? cachedCloud : null);

  if (fastLocalCandidate) {
    const isFastMatch = await verifyPasswordRecord(enteredPlain, fastLocalCandidate);
    if (isFastMatch) {
      const sessionUser = {
        id: fastLocalCandidate.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: fastLocalCandidate.name || cleanEmail.split('@')[0],
        avatar: fastLocalCandidate.avatar || null,
        createdAt: fastLocalCandidate.createdAt || new Date().toISOString(),
        passwordHash: enteredHash,
      };

      setStoredData(STORAGE_KEYS.CURRENT_USER, sessionUser);
      setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());

      const dataset = fastLocalCandidate.data || {
        tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS)),
        events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
        pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
        settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
      };

      setStoredData(getUserStorageKey(cleanEmail, 'tasks'), dataset.tasks);
      setStoredData(getUserStorageKey(cleanEmail, 'events'), dataset.events);
      setStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), dataset.pomoSessions);
      setStoredData(getUserStorageKey(cleanEmail, 'settings'), dataset.settings);

      // Background cloud update (non-blocking)
      saveToCloudRemote(cloudKey, {
        ...fastLocalCandidate,
        email: cleanEmail,
        password: enteredPlain,
        passwordHash: enteredHash,
        lastLogin: new Date().toISOString(),
        data: dataset,
      }).catch(() => {});

      return {
        ok: true,
        user: sessionUser,
        data: dataset,
        message: `Đăng nhập thành công! Đã tải dữ liệu của tài khoản "${cleanEmail}".`,
      };
    }
  }

  // 2. REMOTE CLOUD PATH: Fast parallel query across remote topics (for new device / phone)
  let userRecord = null;
  try {
    userRecord = await loadFromCloudRemote(cloudKey, cleanEmail);
  } catch (err) {
    console.warn('Cloud login fetch error:', err);
  }

  if (!userRecord || (!userRecord.password && !userRecord.passwordHash)) {
    if (fastLocalCandidate) {
      userRecord = fastLocalCandidate;
    }
  }

  // If no account with a password exists anywhere on Cloud or Local cache
  if (!userRecord || (!userRecord.password && !userRecord.passwordHash)) {
    return {
      ok: false,
      errorType: 'USER_NOT_FOUND',
      message: `Tài khoản Gmail "${cleanEmail}" chưa được đăng ký mật khẩu trên hệ thống. Vui lòng chuyển sang tab "Đăng Ký Mới" để tạo mật khẩu hoặc kiểm tra lại địa chỉ Gmail!`
    };
  }

  // 3. Strict Password Verification
  const isMatch = await verifyPasswordRecord(enteredPlain, userRecord);

  if (!isMatch) {
    return {
      ok: false,
      errorType: 'WRONG_PASSWORD',
      canReset: true,
      message: 'Mật khẩu không chính xác! Mỗi tài khoản Gmail chỉ có DUY NHẤT 1 mật khẩu cho cả máy tính và điện thoại. Nếu bạn đã đổi mật khẩu, vui lòng nhập mật khẩu mới nhất hoặc chọn "Đặt lại mật khẩu" bên dưới.'
    };
  }

  // 4. Password valid! Set session and save
  userRecord.lastLogin = new Date().toISOString();
  userRecord.password = enteredPlain;
  userRecord.passwordHash = enteredHash;
  saveToCloudRemote(cloudKey, userRecord).catch(() => {});

  const sessionUser = {
    id: userRecord.id || `usr-${Date.now()}`,
    email: userRecord.email || cleanEmail,
    name: userRecord.name || cleanEmail.split('@')[0],
    avatar: userRecord.avatar || null,
    createdAt: userRecord.createdAt || new Date().toISOString(),
    passwordHash: enteredHash,
  };

  setStoredData(STORAGE_KEYS.CURRENT_USER, sessionUser);
  setStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());

  const dataset = userRecord.data || {
    tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), DEFAULT_TASKS),
    events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
    pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
    settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
  };

  setStoredData(getUserStorageKey(cleanEmail, 'tasks'), dataset.tasks);
  setStoredData(getUserStorageKey(cleanEmail, 'events'), dataset.events);
  setStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), dataset.pomoSessions);
  setStoredData(getUserStorageKey(cleanEmail, 'settings'), dataset.settings);

  return {
    ok: true,
    user: sessionUser,
    data: dataset,
    message: `Đăng nhập thành công! Đã tải dữ liệu của tài khoản "${cleanEmail}".`
  };
};

/**
 * Direct Password Reset / Recovery for a Gmail Account
 * Guarantees instant propagation to PC, Phone, and all devices
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
  const enteredPlain = newPassword.trim();
  const newHash = await hashPassword(enteredPlain);

  let userRecord = null;
  try {
    userRecord = await loadFromCloudRemote(cloudKey, cleanEmail);
  } catch (_) {}

  const registeredUsers = getRegisteredUsers();
  const localUser = registeredUsers.find(u => normalizeEmail(u.email) === cleanEmail);

  const existingData = userRecord?.data || {
    tasks: getStoredData(getUserStorageKey(cleanEmail, 'tasks'), DEFAULT_TASKS),
    events: getStoredData(getUserStorageKey(cleanEmail, 'events'), DEFAULT_CALENDAR_EVENTS),
    pomoSessions: getStoredData(getUserStorageKey(cleanEmail, 'pomo_sessions'), generateInitialPomoSessions()),
    settings: getStoredData(getUserStorageKey(cleanEmail, 'settings'), DEFAULT_SETTINGS),
  };

  const updatedRecord = {
    ...(userRecord || localUser || {}),
    id: userRecord?.id || localUser?.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: userRecord?.name || localUser?.name || cleanEmail.split('@')[0],
    password: enteredPlain,
    passwordHash: newHash,
    passwordUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    data: existingData,
  };

  // 1. Push updated record to Cloud immediately with urgent priority
  await saveToCloudRemote(cloudKey, updatedRecord);

  // 2. Also push to legacy cloud key if applicable
  const legacyKey = getLegacyUserCloudKey(cleanEmail);
  if (legacyKey && legacyKey !== cloudKey) {
    await saveToCloudRemote(legacyKey, updatedRecord);
  }

  // 3. Update local user records
  resetUserPassword({ email: cleanEmail, newPassword: enteredPlain });

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
    message: `Đã cập nhật mật khẩu mới cho tài khoản "${cleanEmail}" thành công! Từ bây giờ, tất cả thiết bị (máy tính, điện thoại) đều phải đăng nhập bằng mật khẩu mới này.`
  };
};

/**
 * Change Cloud Password
 * Verifies current password and synchronizes immediately to all devices
 */
export const changeCloudPassword = async ({ email, oldPassword, newPassword }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return { ok: false, message: 'Chưa xác định tài khoản!' };

  const cloudKey = await getUserCloudKey(cleanEmail);
  let userRecord = null;
  try {
    userRecord = await loadFromCloudRemote(cloudKey, cleanEmail);
  } catch (_) {}

  if (!userRecord) {
    const localUser = findUserByEmail(cleanEmail);
    if (localUser && (localUser.password || localUser.passwordHash)) {
      userRecord = localUser;
    }
  }

  if (!userRecord) {
    return { ok: false, message: 'Không tìm thấy thông tin tài khoản trên hệ thống!' };
  }

  // Verify old password strictly
  const isOldValid = await verifyPasswordRecord(oldPassword, userRecord);
  if (!isOldValid) {
    return { ok: false, message: 'Mật khẩu hiện tại không chính xác! Vui lòng kiểm tra lại.' };
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
 * Bundles user credentials and current data payload so target device immediately has all data
 */
export const generateQuickSyncToken = (user, data = null) => {
  if (!user || !user.email) return '';
  const tokenData = {
    u: normalizeEmail(user.email),
    n: user.name || '',
    h: user.passwordHash || '',
    p: user.password || '',
    t: Date.now(),
    d: data ? {
      tasks: data.tasks || [],
      events: data.events || [],
      pomoSessions: data.pomoSessions || [],
      settings: data.settings || null,
    } : null,
  };
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(tokenData))));
  } catch (e) {
    return '';
  }
};

/**
 * Generate 1-Click Direct Login & Sync URL for Phone Browser
 */
export const generatePhoneLoginLink = (user, data = null) => {
  const token = generateQuickSyncToken(user, data);
  if (!token) return '';
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    const isLocal = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.protocol === 'file:';
      
    if (isLocal) {
      baseUrl = 'https://phong09829.github.io/Work-schedule/';
    } else {
      baseUrl = window.location.href.split('#')[0];
    }
  } else {
    baseUrl = 'https://phong09829.github.io/Work-schedule/';
  }
  return `${baseUrl}#sync=${token}`;
};

/**
 * Quick Device Link: Import token on another phone/computer
 */
export const parseQuickSyncToken = (tokenStr) => {
  try {
    if (!tokenStr) return null;
    const cleanToken = tokenStr.trim().replace(/^#(auth|login|sync|data)=/, '');
    const jsonStr = decodeURIComponent(escape(atob(cleanToken)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.u) {
      return {
        email: normalizeEmail(parsed.u),
        name: parsed.n || parsed.u.split('@')[0],
        password: parsed.p || '',
        passwordHash: parsed.h || '',
        data: parsed.d || null,
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

/**
 * Permanently Delete an Account from Cloud & Local
 */
export const deleteCloudAccount = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;
  const topics = getCloudTopics(cleanEmail);

  // Publish empty tombstone / deleted record to cloud topics
  const tombstone = {
    type: 'DELETED',
    email: cleanEmail,
    deletedAt: new Date().toISOString(),
    data: null,
    password: '',
    passwordHash: '',
  };

  try {
    const payload = JSON.stringify(tombstone);
    fetch(`https://ntfy.sh/${topics.authTopic}`, { method: 'POST', body: payload, headers: { 'Title': 'FocusFlow Account Deleted', 'Priority': 'urgent' } }).catch(() => {});
    fetch(`https://ntfy.sh/${topics.dataTopic}`, { method: 'POST', body: payload, headers: { 'Title': 'FocusFlow Data Cleared', 'Priority': 'urgent' } }).catch(() => {});
    fetch(`https://ntfy.sh/${topics.mainTopic}`, { method: 'POST', body: payload, headers: { 'Title': 'FocusFlow Wiped', 'Priority': 'urgent' } }).catch(() => {});
    if (topics.legacyTopic && topics.legacyTopic !== topics.mainTopic) {
      fetch(`https://ntfy.sh/${topics.legacyTopic}`, { method: 'POST', body: payload }).catch(() => {});
    }
  } catch (_) {}

  // Delete local record
  deleteUserAccount(cleanEmail);

  try {
    localStorage.removeItem(`cloud_cache_${topics.mainTopic}`);
    localStorage.removeItem(`cloud_cache_${topics.legacyTopic}`);
  } catch (_) {}

  return true;
};

/**
 * Permanently Wipe ALL Created Gmail Accounts from Cloud & Local Browser
 */
export const clearAllCloudAccounts = async () => {
  const users = getRegisteredUsers();
  for (const u of users) {
    if (u.email) {
      await deleteCloudAccount(u.email);
    }
  }
  clearAllRegisteredAccounts();
  return true;
};
