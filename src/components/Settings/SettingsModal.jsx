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
  Check,
  Shield,
  Mail,
  User,
  LogOut,
  Sparkles,
  CheckCircle2
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
    currentUser,
    isAccountLoggedIn,
    logoutAccount,
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
        const json = JSON.parse(event.target?.result);
        const success = importData(json);
        if (success) {
          onClose();
        }
      } catch (err) {
        showToast('File JSON không hợp lệ. Vui lòng kiểm tra lại!', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 relative max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Cài Đặt Hệ Thống
              </h2>
              <p className="text-xs text-slate-400">Tùy biến Pomodoro, âm thanh và tài khoản</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Status Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-brand-500" />
              <span>Tài Khoản Đăng Nhập (Email OTP)</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAccountLoggedIn
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}>
              {isAccountLoggedIn ? 'Đã xác thực OTP' : 'Chưa đăng nhập'}
            </span>
          </div>

          {isAccountLoggedIn ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <img 
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email}`} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-xl object-cover border border-emerald-400/50" 
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {currentUser?.name || currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutAccount();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Đăng nhập bằng mã OTP qua Email để tự động lưu trữ và đồng bộ hóa công việc, lịch trình trên mọi thiết bị.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5 mt-4">
          {/* Pomodoro Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời Gian Pomodoro (Phút)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Tập trung
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.focusDuration}
                  onChange={(e) => handleChange('focusDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nghỉ ngắn
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.shortBreakDuration}
                  onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nghỉ dài
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.longBreakDuration}
                  onChange={(e) => handleChange('longBreakDuration', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Daily Goals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Mục Tiêu Mỗi Ngày</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Số phiên hoàn thành
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.dailyGoalPomos}
                  onChange={(e) => handleChange('dailyGoalPomos', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Thời lượng mục tiêu (giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={formData.dailyGoalHours}
                  onChange={(e) => handleChange('dailyGoalHours', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Sound & Audio Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Âm Thanh & Chuông Báo</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Âm lượng chuông</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-brand-600 dark:text-brand-400">
                    {Math.round(formData.soundVolume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 font-bold transition cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Thử</span>
                  </button>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.soundVolume}
                onChange={(e) => handleChange('soundVolume', Number(e.target.value))}
                className="w-full accent-brand-600 dark:accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sao Lưu & Phục Hồi Dữ Liệu
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportData}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất File JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập File JSON</span>
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
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt về mặc định?')) {
                    resetToDefaults();
                    setFormData({ ...settings });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cài Đặt</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
