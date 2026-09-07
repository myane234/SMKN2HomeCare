"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getBookingAktif } from "@/services/bookingService";

const ACTIVE_STATUSES = ["Pending", "DiPerjalanan", "Tindakan", "Dikonfirmasi"];

const STATUS_CONFIG = {
  Pending: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  Dikonfirmasi: {
    dot: "bg-sky-400",
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  DiPerjalanan: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  Tindakan: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200",
  },
};

const HIDDEN_PATHS = [
  "/booking/aktif",
  "/pembayaran",
  "/nakes/dashboard",
  "/login",
  "/daftar",
];

export default function ActiveBookingBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [bookingData, setBookingData] = useState(null);
  const [visible, setVisible] = useState(false);

  const shouldHide = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  const fetchAktif = useCallback(async () => {
    if (typeof document === "undefined") return;
    const isLoggedIn =
      document.cookie.includes("auth_token=") ||
      document.cookie.includes("smarthomecare-session=") ||
      document.cookie.includes("is_logged_in=true");

    if (!isLoggedIn) {
      setBookingData(null);
      return;
    }

    try {
      const res = await getBookingAktif();
      const booking = res?.data?.booking ?? null;
      if (booking && ACTIVE_STATUSES.includes(booking.status_booking)) {
        setBookingData({
          booking,
          tracking: res?.data?.tenaga_medis_tracking ?? null,
          info: res?.data?.tracking_info ?? null,
        });
      } else {
        setBookingData(null);
      }
    } catch {
      setBookingData(null);
    }
  }, []);

  useEffect(() => {
    fetchAktif();
    const interval = setInterval(fetchAktif, 30_000);
    return () => clearInterval(interval);
  }, [fetchAktif]);

  useEffect(() => {
    if (bookingData) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [bookingData]);

  if (!bookingData || shouldHide) return null;

  const { booking, info } = bookingData;
  const status = booking.status_booking;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DiPerjalanan;

  return (
    <div
      className={`fixed bottom-[4.5rem] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md transition-all duration-300 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <button
        type="button"
        onClick={() => router.push(`/booking/aktif?id=${booking.id_booking}`)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-slate-300 active:scale-[0.98] transition-all duration-200 ease-out text-left"
      >
        <span className="relative flex-shrink-0 h-2.5 w-2.5">
          <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />
          <span className={`relative block h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {booking.layanan?.nama_layanan ?? "Booking Aktif"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${cfg.badge}`}>
              {booking.status_label ?? status}
            </span>
            {info?.estimasi_menit_sampai ? (
              <span className="text-[10px] text-slate-400 truncate">
                · ~{info.estimasi_menit_sampai} menit
              </span>
            ) : null}
          </div>
        </div>

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
