import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TaskView } from './components/Tasks/TaskView';
import { CalendarView } from './components/Calendar/CalendarView';
import { PomodoroView } from './components/Pomodoro/PomodoroView';
import { Toast } from './components/UI/Toast';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Timer,
  Sparkles,
  Zap
} from 'lucide-react';

const MainContent = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-14 relative z-10">
      <div className="transition-all duration-300 animate-fade-in">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'tasks' && <TaskView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'pomodoro' && <PomodoroView />}
      </div>
    </main>
  );
};

// Mobile Floating Bottom Navigation Bar (Glassmorphic)
const MobileBottomNav = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Việc Cần Làm', icon: CheckSquare },
    { id: 'calendar', label: 'Lịch Trình', icon: CalendarIcon },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  ];

  return (
    <div className="fixed bottom-3 inset-x-3 z-40 md:hidden">
      <nav className="flex items-center justify-around bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 p-2 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 animate-fade-in" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen relative flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-brand-500/20 selection:text-brand-600 dark:selection:text-brand-300">
          
          {/* Top Rainbow Ambient Accent Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 animate-gradient-shift fixed top-0 left-0 right-0 z-50" />

          {/* Dynamic Ambient Background Decorative Glows */}
          <div className="ambient-glow top-0 left-1/4 w-96 h-96 bg-brand-500/30 dark:bg-brand-500/15" />
          <div className="ambient-glow top-1/3 right-10 w-96 h-96 bg-purple-500/30 dark:bg-purple-500/15" />
          <div className="ambient-glow bottom-20 left-10 w-80 h-80 bg-emerald-500/25 dark:bg-emerald-500/10" />

          {/* Sticky Header Navigation */}
          <Navbar />

          {/* Dynamic SPA View */}
          <div className="flex-1 relative">
            <MainContent />
          </div>

          {/* Mobile Floating Bottom Bar */}
          <MobileBottomNav />

          {/* Global Toast Notification Engine */}
          <Toast />

          {/* Desktop Modern Footer */}
          <footer className="hidden md:block py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-500 relative z-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">FocusFlow Cloud</span>
                <span className="text-slate-400">• Đồng bộ Google Identity & Calendar</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Thiết kế hiện đại • 100% Responsive</span>
              </div>
            </div>
          </footer>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
