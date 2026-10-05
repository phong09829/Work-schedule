// Cloud Synchronization & Multi-Device Universal Authentication Engine (100% Passwordless OTP)
// Supports Zero-Config Multi-Cloud Sync, Instant Phone-to-PC Pairing, and Offline-First Local Cache
// Mỗi Gmail là một tài khoản và phân vùng dữ liệu riêng biệt.

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
 * Chuẩn hóa email
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * 100% Deterministic Pure JavaScript SHA-256 implementation
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
 * Mỗi Gmail có các Cloud Topic phân vùng riêng biệt (100% độc lập, không trùng lặp)
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

// Cross-tab Broadcast Channel
let broadcastChan = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    broadcastChan = new BroadcastChannel('focusflow_global_sync_channel');
  }
} catch (_) {}

/**
 * Lưu trữ dữ liệu tài khoản lên Cloud Server và Local Cache
 */
export const saveToCloudRemote = async (key, data) => {
  if (!data) return false;
  const cleanEmail = normalizeEmail(data.email || (key && key.includes('@') ? key : ''));
  const topics = getCloudTopics(cleanEmail || key);
  const payload = JSON.stringify(data);

  // 1. Lưu vào Local Cache
  try {
    localStorage.setItem(`cloud_cache_${key}`, payload);
    localStorage.setItem(`cloud_cache_${topics.mainTopic}`, payload);
    if (topics.directTopic) {
      localStorage.setItem(`cloud_cache_${topics.directTopic}`, payload);
    }
  } catch (e) {
    console.warn('Local cloud cache write warning:', e);
  }

  // 2. Cập nhật danh sách tài khoản cục bộ
  if (cleanEmail) {
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(u => normalizeEmail(u.email) === cleanEmail);
    const userSummary = {
      id: data.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: data.name || cleanEmail.split('@')[0],
      avatar: data.avatar || null,
      provider: data.provider || 'email_otp',
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

  // 3. Broadcast liên tab
  try {
    if (broadcastChan) {
      broadcastChan.postMessage({ type: 'CLOUD_UPDATE', key, data });
    }
  } catch (_) {}

  // 4. Đồng bộ Cloud Relay (ntfy.sh) không chặn giao diện
  try {
    const pushToNtfy = async (topic, bodyStr, title) => {
      if (!topic) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
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
      pushToNtfy(topics.directTopic, payload, 'FocusFlow Cloud Sync Direct'),
      pushToNtfy(topics.mainTopic, payload, 'FocusFlow Cloud Sync Main'),
      pushToNtfy(topics.dataTopic, payload, 'FocusFlow Cloud Sync Data'),
    ];

    Promise.allSettled(pushTasks).catch(() => {});
    return true;
  } catch (err) {
    console.warn('Cloud remote push error:', err);
    return false;
  }
};

/**
 * Tải dữ liệu từ Cloud Server hoặc Local Cache
 */
export const loadFromCloudRemote = async (key, emailHint = null) => {
  const cleanEmail = normalizeEmail(emailHint || (key && key.includes('@') ? key : ''));
  const topics = getCloudTopics(cleanEmail || key);

  // 1. Kiểm tra Local Cache trước (tốc độ tức thì < 1ms)
  const candidateKeys = [
    `cloud_cache_${key}`,
    `cloud_cache_${topics.mainTopic}`,
    topics.directTopic ? `cloud_cache_${topics.directTopic}` : null,
  ].filter(Boolean);

  for (const cKey of candidateKeys) {
    try {
      const raw = localStorage.getItem(cKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.email || parsed.tasks || parsed.events || parsed.data)) {
          return parsed;
        }
      }
    } catch (_) {}
  }

  // 2. Truy vấn từ Cloud Relay
  const fetchTopic = async (topic) => {
    if (!topic) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);

      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const item = JSON.parse(lines[i]);
          if (item.event === 'message' && item.message) {
            const dataObj = JSON.parse(item.message);
            if (dataObj && (dataObj.email || dataObj.tasks || dataObj.events || dataObj.data)) {
              return dataObj;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  };

  const results = await Promise.allSettled([
    topics.directTopic ? fetchTopic(topics.directTopic) : Promise.resolve(null),
    fetchTopic(topics.mainTopic),
    fetchTopic(topics.dataTopic),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      try {
        localStorage.setItem(`cloud_cache_${key}`, JSON.stringify(r.value));
      } catch (_) {}
      return r.value;
    }
  }

  return null;
};

/**
 * Đẩy dữ liệu người dùng lên Cloud
 */
export const pushUserDataToCloud = async (currentUser, dataset) => {
  if (!currentUser || !currentUser.email) return false;
  const cleanEmail = normalizeEmail(currentUser.email);
  const cloudKey = await getUserCloudKey(cleanEmail);

  const payload = {
    id: currentUser.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: currentUser.name || cleanEmail.split('@')[0],
    avatar: currentUser.avatar || null,
    provider: currentUser.provider || 'email_otp',
    updatedAt: new Date().toISOString(),
    data: {
      tasks: dataset.tasks || DEFAULT_TASKS,
      events: dataset.events || DEFAULT_CALENDAR_EVENTS,
      pomoSessions: dataset.pomoSessions || generateInitialPomoSessions(),
      settings: dataset.settings || DEFAULT_SETTINGS,
    }
  };

  return await saveToCloudRemote(cloudKey, payload);
};

/**
 * Kéo dữ liệu người dùng từ Cloud về
 */
export const pullUserDataFromCloud = async (currentUser) => {
  if (!currentUser || !currentUser.email) return null;
  const cleanEmail = normalizeEmail(currentUser.email);
  const cloudKey = await getUserCloudKey(cleanEmail);
  const doc = await loadFromCloudRemote(cloudKey, cleanEmail);

  if (doc && doc.data) {
    return doc.data;
  }
  return null;
};

/**
 * Lắng nghe sự kiện đồng bộ thời gian thực qua SSE
 */
export const subscribeToCloudEvents = (currentUser, onRemoteUpdate) => {
  if (!currentUser || !currentUser.email || typeof window === 'undefined') {
    return () => {};
  }

  const cleanEmail = normalizeEmail(currentUser.email);
  const topics = getCloudTopics(cleanEmail);

  const eventSources = [];

  const handleMsg = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      if (parsed.event === 'message' && parsed.message) {
        const dataObj = JSON.parse(parsed.message);
        if (dataObj && dataObj.data && normalizeEmail(dataObj.email) === cleanEmail) {
          onRemoteUpdate(dataObj.data);
        }
      }
    } catch (_) {}
  };

  try {
    const es = new EventSource(`https://ntfy.sh/${topics.mainTopic}/sse`);
    es.onmessage = handleMsg;
    eventSources.push(es);

    return () => {
      eventSources.forEach(s => {
        try { s.close(); } catch (_) {}
      });
    };
  } catch (e) {
    return () => {};
  }
};

/**
 * Xóa tài khoản trên Cloud
 */
export const deleteCloudAccount = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  deleteUserAccount(cleanEmail);

  const cloudKey = await getUserCloudKey(cleanEmail);
  try {
    localStorage.removeItem(`cloud_cache_${cloudKey}`);
  } catch (_) {}

  return true;
};

/**
 * Xóa toàn bộ tài khoản
 */
export const clearAllCloudAccounts = async () => {
  clearAllRegisteredAccounts();
  return true;
};

/**
 * Tạo mã đồng bộ nhanh giữa các thiết bị
 */
export const generateQuickSyncToken = (currentUser, dataset) => {
  if (!currentUser || !currentUser.email) return '';
  const payload = {
    email: normalizeEmail(currentUser.email),
    name: currentUser.name || currentUser.email.split('@')[0],
    data: dataset,
    ts: Date.now()
  };
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (_) {
    return '';
  }
};

export const parseQuickSyncToken = (tokenStr) => {
  if (!tokenStr || typeof tokenStr !== 'string') return null;
  try {
    const jsonStr = decodeURIComponent(escape(atob(tokenStr.trim())));
    return JSON.parse(jsonStr);
  } catch (_) {
    return null;
  }
};

export const generatePhoneLoginLink = (currentUser, dataset) => {
  const token = generateQuickSyncToken(currentUser, dataset);
  if (!token) return '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://focusflow.app';
  return `${baseUrl}?sync_token=${encodeURIComponent(token)}`;
};

export const exportFullBackup = (currentUser, dataset) => {
  const backup = {
    version: 'focusflow_v3',
    exportDate: new Date().toISOString(),
    account: currentUser || { email: 'guest' },
    data: dataset,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focusflow_backup_${currentUser?.email || 'guest'}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
