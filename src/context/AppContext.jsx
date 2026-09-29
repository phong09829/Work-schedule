import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
} from '../utils/storage';
import { 
  registerCloudAccount, 
  loginCloudAccount, 
  changeCloudPassword,
  resetCloudAccountPassword,
  pushUserDataToCloud, 
  pullUserDataFromCloud,
  generateQuickSyncToken,
  generatePhoneLoginLink,
  parseQuickSyncToken,
  exportFullBackup,
  normalizeEmail,
  getUserCloudKey,
  subscribeToCloudEvents,
  CLOUD_STORAGE_KEYS
} from '../utils/cloudSync';
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

  // Cloud Sync Status: 'synced' | 'syncing' | 'offline' | 'idle'
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState(() => {
    return getStoredData(CLOUD_STORAGE_KEYS.LAST_CLOUD_SYNC, null);
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

  // --- Multi-Device Cloud Sync Synchronization Engine ---

  const cloudSyncTimeoutRef = useRef(null);

  // Push local changes to cloud with debouncing (1.2 seconds after last change)
  const triggerCloudSync = useCallback((customData = null) => {
    if (!currentUser || !currentUser.email) return;

    if (cloudSyncTimeoutRef.current) {
      clearTimeout(cloudSyncTimeoutRef.current);
    }

    setCloudSyncStatus('syncing');
    cloudSyncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsCloudSyncing(true);
        const payload = customData || {
          tasks,
          events,
          pomoSessions,
          settings,
        };
        const ok = await pushUserDataToCloud(currentUser, payload);
        if (ok) {
          const nowStr = new Date().toISOString();
          setLastCloudSyncTime(nowStr);
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('offline');
        }
      } catch (err) {
        console.warn('Background cloud sync error:', err);
        setCloudSyncStatus('offline');
      } finally {
        setIsCloudSyncing(false);
      }
    }, 1200);
  }, [currentUser, tasks, events, pomoSessions, settings]);

  // Pull latest updates from Cloud (when user logs in or returns to tab)
  const syncWithCloud = useCallback(async (showNotification = false) => {
    if (!currentUser || !currentUser.email) return;

    try {
      setIsCloudSyncing(true);
      setCloudSyncStatus('syncing');
      const cloudData = await pullUserDataFromCloud(currentUser);
      
      if (cloudData) {
        if (cloudData.tasks && Array.isArray(cloudData.tasks)) {
          setTasks(cloudData.tasks);
          setUserData(currentUser.email, 'tasks', cloudData.tasks);
        }
        if (cloudData.events && Array.isArray(cloudData.events)) {
          setEvents(cloudData.events);
          setUserData(currentUser.email, 'events', cloudData.events);
        }
        if (cloudData.pomoSessions && Array.isArray(cloudData.pomoSessions)) {
          setPomoSessions(cloudData.pomoSessions);
          setUserData(currentUser.email, 'pomo_sessions', cloudData.pomoSessions);
        }
        if (cloudData.settings) {
          setSettings(cloudData.settings);
          setUserData(currentUser.email, 'settings', cloudData.settings);
        }

        const nowStr = new Date().toISOString();
        setLastCloudSyncTime(nowStr);
        setCloudSyncStatus('synced');

        if (showNotification) {
          showToast(`Đã đồng bộ dữ liệu mới nhất thành công!`, 'success');
        }
      }
    } catch (err) {
      console.warn('Manual cloud sync failed:', err);
      setCloudSyncStatus('offline');
      if (showNotification) {
        showToast('Không thể kết nối Đám Mây. Đang hoạt động ở chế độ Offline.', 'warning');
      }
    } finally {
      setIsCloudSyncing(false);
    }
  }, [currentUser, showToast]);

  // Handle URL Hash Auto-Login & Instant Cross-Device Data Hydration (e.g. when opening 1-click pairing link on mobile)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && (hash.startsWith('#auth=') || hash.startsWith('#login=') || hash.startsWith('#sync=') || hash.startsWith('#data='))) {
        const token = hash.replace(/^#(auth|login|sync|data)=/, '');
        const parsed = parseQuickSyncToken(token);
        if (parsed && parsed.email) {
          const sessionUser = {
            id: `usr-${Date.now()}`,
            email: parsed.email,
            name: parsed.name || parsed.email.split('@')[0],
            passwordHash: parsed.passwordHash,
          };
          setCurrentUser(sessionUser);
          setCurrentUserState(sessionUser);

          // If full dataset was bundled in the link, hydrate it immediately
          if (parsed.data) {
            if (Array.isArray(parsed.data.tasks)) {
              setTasks(parsed.data.tasks);
              setUserData(parsed.email, 'tasks', parsed.data.tasks);
            }
            if (Array.isArray(parsed.data.events)) {
              setEvents(parsed.data.events);
              setUserData(parsed.email, 'events', parsed.data.events);
            }
            if (Array.isArray(parsed.data.pomoSessions)) {
              setPomoSessions(parsed.data.pomoSessions);
              setUserData(parsed.email, 'pomo_sessions', parsed.data.pomoSessions);
            }
            if (parsed.data.settings) {
              setSettings(parsed.data.settings);
              setUserData(parsed.email, 'settings', parsed.data.settings);
            }
          }
          
          // Clear hash from URL cleanly
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          showToast(`Đã tự động kết nối và đồng bộ tài khoản "${parsed.email}" trên điện thoại!`, 'success', 5000);
          syncWithCloud(true);
        }
      }
    } catch (e) {
      console.warn('Auto hash login check warning:', e);
    }
  }, [syncWithCloud, showToast]);

  // Periodic and Visibility Change sync (Syncs when user unlocks phone or switches back to tab)
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(false);
      }
    };

    const handleOnline = () => {
      showToast('Đã kết nối Internet trở lại! Đang đồng bộ Đám Mây...', 'info', 2000);
      syncWithCloud(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Interval sync every 45s
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(false);
      }
    }, 45000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [currentUser?.email, syncWithCloud, showToast]);

  // Realtime Live Cloud Sync Subscription between Phone and PC (Instant 2-way reflection)
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    let unsub = () => {};
    getUserCloudKey(currentUser.email).then(cloudKey => {
      unsub = subscribeToCloudEvents(cloudKey, (remoteDoc) => {
        if (remoteDoc && remoteDoc.data) {
          const d = remoteDoc.data;
          if (Array.isArray(d.tasks)) {
            setTasks(d.tasks);
            setUserData(currentUser.email, 'tasks', d.tasks);
          }
          if (Array.isArray(d.events)) {
            setEvents(d.events);
            setUserData(currentUser.email, 'events', d.events);
          }
          if (Array.isArray(d.pomoSessions)) {
            setPomoSessions(d.pomoSessions);
            setUserData(currentUser.email, 'pomo_sessions', d.pomoSessions);
          }
          if (d.settings) {
            setSettings(d.settings);
            setUserData(currentUser.email, 'settings', d.settings);
          }
          setLastCloudSyncTime(new Date().toISOString());
          setCloudSyncStatus('synced');
        }
      });
    });

    return () => {
      unsub();
    };
  }, [currentUser?.email]);

  // --- Multi-Account Authentication Handlers ---

  // Register with Gmail + Password (Accessible from ANY phone or computer)
  const registerAccount = useCallback(async ({ email, password, name }) => {
    setIsCloudSyncing(true);
    try {
      const res = await registerCloudAccount({
        email,
        password,
        name,
        initialData: {
          tasks,
          events,
          pomoSessions,
          settings,
        }
      });

      if (!res.ok) {
        showToast(res.message, 'error');
        return res;
      }

      const newUser = res.user;
      setCurrentUserState(newUser);

      // Save to local user cache
      setUserData(newUser.email, 'events', events);
      setUserData(newUser.email, 'tasks', tasks);
      setUserData(newUser.email, 'pomo_sessions', pomoSessions);
      setUserData(newUser.email, 'settings', settings);

      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toISOString());

      showToast(`Đăng ký thành công! Bạn có thể đăng nhập Gmail "${newUser.email}" trên bất kỳ điện thoại hoặc máy tính nào.`, 'success', 5000);
      return res;
    } catch (err) {
      console.error('Register account error:', err);
      showToast('Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!', 'error');
      return { ok: false, message: err.message };
    } finally {
      setIsCloudSyncing(false);
    }
  }, [events, tasks, pomoSessions, settings, showToast]);

  // Login with Gmail + Password (Downloads user cloud data automatically)
  const loginAccount = useCallback(async ({ email, password }) => {
    setIsCloudSyncing(true);
    try {
      const res = await loginCloudAccount({ email, password });
      if (!res.ok) {
        showToast(res.message, 'error');
        return res;
      }

      const user = res.user;
      const data = res.data;

      setCurrentUserState(user);

      // Load all data specific to this account
      const userEvents = data.events || DEFAULT_CALENDAR_EVENTS;
      const userTasks = data.tasks || DEFAULT_TASKS;
      const userPomo = data.pomoSessions || generateInitialPomoSessions();
      const userSettings = data.settings || DEFAULT_SETTINGS;

      setEvents(userEvents);
      setTasks(userTasks);
      setPomoSessions(userPomo);
      setSettings(userSettings);

      // Cache locally
      setUserData(user.email, 'events', userEvents);
      setUserData(user.email, 'tasks', userTasks);
      setUserData(user.email, 'pomo_sessions', userPomo);
      setUserData(user.email, 'settings', userSettings);

      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toISOString());

      showToast(`Đăng nhập thành công! Đã đồng bộ ${userTasks.length} công việc & ${userEvents.length} lịch trình.`, 'success', 4000);
      return res;
    } catch (err) {
      console.error('Login account error:', err);
      showToast('Lỗi kết nối khi đăng nhập. Vui lòng thử lại!', 'error');
      return { ok: false, message: err.message };
    } finally {
      setIsCloudSyncing(false);
    }
  }, [showToast]);

  // Reset Password for any Gmail
  const resetAccountPassword = useCallback(async ({ email, newPassword }) => {
    setIsCloudSyncing(true);
    try {
      const res = await resetCloudAccountPassword({ email, newPassword });
      if (!res.ok) {
        showToast(res.message, 'error');
        return res;
      }

      const user = res.user;
      const data = res.data;

      setCurrentUserState(user);

      const userEvents = data.events || DEFAULT_CALENDAR_EVENTS;
      const userTasks = data.tasks || DEFAULT_TASKS;
      const userPomo = data.pomoSessions || generateInitialPomoSessions();
      const userSettings = data.settings || DEFAULT_SETTINGS;

      setEvents(userEvents);
      setTasks(userTasks);
      setPomoSessions(userPomo);
      setSettings(userSettings);

      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toISOString());

      showToast(res.message, 'success', 4000);
      return res;
    } catch (err) {
      console.error('Reset password error:', err);
      showToast('Không thể đặt lại mật khẩu. Vui lòng thử lại!', 'error');
      return { ok: false, message: err.message };
    } finally {
      setIsCloudSyncing(false);
    }
  }, [showToast]);

  // Change Password for current Gmail in Cloud
  const changeAccountPassword = useCallback(async ({ oldPassword, newPassword }) => {
    if (!currentUser || !currentUser.email) {
      showToast('Vui lòng đăng nhập tài khoản trước khi đổi mật khẩu!', 'warning');
      return { ok: false, message: 'Chưa đăng nhập' };
    }

    try {
      const res = await changeCloudPassword({
        email: currentUser.email,
        oldPassword,
        newPassword,
      });

      if (res.ok) {
        showToast('Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực trên mọi thiết bị.', 'success');
      } else {
        showToast(res.message, 'error');
      }
      return res;
    } catch (err) {
      showToast('Không thể cập nhật mật khẩu.', 'error');
      return { ok: false, message: err.message };
    }
  }, [currentUser, showToast]);

  // Logout current user
  const logoutAccount = useCallback(() => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setGoogleUser(null);
    setGoogleToken(null);
    setLastSyncTime(null);
    setCloudSyncStatus('idle');
    showToast('Đã đăng xuất tài khoản. Bạn có thể đăng nhập lại bất cứ lúc nào.', 'info');
  }, [showToast]);

  // Quick Device Link: Generate 1-click token for phone or another computer
  const quickSyncToken = useMemo(() => {
    if (!currentUser) return '';
    return generateQuickSyncToken(currentUser, { tasks, events, pomoSessions, settings });
  }, [currentUser, tasks, events, pomoSessions, settings]);

  // 1-Click Phone Link (Bundles current dataset for zero-latency phone hydration)
  const phoneLoginLink = useMemo(() => {
    if (!currentUser) return '';
    return generatePhoneLoginLink(currentUser, { tasks, events, pomoSessions, settings });
  }, [currentUser, tasks, events, pomoSessions, settings]);

  // Quick Device Link: Import token from another device
  const importQuickSync = useCallback(async (tokenStr) => {
    const parsed = parseQuickSyncToken(tokenStr);
    if (!parsed || !parsed.email) {
      showToast('Mã đồng bộ nhanh không hợp lệ hoặc đã hết hạn!', 'error');
      return false;
    }

    const sessionUser = {
      id: `usr-${Date.now()}`,
      email: parsed.email,
      name: parsed.name || parsed.email.split('@')[0],
      passwordHash: parsed.passwordHash,
    };

    setCurrentUser(sessionUser);
    setCurrentUserState(sessionUser);

    if (parsed.data) {
      if (Array.isArray(parsed.data.tasks)) {
        setTasks(parsed.data.tasks);
        setUserData(parsed.email, 'tasks', parsed.data.tasks);
      }
      if (Array.isArray(parsed.data.events)) {
        setEvents(parsed.data.events);
        setUserData(parsed.email, 'events', parsed.data.events);
      }
      if (Array.isArray(parsed.data.pomoSessions)) {
        setPomoSessions(parsed.data.pomoSessions);
        setUserData(parsed.email, 'pomo_sessions', parsed.data.pomoSessions);
      }
      if (parsed.data.settings) {
        setSettings(parsed.data.settings);
        setUserData(parsed.email, 'settings', parsed.data.settings);
      }
    }

    showToast(`Đã liên kết thiết bị với tài khoản ${parsed.email}! Dữ liệu đã đồng bộ hoàn tất.`, 'success');
    await syncWithCloud(true);
    return true;
  }, [syncWithCloud, showToast]);

  // Legacy direct login fallback
  const loginWithDirectGmail = useCallback(async (email, customName = null) => {
    if (!email || !email.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'warning');
      return false;
    }
    const cleanEmail = normalizeEmail(email);
    const res = await registerAccount({
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

      const cleanEmail = normalizeEmail(profile.email);
      const activeSession = {
        id: profile.id,
        name: profile.name,
        email: cleanEmail,
        avatar: profile.picture,
        provider: 'google',
      };
      setCurrentUser(activeSession);
      setCurrentUserState(activeSession);

      showToast(`Chào mừng ${profile.name}! Đã kết nối Google và kích hoạt đồng bộ đám mây.`, 'success');

      // Sync Cloud & Google Calendar
      triggerCloudSync();
      syncWithGoogleCalendar(accessToken);
    } catch (err) {
      console.error('Google login error:', err);
      showToast('Đăng nhập Google thất bại hoặc không thể lấy hồ sơ người dùng.', 'error');
    }
  }, [showToast, triggerCloudSync]);

  // Persist Events to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'events', events);
    }
    setStoredData(GOOGLE_STORAGE_KEYS.CALENDAR_EVENTS, events);
    triggerCloudSync();
  }, [events, currentUser?.email]);

  // Persist Tasks to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'tasks', tasks);
    }
    setStoredData(STORAGE_KEYS.TASKS, tasks);
    triggerCloudSync();
  }, [tasks, currentUser?.email]);

  // Persist Pomodoro Sessions to Active User Storage and Fallback
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'pomo_sessions', pomoSessions);
    }
    setStoredData(STORAGE_KEYS.POMO_SESSIONS, pomoSessions);
    triggerCloudSync();
  }, [pomoSessions, currentUser?.email]);

  // Persist Settings
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserData(currentUser.email, 'settings', settings);
    }
    setStoredData(STORAGE_KEYS.SETTINGS, settings);
    triggerCloudSync();
  }, [settings, currentUser?.email]);

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

  // Calendar Event Actions
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

    setEvents(prev => {
      const updated = [newEvent, ...prev];
      if (currentUser && currentUser.email) {
        setUserData(currentUser.email, 'events', updated);
      }
      return updated;
    });

    showToast(`Đã thêm lịch trình: "${newEvent.title}"`, 'success');

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

    showToast('Đã lưu chỉnh sửa lịch trình!', 'info');

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
        // Current User Account & Cloud Auth
        currentUser,
        isAccountLoggedIn,
        registerAccount,
        loginAccount,
        resetAccountPassword,
        changeAccountPassword,
        logoutAccount,
        // Cloud Sync Status & Multi-Device Linking
        cloudSyncStatus,
        isCloudSyncing,
        lastCloudSyncTime,
        syncWithCloud,
        quickSyncToken,
        phoneLoginLink,
        importQuickSync,
        getAllLocalAccounts: getRegisteredUsers,
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
