import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TaskView } from './components/Tasks/TaskView';
import { PomodoroView } from './components/Pomodoro/PomodoroView';
import { Toast } from './components/UI/Toast';

const MainContent = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-12 relative z-10">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'tasks' && <TaskView />}
      {activeTab === 'pomodoro' && <PomodoroView />}
    </main>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen relative flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
          {/* Ambient Background Decorative Glows */}
          <div className="ambient-glow top-0 left-1/4 w-96 h-96 bg-brand-500" />
          <div className="ambient-glow top-1/3 right-10 w-80 h-80 bg-purple-500" />
          <div className="ambient-glow bottom-10 left-10 w-80 h-80 bg-emerald-500" />

          {/* Sticky Navbar */}
          <Navbar />

          {/* Dynamic SPA View */}
          <div className="flex-1">
            <MainContent />
          </div>

          {/* Global Toast Container */}
          <Toast />

          {/* Desktop Subtle Footer */}
          <footer className="hidden md:block py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400 dark:text-slate-600 relative z-10">
            FocusFlow © 2026 • Ứng Dụng Quản Lý Thời Gian & Pomodoro Toàn Diện
          </footer>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
