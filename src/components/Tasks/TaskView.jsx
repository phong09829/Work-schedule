import React, { useState, useMemo } from 'react';
import { Plus, ListTodo, CheckCircle2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KanbanBoard } from './KanbanBoard';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { TaskModal } from './TaskModal';

export const TaskView = () => {
  const { tasks } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultColumnForNew, setDefaultColumnForNew] = useState('todo');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(['Công việc', 'Học tập', 'Cá nhân']);
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search query match
      const matchQuery =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category match
      const matchCat =
        selectedCategory === 'all' || t.category === selectedCategory;

      // Priority match
      const matchPriority =
        selectedPriority === 'all' || t.priority === selectedPriority;

      return matchQuery && matchCat && matchPriority;
    });
  }, [tasks, searchQuery, selectedCategory, selectedPriority]);

  const handleOpenAddModal = (status = 'todo') => {
    setTaskToEdit(null);
    setDefaultColumnForNew(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & New Task CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <ListTodo className="w-7 h-7 text-brand-500" />
            <span>Quản Lý Công Việc</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng số: <strong className="text-brand-600 dark:text-brand-400 font-bold">{tasks.length}</strong> công việc ({tasks.filter(t => t.status === 'done').length} đã hoàn thành)
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal('todo')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Công Việc Mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
        <TaskFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          viewMode={viewMode}
          setViewMode={setViewMode}
          categories={categories}
        />
      </div>

      {/* Main Content Area: Kanban or List View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onEditTask={handleOpenEditModal}
          onAddNewInColumn={handleOpenAddModal}
        />
      ) : (
        /* Detailed List View */
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isKanban={false}
                  onEdit={handleOpenEditModal}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center glass-card rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy công việc phù hợp
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Hãy thử thay đổi bộ lọc tìm kiếm hoặc tạo thêm công việc mới.
              </p>
              <button
                onClick={() => handleOpenAddModal('todo')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md"
              >
                <Plus className="w-4 h-4" /> Tạo việc mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={defaultColumnForNew}
      />
    </div>
  );
};
