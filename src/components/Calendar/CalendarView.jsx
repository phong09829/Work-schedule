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
  LogIn,
  ShieldCheck,
  Lock,
  UserCheck
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
    currentUser,
    isAccountLoggedIn,
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
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Top Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-brand-500" />
            <span>Lịch Trình & Google Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Tự động lưu lại mọi chỉnh sửa lịch trình theo từng tài khoản Gmail</span>
            {isGoogleConnected && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Google Sync Active
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

          {/* Account / Google Modal Button */}
          <button
            onClick={() => setIsGoogleModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border font-bold text-xs shadow-sm transition active:scale-95 ${
              isAccountLoggedIn
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Quản lý tài khoản và mật khẩu"
          >
            {isAccountLoggedIn ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{currentUser?.name || currentUser?.email?.split('@')[0]}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-brand-500" />
                <span>Đăng Nhập Gmail</span>
              </>
            )}
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

      {/* Account Schedule Status Banner */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        isAccountLoggedIn
          ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
          : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {isAccountLoggedIn ? (
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          )}
          <div>
            {isAccountLoggedIn ? (
              <span>
                Đang lưu trữ lịch trình cho tài khoản: <strong className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">{currentUser?.email}</strong>. Mọi chỉnh sửa sự kiện được tự động lưu an toàn.
              </span>
            ) : (
              <span>
                Bạn đang ở chế độ khách. Hãy <strong className="font-bold">Đăng nhập tài khoản Gmail</strong> để mỗi tài khoản có 1 mật khẩu riêng và lưu giữ toàn bộ lịch trình không bị mất!
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsGoogleModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
            isAccountLoggedIn
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
          }`}
        >
          {isAccountLoggedIn ? 'Đổi Mật Khẩu / Đăng Xuất' : 'Đăng Nhập / Đăng Ký Ngay'}
        </button>
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
