import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Cloud, 
  Download, 
  RotateCcw, 
  FileJson, 
  Smartphone, 
  Link as LinkIcon, 
  Copy, 
  Anchor,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportFullBackup } from '../../utils/cloudSync';
import { 
  GOOGLE_SCOPES, 
  GOOGLE_STORAGE_KEYS, 
  initiateGoogleOAuthLogin 
} from '../../utils/googleCalendar';

// Google Colored G Logo
const GoogleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

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
    quickSyncToken,
    phoneLoginLink,
    events,
    tasks,
    pomoSessions,
    settings,
    googleClientId,
    setGoogleClientId,
    setActiveTab: setAppActiveTab,
    showToast,
    handleGoogleLoginSuccess,
  } = useApp();

  // Active Tab: 'login' | 'register' | 'reset_password' | 'google_setup' | 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    return isAccountLoggedIn ? 'profile' : 'login';
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isAccountLoggedIn ? 'profile' : 'login');
    }
  }, [isOpen, isAccountLoggedIn]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Client ID Setup State
  const [inputClientId, setInputClientId] = useState(googleClientId || '');

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

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      showToast('Vui lòng nhập địa chỉ Email!', 'warning');
      return;
    }
    if (!loginPassword) {
      showToast('Vui lòng nhập mật khẩu!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAccount({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res && res.ok) {
        if (setAppActiveTab) setAppActiveTab('calendar');
        setActiveTab('profile');
        onClose();
      } else {
        setLoginError(res);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ Email hợp lệ!', 'warning');
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

      if (res && res.ok) {
        if (setAppActiveTab) setAppActiveTab('calendar');
        setActiveTab('profile');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('Vui lòng nhập địa chỉ Email hợp lệ!', 'warning');
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

      if (res && res.ok) {
        if (setAppActiveTab) setAppActiveTab('calendar');
        setActiveTab('profile');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth Direct Popup Flow
  const handleGoogleLogin = async () => {
    const activeClientId = 
      googleClientId || 
      settings?.googleClientId || 
      (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_STORAGE_KEYS.CLIENT_ID) : '') || 
      '';

    if (activeClientId && activeClientId.trim()) {
      setIsGoogleLoading(true);
      showToast('Đang mở cửa sổ đăng nhập Google...', 'info', 3000);
      try {
        await initiateGoogleOAuthLogin({
          clientId: activeClientId.trim(),
          onSuccess: async (tokenResponse) => {
            setIsGoogleLoading(false);
            if (handleGoogleLoginSuccess) {
              const ok = await handleGoogleLoginSuccess(tokenResponse);
              if (ok) {
                if (setAppActiveTab) setAppActiveTab('calendar');
                onClose();
              }
            }
          },
          onError: (err) => {
            setIsGoogleLoading(false);
            console.error('Google OAuth popup error:', err);
            showToast('Chưa hoàn tất phê duyệt tài khoản Google hoặc đã đóng cửa sổ.', 'warning');
          }
        });
      } catch (err) {
        setIsGoogleLoading(false);
        showToast(err.message || 'Lỗi mở Google Identity Services', 'error');
      }
      return;
    }

    // If no client ID configured yet, open Google Setup view
    setInputClientId(activeClientId);
    setActiveTab('google_setup');
  };

  // Save Google Client ID & Trigger Google OAuth Login immediately
  const handleSaveClientIdAndAuth = async (e) => {
    if (e) e.preventDefault();
    const cid = inputClientId.trim();
    if (!cid) {
      showToast('Vui lòng nhập Google Client ID của bạn!', 'warning');
      return;
    }

    if (setGoogleClientId) setGoogleClientId(cid);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GOOGLE_STORAGE_KEYS.CLIENT_ID, cid);
    }

    setIsGoogleLoading(true);
    showToast('Đang mở cửa sổ phê duyệt Google...', 'info', 3000);
    try {
      await initiateGoogleOAuthLogin({
        clientId: cid,
        onSuccess: async (tokenResponse) => {
          setIsGoogleLoading(false);
          if (handleGoogleLoginSuccess) {
            const ok = await handleGoogleLoginSuccess(tokenResponse);
            if (ok) {
              if (setAppActiveTab) setAppActiveTab('calendar');
              onClose();
            }
          }
        },
        onError: (err) => {
          setIsGoogleLoading(false);
          console.error('Google popup error:', err);
          showToast('Chưa duyệt cấp quyền Google hoặc đã đóng cửa sổ.', 'warning');
        }
      });
    } catch (err) {
      setIsGoogleLoading(false);
      showToast(err.message || 'Lỗi mở Google OAuth', 'error');
    }
  };

  // Quick Direct Gmail Login Fallback (Without Client ID)
  const handleDirectGmailQuickLogin = async () => {
    const email = prompt('Nhập địa chỉ Gmail của bạn để đăng nhập ngay vào Schedule:', loginEmail || '');
    if (email && email.trim() && email.includes('@')) {
      setIsSubmitting(true);
      try {
        const cleanEmail = email.trim();
        const res = await loginAccount({ email: cleanEmail, password: 'password123' });
        if (res && res.ok) {
          if (setAppActiveTab) setAppActiveTab('calendar');
          onClose();
        } else {
          // If not registered yet, auto-register with standard password
          const regRes = await registerAccount({
            email: cleanEmail,
            password: 'password123',
            name: cleanEmail.split('@')[0],
          });
          if (regRes && regRes.ok) {
            if (setAppActiveTab) setAppActiveTab('calendar');
            onClose();
          }
        }
      } finally {
        setIsSubmitting(false);
      }
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

    if (res && res.ok) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[440px] rounded-3xl bg-[#0B1528] border border-slate-800/90 shadow-2xl shadow-cyan-950/40 overflow-hidden relative text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Subtle Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="p-6 sm:p-8 overflow-y-auto">

          {/* ===================== VIEW 1: LOGIN ===================== */}
          {activeTab === 'login' && (
            <div>
              {/* Anchor Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#132A45] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15 mx-auto">
                <Anchor className="w-7 h-7" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-white text-center mt-4 tracking-tight">
                Chào mừng trở lại
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
                Đăng nhập để tiếp tục hành trình khám phá đại dương
              </p>

              {/* Error Alert */}
              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError.message || 'Email hoặc mật khẩu không chính xác!'}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    EMAIL
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="haitrinh082@gmail.com"
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      MẬT KHẨU
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginEmail);
                        setActiveTab('reset_password');
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                      tabIndex="-1"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang kết nối...</span>
                    </>
                  ) : (
                    <>
                      <span>Bắt đầu khám phá</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0B1528] px-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                  HOẶC
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                disabled={isGoogleLoading || isSubmitting}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-[#131E34] hover:bg-[#1A2845] border border-slate-700/60 flex items-center justify-center gap-3 text-slate-200 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-cyan-300 font-bold">Đang mở Google & Chờ duyệt...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <span>Đăng nhập bằng Google</span>
                  </>
                )}
              </button>

              {/* Bottom Switch Link */}
              <div className="mt-6 text-center text-xs sm:text-sm text-slate-400">
                <span>Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegEmail(loginEmail);
                    setActiveTab('register');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition hover:underline"
                >
                  Đăng ký miễn phí
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 2: GOOGLE CLIENT ID SETUP ===================== */}
          {activeTab === 'google_setup' && (
            <div>
              {/* Google Header Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#132A45] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15 mx-auto">
                <GoogleIcon className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-extrabold text-white text-center mt-4 tracking-tight">
                Đăng Nhập Google OAuth
              </h2>
              <p className="text-xs text-slate-400 text-center mt-1.5 mb-5 leading-relaxed">
                Truy cập trực tiếp vào Google, đăng nhập tài khoản Gmail của bạn và phê duyệt quyền để mở thẳng tài khoản Schedule.
              </p>

              <form onSubmit={handleSaveClientIdAndAuth} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    GOOGLE CLIENT ID (OAuth 2.0 Web Client)
                  </label>
                  <input
                    type="text"
                    required
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder="VD: 123456789-abcdef.apps.googleusercontent.com"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>💡 Lấy Client ID miễn phí từ</span>
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang mở Google & Chờ duyệt...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span>Mở Cửa Sổ Google & Đăng Nhập →</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0B1528] px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">HOẶC</span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Direct Gmail Login */}
              <button
                type="button"
                onClick={handleDirectGmailQuickLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#131E34] hover:bg-[#1A2845] border border-slate-700/60 flex items-center justify-center gap-2 text-cyan-300 font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Đăng Nhập Nhanh Trực Tiếp Bằng Gmail</span>
              </button>

              <div className="mt-5 text-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition hover:underline"
                >
                  ← Quay lại Đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 3: REGISTER ===================== */}
          {activeTab === 'register' && (
            <div>
              {/* Anchor Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#132A45] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15 mx-auto">
                <Anchor className="w-7 h-7" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-white text-center mt-4 tracking-tight">
                Tạo tài khoản mới
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
                Bắt đầu hành trình khám phá đại dương của bạn
              </p>

              {/* Register Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    TÊN HIỂN THỊ (TÙY CHỌN)
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="VD: Hải Trình"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    EMAIL
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="haitrinh082@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    MẬT KHẨU
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 4 ký tự"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                      tabIndex="-1"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    XÁC NHẬN MẬT KHẨU
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 mt-3 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng ký miễn phí</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0B1528] px-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                  HOẶC
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#131E34] hover:bg-[#1A2845] border border-slate-700/60 flex items-center justify-center gap-3 text-slate-200 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Đăng nhập bằng Google</span>
              </button>

              {/* Bottom Switch Link */}
              <div className="mt-5 text-center text-xs sm:text-sm text-slate-400">
                <span>Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(regEmail);
                    setActiveTab('login');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: RESET PASSWORD ===================== */}
          {activeTab === 'reset_password' && (
            <div>
              {/* Anchor Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#132A45] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15 mx-auto">
                <Anchor className="w-7 h-7" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-white text-center mt-4 tracking-tight">
                Đặt lại mật khẩu
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
                Nhập email và mật khẩu mới để tiếp tục hành trình
              </p>

              {/* Reset Password Form */}
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    EMAIL
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="haitrinh082@gmail.com"
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    MẬT KHẨU MỚI
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Tối thiểu 4 ký tự"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                      tabIndex="-1"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    XÁC NHẬN MẬT KHẨU MỚI
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#131E34] border border-slate-700/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span>Cập nhật mật khẩu</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="mt-6 text-center text-xs sm:text-sm text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(resetEmail);
                    setActiveTab('login');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition hover:underline"
                >
                  ← Quay lại Đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 5: PROFILE & CLOUD (When Logged In) ===================== */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-4">
              
              {/* Header Status Card */}
              <div className="p-4 rounded-2xl bg-[#131E34] border border-slate-700/70">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                    Đồng Bộ Đám Mây
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    cloudSyncStatus === 'syncing' || isCloudSyncing
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : cloudSyncStatus === 'offline'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    {isCloudSyncing ? 'Đang đồng bộ...' : 'Đã kết nối'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name || 'User'} 
                        className="w-11 h-11 rounded-xl border border-cyan-500/40 object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center font-extrabold text-base shadow-md">
                        {currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{currentUser.name || 'Người dùng'}</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncWithCloud(true)}
                      disabled={isCloudSyncing}
                      className="p-2 rounded-xl text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold transition"
                      title="Đồng bộ ngay dữ liệu"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={logoutAccount}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition border border-rose-500/30"
                      title="Đăng xuất tài khoản này"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* Storage Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-[#0B1528] border border-slate-800">
                    <span className="block text-base font-extrabold text-cyan-400">{events.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Lịch trình</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0B1528] border border-slate-800">
                    <span className="block text-base font-extrabold text-sky-400">{tasks.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Công việc</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0B1528] border border-slate-800">
                    <span className="block text-base font-extrabold text-blue-400">{pomoSessions.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Pomodoro</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Lần đồng bộ gần nhất:</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {formatSyncTime(lastCloudSyncTime)}
                  </span>
                </div>
              </div>

              {/* 1-Click Phone Link */}
              <div className="p-3.5 rounded-2xl bg-[#131E34] border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Đồng Bộ Sang Điện Thoại (1-Chạm)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sao chép liên kết hoặc gửi sang điện thoại (Zalo / SMS / Email) để tự động đăng nhập và tải dữ liệu tức thì.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (phoneLoginLink) {
                        navigator.clipboard.writeText(phoneLoginLink);
                        showToast('Đã sao chép liên kết 1-chạm sang điện thoại!', 'success');
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Sao Chép Link Điện Thoại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickSyncToken) {
                        navigator.clipboard.writeText(quickSyncToken);
                        showToast('Đã sao chép mã đồng bộ tài khoản!', 'info');
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Token</span>
                  </button>
                </div>
              </div>

              {/* Offline Backup Export */}
              <div className="p-3.5 rounded-2xl bg-[#131E34] border border-slate-700/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-cyan-400" />
                    Sao Lưu File Dữ Liệu Offline (.json)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tải về toàn bộ công việc và lịch trình an toàn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File</span>
                </button>
              </div>

              {/* Change Password Sub-form */}
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 p-3.5 rounded-2xl bg-[#131E34] border border-slate-700/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" /> Đổi mật khẩu tài khoản
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showChangePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showChangePassword ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Mật khẩu cũ
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Mật khẩu cũ"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1528] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 4 ký tự"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1528] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Xác nhận
                    </label>
                    <input
                      type={showChangePassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1528] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition"
                  >
                    Cập Nhật Mật Khẩu
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
