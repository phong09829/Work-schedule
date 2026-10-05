import React, { useMemo } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Flame, 
  Timer, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Play,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from './StatCard';
import { FocusChart } from './FocusChart';

export const DashboardView = () => {
  const { 
    todayFocusMinutes, 
    todayCompletedTasks, 
    totalCompletedTasks,
    todayPomoCount, 
    streakDays, 
    tasks, 
    settings,
    currentUser,
    setActiveTab,
    linkTaskToPomodoro,
    moveTaskStatus
  } = useApp();

  const hours = (todayFocusMinutes / 60).toFixed(1);
  const targetPomos = settings.dailyGoalPomos || 8;
  const goalProgress = Math.min(100, Math.round((todayPomoCount / targetPomos) * 100));

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const curHour = new Date().getHours();
    if (curHour < 12) return { text: 'Chào buổi sáng', icon: '🌅', sub: 'Chúc bạn một ngày tràn đầy năng lượng và bứt phá!' };
    if (curHour < 18) return { text: 'Chào buổi chiều', icon: '☀️', sub: 'Giữ vững nhịp độ tập trung để hoàn thành các mục tiêu hôm nay nhé!' };
    return { text: 'Chào buổi tối', icon: '🌙', sub: 'Tuyệt vời! Hãy tổng kết lại những thành quả bạn đã làm được.' };
  }, []);

  const urgentTask = useMemo(() => {
    return (
      tasks.find(t => t.status === 'in_progress' && t.priority === 'high') ||
      tasks.find(t => t.status === 'in_progress') ||
      tasks.find(t => t.status === 'todo' && t.priority === 'high') ||
      tasks.find(t => t.status === 'todo') ||
      null
    );
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return tasks.slice(0, 4);
  }, [tasks]);

  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'bạn';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Ultra-Modern Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-9 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-brand-500/25 border border-white/15">
        {/* Ambient Decorative Blurs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20 shadow-sm">
              <span>{greeting.icon}</span>
              <span>{greeting.text}, {userName}!</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Làm chủ thời gian, tối đa hóa năng suất
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed pt-1">
              Bạn đã hoàn thành <strong className="text-white font-bold">{todayPomoCount} phiên ({hours}h)</strong> hôm nay. Tiếp tục duy trì chuỗi <strong className="text-amber-300 font-extrabold">{streakDays} ngày liên tục</strong> nhé! 🔥
            </p>
          </div>

          {/* Action Quick Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('pomodoro')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-brand-700 font-extrabold text-sm shadow-xl shadow-black/15 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-brand-600" />
              <span>Bật Pomodoro Ngay</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <ListTodo className="w-4 h-4" />
              <span>Xem Bảng Việc</span>
            </button>
          </div>
        </div>

        {/* Daily Goal Bar Inside Banner */}
        <div className="mt-7 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-300" />
              <span>Mục tiêu hàng ngày: {todayPomoCount} / {targetPomos} phiên Pomodoro</span>
            </span>
            <span className="font-mono text-amber-300 font-extrabold">{goalProgress}%</span>
          </div>
          <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Productivity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          icon={Clock}
          iconBg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          value={`${hours}h`}
          label="Thời Gian Tập Trung"
          badge={`${todayFocusMinutes} phút`}
          trend="+12% so với hôm qua"
        />
        <StatCard
          icon={Timer}
          iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          value={todayPomoCount}
          label="Phiên Pomodoro"
          badge={`Mục tiêu: ${targetPomos}`}
          trend={`${goalProgress}% hoàn thành`}
        />
        <StatCard
          icon={CheckCircle}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          value={todayCompletedTasks}
          label="Việc Xong Hôm Nay"
          badge={`Tổng: ${totalCompletedTasks}`}
          trend="Đạt chuẩn tiến độ"
        />
        <StatCard
          icon={Flame}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          value={`${streakDays}d`}
          label="Chuỗi Bứt Phá"
          badge="Kỷ lục cá nhân 🔥"
          trend="Giữ vững phong độ"
        />
      </div>

      {/* Main Content Grid: Productivity Chart + Quick Task Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Productivity 7-Day Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <span>Thống Kê Năng Suất 7 Ngày Gần Nhất</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Biểu đồ thời gian tập trung và phiên Pomodoro
              </p>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem Lịch Biểu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <FocusChart />
          </div>
        </div>

        {/* Right Column: Focus Task Card & Recent Activity */}
        <div className="space-y-6">
          
          {/* Urgent / Current Focus Task */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                <span>Việc Ưu Tiên Tiếp Theo</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                FOCUS
              </span>
            </div>

            {urgentTask ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {urgentTask.title}
                  </h3>
                  {urgentTask.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {urgentTask.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Tiến độ Pomodoro:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {urgentTask.completedPomos || 0} / {urgentTask.estimatedPomos || 2} phiên
                  </span>
                </div>

                <button
                  onClick={() => linkTaskToPomodoro(urgentTask)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Bắt Đầu Phiên Focus Cho Việc Này</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tuyệt vời! Bạn đã hoàn thành hết các việc ưu tiên.
                </p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  + Thêm công việc mới vào Kanban
                </button>
              </div>
            )}
          </div>

          {/* Quick Tasks List Preview */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Công Việc Gần Đây
              </h3>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-[11px] font-bold text-slate-500 hover:text-brand-500 transition cursor-pointer"
              >
                Xem tất cả ({tasks.length})
              </button>
            </div>

            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs hover:border-brand-500/40 transition"
                >
                  <span className={`font-semibold truncate max-w-[180px] ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'done' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : (t.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')
                  }`}>
                    {t.status === 'done' ? 'Xong' : (t.status === 'in_progress' ? 'Đang làm' : 'Cần làm')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
