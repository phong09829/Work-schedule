// LocalStorage management, multi-account authentication, and isolated user data storage

const STORAGE_KEYS = {
  USERS: 'focusflow_registered_users_v2',
  CURRENT_USER: 'focusflow_current_user_v2',
  TASKS: 'focusflow_tasks_v1',
  POMO_SESSIONS: 'focusflow_pomo_sessions_v1',
  SETTINGS: 'focusflow_settings_v1',
  STATS: 'focusflow_stats_v1',
  THEME: 'focusflow_theme_v1',
};

// Default sample tasks on fresh install
export const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Hoàn thiện đồ án Web Time Management',
    description: 'Xây dựng giao diện ReactJS, tính năng Pomodoro, tích hợp âm thanh và xuất báo cáo năng suất.',
    category: 'Học tập',
    priority: 'high', // 'high' | 'medium' | 'low'
    status: 'in_progress', // 'todo' | 'in_progress' | 'done'
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    estimatedPomos: 4,
    completedPomos: 2,
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    completedAt: null,
  },
  {
    id: 'task-2',
    title: 'Nghiên cứu kiến trúc TailwindCSS và Dark Mode',
    description: 'Tối ưu bảng màu HSL, hiệu ứng Glassmorphism và tối ưu trải nghiệm người dùng trên Mobile.',
    category: 'Công việc',
    priority: 'medium',
    status: 'todo',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    estimatedPomos: 2,
    completedPomos: 0,
    createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    completedAt: null,
  },
  {
    id: 'task-3',
    title: 'Đọc 30 trang sách "Deep Work" của Cal Newport',
    description: 'Ghi chú lại các phương pháp tập trung cao độ và áp dụng vào chu kỳ Pomodoro mỗi ngày.',
    category: 'Cá nhân',
    priority: 'low',
    status: 'done',
    deadline: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 16),
    estimatedPomos: 1,
    completedPomos: 1,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    completedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Luyện tập thể dục buổi chiều 45 phút',
    description: 'Chạy bộ và giãn cơ giúp tinh thần sảng khoái và tái tạo năng lượng.',
    category: 'Cá nhân',
    priority: 'medium',
    status: 'todo',
    deadline: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 16),
    estimatedPomos: 2,
    completedPomos: 0,
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    completedAt: null,
  }
];

// Default settings
export const DEFAULT_SETTINGS = {
  focusDuration: 25, // minutes
  shortBreakDuration: 5, // minutes
  longBreakDuration: 15, // minutes
  longBreakInterval: 4, // every 4 focus sessions
  dailyGoalPomos: 8, // Target pomos per day
  dailyGoalHours: 4, // Target hours per day
  autoStartBreaks: true,
  autoStartPomos: false,
  soundEnabled: true,
  soundVolume: 0.8,
  notificationEnabled: true,
};

// Seed realistic Pomodoro sessions for the past 7 days
export const generateInitialPomoSessions = () => {
  const sessions = [];
  const now = new Date();
  
  // Create past week entries
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Vary between 3 to 8 sessions per past day
    const count = i === 0 ? 3 : Math.floor(Math.random() * 5) + 3;
    for (let j = 0; j < count; j++) {
      sessions.push({
        id: `pomo-${dateStr}-${j}`,
        date: dateStr,
        durationMinutes: 25,
        type: 'focus',
        taskId: j % 2 === 0 ? 'task-1' : (j % 3 === 0 ? 'task-2' : 'task-3'),
        taskTitle: j % 2 === 0 ? 'Hoàn thiện đồ án Web Time Management' : 'Nghiên cứu kiến trúc TailwindCSS',
        category: j % 2 === 0 ? 'Học tập' : 'Công việc',
        completedAt: new Date(d.getTime() + j * 45 * 60 * 1000).toISOString(),
      });
    }
  }
  return sessions;
};

// Basic storage read/write
export const getStoredData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
};

export const setStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

// --- Multi-Account & User-Specific Storage Utilities ---

export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

export const getUserStorageKey = (email, dataType) => {
  const cleanEmail = normalizeEmail(email) || 'guest';
  const safeEmail = cleanEmail.replace(/[^a-z0-9@._-]/g, '_');
  return `focusflow_u_${safeEmail}_${dataType}_v2`;
};

// Retrieve registered user list with deep scanning across storage
export const getRegisteredUsers = () => {
  const userMap = new Map();

  // Helper to add/merge a user object
  const mergeUser = (u) => {
    if (!u || !u.email) return;
    const clean = normalizeEmail(u.email);
    if (!clean || !clean.includes('@')) return;

    const existing = userMap.get(clean);
    if (!existing) {
      // Only register account if it has valid identity metadata
      userMap.set(clean, {
        id: u.id || `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        email: clean,
        name: u.name || clean.split('@')[0],
        password: u.password || '',
        passwordHash: u.passwordHash || '',
        avatar: u.avatar || u.picture || null,
        createdAt: u.createdAt || new Date().toISOString(),
        lastLogin: u.lastLogin || new Date().toISOString(),
      });
    } else {
      // Merge best available properties (never wipe out an existing password)
      if (!existing.password && u.password) existing.password = u.password;
      if (!existing.passwordHash && u.passwordHash) existing.passwordHash = u.passwordHash;
      if (!existing.name && u.name) existing.name = u.name;
      if (!existing.avatar && (u.avatar || u.picture)) existing.avatar = u.avatar || u.picture;
    }
  };

  // 1. Primary registered users list
  const primaryUsers = getStoredData(STORAGE_KEYS.USERS, []);
  if (Array.isArray(primaryUsers)) {
    primaryUsers.forEach(mergeUser);
  }

  // 2. Scan historical keys in localStorage
  const legacyKeys = [
    'focusflow_registered_users_v2',
    'focusflow_registered_users_v1',
    'focusflow_users_v1',
    'focusflow_users',
    'focusflow_current_user_v2',
    'focusflow_current_user_v1',
    'focusflow_current_user',
    'focusflow_user_profile_v1',
    'focusflow_google_user_v1',
    'focusflow_cloud_cached_users_v2',
    'focusflow_cloud_cached_users_v1'
  ];

  legacyKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(mergeUser);
        } else if (parsed && typeof parsed === 'object' && parsed.email) {
          mergeUser(parsed);
        }
      }
    } catch (_) {}
  });

  // 3. Scan cloud cache keys for authenticated accounts
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      if (k.startsWith('cloud_cache_ff_user_') || k.startsWith('cloud_cache_ff_u_')) {
        try {
          const item = JSON.parse(localStorage.getItem(k));
          if (item && item.email && (item.password || item.passwordHash)) {
            mergeUser(item);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  const mergedList = Array.from(userMap.values());
  
  // Persist merged list
  if (mergedList.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedList));
    } catch (_) {}
  }

  return mergedList;
};

// Save registered user list
export const saveRegisteredUsers = (users) => {
  setStoredData(STORAGE_KEYS.USERS, users);
};

// Find a user by email (case-insensitive)
export const findUserByEmail = (email) => {
  const clean = normalizeEmail(email);
  if (!clean) return null;
  const users = getRegisteredUsers();
  return users.find(u => normalizeEmail(u.email) === clean) || null;
};

// Get current logged-in user
export const getCurrentUser = () => {
  const user = getStoredData(STORAGE_KEYS.CURRENT_USER, null);
  if (user && user.email) {
    user.email = normalizeEmail(user.email);
  }
  return user;
};

// Set current logged-in user
export const setCurrentUser = (user) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    const cleanUser = {
      ...user,
      email: normalizeEmail(user.email),
    };
    setStoredData(STORAGE_KEYS.CURRENT_USER, cleanUser);
  }
};

// Register a new user account with unique password per Gmail
export const registerUserAccount = ({ email, password, name }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Địa chỉ Gmail không hợp lệ! Vui lòng kiểm tra lại.' };
  }
  if (!password || password.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu phải có ít nhất 4 ký tự!' };
  }

  const existing = findUserByEmail(cleanEmail);
  if (existing && (existing.password || existing.passwordHash)) {
    return { 
      ok: false, 
      errorType: 'EMAIL_EXISTS',
      message: `Tài khoản Gmail "${cleanEmail}" đã được tạo trước đó! Bạn có thể đăng nhập hoặc đặt lại mật khẩu.` 
    };
  }

  const displayName = name && name.trim()
    ? name.trim()
    : (existing?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  const newUser = {
    id: existing?.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: displayName,
    password: password.trim(),
    avatar: existing?.avatar || null,
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  const users = getRegisteredUsers().filter(u => normalizeEmail(u.email) !== cleanEmail);
  users.push(newUser);
  saveRegisteredUsers(users);

  // Set active session
  const sessionUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    avatar: newUser.avatar,
    createdAt: newUser.createdAt,
  };
  setCurrentUser(sessionUser);

  return { ok: true, user: sessionUser };
};

// Log in an existing user with Gmail + Password
export const loginUserAccount = ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return { ok: false, message: 'Vui lòng nhập địa chỉ Gmail!' };
  }

  const user = findUserByEmail(cleanEmail);
  if (!user || (!user.password && !user.passwordHash)) {
    return { 
      ok: false, 
      errorType: 'USER_NOT_FOUND',
      message: `Tài khoản Gmail "${cleanEmail}" chưa được đăng ký mật khẩu trên thiết bị này. Vui lòng chuyển sang tab "Đăng Ký Mới"!` 
    };
  }

  if (user.password && user.password !== password?.trim()) {
    return { 
      ok: false, 
      errorType: 'WRONG_PASSWORD',
      message: 'Mật khẩu không chính xác! Mỗi tài khoản Gmail chỉ có duy nhất 1 mật khẩu trên mọi thiết bị. Vui lòng kiểm tra lại.' 
    };
  }

  // Update last login
  const users = getRegisteredUsers();
  const updatedUsers = users.map(u => {
    if (normalizeEmail(u.email) === cleanEmail) {
      return { ...u, lastLogin: new Date().toISOString() };
    }
    return u;
  });
  saveRegisteredUsers(updatedUsers);

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
  setCurrentUser(sessionUser);

  return { ok: true, user: sessionUser };
};

// Reset password for a Gmail account
export const resetUserPassword = ({ email, newPassword }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Địa chỉ Gmail không hợp lệ!' };
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  const users = getRegisteredUsers();
  let user = users.find(u => normalizeEmail(u.email) === cleanEmail);

  if (!user) {
    // Create user if not found
    user = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      password: newPassword.trim(),
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users.push(user);
  } else {
    user.password = newPassword.trim();
    user.lastLogin = new Date().toISOString();
  }

  const updatedUsers = users.map(u => normalizeEmail(u.email) === cleanEmail ? { ...u, password: newPassword.trim() } : u);
  saveRegisteredUsers(updatedUsers);

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
  setCurrentUser(sessionUser);

  return { ok: true, user: sessionUser, message: 'Đã đặt lại mật khẩu thành công!' };
};

// Change account password for a Gmail
export const changeUserPassword = ({ email, oldPassword, newPassword }) => {
  const cleanEmail = normalizeEmail(email);
  const user = findUserByEmail(cleanEmail);
  if (!user) {
    return { ok: false, message: 'Không tìm thấy thông tin tài khoản!' };
  }

  if (user.password && user.password !== oldPassword?.trim()) {
    return { ok: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { ok: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  return resetUserPassword({ email: cleanEmail, newPassword });
};

// Delete a specific user account from local storage
export const deleteUserAccount = (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  const users = getRegisteredUsers().filter(u => normalizeEmail(u.email) !== cleanEmail);
  saveRegisteredUsers(users);

  const cur = getCurrentUser();
  if (cur && normalizeEmail(cur.email) === cleanEmail) {
    setCurrentUser(null);
  }

  // Remove isolated data keys
  try {
    localStorage.removeItem(getUserStorageKey(cleanEmail, 'tasks'));
    localStorage.removeItem(getUserStorageKey(cleanEmail, 'events'));
    localStorage.removeItem(getUserStorageKey(cleanEmail, 'pomo_sessions'));
    localStorage.removeItem(getUserStorageKey(cleanEmail, 'settings'));
  } catch (_) {}

  return true;
};

// Permanently delete ALL Gmail accounts and reset user storage on this device
export const clearAllRegisteredAccounts = () => {
  try {
    // 1. Remove current user & registered users list
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);

    // 2. Remove all legacy user keys
    const keysToRemove = [
      'focusflow_registered_users_v2',
      'focusflow_registered_users_v1',
      'focusflow_users_v1',
      'focusflow_users',
      'focusflow_current_user_v2',
      'focusflow_current_user_v1',
      'focusflow_current_user',
      'focusflow_user_profile_v1',
      'focusflow_google_user_v1',
      'focusflow_cloud_cached_users_v2',
      'focusflow_cloud_cached_users_v1',
      'focusflow_last_cloud_sync_time_v1',
      'focusflow_cloud_last_sync_v2'
    ];
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    // 3. Scan & remove all user-specific data keys and cloud caches
    const keysInStorage = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keysInStorage.push(k);
    }

    keysInStorage.forEach(k => {
      if (
        k.startsWith('focusflow_u_') ||
        k.startsWith('cloud_cache_') ||
        k.startsWith('focusflow_google_')
      ) {
        try { localStorage.removeItem(k); } catch (_) {}
      }
    });

    // 4. Save empty registered users list
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    return true;
  } catch (err) {
    console.error('Error clearing registered accounts:', err);
    return false;
  }
};

// User-specific data helper functions
export const getUserData = (email, dataType, fallback) => {
  const key = getUserStorageKey(email, dataType);
  return getStoredData(key, fallback);
};

export const setUserData = (email, dataType, value) => {
  const key = getUserStorageKey(email, dataType);
  setStoredData(key, value);
};

export { STORAGE_KEYS };
