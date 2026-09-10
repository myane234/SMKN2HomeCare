"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getBookingAktif } from "@/services/bookingService";

const ACTIVE_STATUSES = ["Pending", "Dikonfirmasi", "DiPerjalanan", "Tindakan"];

// Konfigurasi warna per status — palette hijau/slate sesuai website
const STATUS_CFG = {
  Pending: {
    pill: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    ring: "bg-amber-400/30",
    progress: 1,
  },
  Dikonfirmasi: {
    pill: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    ring: "bg-sky-400/30",
    progress: 2,
  },
  DiPerjalanan: {
    pill: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    ring: "bg-green-400/30",
    progress: 3,
  },
  Tindakan: {
    pill: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "bg-emerald-400/30",
    progress: 4,
  },
};

// Step bar label
const STEPS = ["Menunggu", "Dikonfirmasi", "Dalam Perjalanan", "Tindakan"];

// Route yang tidak perlu bubble
const HIDDEN_ON = ["/booking/aktif", "/pembayaran", "/nakes/dashboard", "/login", "/daftar"];

export default function ActiveBookingBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [shown, setShown] = useState(false);

  const shouldHide = HIDDEN_ON.some((p) => pathname.startsWith(p));

  const fetchAktif = useCallback(async () => {
    if (typeof document === "undefined") return;
    const loggedIn =
      document.cookie.includes("auth_token=") ||
      document.cookie.includes("smarthomecare-session=") ||
      document.cookie.includes("is_logged_in=true");
    if (!loggedIn) { setData(null); return; }

    try {
      const res = await getBookingAktif();
      const booking = res?.data?.booking ?? null;
      if (booking && ACTIVE_STATUSES.includes(booking.status_booking)) {
        setData({ booking, info: res?.data?.tracking_info ?? null });
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchAktif();
    const id = setInterval(fetchAktif, 30_000);
    return () => clearInterval(id);
  }, [fetchAktif]);

  // Slide-up animation trigger
  useEffect(() => {
    if (data) { const t = setTimeout(() => setShown(true), 60); return () => clearTimeout(t); }
    setShown(false);
  }, [data]);

  if (!data || shouldHide) return null;

  const { booking, info } = data;
  const status = booking.status_booking;
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DiPerjalanan;
  const stepIdx = cfg.progress - 1; // 0-based

  return (
    <div
      className={`
        fixed bottom-[4.75rem] lg:bottom-5 inset-x-0 z-50 px-3 lg:px-0 flex justify-center
        pointer-events-none
        transition-all duration-350 ease-out
        ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {/* Card — klik seluruh area */}
      <button
        type="button"
        onClick={() => router.push(`/booking/aktif?id=${booking.id_booking}`)}
        className="
          pointer-events-auto w-full max-w-sm
          bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100
          overflow-hidden
          active:scale-[0.98] transition-transform duration-150
          text-left
        "
      >
        {/* Top strip warna status */}
        <div className={`h-1 w-full ${cfg.dot}`} />

        <div className="px-4 pt-3 pb-3.5">
          {/* Row atas: icon + nama layanan + status pill + chevron */}
          <div className="flex items-center gap-2.5">
            {/* Animated dot */}
            <span className="relative flex-shrink-0 w-3 h-3">
              <span className={`absolute inset-0 rounded-full ${cfg.ring} animate-ping`} />
              <span className={`relative block w-3 h-3 rounded-full ${cfg.dot}`} />
            </span>

            <p className="flex-1 text-sm font-semibold text-slate-800 truncate leading-tight">
              {booking.layanan?.nama_layanan ?? "Booking Aktif"}
            </p>

            <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.pill}`}>
              {booking.status_label ?? status}
            </span>

            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              className="w-4 h-4 text-slate-400 shrink-0 -mr-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </div>

          {/* Progress stepper — 4 langkah */}
          <div className="mt-3 flex items-center gap-0">
            {STEPS.map((label, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  {/* Dot step */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-2.5 h-2.5 rounded-full shrink-0 transition-colors
                        ${done ? "bg-green-500" : active ? `${cfg.dot} ring-2 ring-offset-1 ring-green-400` : "bg-slate-200"}
                      `}
                    />
                    <p className={`mt-1 text-[9px] leading-none whitespace-nowrap transition-colors
                      ${active ? "text-slate-700 font-semibold" : done ? "text-green-600" : "text-slate-400"}`}>
                      {label}
                    </p>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`flex-1 h-px mx-1 transition-colors ${done || active ? "bg-green-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Estimasi baris bawah */}
          {info?.estimasi_menit_sampai ? (
            <p className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-green-500 shrink-0">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Estimasi tiba&nbsp;<span className="font-semibold text-slate-700">~{info.estimasi_menit_sampai} menit</span>
              &nbsp;·&nbsp;{info.jarak_km} km
            </p>
          ) : (
            <p className="mt-2.5 text-[11px] text-slate-400">Ketuk untuk melihat detail</p>
          )}
        </div>
      </button>
    </div>
  );
}
