import React, { useRef, useEffect } from 'react';
import { Video, Clock, MapPin, AlignLeft, Timer, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DayView = ({
  currentDate,
  events,
  onSelectEvent,
  onAddNewEvent,
}) => {
  const scrollRef = useRef(null);
  const { linkEventToPomodoro } = useApp();

  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;

  const today = new Date();
  const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  const dayEvents = events.filter((evt) => {
    if (!evt.start) return false;
    return evt.start.slice(0, 10) === dateStr;
  });

  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 65; // Scroll to 8:00 AM
    }
  }, [currentDate]);

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col h-[750px]">
      
      {/* All-Day Events Banner */}
      {allDayEvents.length > 0 && (
        <div className="p-3 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">
            Cả ngày:
          </span>
          <div className="flex gap-2 flex-wrap">
            {allDayEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="px-3 py-1 rounded-xl text-xs font-bold shadow-sm border truncate"
                style={{
                  backgroundColor: `${evt.color || '#3b82f6'}20`,
                  borderColor: `${evt.color || '#3b82f6'}40`,
                  color: evt.color || '#3b82f6',
                }}
              >
                {evt.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 24-Hour Day Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="relative min-w-[500px]">
          
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => onAddNewEvent(currentDate, hour)}
              className="group h-[65px] border-b border-slate-200/40 dark:border-slate-800/40 flex items-start hover:bg-brand-500/5 transition cursor-pointer relative"
            >
              {/* Hour Label */}
              <div className="w-16 flex-shrink-0 text-right pr-3 pt-1 text-xs font-mono font-semibold text-slate-400 select-none">
                {pad(hour)}:00
              </div>

              {/* Slot Guide Line */}
              <div className="flex-1 h-full relative">
                <span className="opacity-0 group-hover:opacity-100 absolute right-4 top-2 text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Thêm lịch lúc {pad(hour)}:00
                </span>
              </div>
            </div>
          ))}

          {/* Red line for current time if viewing today */}
          {isToday && (
            <div
              className="absolute left-14 right-0 z-20 pointer-events-none flex items-center"
              style={{
                top: `${(today.getHours() + today.getMinutes() / 60) * 65}px`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-rose-500 -ml-1.5 shadow" />
              <div className="flex-1 h-[2px] bg-rose-500 shadow-sm" />
            </div>
          )}

          {/* Timed Events Overlay */}
          {timedEvents.map((evt) => {
            const start = new Date(evt.start);
            const end = new Date(evt.end || evt.start);

            const startMins = start.getHours() * 60 + start.getMinutes();
            const endMins = end.getHours() * 60 + end.getMinutes();
            const durationMins = Math.max(endMins - startMins, 30);

            const topPx = (startMins / 60) * 65;
            const heightPx = Math.max((durationMins / 60) * 65, 45);

            const startTimeLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={evt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(evt);
                }}
                className="absolute left-16 right-4 rounded-2xl p-3 shadow-md border cursor-pointer hover:shadow-lg active:scale-98 transition-all overflow-hidden flex items-center justify-between z-10"
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  backgroundColor: `${evt.color || '#3b82f6'}22`,
                  borderColor: `${evt.color || '#3b82f6'}60`,
                  color: evt.color || '#3b82f6',
                }}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 font-bold text-sm truncate">
                    <span className="truncate">{evt.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/50 dark:bg-slate-900/50">
                      {evt.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs opacity-85 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {startTimeLabel} - {endTimeLabel}
                    </span>

                    {evt.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{evt.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Pomodoro button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {evt.meetUrl && (
                    <a
                      href={evt.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1 transition"
                    >
                      <Video className="w-3.5 h-3.5" /> Meet
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      linkEventToPomodoro(evt);
                    }}
                    title="Chạy Pomodoro cho sự kiện này"
                    className="px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow flex items-center gap-1 transition"
                  >
                    <Timer className="w-3.5 h-3.5" /> Focus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
