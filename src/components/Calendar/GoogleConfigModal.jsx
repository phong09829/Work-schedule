import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  RefreshCw, 
  Mail, 
  User, 
  Sparkles,
  Link as LinkIcon, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Check,
  Smartphone,
  Download,
  FileJson,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Sliders,
  Settings,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportFullBackup } from '../../utils/cloudSync';
import { GOOGLE_CLIENT_ID } from '../../config/authConfig';
import { 
  setupGoogleIdentitySignIn, 
  openGoogleOAuthPopup, 
  GOOGLE_AUTH_STORAGE_KEYS,
  decodeGoogleJwt
} from '../../utils/googleAuth';

// Biểu tượng Google chuẩn 4 màu chính thức (Google Brand Icon)
export const GoogleIcon = ({ className = "w-5 h-5" }) => (
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
    loginWithDecodedGoogleUser,
    loginWithGoogleAccount,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(() => {
    return localStorage.getItem(GOOGLE_AUTH_STORAGE_KEYS.CLIENT_ID) || googleClientId || GOOGLE_CLIENT_ID;
  });

  // Demo fallback state for instant testing
  const [testEmail, setTestEmail] = useState('phong09829@gmail.com');
  const [testName, setTestName] = useState('Phong Nguyễn');
  const [showDemoBox, setShowDemoBox] = useState(false);

  const googleButtonContainerRef = useRef(null);

  // Active Client ID đang áp dụng
  const activeClientId = customClientIdInput.trim() || GOOGLE_CLIENT_ID;
  const isDefaultPlaceholder = !activeClientId || activeClientId === 'ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY';

  // Khởi tạo Google Identity Services (GIS) khi mở modal
  useEffect(() => {
    if (!isOpen || isAccountLoggedIn) return;

    let isMounted = true;

    const initGIS = async () => {
      try {
        if (!isDefaultPlaceholder && googleButtonContainerRef.current) {
          await setupGoogleIdentitySignIn({
            clientId: activeClientId,
            buttonContainer: googleButtonContainerRef.current,
            renderButton: true,
            promptOneTap: false,
            buttonConfig: {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              width: 320,
            },
            onSuccess: async ({ user }) => {
              if (!isMounted) return;
              setIsLoading(true);
              try {
                if (loginWithDecodedGoogleUser) {
                  await loginWithDecodedGoogleUser(user);
                } else if (loginWithGoogleAccount) {
                  await loginWithGoogleAccount(user.email, user.name);
                }
                if (setAppActiveTab) setAppActiveTab('calendar');
                onClose();
              } finally {
                setIsLoading(false);
              }
            },
            onError: (err) => {
              console.warn('Google Identity error:', err);
              if (isMounted && !isDefaultPlaceholder) {
                setErrorMessage('Không thể kết nối Google Identity Services. Hãy kiểm tra Client ID hoặc Authorized Origins.');
              }
            },
          });
        }
      } catch (err) {
        console.warn('GIS Init error:', err);
      }
    };

    const timer = setTimeout(initGIS, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, isAccountLoggedIn, activeClientId, isDefaultPlaceholder]);

  if (!isOpen) return null;

  // Xử lý khi nhấn nút Đăng Nhập Google (Popup / GIS Flow)
  const handleGoogleSignInClick = async () => {
    setErrorMessage(null);

    // Nếu vẫn đang để placeholder thì gợi ý nhập Client ID hoặc bấm Dùng thử
    if (isDefaultPlaceholder) {
      setShowClientIdConfig(true);
      showToast('Vui lòng thay thế "ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY" bằng Google Client ID thật, hoặc bấm Dùng Thử Demo bên dưới!', 'info', 5000);
      return;
    }

    setIsLoading(true);
    try {
      await openGoogleOAuthPopup({
        clientId: activeClientId,
        onSuccess: async ({ user }) => {
          if (loginWithDecodedGoogleUser) {
            await loginWithDecodedGoogleUser(user);
          } else if (loginWithGoogleAccount) {
            await loginWithGoogleAccount(user.email, user.name);
          }
          if (setAppActiveTab) setAppActiveTab('calendar');
          onClose();
        },
        onError: (err) => {
          console.error('Google Sign-In Popup Error:', err);
          setErrorMessage(err.message || 'Đăng nhập Google thất bại hoặc bị đóng cửa sổ.');
        },
      });
    } catch (err) {
      console.error('Google Sign In click error:', err);
      setErrorMessage(err.message || 'Lỗi khi kích hoạt Google Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trải nghiệm tức thì với Demo Google Account (Dành cho việc test nhanh luồng trích xuất thông tin)
  const handleTestDemoGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const demoUser = {
        id: `gusr-demo-${Date.now()}`,
        name: testName.trim() || 'Người dùng Google',
        email: testEmail.trim() || 'phong09829@gmail.com',
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${testEmail.trim() || 'phong09829'}`,
        emailVerified: true,
      };

      if (loginWithDecodedGoogleUser) {
        await loginWithDecodedGoogleUser(demoUser);
      } else if (loginWithGoogleAccount) {
        await loginWithGoogleAccount(demoUser.email, demoUser.name);
      }

      if (setAppActiveTab) setAppActiveTab('calendar');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Lưu Client ID mới vào bộ nhớ
  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = customClientIdInput.trim();
    if (!cleanId) {
      showToast('Client ID không được để trống!', 'warning');
      return;
    }

    localStorage.setItem(GOOGLE_AUTH_STORAGE_KEYS.CLIENT_ID, cleanId);
    if (setGoogleClientId) setGoogleClientId(cleanId);
    showToast('Đã lưu cấu hình Google Client ID thành công!', 'success');
    setShowClientIdConfig(false);
  };

  const handleExportBackup = () => {
    exportFullBackup(currentUser, { tasks, events, pomoSessions, settings });
    showToast('Đã xuất file sao lưu dữ liệu (.json) an toàn!', 'success');
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
      <div className="w-full max-w-[460px] rounded-3xl bg-[#0C1322] border border-slate-800 shadow-2xl shadow-indigo-950/50 overflow-hidden relative text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Subtle Ambient Decorative Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-blue-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-48 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="p-6 sm:p-8 overflow-y-auto">

          {/* ===================== VIEW 1: GOOGLE SIGN IN (Khi Chưa Đăng Nhập) ===================== */}
          {!isAccountLoggedIn && (
            <div className="space-y-6">
              
              {/* Header with Google Logo */}
              <div className="text-center pt-2">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#17233D] to-[#0F192C] border border-slate-700/80 flex items-center justify-center shadow-xl shadow-blue-500/10">
                    <GoogleIcon className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-[#0C1322]">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-[26px] font-extrabold text-white mt-4 tracking-tight">
                  Đăng nhập với Google
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Sử dụng Google Identity Services để đồng bộ Lịch trình, Công việc và Pomodoro tức thì.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Google Identity Services Official & Custom Buttons */}
              <div className="space-y-3 pt-1">
                
                {/* 1. GIS Official Button Container (Rendered by Google Script when valid Client ID) */}
                <div 
                  ref={googleButtonContainerRef} 
                  id="google-gis-signin-button"
                  className="flex justify-center empty:hidden"
                />

                {/* 2. Modern Standard Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isLoading}
                  className="w-full group relative flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base shadow-xl shadow-slate-950/40 border border-slate-200 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-slate-700">Đang kết nối Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                      <span>Tiếp tục với Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Client ID Setup Notice & Expandable Box */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-[#121B2D] border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">Cấu hình Client ID Google</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showClientIdConfig ? 'Thu gọn' : 'Tùy chỉnh'}</span>
                      {showClientIdConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Prominent Client ID Display */}
                  <div className="p-2 rounded-xl bg-[#090E18] border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between overflow-hidden">
                    <div className="truncate flex-1 pr-2">
                      <span className="text-slate-500 mr-1.5">CLIENT_ID:</span>
                      {isDefaultPlaceholder ? (
                        <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                          ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">{activeClientId}</span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Form to Paste Client ID */}
                  {showClientIdConfig && (
                    <form onSubmit={handleSaveClientId} className="pt-2 space-y-2.5 animate-fade-in border-t border-slate-800">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Dán Client ID từ Google Cloud Console:
                        </label>
                        <input
                          type="text"
                          value={customClientIdInput}
                          onChange={(e) => setCustomClientIdInput(e.target.value)}
                          placeholder="ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY"
                          className="w-full px-3 py-2 rounded-xl bg-[#090E18] border border-slate-700 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Hoặc sửa trực tiếp tại: <code className="text-blue-400">src/config/authConfig.js</code></span>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer"
                        >
                          Lưu ID
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Instant Demo Sandbox (Dùng Thử Nhanh) */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowDemoBox(!showDemoBox)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Trải nghiệm thử nhanh (Mô phỏng trích xuất Tên & Email)</span>
                    </span>
                    {showDemoBox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDemoBox && (
                    <div className="p-3.5 mt-2 rounded-2xl bg-[#121B2D] border border-slate-800 space-y-2.5 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Tên hiển thị</label>
                          <input
                            type="text"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                            placeholder="Phong Nguyễn"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#090E18] border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Gmail</label>
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="phong09829@gmail.com"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#090E18] border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestDemoGoogleLogin}
                        disabled={isLoading}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Đăng Nhập Thử Ngay ({testEmail})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Privacy Guarantee */}
              <div className="text-center text-[11px] text-slate-500 leading-relaxed">
                Bảo mật theo tiêu chuẩn Google OAuth 2.0 & GIS. Dữ liệu cá nhân của bạn được lưu trữ an toàn.
              </div>

            </div>
          )}

          {/* ===================== VIEW 2: PROFILE VIEW (Khi Đã Đăng Nhập) ===================== */}
          {isAccountLoggedIn && currentUser && (
            <div className="space-y-4">
              
              {/* User Identity Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#121B2D] border border-slate-700/70 shadow-lg">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GoogleIcon className="w-3.5 h-3.5" />
                    Tài Khoản Google Đã Kết Nối
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Đã xác thực
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name || 'User'} 
                        className="w-12 h-12 rounded-2xl border-2 border-blue-500/40 object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md">
                        {currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                        <span>{currentUser.name || 'Người dùng Google'}</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncWithCloud(true)}
                      disabled={isCloudSyncing}
                      className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 text-xs font-bold transition cursor-pointer"
                      title="Đồng bộ ngay dữ liệu"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={logoutAccount}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition border border-rose-500/30 cursor-pointer"
                      title="Đăng xuất tài khoản này"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* Data Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-[#090E18] border border-slate-800">
                    <span className="block text-base font-extrabold text-blue-400">{events.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Lịch trình</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#090E18] border border-slate-800">
                    <span className="block text-base font-extrabold text-indigo-400">{tasks.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Công việc</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#090E18] border border-slate-800">
                    <span className="block text-base font-extrabold text-purple-400">{pomoSessions.length}</span>
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

              {/* 1-Click Mobile Phone Linking */}
              <div className="p-3.5 rounded-2xl bg-[#121B2D] border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-400" />
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
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
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
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition border border-slate-700 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Token</span>
                  </button>
                </div>
              </div>

              {/* Offline Backup Export */}
              <div className="p-3.5 rounded-2xl bg-[#121B2D] border border-slate-700/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-blue-400" />
                    Sao Lưu File Dữ Liệu Offline (.json)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tải về toàn bộ công việc và lịch trình an toàn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
