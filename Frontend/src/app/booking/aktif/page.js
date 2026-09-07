"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getBookingAktif } from "@/services/bookingService";
import { resolveImageUrl } from "@/services/resolveImage";

function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_CONFIG = {
  Pending: {
    dot: "bg-amber-400",
    bar: "bg-amber-50 border-amber-200 text-amber-700",
    label: "Menunggu Konfirmasi",
  },
  Dikonfirmasi: {
    dot: "bg-sky-400",
    bar: "bg-sky-50 border-sky-200 text-sky-700",
    label: "Pesanan Dikonfirmasi",
  },
  DiPerjalanan: {
    dot: "bg-blue-500",
    bar: "bg-blue-50 border-blue-200 text-blue-700",
    label: "Tenaga Medis Dalam Perjalanan",
  },
  Tindakan: {
    dot: "bg-green-500",
    bar: "bg-green-50 border-green-200 text-green-700",
    label: "Sedang Tindakan",
  },
};

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function BookingAktifContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getBookingAktif();
      if (!res?.data?.booking) {
        setError("Tidak ada booking aktif saat ini.");
        setData(null);
        return;
      }
      setData(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) {
        router.push("/login");
        return;
      }
      setError("Gagal memuat data booking. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Memuat informasi booking...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">{error ?? "Tidak ada booking aktif."}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Ke Beranda
        </button>
      </div>
    );
  }

  const { booking, tenaga_medis_tracking: nakes, tracking_info: info } = data;
  const status = booking.status_booking;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DiPerjalanan;

  const nakesPhoto = resolveImageUrl(nakes?.foto_profile ?? booking.tenaga_medis?.foto_profile ?? null);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">Status Booking</h1>
          <p className="text-xs text-slate-400">{booking.booking_code}</p>
        </div>
        {lastUpdated && (
          <span className="ml-auto text-[10px] text-slate-400">
            Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-xl px-4 py-5 space-y-4">

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bar}`}>
          <span className="relative flex-shrink-0 h-3 w-3">
            <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />
            <span className={`relative block h-3 w-3 rounded-full ${cfg.dot}`} />
          </span>
          <div>
            <p className="text-sm font-semibold">{booking.status_label ?? cfg.label}</p>
            {info?.estimasi_menit_sampai && (
              <p className="text-xs opacity-70 mt-0.5">Estimasi tiba: ~{info.estimasi_menit_sampai} menit · {info.jarak_km} km</p>
            )}
          </div>
        </div>

        {/* Tenaga Medis */}
        {(nakes ?? booking.tenaga_medis) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Tenaga Medis</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {nakesPhoto ? (
                  <img src={nakesPhoto} alt={nakes?.nama_lengkap ?? "Nakes"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {nakes?.nama_lengkap ?? booking.tenaga_medis?.nama_lengkap}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {nakes?.jenis_tenaga_medis ?? booking.tenaga_medis?.jenis_tenaga_medis}
                </p>
              </div>
              {(nakes?.no_telp ?? booking.tenaga_medis?.no_telp) && (
                <a
                  href={`tel:${nakes?.no_telp ?? booking.tenaga_medis?.no_telp}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Hubungi
                </a>
              )}
            </div>
          </div>
        )}

        {/* Lokasi */}
        {info && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lokasi</p>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-0.5">Posisi Nakes</p>
                <p className="text-xs text-slate-500 leading-relaxed">{info.lokasi_nakes?.alamat ?? "Memuat lokasi..."}</p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100" />

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-0.5">Tujuan Kunjungan</p>
                <p className="text-xs text-slate-500 leading-relaxed">{info.lokasi_kunjungan?.alamat ?? booking.alamat_kunjungan}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detail Booking */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Detail Booking</p>
          <InfoRow label="Layanan" value={booking.layanan?.nama_layanan ?? "-"} />
          <InfoRow label="Tanggal" value={booking.tanggal_kunjungan ?? "-"} />
          <InfoRow label="Jam" value={booking.jam_kunjungan ?? "-"} />
          <InfoRow label="Pasien" value={booking.pasien?.nama_lengkap ?? "-"} />
          <InfoRow label="Rekam Medis" value={booking.medical_record_number ?? "-"} />
          {booking.transaksi?.jumlah_total_format && (
            <InfoRow label="Total Bayar" value={booking.transaksi.jumlah_total_format} />
          )}
          {booking.transaksi?.status_transaksi && (
            <InfoRow label="Status Bayar" value={booking.transaksi.status_transaksi} />
          )}
        </div>

      </div>
    </div>
  );
}

export default function BookingAktifPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-9 w-9 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    }>
      <BookingAktifContent />
    </Suspense>
  );
}
