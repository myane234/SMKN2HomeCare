"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle2, Pencil, Check, X } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 'awaiting' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Sedang memverifikasi email Anda...");

  const [email, setEmail] = useState(searchParams.get("email") || "");

  // ── State untuk ubah alamat email (jaga-jaga salah ketik pas daftar) ───────
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(email);
  const [emailError, setEmailError] = useState("");

  const handleStartEditEmail = () => {
    setEmailDraft(email);
    setEmailError("");
    setIsEditingEmail(true);
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEmailError("");
  };

  const handleSaveEmail = () => {
    const trimmed = emailDraft.trim();

    if (!trimmed) {
      setEmailError("Email tidak boleh kosong.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Format email tidak valid.");
      return;
    }

    setEmail(trimmed);
    setIsEditingEmail(false);
    setEmailError("");
    setResendMsg("");

    // Update query string supaya email yang benar tetap ada kalau halaman di-refresh
    const params = new URLSearchParams(window.location.search);
    params.set("email", trimmed);
    router.replace(`?${params.toString()}`);
  };

  // ── State untuk kirim ulang email verifikasi ────────────────────────────────
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg("");
    try {
      // Catatan: kalau email baru saja diubah, endpoint ini idealnya juga yang
      // memperbarui alamat email di akun yang belum diverifikasi, bukan cuma
      // kirim ulang ke email lama. Sesuaikan dengan endpoint backend kamu.
      // await axios.post('/api/email/resend', { email });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResendMsg("Email verifikasi telah dikirim ulang.");
    } catch (err) {
      setResendMsg("Gagal mengirim ulang email. Silakan coba lagi nanti.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let verifyUrl = searchParams.get("verify_url");

    // Belum ada verify_url berarti user baru saja daftar dan diarahkan ke sini
    // untuk diminta cek inbox-nya dulu — belum klik link verifikasi apa pun.
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

          // Redirect ke halaman login setelah 3 detik
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
        {/* Awaiting State — baru daftar, belum klik link di email */}
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
              <div className="text-left">
                <label htmlFor="edit-email" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Ubah Alamat Email
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
                  className={`w-full rounded border px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    emailError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                />
                {emailError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{emailError}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditEmail}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEmail}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Simpan &amp; Kirim Ulang
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Setelah disimpan, klik &quot;Kirim Ulang Email Verifikasi&quot; di bawah untuk mengirim tautan ke email baru.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left">
              <p className="text-xs text-amber-800">
                Tidak menemukan emailnya? Periksa folder <strong>Spam</strong> atau{" "}
                <strong>Promosi</strong>.
              </p>
            </div>

            {resendMsg && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {resendMsg}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Mengirim ulang..." : "Kirim Ulang Email Verifikasi"}
            </button>

            <Link
              href="/login"
              className="inline-block w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        )}

        {/* Loading State — sedang proses verifikasi dari link email */}
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