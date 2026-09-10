"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getBookingAktif } from "@/services/bookingService";
import { resolveImageUrl } from "@/services/resolveImage";

/* ── helpers ── */
function formatCurrency(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// booking.layanan bisa berupa object tunggal ATAU array (booking dengan >1 layanan).
// Normalisasi selalu jadi array supaya aman dipakai di mana saja.
function normalizeLayananList(layanan) {
  if (!layanan) return [];
  return Array.isArray(layanan) ? layanan : [layanan];
}

/* ── Status config (palette lebih tenang, konsisten dengan brand biru SmartCare) ── */
const STATUS_CFG = {
  Pending:      { accent: "from-orange-500 to-amber-500",   badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400", stepIdx: 0 },
  Dikonfirmasi: { accent: "from-sky-600 to-blue-500",       badge: "bg-sky-100 text-sky-700",       dot: "bg-sky-500",    stepIdx: 1 },
  DiPerjalanan: { accent: "from-blue-600 to-indigo-500",    badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-500",   stepIdx: 2 },
  Tindakan:     { accent: "from-emerald-600 to-teal-500",   badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", stepIdx: 3 },
};

const STEPS = [
  { label: "Menunggu Konfirmasi",          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Pesanan Dikonfirmasi",         icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Nakes Dalam Perjalanan",       icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { label: "Sedang Tindakan",              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

/* ── sub-components ── */
function StepTimeline({ stepIdx }) {
  return (
    <div className="space-y-0">
      {STEPS.map((s, i) => {
        const done   = i < stepIdx;
        const active = i === stepIdx;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={s.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                ${done ? "bg-blue-500" : active ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-100"}
              `}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${done || active ? "text-white" : "text-slate-400"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              {!isLast && (
                <div className={`w-0.5 h-7 sm:h-8 mt-1 transition-colors duration-300 ${done ? "bg-blue-400" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pt-1 sm:pt-1.5 pb-4 sm:pb-5">
              <p className={`text-xs sm:text-sm font-semibold leading-tight ${active ? "text-slate-900" : done ? "text-blue-600" : "text-slate-400"}`}>
                {s.label}
              </p>
              {active && (
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Sedang berlangsung</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
        </div>
      )}
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 gap-3">
      <span className="text-xs sm:text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-slate-800 text-right break-words">{value}</span>
    </div>
  );
}

function LayananItem({ layanan }) {
  const photo = resolveImageUrl(layanan.foto_layanan ?? null);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={layanan.nama_layanan} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-blue-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{layanan.nama_layanan || "-"}</p>
        {layanan.tipe_layanan && (
          <p className="text-[10px] sm:text-[11px] text-slate-400 capitalize">{layanan.tipe_layanan}</p>
        )}
      </div>
      {layanan.s1 != null && (
        <p className="text-xs sm:text-sm font-bold text-slate-700 flex-shrink-0">{formatCurrency(layanan.s1)}</p>
      )}
    </div>
  );
}

/* ── Main content ── */
function BookingAktifContent() {
  const router = useRouter();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastAt, setLastAt]   = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getBookingAktif();
      if (!res?.data?.booking) { setError("Tidak ada booking aktif saat ini."); setData(null); return; }
      setData(res.data);
      setLastAt(new Date());
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) { router.push("/login"); return; }
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat status booking...</p>
      </div>
    </div>
  );

  /* ── error ── */
  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center gap-5">
      <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-9 h-9 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800 mb-1">{error ?? "Tidak ada booking aktif"}</p>
        <p className="text-sm text-slate-500">Kamu belum punya pesanan yang sedang berjalan.</p>
      </div>
      <button onClick={() => router.push("/")}
        className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all">
        Ke Beranda
      </button>
    </div>
  );

  const { booking, tenaga_medis_tracking: nakes, tracking_info: info } = data;
  const status = booking.status_booking;
  const cfg    = STATUS_CFG[status] ?? STATUS_CFG.Pending;
  const nakesData = nakes ?? booking.tenaga_medis ?? {};
  const nakesPhoto = resolveImageUrl(nakesData.foto_profile ?? null);

  const layananList = normalizeLayananList(booking.layanan);
  const layananSummary = layananList.map((l) => l.nama_layanan).filter(Boolean).join(", ") || "-";
  const totalLayanan = layananList.reduce((sum, l) => sum + Number(l.s1 || 0), 0);

  const alamatKunjungan = info?.lokasi_kunjungan?.alamat || booking.alamat_kunjungan || "-";

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"Poppins","Inter","Segoe UI",sans-serif' }}>

      {/* ── HERO HEADER ── */}
      <div className={`bg-gradient-to-br ${cfg.accent} px-4 sm:px-6 pt-10 sm:pt-12 pb-10 sm:pb-12 relative rounded-b-[28px] sm:rounded-b-[32px] overflow-hidden`}>

        {/* dekorasi lingkaran samar, biar header tidak flat */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/5" />

        {/* back button */}
        <button onClick={() => router.back()}
          className="relative z-10 absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition active:scale-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* live refresh indicator */}
        {lastAt && (
          <div className="relative z-10 absolute top-4 right-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
            <span className="text-white/70 text-[10px]">Live</span>
          </div>
        )}

        {/* status */}
        <div className="relative z-10 text-center mt-2">
          <p className="text-white/80 text-[11px] sm:text-xs font-medium mb-1">{booking.booking_code}</p>
          <h1 className="text-white text-lg sm:text-xl font-bold leading-tight px-6">
            {booking.status_label ?? status}
          </h1>
          {info?.estimasi_menit_sampai && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-white text-xs font-semibold">~{info.estimasi_menit_sampai} menit &middot; {info.jarak_km} km</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-4 sm:px-6 -mt-6 sm:-mt-8 pb-24 space-y-3 max-w-lg mx-auto">

        {/* Nakes card */}
        {nakesData.nama_lengkap && (
          <Section>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                {nakesPhoto
                  ? <img src={nakesPhoto} alt={nakesData.nama_lengkap} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{nakesData.nama_lengkap}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">{nakesData.jenis_tenaga_medis}</p>
              </div>
              {nakesData.no_telp && (
                <a href={`tel:${nakesData.no_telp}`}
                  className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-md hover:bg-blue-700 active:scale-90 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4 sm:w-5 sm:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          </Section>
        )}

        {/* Progress timeline */}
        <Section title="Status Pesanan">
          <StepTimeline stepIdx={cfg.stepIdx} />
        </Section>

        {/* Layanan yang dipesan (bisa lebih dari 1) */}
        <Section title={`Layanan Dipesan${layananList.length > 1 ? ` (${layananList.length})` : ""}`}>
          {layananList.length > 0 ? (
            <>
              {layananList.map((l, idx) => (
                <LayananItem key={l.id_layanan ?? idx} layanan={l} />
              ))}
              {layananList.length > 1 && (
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">Subtotal Layanan</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(totalLayanan)}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400">Data layanan tidak tersedia.</p>
          )}
        </Section>

        {/* Lokasi */}
        <Section title="Lokasi">
          {info?.lokasi_nakes?.alamat && (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Posisi Nakes Sekarang</p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{info.lokasi_nakes.alamat}</p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-dashed border-slate-200 h-4 mb-4" />
            </>
          )}

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Tujuan Kunjungan</p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{alamatKunjungan}</p>
            </div>
          </div>
        </Section>

        {/* Detail booking */}
        <Section title="Detail Pesanan">
          <InfoRow label="Layanan"          value={layananSummary} />
          <InfoRow label="Tanggal"          value={booking.tanggal_kunjungan ?? "-"} />
          <InfoRow label="Jam"              value={booking.jam_kunjungan?.slice ? booking.jam_kunjungan.slice(0, 5) : (booking.jam_kunjungan ?? "-")} />
          <InfoRow label="Pasien"           value={booking.pasien?.nama_lengkap ?? "-"} />
          <InfoRow label="No. Rekam Medis"  value={booking.medical_record_number ?? "-"} />
          {booking.transaksi?.jumlah_total_format && (
            <InfoRow label="Total Bayar" value={booking.transaksi.jumlah_total_format} />
          )}
          {booking.transaksi?.metode_pembayaran && (
            <InfoRow label="Metode Pembayaran" value={booking.transaksi.metode_pembayaran} />
          )}
          {booking.transaksi?.status_transaksi && (
            <InfoRow label="Status Bayar" value={booking.transaksi.status_transaksi} />
          )}
        </Section>

      </div>
    </div>
  );
}

export default function BookingAktifPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <BookingAktifContent />
    </Suspense>
  );
}