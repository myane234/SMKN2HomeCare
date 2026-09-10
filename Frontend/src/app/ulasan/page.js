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
  FiChevronLeft,
  FiChevronRight,
  FiLogIn,
  FiAlertCircle,
  FiLoader
} from "react-icons/fi";

export default function UlasanPage() {
  const [ulasanList, setUlasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth & User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Master Data Layanan
  const [layananOptions, setLayananOptions] = useState([]);

  // Header Section Portal dari Database
  const [headerInfo, setHeaderInfo] = useState({
    ulasan_heading: "Apa Kata Mereka tentang Kami",
    ulasan_subheading: "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami."
  });

  // Filter & Pagination State dari API
  const [starFilter, setStarFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 6,
    total: 0,
    next_page_url: null
  });

  // Form State
  const [form, setForm] = useState({
    email: "",
    nama_pengulas: "",
    profesi_peran: "Keluarga Pasien",
    rating: 5,
    layanan_id: "",
    komentar: ""
  });

  // Memuat ulasan dari API database dengan pagination dan filter
  const fetchUlasanData = async (page = 1, rating = starFilter, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        page,
        per_page: 6
      };
      if (rating && rating !== "all") {
        params.rating = rating;
      }

      const res = await getUlasan(params);

      if (res?.ulasan_heading) {
        setHeaderInfo({
          ulasan_heading: res.ulasan_heading,
          ulasan_subheading: res.ulasan_subheading || ""
        });
      }

      const newItems = res.items || [];
      if (append) {
        setUlasanList((prev) => [...prev, ...newItems]);
      } else {
        setUlasanList(newItems);
      }

      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Gagal memuat ulasan dari database:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 1. Inisialisasi Data & Cek Login Status
  useEffect(() => {
    async function initData() {
      // Cek login & auto-load user info untuk prefill form ulasan
      try {
        const uInfo = await getUserInfoForUlasan();
        if (uInfo && (uInfo.email || uInfo.nama_pengulas)) {
          setIsLoggedIn(true);
          setUserInfo(uInfo);
          setForm((prev) => ({
            ...prev,
            email: uInfo.email || "",
            nama_pengulas: uInfo.nama_pengulas || "",
            profesi_peran: uInfo.profesi_peran || prev.profesi_peran
          }));
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch {
        setIsLoggedIn(false);
      }

      // Ambil Master Data Layanan untuk dropdown ulasan
      try {
        const layanans = await getLayanan();
        setLayananOptions(Array.isArray(layanans) ? layanans : []);
      } catch (lErr) {
        console.warn("Gagal memuat master data layanan:", lErr);
      }

      // Load ulasan publik dari database API
      await fetchUlasanData(1, "all", false);
    }

    initData();
  }, []);

  // Ubah Filter Bintang
  const handleFilterChange = async (ratingVal) => {
    setStarFilter(ratingVal);
    await fetchUlasanData(1, ratingVal, false);
  };

  // Navigasi Paginasi Nomor Halaman
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page || loading) return;
    await fetchUlasanData(newPage, starFilter, false);
    const el = document.getElementById("daftar-ulasan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Tombol "Lihat Selengkapnya" tanpa Refresh Page (Pagination API)
  const handleLoadMore = async () => {
    if (pagination.current_page >= pagination.last_page || loadingMore) return;
    const nextPage = pagination.current_page + 1;
    await fetchUlasanData(nextPage, starFilter, true);
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

    if (!form.nama_pengulas.trim()) {
      setErrorMsg("Mohon masukkan nama pengulas.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createUlasan({
        rating: form.rating,
        komentar: form.komentar,
        nama_pengulas: form.nama_pengulas,
        profesi_peran: form.profesi_peran,
        layanan_id: form.layanan_id || null
      });

      setSuccessMsg(
        res?.message || "Terima kasih! Ulasan Anda berhasil dikirim dan ditinjau oleh tim kami."
      );
      setForm((prev) => ({
        ...prev,
        komentar: "",
        rating: 5,
        layanan_id: ""
      }));

      // Segarkan daftar ulasan dari database tanpa refresh page
      await fetchUlasanData(1, starFilter, false);
    } catch (err) {
      if (err?.status === 401 || err?.response?.status === 401) {
        setIsLoggedIn(false);
        setShowLoginModal(true);
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            err.message ||
            "Gagal mengirim ulasan. Silakan coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasMore = pagination.current_page < pagination.last_page;

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 py-5 sm:py-8 px-3 sm:px-5 lg:px-6">
      {/* Modal Wajib Login */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Anda perlu masuk ke akun terlebih dahulu untuk mengirimkan ulasan layanan Home Care."
      />

      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section Modern & Ringkas */}
        <div className="text-center space-y-1.5 max-w-lg mx-auto pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-sky-700 uppercase">
            <FiStar className="text-sky-600 text-xs" /> ULASAN PASIEN
          </span>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            {headerInfo.ulasan_heading}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            {headerInfo.ulasan_subheading}
          </p>
        </div>

        {/* Card Form Tambah Ulasan Modern */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-sky-50 text-sky-600">
                <FiMessageSquare className="text-xs sm:text-sm" />
              </span>
              Tulis Ulasan Anda
            </h2>

            {isLoggedIn ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100">
                <FiCheckCircle className="text-emerald-500 shrink-0" /> 
                <span className="truncate max-w-[180px] sm:max-w-none">
                  {userInfo?.nama_pengulas || userInfo?.email}
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full font-semibold transition cursor-pointer border border-amber-200/60"
              >
                <FiLock className="text-amber-500 shrink-0 text-[10px]" /> Belum Login? Klik untuk Masuk
              </button>
            )}
          </div>

          {/* Alert Belum Login */}
          {!isLoggedIn && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-800">
              <FiAlertCircle className="text-amber-600 text-xs shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold leading-tight">Masuk diperlukan untuk mengirim ulasan.</p>
                <p className="text-amber-700/80 text-[10px] mt-0.5">
                  Anda tetap dapat mengetik ulasan di formulir bawah ini.
                </p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 text-[11px] bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium">
              <FiCheckCircle className="text-emerald-600 shrink-0 text-xs" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-[11px] bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              <FiAlertCircle className="text-rose-600 shrink-0 text-xs" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Email Akun */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Email Akun</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5 lowercase">
                    <FiLock className="text-[9px]" /> terkunci
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={isLoggedIn ? form.email : "Masuk ke akun untuk memuat email"}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-1.5 text-xs text-slate-500 font-medium cursor-not-allowed outline-none select-none"
                />
              </div>

              {/* Nama Pengulas */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Nama pengulas..."
                  value={form.nama_pengulas}
                  onChange={(e) => setForm({ ...form, nama_pengulas: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Layanan */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Layanan Terkait
                </label>
                <div className="relative">
                  <select
                    value={form.layanan_id}
                    onChange={(e) => setForm({ ...form, layanan_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none transition appearance-none cursor-pointer pr-7"
                  >
                    <option value="">-- Pilih Layanan (Opsional) --</option>
                    {layananOptions.map((item) => (
                      <option
                        key={item.id_layanan || item.id}
                        value={item.id_layanan || item.id}
                      >
                        {item.nama_layanan || item.nama}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                </div>
              </div>

              {/* Profesi / Status */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Status / Hubungan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasien Mandiri / Keluarga"
                  value={form.profesi_peran}
                  onChange={(e) => setForm({ ...form, profesi_peran: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rating Bintang Ringkas */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Rating Kepuasan *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-0.5 cursor-pointer transition transform hover:scale-110 active:scale-95"
                    title={`${star} Bintang`}
                  >
                    <FiStar
                      size={18}
                      className={
                        star <= form.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      }
                    />
                  </button>
                ))}
                <span className="text-[11px] text-amber-600 font-bold ml-1.5">
                  {form.rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Komentar */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Komentar & Pengalaman *
              </label>
              <textarea
                rows={2.5}
                placeholder="Bagikan pengalaman perawatan Anda di rumah..."
                value={form.komentar}
                onChange={(e) => setForm({ ...form, komentar: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-0.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isLoggedIn
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isLoggedIn ? (
                  <>
                    <FiSend className="text-xs" /> {submitting ? "Mengirim..." : "Kirim Ulasan"}
                  </>
                ) : (
                  <>
                    <FiLogIn className="text-xs" /> Masuk untuk Mengirim
                  </>
                )}
              </button>

              {!isLoggedIn && (
                <span className="text-[10px] text-slate-400 text-center sm:text-left">
                  Konfirmasi masuk sebelum ulasan dapat diterbitkan.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Daftar Ulasan Pasien */}
        <div id="daftar-ulasan" className="space-y-3 pt-1">
          {/* Header Bar & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Daftar Ulasan Pasien
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.2 rounded-full">
                  {pagination.total > 0 ? pagination.total : ulasanList.length}
                </span>
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[10px] font-semibold text-slate-400 mr-0.5 flex items-center gap-1 shrink-0">
                <FiFilter className="text-[9px]" />
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
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer shrink-0 ${
                    starFilter === btn.val
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Card Ulasan */}
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-20 bg-white border border-slate-200/70 rounded-xl animate-pulse p-3"
                />
              ))}
            </div>
          ) : ulasanList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-1.5">
              <FiMessageSquare className="text-xl text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Belum ada ulasan {starFilter !== "all" ? `dengan rating ${starFilter} bintang` : ""}.
              </p>
              <p className="text-[10px] text-slate-400">
                Jadilah yang pertama memberikan testimoni untuk layanan kami!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {ulasanList.map((item, idx) => (
                <div
                  key={item.id_ulasan || idx}
                  className="bg-white rounded-xl border border-slate-200/70 p-3 sm:p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                >
                  {/* Card Header: Avatar, Info Pengulas, Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-sky-100 to-sky-50 text-sky-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 overflow-hidden border border-sky-100/80">
                        {item.foto_url ? (
                          <img
                            src={item.foto_url}
                            alt={item.nama_pasien}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
                          {item.nama_pasien}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px]">
                          {item.profesi_peran && (
                            <span className="text-slate-400 truncate max-w-[110px] sm:max-w-none">
                              {item.profesi_peran}
                            </span>
                          )}
                          {item.layanan && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[9px] truncate max-w-[130px] sm:max-w-[200px]">
                                {item.layanan}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rating Badge Ringkas */}
                    <div className="flex items-center gap-1 shrink-0 bg-amber-50/90 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                      <FiStar className="text-amber-400 fill-amber-400 text-[11px] shrink-0" />
                      <div className="hidden sm:flex items-center gap-0.5">
                        {[2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={10}
                            className={
                              star <= item.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-amber-800">
                        {item.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Komentar Ulasan dengan aksen border modern */}
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed italic break-words pl-2 border-l-2 border-sky-200/80">
                    "{item.komentar}"
                  </p>

                  {/* Card Footer: Waktu & Terverifikasi */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1 truncate mr-2">
                      <FiClock className="text-[9px] shrink-0" /> {formatDateTime(item.created_at)}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100/80 px-2 py-0.2 rounded-full shrink-0">
                      ✓ Terverifikasi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section Paginasi & Lihat Selengkapnya */}
          <div className="pt-2 space-y-2.5">
            {/* Tombol Lihat Selengkapnya */}
            {hasMore && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {loadingMore ? (
                    <>
                      <FiLoader className="animate-spin text-sky-600 text-xs" /> Memuat...
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="text-xs" /> Lihat Selengkapnya ({pagination.total - ulasanList.length} lagi)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Paginasi Nomor Halaman */}
            {pagination.last_page > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px] sm:text-[11px] text-slate-500">
                <span className="text-slate-400 text-center sm:text-left">
                  Halaman <strong className="text-slate-700">{pagination.current_page}</strong> dari{" "}
                  <strong className="text-slate-700">{pagination.last_page}</strong> (Total {pagination.total} ulasan)
                </span>

                <div className="flex items-center gap-1">
                  {/* Sebelumnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1 || loading}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <FiChevronLeft className="text-[10px]" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {/* Angka Halaman */}
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => {
                    if (
                      p === 1 ||
                      p === pagination.last_page ||
                      (p >= pagination.current_page - 1 && p <= pagination.current_page + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          disabled={loading}
                          className={`min-w-[26px] sm:min-w-[28px] h-[26px] sm:h-[28px] rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                            p === pagination.current_page
                              ? "bg-sky-600 text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (
                      (p === 2 && pagination.current_page > 3) ||
                      (p === pagination.last_page - 1 && pagination.current_page < pagination.last_page - 2)
                    ) {
                      return (
                        <span key={p} className="px-0.5 text-slate-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  {/* Selanjutnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page || loading}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <FiChevronRight className="text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

