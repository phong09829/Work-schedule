import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlignLeft, 
  Tag, 
  Sparkles, 
  Trash2, 
  Timer, 
  Video, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { EVENT_CATEGORIES, formatForDateTimeInput } from '../../utils/googleCalendar';
import { useApp } from '../../context/AppContext';

export const EventModal = ({
  isOpen,
  onClose,
  eventToEdit = null,
  initialDate = null,
  initialHour = 9,
}) => {
  const { addEvent, updateEvent, deleteEvent, linkEventToPomodoro, isGoogleConnected } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Công việc');
  const [color, setColor] = useState('#3b82f6');
  const [allDay, setAllDay] = useState(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [meetUrl, setMeetUrl] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setCategory(eventToEdit.category || 'Công việc');
      setColor(eventToEdit.color || '#3b82f6');
      setAllDay(Boolean(eventToEdit.allDay));
      setStartDateTime(formatForDateTimeInput(eventToEdit.start));
      setEndDateTime(formatForDateTimeInput(eventToEdit.end || eventToEdit.start));
      setMeetUrl(eventToEdit.meetUrl || '');
    } else {
      const baseDate = initialDate ? new Date(initialDate) : new Date();
      baseDate.setHours(initialHour, 0, 0, 0);

      const endDate = new Date(baseDate.getTime() + 60 * 60 * 1000); // 1 hour later

      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('Công việc');
      setColor('#3b82f6');
      setAllDay(false);
      setStartDateTime(formatForDateTimeInput(baseDate));
      setEndDateTime(formatForDateTimeInput(endDate));
      setMeetUrl('');
    }
  }, [eventToEdit, initialDate, initialHour, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    const catObj = EVENT_CATEGORIES.find(c => c.id === catId);
    if (catObj) setColor(catObj.color);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventPayload = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      color,
      allDay,
      start: new Date(startDateTime).toISOString(),
      end: new Date(endDateTime).toISOString(),
      meetUrl: meetUrl.trim(),
    };

    if (eventToEdit) {
      updateEvent(eventToEdit.id, eventPayload);
    } else {
      addEvent(eventPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit && window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${eventToEdit.title}"? Thao tác này cũng sẽ xóa trên Google Calendar nếu đã đồng bộ.`)) {
      deleteEvent(eventToEdit.id);
      onClose();
    }
  };

  const handleStartPomodoro = () => {
    if (eventToEdit) {
      linkEventToPomodoro(eventToEdit);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Category Color bar */}
        <div className="h-2 w-full transition-colors duration-300" style={{ backgroundColor: color }} />

        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold"
              style={{ backgroundColor: color }}
            >
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {eventToEdit ? 'Chỉnh Sửa Sự Kiện' : 'Thêm Sự Kiện Lịch Trình Mới'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                {isGoogleConnected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin-slow" /> Tự động đồng bộ 2 chiều với Google Calendar
                  </span>
                ) : (
                  <span>Lưu trữ nội bộ • Kết nối Google để đồng bộ 2 chiều</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Tiêu đề sự kiện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Họp định kỳ, Thuyết trình đồ án, Chạy bộ..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Time & All-Day */}
          <div className="space-y-3 bg-slate-100/60 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" /> Thời gian diễn ra
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                Cả ngày
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Category / Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-500" /> Danh mục & Màu sắc
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-500" /> Địa điểm
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Phòng họp A, Nhà riêng..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-500" /> Link Google Meet / Video
              </label>
              <input
                type="url"
                value={meetUrl}
                onChange={(e) => setMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-brand-500" /> Ghi chú / Chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung thảo luận, tài liệu cần chuẩn bị..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium resize-none"
            />
          </div>

          {/* Quick Action: Start Pomodoro */}
          {eventToEdit && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                  Thực hiện sự kiện này với Pomodoro?
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartPomodoro}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md active:scale-95 transition"
              >
                Chạy Focus ⏱️
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {eventToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa sự kiện</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{eventToEdit ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
