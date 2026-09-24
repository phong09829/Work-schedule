import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Tag, AlertCircle, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TaskModal = ({ isOpen, onClose, taskToEdit, defaultStatus = 'todo' }) => {
  const { addTask, updateTask } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Công việc',
    priority: 'medium',
    status: defaultStatus,
    deadline: '',
    estimatedPomos: 2,
    syncToCalendar: true,
  });

  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);

  const categories = ['Công việc', 'Học tập', 'Cá nhân'];

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        category: taskToEdit.category || 'Công việc',
        priority: taskToEdit.priority || 'medium',
        status: taskToEdit.status || 'todo',
        deadline: taskToEdit.deadline || '',
        estimatedPomos: taskToEdit.estimatedPomos || 1,
        syncToCalendar: false,
      });
      if (!categories.includes(taskToEdit.category)) {
        setShowCustomCat(true);
        setCustomCategory(taskToEdit.category);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Công việc',
        priority: 'medium',
        status: defaultStatus,
        deadline: '',
        estimatedPomos: 2,
        syncToCalendar: true,
      });
      setShowCustomCat(false);
      setCustomCategory('');
    }
  }, [taskToEdit, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const finalCategory = showCustomCat && customCategory.trim() 
      ? customCategory.trim() 
      : formData.category;

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        ...formData,
        category: finalCategory,
      });
    } else {
      addTask({
        ...formData,
        category: finalCategory,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{taskToEdit ? 'Chỉnh Sửa Công Việc' : 'Tạo Công Việc Mới'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tên công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thiết kế giao diện Dashboard, Ôn tập Giải tích..."
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú chi tiết mục tiêu cần hoàn thành..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Phân loại (Category)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setShowCustomCat(false);
                    setFormData({ ...formData, category: cat });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    !showCustomCat && formData.category === cat
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomCat(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                  showCustomCat
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Khác...
              </button>
            </div>
            {showCustomCat && (
              <input
                type="text"
                placeholder="Nhập tên phân loại mới..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mức độ ưu tiên
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'high', label: 'Cao', color: 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
                { id: 'medium', label: 'Trung bình', color: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                { id: 'low', label: 'Thấp', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.id })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition ${
                    formData.priority === p.id
                      ? `${p.color} ring-2 ring-brand-500/30 font-extrabold`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline & Estimated Pomodoros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hạn chót (Deadline)
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ước tính Pomodoro (🍅)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.estimatedPomos}
                onChange={e => setFormData({ ...formData, estimatedPomos: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Sync to Calendar Option if deadline provided */}
          {!taskToEdit && formData.deadline && (
            <label className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-700 dark:text-brand-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.syncToCalendar}
                onChange={e => setFormData({ ...formData, syncToCalendar: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Tự động đưa công việc này vào Lịch Trình (Calendar)</span>
            </label>
          )}

          {/* Status Selection */}
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trạng thái ban đầu
            </label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="todo">Cần làm (To Do)</option>
              <option value="in_progress">Đang làm (In Progress)</option>
              <option value="done">Đã hoàn thành (Done)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/25 transition"
            >
              {taskToEdit ? 'Cập Nhật' : 'Tạo Công Việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
