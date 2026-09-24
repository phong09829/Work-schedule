import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  ShieldCheck,
  Calendar as CalendarIcon,
  Copy,
  Check,
  Mail,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_SCOPES } from '../../utils/googleCalendar';

export const GoogleConfigModal = ({ isOpen, onClose }) => {
  const {
    googleClientId,
    setGoogleClientId,
    googleUser,
    isGoogleConnected,
    loginWithDirectGmail,
    handleGoogleLoginSuccess,
    handleGoogleLogout,
    syncWithGoogleCalendar,
    isGoogleSyncing,
    showToast,
  } = useApp();

  const [activeMode, setActiveMode] = useState('direct'); // 'direct' | 'oauth_api'
  const [gmailInput, setGmailInput] = useState(googleUser?.email || 'phong09829@gmail.com');
  const [nameInput, setNameInput] = useState(googleUser?.name || 'Phong Phạm');
  const [inputClientId, setInputClientId] = useState(googleClientId || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDirectLogin = (e) => {
    e.preventDefault();
    if (!gmailInput.trim()) {
      showToast('Vui lòng nhập địa chỉ Gmail!', 'warning');
      return;
    }
    const success = loginWithDirectGmail(gmailInput.trim(), nameInput.trim());
    if (success) {
      onClose();
    }
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    setGoogleClientId(inputClientId.trim());
    showToast('Đã lưu Google Client ID!', 'success');
  };

  const handleCopyOrigin = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Đã sao chép Origin URL!', 'info');
  };

  const triggerGoogleLogin = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      showToast('Đang nạp Google Identity Services... Vui lòng kiểm tra kết nối mạng.', 'warning');
      return;
    }

    const clientIdToUse = inputClientId.trim() || googleClientId.trim();

    if (!clientIdToUse) {
      showToast('Vui lòng nhập Google Client ID của bạn trước khi đăng nhập OAuth.', 'warning');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientIdToUse,
        scope: GOOGLE_SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('GIS Error:', response);
            showToast(`Lỗi xác thực Google: ${response.error}`, 'error');
            return;
          }
          handleGoogleLoginSuccess(response);
          onClose();
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('Failed to init token client:', err);
      showToast(`Không thể khởi tạo Google OAuth: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Tài Khoản Gmail & Google Calendar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đăng nhập trực tiếp bằng Gmail hoặc kết nối API 2 chiều
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Account Status Card */}
          <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trạng thái tài khoản
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isGoogleConnected 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isGoogleConnected ? 'Đã đăng nhập Gmail' : 'Chưa đăng nhập'}
              </span>
            </div>

            {isGoogleConnected && googleUser ? (
              <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {googleUser.picture ? (
                    <img src={googleUser.picture} alt={googleUser.name} className="w-10 h-10 rounded-full border border-brand-500 shadow" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow">
                      {googleUser.name?.charAt(0) || googleUser.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{googleUser.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 font-bold">Active</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{googleUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncWithGoogleCalendar()}
                    disabled={isGoogleSyncing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                    <span>{isGoogleSyncing ? 'Đang đồng bộ...' : 'Đồng bộ lại'}</span>
                  </button>
                  <button
                    onClick={handleGoogleLogout}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Đăng nhập bằng Gmail để lưu trữ và quản lý lịch trình, đồng bộ công việc và phiên Pomodoro của bạn.
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('direct')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'direct'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Đăng Nhập Trực Tiếp Bằng Gmail (Nhanh)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('oauth_api')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'oauth_api'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Google Cloud API (Tùy chọn)</span>
            </button>
          </div>

          {/* Mode 1: Direct Gmail Login (No Google Client ID needed!) */}
          {activeMode === 'direct' && (
            <form onSubmit={handleDirectLogin} className="space-y-3.5 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Đăng nhập nhanh không cần cài đặt Google Cloud
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chỉ cần nhập địa chỉ Gmail của bạn để kích hoạt toàn bộ tính năng lịch trình và đồng bộ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Địa chỉ Gmail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={gmailInput}
                    onChange={(e) => setGmailInput(e.target.value)}
                    placeholder="VD: phong09829@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tên hiển thị
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="VD: Phong Phạm"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập & Kích Hoạt Gmail Ngay</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span>Gợi ý:</span>
                <button
                  type="button"
                  onClick={() => { setGmailInput('phong09829@gmail.com'); setNameInput('Phong Phạm'); }}
                  className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold hover:underline"
                >
                  phong09829@gmail.com
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Google Cloud OAuth API (Client ID) */}
          {activeMode === 'oauth_api' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveClientId} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-brand-500" /> Google OAuth Client ID
                    </span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      Lấy ID tại Google Cloud <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputClientId}
                      onChange={(e) => setInputClientId(e.target.value)}
                      placeholder="VD: 123456789-abcdefgh.apps.googleusercontent.com"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold transition"
                    >
                      Lưu ID
                    </button>
                  </div>
                </div>
              </form>

              <button
                type="button"
                onClick={triggerGoogleLogin}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-md flex items-center justify-center gap-3 transition-all active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Xác Thực OAuth Qua Google GIS Client</span>
              </button>

              <div className="p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-900 dark:text-brand-300">Origin URL:</span>
                  <button
                    type="button"
                    onClick={handleCopyOrigin}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <code className="block bg-slate-200 dark:bg-slate-800 p-1.5 rounded font-mono text-[10px] text-brand-600 dark:text-brand-400 overflow-x-auto">
                  {window.location.origin}
                </code>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 text-xs font-bold shadow transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
