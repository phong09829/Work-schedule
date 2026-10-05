import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Timer, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  Flame, 
  Sparkles,
  RefreshCw,
  Mail,
  ShieldCheck,
  User,
  Cloud
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SettingsModal } from './Settings/SettingsModal';
import { OtpLoginModal } from './Auth/OtpLoginModal';

export const Navbar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    streakDays, 
    todayFocusMinutes,
    currentUser,
    isAccountLoggedIn,
    isCloudSyncing
  } = useApp();
  
  const { isDark, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công Việc & Kanban', icon: CheckSquare },
    { id: 'calendar', label: 'Lịch Trình', icon: CalendarIcon },
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5 text-white animate-pulse-slow" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
                  FocusFlow
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  OTP AUTH
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
                    className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
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
            <div className="flex items-center gap-1.5 sm:gap-2.5">

              {/* Passwordless OTP Login Button */}
              <button
                onClick={() => setIsOtpModalOpen(true)}
                title={isAccountLoggedIn ? `Tài khoản OTP: ${currentUser?.email}` : 'Đăng nhập không cần mật khẩu qua Email OTP'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isAccountLoggedIn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-500'
                }`}
              >
                {isAccountLoggedIn ? (
                  <>
                    <img 
                      src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email}`} 
                      alt="Avatar" 
                      className="w-5 h-5 rounded-full object-cover border border-emerald-400/50" 
                    />
                    <span className="hidden sm:inline max-w-[110px] truncate">
                      {currentUser?.name || currentUser?.email?.split('@')[0]}
                    </span>
                    {isCloudSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Đăng Nhập OTP</span>
                  </>
                )}
              </button>

              {/* Streak Badge */}
              <div 
                title={`Chuỗi ${streakDays} ngày tập trung liên tục`}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold select-none cursor-default"
              >
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>{streakDays}d</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Cài đặt hệ thống"
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                aria-label="Open Settings"
              >
                <SettingsIcon className="w-4 h-4 hover:rotate-45 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Passwordless Email OTP Login Modal */}
      <OtpLoginModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </>
  );
};
