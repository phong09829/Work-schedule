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
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Clock,
  ListTodo,
  Cloud,
  CloudCheck,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Share2,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_SCOPES } from '../../utils/googleCalendar';

export const GoogleConfigModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isAccountLoggedIn,
    registerAccount,
    loginAccount,
    changeAccountPassword,
    logoutAccount,
    cloudSyncStatus,
    isCloudSyncing,
    lastCloudSyncTime,
    syncWithCloud,
    quickSyncToken,
    importQuickSync,
    googleClientId,
    setGoogleClientId,
    googleUser,
    isGoogleConnected,
    handleGoogleLoginSuccess,
    syncWithGoogleCalendar,
    isGoogleSyncing,
    events,
    tasks,
    pomoSessions,
    showToast,
  } = useApp();

  // Active Tab: 'login' | 'register' | 'profile' | 'quicksync' | 'google_api'
  const [activeTab, setActiveTab] = useState(() => {
    return isAccountLoggedIn ? 'profile' : 'login';
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Quick Sync State
  const [inputSyncToken, setInputSyncToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Google OAuth API State
  const [inputClientId, setInputClientId] = useState(googleClientId || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      showToast('Vui lòng nhập địa chỉ Gmail!', 'warning');
      return;
    }
    if (!loginPassword) {
      showToast('Vui lòng nhập mật khẩu tài khoản!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAccount({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.ok) {
        setActiveTab('profile');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ Gmail hợp lệ!', 'warning');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'warning');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('Mật khẩu xác nhận không khớp! Vui lòng nhập lại.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerAccount({
        email: regEmail.trim(),
        password: regPassword,
        name: regName.trim(),
      });

      if (res.ok) {
        setActiveTab('profile');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Change Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại!', 'warning');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showToast('Mật khẩu mới phải có ít nhất 4 ký tự!', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Xác nhận mật khẩu mới không khớp!', 'warning');
      return;
    }

    const res = await changeAccountPassword({
      oldPassword,
      newPassword,
    });

    if (res.ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  // Handle Quick Sync Import
  const handleImportTokenSubmit = async (e) => {
    e.preventDefault();
    if (!inputSyncToken.trim()) {
      showToast('Vui lòng dán mã đồng bộ vào ô!', 'warning');
      return;
    }
    const success = await importQuickSync(inputSyncToken.trim());
    if (success) {
      setActiveTab('profile');
      onClose();
    }
  };

  const handleCopySyncToken = () => {
    if (!quickSyncToken) return;
    navigator.clipboard.writeText(quickSyncToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
    showToast('Đã sao chép mã đồng bộ nhanh vào bộ nhớ tạm!', 'info');
  };

  // Google OAuth triggers
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
      showToast('Vui lòng nhập Google Client ID của bạn trước khi xác thực OAuth.', 'warning');
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

  const formatSyncTime = (timeStr) => {
    if (!timeStr) return 'Chưa có';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Tài Khoản & Đồng Bộ Đám Mây</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Đăng nhập trên bất kỳ điện thoại hoặc máy tính nào chỉ với Gmail & Mật khẩu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="p-2 sm:p-3 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-950/80 border border-slate-300/40 dark:border-slate-800 min-w-max sm:min-w-0">
            {isAccountLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'profile'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Hồ Sơ & Đám Mây</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quicksync')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'quicksync'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Liên Kết Thiết Bị</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('google_api')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'google_api'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Google Calendar API</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng Ký Tài Khoản</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quicksync')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'quicksync'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Nhập Mã Đồng Bộ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
          
          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-900/50">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                  <Cloud className="w-4 h-4 text-brand-500" />
                  <span>Đăng nhập đồng bộ từ bất kỳ Điện Thoại hoặc Máy Tính nào</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Chỉ cần nhập Gmail và Mật khẩu bạn đã đăng ký, toàn bộ lịch trình, công việc và Pomodoro sẽ tự động tải về thiết bị này.
                </p>
              </div>

              {/* Gmail Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Gmail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="VD: phong09829@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu tài khoản"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Đang kết nối Đám Mây...' : 'Đăng Nhập & Đồng Bộ Dữ Liệu'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Chưa có tài khoản trên hệ thống? </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegEmail(loginEmail);
                    setActiveTab('register');
                  }}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Đăng ký tài khoản mới ngay
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <UserPlus className="w-4 h-4 text-purple-500" />
                  <span>Đăng ký Gmail & Tạo tài khoản Đám Mây mới</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Đăng ký một lần để sử dụng trên mọi thiết bị (iPhone, Android, Laptop, PC). Dữ liệu được lưu trữ và sao lưu an toàn trên Cloud.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên của bạn (Tùy chọn)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="VD: Phong Phạm"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Gmail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="VD: phong09829@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tạo Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 4 ký tự"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận lại Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại đúng mật khẩu ở trên"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Đang tạo tài khoản Đám Mây...' : 'Tạo Tài Khoản & Bật Đồng Bộ'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(regEmail);
                    setActiveTab('login');
                  }}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PROFILE & CLOUD STATUS (When Logged In) */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-5">
              
              {/* Profile & Cloud Connection Status Card */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-brand-500" />
                    Đồng Bộ Đám Mây
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    cloudSyncStatus === 'syncing' || isCloudSyncing
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : cloudSyncStatus === 'offline'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {isCloudSyncing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {isCloudSyncing ? 'Đang đồng bộ...' : cloudSyncStatus === 'offline' ? 'Lưu ngoại tuyến' : 'Đã kết nối Đám Mây'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-base shadow-md">
                      {currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{currentUser.name || 'Người dùng'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 font-bold">Cloud Synced</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncWithCloud(true)}
                      disabled={isCloudSyncing}
                      className="p-2 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-brand-200/60 dark:border-brand-900/40 text-xs font-bold transition"
                      title="Đồng bộ ngay với máy chủ Đám Mây"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={logoutAccount}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition border border-rose-200/60 dark:border-rose-900/40"
                      title="Đăng xuất tài khoản này"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* Storage Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-base font-extrabold text-brand-600 dark:text-brand-400">{events.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Lịch trình lưu</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-base font-extrabold text-indigo-600 dark:text-indigo-400">{tasks.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Công việc</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-base font-extrabold text-purple-600 dark:text-purple-400">{pomoSessions.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Phiên Pomodoro</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Lần đồng bộ gần nhất:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                    {formatSyncTime(lastCloudSyncTime)}
                  </span>
                </div>
              </div>

              {/* Fast Device Link Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-brand-50/50 via-purple-50/30 to-slate-50/50 dark:from-brand-950/20 dark:via-purple-950/20 dark:to-slate-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Đồng Bộ Nhanh Sang Điện Thoại</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySyncToken}
                    className="px-2.5 py-1 rounded-lg bg-brand-600 text-white hover:bg-brand-500 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'Đã chép mã!' : 'Chép mã 1-chạm'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Sao chép mã này và gửi sang điện thoại (hoặc dán vào tab "Nhập Mã Đồng Bộ" trên máy khác) để đăng nhập tức thì không cần gõ mật khẩu.
                </p>
              </div>

              {/* Change Password Sub-form */}
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-brand-500" /> Đổi mật khẩu tài khoản
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    {showChangePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showChangePassword ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mật khẩu cũ
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Mật khẩu hiện tại"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 4 ký tự"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Xác nhận lại
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
                  >
                    Cập Nhật Mật Khẩu Đám Mây
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 4: QUICK SYNC TOKEN IMPORT */}
          {activeTab === 'quicksync' && (
            <form onSubmit={handleImportTokenSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Liên kết thiết bị 1 chạm không cần nhập mật khẩu</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Nếu bạn đã đăng nhập trên máy tính và sao chép "Mã đồng bộ nhanh", hãy dán mã vào ô dưới đây để điện thoại tự động kết nối tài khoản.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dán Mã Đồng Bộ Nhanh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={inputSyncToken}
                  onChange={(e) => setInputSyncToken(e.target.value)}
                  placeholder="Dán chuỗi mã đồng bộ từ thiết bị kia vào đây..."
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Liên Kết Thiết Bị Ngay</span>
              </button>
            </form>
          )}

          {/* TAB 5: GOOGLE CLOUD OAUTH API */}
          {activeTab === 'google_api' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  <span>Đồng bộ 2 chiều thời gian thực với Google Calendar API</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Tùy chọn kết nối với Google Cloud Console để đồng bộ sự kiện giữa FocusFlow và ứng dụng Google Calendar trên điện thoại của bạn.
                </p>
              </div>

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
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputClientId}
                      onChange={(e) => setInputClientId(e.target.value)}
                      placeholder="VD: 123456789-abcdefgh.apps.googleusercontent.com"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold transition"
                    >
                      Lưu ID
                    </button>
                  </div>
                </div>
              </form>

              <button
                type="button"
                onClick={triggerGoogleLogin}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-md flex items-center justify-center gap-3 transition active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Xác Thực & Đồng Bộ Với Google GIS</span>
              </button>

              <div className="p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-900 dark:text-brand-300">Origin URL (Thêm vào Google Console):</span>
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
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                </code>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium truncate max-w-[200px] sm:max-w-[300px]">
            {isAccountLoggedIn ? `Tài khoản: ${currentUser.email}` : 'Chế độ lưu trữ thiết bị'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 text-xs font-bold shadow transition hover:opacity-90"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
