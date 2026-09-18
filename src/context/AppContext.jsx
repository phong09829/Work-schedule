import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  STORAGE_KEYS, 
  DEFAULT_TASKS, 
  DEFAULT_SETTINGS, 
  generateInitialPomoSessions, 
  getStoredData, 
  setStoredData 
} from '../utils/storage';
import { soundManager } from '../utils/audio';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tasks' | 'pomodoro'

  // Tasks State
  const [tasks, setTasks] = useState(() => {
    return getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  });

  // Pomodoro Sessions History
  const [pomoSessions, setPomoSessions] = useState(() => {
    return getStoredData(STORAGE_KEYS.POMO_SESSIONS, generateInitialPomoSessions());
  });

  // Settings State
  const [settings, setSettings] = useState(() => {
    return getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  });

  // Active Task currently linked to Pomodoro
  const [activeTaskId, setActiveTaskId] = useState(() => {
    return tasks.find(t => t.status === 'in_progress')?.id || tasks[0]?.id || null;
  });

  // Toast Notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(current => (current && current.id <= Date.now() - duration ? null : current));
    }, duration);
  };

  // Persist Tasks
  useEffect(() => {
    setStoredData(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // Persist Pomodoro Sessions
  useEffect(() => {
    setStoredData(STORAGE_KEYS.POMO_SESSIONS, pomoSessions);
  }, [pomoSessions]);

  // Persist Settings
  useEffect(() => {
    setStoredData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Active Task Object
  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  // Task Actions
  const addTask = (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      category: taskData.category || 'Công việc',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      deadline: taskData.deadline || '',
      estimatedPomos: Number(taskData.estimatedPomos) || 1,
      completedPomos: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setTasks(prev => [newTask, ...prev]);
    showToast(`Đã thêm công việc: "${newTask.title}"`, 'success');
    return newTask;
  };

  const updateTask = (id, updatedFields) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isNowDone = updatedFields.status === 'done' && task.status !== 'done';
        const updated = {
          ...task,
          ...updatedFields,
          completedAt: isNowDone ? new Date().toISOString() : (updatedFields.status && updatedFields.status !== 'done' ? null : task.completedAt),
        };
        return updated;
      }
      return task;
    }));
    showToast('Đã cập nhật công việc thành công!', 'info');
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    showToast(`Đã xóa công việc "${taskToDelete?.title || ''}"`, 'warning');
  };

  const moveTaskStatus = (id, newStatus) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isBecomingDone = newStatus === 'done' && task.status !== 'done';
        if (isBecomingDone) {
          // Trigger confetti & sound
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.7 }
            });
            if (settings.soundEnabled) {
              soundManager.playTaskSuccessSound(settings.soundVolume);
            }
          } catch (e) {
            console.log(e);
          }
        }
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'done' ? new Date().toISOString() : null,
        };
      }
      return task;
    }));
  };

  const linkTaskToPomodoro = (task) => {
    setActiveTaskId(task.id);
    setActiveTab('pomodoro');
    showToast(`Đã chọn "${task.title}" cho phiên Pomodoro`, 'info');
  };

  // Pomodoro Actions
  const recordCompletedPomodoro = (pomoType = 'focus') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const durationMins = pomoType === 'focus' ? settings.focusDuration : (pomoType === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration);

    if (pomoType === 'focus') {
      // If a task is linked, increment its completed pomodoros
      if (activeTaskId) {
        setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
            const newCount = (t.completedPomos || 0) + 1;
            return {
              ...t,
              completedPomos: newCount,
              status: t.status === 'todo' ? 'in_progress' : t.status
            };
          }
          return t;
        }));
      }

      // Add to session logs
      const newSession = {
        id: `pomo-${Date.now()}`,
        date: todayStr,
        durationMinutes: durationMins,
        type: 'focus',
        taskId: activeTaskId || null,
        taskTitle: activeTask?.title || 'Tập trung tự do',
        category: activeTask?.category || 'Chung',
        completedAt: new Date().toISOString(),
      };

      setPomoSessions(prev => [newSession, ...prev]);
      showToast(`Tuyệt vời! Bạn vừa hoàn thành 1 phiên Focus (${durationMins}p)`, 'success');
      
      // Celebrate
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Đã lưu cấu hình cài đặt!', 'success');
  };

  // Export JSON Data
  const exportData = () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tasks,
      pomoSessions,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focusflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu sao lưu thành công!', 'success');
  };

  // Import JSON Data
  const importData = (jsonData) => {
    try {
      if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
        setTasks(jsonData.tasks);
      }
      if (jsonData.pomoSessions && Array.isArray(jsonData.pomoSessions)) {
        setPomoSessions(jsonData.pomoSessions);
      }
      if (jsonData.settings) {
        setSettings(jsonData.settings);
      }
      showToast('Đã khôi phục dữ liệu thành công!', 'success');
      return true;
    } catch (err) {
      showToast('Lỗi khi đọc file dữ liệu!', 'error');
      return false;
    }
  };

  // Reset to default
  const resetToDefaults = () => {
    setTasks(DEFAULT_TASKS);
    setPomoSessions(generateInitialPomoSessions());
    setSettings(DEFAULT_SETTINGS);
    setActiveTaskId(DEFAULT_TASKS[0]?.id || null);
    showToast('Đã đặt lại dữ liệu mặc định ban đầu!', 'info');
  };

  // Compute Daily & Weekly Analytics
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySessions = useMemo(() => {
    return pomoSessions.filter(s => s.date === todayStr && s.type === 'focus');
  }, [pomoSessions, todayStr]);

  const todayFocusMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [todaySessions]);

  const todayCompletedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.startsWith(todayStr)).length;
  }, [tasks, todayStr]);

  const totalCompletedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'done').length;
  }, [tasks]);

  // Streak Calculation
  const streakDays = useMemo(() => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasFocus = pomoSessions.some(s => s.date === dateStr && s.type === 'focus');
      if (hasFocus) {
        streak++;
      } else if (i > 0) {
        // Break in streak
        break;
      }
    }
    return Math.max(streak, 1);
  }, [pomoSessions]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        linkTaskToPomodoro,
        activeTaskId,
        setActiveTaskId,
        activeTask,
        pomoSessions,
        recordCompletedPomodoro,
        settings,
        updateSettings,
        toast,
        showToast,
        exportData,
        importData,
        resetToDefaults,
        // Analytics
        todayFocusMinutes,
        todayCompletedTasks,
        totalCompletedTasks,
        todayPomoCount: todaySessions.length,
        streakDays,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
