// Google Calendar API & OAuth 2.0 Integration Utility

export const GOOGLE_STORAGE_KEYS = {
  CLIENT_ID: 'focusflow_google_client_id_v1',
  AUTH_TOKEN: 'focusflow_google_auth_token_v1',
  USER_PROFILE: 'focusflow_google_user_v1',
  CALENDAR_EVENTS: 'focusflow_calendar_events_v1',
  LAST_SYNC_TIME: 'focusflow_last_sync_time_v1',
};

// Default Google OAuth Scopes for Google Calendar & User Profile
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Sample default events for fresh setup / demo
export const DEFAULT_CALENDAR_EVENTS = [
  {
    id: 'evt-1',
    title: 'Họp Kế Hoạch Tuần Mới & Review Sprint',
    description: 'Thảo luận tiến độ dự án, phân chia nhiệm vụ và chốt mục tiêu tuần.',
    start: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    allDay: false,
    category: 'Công việc',
    color: '#3b82f6', // blue
    location: 'Google Meet / Phòng họp 201',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    isGoogleEvent: false,
    googleEventId: null,
    synced: true,
  },
  {
    id: 'evt-2',
    title: 'Phiên Deep Work: Lập trình Google Calendar Sync',
    description: 'Tập trung code tính năng đồng bộ 2 chiều và giao diện Google Schedule.',
    start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    allDay: false,
    category: 'Học tập',
    color: '#8b5cf6', // purple
    location: 'Bàn làm việc',
    isGoogleEvent: false,
    googleEventId: null,
    synced: true,
  },
  {
    id: 'evt-3',
    title: 'Tập gym & Chạy bộ buổi chiều',
    description: 'Duy trì sức khỏe và độ bền thể lực.',
    start: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(),
    allDay: false,
    category: 'Cá nhân',
    color: '#10b981', // green
    location: 'Phòng Gym thể thao',
    isGoogleEvent: false,
    googleEventId: null,
    synced: true,
  },
  {
    id: 'evt-4',
    title: 'Hạn nộp báo cáo tiến độ tuần (Deadline)',
    description: 'Nộp tài liệu và báo cáo năng suất công việc cho quản lý.',
    start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
    end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
    allDay: true,
    category: 'Khẩn cấp',
    color: '#ef4444', // red
    location: 'Email / Portal',
    isGoogleEvent: false,
    googleEventId: null,
    synced: true,
  }
];

// Color mapping for Google Calendar
export const EVENT_CATEGORIES = [
  { id: 'Công việc', label: 'Công việc', color: '#3b82f6', bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'Học tập', label: 'Học tập', color: '#8b5cf6', bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'Cá nhân', label: 'Cá nhân', color: '#10b981', bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'Cuộc họp', label: 'Cuộc họp', color: '#f59e0b', bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'Khẩn cấp', label: 'Khẩn cấp', color: '#ef4444', bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
];

/**
 * Format local Date to ISO string with timezone offset (e.g. 2026-09-24T15:00:00+07:00)
 */
export const toLocalISOString = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
};

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export const formatForDateTimeInput = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Fetch Google User Profile using OAuth 2.0 access token
 */
export const fetchGoogleUserProfile = async (accessToken) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`User info request failed with status ${res.status}`);
    }
    const data = await res.json();
    return {
      id: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
      locale: data.locale,
    };
  } catch (error) {
    console.error('Error fetching Google user profile:', error);
    throw error;
  }
};

/**
 * Fetch Google Calendar Events from primary calendar
 */
export const fetchGoogleCalendarEvents = async (accessToken, timeMin, timeMax) => {
  try {
    const minStr = timeMin ? new Date(timeMin).toISOString() : new Date(Date.now() - 30 * 86400000).toISOString();
    const maxStr = timeMax ? new Date(timeMax).toISOString() : new Date(Date.now() + 60 * 86400000).toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', minStr);
    url.searchParams.append('timeMax', maxStr);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', '250');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const items = data.items || [];

    // Map Google API items to internal Event model
    return items.map((item) => {
      const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
      const startTime = isAllDay ? item.start.date : item.start.dateTime || item.start.date;
      const endTime = isAllDay ? item.end.date : item.end.dateTime || item.end.date;

      // Detect meet link if present
      let meetUrl = item.hangoutLink || '';
      if (!meetUrl && item.conferenceData?.entryPoints) {
        const videoEntry = item.conferenceData.entryPoints.find((ep) => ep.entryPointType === 'video');
        if (videoEntry) meetUrl = videoEntry.uri;
      }

      // Default category deduction
      let category = 'Công việc';
      const summary = (item.summary || '').toLowerCase();
      if (summary.includes('học') || summary.includes('study') || summary.includes('lớp') || summary.includes('đọc')) {
        category = 'Học tập';
      } else if (summary.includes('gym') || summary.includes('thể dục') || summary.includes('ăn') || summary.includes('cá nhân') || summary.includes('bạn')) {
        category = 'Cá nhân';
      } else if (summary.includes('họp') || summary.includes('meet') || summary.includes('meeting') || meetUrl) {
        category = 'Cuộc họp';
      } else if (summary.includes('gấp') || summary.includes('urgent') || summary.includes('deadline')) {
        category = 'Khẩn cấp';
      }

      const catObj = EVENT_CATEGORIES.find((c) => c.id === category) || EVENT_CATEGORIES[0];

      return {
        id: `gcal-${item.id}`,
        googleEventId: item.id,
        title: item.summary || '(Không có tiêu đề)',
        description: item.description || '',
        start: startTime,
        end: endTime,
        allDay: isAllDay,
        category: category,
        color: catObj.color,
        location: item.location || '',
        meetUrl: meetUrl,
        isGoogleEvent: true,
        synced: true,
        htmlLink: item.htmlLink,
        updatedAt: item.updated || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
};

/**
 * Create a new event on Google Calendar
 */
export const createGoogleCalendarEvent = async (accessToken, event) => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    
    const body = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
    };

    if (event.allDay) {
      const startDate = event.start.slice(0, 10);
      const endDate = event.end ? event.end.slice(0, 10) : startDate;
      body.start = { date: startDate };
      body.end = { date: endDate };
    } else {
      body.start = {
        dateTime: new Date(event.start).toISOString(),
        timeZone: timeZone,
      };
      body.end = {
        dateTime: new Date(event.end).toISOString(),
        timeZone: timeZone,
      };
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('TOKEN_EXPIRED');
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create event on Google: ${res.status}`);
    }

    const created = await res.json();
    return created;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Update an existing event on Google Calendar
 */
export const updateGoogleCalendarEvent = async (accessToken, googleEventId, event) => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    
    const body = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
    };

    if (event.allDay) {
      const startDate = event.start.slice(0, 10);
      const endDate = event.end ? event.end.slice(0, 10) : startDate;
      body.start = { date: startDate };
      body.end = { date: endDate };
    } else {
      body.start = {
        dateTime: new Date(event.start).toISOString(),
        timeZone: timeZone,
      };
      body.end = {
        dateTime: new Date(event.end).toISOString(),
        timeZone: timeZone,
      };
    }

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('TOKEN_EXPIRED');
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update event on Google: ${res.status}`);
    }

    const updated = await res.json();
    return updated;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Delete an event from Google Calendar
 */
export const deleteGoogleCalendarEvent = async (accessToken, googleEventId) => {
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      if (res.status === 401) throw new Error('TOKEN_EXPIRED');
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete event on Google: ${res.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
};
