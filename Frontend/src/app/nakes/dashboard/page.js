"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Edit3,
  CheckCircle2,
  Bell,
  X,
  Stethoscope,
  AlertCircle,
  Loader2,
  Hourglass,
  Phone,
  Home,
  ArrowLeft,
  User,
  Calendar,
} from "lucide-react";

import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";
import {
  getDataOperasional,
  updateDataOperasional,
  getKategoriLayanan,
  getProvinsi,
  getNakesOrders,
  getNakesBookings,
  getNakesOrderDetail,
  acceptNakesBooking,
  rejectNakesBooking,
} from "@/services/nakesService";

const LIST_HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export default function DashboardPage() {
  const router = useRouter();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailLoading, setBookingDetailLoading] = useState(false);
  const [bookingActionId, setBookingActionId] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [listWilayah, setListWilayah] = useState([]);
  const [listCategories, setListCategories] = useState([]);

  // =========================================================
  // PROFILE NAKES
  // =========================================================
  const [nakesProfile, setNakesProfile] = useState({
    name: "-",
    phone: "-",
    address: "-",
    photo: null,
    registeredCategories: [],
    registeredCategoryNames: [],
    registeredWilayahId: null,
    registeredWilayahName: "-",
  });

  // =========================================================
  // OPERASIONAL
  // =========================================================
  const [activeOperational, setActiveOperational] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  // =========================================================
  // APPROVAL POPUP
  // =========================================================
  const previousStatusRef = useRef(null);
  const [approvalPopup, setApprovalPopup] = useState(null);

  // =========================================================
  // FORM EDIT
  // =========================================================
  const [formData, setFormData] = useState({
    hari_mulai: "",
    hari_selesai: "",
    jam_mulai: "",
    jam_selesai: "",
    id_wilayah_layanan: "",
    kategori_layanan: [],
  });

  const unwrapData = (value) => {
    let current = value;
    for (let i = 0; i < 6; i += 1) {
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

  const getBookingId = (booking) =>
    booking?.id ??
    booking?.id_booking ??
    booking?.booking_id;

  const getBookingCode = (booking) =>
    booking?.booking_code ||
    booking?.kode_booking ||
    (getBookingId(booking) ? `#${getBookingId(booking)}` : "-");

  const getBookingPatientName = (booking) =>
    booking?.pasien?.nama_lengkap ||
    booking?.pasien?.nama ||
    booking?.user?.name ||
    booking?.nama_pasien ||
    "Pasien";

  const formatBookingDate = (value) => {
    if (!value) return "Jadwal belum tersedia";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveCategoryNames = (rawCategories, masterCategories = listCategories) => {
    if (rawCategories === null || rawCategories === undefined) return [];
    let categories = rawCategories;
    if (typeof categories === "string") {
      categories = categories.split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (!Array.isArray(categories)) categories = [categories];

    return categories
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return item.nama_kategori || item.nama_layanan || item.nama || item.label || "";
        }
        const found = masterCategories.find(
          (category) =>
            String(category?.id ?? category?.id_kategori_layanan ?? category?.id_kategori) === String(item)
        );
        if (found) {
          return found.nama_kategori || found.nama_layanan || found.nama || found.label || "";
        }
        return String(item);
      })
      .filter(Boolean);
  };

  const normalizeWaktuLayanan = (value) => {
    if (!value) return [];
    let waktu = value;
    if (typeof waktu === "string") {
      try {
        waktu = JSON.parse(waktu);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(waktu)) return [];
    return waktu.filter((item) => item && typeof item === "object" && item.hari && item.jam_mulai && item.jam_selesai);
  };

  const getWaktuLayananFromObject = (obj) => {
    if (!obj || typeof obj !== "object") return [];
    const candidates = [
      obj.waktu_layanan,
      obj.operasional?.waktu_layanan,
      obj.data_aktif?.waktu_layanan,
      obj.operasional_aktif?.waktu_layanan,
    ];
    for (const candidate of candidates) {
      const result = normalizeWaktuLayanan(candidate);
      if (result.length > 0) return result;
    }
    return [];
  };

  const getApprovedOperationalData = (rawData) => {
    const source = unwrapData(rawData);
    if (!source) return null;
    if (Array.isArray(source)) {
      const approved = source
        .filter((item) => String(item?.status || "").toLowerCase() === "approved")
        .sort((a, b) => {
          const dateA = new Date(a?.updated_at || a?.created_at || 0).getTime();
          const dateB = new Date(b?.updated_at || b?.created_at || 0).getTime();
          return dateB - dateA;
        });
      return approved[0] || null;
    }
    if (source.data_aktif && typeof source.data_aktif === "object") return source.data_aktif;
    if (source.operasional_aktif && typeof source.operasional_aktif === "object") return source.operasional_aktif;
    if (source.operasional && typeof source.operasional === "object" && String(source.operasional.status || "").toLowerCase() === "approved") {
      return source.operasional;
    }
    if (String(source.status || "").toLowerCase() === "approved") return source;
    return null;
  };

  const buildOperationalDisplay = (operationalData) => {
    if (!operationalData || typeof operationalData !== "object") return null;
    const waktu = getWaktuLayananFromObject(operationalData);
    let hours = "-";
    if (waktu.length > 0) {
      const first = waktu[0];
      const last = waktu[waktu.length - 1];
      const jamMulai = String(first.jam_mulai || "").slice(0, 5);
      const jamSelesai = String(first.jam_selesai || "").slice(0, 5);
      hours =
        first.hari === last.hari
          ? `${first.hari}, ${jamMulai} - ${jamSelesai}`
          : `${first.hari} - ${last.hari}, ${jamMulai} - ${jamSelesai}`;
    }
    return { hours, waktu_layanan: waktu };
  };

  const resolveWilayahName = (wilayahId, wilayahObject = null, masterWilayah = listWilayah) => {
    if (wilayahObject && typeof wilayahObject === "object") {
      const name = wilayahObject.nama_provinsi || wilayahObject.nama_wilayah || wilayahObject.nama;
      if (name) return name;
    }
    const found = masterWilayah.find(
      (item) => String(item?.id_provinsi ?? item?.id_wilayah_layanan ?? item?.id) === String(wilayahId)
    );
    return found?.nama_provinsi || found?.nama_wilayah || found?.nama || "-";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setBookingLoading(true);

      const [wilayahRes, kategoriRes, profileRes, opRes, ordersRes, bookingsRes] = await Promise.all([
        getProvinsi().catch(() => ({})),
        getKategoriLayanan().catch(() => ({})),
        api.get("/api/profile/me").catch(() => null),
        getDataOperasional().catch(() => null),
        getNakesOrders().catch(() => []),
        getNakesBookings().catch(() => []),
      ]);

      const wilayahList = Array.isArray(unwrapData(wilayahRes)) ? unwrapData(wilayahRes) : [];
      const kategoriList = Array.isArray(unwrapData(kategoriRes)) ? unwrapData(kategoriRes) : [];

      setListWilayah(wilayahList);
      setListCategories(kategoriList);

      const ordersData = unwrapData(ordersRes);
      const bookingsData = unwrapData(bookingsRes);
      const allBookings = Array.isArray(bookingsData) ? bookingsData : (Array.isArray(ordersData) ? ordersData : []);
      
      const pendingList = allBookings.filter(b => 
        String(b.status_booking || b.status || "").toLowerCase() === "pending"
      );
      
      const processedList = allBookings.filter(b => {
        const st = String(b.status_booking || b.status || "").toLowerCase();
        return st !== "pending" && st !== "dibatalkan" && st !== "ditolak";
      });

      setIncomingBookings(pendingList);
      setAcceptedBookings(processedList);

      const profileData = unwrapData(profileRes?.data);
      const tm = profileData?.tenaga_medis || profileData?.nakes || null;
      const user = profileData?.user || null;

      let tmCategories = [];
      if (tm) {
        const nama = tm.nama_lengkap || tm.nama || profileData?.nama_lengkap || user?.name || "-";
        const noHp = tm.no_hp || tm.no_telp || tm.phone || "-";
        const alamat = tm.alamat_lengkap || tm.alamat || "-";
        const foto = tm.pas_foto || tm.foto || profileData?.avatar || user?.avatar || null;

        const categoryCandidates = [tm?.kategori_layanan, tm?.jenis_tenaga_medis];
        let rawCategories = [];
        for (const candidate of categoryCandidates) {
          if (Array.isArray(candidate) && candidate.length > 0) {
            rawCategories = candidate;
            break;
          }
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            rawCategories = candidate;
            break;
          }
        }

        tmCategories = rawCategories;
        const categoryNames = resolveCategoryNames(rawCategories, kategoriList);
        const wilayahId = tm.id_wilayah_layanan ?? tm.wilayah_layanan?.id_provinsi ?? null;
        const wilayahName = resolveWilayahName(wilayahId, tm.wilayah_layanan, wilayahList);

        setNakesProfile({
          name: nama,
          phone: noHp,
          address: alamat,
          photo: foto ? resolveImageUrl(foto) : null,
          registeredCategories: Array.isArray(rawCategories) ? rawCategories : [rawCategories],
          registeredCategoryNames: categoryNames,
          registeredWilayahId: wilayahId,
          registeredWilayahName: wilayahName,
        });
      }

      const opData = unwrapData(unwrapData(opRes));
      const activeData = getApprovedOperationalData(opData);
      setActiveOperational(activeData);
      setActiveSchedule(activeData ? buildOperationalDisplay(activeData) : null);

      const currentStatus = !Array.isArray(opData) ? String(opData?.status || "").toLowerCase() : "";
      if (currentStatus === "pending") {
        const proposed = buildOperationalDisplay(opData);
        setPendingRequest({
          ...proposed,
          location: resolveWilayahName(opData?.id_wilayah_layanan, opData?.wilayah_layanan, wilayahList),
          kategoriNames: resolveCategoryNames(opData?.kategori_layanan ?? [], kategoriList),
        });
      } else {
        setPendingRequest(null);
      }

      if (currentStatus === "approved" && previousStatusRef.current === "pending") {
        setApprovalPopup({
          type: "approved",
          title: "Pengajuan Disetujui",
          message: "Perubahan operasional Anda telah disetujui oleh admin.",
        });
      }

      if (currentStatus === "rejected" && previousStatusRef.current === "pending") {
        setApprovalPopup({
          type: "rejected",
          title: "Pengajuan Ditolak",
          message: "Perubahan operasional Anda ditolak oleh admin.",
        });
      }

      if (currentStatus) previousStatusRef.current = currentStatus;

      const wilayahDefault = activeData?.id_wilayah_layanan ?? tm?.id_wilayah_layanan ?? null;
      let categoryIds = [];
      
      const currentRawCategories = 
        (Array.isArray(activeData?.kategori_layanan) && activeData.kategori_layanan.length > 0)
          ? activeData.kategori_layanan
          : (Array.isArray(tmCategories) && tmCategories.length > 0)
          ? tmCategories
          : typeof tmCategories === "string"
          ? tmCategories
          : [];

      if (Array.isArray(currentRawCategories)) {
        categoryIds = currentRawCategories.map((item) => {
          if (typeof item === "object" && item !== null) {
            const val = item.id ?? item.id_kategori_layanan ?? item.id_kategori ?? item.kategori_id;
            if (val !== undefined && val !== null) return Number(val);
            
            const nameVal = item.nama_kategori ?? item.nama_layanan ?? item.nama;
            if (nameVal) {
              const matchedCat = kategoriList.find(
                (c) => String(c.nama_kategori ?? c.nama).toLowerCase() === String(nameVal).toLowerCase()
              );
              return matchedCat ? Number(matchedCat.id_kategori_layanan ?? matchedCat.id) : null;
            }
          }
          
          if (!isNaN(item) && String(item).trim() !== "") {
            return Number(item);
          }

          const matchedCat = kategoriList.find(
            (c) => String(c.nama_kategori ?? c.nama).toLowerCase() === String(item).toLowerCase()
          );
          return matchedCat ? Number(matchedCat.id_kategori_layanan ?? matchedCat.id) : null;
        }).filter((id) => Number.isFinite(id) && id > 0);
      } else if (typeof currentRawCategories === "string") {
        categoryIds = currentRawCategories
          .split(",")
          .map((item) => {
            const cleanItem = item.trim();
            if (!isNaN(cleanItem) && cleanItem !== "") {
              return Number(cleanItem);
            }
            const matchedCat = kategoriList.find(
              (c) => String(c.nama_kategori ?? c.nama).toLowerCase() === String(cleanItem).toLowerCase()
            );
            return matchedCat ? Number(matchedCat.id_kategori_layanan ?? matchedCat.id) : null;
          })
          .filter((id) => Number.isFinite(id) && id > 0);
      }

      const waktu = getWaktuLayananFromObject(activeData);
      const first = waktu[0] || {};
      const last = waktu[waktu.length - 1] || {};

      setFormData({
        hari_mulai: first.hari || "",
        hari_selesai: last.hari || "",
        jam_mulai: first.jam_mulai ? String(first.jam_mulai).slice(0, 5) : "",
        jam_selesai: first.jam_selesai ? String(first.jam_selesai).slice(0, 5) : "",
        id_wilayah_layanan: wilayahDefault !== null && wilayahDefault !== undefined ? Number(wilayahDefault) : "",
        kategori_layanan: categoryIds,
      });

    } catch (error) {
      console.error("Gagal mengambil data dashboard Nakes:", error);
    } finally {
      setLoading(false);
      setBookingLoading(false);
    }
  };

  const handleOpenBookingDetail = async (booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) return;

    setSelectedBooking(booking);
    setBookingDetailLoading(true);

    try {
      const response = await getNakesOrderDetail(bookingId);
      const rawData = unwrapData(response);
      const bookingDetail = rawData?.booking ? rawData.booking : rawData;

      if (bookingDetail && typeof bookingDetail === "object") {
        setSelectedBooking(bookingDetail);
      }
    } catch {
      setToastMessage({ type: "error", text: "Gagal mengambil detail booking." });
    } finally {
      setBookingDetailLoading(false);
    }
  };

  const handleBookingAction = async (booking, action) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      setToastMessage({ type: "error", text: "ID Booking tidak valid." });
      return;
    }

    setBookingActionId(bookingId);
    try {
      if (action === "accept") {
        let payload = {};

        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true,
                maximumAge: 0,
              });
            });
            payload = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
          } catch (geoError) {
            console.warn("Gagal mendeteksi GPS:", geoError.message);
            setToastMessage({
              type: "error",
              text: "Gagal mendeteksi GPS. Harap izinkan akses lokasi pada browser Anda.",
            });
            setBookingActionId(null);
            return;
          }
        }

        await acceptNakesBooking(bookingId, payload);
      } else {
        await rejectNakesBooking(bookingId);
      }

      setToastMessage({
        type: "success",
        text: action === "accept" ? "Booking berhasil diterima." : "Booking berhasil ditolak.",
      });
      setSelectedBooking(null);
      await fetchData();
    } catch (err) {
      console.error("Error action booking:", err);
      setToastMessage({ type: "error", text: "Gagal memperbarui status booking." });
    } finally {
      setBookingActionId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    const id = Number(categoryId);
    setFormData((prev) => {
      const current = prev.kategori_layanan;
      if (current.includes(id)) {
        return { ...prev, kategori_layanan: current.filter((item) => item !== id) };
      }
      return { ...prev, kategori_layanan: [...current, id] };
    });
  };

  const generateHariList = (startDay, endDay) => {
    const startIndex = LIST_HARI.indexOf(startDay);
    const endIndex = LIST_HARI.indexOf(endDay);
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
      return startDay ? [startDay] : [];
    }
    return LIST_HARI.slice(startIndex, endIndex + 1);
  };

  const handleSubmitOperasional = async (e) => {
    e.preventDefault();
    if (!formData.id_wilayah_layanan) {
      setToastMessage({ type: "error", text: "Pilih wilayah layanan terlebih dahulu." });
      return;
    }
    if (formData.kategori_layanan.length === 0) {
      setToastMessage({ type: "error", text: "Pilih minimal satu kategori layanan." });
      return;
    }

    const daftarHari = generateHariList(formData.hari_mulai, formData.hari_selesai);
    setSubmitting(true);

    try {
      const waktuLayanan = daftarHari.map((hari) => ({
        hari,
        jam_mulai: formData.jam_mulai.slice(0, 5),
        jam_selesai: formData.jam_selesai.slice(0, 5),
      }));

      const payload = {
        id_wilayah_layanan: Number(formData.id_wilayah_layanan),
        kategori_layanan: formData.kategori_layanan.map(Number),
        waktu_layanan: waktuLayanan,
      };

      await updateDataOperasional(payload);
      setToastMessage({ type: "success", text: "Pengajuan berhasil dikirim ke Admin." });
      setIsEditModalOpen(false);
      await fetchData();
    } catch {
      setToastMessage({ type: "error", text: "Gagal mengirim pengajuan." });
    } finally {
      setSubmitting(false);
    }
  };

  const activeCategoryCandidates = [
    activeOperational?.kategori_layanan,
    activeOperational?.kategori,
    activeOperational?.layanan,
  ];
  let activeCategoryRaw = [];
  for (const candidate of activeCategoryCandidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      activeCategoryRaw = candidate;
      break;
    }
  }

  const activeCategoryNames = resolveCategoryNames(activeCategoryRaw, listCategories);
  const categoryDisplay =
    activeCategoryNames.length > 0
      ? Array.from(new Set(activeCategoryNames))
      : nakesProfile.registeredCategoryNames?.length > 0
      ? Array.from(new Set(nakesProfile.registeredCategoryNames))
      : ["-"];

  const wilayahDisplay = activeOperational
    ? resolveWilayahName(activeOperational?.id_wilayah_layanan, activeOperational?.wilayah_layanan, listWilayah)
    : nakesProfile.registeredWilayahName || "-";

  const scheduleDisplay = activeSchedule?.hours || "-";

  const checkIsOnlineStatus = () => {
    const waktuLayanan = activeSchedule?.waktu_layanan;
    if (!waktuLayanan || !Array.isArray(waktuLayanan) || waktuLayanan.length === 0) return false;
    const now = new Date();
    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = daysMap[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return waktuLayanan.some((item) => {
      if (item.hari !== currentDayName) return false;
      const [startH, startM] = String(item.jam_mulai).split(":").map(Number);
      const [endH, endM] = String(item.jam_selesai).split(":").map(Number);
      return currentMinutes >= startH * 60 + startM && currentMinutes <= endH * 60 + endM;
    });
  };
  const isOnlineStatus = checkIsOnlineStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {approvalPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 text-center border border-slate-100">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${approvalPopup.type === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {approvalPopup.type === "approved" ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{approvalPopup.title}</h3>
            <p className="text-xs text-slate-500">{approvalPopup.message}</p>
            <button type="button" onClick={() => setApprovalPopup(null)} className="mt-5 w-full py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl">Mengerti</button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[110] max-w-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>
          <p className="text-xs font-medium">{toastMessage.text}</p>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="min-h-screen bg-slate-50/80 pb-32">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <button type="button" onClick={() => router.push("/")} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-bold text-slate-900">Dashboard Nakes</h1>
            <button type="button" className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
              <Bell className="w-5 h-5" />
              {pendingRequest && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
          {pendingRequest && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <Hourglass className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-amber-950">Pengajuan Operasional Menunggu Persetujuan</h3>
                  <p className="text-xs text-amber-800 mt-1">Data operasional aktif Anda tetap digunakan hingga disetujui admin.</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-md flex flex-col sm:flex-row items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-semibold mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnlineStatus ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span>Status: {isOnlineStatus ? "Online" : "Offline"}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Menunggu Pesanan</h2>
              <p className="text-xs text-blue-100 mt-1.5 max-w-md leading-relaxed">
                {isOnlineStatus ? "Sistem aktif dan siap menerima panggilan layanan. Pesanan pasien akan otomatis tampil secara real-time di dashboard ini." : "Anda sedang di luar jam operasional."}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <img src="/images/dashboard/nurse-hero.png" alt="Status Nakes" className="w-32 sm:w-48 object-contain drop-shadow-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="font-bold text-slate-900">Booking Masuk</h3>
                  <p className="text-xs text-slate-500">Perlu Anda terima atau tolak</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">{incomingBookings.length}</span>
              </div>
              <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto">
                {bookingLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                ) : incomingBookings.length > 0 ? (
                  incomingBookings.map((b) => {
                    const id = getBookingId(b);
                    const isActing = bookingActionId === id;
                    return (
                      <div key={id || Math.random()} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-blue-600">{getBookingCode(b)}</span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{getBookingPatientName(b)}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{b.layanan?.nama_layanan || "Layanan Home Care"}</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg">Menunggu</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatBookingDate(b.tanggal_booking || b.created_at)}</p>
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => handleOpenBookingDetail(b)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Detail</button>
                          <button type="button" disabled={isActing} onClick={() => handleBookingAction(b, "reject")} className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50">Tolak</button>
                          <button type="button" disabled={isActing} onClick={() => handleBookingAction(b, "accept")} className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700">Terima</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-slate-400">Tidak ada booking masuk saat ini.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <h3 className="font-bold text-slate-900">Booking Saya</h3>
                <p className="text-xs text-slate-500">Booking diterima atau selesai</p>
              </div>
              <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto">
                {bookingLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                ) : acceptedBookings.length > 0 ? (
                  acceptedBookings.map((b) => {
                    const id = getBookingId(b);
                    const statusText = b.status_booking || b.status || "Diterima";
                    return (
                      <button key={id || Math.random()} onClick={() => handleOpenBookingDetail(b)} className="w-full text-left rounded-2xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/20 transition bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-blue-600">{getBookingCode(b)}</span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{getBookingPatientName(b)}</h4>
                          </div>
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg">{statusText}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{formatBookingDate(b.tanggal_booking || b.updated_at)}</p>
                      </button>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-slate-400">Belum ada riwayat booking diterima.</p>
                )}
              </div>
            </div>

            <div className="hidden md:flex flex-col rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Stethoscope className="w-4 h-4" /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">Profil Operasional</h3>
                    <p className="text-xs text-slate-500">Kelola informasi & jadwal nakes</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {nakesProfile.photo ? <img src={nakesProfile.photo} alt="Nakes" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{nakesProfile.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-blue-600" /> {nakesProfile.phone}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate"><Home className="w-3 h-3 text-blue-600 shrink-0" /> {nakesProfile.address}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Kategori Layanan</p>
                    <div className="flex flex-wrap gap-1">
                      {categoryDisplay.map((cat, i) => <span key={i} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-medium">{cat}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Wilayah Layanan</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {wilayahDisplay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Jadwal Operasional</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> {scheduleDisplay}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => setIsEditModalOpen(true)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
                    <Edit3 className="w-4 h-4" /> Edit Operasional
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="block sm:hidden">
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(event, info) => {
              if (info.offset.y < -30 || info.velocity.y < -200) {
                setIsMobileSheetOpen(true);
              } else if (info.offset.y > 30 || info.velocity.y > 200) {
                setIsMobileSheetOpen(false);
              }
            }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 transition-all duration-300 ease-out flex flex-col h-auto ${
              isMobileSheetOpen ? "max-h-[85vh]" : "max-h-none"
            }`}
          >
            <div 
              onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)} 
              className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-pointer rounded-t-3xl bg-white border-b border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-2" />
              <div className="w-full px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {nakesProfile.photo ? <img src={nakesProfile.photo} alt="Nakes" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{nakesProfile.name}</h4>
                    <p className="text-[10px] text-slate-500">Profil & Jadwal Operasional</p>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isMobileSheetOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto bg-white text-xs"
                >
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold">Kontak & Alamat</p>
                    <p className="font-medium text-slate-800 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" /> {nakesProfile.phone}</p>
                    <p className="font-medium text-slate-800 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {nakesProfile.address}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Kategori Layanan</p>
                    <div className="flex flex-wrap gap-1">
                      {categoryDisplay.map((cat, i) => <span key={i} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-medium">{cat}</span>)}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Wilayah Layanan</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {wilayahDisplay}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Jadwal Operasional</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> {scheduleDisplay}</p>
                  </div>

                  <button type="button" onClick={() => { setIsMobileSheetOpen(false); setIsEditModalOpen(true); }} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Operasional
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {isEditModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-900 text-sm">Edit Data Operasional</h3>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSubmitOperasional} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wilayah Layanan</label>
                  <select
                    value={formData.id_wilayah_layanan}
                    onChange={(e) => setFormData({ ...formData, id_wilayah_layanan: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-blue-600"
                  >
                    <option value="">Pilih Wilayah</option>
                    {listWilayah.map((w) => {
                      const id = Number(w.id_provinsi ?? w.id_wilayah_layanan ?? w.id);
                      const name = w.nama_provinsi ?? w.nama_wilayah ?? w.nama;
                      return <option key={id} value={id}>{name}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Layanan</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                    {listCategories.map((cat) => {
                      const id = Number(cat.id ?? cat.id_kategori_layanan ?? cat.id_kategori);
                      const name = cat.nama_kategori ?? cat.nama_layanan ?? cat.nama ?? cat.label;
                      const isSelected = formData.kategori_layanan.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleCategoryToggle(id)}
                          className={`p-2 rounded-xl text-left border transition ${isSelected ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hari Mulai</label>
                    <select
                      value={formData.hari_mulai}
                      onChange={(e) => setFormData({ ...formData, hari_mulai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    >
                      <option value="">Pilih Hari</option>
                      {LIST_HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hari Selesai</label>
                    <select
                      value={formData.hari_selesai}
                      onChange={(e) => setFormData({ ...formData, hari_selesai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    >
                      <option value="">Pilih Hari</option>
                      {LIST_HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={formData.jam_mulai}
                      onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={formData.jam_selesai}
                      onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedBooking && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Detail Pesanan</h3>
                  <p className="text-xs text-blue-600 font-semibold">{getBookingCode(selectedBooking)}</p>
                </div>
                <button type="button" onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
                {bookingDetailLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">Informasi Pasien</p>
                      <p><strong className="text-slate-900">Nama:</strong> {getBookingPatientName(selectedBooking)}</p>
                      <p><strong className="text-slate-900">Telepon:</strong> {selectedBooking?.pasien?.no_telp || selectedBooking?.pasien?.no_hp || selectedBooking?.user?.phone || "-"}</p>
                      <p><strong className="text-slate-900">Alamat:</strong> {selectedBooking?.alamat_kunjungan || selectedBooking?.alamat_tujuan || selectedBooking?.pasien?.alamat || "-"}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">Detail Layanan</p>
                      <p><strong className="text-slate-900">Layanan:</strong> {selectedBooking?.layanan?.nama_layanan || "Home Care"}</p>
                      <p><strong className="text-slate-900">Jadwal:</strong> {formatBookingDate(selectedBooking?.tanggal_booking)}</p>
                      <p><strong className="text-slate-900">Status:</strong> <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">{selectedBooking?.status_booking || "Pending"}</span></p>
                    </div>

                    {String(selectedBooking?.status_booking || "").toLowerCase() === "pending" && (
                      <div className="pt-2 flex gap-2">
                        <button type="button" onClick={() => handleBookingAction(selectedBooking, "reject")} className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50">Tolak</button>
                        <button type="button" onClick={() => handleBookingAction(selectedBooking, "accept")} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Terima</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}