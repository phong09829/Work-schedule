import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  STORAGE_KEYS, 
  DEFAULT_TASKS, 
  DEFAULT_SETTINGS, 
  generateInitialPomoSessions, 
  getStoredData, 
  setStoredData,
  getUserData,
  setUserData,
  getCurrentUser,
  setCurrentUser,
  getRegisteredUsers,
  registerUserAccount,
  loginUserAccount,
  changeUserPassword,
  normalizeEmail
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

  // Active Logged-in User Account
  const [currentUser, setCurrentUserState] = useState(() => {
    return getCurrentUser();
  });

  // Calendar Events State (loaded for active user or legacy/fallback)
  const [events, setEvents] = useState(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      return getUserData(user.email, 'events', DEFAULT_CALENDAR_EVENTS);
    }
    return getStoredData(GOOGLE_STORAGE_KEYS.CALENDAR_EVENTS, DEFAULT_CALENDAR_EVENTS);
  });

  // Tasks State (loaded for active user or legacy/fallback)
  const [tasks, setTasks] = useState(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      return getUserData(user.email, 'tasks', DEFAULT_TASKS);
    }
    return getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  });

  // Pomodoro Sessions History
  const [pomoSessions, setPomoSessions] = useState(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      return getUserData(user.email, 'pomo_sessions', generateInitialPomoSessions());
    }
    return getStoredData(STORAGE_KEYS.POMO_SESSIONS, generateInitialPomoSessions());
  });

  // Settings State
  const [settings, setSettings] = useState(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      return getUserData(user.email, 'settings', DEFAULT_SETTINGS);
    }
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

  // Active Task currently linked to Pomodoro
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

  // --- Multi-Account Authentication Handlers ---

  // Register with Gmail + 1 unique Password
  const registerAccount = useCallback(({ email, password, name }) => {
    const res = registerUserAccount({ email, password, name });
    if (!res.ok) {
      showToast(res.message, 'error');
      return res;
    }

    const newUser = res.user;
    setCurrentUserState(newUser);

    // If this account doesn't have events saved yet, preserve current events/tasks for them
    const existingEvents = getUserData(newUser.email, 'events', null);
    if (!existingEvents) {
      setUserData(newUser.email, 'events', events);
      setUserData(newUser.email, 'tasks', tasks);
      setUserData(newUser.email, 'pomo_sessions', pomoSessions);
      setUserData(newUser.email, 'settings', settings);
    } else {
      setEvents(existingEvents);
      setTasks(getUserData(newUser.email, 'tasks', DEFAULT_TASKS));
      setPomoSessions(getUserData(newUser.email, 'pomo_sessions', generateInitialPomoSessions()));
      setSettings(getUserData(newUser.email, 'settings', DEFAULT_SETTINGS));
    }

    showToast(`Đăng ký thành công! Đã bảo vệ và lưu lịch trình cho ${newUser.email}`, 'success');
    return res;
  }, [events, tasks, pomoSessions, settings, showToast]);

  // Login with Gmail + Password
  const loginAccount = useCallback(({ email, password }) => {
    const res = loginUserAccount({ email, password });
    if (!res.ok) {
      showToast(res.message, 'error');
      return res;
    }

    const user = res.user;
    setCurrentUserState(user);

    // Load all data specific to this account
    const userEvents = getUserData(user.email, 'events', DEFAULT_CALENDAR_EVENTS);
    const userTasks = getUserData(user.email, 'tasks', DEFAULT_TASKS);
    const userPomo = getUserData(user.email, 'pomo_sessions', generateInitialPomoSessions());
    const userSettings = getUserData(user.email, 'settings', DEFAULT_SETTINGS);

    setEvents(userEvents);
    setTasks(userTasks);
    setPomoSessions(userPomo);
    setSettings(userSettings);

    showToast(`Đăng nhập thành công! Đã tải ${userEvents.length} lịch trình của ${user.name || user.email}`, 'success');
    return res;
  }, [showToast]);

  // Change Password for current Gmail
  const changeAccountPassword = useCallback(({ oldPassword, newPassword }) => {
    if (!currentUser || !currentUser.email) {
      showToast('Vui lòng đăng nhập tài khoản trước khi đổi mật khẩu!', 'warning');
      return { ok: false, message: 'Chưa đăng nhập' };
    }

    const res = changeUserPassword({
      email: currentUser.email,
      oldPassword,
      newPassword,
    });

    if (res.ok) {
      showToast('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới nhé.', 'success');
    } else {
      showToast(res.message, 'error');
    }
    return res;
  }, [currentUser, showToast]);

  // Logout current user
  const logoutAccount = useCallback(() => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setGoogleUser(null);
    setGoogleToken(null);
    setLastSyncTime(null);
    showToast('Đã đăng xuất tài khoản.', 'info');
  }, [showToast]);

  // Direct Gmail Login legacy fallback (creates account with password or logs in)
  const loginWithDirectGmail = useCallback((email, customName = null) => {
    if (!email || !email.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'warning');
      return false;
    }
    const cleanEmail = normalizeEmail(email);
    // Check if user exists
    const users = getRegisteredUsers();
    const existing = users.find(u => normalizeEmail(u.email) === cleanEmail);

    if (existing) {
      showToast(`Tài khoản "${cleanEmail}" đã có mật khẩu. Vui lòng nhập mật khẩu để đăng nhập!`, 'warning');
      return false;
    }

    // If new user, register with a default password or invite them
    const res = registerAccount({
      email: cleanEmail,
      password: 'password123',
      name: customName,
    });
    return res.ok;
  }, [registerAccount, showToast]);

  // Google OAuth GIS Login Handler
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

      // Also ensure this Google account is recognized as currentUser
      const cleanEmail = normalizeEmail(profile.email);
      let existingUser = getRegisteredUsers().find(u => normalizeEmail(u.email) === cleanEmail);
      if (!existingUser) {
        registerUserAccount({
          email: cleanEmail,
          password: 'google_oauth_login',
          name: profile.name,
        });
      }

      const activeSession = {
        id: profile.id,
        name: profile.name,
        email: cleanEmail,
        avatar: profile.picture,
        provider: 'google',
      };
      setCurrentUser(activeSession);
      setCurrentUserState(activeSession);

      showToast(`Chào mừng ${profile.name}! Đã kết nối Google thành công.`, 'success');

      // Immediate 2-way sync
      syncWithGoogleCalendar(accessToken);
    } catch (err) {
      console.error('Google login error:', err);
      showToast('Đăng nhập Google thất bại hoặc không thể lấy hồ sơ người dùng.', 'error');
    }
  }, [showToast]);

  // Persist Events to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'events', events);
    }
    setStoredData(GOOGLE_STORAGE_KEYS.CALENDAR_EVENTS, events);
  }, [events, currentUser]);

  // Persist Tasks to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'tasks', tasks);
    }
    setStoredData(STORAGE_KEYS.TASKS, tasks);
  }, [tasks, currentUser]);

  // Persist Pomodoro Sessions to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'pomo_sessions', pomoSessions);
    }
    setStoredData(STORAGE_KEYS.POMO_SESSIONS, pomoSessions);
  }, [pomoSessions, currentUser]);

  // Persist Settings
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'settings', settings);
    }
    setStoredData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings, currentUser]);

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

  const isGoogleConnected = useMemo(() => {
    return Boolean(googleUser);
  }, [googleUser]);

  const isAccountLoggedIn = useMemo(() => {
    return Boolean(currentUser && currentUser.email);
  }, [currentUser]);

  // Sync with Google Calendar (2-way sync)
  const syncWithGoogleCalendar = useCallback(async (customToken = null) => {
    const token = customToken || googleToken?.access_token;
    if (!token) {
      showToast('Vui lòng đăng nhập Google để đồng bộ Google Calendar!', 'warning');
      return;
    }

    setIsGoogleSyncing(true);
    try {
      const now = new Date();
      const minDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
      
      const gcalEvents = await fetchGoogleCalendarEvents(token, minDate, maxDate);

      setEvents(prevEvents => {
        const localNonGoogle = prevEvents.filter(e => !e.googleEventId);
        const merged = [...gcalEvents, ...localNonGoogle];
        
        // Save immediately to account storage
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'events', merged);
        }
        return merged;
      });

      const syncTimestamp = new Date().toISOString();
      setLastSyncTime(syncTimestamp);
      showToast(`Đã đồng bộ thành công ${gcalEvents.length} sự kiện từ Google Calendar!`, 'success');
    } catch (err) {
      console.error('Google sync error:', err);
      if (err.message === 'TOKEN_EXPIRED') {
        showToast('Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        setGoogleUser(null);
        setGoogleToken(null);
      } else {
        showToast(`Lỗi đồng bộ Google Calendar: ${err.message || 'Không thể kết nối API'}`, 'error');
      }
    } finally {
      setIsGoogleSyncing(false);
    }
  }, [googleToken, currentUser, showToast]);

  // Calendar Event Actions (with Guaranteed Instant Persistence & Google Sync)
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
      userEmail: currentUser?.email || 'guest',
    };

    // Update state and write to storage immediately
    setEvents(prev => {
      const updated = [newEvent, ...prev];
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'events', updated);
      }
      return updated;
    });

    showToast(`Đã thêm lịch trình: "${newEvent.title}"`, 'success');

    // Sync to Google Calendar if connected
    if (isGoogleConnected && googleToken?.access_token) {
      try {
        setIsGoogleSyncing(true);
        const createdGCal = await createGoogleCalendarEvent(googleToken.access_token, newEvent);
        if (createdGCal && createdGCal.id) {
          setEvents(prev => {
            const updated = prev.map(e => e.id === newEvent.id ? {
              ...e,
              googleEventId: createdGCal.id,
              isGoogleEvent: true,
              synced: true,
              htmlLink: createdGCal.htmlLink,
              meetUrl: createdGCal.hangoutLink || newEvent.meetUrl,
            } : e);
            if (currentUser && currentUser.email) {
              setUserData(currentUser.email, 'events', updated);
            }
            return updated;
          });
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
  }, [isGoogleConnected, googleToken, currentUser, showToast]);

  const updateEvent = useCallback(async (id, updatedFields) => {
    let targetEvent = null;

    setEvents(prev => {
      const updated = prev.map(evt => {
        if (evt.id === id) {
          targetEvent = { ...evt, ...updatedFields };
          return targetEvent;
        }
        return evt;
      });
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'events', updated);
      }
      return updated;
    });

    showToast('Đã lưu chỉnh sửa lịch trình thành công!', 'info');

    // Sync update to Google Calendar if linked
    if (targetEvent && targetEvent.googleEventId && isGoogleConnected && googleToken?.access_token) {
      try {
        setIsGoogleSyncing(true);
        await updateGoogleCalendarEvent(googleToken.access_token, targetEvent.googleEventId, targetEvent);
        showToast('Đã đồng bộ cập nhật với Google Calendar!', 'success');
      } catch (err) {
        console.error('Sync update event error:', err);
      } finally {
        setIsGoogleSyncing(false);
      }
    }
  }, [isGoogleConnected, googleToken, currentUser, showToast]);

  const deleteEvent = useCallback(async (id) => {
    const eventToDelete = events.find(e => e.id === id);
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'events', updated);
      }
      return updated;
    });

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
  }, [events, isGoogleConnected, googleToken, currentUser, showToast]);

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
      userEmail: currentUser?.email || 'guest',
    };

    setTasks(prev => {
      const updated = [newTask, ...prev];
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'tasks', updated);
      }
      return updated;
    });

    showToast(`Đã thêm công việc: "${newTask.title}"`, 'success');

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
    setTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === id) {
          const isNowDone = updatedFields.status === 'done' && task.status !== 'done';
          return {
            ...task,
            ...updatedFields,
            completedAt: isNowDone ? new Date().toISOString() : (updatedFields.status && updatedFields.status !== 'done' ? null : task.completedAt),
          };
        }
        return task;
      });
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'tasks', updated);
      }
      return updated;
    });
    showToast('Đã cập nhật công việc thành công!', 'info');
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'tasks', updated);
      }
      return updated;
    });
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    showToast(`Đã xóa công việc "${taskToDelete?.title || ''}"`, 'warning');
  };

  const moveTaskStatus = (id, newStatus) => {
    setTasks(prev => {
      const updated = prev.map(task => {
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
            } catch (e) {}
          }
          return {
            ...task,
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : null,
          };
        }
        return task;
      });
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'tasks', updated);
      }
      return updated;
    });
  };

  const linkTaskToPomodoro = (task) => {
    setActiveTaskId(task.id);
    setActiveTab('pomodoro');
    showToast(`Đã chọn "${task.title}" cho phiên Pomodoro`, 'info');
  };

  const linkEventToPomodoro = (event) => {
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
        setTasks(prev => {
          const updated = prev.map(t => {
            if (t.id === activeTaskId) {
              const newCount = (t.completedPomos || 0) + 1;
              return {
                ...t,
                completedPomos: newCount,
                status: t.status === 'todo' ? 'in_progress' : t.status
              };
            }
            return t;
          });
          if (currentUser && currentUser.email) {
            setUserData(currentUser.email, 'tasks', updated);
          }
          return updated;
        });
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
        userEmail: currentUser?.email || 'guest',
      };

      setPomoSessions(prev => {
        const updated = [newSession, ...prev];
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'pomo_sessions', updated);
        }
        return updated;
      });

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
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'settings', updated);
      }
      return updated;
    });
    showToast('Đã lưu cấu hình cài đặt!', 'success');
  };

  // Export JSON Data
  const exportData = () => {
    const backup = {
      version: '2.0',
      user: currentUser ? { email: currentUser.email, name: currentUser.name } : null,
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
    const accountTag = currentUser ? `-${currentUser.email.split('@')[0]}` : '';
    link.download = `focusflow-backup${accountTag}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất dữ liệu sao lưu thành công!', 'success');
  };

  // Import JSON Data
  const importData = (jsonData) => {
    try {
      if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
        setTasks(jsonData.tasks);
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'tasks', jsonData.tasks);
        }
      }
      if (jsonData.events && Array.isArray(jsonData.events)) {
        setEvents(jsonData.events);
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'events', jsonData.events);
        }
      }
      if (jsonData.pomoSessions && Array.isArray(jsonData.pomoSessions)) {
        setPomoSessions(jsonData.pomoSessions);
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'pomo_sessions', jsonData.pomoSessions);
        }
      }
      if (jsonData.settings) {
        setSettings(jsonData.settings);
        if (currentUser && currentUser.email) {
          setUserData(currentUser.email, 'settings', jsonData.settings);
        }
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

    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'events', DEFAULT_CALENDAR_EVENTS);
      setUserData(currentUser.email, 'tasks', DEFAULT_TASKS);
      setUserData(currentUser.email, 'pomo_sessions', generateInitialPomoSessions());
      setUserData(currentUser.email, 'settings', DEFAULT_SETTINGS);
    }
    showToast('Đã đặt lại dữ liệu mặc định ban đầu!', 'info');
  };

  // Analytics
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
        // Current User Account & Auth
        currentUser,
        isAccountLoggedIn,
        registerAccount,
        loginAccount,
        changeAccountPassword,
        logoutAccount,
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
        // Google OAuth & GIS
        googleUser,
        googleToken,
        googleClientId,
        setGoogleClientId,
        isGoogleConnected,
        loginWithDirectGmail,
        handleGoogleLoginSuccess,
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
