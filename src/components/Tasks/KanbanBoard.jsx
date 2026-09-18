import React, { useState } from 'react';
import { Plus, ListTodo, Loader2, CheckCircle2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { useApp } from '../../context/AppContext';

export const KanbanBoard = ({ tasks, onEditTask, onAddNewInColumn }) => {
  const { moveTaskStatus } = useApp();
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    {
      id: 'todo',
      title: 'Cần Làm',
      englishTitle: 'To Do',
      color: 'border-indigo-500/40 text-indigo-500 bg-indigo-500/10',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      icon: ListTodo,
    },
    {
      id: 'in_progress',
      title: 'Đang Làm',
      englishTitle: 'In Progress',
      color: 'border-amber-500/40 text-amber-500 bg-amber-500/10',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: Loader2,
    },
    {
      id: 'done',
      title: 'Hoàn Thành',
      englishTitle: 'Done',
      color: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
    },
  ];

  const handleDragStart = (e, taskId) => {
    setActiveDragId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (colId) => {
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || activeDragId;
    if (taskId) {
      moveTaskStatus(taskId, colId);
      setActiveDragId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isTargeted = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => handleDragLeave(col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-3xl p-4 sm:p-5 transition-all duration-200 min-h-[500px] border ${
              isTargeted
                ? 'border-brand-500 bg-brand-500/5 ring-2 ring-brand-500/20'
                : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${col.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{col.title}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badgeBg}`}>
                      {columnTasks.length}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Quick Add Button in column */}
              <button
                onClick={() => onAddNewInColumn(col.id)}
                title={`Thêm công việc vào ${col.title}`}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List in Column */}
            <div className="flex-1 space-y-3.5 overflow-y-auto">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isKanban={true}
                    onEdit={onEditTask}
                    onDragStart={handleDragStart}
                  />
                ))
              ) : (
                <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Kéo thả việc vào đây
                  </p>
                  <button
                    onClick={() => onAddNewInColumn(col.id)}
                    className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm nhanh
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
