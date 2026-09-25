"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Home, User, Stethoscope, ClipboardList } from "lucide-react";
import BookingDetailSheet from "@/components/nakes/BookingDetailSheet";
import { getNakesBookings } from "@/services/nakesService";

export default function NakesLayout({ children }) {
  const pathname = usePathname();
  const [activeBooking, setActiveBooking] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helper unwrap data API
  const unwrapData = (value) => {
    let current = value;
    for (let i = 0; i < 8; i += 1) {
      if (
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        Object.prototype.hasOwnProperty.call(current, "data")
      ) {
        current = current.data;
      } else break;
    }
    return current;
  };

  const extractList = (value) => {
    const data = unwrapData(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    if (Array.isArray(data?.orders)) return data.orders;
    return [];
  };

  const getBookingId = (booking) =>
    booking?.id_booking ?? booking?.booking_id ?? booking?.id ?? null;

  const getBookingStatus = (booking) =>
    String(booking?.status_booking ?? booking?.status ?? "").trim().toLowerCase();

  const isActiveVisit = (booking) =>
    [
      "tindakan",
      "sedang tindakan",
      "sedang_dalam_tindakan",
      "sedang_tindakan",
      "in_progress",
      "processing",
      "diproses",
      "berjalan",
    ].includes(getBookingStatus(booking));

  // Fungsi sinkronisasi kunjungan aktif secara global
  const fetchActiveBooking = useCallback(async () => {
    try {
      const response = await getNakesBookings();
      const list = extractList(response);
      const active = list.find(isActiveVisit);

      if (!mountedRef.current) return;

      if (active) {
        setActiveBooking((prev) => {
          if (prev && String(getBookingId(prev)) === String(getBookingId(active))) {
            return { ...active, ...prev };
          }
          return active;
        });
        setIsSheetOpen(true);
      } else {
        setActiveBooking(null);
        setIsSheetOpen(false);
      }
    } catch (error) {
      console.error("Gagal memeriksa kunjungan aktif di Layout:", error);
    }
  }, []);

  useEffect(() => {
    fetchActiveBooking();

    // Sync saat tab/halaman di-focus
    const handleFocus = () => fetchActiveBooking();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchActiveBooking]);

  const isCompleteDataPage =
    pathname === "/nakes/complete-data" ||
    pathname.startsWith("/nakes/complete-data");

  if (isCompleteDataPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const navItems = [
    { label: "Beranda", href: "/nakes/dashboard", icon: Home },
    { label: "Riwayat Kunjungan", href: "/nakes/riwayat-kunjungan", icon: ClipboardList },
  ];

  const isActiveRoute = (href) => {
    if (href === "/nakes/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isProfileActive =
    pathname === "/nakes/profile" || pathname.startsWith("/nakes/profile/");

  // Formatting Helper untuk Sheet Global
  const getBookingCode = (b) =>
    b?.booking_code || b?.kode_booking || (getBookingId(b) ? `#${getBookingId(b)}` : "-");

  const getPatientName = (b) =>
    b?.pasien?.nama_lengkap || b?.pasien?.nama || b?.nama_pasien || b?.user?.name || "Pasien";

  const getVisitDate = (b) => {
    const rawDate = b?.tanggal_kunjungan_raw || b?.tanggal_kunjungan || b?.tanggal_booking;
    const jam = b?.jam_kunjungan || "";
    if (!rawDate) return "-";
    let formattedDate = String(rawDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
      const [year, month, day] = String(rawDate).split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    return jam ? `${formattedDate}, ${String(jam).slice(0, 5)}` : formattedDate;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* DESKTOP TOP NAVBAR */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-slate-200 shadow-[0_1px_10px_rgba(15,23,42,0.04)]">
        <div className="h-[72px] px-6 lg:px-8">
          <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-6">
            <Link href="/nakes/dashboard" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold leading-tight text-slate-900">
                  HomeCare Nakes
                </h1>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                  Portal Tenaga Medis
                </p>
              </div>
            </Link>

            <nav className="flex items-center justify-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/nakes/profile"
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isProfileActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isProfileActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <span>Profil</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 min-w-0">
        <main className="w-full min-w-0 pb-24 md:pb-8">{children}</main>
      </div>

      {/* PERSISTENT GLOBAL BOOKING SHEET (Muncul di semua halaman) */}
      {isSheetOpen && activeBooking && (
        <BookingDetailSheet
          booking={activeBooking}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          bookingDetailLoading={false}
          getBookingCode={getBookingCode}
          getBookingPatientName={getPatientName}
          getBookingVisitDate={getVisitDate}
          onRefresh={async () => {
            setIsSheetOpen(false);
            setActiveBooking(null);
            await fetchActiveBooking();
          }}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION (z-[100]) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
        <div className="h-[72px] px-4 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative min-w-[90px] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold transition-all ${
                  active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}

          <Link
            href="/nakes/profile"
            className={`relative min-w-[90px] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold transition-all ${
              isProfileActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProfileActive ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <span>Profil</span>
            {isProfileActive && (
              <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-blue-600" />
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
}