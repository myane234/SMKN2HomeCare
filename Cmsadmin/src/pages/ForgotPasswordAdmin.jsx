import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';
import { FaShieldAlt } from 'react-icons/fa';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
  FiRefreshCw
} from 'react-icons/fi';

export default function ForgotPasswordAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 1 = Email, 2 = OTP, 3 = Reset, 4 = Selesai
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Silakan masukkan alamat email akun admin.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (!res.ok && data?.success === false) {
        throw new Error(data.message || 'Gagal meminta kode OTP.');
      }
      setSuccessMsg(data.message || 'Kode OTP telah dikirim ke email Anda.');
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal meminta kode OTP. Silakan periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setErrorMsg('Silakan masukkan 6-digit kode OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: trimmedOtp }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Kode OTP tidak valid atau kedaluwarsa.');
      }
      if (data.reset_token) {
        setResetToken(data.reset_token);
        setSuccessMsg(data.message || 'Kode OTP valid.');
        setStep(3);
      } else {
        throw new Error('Token reset tidak ditemukan.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Kode OTP tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 8) {
      setErrorMsg('Password baru minimal 8 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          reset_token: resetToken,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Gagal mereset kata sandi.');
      }
      setSuccessMsg(data.message || 'Password berhasil direset!');
      setStep(4);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <img src={logo} alt="Smartcare" className="h-8 sm:h-10 w-auto object-contain" />
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <FiArrowLeft size={14} /> Kembali ke Login
        </Link>
      </div>

      {step < 4 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
              Langkah {step} dari 3
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {step === 1 && 'Email Admin'}
              {step === 2 && 'Verifikasi OTP'}
              {step === 3 && 'Password Baru'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#004fa4] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-xl p-3.5 border bg-red-50 border-red-200 text-red-600 flex items-start gap-2.5">
          <FiAlertCircle className="shrink-0 text-base mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {successMsg && step !== 4 && (
        <div className="mb-4 rounded-xl p-3.5 border bg-emerald-50 border-emerald-200 text-emerald-700 flex items-start gap-2.5">
          <FiCheckCircle className="shrink-0 text-base mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* STEP 1: Masukkan Email */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Lupa Password Admin</h2>
          <p className="mb-5 text-xs sm:text-sm text-slate-500 font-medium">
            Masukkan email admin Anda untuk menerima 6-digit kode OTP pemulihan kata sandi.
          </p>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Email Admin
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@smarthomecare.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
                />
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Verifikasi OTP */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Verifikasi Kode OTP</h2>
          <p className="mb-4 text-xs sm:text-sm text-slate-500 font-medium">
            Masukkan 6-digit kode OTP yang dikirimkan ke <strong className="text-slate-800">{email}</strong>
          </p>

          <div className="mb-4 flex items-center justify-between p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs">
            <span className="text-slate-600 truncate mr-2">Email: <strong>{email}</strong></span>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[#004fa4] font-bold hover:underline shrink-0"
            >
              Ganti Email
            </button>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Kode OTP (6 Digit)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: 123456"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-base font-mono tracking-widest text-center focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
                />
                <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length < 4}
              className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
            </button>

            <div className="pt-2 text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-slate-400 font-medium">
                  Kirim ulang kode dalam <span className="font-bold text-slate-600">{resendTimer} detik</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004fa4] hover:underline cursor-pointer"
                >
                  <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Kirim Ulang Kode OTP
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Password Baru */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Kata Sandi Baru</h2>
          <p className="mb-5 text-xs sm:text-sm text-slate-500 font-medium">
            Masukkan kata sandi baru untuk akun admin Anda. Minimal 8 karakter.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
                />
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Konfirmasi Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={passwordConfirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
                />
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !passwordConfirmation}
              className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: Selesai */}
      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
            <FiCheckCircle size={36} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">Password Berhasil Direset!</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto mb-6">
            Kata sandi akun admin telah berhasil diperbarui. Silakan login ke panel CMS menggunakan kata sandi baru.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer"
          >
            Masuk ke Panel Admin
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-600">
          Ingat kata sandi Anda?{' '}
          <Link to="/login" className="font-bold text-[#004fa4] hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden items-center justify-center">
      {/* TAMPILAN MOBILE & TABLET */}
      <div className="flex lg:hidden w-full min-h-screen flex-col relative bg-white">
        <div className="w-full bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] px-6 pt-10 pb-20 flex flex-col items-start justify-start rounded-b-[40px] shadow-lg text-left">
          <img
            src={logo}
            alt="Smartcare Logo"
            className="h-6 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] mb-2"
          />

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm mb-3">
            <FaShieldAlt size={9} className="text-white" /> PORTAL RESMI
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white drop-shadow-md mb-2">
            Pemulihan Akun <span className="text-yellow-200">Admin</span>
          </h1>
          <p className="text-white/90 text-xs leading-relaxed font-medium max-w-sm">
            Atur ulang kata sandi akun CMS HomeCare dengan aman menggunakan kode OTP.
          </p>
        </div>

        <div className="w-full px-6 -mt-12 pb-12 z-10 flex justify-center">
          <div className="w-full max-w-md">{renderContent()}</div>
        </div>
      </div>

      {/* TAMPILAN DESKTOP */}
      <div className="hidden lg:flex w-full min-h-screen bg-slate-50 flex-row">
        <div className="w-1/2 bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] text-white px-16 py-16 xl:px-20 xl:py-20 flex flex-col justify-start rounded-r-[140px] shadow-lg relative">
          <div className="max-w-xl">
            <div className="mb-8">
              <img
                src={logo}
                alt="Smartcare Logo"
                className="h-12 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] mb-6"
              />
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/30 text-white shadow-sm">
                <FaShieldAlt size={12} className="text-white" /> PORTAL RESMI
              </div>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-5 text-white drop-shadow-md">
              Pemulihan Akses <br />
              <span className="text-yellow-200 drop-shadow-lg">Panel Administrator</span>
            </h1>
            <p className="text-white/95 text-base xl:text-lg leading-relaxed font-medium drop-shadow-sm">
              Sistem verifikasi keamanan terenkripsi untuk mereset kata sandi staf dan pengelola operasional HomeCare.
            </p>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center p-12 xl:p-20">
          <div className="w-full max-w-[460px]">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
