"use client";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { loginForm, loginWithGoogleAPI } from "@/services/Auth.js";
import { createSession } from "@/services/session.js";
import { FaShieldAlt } from "react-icons/fa";

// Path logo langsung merujuk ke folder public
const logo = "/images/logo/logo.png";

// ─── Google Button ────────────────────────────────────────────────────────────
function GoogleLoginButton({ onSuccess, onError, loading, isConfigured }) {
  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => onError("Login Google dibatalkan atau gagal."),
  });

  const handleClick = () => {
    if (!isConfigured) {
      onError("Fitur Google Sign-In belum dikonfigurasi di lingkungan ini. Silakan masuk menggunakan Email & Password.");
      return;
    }
    try {
      login();
    } catch {
      onError("Fitur Google Sign-In belum dikonfigurasi. Silakan masuk menggunakan Email & Password.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Lanjutkan dengan Google
    </button>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function MasukPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientId = rawClientId && rawClientId.trim() !== "" ? rawClientId : "dummy-client-id.apps.googleusercontent.com";
  const isConfigured = Boolean(rawClientId && rawClientId.trim() !== "");

  function redirectAfterLogin(data) {
    const profileComplete =
      data?.data?.is_profile_complete ?? data?.is_profile_complete;

    if (profileComplete === false) {
      window.location.href = "/complete-profile";
    } else {
      window.location.href = "/";
    }
  }

  const [isUnverifiedEmail, setIsUnverifiedEmail] = useState(false);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setIsUnverifiedEmail(false);

    try {
      const data = await loginForm(email, password);
      await createSession(data);
      redirectAfterLogin(data);
    } catch (err) {
      const msg = String(err.message || "").toLowerCase();
      const isUnverified =
        msg.includes("belum diverifikasi") ||
        msg.includes("belum terverifikasi") ||
        msg.includes("unverified") ||
        msg.includes("verif") ||
        err.status === 403;

      if (isUnverified) {
        setIsUnverifiedEmail(true);
        setErrorMsg("Email Anda belum diverifikasi. Mengalihkan ke halaman verifikasi email...");
        setTimeout(() => {
          window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
        }, 1500);
        return;
      }

      setErrorMsg(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setLoading(true);
    setErrorMsg("");
    setIsUnverifiedEmail(false);
    try {
      const data = await loginWithGoogleAPI(accessToken);
      await createSession(data);
      redirectAfterLogin(data);
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Login Google gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (customMsg) => {
    setErrorMsg(customMsg || "Login Google dibatalkan atau gagal.");
  };

  const renderLoginForm = () => (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
      {/* Logo ditambahkan di dalam card putih untuk semua tampilan (mobile, tablet, desktop) */}
      <div className="mb-5 flex items-center justify-start">
        <img src={logo} alt="Smartcare Logo" className="h-9 w-auto object-contain" />
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-1">Masuk</h2>
      <p className="mb-5 text-xs sm:text-sm text-slate-500 font-medium">
        Silakan masuk ke akun portal pasien Anda
      </p>

      {errorMsg && (
        <div className={`mb-4 rounded-xl p-3.5 border ${
          isUnverifiedEmail
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          <p className="text-xs font-semibold">{errorMsg}</p>
          {isUnverifiedEmail && (
            <a
              href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:text-amber-700"
            >
              Klik di sini untuk langsung verifikasi email →
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleManualLogin} className="flex flex-col space-y-3.5">
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Email</label>
          <input
            type="email"
            id="login-email"
            placeholder="contoh@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(""); }}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(""); }}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 pr-12 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50 text-slate-900"
            />
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="btn-login"
          disabled={loading}
          className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="flex items-center my-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="mx-3 text-xs text-slate-400 font-medium">atau</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          loading={loading}
          isConfigured={isConfigured}
        />
      </GoogleOAuthProvider>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-600">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-[#004fa4] hover:underline">
            Daftar
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
          <img src={logo} alt="Smartcare Logo" className="h-6 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] mb-2" />
          
          {/* <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm mb-3">
            <FaShieldAlt size={9} className="text-white" /> PORTAL PASIEN
          </div> */}

          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white drop-shadow-md mb-2">
            Layanan Kesehatan <span className="text-yellow-200">Terpadu di Rumah</span>
          </h1>
          <p className="text-white/90 text-xs leading-relaxed font-medium max-w-sm">
            Akses kemudahan pemesanan tenaga medis dan layanan kesehatan profesional.
          </p>
        </div>

        <div className="w-full px-6 -mt-12 pb-12 z-10 flex justify-center">
          <div className="w-full max-w-md">{renderLoginForm()}</div>
        </div>
      </div>

      {/* TAMPILAN DESKTOP */}
      <div className="hidden lg:flex w-full min-h-screen bg-slate-50 flex-row">
        {/* Sisi Kiri: Branding / Informasi */}
        <div className="w-1/2 bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] text-white px-16 py-16 xl:px-20 xl:py-20 flex flex-col justify-start rounded-r-[140px] shadow-lg relative">
          <div className="max-w-xl">
            <div className="mb-8">
              <img src={logo} alt="Smartcare Logo" className="h-12 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] mb-6" />
              {/* <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/30 text-white shadow-sm">
                <FaShieldAlt size={12} className="text-white" /> PORTAL PASIEN
              </div> */}
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-5 text-white drop-shadow-md">
              Layanan Kesehatan <br />
              <span className="text-yellow-200 drop-shadow-lg">Terpadu di Rumah</span>
            </h1>
            <p className="text-white/95 text-base xl:text-lg leading-relaxed font-medium drop-shadow-sm">
              Nikmati kenyamanan perawatan medis profesional langsung ke rumah Anda dengan sistem pemesanan yang cepat, aman, dan terpercaya.
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Form Login */}
        <div className="w-1/2 flex items-center justify-center p-12 xl:p-20">
          <div className="w-full max-w-[460px]">{renderLoginForm()}</div>
        </div>
      </div>
    </div>
  );
}