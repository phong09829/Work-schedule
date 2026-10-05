// LocalStorage management, passwordless OTP multi-account authentication, and isolated user data storage

const STORAGE_KEYS = {
  USERS: 'focusflow_registered_users_v3',
  CURRENT_USER: 'focusflow_current_user_v3',
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

// --- Multi-Account & User-Specific Storage Utilities (Mỗi Gmail là một tài khoản độc lập) ---

export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Mỗi Gmail có bộ key lưu trữ riêng biệt, không bao giờ dùng chung
 */
export const getUserStorageKey = (email, dataType) => {
  const cleanEmail = normalizeEmail(email) || 'guest';
  const safeEmail = cleanEmail.replace(/[^a-z0-9@._-]/g, '_');
  return `focusflow_u_${safeEmail}_${dataType}_v3`;
};

// Retrieve registered user list
export const getRegisteredUsers = () => {
  const users = getStoredData(STORAGE_KEYS.USERS, []);
  if (!Array.isArray(users)) return [];
  return users.filter(u => u && u.email && u.email.includes('@'));
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

/**
 * Lưu hoặc cập nhật thông tin tài khoản Gmail sau khi xác thực OTP thành công
 * (Hoàn toàn không cần mật khẩu)
 */
export const saveUserAccount = ({ email, name, avatar = null, provider = 'email_otp' }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Địa chỉ Gmail không hợp lệ!' };
  }

  const existing = findUserByEmail(cleanEmail);
  const displayName = name && name.trim()
    ? name.trim()
    : (existing?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  const userAccount = {
    id: existing?.id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: displayName,
    avatar: avatar || existing?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    provider,
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  const users = getRegisteredUsers().filter(u => normalizeEmail(u.email) !== cleanEmail);
  users.push(userAccount);
  saveRegisteredUsers(users);
  setCurrentUser(userAccount);

  return { ok: true, user: userAccount };
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

  // Remove isolated data keys for this specific email
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

    // 2. Scan & remove all user-specific data keys and cloud caches
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

    // 3. Save empty registered users list
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    return true;
  } catch (err) {
    console.error('Error clearing registered accounts:', err);
    return false;
  }
};

// User-specific data helper functions (100% riêng biệt từng Gmail)
export const getUserData = (email, dataType, fallback) => {
  if (!email) return fallback;
  const key = getUserStorageKey(email, dataType);
  return getStoredData(key, fallback);
};

export const setUserData = (email, dataType, value) => {
  if (!email) return;
  const key = getUserStorageKey(email, dataType);
  setStoredData(key, value);
};

export { STORAGE_KEYS };
