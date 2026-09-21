"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSemuaBookingAktif } from "@/services/bookingService";

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
  const [activeList, setActiveList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shown, setShown] = useState(false);

  const shouldHide = HIDDEN_ON.some((p) => pathname.startsWith(p));

  const checkLoggedIn = useCallback(() => {
    if (typeof document === "undefined") return false;
    return (
      document.cookie.includes("auth_token=") ||
      document.cookie.includes("smarthomecare-session=") ||
      document.cookie.includes("is_logged_in=true")
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      if (!checkLoggedIn()) {
        if (isMounted) setActiveList([]);
        return;
      }
      try {
        const list = await getSemuaBookingAktif();
        if (isMounted) {
          setActiveList(Array.isArray(list) ? list : []);
        }
      } catch {
        if (isMounted) setActiveList([]);
      }
    };

    runFetch();
    const id = setInterval(runFetch, 20_000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [checkLoggedIn]);

  // Slide-up animation trigger
  useEffect(() => {
    if (activeList.length > 0) {
      const t = setTimeout(() => setShown(true), 60);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShown(false), 0);
      return () => clearTimeout(t);
    }
  }, [activeList.length]);

  if (activeList.length === 0 || shouldHide) return null;

  const safeIndex = currentIndex < activeList.length ? currentIndex : 0;
  const currentItem = activeList[safeIndex] || activeList[0];
  if (!currentItem) return null;

  const { booking, info } = currentItem;
  const status = booking.status_booking || "Pending";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DiPerjalanan;
  const stepIdx = cfg.progress - 1; // 0-based

  const bookingId = booking.id_booking || booking.id;
  const rawLayanan = booking.layanan_items || booking.layanan;

  // Nama layanan (mendukung array, single object, maupun fallback booking_code)
  const serviceName = Array.isArray(rawLayanan) && rawLayanan.length > 0
    ? rawLayanan.map((l) => l.nama_layanan || l.nama).filter(Boolean).join(", ")
    : rawLayanan?.nama_layanan ||
      rawLayanan?.nama ||
      booking.booking_code ||
      (bookingId ? (String(bookingId).startsWith("B-") ? bookingId : `B-${bookingId}`) : "Booking Aktif");

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
        onClick={() => router.push(`/booking/aktif?id=${bookingId}`)}
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
          {/* Multi-booking switcher bar (muncul jika ada lebih dari 1 booking aktif) */}
          {activeList.length > 1 && (
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {activeList.length} Booking Aktif
                </span>
                <div className="flex items-center gap-1">
                  {activeList.map((_, i) => (
                    <span
                      key={i}
                      className={`transition-all duration-300 rounded-full ${
                        i === currentIndex ? "w-3 h-1.5 bg-emerald-500" : "w-1.5 h-1.5 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeList.length - 1));
                  }}
                  className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
                  aria-label="Booking Sebelumnya"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-2.5 h-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                  {currentIndex + 1}/{activeList.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev < activeList.length - 1 ? prev + 1 : 0));
                  }}
                  className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
                  aria-label="Booking Selanjutnya"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-2.5 h-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Row atas: icon + nama layanan + status pill + chevron */}
          <div className="flex items-center gap-2.5">
            {/* Animated dot */}
            <span className="relative flex-shrink-0 w-3 h-3">
              <span className={`absolute inset-0 rounded-full ${cfg.ring} animate-ping`} />
              <span className={`relative block w-3 h-3 rounded-full ${cfg.dot}`} />
            </span>

            <p className="flex-1 text-sm font-semibold text-slate-800 truncate leading-tight">
              {serviceName}
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
          ) : booking.tanggal_kunjungan ? (
            <p className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-emerald-500 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Jadwal:&nbsp;<span className="font-medium text-slate-700">{booking.tanggal_kunjungan} {booking.jam_kunjungan ? `· ${booking.jam_kunjungan}` : ''}</span>
            </p>
          ) : (
            <p className="mt-2.5 text-[11px] text-slate-400">Ketuk untuk melihat detail</p>
          )}
        </div>
      </button>
    </div>
  );
}
