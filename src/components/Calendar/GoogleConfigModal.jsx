import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
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
  Cloud, 
  Download, 
  RotateCcw, 
  FileJson,
  Laptop
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportFullBackup } from '../../utils/cloudSync';

export const GoogleConfigModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isAccountLoggedIn,
    registerAccount,
    loginAccount,
    resetAccountPassword,
    changeAccountPassword,
    logoutAccount,
    cloudSyncStatus,
    isCloudSyncing,
    lastCloudSyncTime,
    syncWithCloud,
    getAllLocalAccounts,
    events,
    tasks,
    pomoSessions,
    settings,
    showToast,
  } = useApp();

  // Active Tab: 'login' | 'register' | 'reset_password' | 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    return isAccountLoggedIn ? 'profile' : 'login';
  });

  // Local Accounts List
  const [localAccounts, setLocalAccounts] = useState([]);

  useEffect(() => {
    if (isOpen && getAllLocalAccounts) {
      try {
        const accounts = getAllLocalAccounts();
        setLocalAccounts(accounts || []);
      } catch (_) {}
    }
  }, [isOpen, getAllLocalAccounts]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Reset Password Form State
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Change Password Form State (in Profile tab)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

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
      } else {
        setLoginError(res);
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

  // Handle Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ Gmail hợp lệ!', 'warning');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 4) {
      showToast('Mật khẩu mới phải có ít nhất 4 ký tự!', 'warning');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showToast('Xác nhận mật khẩu mới không khớp!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetAccountPassword({
        email: resetEmail.trim(),
        newPassword: resetNewPassword,
      });

      if (res.ok) {
        setActiveTab('profile');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Change Password (inside Profile)
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

  const handleExportBackup = () => {
    exportFullBackup(currentUser, { tasks, events, pomoSessions, settings });
    showToast('Đã xuất file sao lưu dữ liệu (.json) thành công!', 'success');
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
      <div className="glass-card w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
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
                Đăng nhập trên bất kỳ điện thoại hoặc máy tính nào với Gmail & Mật khẩu
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
        <div className="p-2 sm:p-3 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
          <div className="flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-950/80 border border-slate-300/40 dark:border-slate-800">
            {isAccountLoggedIn ? (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Hồ Sơ & Đám Mây</span>
              </button>
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
                  <span>Đăng Nhập</span>
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
                  <span>Đăng Ký Mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reset_password')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'reset_password'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt Lại Mật Khẩu</span>
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
                  Nhập Gmail và Mật khẩu bạn đã tạo. Toàn bộ công việc, lịch trình và Pomodoro sẽ tự động hiển thị đầy đủ.
                </p>
              </div>

              {/* Detected Local Accounts on this Browser */}
              {localAccounts.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-brand-500" />
                    <span>Tài khoản đã dùng trên thiết bị này:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLoginEmail(acc.email);
                          if (acc.password) setLoginPassword(acc.password);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                          loginEmail === acc.email
                            ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        }`}
                      >
                        <Mail className="w-3 h-3" />
                        <span>{acc.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Alert with Fast Reset Button */}
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{loginError.message}</span>
                  </div>
                </div>
              )}

              {/* Email Input */}
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
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="VD: phong09829@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setActiveTab('reset_password');
                    }}
                    className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError(null);
                    }}
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
                <span>{isSubmitting ? 'Đang kiểm tra tài khoản...' : 'Đăng Nhập & Đồng Bộ Dữ Liệu'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegEmail(loginEmail);
                    setActiveTab('register');
                  }}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  ➕ Tạo tài khoản mới
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(loginEmail);
                    setActiveTab('reset_password');
                  }}
                  className="font-bold text-slate-600 dark:text-slate-300 hover:underline"
                >
                  🔄 Đặt lại mật khẩu
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
                  <span>Đăng ký Gmail & Tạo tài khoản mới</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Đăng ký một lần để sử dụng trên mọi thiết bị (iPhone, Android, Laptop, PC). Toàn bộ dữ liệu được lưu an toàn.
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
                <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Bật Đồng Bộ'}</span>
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

          {/* TAB 3: RESET PASSWORD FORM */}
          {activeTab === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Đặt lại mật khẩu cho tài khoản Gmail</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Nếu bạn quên mật khẩu hoặc tạo tài khoản trước đó, hãy nhập Gmail và mật khẩu mới bạn muốn đặt để mở khóa tài khoản ngay lập tức.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Gmail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="VD: phong09829@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Tối thiểu 4 ký tự"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận lại Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Nhập lại đúng mật khẩu mới"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-brand-600 hover:from-amber-500 hover:to-brand-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Lưu Mật Khẩu & Đăng Nhập Ngay'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(resetEmail);
                    setActiveTab('login');
                  }}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: PROFILE & CLOUD STATUS (When Logged In) */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-5">
              
              {/* Profile & Cloud Connection Status Card */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-brand-500" />
                    Đồng Bộ Đám Mây Toàn Cầu
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
                    {isCloudSyncing ? 'Đang đồng bộ...' : cloudSyncStatus === 'offline' ? 'Lưu ngoại tuyến' : 'Đã kết nối'}
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
                      title="Đồng bộ ngay dữ liệu"
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
                    <span className="text-[10px] font-semibold text-slate-500">Lịch trình</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-base font-extrabold text-indigo-600 dark:text-indigo-400">{tasks.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Công việc</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-base font-extrabold text-purple-600 dark:text-purple-400">{pomoSessions.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Pomodoro</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Lần đồng bộ gần nhất:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                    {formatSyncTime(lastCloudSyncTime)}
                  </span>
                </div>
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
                    Cập Nhật Mật Khẩu
                  </button>
                </div>
              </form>

              {/* Offline Backup Export */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-purple-500" />
                    Sao Lưu File Dữ Liệu Offline (.json)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tải về toàn bộ công việc và lịch trình thành 1 file offline an toàn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium truncate max-w-[200px] sm:max-w-[300px]">
            {isAccountLoggedIn ? `Tài khoản: ${currentUser.email}` : 'Chế độ lưu trữ đám mây'}
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
