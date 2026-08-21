"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { registerUser, loginWithGoogleAPI } from "@/services/Auth.js";
import { createSession } from "@/services/session.js";
import { reverseGeocode, searchAddress } from "@/services/geocoding.js";

// Dynamic import MapPicker untuk menghindari SSR error dari Leaflet
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-60 w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
      Memuat Peta...
    </div>
  ),
});

// ─── Google Button ───────────────────────────────────────────────────────────
function GoogleRegisterButton({ onSuccess, onError, loading }) {
  const login = useGoogleLogin({
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
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Daftar dengan Google
    </button>
  );
}

// ─── Main Register Page ───────────────────────────────────────────────────────
export default function DaftarPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form state
  const [form, setForm] = useState({
    nama_lengkap: "",
    no_hp: "",
    nik: "",
    golongan_darah: "",
    jenis_kelamin: "",
    alamat_utama: "",
    latitude: null,
    longitude: null,
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isEditingMap, setIsEditingMap] = useState(true);

  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const mapDebounceTimer = useRef(null);
  const searchDebounceTimer = useRef(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
    clearFieldError(name);
  };

  const handleMapChange = (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    if (!isEditingMap) return;

    if (mapDebounceTimer.current) {
      clearTimeout(mapDebounceTimer.current);
    }

    setIsFetchingAddress(true);

    mapDebounceTimer.current = setTimeout(async () => {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        setForm((prev) => ({ ...prev, alamat_utama: address }));
      }
      setIsFetchingAddress(false);
    }, 500);
  };

  const handleAlamatChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, alamat_utama: value }));
    if (errorMsg) setErrorMsg("");
    clearFieldError("alamat_utama");

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    setIsSearching(true);
    setShowSearchResults(true);

    searchDebounceTimer.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      alamat_utama: result.display_name,
    }));

    setSearchResults([]);
    setShowSearchResults(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.nama_lengkap.trim()) {
      errors.nama_lengkap = "Nama lengkap wajib diisi.";
    }

    if (form.nik.length !== 16) {
      errors.nik = "NIK harus terdiri dari 16 digit angka.";
    }

    if (!form.jenis_kelamin) {
      errors.jenis_kelamin = "Jenis kelamin wajib dipilih.";
    }

    if (!form.alamat_utama.trim()) {
      errors.alamat_utama = "Alamat utama wajib diisi.";
    }

    if (!form.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Format email tidak valid.";
    }

    if (form.password.length < 8) {
      errors.password = "Password minimal 8 karakter.";
    }

    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = "Password dan konfirmasi password tidak sama.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await registerUser({
        email: form.email,
        password: form.password,
        nama_lengkap: form.nama_lengkap,
        no_hp: form.no_hp || null,
        nik: form.nik,
        golongan_darah: form.golongan_darah || null,
        jenis_kelamin: form.jenis_kelamin,
        alamat_utama: form.alamat_utama,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      setSuccessMsg("Registrasi berhasil! Mengalihkan ke halaman verifikasi email...");
      setFieldErrors({});

      const registeredEmail = form.email;

      setForm({
        nama_lengkap: "",
        no_hp: "",
        nik: "",
        golongan_darah: "",
        jenis_kelamin: "",
        alamat_utama: "",
        latitude: null,
        longitude: null,
        email: "",
        password: "",
        password_confirmation: "",
      });

      setTimeout(() => {
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(registeredEmail)}`;
      }, 1200);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        const errorCount = Object.keys(err.fieldErrors).length;

        if (errorCount > 1) {
          setErrorMsg(
            `Beberapa Masalah Ditemukan — ada ${errorCount} data yang belum sesuai. Periksa kolom yang ditandai merah di atas.`
          );
        } else {
          setErrorMsg(err.message || "Registrasi gagal. Silakan coba lagi.");
        }
      } else {
        setErrorMsg(err.message || "Registrasi gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await loginWithGoogleAPI(accessToken);
      await createSession(data);

      const profileComplete = data?.data?.is_profile_complete ?? data?.is_profile_complete;
      if (profileComplete === false) {
        window.location.href = "/complete-profile";
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      setErrorMsg(e?.message || "Login Google gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Login Google dibatalkan atau gagal");
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col relative overflow-x-hidden">
      
      {/* 1. HEADER ATAS (Biru) */}
      <section className="w-full h-64 bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] rounded-b-[40px] relative z-10" />

    

      {/* 3. REGISTER CARD (Form) */}
      <div className="-mt-36 flex justify-center px-6 pb-28 relative z-20">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 md:p-10 shadow-2xl border border-white/40">
          <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">
            Registrasi
          </h1>

          {/* Pesan Sukses */}
          {successMsg && (
            <div className="mb-5 rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm font-medium text-green-700">{successMsg}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="reg-nama" className="mb-2 block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                id="reg-nama"
                type="text"
                name="nama_lengkap"
                value={form.nama_lengkap}
                onChange={handleChange}
                placeholder="Nama sesuai KTP"
                required
                className={`w-full rounded border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                  fieldErrors.nama_lengkap
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
              />
              {fieldErrors.nama_lengkap && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.nama_lengkap}</p>
              )}
            </div>

            {/* No. HP */}
            <div>
              <label htmlFor="reg-nohp" className="mb-2 block text-sm font-medium text-gray-700">
                No. HP
              </label>
              <input
                id="reg-nohp"
                type="tel"
                name="no_hp"
                value={form.no_hp}
                onChange={handleChange}
                placeholder="0812xxxxxxxx"
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* NIK */}
            <div>
              <label htmlFor="reg-nik" className="mb-2 block text-sm font-medium text-gray-700">
                NIK
              </label>
              <input
                id="reg-nik"
                type="text"
                name="nik"
                value={form.nik}
                onChange={handleChange}
                placeholder="16 digit Nomor Induk Kependudukan"
                maxLength={16}
                required
                className={`w-full rounded border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                  fieldErrors.nik
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
              />
              <p className="mt-1 text-xs text-gray-400">{form.nik.length}/16 digit</p>
              {fieldErrors.nik && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.nik}</p>
              )}
            </div>

            {/* Golongan Darah */}
            <div>
              <label htmlFor="reg-goldar" className="mb-2 block text-sm font-medium text-gray-700">
                Golongan Darah
              </label>
              <select
                id="reg-goldar"
                name="golongan_darah"
                value={form.golongan_darah}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label htmlFor="reg-jk" className="mb-2 block text-sm font-medium text-gray-700">
                Jenis Kelamin
              </label>
              <select
                id="reg-jk"
                name="jenis_kelamin"
                value={form.jenis_kelamin}
                onChange={handleChange}
                required
                className={`w-full rounded border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                  fieldErrors.jenis_kelamin
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
              {fieldErrors.jenis_kelamin && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.jenis_kelamin}</p>
              )}
            </div>

            {/* Alamat Utama */}
            <div>
              <label htmlFor="reg-alamat" className="mb-2 block text-sm font-medium text-gray-700">
                Alamat Utama
              </label>

              <div className="relative">
                <input
                  id="reg-alamat"
                  type="text"
                  name="alamat_utama"
                  value={form.alamat_utama}
                  onChange={handleAlamatChange}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSearchResults(false), 150);
                  }}
                  placeholder="Cari alamat, jalan, atau kelurahan..."
                  required
                  className={`w-full rounded border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    fieldErrors.alamat_utama
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                />

                {isSearching && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Mencari...
                  </span>
                )}

                {showSearchResults && searchResults.length > 0 && (
                  <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {searchResults.map((result) => (
                      <li key={result.place_id}>
                        <button
                          type="button"
                          onMouseDown={() => handleSelectSearchResult(result)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
                        >
                          {result.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Peta */}
              <div className="mt-3">
                <MapPicker
                  lat={form.latitude || -6.2088}
                  lng={form.longitude || 106.8456}
                  onChange={(newLat, newLng) => handleMapChange(newLat, newLng)}
                />
              </div>

              {isFetchingAddress && (
                <p className="mt-1 text-xs text-indigo-500">Mengambil alamat dari titik peta...</p>
              )}
              {fieldErrors.alamat_utama && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.alamat_utama}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contoh@gmail.com"
                required
                className={`w-full rounded border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                  fieldErrors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  className={`w-full rounded border px-4 py-3 pr-12 text-slate-900 outline-none transition focus:ring-2 ${
                    fieldErrors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                Ulangi Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded border px-4 py-3 pr-12 text-slate-900 outline-none transition focus:ring-2 ${
                    fieldErrors.password_confirmation
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showConfirmPassword ? "Sembunyikan ulangi password" : "Tampilkan ulangi password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password_confirmation && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password_confirmation}</p>
              )}
            </div>

            {/* Daftar Button */}
            <button
              type="submit"
              id="btn-daftar"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-indigo-500 py-3 text-lg font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>

            {/* Pesan Error */}
            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-center">
                <p className="text-sm font-medium text-red-600">{errorMsg}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="mx-3 text-sm text-gray-400">atau</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google Daftar / Masuk */}
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleRegisterButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                loading={loading}
              />
            </GoogleOAuthProvider>

            {/* Login Link */}
            <p className="pt-2 text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}