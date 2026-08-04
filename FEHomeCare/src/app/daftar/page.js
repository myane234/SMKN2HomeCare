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

  // ── State & ref untuk peta + pencarian alamat ──────────────────────────────
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  // Default true: halaman ini tidak auto-set lokasi dari geolocation saat mount,
  // jadi setiap kali pin digeser memang murni aksi user dan boleh langsung
  // memicu reverse geocode.
  const [isEditingMap, setIsEditingMap] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const mapDebounceTimer = useRef(null);
  const searchDebounceTimer = useRef(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  // ── Saat pin di peta digeser ────────────────────────────────────────────────
  const handleMapChange = (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    if (!isEditingMap) return;

    // Hentikan timer sebelumnya (debounce)
    if (mapDebounceTimer.current) {
      clearTimeout(mapDebounceTimer.current);
    }

    setIsFetchingAddress(true);

    // Ambil alamat otomatis setelah user selesai menggeser pin (delay 500ms)
    mapDebounceTimer.current = setTimeout(async () => {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        // Update textbox alamat otomatis
        setForm((prev) => ({ ...prev, alamat_utama: address }));
      }
      setIsFetchingAddress(false);
    }, 500);
  };

  // ── Saat user mengetik di input pencarian ──────────────────────────────────
  const handleSearchAddressChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

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

    // Debounce pencarian (delay 500ms)
    searchDebounceTimer.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // ── Saat user memilih salah satu hasil dari dropdown pencarian ─────────────
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Set koordinat peta baru dan isi textbox alamat utama
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      alamat_utama: result.display_name,
    }));

    // Bersihkan state pencarian
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // ── Submit register manual ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (form.password !== form.password_confirmation) {
      setErrorMsg("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (form.nik.length !== 16) {
      setErrorMsg("NIK harus terdiri dari 16 digit.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: form.email,
        password: form.password,
        nama_lengkap: form.nama_lengkap,
        no_hp: form.no_hp || null, // 👈 no_hp dikirim ke backend
        nik: form.nik,
        golongan_darah: form.golongan_darah || null,
        jenis_kelamin: form.jenis_kelamin,
        alamat_utama: form.alamat_utama,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      setSuccessMsg("Registrasi berhasil! Silakan periksa inbox/spam email Anda untuk memverifikasi akun sebelum login.");

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
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || "Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Register/Login dengan Google ───────────────────────────────────────────
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
    <main className="min-h-screen bg-gray-100">
      {/* Blue Background */}
      <section className="h-64 bg-indigo-500" />

      {/* Register Card */}
      <div className="-mt-32 flex justify-center px-6 pb-16">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">
            Registrasi
          </h1>

          {/* Pesan Error */}
          {errorMsg && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-600">{errorMsg}</p>
            </div>
          )}

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
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
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
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-1 text-xs text-gray-400">{form.nik.length}/16 digit</p>
            </div>

            {/* Golongan Darah - Disesuaikan Enum DB ('A', 'B', 'AB', 'O') */}
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
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* Alamat Utama — bisa diketik langsung, dicari via autocomplete, atau dipilih lewat peta */}
            <div>
              <label htmlFor="reg-alamat" className="mb-2 block text-sm font-medium text-gray-700">
                Alamat Utama
              </label>

              {/* Search box dengan autocomplete (Nominatim) */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchAddressChange}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  onBlur={() => {
                    // Delay dikit supaya klik pada hasil pencarian sempat kedaftar dulu
                    setTimeout(() => setShowSearchResults(false), 150);
                  }}
                  placeholder="Cari alamat, jalan, atau kelurahan..."
                  className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                {isSearching && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Mencari...
                  </span>
                )}

                {showSearchResults && searchResults.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
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

                {showSearchResults && !isSearching && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 shadow-lg">
                    Alamat tidak ditemukan
                  </div>
                )}
              </div>

              {/* Peta — geser pin untuk memilih titik lokasi secara visual */}
              <div className="mt-3">
                <MapPicker
                  lat={form.latitude || -6.2088}
                  lng={form.longitude || 106.8456}
                  onChange={(newLat, newLng) => handleMapChange(newLat, newLng)}
                />
              </div>

              {/* Alamat lengkap — terisi otomatis dari pencarian/peta, tetap bisa diedit manual */}
              <textarea
                id="reg-alamat"
                name="alamat_utama"
                value={form.alamat_utama}
                onChange={handleChange}
                rows={3}
                placeholder="Alamat akan terisi otomatis setelah mencari/memilih di peta, atau ketik manual di sini"
                required
                className="mt-3 w-full resize-none rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              {isFetchingAddress && (
                <p className="mt-1 text-xs text-indigo-500">Mengambil alamat dari titik peta...</p>
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
                className="w-full rounded border border-gray-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
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
                  className="w-full rounded border border-gray-300 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
                  className="w-full rounded border border-gray-300 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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