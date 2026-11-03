"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Home,
  User,
  Stethoscope,
  ClipboardList,
  Wallet,
} from "lucide-react";

import BookingDetailSheet from "@/components/nakes/BookingDetailSheet";
import NotificationBell from "@/components/NotificationBell";
import { getNakesBookings } from "@/services/nakesService";
import {
  fetchAndStoreProfile,
  getProfileFromCookies,
} from "@/services/profileService";
import { getAuthToken, getCookie } from "@/services/cookieHelper";

const checkNakesAccess = (profile) => {
  if (profile) {
    const roles = Array.isArray(profile.roles) ? profile.roles : [];
    const hasNakesRole = roles.some((r) => String(r).toLowerCase() === "nakes");
    const hasTenagaMedisObj = Boolean(
      profile.tenaga_medis &&
        typeof profile.tenaga_medis === "object" &&
        (profile.tenaga_medis.id_tenaga_medis ||
          profile.tenaga_medis.id ||
          Object.keys(profile.tenaga_medis).length > 0)
    );
    if (hasNakesRole || hasTenagaMedisObj) return true;
  }
  try {
    const userRolesCookie = getCookie("user_roles") || getCookie("profile_roles");
    if (userRolesCookie) {
      const parsedRoles = JSON.parse(userRolesCookie);
      if (
        Array.isArray(parsedRoles) &&
        parsedRoles.some((r) => String(r).toLowerCase() === "nakes")
      ) {
        return true;
      }
    }
    const tmCookie = getCookie("tenaga_medis");
    if (tmCookie && tmCookie !== "null" && tmCookie !== "undefined" && tmCookie !== "") {
      return true;
    }
  } catch (e) {
    // ignore errors
  }
  return false;
};

/* =========================================================
 * LAYOUT NAKES
 * =======================================================*/

export default function NakesLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeBooking, setActiveBooking] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const mountedRef = useRef(true);

  /* =========================================================
   * MOUNT STATUS
   * =======================================================*/

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
   * VERIFIKASI AUTENTIKASI DAN ROLE NAKES
   * =======================================================*/

  useEffect(() => {
    let isSubscribed = true;
    const verifyNakesAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isSubscribed) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        return;
      }
      let profile = getProfileFromCookies();
      if (!profile) {
        profile = await fetchAndStoreProfile();
      }
      const allowed = checkNakesAccess(profile);
      if (!isSubscribed) return;
      if (!allowed) {
        if (pathname.includes("/profile")) {
          router.replace("/profile");
        } else if (pathname.includes("/riwayat")) {
          router.replace("/transaksi");
        } else {
          router.replace("/profile");
        }
        return;
      }
      setIsAuthorized(true);
      setIsCheckingAuth(false);
    };
    verifyNakesAuth();
    return () => {
      isSubscribed = false;
    };
  }, [pathname, router]);

  /* =========================================================
   * HELPER RESPONSE BOOKING
   * =======================================================*/

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
      } else {
        break;
      }
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
    String(booking?.status_booking ?? booking?.status ?? "")
      .trim()
      .toLowerCase();

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

  /* =========================================================
   * SINKRONISASI KUNJUNGAN AKTIF
   * =======================================================*/

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
    if (!isAuthorized) return;
    fetchActiveBooking();
    const handleFocus = () => fetchActiveBooking();
    const handleKunjunganDimulai = () => fetchActiveBooking();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("nakes:kunjungan-dimulai", handleKunjunganDimulai);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("nakes:kunjungan-dimulai", handleKunjunganDimulai);
    };
  }, [isAuthorized, fetchActiveBooking]);

  const isCompleteDataPage =
    pathname === "/nakes/complete-data" ||
    pathname.startsWith("/nakes/complete-data");
  if (isCompleteDataPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  /* =========================================================
   * LOADING AUTENTIKASI
   * =======================================================*/

  if (isCheckingAuth || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
   * NAVIGASI DESKTOP DAN MOBILE
   * =======================================================*/

  const navItems = [
    { label: "Beranda", href: "/nakes/dashboard", icon: Home },
    { label: "Riwayat Kunjungan", href: "/nakes/riwayat-kunjungan", icon: ClipboardList },
    { label: "Penghasilan", href: "/nakes/penghasilan", icon: Wallet },
  ];

  const isActiveRoute = (href) => {
    if (href === "/nakes/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isProfileActive =
    pathname === "/nakes/profile" || pathname.startsWith("/nakes/profile/");

  /* =========================================================
   * HELPER BOOKING DETAIL SHEET
   * =======================================================*/

  const getBookingCode = (booking) =>
    booking?.booking_code ||
    booking?.kode_booking ||
    (getBookingId(booking) ? `#${getBookingId(booking)}` : "-");

  const getPatientName = (booking) =>
    booking?.pasien?.nama_lengkap ||
    booking?.pasien?.nama ||
    booking?.nama_pasien ||
    booking?.user?.name ||
    "Pasien";

  const getVisitDate = (booking) => {
    const rawDate =
      booking?.tanggal_kunjungan_raw ||
      booking?.tanggal_kunjungan ||
      booking?.tanggal_booking;
    const jam = booking?.jam_kunjungan || "";
    if (!rawDate) return "-";
    let formattedDate = String(rawDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
      const [year, month, day] = String(rawDate)
        .split("-")
        .map(Number);
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

  /* =========================================================
   * RENDER
   * =======================================================*/

  return (
    <>
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_10px_rgba(15,23,42,0.04)] backdrop-blur-md">
          <div className="h-14 px-3 sm:px-4 md:h-[72px] md:px-6 lg:px-8">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 md:gap-3 lg:gap-6">
              {/* LOGO DAN NAMA APLIKASI */}
              <Link href="/nakes/dashboard" className="flex shrink-0 items-center gap-2 md:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 md:h-10 md:w-10">
                  <Stethoscope className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold leading-tight text-slate-900">HomeCare Nakes</h1>
                  <p className="mt-0.5 text-[9px] font-medium text-slate-400 md:text-[10px]">Portal Tenaga Medis</p>
                </div>
              </Link>

              {/* NAVIGASI DESKTOP */}
              <nav className="hidden items-center justify-center gap-1 md:flex lg:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold transition-all lg:gap-2 lg:px-5 lg:text-sm ${
                        active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {active && (
                        <span className="absolute -bottom-[17px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* NOTIFIKASI DAN PROFIL */}
              <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                <NotificationBell scopeRole="nakes" notificationHref="/nakes/notifikasi" />
                <Link
                  href="/nakes/profile"
                  aria-label="Profil"
                  className={`hidden md:flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    isProfileActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isProfileActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-0.5">Profil</p>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* KONTEN HALAMAN */}
        <div className="min-w-0 flex-1">
          <main className="w-full min-w-0 pb-24 md:pb-8">{children}</main>
        </div>
      </div>

      {/* GLOBAL BOOKING DETAIL SHEET */}
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

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        aria-label="Navigasi mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      >
        <div className="h-[72px] px-4 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative min-w-[90px] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold transition-all ${
                  active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}

          {/* MENU PROFIL */}
          <Link
            href="/nakes/profile"
            aria-label="Profil"
            className={`relative min-w-[90px] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold transition-all ${
              isProfileActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProfileActive ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-400"
              }`}
            >
              <User className="h-4 w-4" />
            </div>
            <span>Profil</span>
            {isProfileActive && (
              <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-blue-600" />
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}
