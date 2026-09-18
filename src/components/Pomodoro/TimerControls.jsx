import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
      {/* Reset Button */}
      <button
        onClick={onReset}
        title="Đặt lại phiên này"
        className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Primary Big Start/Pause Button */}
      <button
        onClick={isRunning ? onPause : onStart}
        className={`flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-3xl font-extrabold text-base sm:text-lg text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          isRunning
            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25 ring-4 ring-amber-500/20'
            : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/30 ring-4 ring-brand-500/20'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className="w-6 h-6 fill-current" />
            <span>TẠM DỪNG</span>
          </>
        ) : (
          <>
            <Play className="w-6 h-6 fill-current" />
            <span>BẮT ĐẦU</span>
          </>
        )}
      </button>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        title="Bỏ qua / Chuyển sang phiên kế tiếp"
        className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700"
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};
