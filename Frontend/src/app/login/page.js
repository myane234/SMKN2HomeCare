"use client";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { loginForm, loginWithGoogleAPI } from "@/services/Auth.js";
import { createSession } from "@/services/session.js";

// ─── Google Button (inner component karena useGoogleLogin harus dalam Provider) ─
function GoogleLoginButton({ onSuccess, onError, loading }) {
  const login = useGoogleLogin({
    // 'implicit' flow → tokenResponse.access_token (yg dibutuhkan Socialite backend)
    flow: "implicit",
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => onError(),
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Google SVG icon */}
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

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // ── Redirect helper ────────────────────────────────────────────────────────
  function redirectAfterLogin(data) {
    // Login manual: is_profile_complete ada di data.data
    // Login Google: is_profile_complete ada di data (flat)
    const profileComplete =
      data?.data?.is_profile_complete ?? data?.is_profile_complete;

    if (profileComplete === false) {
      window.location.href = "/complete-profile";
    } else {
      window.location.href = "/";
    }
  }

  // ── Login manual ───────────────────────────────────────────────────────────
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await loginForm(email, password);
      await createSession(data);
      redirectAfterLogin(data);
    } catch (err) {
      setErrorMsg(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  // ── Login Google ───────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (accessToken) => {
    setLoading(true);
    setErrorMsg("");
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

  const handleGoogleError = () => {
    setErrorMsg("Login Google dibatalkan atau gagal");
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Hero Background */}
      <section className="h-64 bg-indigo-500" />

      {/* Login Card */}
      <div className="-mt-32 flex justify-center px-6 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">Masuk</h1>

          {/* Pesan Error */}
          {errorMsg && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-600">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleManualLogin}>
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="login-email"
                placeholder="contoh@gmail.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(""); }}
                required
                className="w-full rounded border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(""); }}
                  required
                  className="w-full rounded border border-gray-300 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              id="btn-login"
              disabled={loading}
              className="w-full rounded-full bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>

            {/* Divider */}
            <div className="flex items-center">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="mx-3 text-sm text-gray-400">atau</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google Login — pakai useGoogleLogin agar dapat access_token */}
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                loading={loading}
              />
            </GoogleOAuthProvider>

            {/* Register Link */}
            <p className="pt-2 text-center text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link href="/daftar" className="font-medium text-indigo-600 hover:underline">
                Daftar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
