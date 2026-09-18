import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  Flame, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SettingsModal } from './Settings/SettingsModal';

export const Navbar = () => {
  const { activeTab, setActiveTab, streakDays, todayFocusMinutes } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const hours = (todayFocusMinutes / 60).toFixed(1);

  const navItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công Việc & Kanban', icon: CheckSquare },
    { id: 'pomodoro', label: 'Đồng Hồ Pomodoro', icon: Timer },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5 text-white animate-pulse-slow" />
              </div>
              <div>
                <span className="text-lg font-extrabold bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
                  FocusFlow
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  PRO
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-300/50 dark:border-slate-800/80 backdrop-blur-md">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md shadow-slate-900/5 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Streak Badge */}
              <div 
                title={`Chuỗi ${streakDays} ngày tập trung liên tục`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold select-none cursor-default"
              >
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>{streakDays} ngày</span>
              </div>

              {/* Today Focus Hours */}
              <div 
                title="Thời gian tập trung hôm nay"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold select-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hours}h hôm nay</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-400 hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600 hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Cài đặt hệ thống"
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                aria-label="Settings"
              >
                <SettingsIcon className="w-5 h-5 hover:rotate-45 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[11px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
