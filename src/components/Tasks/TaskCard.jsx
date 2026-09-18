import React from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TaskCard = ({ 
  task, 
  onEdit, 
  isKanban = true, 
  onDragStart 
}) => {
  const { moveTaskStatus, deleteTask, linkTaskToPomodoro, activeTaskId } = useApp();

  const isCurrentActive = activeTaskId === task.id;
  const isDone = task.status === 'done';

  const priorityStyles = {
    high: {
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Cao',
    },
    medium: {
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500',
      label: 'Trung bình',
    },
    low: {
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-500',
      label: 'Thấp',
    },
  };

  const priority = priorityStyles[task.priority] || priorityStyles.medium;

  // Deadline formatting & overdue check
  let formattedDeadline = null;
  let isOverdue = false;
  if (task.deadline) {
    const d = new Date(task.deadline);
    if (!isNaN(d.getTime())) {
      isOverdue = !isDone && d.getTime() < Date.now();
      formattedDeadline = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }

  const handleNextStatus = () => {
    if (task.status === 'todo') moveTaskStatus(task.id, 'in_progress');
    else if (task.status === 'in_progress') moveTaskStatus(task.id, 'done');
    else moveTaskStatus(task.id, 'todo');
  };

  const handlePrevStatus = () => {
    if (task.status === 'done') moveTaskStatus(task.id, 'in_progress');
    else if (task.status === 'in_progress') moveTaskStatus(task.id, 'todo');
  };

  return (
    <div
      draggable={isKanban}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      className={`group relative glass-card rounded-2xl p-4 border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg ${
        isCurrentActive 
          ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5' 
          : isDone 
          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80' 
          : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Badge */}
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {task.category}
          </span>

          {/* Priority Badge */}
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${priority.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            title="Chỉnh sửa công việc"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
            title="Xóa công việc"
            className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-3">
        <h4 className={`text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug ${
          isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
        }`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Deadline & Pomodoro Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Deadline Indicator */}
        {formattedDeadline ? (
          <div className={`flex items-center gap-1 font-medium ${
            isOverdue ? 'text-rose-500 font-bold' : ''
          }`}>
            {isOverdue ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Calendar className="w-3.5 h-3.5 shrink-0" />}
            <span className="text-[11px]">{formattedDeadline}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">Không có hạn</div>
        )}

        {/* Pomodoro Count */}
        <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <span title="Số phiên Pomodoro đã hoàn thành / ước tính">🍅 {task.completedPomos || 0}/{task.estimatedPomos || 1}</span>
        </div>
      </div>

      {/* Bottom Interactive Toolbar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Quick move buttons */}
        <div className="flex items-center gap-1">
          {task.status !== 'todo' && (
            <button
              onClick={handlePrevStatus}
              title="Chuyển về trạng thái trước"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={handleNextStatus}
              title="Chuyển sang trạng thái tiếp theo"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === 'done' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'todo')}
              title="Mở lại công việc"
              className="text-[11px] font-semibold text-brand-500 hover:underline"
            >
              Làm lại
            </button>
          )}
        </div>

        {/* Link to Pomodoro Button */}
        {!isDone && (
          <button
            onClick={() => linkTaskToPomodoro(task)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isCurrentActive
                ? 'bg-brand-600 text-white shadow-brand-500/25'
                : 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isCurrentActive ? 'Đang chạy' : 'Tập trung'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
