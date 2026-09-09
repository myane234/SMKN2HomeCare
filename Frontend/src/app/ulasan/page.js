"use client";

import { useEffect, useState } from "react";
import { getUlasan, createUlasan, getUserInfoForUlasan } from "@/services/ulasanService";
import { getLayanan } from "@/services/layananService";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import {
  FiStar,
  FiUser,
  FiSend,
  FiMessageSquare,
  FiLock,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiChevronDown,
  FiLogIn,
  FiAlertCircle
} from "react-icons/fi";

export default function UlasanPage() {
  const [ulasanList, setUlasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth & User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Master Data Layanan
  const [layananOptions, setLayananOptions] = useState([]);

  // Header Section Portal
  const [headerInfo, setHeaderInfo] = useState({
    ulasan_heading: "Pengalaman & Testimoni Pasien",
    ulasan_subheading: "Ulasan jujur dari keluarga dan pasien yang telah menggunakan layanan perawatan medis SmartHomeCare."
  });

  // Filter & Pagination Display
  const [starFilter, setStarFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(5);

  // Form State
  const [form, setForm] = useState({
    email: "",
    nama_pengulas: "",
    profesi_peran: "Keluarga Pasien",
    rating: 5,
    layanan_id: "",
    komentar: ""
  });

  // 1. Inisialisasi Data & Cek Login Status
  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        // Cek login & auto-load user info dari endpoint /api/resource/content/ulasan/user-info
        try {
          const uInfo = await getUserInfoForUlasan();
          if (uInfo && (uInfo.email || uInfo.nama_pengulas)) {
            setIsLoggedIn(true);
            setUserInfo(uInfo);
            setForm((prev) => ({
              ...prev,
              email: uInfo.email || "",
              nama_pengulas: uInfo.nama_pengulas || ""
            }));
          } else {
            setIsLoggedIn(false);
            setUserInfo(null);
          }
        } catch {
          setIsLoggedIn(false);
        }

        // Ambil Master Data Layanan
        try {
          const layanans = await getLayanan();
          setLayananOptions(Array.isArray(layanans) ? layanans : []);
        } catch (lErr) {
          console.warn("Gagal memuat master data layanan:", lErr);
        }

        // Ambil Header Section Ulasan
        try {
          const resRaw = await fetch("/api/resource/content/ulasan");
          const json = await resRaw.json();
          if (json?.ulasan_heading) {
            setHeaderInfo({
              ulasan_heading: json.ulasan_heading,
              ulasan_subheading: json.ulasan_subheading || ""
            });
          }
        } catch {}

        // Ambil Daftar Ulasan Publik
        await loadUlasanList();
      } catch (err) {
        console.error("Gagal menginisialisasi ulasan:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Memuat daftar ulasan dari database / API
  const loadUlasanList = async (filter = starFilter) => {
    try {
      const params = filter !== "all" ? { rating: filter, per_page: 50 } : { per_page: 50 };
      const data = await getUlasan(params);
      setUlasanList(data);
    } catch (err) {
      console.error("Gagal memuat ulasan:", err);
    }
  };

  // Ubah Filter Bintang
  const handleFilterChange = async (ratingVal) => {
    setStarFilter(ratingVal);
    setVisibleCount(5); // Reset limit tampilan saat ganti filter
    setLoading(true);
    await loadUlasanList(ratingVal);
    setLoading(false);
  };

  // Format Tanggal & Waktu (Date & Time)
  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const datePart = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);

      const timePart = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);

      return `${datePart} • ${timePart} WIB`;
    } catch {
      return isoString;
    }
  };

  // Handle Submit Form Ulasan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // Jika belum login, buka modal login tanpa menghapus isian form
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (!form.komentar.trim()) {
      setErrorMsg("Mohon tuliskan komentar ulasan Anda.");
      return;
    }

    try {
      setSubmitting(true);
      await createUlasan({
        rating: form.rating,
        komentar: form.komentar,
        nama_pengulas: form.nama_pengulas,
        profesi_peran: form.profesi_peran,
        layanan_id: form.layanan_id || null
      });

      setSuccessMsg("Terima kasih! Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami.");
      setForm((prev) => ({
        ...prev,
        komentar: "",
        rating: 5,
        layanan_id: ""
      }));

      // Segarkan daftar ulasan
      await loadUlasanList(starFilter);
    } catch (err) {
      if (err?.status === 401 || err?.response?.status === 401) {
        setIsLoggedIn(false);
        setShowLoginModal(true);
      } else {
        setErrorMsg(err.response?.data?.message || err.message || "Gagal mengirim ulasan. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Tombol Lihat Selengkapnya
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  const displayedUlasan = ulasanList.slice(0, visibleCount);
  const hasMore = ulasanList.length > visibleCount;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      {/* Modal Wajib Login */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Anda perlu masuk ke akun terlebih dahulu untuk mengirimkan ulasan layanan Home Care."
      />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-700 uppercase">
            <FiStar className="text-sky-600" /> ULASAN PASIEN
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {headerInfo.ulasan_heading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {headerInfo.ulasan_subheading}
          </p>
        </div>

        {/* Form Tambah Ulasan */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600">
                <FiMessageSquare />
              </span>
              Tulis Ulasan Anda
            </h2>

            {isLoggedIn ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold">
                <FiCheckCircle className="text-emerald-500" /> Masuk sebagai: {userInfo?.nama_pengulas || userInfo?.email}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                <FiLock className="text-amber-500" /> Belum Login? Klik untuk Masuk
              </button>
            )}
          </div>

          {/* Alert Jika Belum Login */}
          {!isLoggedIn && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-800">
              <FiAlertCircle className="text-amber-600 text-base shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Ulasan hanya bisa dikirim oleh pengguna yang telah masuk.</p>
                <p className="text-amber-700/90 text-[11px] mt-0.5">
                  Anda tetap dapat mengetik ulasan terlebih dahulu di bawah.
                </p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 text-xs bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 font-medium">
              <FiCheckCircle className="text-emerald-600 shrink-0 text-base" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 text-xs bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 font-medium">
              <FiAlertCircle className="text-rose-600 shrink-0 text-base" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email (Disable & Auto-load dari Akun Login) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Email Akun</span>
                  <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                    <FiLock className="text-[10px]" />Terkunci
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={isLoggedIn ? form.email : "Masuk ke akun untuk memuat email"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-xs text-slate-500 font-medium cursor-not-allowed outline-none select-none"
                />
              </div>

              {/* Nama Lengkap (Auto-load dari Profile) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={form.nama_pengulas}
                  onChange={(e) => setForm({ ...form, nama_pengulas: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jenis Layanan (Load dari Master Data Layanan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Layanan Terkait
                </label>
                <div className="relative">
                  <select
                    value={form.layanan_id}
                    onChange={(e) => setForm({ ...form, layanan_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none transition appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Jenis Layanan (Opsional) --</option>
                    {layananOptions.map((item) => (
                      <option key={item.id_layanan || item.id} value={item.id_layanan || item.id}>
                        {item.nama_layanan || item.nama}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                </div>
              </div>

              {/* Profesi / Peran Pengulas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran / Status Pengulas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Keluarga Pasien / Pasien Lansia"
                  value={form.profesi_peran}
                  onChange={(e) => setForm({ ...form, profesi_peran: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rating Bintang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rating Kepuasan *
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-1 cursor-pointer transition transform hover:scale-115 active:scale-95"
                    title={`${star} Bintang`}
                  >
                    <FiStar
                      size={22}
                      className={star <= form.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
                <span className="text-xs text-amber-600 font-bold ml-2">
                  {form.rating} dari 5 Bintang
                </span>
              </div>
            </div>

            {/* Komentar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Komentar & Pengalaman *
              </label>
              <textarea
                rows={3}
                placeholder="Bagikan pengalaman perawatan perawat/nakes SmartHomeCare di rumah Anda..."
                value={form.komentar}
                onChange={(e) => setForm({ ...form, komentar: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                required
              />
            </div>

            {/* Submit / Login Button */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isLoggedIn
                    ? "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                }`}
              >
                {isLoggedIn ? (
                  <>
                    <FiSend /> {submitting ? "Mengirim Ulasan..." : "Kirim Ulasan"}
                  </>
                ) : (
                  <>
                    <FiLogIn /> Masuk untuk Mengirim Ulasan
                  </>
                )}
              </button>

              {!isLoggedIn && (
                <span className="text-[11px] text-slate-400 text-center sm:text-left">
                  tolong konfirmasi login terlebih dahulu sebelum mengirim ulasan.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Daftar Ulasan Pasien */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Daftar Ulasan Pasien
                <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                  {ulasanList.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengalaman nyata dari pasien yang telah menggunakan layanan kami
              </p>
            </div>

            {/* Filter by Bintang */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <FiFilter /> Filter:
              </span>
              {[
                { label: "Semua", val: "all" },
                { label: "5 ★", val: "5" },
                { label: "4 ★", val: "4" },
                { label: "3 ★", val: "3" },
                { label: "2 ★", val: "2" },
                { label: "1 ★", val: "1" }
              ].map((btn) => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() => handleFilterChange(btn.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    starFilter === btn.val
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Card Ulasan */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-white border border-slate-200/80 rounded-2xl animate-pulse p-4" />
              ))}
            </div>
          ) : displayedUlasan.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-2">
              <FiMessageSquare className="text-3xl text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Belum ada ulasan {starFilter !== "all" ? `dengan rating ${starFilter} bintang` : ""}.
              </p>
              <p className="text-[11px] text-slate-400">Jadilah yang pertama memberikan testimoni untuk layanan kami!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {displayedUlasan.map((item, idx) => (
                <div
                  key={item.id_ulasan || idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-2.5 transition hover:border-sky-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.foto_url ? (
                          <img
                            src={item.foto_url}
                            alt={item.nama_pasien}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                          {item.nama_pasien}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.profesi_peran && (
                            <span className="text-[11px] text-slate-400">
                              {item.profesi_peran}
                            </span>
                          )}
                          {item.layanan && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-medium text-[10px]">
                                {item.layanan}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/50">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          size={12}
                          className={star <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                        />
                      ))}
                      <span className="text-[11px] font-bold text-amber-700 ml-1">
                        {item.rating}.0
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5 italic">
                    "{item.komentar}"
                  </p>

                  {/* Tampilkan Date & Time */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <FiClock className="text-[10px]" /> {formatDateTime(item.created_at)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                      Terverifikasi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tombol Lihat Selengkapnya */}
          {hasMore && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
              >
                <FiChevronDown /> Lihat Selengkapnya ({ulasanList.length - visibleCount} ulasan lagi)
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

