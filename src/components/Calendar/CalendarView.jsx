import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Filter, 
  Search, 
  Settings, 
  CheckCircle, 
  Sparkles,
  Layers,
  Clock,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EVENT_CATEGORIES } from '../../utils/googleCalendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ScheduleAgendaView } from './ScheduleAgendaView';
import { EventModal } from './EventModal';
import { GoogleConfigModal } from './GoogleConfigModal';

export const CalendarView = () => {
  const {
    events,
    isGoogleConnected,
    googleUser,
    syncWithGoogleCalendar,
    isGoogleSyncing,
    lastSyncTime,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState(null);
  const [selectedSlotHour, setSelectedSlotHour] = useState(9);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (evt.location && evt.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategory === 'all' || evt.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [events, searchQuery, selectedCategory]);

  // Date Navigation Handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title Formatter
  const getHeaderTitle = () => {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (viewMode === 'day') {
      const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      return `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[m]} năm ${y}`;
    }

    return `${monthNames[m]} năm ${y}`;
  };

  const handleOpenAddEvent = (date = new Date(), hour = 9) => {
    setEventToEdit(null);
    setSelectedSlotDate(date);
    setSelectedSlotHour(hour);
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (evt) => {
    setEventToEdit(evt);
    setIsEventModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-brand-500" />
            <span>Lịch Trình & Google Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Đồng bộ 2 chiều thời gian thực với Google Calendar API</span>
            {isGoogleConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Đã kết nối Google
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Chế độ Offline
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sync Now Button */}
          <button
            onClick={() => syncWithGoogleCalendar()}
            disabled={isGoogleSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-60"
            title="Đồng bộ ngay với Google Calendar"
          >
            <RefreshCw className={`w-4 h-4 text-brand-500 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
            <span>{isGoogleSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Google'}</span>
          </button>

          {/* Google OAuth Config Modal Button */}
          <button
            onClick={() => setIsGoogleModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-sm transition active:scale-95"
            title="Cài đặt Google OAuth 2.0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleConnected ? (googleUser?.name?.split(' ')[0] || 'Google Account') : 'Đăng nhập Google'}</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={() => handleOpenAddEvent(currentDate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sự Kiện</span>
          </button>
        </div>
      </div>

      {/* Calendar Control Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Navigation & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Hôm nay
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
              title="Trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
              title="Tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 select-none">
            {getHeaderTitle()}
          </h3>
        </div>

        {/* View Modes & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm lịch trình..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tất cả danh mục</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* View Modes Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/50 dark:border-slate-800">
            {[
              { id: 'month', label: 'Tháng' },
              { id: 'week', label: 'Tuần' },
              { id: 'day', label: 'Ngày' },
              { id: 'agenda', label: 'Lịch biểu' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === mode.id
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dynamic View Component */}
      <div>
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onAddNewEvent={handleOpenAddEvent}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onAddNewEvent={handleOpenAddEvent}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onAddNewEvent={handleOpenAddEvent}
          />
        )}

        {viewMode === 'agenda' && (
          <ScheduleAgendaView
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onAddNewEvent={handleOpenAddEvent}
          />
        )}
      </div>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        initialDate={selectedSlotDate}
        initialHour={selectedSlotHour}
      />

      <GoogleConfigModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
};
