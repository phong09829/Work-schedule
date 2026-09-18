import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Sparkles, 
  Coffee, 
  Armchair, 
  Flame, 
  CheckCircle2, 
  Link2, 
  ChevronDown, 
  Plus, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundManager } from '../../utils/audio';
import { TimerCircle } from './TimerCircle';
import { TimerControls } from './TimerControls';

export const PomodoroView = () => {
  const {
    settings,
    activeTask,
    activeTaskId,
    setActiveTaskId,
    tasks,
    recordCompletedPomodoro,
    pomoSessions,
    todayFocusMinutes,
    todayPomoCount,
    showToast,
    setActiveTab,
  } = useApp();

  // Mode state: 'focus' | 'shortBreak' | 'longBreak'
  const [mode, setMode] = useState('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(1); // 1 to settings.longBreakInterval

  // Get duration in seconds based on mode
  const getInitialSeconds = (currentMode) => {
    if (currentMode === 'focus') return (settings.focusDuration || 25) * 60;
    if (currentMode === 'shortBreak') return (settings.shortBreakDuration || 5) * 60;
    if (currentMode === 'longBreak') return (settings.longBreakDuration || 15) * 60;
    return 25 * 60;
  };

  const [timeLeft, setTimeLeft] = useState(() => getInitialSeconds('focus'));
  const [totalDuration, setTotalDuration] = useState(() => getInitialSeconds('focus'));
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  // Sync timer when settings change and timer is NOT running
  useEffect(() => {
    if (!isRunning) {
      const newDuration = getInitialSeconds(mode);
      setTimeLeft(newDuration);
      setTotalDuration(newDuration);
    }
  }, [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration, mode]);

  // Main Timer Interval Effect
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Session finished!
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Handle Session Finish
  const handleSessionComplete = () => {
    setIsRunning(false);

    if (mode === 'focus') {
      // Play sound
      if (settings.soundEnabled) {
        soundManager.playFocusCompleteSound(settings.soundVolume);
      }

      // Record focus session to state & task
      recordCompletedPomodoro('focus');

      // Check if it's time for Long Break or Short Break
      const isLongBreakTime = cycleCount >= (settings.longBreakInterval || 4);
      const nextMode = isLongBreakTime ? 'longBreak' : 'shortBreak';

      if (isLongBreakTime) {
        setCycleCount(1);
      } else {
        setCycleCount((prev) => prev + 1);
      }

      setMode(nextMode);
      const nextDuration = getInitialSeconds(nextMode);
      setTimeLeft(nextDuration);
      setTotalDuration(nextDuration);

      // Auto start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          setIsRunning(true);
          showToast(`Bắt đầu giờ nghỉ: ${isLongBreakTime ? 'Nghỉ dài' : 'Nghỉ ngắn'}!`, 'info');
        }, 800);
      }
    } else {
      // Break session complete
      if (settings.soundEnabled) {
        soundManager.playBreakCompleteSound(settings.soundVolume);
      }

      showToast('Hết giờ nghỉ ngơi, chuẩn bị bước vào phiên tập trung mới nhé! 🚀', 'info');
      setMode('focus');
      const focusDuration = getInitialSeconds('focus');
      setTimeLeft(focusDuration);
      setTotalDuration(focusDuration);

      if (settings.autoStartPomos) {
        setTimeout(() => {
          setIsRunning(true);
        }, 800);
      }
    }
  };

  // Switch Mode Manually
  const handleSwitchMode = (newMode) => {
    if (isRunning) {
      if (!window.confirm('Phiên đếm ngược đang chạy. Bạn có muốn đổi chế độ và đặt lại thời gian không?')) {
        return;
      }
    }
    setIsRunning(false);
    setMode(newMode);
    const duration = getInitialSeconds(newMode);
    setTimeLeft(duration);
    setTotalDuration(duration);
  };

  // Timer Control Handlers
  const handleStart = () => {
    // Resume audio context on user interaction
    soundManager.getAudioContext();
    if (settings.soundEnabled) {
      soundManager.playTapSound(settings.soundVolume);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    if (settings.soundEnabled) {
      soundManager.playTapSound(settings.soundVolume);
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = getInitialSeconds(mode);
    setTimeLeft(duration);
    setTotalDuration(duration);
  };

  const handleSkip = () => {
    if (window.confirm('Bạn có muốn bỏ qua phiên hiện tại và chuyển sang chế độ tiếp theo không?')) {
      handleSessionComplete();
    }
  };

  // Today's recent sessions
  const todaySessions = pomoSessions.filter(
    (s) => s.date === new Date().toISOString().split('T')[0] && s.type === 'focus'
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Đồng Hồ Pomodoro Thông Minh
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kỹ thuật chia nhỏ thời gian 25 phút tập trung + 5 phút nghỉ ngơi giúp duy trì sự tỉnh táo tối đa.
        </p>
      </div>

      {/* Main Glass Card Timer Container */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-6 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'focus', label: 'Tập Trung', icon: Flame },
            { id: 'shortBreak', label: 'Nghỉ Ngắn', icon: Coffee },
            { id: 'longBreak', label: 'Nghỉ Dài', icon: Armchair },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isTabActive
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Circular Countdown Timer */}
        <TimerCircle
          timeLeft={timeLeft}
          totalTime={totalDuration}
          mode={mode}
          isRunning={isRunning}
          activeTask={activeTask}
        />

        {/* Controls: Start, Pause, Skip, Reset */}
        <TimerControls
          isRunning={isRunning}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSkip={handleSkip}
        />

        {/* Pomodoro Round & Cycle Indicator */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Chu kỳ hiện tại:</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: settings.longBreakInterval || 4 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx + 1 < cycleCount
                      ? 'bg-brand-500'
                      : idx + 1 === cycleCount
                      ? 'bg-brand-500 ring-2 ring-brand-500/40 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  title={`Phiên ${idx + 1}/${settings.longBreakInterval || 4}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              ({cycleCount}/{settings.longBreakInterval || 4} trước khi nghỉ dài)
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hôm nay: <strong className="text-brand-600 dark:text-brand-400 font-bold">{todayPomoCount}</strong> phiên ({todayFocusMinutes}p)
          </div>
        </div>
      </div>

      {/* Task Link Selector Box */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Link2 className="w-4 h-4 text-brand-500" />
              <span>Gắn Công Việc Đang Thực Hiện</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thời gian tập trung sẽ được tự động ghi nhận vào công việc này.
            </p>
          </div>

          {/* Selector Dropdown */}
          <div className="relative min-w-[280px]">
            <button
              onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:border-brand-500 transition"
            >
              <span className="truncate">
                {activeTask ? activeTask.title : '-- Chọn công việc để tập trung --'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isTaskDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-dropdown rounded-xl shadow-2xl p-2 space-y-1 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setActiveTaskId(null);
                    setIsTaskDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Tập trung tự do (Không liên kết công việc)
                </button>
                {tasks
                  .filter((t) => t.status !== 'done')
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setActiveTaskId(task.id);
                        setIsTaskDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                        task.id === activeTaskId
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0 ml-2">
                        {task.category}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Completed Sessions Log */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>Lịch Sử Tập Trung Hôm Nay</span>
        </h3>

        {todaySessions.length > 0 ? (
          <div className="space-y-2.5">
            {todaySessions.map((session, index) => {
              const timeStr = new Date(session.completedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={session.id || index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      {todaySessions.length - index}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {session.taskTitle || 'Phiên tập trung'}
                      </p>
                      <span className="text-[10px] text-slate-400">{timeStr}</span>
                    </div>
                  </div>

                  <span className="font-bold text-brand-600 dark:text-brand-400 px-2 py-1 rounded-lg bg-brand-500/10">
                    +{session.durationMinutes || 25} phút
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
            Chưa có phiên hoàn thành nào hôm nay. Hãy nhấn "BẮT ĐẦU" để kích hoạt phiên đầu tiên!
          </div>
        )}
      </div>
    </div>
  );
};
