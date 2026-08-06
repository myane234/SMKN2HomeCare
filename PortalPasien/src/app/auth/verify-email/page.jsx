"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle2, Pencil, Check, X, AlertTriangle, Clock } from "lucide-react";
import { changeUnverifiedEmail, resendVerificationEmail } from "@/services/Auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 'awaiting' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Sedang memverifikasi email Anda...");

  const [email, setEmail] = useState(searchParams.get("email") || "");

  // ── State untuk ubah alamat email ──────────────────────────────────────────
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(email);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── State untuk kirim ulang email verifikasi ────────────────────────────────
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Synch local state if searchParams change
  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  // Handle countdown timer & sync with localStorage
  useEffect(() => {
    if (!email) return;

    const storageKey = `resend_cooldown_until_${email}`;
    const storedUntil = localStorage.getItem(storageKey);

    if (storedUntil) {
      const untilTime = parseInt(storedUntil, 10);
      const now = Date.now();
      if (untilTime > now) {
        const remaining = Math.ceil((untilTime - now) / 1000);
        setCooldownSeconds(remaining);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [email]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (email) {
            localStorage.removeItem(`resend_cooldown_until_${email}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds, email]);

  const handleStartEditEmail = () => {
    setEmailDraft(email);
    setEmailError("");
    setIsEditingEmail(true);
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEmailError("");
  };

  const handleSaveEmail = async () => {
    const trimmedNew = emailDraft.trim();

    if (!trimmedNew) {
      setEmailError("Email baru tidak boleh kosong.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedNew)) {
      setEmailError("Format email baru tidak valid.");
      return;
    }

    setIsChangingEmail(true);
    setEmailError("");
    setResendMsg("");
    setResendError("");

    try {
      const res = await changeUnverifiedEmail({
        old_email: email,
        new_email: trimmedNew,
      });

      setEmail(trimmedNew);
      setIsEditingEmail(false);
      setResendMsg(res?.message || "Email berhasil diubah dan tautan verifikasi telah dikirim!");

      // Update query string
      const params = new URLSearchParams(window.location.search);
      params.set("email", trimmedNew);
      router.replace(`?${params.toString()}`);
    } catch (err) {
      setEmailError(err.message || "Gagal mengubah email.");
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Check attempt rate limits (max 3 times per minute)
  const getRecentAttempts = (emailAddr) => {
    const key = `resend_attempts_${emailAddr}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const timestamps = JSON.parse(raw);
      const now = Date.now();
      // Keep attempts in last 60 seconds
      return timestamps.filter((t) => now - t < 60000);
    } catch (e) {
      return [];
    }
  };

  const recordAttempt = (emailAddr) => {
    const key = `resend_attempts_${emailAddr}`;
    const attempts = getRecentAttempts(emailAddr);
    attempts.push(Date.now());
    localStorage.setItem(key, JSON.stringify(attempts));
    return attempts;
  };

  const startCooldown = (seconds = 60) => {
    setCooldownSeconds(seconds);
    if (email) {
      const until = Date.now() + seconds * 1000;
      localStorage.setItem(`resend_cooldown_until_${email}`, until.toString());
    }
  };

  const handleResend = async () => {
    if (!email || resending || cooldownSeconds > 0) return;

    setResendMsg("");
    setResendError("");

    // Check recent 60-second window attempts
    const attempts = getRecentAttempts(email);
    if (attempts.length >= 3) {
      startCooldown(60);
      setResendError("Batas 3 kali kirim ulang per menit tercapai. Harap tunggu 1 menit.");
      return;
    }

    setResending(true);

    try {
      const res = await resendVerificationEmail(email);
      const updatedAttempts = recordAttempt(email);

      setResendMsg(res?.message || "Email verifikasi telah dikirim ulang.");

      // If user reaches 3 attempts now, start 60s cooldown
      if (updatedAttempts.length >= 3) {
        startCooldown(60);
      }
    } catch (err) {
      if (err.isRateLimited) {
        const seconds = err.retryAfter || 60;
        startCooldown(seconds);
        setResendError(`Terlalu banyak permintaan resend email. Silakan tunggu ${seconds} detik lagi.`);
      } else {
        setResendError(err.message || "Gagal mengirim ulang email. Silakan coba lagi nanti.");
      }
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let verifyUrl = searchParams.get("verify_url");

    if (!verifyUrl) {
      setStatus("awaiting");
      return;
    }

    if (verifyUrl.startsWith("https://localhost")) {
      verifyUrl = verifyUrl.replace("https://localhost", "http://localhost");
    }

    setStatus("loading");
    setMessage("Sedang memverifikasi email Anda...");

    axios
      .get(verifyUrl, {
        headers: {
          Accept: "application/json",
        },
      })
      .then((res) => {
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data?.message || "Email Anda berhasil diverifikasi!");

          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(res.data?.message || "Gagal memverifikasi email.");
        }
      })
      .catch((err) => {
        setStatus("error");
        const errorMsg =
          err.response?.data?.message ||
          "Link verifikasi sudah kadaluarsa atau tidak valid.";
        setMessage(errorMsg);
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        {/* Awaiting State */}
        {status === "awaiting" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Mail className="h-8 w-8 text-indigo-500" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Cek Email Anda</h2>

            {!isEditingEmail ? (
              <div>
                <p className="text-sm leading-relaxed text-gray-600">
                  Registrasi berhasil! Kami telah mengirimkan tautan verifikasi ke{" "}
                  {email ? (
                    <span className="font-semibold text-gray-900">{email}</span>
                  ) : (
                    "alamat email Anda"
                  )}
                  . Silakan buka email tersebut dan klik tautan verifikasi untuk mengaktifkan akun Anda.
                </p>
                <button
                  type="button"
                  onClick={handleStartEditEmail}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  <Pencil className="h-3 w-3" />
                  Salah alamat email? Ubah di sini
                </button>
              </div>
            ) : (
              <div className="text-left space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label htmlFor="edit-email" className="mb-1 block text-xs font-semibold text-gray-700">
                    Alamat Email Baru
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={emailDraft}
                    onChange={(e) => {
                      setEmailDraft(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="contoh@gmail.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                {emailError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-600">
                    {emailError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelEditEmail}
                    disabled={isChangingEmail}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEmail}
                    disabled={isChangingEmail}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isChangingEmail ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {isChangingEmail ? "Menyimpan..." : "Simpan & Kirim Ulang"}
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left">
              <p className="text-xs text-amber-800">
                Tidak menemukan emailnya? Periksa folder <strong>Spam</strong> atau{" "}
                <strong>Promosi</strong>. Maksimal 3 kali kirim ulang per menit.
              </p>
            </div>

            {resendMsg && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {resendMsg}
                </p>
              </div>
            )}

            {resendError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {resendError}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email || cooldownSeconds > 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cooldownSeconds > 0 ? (
                <>
                  <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span>Kirim ulang lagi dalam ({cooldownSeconds}s)</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                  <span>{resending ? "Mengirim ulang..." : "Kirim Ulang Email Verifikasi"}</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="inline-block w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 text-center"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        )}

        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <h2 className="text-xl font-bold text-gray-800">Verifikasi Email</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600">Verifikasi Berhasil!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-xs text-gray-400">Mengalihkan ke halaman login dalam 3 detik...</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              Login Sekarang
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600">Verifikasi Gagal</h2>
            <p className="text-gray-600">{message}</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}