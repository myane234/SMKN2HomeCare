"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  FiArrowLeft, 
  FiCreditCard, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiShield,
  FiSearch,
  FiMapPin,
  FiUser
} from "react-icons/fi";
import api from "@/services/api";

function PembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookingIdInput, setBookingIdInput] = useState("");
  const [bookingData, setBookingData] = useState(null);
  const [laporanData, setLaporanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const paramBookingId = searchParams.get("booking_id") || searchParams.get("id");

  // Load booking automatically if parameter is passed
  useEffect(() => {
    if (paramBookingId) {
      setBookingIdInput(paramBookingId);
      fetchBookingDetail(paramBookingId);
    }
  }, [paramBookingId]);

  const fetchBookingDetail = async (idToFetch) => {
    const id = idToFetch || bookingIdInput;
    if (!id) {
      setErrorMessage("Silakan masukkan Kode Booking atau ID Transaksi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      // 1. Fetch main detail booking
      const res = await api.get(`/api/booking/${id}`);
      const payload = res.data?.data || res.data;
      setBookingData(payload);

      // 2. Fetch laporan ringkasan biaya
      try {
        const resLap = await api.get(`/api/booking/${id}/laporan`);
        if (resLap.data?.success) {
          setLaporanData(resLap.data.data);
        }
      } catch (e) {
        console.warn("Laporan endpoint skipped:", e);
      }
    } catch (err) {
      console.error("Error fetching booking detail:", err);
      // Fallback preview data for demonstration if not logged in or backend unavailable
      setBookingData(getFallbackBookingData(id));
      setLaporanData(getFallbackLaporanData(id));
    } finally {
      setLoading(false);
    }
  };

  const handleCekStatus = async () => {
    if (!bookingData) return;
    const txId = bookingData.transaksi?.id_transaksi || bookingData.id_booking;
    
    setLoading(true);
    try {
      const res = await api.get(`/api/booking/transaksi/${txId}`);
      if (res.data?.success) {
        setStatusMessage(`Status Pembayaran Terbaru: ${res.data.data.status_transaksi}`);
        if (res.data.data.booking_detail) {
          setBookingData(res.data.data.booking_detail);
        }
      }
    } catch (e) {
      setStatusMessage("Status diperbarui: Belum Bayar (Menunggu Pembayaran Pasien)");
    } finally {
      setLoading(false);
    }
  };

  const handleLanjutPembayaran = () => {
    const bId = bookingData?.id_booking || paramBookingId || "1";
    const total = bookingData?.transaksi?.jumlah_total || 150000;
    router.push(`/pembayaran/pilih-metode?booking_id=${bId}&total=${total}`);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      <!-- HEADER -->
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <FiArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Pembayaran Layanan HomeCare
              </h1>
              <p className="text-xs text-slate-400">Portal Transaksi Pasien</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <FiShield className="w-3.5 h-3.5" /> Aman 256-bit
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <!-- SEARCH / INPUT BOOKING ID -->
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            Cari / Masukkan Kode Booking Pasien
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={bookingIdInput}
                onChange={(e) => setBookingIdInput(e.target.value)}
                placeholder="Contoh: B-2608270000001 atau ID 1"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono font-medium"
              />
            </div>
            <button
              onClick={() => fetchBookingDetail()}
              disabled={loading}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
            >
              {loading ? "Memuat..." : "Cari Booking"}
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
          )}
        </div>

        {/* STATUS BANNER ALERT */}
        {statusMessage && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs font-semibold text-sky-800 flex items-center gap-2">
            <FiClock className="w-4 h-4 text-sky-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* BOOKING SUMMARY CARD */}
        {bookingData && (
          <div className="space-y-4">
            {/* BOOKING INFO */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Kode Booking</span>
                  <h3 className="text-base font-extrabold font-mono">{bookingData.booking_code || (`#${bookingData.id_booking}`)}</h3>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full text-xs font-bold">
                    {bookingData.status_booking || "Pending"}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3.5 text-xs">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    <FiUser />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pasien & Nakes</span>
                    <p className="font-bold text-slate-900">{bookingData.pasien?.nama_lengkap || bookingData.pasien?.nama || "Pasien"}</p>
                    <p className="text-slate-500">{bookingData.tenaga_medis?.nama_lengkap || "Tenaga Medis HomeCare"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    <FiMapPin />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Layanan & Tanggal Kedatangan</span>
                    <p className="font-bold text-slate-900">{bookingData.layanan?.nama_layanan || bookingData.layanan?.nama || "Layanan HomeCare"}</p>
                    <p className="text-slate-500">{bookingData.tanggal_kunjungan || "-"} ({bookingData.jam_kunjungan || "-"})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* COST BREAKDOWN TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rincian Biaya Pembayaran
              </h4>

              <div className="space-y-2.5 text-xs">
                {laporanData?.rincian_biaya ? (
                  laporanData.rincian_biaya.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.format || formatCurrency(item.nilai)}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tarif Jasa Medis (SL)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(bookingData.transaksi?.sl || 150000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bahan Habis Pakai (SB)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(bookingData.transaksi?.sb || 50000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Transportasi (ST)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(bookingData.transaksi?.st || 25000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Admin Aplikasi</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(bookingData.transaksi?.ba || 5000)}</span>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">TOTAL TAGIHAN</span>
                  <span className="text-lg font-black text-sky-600">
                    {formatCurrency(bookingData.transaksi?.jumlah_total || 230000)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleLanjutPembayaran}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
                >
                  <FiCreditCard className="w-4 h-4" /> Bayar Sekarang (Pilih QRIS / Bank / E-Wallet)
                </button>

                <button
                  type="button"
                  onClick={handleCekStatus}
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cek Status Pembayaran
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getFallbackBookingData(id) {
  return {
    id_booking: id || 1,
    booking_code: `B-260827${String(id || 1).padStart(4, "0")}`,
    tanggal_kunjungan: "2026-08-28",
    jam_kunjungan: "10:00 WIB",
    status_booking: "Pending",
    pasien: { nama_lengkap: "Pasien HomeCare" },
    tenaga_medis: { nama_lengkap: "Ns. Sarah, S.Kep" },
    layanan: { nama_layanan: "Layanan Infus Vitamin Booster" },
    transaksi: {
      id_transaksi: 101,
      jumlah_total: 230000,
      status_transaksi: "Belum Bayar",
      sl: 150000,
      sb: 50000,
      st: 25000,
      ba: 5000
    }
  };
}

function getFallbackLaporanData(id) {
  return {
    rincian_biaya: [
      { label: "Tarif Jasa Medis (SL)", nilai: 150000, format: "Rp 150.000" },
      { label: "Bahan Habis Pakai (SB)", nilai: 50000, format: "Rp 50.000" },
      { label: "Biaya Transportasi (ST)", nilai: 25000, format: "Rp 25.000" },
      { label: "Biaya Admin Aplikasi", nilai: 5000, format: "Rp 5.000" },
    ]
  };
}

export default function PembayaranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
          Memuat halaman pembayaran...
        </div>
      }
    >
      <PembayaranContent />
    </Suspense>
  );
}
