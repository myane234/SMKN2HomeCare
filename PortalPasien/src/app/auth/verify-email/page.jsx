"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("Sedang memverifikasi email Anda...");

  useEffect(() => {
    let verifyUrl = searchParams.get("verify_url");

    if (!verifyUrl) {
      setStatus("error");
      setMessage("Link verifikasi tidak valid atau parameter hilang.");
      return;
    }

    if (verifyUrl.startsWith("https://localhost")) {
      verifyUrl = verifyUrl.replace("https://localhost", "http://localhost");
    }


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