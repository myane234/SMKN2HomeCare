"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  X,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getProfileMe } from "@/services/profileService";
import {
  getNakesOrders,
  getNakesBookings,
  getNakesOrderDetail,
  acceptNakesBooking,
  rejectNakesBooking,
  startTindakanBooking,
  getDataOperasional,
} from "@/services/nakesService";

const unwrapData = (value) => {
  let current = value;
  for (let i = 0; i < 8; i += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      Object.prototype.hasOwnProperty.call(current, "data")
    )
      current = current.data;
    else break;
  }
  return current;
};

const getApprovedOperational = (value) => {
  const data = unwrapData(value);
  if (!data) return null;

  if (Array.isArray(data)) {
    const approvedList = data
      .filter(
        (item) => String(item?.status ?? "").toLowerCase() === "approved"
      )
      .sort((a, b) => {
        const dateA = new Date(
          a?.updated_at || a?.created_at || 0
        ).getTime();
        const dateB = new Date(
          b?.updated_at || b?.created_at || 0
        ).getTime();
        return dateB - dateA;
      });

    return approvedList[0] || null;
  }

  if (data?.data_aktif && typeof data.data_aktif === "object")
    return data.data_aktif;
  if (data?.operasional_aktif && typeof data.operasional_aktif === "object")
    return data.operasional_aktif;
  if (data?.operasional && typeof data.operasional === "object") {
    if (
      String(data.operasional?.status ?? "").toLowerCase() === "approved"
    ) {
      return data.operasional;
    }
  }
  if (String(data?.status ?? "").toLowerCase() === "approved") return data;

  return null;
};

const getLatestOperationalRecord = (value) => {
  const data = unwrapData(value);
  if (!data) return null;

  if (Array.isArray(data)) {
    const sorted = [...data].sort((a, b) => {
      const dateA = new Date(a?.updated_at || a?.created_at || 0).getTime();
      const dateB = new Date(b?.updated_at || b?.created_at || 0).getTime();
      return dateB - dateA;
    });
    return sorted[0] || null;
  }

  if (data?.data_aktif && typeof data.data_aktif === "object")
    return data.data_aktif;
  if (data?.operasional_aktif && typeof data.operasional_aktif === "object")
    return data.operasional_aktif;
  if (data?.operasional && typeof data.operasional === "object")
    return data.operasional;

  return data;
};

const checkIsWithinSchedule = (record) => {
  if (!record) return false;
  const opWaktu = record?.waktu_layanan;
  if (!opWaktu) return false;

  let parsedWaktu = opWaktu;
  if (typeof parsedWaktu === "string") {
    try {
      parsedWaktu = JSON.parse(parsedWaktu);
    } catch {
      parsedWaktu = null;
    }
  }

  if (!Array.isArray(parsedWaktu) || parsedWaktu.length === 0) return false;

  const daysMap = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return parsedWaktu.some((slot) => {
    const hMulaiStr = String(
      slot?.hari_mulai || slot?.hari || ""
    ).toLowerCase();
    const hSelesaiStr = String(
      slot?.hari_selesai || slot?.hari || ""
    ).toLowerCase();

    let startDay = daysMap[hMulaiStr];
    let endDay = daysMap[hSelesaiStr];

    if (startDay === undefined) return false;
    if (endDay === undefined) endDay = startDay;

    let isDayMatched = false;
    if (startDay <= endDay) {
      isDayMatched = currentDay >= startDay && currentDay <= endDay;
    } else {
      isDayMatched = currentDay >= startDay || currentDay <= endDay;
    }

    if (!isDayMatched) return false;

    const jMulai = slot?.jam_mulai;
    const jSelesai = slot?.jam_selesai;

    if (!jMulai || !jSelesai) return true;

    const [mHour, mMin] = jMulai.split(":").map(Number);
    const [sHour, sMin] = jSelesai.split(":").map(Number);

    const startTotal = mHour * 60 + (mMin || 0);
    const endTotal = sHour * 60 + (sMin || 0);

    return currentMinutes >= startTotal && currentMinutes <= endTotal;
  });
};

const extractList = (value) => {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.bookings)) return data.bookings;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
};

const extractBookingDetail = (res) => {
  const data = res?.data || res;
  return data?.booking || data;
};

const getBookingId = (booking) =>
  booking?.id_booking ?? booking?.booking_id ?? booking?.id ?? null;
const getBookingStatus = (booking) =>
  String(booking?.status_booking ?? booking?.status ?? "")
    .trim()
    .toLowerCase();
const isPending = (booking) => getBookingStatus(booking) === "pending";
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
const isFinished = (booking) =>
  ["selesai", "completed", "finished"].includes(getBookingStatus(booking));
const isRejected = (booking) =>
  ["ditolak", "rejected", "dibatalkan", "cancelled"].includes(
    getBookingStatus(booking)
  );
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
const getPatientPhone = (booking) =>
  booking?.pasien?.no_telp ||
  booking?.pasien?.no_hp ||
  booking?.pasien?.phone ||
  booking?.user?.phone ||
  booking?.user?.no_telp ||
  "-";
const getPatientAddress = (booking) =>
  booking?.alamat_kunjungan ||
  booking?.pasien?.alamat_utama ||
  booking?.alamat_tujuan ||
  booking?.pasien?.alamat ||
  "-";

const getServiceName = (booking) => {
  if (
    Array.isArray(booking?.layanan_items) &&
    booking.layanan_items.length > 0
  ) {
    return booking.layanan_items
      .map(
        (item) =>
          item?.nama_layanan || item?.layanan?.nama_layanan || item?.nama
      )
      .filter(Boolean)
      .join(", ");
  }
  return booking?.layanan?.nama_layanan || booking?.nama_layanan || "-";
};

const getVisitDate = (booking) => {
  const rawDate =
    booking?.tanggal_kunjungan_raw ||
    booking?.tanggal_kunjungan ||
    booking?.tanggal_booking;
  const jam = booking?.jam_kunjungan || "";
  if (!rawDate) return "-";
  let formattedDate = String(rawDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
    const [year, month, day] = String(rawDate).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime()))
      formattedDate = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  }
  return jam
    ? `${formattedDate}, ${String(jam).slice(0, 5)}`
    : formattedDate;
};

const dedupeBookings = (list) => {
  const map = new Map();
  list.forEach((booking) => {
    const id = getBookingId(booking);
    if (!id) return;
    const key = String(id);
    if (!map.has(key)) map.set(key, booking);
  });
  return Array.from(map.values());
};

// SWR Fetchers
const fetcherProfile = async () => unwrapData(await getProfileMe());
const fetcherOperational = async () => unwrapData(await getDataOperasional());
const fetcherBookingsData = async () => {
  const [ordersRes, bookingsRes] = await Promise.allSettled([
    getNakesOrders(),
    getNakesBookings(),
  ]);

  const orders =
    ordersRes.status === "fulfilled" ? extractList(ordersRes.value) : [];
  const bookings =
    bookingsRes.status === "fulfilled" ? extractList(bookingsRes.value) : [];

  const incomingBookings = dedupeBookings([...orders, ...bookings]).filter(
    isPending
  );
  const activeVisits = bookings.filter(isActiveVisit);
  const myBookings = bookings.filter(
    (booking) =>
      !isPending(booking) &&
      !isRejected(booking) &&
      !isFinished(booking) &&
      !isActiveVisit(booking)
  );

  return {
    incomingBookings,
    myBookings,
    activeVisitBooking: activeVisits[0] || null,
  };
};

export default function DashboardPage() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailLoading, setBookingDetailLoading] = useState(false);
  const [bookingActionId, setBookingActionId] = useState(null);
  const [startingTindakanId, setStartingTindakanId] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch SWR
  const {
    data: profileData,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useSWR("nakes_profile", fetcherProfile, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const {
    data: operationalData,
    isLoading: isOpLoading,
    mutate: mutateOp,
  } = useSWR("nakes_operational", fetcherOperational, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    mutate: mutateBookings,
  } = useSWR("nakes_bookings", fetcherBookingsData, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    refreshInterval: 15000, // Refresh background setiap 15 detik secara efisien
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const refreshAll = useCallback(() => {
    mutateProfile();
    mutateOp();
    mutateBookings();
  }, [mutateProfile, mutateOp, mutateBookings]);

  // Operational Record Evaluation
  const targetOperationalRecord = useMemo(() => {
    const approved =
      getApprovedOperational(operationalData) ||
      getApprovedOperational(profileData);
    const latest =
      getLatestOperationalRecord(operationalData) ||
      getLatestOperationalRecord(profileData);
    return approved || latest;
  }, [operationalData, profileData]);

  const isOperationalApproved = useMemo(() => {
    const approvedFromOp = getApprovedOperational(operationalData);
    const approvedFromProf = getApprovedOperational(profileData);
    const approved = approvedFromOp || approvedFromProf;

    const tm =
      profileData?.tenaga_medis ||
      profileData?.nakes ||
      profileData ||
      {};
    const statusOpStr = String(
      approved?.status ||
        targetOperationalRecord?.status ||
        tm?.status_operasional ||
        profileData?.status_operasional ||
        ""
    ).toLowerCase();

    return (
      Boolean(approved) ||
      statusOpStr === "approved" ||
      Boolean(profileData?.is_operasional_approved)
    );
  }, [operationalData, profileData, targetOperationalRecord]);

  // Read-only online status calculation
  const isWithinSchedule = useMemo(() => {
    if (!isOperationalApproved || !targetOperationalRecord) return false;
    return checkIsWithinSchedule(targetOperationalRecord);
  }, [isOperationalApproved, targetOperationalRecord]);

  const isOnline = isOperationalApproved && isWithinSchedule;

  /* FORMATTED SCHEDULE DISPLAY */
  const formattedScheduleDisplay = useMemo(() => {
    if (!targetOperationalRecord) return "-";

    const opWaktu = targetOperationalRecord?.waktu_layanan;
    if (!opWaktu) return "-";

    let parsedWaktu = opWaktu;
    if (typeof parsedWaktu === "string") {
      try {
        parsedWaktu = JSON.parse(parsedWaktu);
      } catch {
        parsedWaktu = null;
      }
    }

    if (Array.isArray(parsedWaktu) && parsedWaktu.length > 0) {
      const first = parsedWaktu[0];
      const last = parsedWaktu[parsedWaktu.length - 1];

      let hMulai = first?.hari_mulai || first?.hari || "";
      let hSelesai = first?.hari_selesai || last?.hari || "";
      const jMulai = first?.jam_mulai || "";
      const jSelesai = first?.jam_selesai || last?.jam_selesai || "";

      if (typeof hMulai === "string" && hMulai.includes(" - ") && !hSelesai) {
        const parts = hMulai.split(" - ");
        hMulai = parts[0];
        hSelesai = parts[1];
      }

      if (!hMulai || !jMulai) return "-";

      const displayHari =
        !hSelesai || hMulai === hSelesai ? hMulai : `${hMulai} - ${hSelesai}`;
      const displayJam = jSelesai ? `${jMulai} - ${jSelesai}` : jMulai;

      return `${displayHari}, ${displayJam} WIB`;
    }
    return "-";
  }, [targetOperationalRecord]);

  const incomingBookings = bookingsData?.incomingBookings || [];
  const myBookings = bookingsData?.myBookings || [];
  const activeVisitBooking = bookingsData?.activeVisitBooking || null;

  const handleBookingAction = async (booking, action) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      showToast("error", "ID booking tidak valid.");
      return;
    }

    if (
      action === "accept" &&
      (!isOnline || !isOperationalApproved || !isWithinSchedule)
    ) {
      showToast(
        "error",
        !isOperationalApproved
          ? "Operasional Anda belum aktif/disetujui. Lengkapi pengajuan operasional di menu Profile."
          : "Saat ini di luar jam operasional Anda. Anda tidak dapat menerima booking."
      );
      return;
    }

    if (bookingActionId) return;

    setBookingActionId(bookingId);

    try {
      if (action === "accept") {
        await acceptNakesBooking(bookingId);
        showToast("success", "Booking berhasil diterima.");
      } else {
        await rejectNakesBooking(bookingId);
        showToast("success", "Booking berhasil ditolak.");
      }

      setSelectedBooking(null);
      await mutateBookings();
    } catch (error) {
      console.error("Gagal memperbarui booking:", error);
      showToast(
        "error",
        error?.response?.data?.message || "Gagal memperbarui booking."
      );
    } finally {
      setBookingActionId(null);
    }
  };

  const handleOpenBookingDetail = async (booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) return;

    setSelectedBooking(booking);
    setBookingDetailLoading(true);

    try {
      const response = await getNakesOrderDetail(bookingId);
      const detail = extractBookingDetail(response);
      if (detail && typeof detail === "object") setSelectedBooking(detail);
    } catch (error) {
      console.error("Gagal mengambil detail booking:", error);
      showToast("error", "Gagal mengambil detail booking.");
    } finally {
      setBookingDetailLoading(false);
    }
  };

  const handleStartTindakan = async (booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      showToast("error", "ID booking tidak valid.");
      return;
    }

    if (
      activeVisitBooking &&
      String(getBookingId(activeVisitBooking)) !== String(bookingId)
    ) {
      showToast(
        "error",
        "Masih ada kunjungan pasien lain yang sedang berlangsung. Selesaikan terlebih dahulu."
      );
      return;
    }

    if (startingTindakanId) return;
    setStartingTindakanId(bookingId);

    try {
      await startTindakanBooking(bookingId);
      showToast("success", "Kunjungan berhasil dimulai.");
      await mutateBookings();
    } catch (error) {
      console.error("Gagal memulai kunjungan:", error);
      showToast(
        "error",
        error?.response?.data?.message || "Gagal memulai kunjungan."
      );
    } finally {
      setStartingTindakanId(null);
    }
  };

  const initialLoading = isProfileLoading || isOpLoading || (isBookingsLoading && !bookingsData);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasActiveVisit = Boolean(
    activeVisitBooking && isActiveVisit(activeVisitBooking)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[300] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-white flex items-start gap-3 ${
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <p className="text-xs font-medium leading-relaxed">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasActiveVisit
                          ? "bg-amber-300 animate-pulse"
                          : !isOperationalApproved
                          ? "bg-rose-400"
                          : !isWithinSchedule
                          ? "bg-amber-300"
                          : "bg-emerald-400 animate-pulse"
                      }`}
                    />
                    {hasActiveVisit
                      ? "Sedang Melayani Pasien"
                      : !isOperationalApproved
                      ? "Operasional Belum Aktif"
                      : !isWithinSchedule
                      ? "Di Luar Jam Operasional"
                      : "Online - Siap Menerima Pesanan"}
                  </div>

                  {/* READ-ONLY BADGE STATUS ONLINE / OFFLINE */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                      isOnline
                        ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                        : "bg-rose-500/20 text-rose-200 border-rose-400/40"
                    }`}
                  >
                    <span>{isOnline ? "Status: Online" : "Status: Offline"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={refreshAll}
                    title="Refresh Data"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold mt-4">
                  {!isOperationalApproved
                    ? "Operasional Belum Aktif"
                    : !isWithinSchedule
                    ? "Di Luar Jam Operasional"
                    : "Menunggu Pesanan"}
                </h2>

                <p className="mt-2 max-w-md text-sm text-blue-100 leading-relaxed">
                  {!isOperationalApproved
                    ? "Pengajuan operasional Anda masih pending atau belum diajukan. Silakan atur di menu Profil Operasional."
                    : !isWithinSchedule
                    ? "Saat ini di luar jadwal operasional yang Anda ajukan. Sistem secara otomatis menonaktifkan status penerimaan booking."
                    : "Status Anda Online sesuai jadwal operasional. Pesanan yang masuk dapat Anda konfirmasi secara langsung."}
                </p>

                <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-100">
                  <span className="font-bold text-white">
                    Jadwal Operasional:
                  </span>
                  {isOperationalApproved && formattedScheduleDisplay !== "-" ? (
                    <span className="bg-white/15 px-2.5 py-1 rounded-lg text-white font-semibold">
                      {formattedScheduleDisplay}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </div>

                {!isOperationalApproved && (
                  <Link
                    href="/nakes/profile"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold shadow-md transition"
                  >
                    <span>Pengaturan Profil Operasional</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <img
                src="/images/dashboard/nurse-hero.png"
                alt="Nurse"
                className="w-36 sm:w-48 object-contain"
              />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PANEL BOOKING MASUK */}
            <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden relative">
              {(!isOperationalApproved || !isOnline) && (
                <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] p-6 flex flex-col items-center justify-center text-center text-white">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/90 text-white flex items-center justify-center mb-3 shadow-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-base sm:text-lg">
                    {!isOperationalApproved
                      ? "Operasional Belum Aktif"
                      : "Di Luar Jam Operasional"}
                  </h4>
                  <p className="text-xs text-slate-100 max-w-xs mt-1 leading-relaxed">
                    {!isOperationalApproved
                      ? "Daftar booking masuk terkunci sampai pengajuan operasional Anda disetujui oleh Admin."
                      : "Penerimaan booking terkunci secara otomatis karena saat ini berada di luar jadwal operasional yang Anda tentukan."}
                  </p>
                  {!isOperationalApproved && (
                    <Link
                      href="/nakes/profile"
                      className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                    >
                      Buka Profile Operasional
                    </Link>
                  )}
                </div>
              )}

              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Booking Masuk</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pesanan yang menunggu keputusan Anda
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                  {incomingBookings.length}
                </span>
              </div>

              <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                {isBookingsLoading && incomingBookings.length === 0 ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : incomingBookings.length > 0 ? (
                  incomingBookings.map((booking) => {
                    const id = getBookingId(booking);
                    return (
                      <div
                        key={id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-blue-600">
                              {getBookingCode(booking)}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              {getPatientName(booking)}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 break-words">
                              {getServiceName(booking)}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold shrink-0">
                            Menunggu
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {getVisitDate(booking)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenBookingDetail(booking)}
                          className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Detail
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-10 text-center text-xs text-slate-400">
                    Tidak ada booking masuk saat ini.
                  </p>
                )}
              </div>
            </section>

            {/* PANEL BOOKING SAYA */}
            <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Booking Saya</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Booking yang sudah diterima
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                {isBookingsLoading && myBookings.length === 0 ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : myBookings.length > 0 ? (
                  myBookings.map((booking) => {
                    const id = getBookingId(booking);
                    const anotherVisitActive =
                      hasActiveVisit &&
                      String(getBookingId(activeVisitBooking)) !== String(id);
                    const isStarting = startingTindakanId === id;
                    const disabled =
                      anotherVisitActive || Boolean(startingTindakanId);

                    return (
                      <div
                        key={id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-blue-600">
                              {getBookingCode(booking)}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              {getPatientName(booking)}
                            </h4>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Diterima
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 break-words">
                          {getServiceName(booking)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {getVisitDate(booking)}
                        </p>

                        {anotherVisitActive && (
                          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                            <p className="text-[11px] text-amber-800 font-medium">
                              Selesaikan kunjungan pasien yang sedang
                              berlangsung terlebih dahulu.
                            </p>
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetail(booking)}
                            className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            disabled={disabled || isStarting}
                            onClick={() => handleStartTindakan(booking)}
                            className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              disabled || isStarting
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {isStarting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            {isStarting
                              ? "Memulai..."
                              : anotherVisitActive
                              ? "Sedang Kunjungan"
                              : "Mulai Kunjungan"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-10 text-center text-xs text-slate-400">
                    Belum ada booking diterima.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      {/* MODAL DETAIL BOOKING MASUK */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Detail Pesanan
                </h3>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">
                  {getBookingCode?.(selectedBooking) ||
                    selectedBooking?.code ||
                    "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {bookingDetailLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Informasi Pasien
                    </p>
                    <div>
                      <p className="text-[10px] text-slate-400">Nama</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {getPatientName?.(selectedBooking) ||
                          selectedBooking?.patient_name ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Nomor Telepon
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {getPatientPhone?.(selectedBooking) ||
                          selectedBooking?.patient_phone ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Alamat</p>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed break-words">
                        {getPatientAddress?.(selectedBooking) ||
                          selectedBooking?.patient_address ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Detail Layanan
                    </p>
                    <div>
                      <p className="text-[10px] text-slate-400">Layanan</p>
                      <p className="text-sm font-semibold text-slate-900 break-words">
                        {getServiceName?.(selectedBooking) ||
                          selectedBooking?.service_name ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Jadwal</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {getVisitDate?.(selectedBooking) ||
                          selectedBooking?.visit_date ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Status</p>
                      <span className="inline-flex px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                        {selectedBooking?.status_label ||
                          selectedBooking?.status_booking ||
                          selectedBooking?.status ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  {isPending?.(selectedBooking) && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={
                          bookingActionId ===
                          (getBookingId?.(selectedBooking) ||
                            selectedBooking?.id)
                        }
                        onClick={() =>
                          handleBookingAction(selectedBooking, "reject")
                        }
                        className="py-3 rounded-xl border border-rose-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 disabled:opacity-50 transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        disabled={
                          bookingActionId ===
                          (getBookingId?.(selectedBooking) ||
                            selectedBooking?.id)
                        }
                        onClick={() =>
                          handleBookingAction(selectedBooking, "accept")
                        }
                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {bookingActionId ===
                          (getBookingId?.(selectedBooking) ||
                            selectedBooking?.id) && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Terima
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}