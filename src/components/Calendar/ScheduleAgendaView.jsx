import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Timer, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ScheduleAgendaView = ({
  events,
  onSelectEvent,
  onAddNewEvent,
}) => {
  const { linkEventToPomodoro } = useApp();

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  // Group events by date string
  const groupedEvents = {};
  sortedEvents.forEach((evt) => {
    if (!evt.start) return;
    const dateKey = evt.start.slice(0, 10);
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(evt);
  });

  const dateKeys = Object.keys(groupedEvents).sort();

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const formatDateLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Hôm nay';
    if (dateStr === tomorrowStr) return 'Ngày mai';

    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${dayNames[d.getDay()]}, ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {dateKeys.length > 0 ? (
        dateKeys.map((dateKey) => {
          const dateEvents = groupedEvents[dateKey];
          const isToday = dateKey === todayStr;

          return (
            <div key={dateKey} className="space-y-3">
              {/* Date Section Header */}
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
                  isToday 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25' 
                    : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{formatDateLabel(dateKey)}</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs text-slate-400 font-medium">
                  {dateEvents.length} lịch trình
                </span>
              </div>

              {/* Event Cards for this day */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dateEvents.map((evt) => {
                  const startTime = evt.allDay 
                    ? 'Cả ngày' 
                    : new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endTime = evt.allDay 
                    ? '' 
                    : new Date(evt.end || evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 hover:shadow-lg hover:border-brand-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                      style={{ borderLeftWidth: '5px', borderLeftColor: evt.color || '#3b82f6' }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-500 transition-colors">
                            {evt.title}
                          </h4>
                          <span 
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                            style={{
                              backgroundColor: `${evt.color || '#3b82f6'}15`,
                              color: evt.color || '#3b82f6',
                            }}
                          >
                            {evt.category}
                          </span>
                        </div>

                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {/* Event Meta & Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-brand-500" />
                            {startTime} {endTime ? `- ${endTime}` : ''}
                          </span>

                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{evt.location}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {evt.meetUrl && (
                            <a
                              href={evt.meetUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition flex items-center gap-1"
                              title="Tham gia Google Meet"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Meet</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              linkEventToPomodoro(evt);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow active:scale-95 transition"
                            title="Bắt đầu Pomodoro cho sự kiện này"
                          >
                            <Timer className="w-3.5 h-3.5" />
                            <span>Focus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-20 text-center glass-card rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Chưa có sự kiện lịch trình nào
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Bạn có thể bấm "Thêm sự kiện" hoặc đăng nhập Google Calendar để tự động đồng bộ toàn bộ lịch trình.
          </p>
          <button
            onClick={() => onAddNewEvent(new Date())}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Thêm sự kiện đầu tiên
          </button>
        </div>
      )}
    </div>
  );
};
