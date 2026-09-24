import React, { useRef, useEffect } from 'react';
import { Video, Clock, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WeekView = ({
  currentDate,
  events,
  onSelectEvent,
  onAddNewEvent,
}) => {
  const scrollContainerRef = useRef(null);
  const { updateEvent } = useApp();

  // Calculate Monday of current week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);

  // Generate 7 days of this week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();

  // Scroll to 08:00 on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 60; // 8:00 AM (60px per hour)
    }
  }, []);

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const pad = (n) => String(n).padStart(2, '0');

  // Filter events for a specific day
  const getEventsForDay = (targetDate) => {
    const dateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
    return events.filter((evt) => {
      if (!evt.start) return false;
      return evt.start.slice(0, 10) === dateStr;
    });
  };

  // Drag & drop handlers
  const handleDragStart = (e, evt) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ eventId: evt.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, day, hour) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data?.eventId) return;

      const evt = events.find((ev) => ev.id === data.eventId);
      if (!evt) return;

      const oldStart = new Date(evt.start);
      const oldEnd = new Date(evt.end || evt.start);
      const durationMs = oldEnd.getTime() - oldStart.getTime();

      const newStart = new Date(day);
      newStart.setHours(hour, oldStart.getMinutes(), 0, 0);

      const newEnd = new Date(newStart.getTime() + Math.max(durationMs, 30 * 60 * 1000));

      updateEvent(evt.id, {
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col h-[750px]">
      
      {/* Sticky Week Days Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 select-none z-10">
        <div className="p-3 text-center text-xs font-bold text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60">
          GMT+7
        </div>
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          const dayName = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][idx];

          return (
            <div
              key={idx}
              className={`p-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 ${
                isToday ? 'bg-brand-500/10' : ''
              }`}
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {dayName}
              </span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                    isToday
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable 24-Hour Timeline Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative min-w-[700px]">
          
          {/* Time Labels Column */}
          <div className="border-r border-slate-200/60 dark:border-slate-800/60 select-none bg-slate-50/50 dark:bg-slate-950/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-[11px] font-mono font-medium text-slate-400 text-right pr-2 pt-1 border-b border-slate-200/40 dark:border-slate-800/40"
              >
                {pad(hour)}:00
              </div>
            ))}
          </div>

          {/* 7 Days Columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={dayIdx}
                className={`relative border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 ${
                  isToday ? 'bg-brand-500/[0.02]' : ''
                }`}
              >
                {/* 24 Hour slot drop-zones */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, hour)}
                    onClick={() => {
                      const newDate = new Date(day);
                      onAddNewEvent(newDate, hour);
                    }}
                    className="h-[60px] border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-brand-500/5 transition cursor-pointer"
                  />
                ))}

                {/* Current Time Line Indicator (if today) */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{
                      top: `${(today.getHours() + today.getMinutes() / 60) * 60}px`,
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow" />
                    <div className="flex-1 h-[2px] bg-rose-500 shadow-sm" />
                  </div>
                )}

                {/* Events overlay in this day */}
                {dayEvents.map((evt) => {
                  if (evt.allDay) return null;

                  const start = new Date(evt.start);
                  const end = new Date(evt.end || evt.start);

                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const endMins = end.getHours() * 60 + end.getMinutes();
                  const durationMins = Math.max(endMins - startMins, 30);

                  const topPx = (startMins / 60) * 60;
                  const heightPx = Math.max((durationMins / 60) * 60, 26);

                  const startTimeLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endTimeLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, evt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className="absolute left-1 right-1 rounded-xl p-2 text-xs shadow-md border cursor-pointer hover:brightness-105 active:scale-98 transition-all overflow-hidden flex flex-col justify-between z-10"
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: `${evt.color || '#3b82f6'}22`,
                        borderColor: `${evt.color || '#3b82f6'}60`,
                        color: evt.color || '#3b82f6',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 font-bold truncate">
                          <span className="truncate">{evt.title}</span>
                          {evt.meetUrl && <Video className="w-3 h-3 flex-shrink-0 text-indigo-500" />}
                        </div>
                        {heightPx > 45 && (
                          <div className="text-[10px] opacity-80 mt-0.5 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{startTimeLabel} - {endTimeLabel}</span>
                          </div>
                        )}
                      </div>

                      {heightPx > 65 && evt.location && (
                        <div className="text-[10px] opacity-75 truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
