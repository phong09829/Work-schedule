import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const TimerCircle = ({
  timeLeft,
  totalTime,
  mode,
  isRunning,
  activeTask,
}) => {
  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Progress calculation
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const modeConfig = {
    focus: {
      color: '#6366F1', // Brand / Indigo
      gradientStart: '#818CF8',
      gradientEnd: '#4F46E5',
      label: 'Tập Trung Sâu',
      badgeClass: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
    },
    shortBreak: {
      color: '#10B981', // Emerald
      gradientStart: '#34D399',
      gradientEnd: '#059669',
      label: 'Nghỉ Ngắn',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    longBreak: {
      color: '#0EA5E9', // Sky
      gradientStart: '#38BDF8',
      gradientEnd: '#0284C7',
      label: 'Nghỉ Dài',
      badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
  };

  const config = modeConfig[mode] || modeConfig.focus;

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Glow Effect behind circle */}
      <div 
        className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          isRunning ? 'scale-110 opacity-30' : 'scale-95'
        }`}
        style={{ backgroundColor: config.color }}
      />

      {/* Circular Progress Timer */}
      <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 320 320">
          <defs>
            <linearGradient id={`timerGradient-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.gradientStart} />
              <stop offset="100%" stopColor={config.gradientEnd} />
            </linearGradient>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-200 dark:text-slate-800/80"
          />

          {/* Animated Progress Circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke={`url(#timerGradient-${mode})`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear drop-shadow-md"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          {/* Mode Pill Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 uppercase tracking-wider ${config.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'animate-ping' : ''}`} style={{ backgroundColor: config.color }} />
            <span>{config.label}</span>
          </div>

          {/* Time Digits */}
          <div className="text-5xl sm:text-6xl font-extrabold font-mono-timer tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            {formattedTime}
          </div>

          {/* Linked Task status under time */}
          <div className="mt-3 max-w-[220px]">
            {activeTask ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                <span className="truncate">{activeTask.title}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Chưa chọn công việc cụ thể
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
