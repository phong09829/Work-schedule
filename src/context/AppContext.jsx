import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  GOOGLE_STORAGE_KEYS,
  DEFAULT_CALENDAR_EVENTS,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  fetchGoogleUserProfile,
  GOOGLE_SCOPES
} from '../utils/googleCalendar';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State: 'dashboard' | 'tasks' | 'calendar' | 'pomodoro'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Tasks State
  const [tasks, setTasks] = useState(() => {
    return getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  });

  // Calendar Events State
  const [events, setEvents] = useState(() => {
    return getStoredData(GOOGLE_STORAGE_KEYS.CALENDAR_EVENTS, DEFAULT_CALENDAR_EVENTS);
  });

  // Pomodoro Sessions History
  const [pomoSessions, setPomoSessions] = useState(() => {
    return getStoredData(STORAGE_KEYS.POMO_SESSIONS, generateInitialPomoSessions());
  });

  // Settings State
  const [settings, setSettings] = useState(() => {
    return getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  });

  // Google OAuth 2.0 & Sync States
  const [googleClientId, setGoogleClientId] = useState(() => {
    return getStoredData(GOOGLE_STORAGE_KEYS.CLIENT_ID, '');
  });

  const [googleUser, setGoogleUser] = useState(() => {
    return getStoredData(GOOGLE_STORAGE_KEYS.USER_PROFILE, null);
  });

  const [googleToken, setGoogleToken] = useState(() => {
    return getStoredData(GOOGLE_STORAGE_KEYS.AUTH_TOKEN, null);
  });

  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return getStoredData(GOOGLE_STORAGE_KEYS.LAST_SYNC_TIME, null);
  });

  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);

  // Active Task / Event currently linked to Pomodoro
  const [activeTaskId, setActiveTaskId] = useState(() => {
    return tasks.find(t => t.status === 'in_progress')?.id || tasks[0]?.id || null;
  });

  // Toast Notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(current => (current && current.id <= Date.now() - duration ? null : current));
    }, duration);
  }, []);

  // Persist Tasks
  useEffect(() => {
    setStoredData(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // Persist Events
  useEffect(() => {
    setStoredData(GOOGLE_STORAGE_KEYS.CALENDAR_EVENTS, events);
  }, [events]);

  // Persist Pomodoro Sessions
  useEffect(() => {
    setStoredData(STORAGE_KEYS.POMO_SESSIONS, pomoSessions);
  }, [pomoSessions]);

  // Persist Settings
  useEffect(() => {
    setStoredData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Persist Google Auth Info
  useEffect(() => {
    setStoredData(GOOGLE_STORAGE_KEYS.CLIENT_ID, googleClientId);
  }, [googleClientId]);

  useEffect(() => {
    setStoredData(GOOGLE_STORAGE_KEYS.USER_PROFILE, googleUser);
  }, [googleUser]);

  useEffect(() => {
    setStoredData(GOOGLE_STORAGE_KEYS.AUTH_TOKEN, googleToken);
  }, [googleToken]);

  useEffect(() => {
    setStoredData(GOOGLE_STORAGE_KEYS.LAST_SYNC_TIME, lastSyncTime);
  }, [lastSyncTime]);

  // Check if Google user is logged in
  const isGoogleConnected = useMemo(() => {
    return Boolean(googleUser && googleToken?.access_token);
  }, [googleUser, googleToken]);

  // Google Login Handler (supports Google Token Client)
  const handleGoogleLoginSuccess = useCallback(async (tokenResponse) => {
    try {
      const accessToken = tokenResponse.access_token;
      const expiresIn = tokenResponse.expires_in || 3599;
      const tokenObj = {
        access_token: accessToken,
        expires_at: Date.now() + expiresIn * 1000,
        token_type: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope,
      };

      setGoogleToken(tokenObj);

      // Fetch Profile
      const profile = await fetchGoogleUserProfile(accessToken);
      setGoogleUser(profile);
      showToast(`Chào mừng ${profile.name}! Đã kết nối Google thành công.`, 'success');

      // Immediate 2-way sync
      syncWithGoogleCalendar(accessToken);
    } catch (err) {
      console.error('Google login error:', err);
      showToast('Đăng nhập Google thất bại hoặc không thể lấy hồ sơ người dùng.', 'error');
    }
  }, [showToast]);

  // Google Logout Handler
  const handleGoogleLogout = useCallback(() => {
    setGoogleUser(null);
    setGoogleToken(null);
    setLastSyncTime(null);
    showToast('Đã đăng xuất tài khoản Google.', 'info');
  }, [showToast]);

  // Sync with Google Calendar (2-way sync)
  const syncWithGoogleCalendar = useCallback(async (customToken = null) => {
    const token = customToken || googleToken?.access_token;
    if (!token) {
      showToast('Vui lòng đăng nhập Google để đồng bộ Google Calendar!', 'warning');
      return;
    }

    setIsGoogleSyncing(true);
    try {
      // 1. Fetch Google Calendar events (range -30 days to +90 days)
      const now = new Date();
      const minDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
      
      const gcalEvents = await fetchGoogleCalendarEvents(token, minDate, maxDate);

      // 2. Merge with local events
      setEvents(prevEvents => {
        const localNonGoogle = prevEvents.filter(e => !e.googleEventId);
        
        // Match existing local events by googleEventId
        const merged = [...gcalEvents];

        localNonGoogle.forEach(localEvt => {
          // If local event not on google yet, keep it
          merged.push(localEvt);
        });

        return merged;
      });

      const syncTimestamp = new Date().toISOString();
      setLastSyncTime(syncTimestamp);
      showToast(`Đã đồng bộ thành công ${gcalEvents.length} sự kiện từ Google Calendar!`, 'success');
    } catch (err) {
      console.error('Google sync error:', err);
      if (err.message === 'TOKEN_EXPIRED') {
        showToast('Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        handleGoogleLogout();
      } else {
        showToast(`Lỗi đồng bộ Google Calendar: ${err.message || 'Không thể kết nối API'}`, 'error');
      }
    } finally {
      setIsGoogleSyncing(false);
    }
  }, [googleToken, showToast, handleGoogleLogout]);

  // Calendar Event Actions (with Instant 2-way Google Sync)
  const addEvent = useCallback(async (eventData) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      start: eventData.start,
      end: eventData.end || eventData.start,
      allDay: Boolean(eventData.allDay),
      category: eventData.category || 'Công việc',
      color: eventData.color || '#3b82f6',
      location: eventData.location?.trim() || '',
      meetUrl: eventData.meetUrl?.trim() || '',
      isGoogleEvent: false,
      googleEventId: null,
      synced: !isGoogleConnected,
      createdAt: new Date().toISOString(),
    };

    // Update locally first for instant UI response
    setEvents(prev => [newEvent, ...prev]);
    showToast(`Đã thêm lịch trình: "${newEvent.title}"`, 'success');

    // Sync to Google Calendar if connected
    if (isGoogleConnected && googleToken?.access_token) {
      try {
        setIsGoogleSyncing(true);
        const createdGCal = await createGoogleCalendarEvent(googleToken.access_token, newEvent);
        if (createdGCal && createdGCal.id) {
          setEvents(prev => prev.map(e => e.id === newEvent.id ? {
            ...e,
            googleEventId: createdGCal.id,
            isGoogleEvent: true,
            synced: true,
            htmlLink: createdGCal.htmlLink,
            meetUrl: createdGCal.hangoutLink || newEvent.meetUrl,
          } : e));
          showToast(`Đã đồng bộ ngay lên Google Calendar!`, 'success');
        }
      } catch (err) {
        console.error('Sync add event error:', err);
        showToast('Lưu tại máy thành công. Chưa thể đẩy lên Google Calendar.', 'warning');
      } finally {
        setIsGoogleSyncing(false);
      }
    }

    return newEvent;
  }, [isGoogleConnected, googleToken, showToast]);

  const updateEvent = useCallback(async (id, updatedFields) => {
    let targetEvent = null;

    setEvents(prev => prev.map(evt => {
      if (evt.id === id) {
        targetEvent = { ...evt, ...updatedFields };
        return targetEvent;
      }
      return evt;
    }));

    showToast('Đã cập nhật sự kiện lịch trình thành công!', 'info');

    // Sync update to Google Calendar if linked
    if (targetEvent && targetEvent.googleEventId && isGoogleConnected && googleToken?.access_token) {
      try {
        setIsGoogleSyncing(true);
        await updateGoogleCalendarEvent(googleToken.access_token, targetEvent.googleEventId, targetEvent);
        showToast('Đã đồng bộ cập nhật với Google Calendar!', 'success');
      } catch (err) {
        console.error('Sync update event error:', err);
        showToast('Cập nhật nội bộ xong. Lỗi khi đồng bộ Google Calendar.', 'warning');
      } finally {
        setIsGoogleSyncing(false);
      }
    }
  }, [isGoogleConnected, googleToken, showToast]);

  const deleteEvent = useCallback(async (id) => {
    const eventToDelete = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast(`Đã xóa sự kiện "${eventToDelete?.title || ''}"`, 'warning');

    // Delete on Google Calendar if linked
    if (eventToDelete && eventToDelete.googleEventId && isGoogleConnected && googleToken?.access_token) {
      try {
        setIsGoogleSyncing(true);
        await deleteGoogleCalendarEvent(googleToken.access_token, eventToDelete.googleEventId);
        showToast('Đã xóa sự kiện trên Google Calendar!', 'success');
      } catch (err) {
        console.error('Sync delete event error:', err);
      } finally {
        setIsGoogleSyncing(false);
      }
    }
  }, [events, isGoogleConnected, googleToken, showToast]);

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

    // If deadline is present and user wants auto-calendar-sync
    if (taskData.syncToCalendar && taskData.deadline) {
      const deadlineDate = new Date(taskData.deadline);
      const endDate = new Date(deadlineDate.getTime() + 60 * 60 * 1000);
      addEvent({
        title: `[Việc] ${newTask.title}`,
        description: newTask.description || `Mục tiêu: ${newTask.estimatedPomos} Pomodoro. Ưu tiên: ${newTask.priority}`,
        start: deadlineDate.toISOString(),
        end: endDate.toISOString(),
        allDay: false,
        category: newTask.category || 'Công việc',
        color: newTask.priority === 'high' ? '#ef4444' : '#3b82f6',
      });
    }

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

  const linkEventToPomodoro = (event) => {
    // Check if task exists for this event or create temporary link
    let existingTask = tasks.find(t => t.title === event.title);
    if (!existingTask) {
      const created = addTask({
        title: event.title,
        description: event.description || event.location || 'Sự kiện từ Lịch trình',
        category: event.category || 'Công việc',
        priority: 'medium',
        status: 'in_progress',
        deadline: event.start,
        estimatedPomos: 2,
      });
      setActiveTaskId(created.id);
    } else {
      setActiveTaskId(existingTask.id);
    }
    setActiveTab('pomodoro');
    showToast(`Đã kết nối "${event.title}" với đồng hồ Pomodoro!`, 'info');
  };

  // Pomodoro Actions
  const recordCompletedPomodoro = (pomoType = 'focus') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const durationMins = pomoType === 'focus' ? settings.focusDuration : (pomoType === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration);

    if (pomoType === 'focus') {
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
      version: '2.0',
      exportDate: new Date().toISOString(),
      tasks,
      events,
      pomoSessions,
      settings,
      googleClientId,
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
      if (jsonData.events && Array.isArray(jsonData.events)) {
        setEvents(jsonData.events);
      }
      if (jsonData.pomoSessions && Array.isArray(jsonData.pomoSessions)) {
        setPomoSessions(jsonData.pomoSessions);
      }
      if (jsonData.settings) {
        setSettings(jsonData.settings);
      }
      if (jsonData.googleClientId) {
        setGoogleClientId(jsonData.googleClientId);
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
    setEvents(DEFAULT_CALENDAR_EVENTS);
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
        // Tasks
        tasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        linkTaskToPomodoro,
        linkEventToPomodoro,
        activeTaskId,
        setActiveTaskId,
        activeTask,
        // Calendar & Google 2-way Sync
        events,
        setEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        syncWithGoogleCalendar,
        isGoogleSyncing,
        lastSyncTime,
        // Google Auth
        googleUser,
        googleToken,
        googleClientId,
        setGoogleClientId,
        isGoogleConnected,
        handleGoogleLoginSuccess,
        handleGoogleLogout,
        // Pomodoro & Settings
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
