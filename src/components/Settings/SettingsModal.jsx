import React, { useState, useRef } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Volume2, 
  Clock, 
  Target, 
  Download, 
  Upload, 
  RotateCcw, 
  VolumeX, 
  Play,
  Save,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundManager } from '../../utils/audio';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    exportData, 
    importData, 
    resetToDefaults, 
    showToast 
  } = useApp();

  const [formData, setFormData] = useState({ ...settings });
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      focusDuration: Math.max(1, Number(formData.focusDuration) || 25),
      shortBreakDuration: Math.max(1, Number(formData.shortBreakDuration) || 5),
      longBreakDuration: Math.max(1, Number(formData.longBreakDuration) || 15),
      longBreakInterval: Math.max(1, Number(formData.longBreakInterval) || 4),
      dailyGoalPomos: Math.max(1, Number(formData.dailyGoalPomos) || 8),
      dailyGoalHours: Math.max(1, Number(formData.dailyGoalHours) || 4),
      soundVolume: Number(formData.soundVolume),
    });
    onClose();
  };

  const handleTestSound = () => {
    soundManager.testSound(formData.soundVolume);
    showToast('Đang phát âm thanh chuông thử nghiệm 🔔', 'info', 1500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const success = importData(parsed);
        if (success) {
          onClose();
        }
      } catch (err) {
        showToast('File JSON không hợp lệ!', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về mặc định ban đầu không?')) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Cài Đặt Hệ Thống</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section: Pomodoro Timer Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand-600 dark:text-brand-400">
              <Clock className="w-4 h-4" />
              <span>Thời lượng Pomodoro (Phút)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tập trung (Focus)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.focusDuration}
                  onChange={e => handleChange('focusDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Nghỉ ngắn (Short)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.shortBreakDuration}
                  onChange={e => handleChange('shortBreakDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Nghỉ dài (Long)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.longBreakDuration}
                  onChange={e => handleChange('longBreakDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Chu kỳ kích hoạt Nghỉ dài (Sau bao nhiêu phiên Focus)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.longBreakInterval}
                onChange={e => handleChange('longBreakInterval', e.target.value)}
                className="w-32 px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Section: Daily Goals */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
              <span>Mục Tiêu Hàng Ngày</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Mục tiêu Pomodoro / ngày
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.dailyGoalPomos}
                  onChange={e => handleChange('dailyGoalPomos', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Mục tiêu Tập trung (Giờ / ngày)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.dailyGoalHours}
                  onChange={e => handleChange('dailyGoalHours', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Sound & Behavior */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-600 dark:text-purple-400">
              <Volume2 className="w-4 h-4" />
              <span>Âm Thanh & Tự Động Hóa</span>
            </div>
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bật âm thanh chuông báo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phát chuông dịu êm khi kết thúc phiên</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('soundEnabled', !formData.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.soundEnabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Volume Slider & Test */}
              {formData.soundEnabled && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs text-slate-500">Âm lượng:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={formData.soundVolume}
                    onChange={e => handleChange('soundVolume', e.target.value)}
                    className="flex-1 accent-brand-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="px-2.5 py-1 text-xs font-medium flex items-center gap-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg transition"
                  >
                    <Play className="w-3 h-3" /> Thử chuông
                  </button>
                </div>
              )}

              {/* Auto Start Breaks Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium">Tự động chuyển sang giờ nghỉ</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tự bật Break ngay khi hết phiên Focus</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('autoStartBreaks', !formData.autoStartBreaks)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.autoStartBreaks ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Data Backup & Reset */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Download className="w-4 h-4" />
              <span>Quản Lý Dữ Liệu & Sao Lưu</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={exportData}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" /> Xuất dữ liệu (JSON)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                <Upload className="w-3.5 h-3.5" /> Nhập dữ liệu (JSON)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại mặc định
              </button>
            </div>
          </div>

          {/* Action Footer */}
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/25 transition"
            >
              <Save className="w-4 h-4" /> Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
