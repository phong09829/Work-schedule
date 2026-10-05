import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  ShieldCheck, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  KeyRound,
  Server,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { requestEmailOtp, verifyEmailOtp, checkAuthServerHealth } from '../../utils/otpAuth';

export const OtpLoginModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isAccountLoggedIn,
    logoutAccount,
    showToast,
    loginWithOtpSession
  } = useApp();

  // Step: 'EMAIL' (Bước 1: Nhập email) | 'OTP' (Bước 2: Nhập 6 số OTP)
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [demoCodeHint, setDemoCodeHint] = useState(null);

  // Expiration countdown (5 minutes = 300s)
  const [countdown, setCountdown] = useState(300);
  // Cooldown before user can click 'Resend OTP' (60s)
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef([]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setDemoCodeHint(null);
      checkAuthServerHealth().then(info => setServerInfo(info));

      if (!isAccountLoggedIn) {
        setStep('EMAIL');
        setOtpDigits(['', '', '', '', '', '']);
      }
    }
  }, [isOpen, isAccountLoggedIn]);

  // Timer countdown for 5-min expiration
  useEffect(() => {
    let timer = null;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Timer countdown for Resend Cooldown
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when moving to OTP step
  useEffect(() => {
    if (step === 'OTP' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Format MM:SS for countdown timer
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // -------------------------------------------------------------
  // HANDLER: GỬI MÃ OTP (BƯỚC 1)
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@gmail.com)!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setDemoCodeHint(null);

    try {
      const res = await requestEmailOtp(cleanEmail);
      if (res.ok) {
        setStep('OTP');
        setCountdown(300); // 5 phút
        setResendCooldown(60); // 60s cooldown
        setOtpDigits(['', '', '', '', '', '']);

        if (res.demoOtp) {
          setDemoCodeHint(res.demoOtp);
        }

        showToast(res.message || 'Mã OTP đã được gửi đến email của bạn!', 'success', 5000);
      } else {
        setErrorMessage(res.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
      }
    } catch (err) {
      setErrorMessage('Lỗi kết nối máy chủ. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: GỬI LẠI MÃ (RESEND OTP)
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await handleSendOtp();
  };

  // -------------------------------------------------------------
  // HANDLER: XỬ LÝ NHẬP 6 Ô OTP
  // -------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    // Chỉ chấp nhận số
    const num = value.replace(/\D/g, '');
    if (!num && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = num.slice(-1); // Lấy ký tự số cuối cùng
    setOtpDigits(newDigits);

    // Tự động nhảy sang ô tiếp theo nếu đã nhập
    if (num && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Tự động submit khi nhập đủ 6 số
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  // Xử lý phím Backspace để lùi ô
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý Paste cả chuỗi 6 số
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextFocusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: XÁC THỰC MÃ OTP (BƯỚC 2)
  // -------------------------------------------------------------
  const handleVerifyOtp = async (codeToVerify) => {
    const finalOtp = typeof codeToVerify === 'string' ? codeToVerify : otpDigits.join('');

    if (finalOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số của mã OTP!');
      return;
    }

    if (countdown <= 0) {
      setErrorMessage('Mã OTP đã hết hạn. Vui lòng bấm "Gửi lại mã"!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmailOtp(email, finalOtp);

      if (res.ok) {
        if (loginWithOtpSession) {
          await loginWithOtpSession(res.token, res.user);
        }
        showToast(`🎉 ${res.message || 'Đăng nhập thành công!'}`, 'success', 5000);
        onClose();
      } else {
        setErrorMessage(res.message || 'Mã OTP không chính xác. Vui lòng thử lại!');
      }
    } catch (err) {
      setErrorMessage('Lỗi hệ thống khi xác thực mã OTP. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 relative overflow-hidden bg-white/95 dark:bg-slate-900/95">
        
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: ĐÃ ĐĂNG NHẬP THÀNH CÔNG (HIỂN THỊ HỒ SƠ) */}
        {/* ------------------------------------------------------------- */}
        {isAccountLoggedIn ? (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Tài Khoản Đang Hoạt Động
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đã xác thực bảo mật qua mã OTP Email
              </p>
            </div>

            {/* Profile Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3.5">
                <img 
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email}`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-500/40 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser?.name || currentUser?.email?.split('@')[0]}
                    </p>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      OTP VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={logoutAccount}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs hover:bg-rose-500/20 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE 2: CHƯA ĐĂNG NHẬP (LUỒNG 2 BƯỚC OTP) */
          /* ------------------------------------------------------------- */
          <div className="space-y-5 pt-1">
            
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/25 text-white">
                {step === 'EMAIL' ? (
                  <Mail className="w-7 h-7" />
                ) : (
                  <ShieldCheck className="w-7 h-7 animate-bounce-gentle" />
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {step === 'EMAIL' ? 'Đăng Nhập Bằng Mã OTP' : 'Nhập Mã Xác Thực'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {step === 'EMAIL' 
                  ? 'Đăng nhập bảo mật không cần mật khẩu. Mã OTP 6 chữ số sẽ được gửi qua email.'
                  : (
                    <span>
                      Mã 6 chữ số đã gửi tới <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                    </span>
                  )}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Demo Code Box (for rapid instant testing) */}
            {demoCodeHint && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold">Mã OTP test nhanh: </span>
                  <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono font-bold tracking-widest text-amber-800 dark:text-amber-200">
                    {demoCodeHint}
                  </code>
                  <button 
                    type="button" 
                    onClick={() => {
                      const digits = demoCodeHint.split('');
                      setOtpDigits(digits);
                      handleVerifyOtp(demoCodeHint);
                    }}
                    className="ml-2 underline font-bold hover:text-amber-900 dark:hover:text-amber-100"
                  >
                    Tự động điền & Đăng nhập
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* BƯỚC 1: NHẬP EMAIL */}
            {/* ------------------------------------------------------------- */}
            {step === 'EMAIL' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Địa chỉ Email của bạn</span>
                    <span className="text-[10px] text-slate-400 font-normal">Gmail / Outlook / Công ty</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="ví dụ: phong09829@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo & gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi Mã Xác Nhận 6 Số</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Server Status Footer */}
                <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${serverInfo?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>
                    {serverInfo?.status === 'ok' 
                      ? (serverInfo.emailConfigured ? 'Backend SMTP Gmail sẵn sàng' : 'Backend Online (Chế độ Test/Demo)') 
                      : 'Hệ thống tự động kích hoạt chế độ OTP'}
                  </span>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ */}
            {/* ------------------------------------------------------------- */}
            {step === 'OTP' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* 6 Individual Digit Boxes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Mã OTP 6 chữ số
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className={countdown <= 60 ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-600 dark:text-slate-300'}>
                        {formatTimer(countdown)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-12 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border transition-all duration-150 outline-none ${
                          digit
                            ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm shadow-brand-500/10'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otpDigits.join('').length !== 6 || countdown <= 0}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Xác Nhận & Đăng Nhập</span>
                    </>
                  )}
                </button>

                {/* Sub-actions: Resend OTP and Change Email */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setErrorMessage(null);
                    }}
                    className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Đổi email khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`font-bold transition cursor-pointer ${
                      resendCooldown > 0
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'text-brand-600 dark:text-brand-400 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
