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
  ListTodo
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
    setActiveTab,
    linkTaskToPomodoro,
    moveTaskStatus
  } = useApp();

  const hours = (todayFocusMinutes / 60).toFixed(1);
  const targetPomos = settings.dailyGoalPomos || 8;
  const goalProgress = Math.min(100, Math.round((todayPomoCount / targetPomos) * 100));

  // Find most urgent active task
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-brand-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chào mừng bạn đến với FocusFlow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Làm chủ thời gian, tối đa hóa năng suất
            </h1>
            <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
              Bạn đã hoàn thành <strong className="text-white font-bold">{todayPomoCount}</strong> phiên Pomodoro hôm nay. Tiếp tục duy trì chuỗi <strong className="text-amber-300 font-bold">{streakDays} ngày</strong> bứt phá nhé!
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('pomodoro')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 font-bold text-sm shadow-lg shadow-black/10 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bật Pomodoro Ngay</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all"
            >
              <ListTodo className="w-4 h-4" />
              <span>Xem Bảng Việc</span>
            </button>
          </div>
        </div>

        {/* Daily Goal Bar Inside Banner */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span>Tiến độ mục tiêu hàng ngày: {todayPomoCount} / {targetPomos} Pomodoro</span>
            <span>{goalProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Việc Đã Xong Hôm Nay"
          value={todayCompletedTasks}
          subtitle={`Tổng toàn bộ: ${totalCompletedTasks} việc`}
          icon={CheckCircle}
          color="emerald"
          trend={`${todayCompletedTasks > 0 ? '+' : ''}${todayCompletedTasks}`}
        />

        <StatCard
          title="Thời Gian Tập Trung"
          value={`${hours}h`}
          subtitle={`${todayFocusMinutes} phút tập trung sâu`}
          icon={Clock}
          color="brand"
        />

        <StatCard
          title="Phiên Pomodoro"
          value={todayPomoCount}
          subtitle={`Mục tiêu: ${targetPomos} phiên/ngày`}
          icon={Timer}
          color="purple"
        />

        <StatCard
          title="Chuỗi Kỷ Lục (Streak)"
          value={`${streakDays} ngày`}
          subtitle="Giữ vững phong độ hàng ngày"
          icon={Flame}
          color="amber"
          trend="Đang cháy!"
        />
      </div>

      {/* Charts Section */}
      <FocusChart />

      {/* Two Columns: Urgent Task & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Task Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Công việc cần tập trung
              </span>
              {urgentTask && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  urgentTask.priority === 'high'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {urgentTask.priority === 'high' ? 'Ưu tiên Cao' : 'Ưu tiên Vừa'}
                </span>
              )}
            </div>

            {urgentTask ? (
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {urgentTask.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {urgentTask.description || 'Chưa có mô tả chi tiết.'}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
                    {urgentTask.category}
                  </span>
                  <span>
                    🍅 {urgentTask.completedPomos || 0}/{urgentTask.estimatedPomos || 1} Pomos
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-sm">Tuyệt vời! Đã hết việc cần làm.</p>
              </div>
            )}
          </div>

          {urgentTask && (
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => linkTaskToPomodoro(urgentTask)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu phiên cho việc này</span>
              </button>
            </div>
          )}
        </div>

        {/* Recent Tasks List */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Danh Sách Công Việc Gần Đây</h3>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTasks.map(task => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => moveTaskStatus(task.id, isDone ? 'todo' : 'done')}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-brand-600 dark:text-brand-400">{task.category}</span>
                        <span>•</span>
                        <span>🍅 {task.completedPomos || 0}/{task.estimatedPomos || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                    </span>
                    {!isDone && (
                      <button
                        onClick={() => linkTaskToPomodoro(task)}
                        title="Tập trung vào việc này"
                        className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
