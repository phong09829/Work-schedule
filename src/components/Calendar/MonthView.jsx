import React from 'react';
import { Plus, Video, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MonthView = ({
  currentDate,
  events,
  onSelectEvent,
  onAddNewEvent,
}) => {
  const { updateEvent } = useApp();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month (0 = Sunday, 1 = Monday...)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // We start week on Monday (VN standard)
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6; // Sunday becomes 6

  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month filler days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevDays = [];
  for (let i = startingDay - 1; i >= 0; i--) {
    prevDays.push({
      day: prevMonthLastDay - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Next month filler days (up to 42 cells total for consistent 6 rows)
  const totalSlots = 42;
  const remainingSlots = totalSlots - (prevDays.length + currentDays.length);
  const nextDays = [];
  for (let i = 1; i <= remainingSlots; i++) {
    nextDays.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...prevDays, ...currentDays, ...nextDays];

  const dayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  const today = new Date();
  const isToday = (d) => {
    return (
      d.day === today.getDate() &&
      d.month === today.getMonth() &&
      d.year === today.getFullYear()
    );
  };

  const getEventsForDay = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    // Normalize date string YYYY-MM-DD
    const actualMonth = d.month < 0 ? 12 + d.month : d.month % 12;
    const dateStr = `${d.year}-${pad(actualMonth + 1)}-${pad(d.day)}`;

    return events.filter((evt) => {
      if (!evt.start) return false;
      const evtDateStr = evt.start.slice(0, 10);
      return evtDateStr === dateStr;
    });
  };

  // Drag & drop handlers for moving events between days
  const handleDragStart = (e, evt) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ eventId: evt.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDay) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data || !data.eventId) return;

      const evt = events.find((ev) => ev.id === data.eventId);
      if (!evt) return;

      const pad = (n) => String(n).padStart(2, '0');
      const actualMonth = targetDay.month < 0 ? 12 + targetDay.month : targetDay.month % 12;
      const targetDateStr = `${targetDay.year}-${pad(actualMonth + 1)}-${pad(targetDay.day)}`;

      // Calculate time duration
      const oldStart = new Date(evt.start);
      const oldEnd = new Date(evt.end || evt.start);
      const durationMs = oldEnd.getTime() - oldStart.getTime();

      const newStart = new Date(targetDateStr);
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

      const newEnd = new Date(newStart.getTime() + Math.max(durationMs, 30 * 60 * 1000));

      updateEvent(evt.id, {
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      });
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-center text-xs font-bold py-3 text-slate-600 dark:text-slate-400 select-none">
        {dayHeaders.map((header, idx) => (
          <div key={idx} className={idx >= 5 ? 'text-brand-500 font-extrabold' : ''}>
            {header}
          </div>
        ))}
      </div>

      {/* 42 Calendar Cells Matrix */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {allCalendarDays.map((d, index) => {
          const dayEvents = getEventsForDay(d);
          const isCurrentToday = isToday(d);

          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, d)}
              onClick={(e) => {
                // If clicking cell background (not an event chip)
                if (e.target === e.currentTarget || e.target.classList.contains('cell-bg')) {
                  const targetDate = new Date(d.year, d.month, d.day);
                  onAddNewEvent(targetDate);
                }
              }}
              className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 transition-colors relative flex flex-col group cell-bg ${
                d.isCurrentMonth
                  ? 'bg-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                  : 'bg-slate-100/30 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
              }`}
            >
              {/* Date Number Badge */}
              <div className="flex items-center justify-between mb-1 cell-bg">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold select-none ${
                    isCurrentToday
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : d.isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {d.day}
                </span>

                {/* Quick Add Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetDate = new Date(d.year, d.month, d.day);
                    onAddNewEvent(targetDate);
                  }}
                  title="Thêm sự kiện"
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Event Chips List */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                {dayEvents.map((evt) => {
                  const timeLabel = evt.allDay
                    ? 'Cả ngày'
                    : new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, evt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      title={`${evt.title} (${timeLabel})`}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between gap-1 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-98 transition-all border select-none truncate"
                      style={{
                        backgroundColor: `${evt.color || '#3b82f6'}18`,
                        borderColor: `${evt.color || '#3b82f6'}40`,
                        color: evt.color || '#3b82f6',
                      }}
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: evt.color || '#3b82f6' }}
                        />
                        <span className="truncate">{evt.title}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {evt.meetUrl && (
                          <Video className="w-2.5 h-2.5 text-indigo-500" />
                        )}
                        <span className="text-[10px] opacity-75 font-normal">{timeLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
