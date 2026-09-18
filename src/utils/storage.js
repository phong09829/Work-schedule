// LocalStorage management and initial demo seed data

const STORAGE_KEYS = {
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

// Default default settings
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

export const getStoredData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
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

export { STORAGE_KEYS };
