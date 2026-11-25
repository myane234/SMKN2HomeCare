"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

import {
  createBooking,
  getPointBalance,
  getKalkulasiBiayaBooking,
  saveBookingCostPreview,
} from "@/services/bookingService";
import { fetchAndStoreProfile } from "@/services/profileService";
import { resolveImageUrl } from "@/services/resolveImage";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Home,
  PenSquare,
  ShoppingBag,
} from "lucide-react";

const CHECKOUT_STORAGE_KEY = "smarthomecare_checkout";

/* =========================================================
   HELPER
========================================================= */

function getServiceId(service) {
  return service?.id_layanan || service?.id || service?.uuid;
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Rp0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function getLocalDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function getCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");

  const target = cookies.find((cookie) =>
    cookie.startsWith(`${name}=`)
  );

  if (!target) {
    return null;
  }

  const value = target.substring(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isValidCoordinates(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    String(latitude).trim() === "" ||
    String(longitude).trim() === ""
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function getBaseDurationMinutes(value) {
  const baseDuration = Number(value);

  if (!Number.isFinite(baseDuration) || baseDuration <= 0) {
    return 60;
  }

  return Math.max(60, Math.round(baseDuration));
}

function normalizeDurationMinutes(value, baseMinutes) {
  const baseDuration = getBaseDurationMinutes(baseMinutes);
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return baseDuration;
  }

  return Math.max(
    baseDuration,
    Math.ceil(parsedValue / baseDuration) * baseDuration
  );
}

function formatDurationText(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours && minutes) {
    return `${safeMinutes} menit (${hours} jam ${minutes} menit)`;
  }

  if (hours) {
    return `${safeMinutes} menit (${hours} jam)`;
  }

  return `${safeMinutes} menit`;
}

/* =========================================================
   PAGE
========================================================= */

export default function BookingPage() {
  const router = useRouter();

  /* =========================================================
     AUTH
  ========================================================= */

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const isLoggedIn =
      document.cookie.includes("is_logged_in=true") ||
      Boolean(getCookie("auth_token"));

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    date: "",
    time: "",
    notes: "",
  });

  /* =========================================================
     CHECKOUT
  ========================================================= */

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [durationInputs, setDurationInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [promoDetails, setPromoDetails] = useState(null);

  // Preview biaya dari API kalkulasi-biaya
  const [bookingCostPreview, setBookingCostPreview] = useState(null);
  const [isCalculatingBookingCost, setIsCalculatingBookingCost] =
    useState(false);
  const [bookingCostError, setBookingCostError] = useState("");

  /* =========================================================
     POIN
  ========================================================= */

  const [pointBalance, setPointBalance] = useState(0);
  const [maxPointDiscountPercent, setMaxPointDiscountPercent] =
    useState(50);
  const [usePoints, setUsePoints] = useState(false);
  const [pointDiscountAmount, setPointDiscountAmount] = useState(0);

  /* =========================================================
     ADDRESS
  ========================================================= */

  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [addressData, setAddressData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const mapDebounceTimer = useRef(null);

  /* =========================================================
     SCHEDULE
  ========================================================= */

  const [isScheduleManuallyChanged, setIsScheduleManuallyChanged] =
    useState(false);

  useEffect(() => {
    const updateCurrentDateTime = () => {
      if (isScheduleManuallyChanged) return;

      const { date, time } = getLocalDateTime();

      setForm((prev) => {
        if (prev.date === date && prev.time === time) {
          return prev;
        }

        return {
          ...prev,
          date,
          time,
        };
      });
    };

    updateCurrentDateTime();

    const interval = setInterval(updateCurrentDateTime, 1000);

    return () => clearInterval(interval);
  }, [isScheduleManuallyChanged]);

  /* =========================================================
     LOAD CHECKOUT (PROMO / KERANJANG)
     ID promo dan ID layanan tidak boleh tertukar.
  ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadCheckout = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const promoId = params.get("id_promo");
        const layananId = params.get("id_layanan");

        if (promoId || layananId) {
          const response = await fetch("/api/promo", {
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Gagal mengambil data promo.");
          }

          const json = await response.json();

          if (!json?.success || !Array.isArray(json.data)) {
            throw new Error("Format data promo tidak valid.");
          }

          let matchedPromo = null;

          if (promoId) {
            // ID promo adalah acuan utama.
            matchedPromo = json.data.find(
              (item) =>
                String(item.id_promo) === String(promoId)
            );
          } else if (layananId) {
            // Kompatibilitas URL lama yang hanya membawa ID layanan.
            matchedPromo = json.data.find((item) => {
              const sameService =
                String(item.layanan?.id_layanan) ===
                String(layananId);

              const active = item.status_aktual
                ? item.status_aktual === "Aktif"
                : item.status_promo === "Aktif";

              return sameService && active;
            });
          }

          if (!matchedPromo?.layanan) {
            throw new Error(
              "Promo atau layanan yang dipilih tidak ditemukan. Silakan kembali ke halaman promo."
            );
          }

          const promoIsActive = matchedPromo.status_aktual
            ? matchedPromo.status_aktual === "Aktif"
            : matchedPromo.status_promo === "Aktif";

          if (!promoIsActive) {
            throw new Error(
              "Promo ini sudah tidak aktif atau telah kedaluwarsa."
            );
          }

          const service = matchedPromo.layanan;
          const actualServiceId =
            service.id_layanan ?? matchedPromo.id_layanan;

          if (
            layananId &&
            String(actualServiceId) !== String(layananId)
          ) {
            throw new Error(
              "ID layanan pada URL tidak sesuai dengan layanan promo yang dipilih."
            );
          }

          if (!actualServiceId) {
            throw new Error("ID layanan pada promo tidak tersedia.");
          }

          if (cancelled) return;

          setPromoDetails(matchedPromo);

          setCheckoutItems([
            {
              service: {
                id_layanan: actualServiceId,
                nama_layanan: service.nama_layanan,
                harga: Number(service.harga ?? 0),
                foto_layanan: service.foto_layanan ?? null,
                tipe_layanan: service.tipe_layanan || "biasa",
                durasi_menit: service.durasi_menit ?? null,
              },
              qty: 1,
            },
          ]);

          setErrorMessage("");
          return;
        }

        // Checkout biasa dari keranjang.
        setPromoDetails(null);

        const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!cancelled) {
            setCheckoutItems(parsed);
          }
        } else {
          router.push("/keranjang");
        }
      } catch (error) {
        console.error("Gagal memuat checkout:", error);

        if (!cancelled) {
          setCheckoutItems([]);
          setPromoDetails(null);
          setErrorMessage(
            error?.message || "Gagal memuat layanan yang dipilih."
          );
        }
      }
    };

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =========================================================
     INITIALIZE DURASI
  ========================================================= */

  useEffect(() => {
    setDurationInputs((current) => {
      const next = { ...current };
      let changed = false;

      checkoutItems.forEach((item) => {
        const service = item.service || {};
        const serviceId = getServiceId(service);

        if (
          service?.tipe_layanan === "durasi" &&
          serviceId &&
          !next[serviceId]
        ) {
          const baseDuration = getBaseDurationMinutes(
            service.durasi_menit || service.durasi || 60
          );

          next[serviceId] = baseDuration;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [checkoutItems]);

  const durasiLayananMap = useMemo(() => {
    return Object.fromEntries(
      checkoutItems
        .filter(
          (item) => item.service?.tipe_layanan === "durasi"
        )
        .map((item) => {
          const service = item.service || {};
          const serviceId = getServiceId(service);

          const baseDuration = getBaseDurationMinutes(
            service.durasi_menit || service.durasi || 60
          );

          return [
            String(serviceId),
            normalizeDurationMinutes(
              durationInputs[serviceId],
              baseDuration
            ),
          ];
        })
    );
  }, [checkoutItems, durationInputs]);

  /* =========================================================
     PREVIEW BIAYA LIVE (SL + SB + ST)
  ========================================================= */

  useEffect(() => {
    if (
      checkoutItems.length === 0 ||
      !addressData ||
      !isValidCoordinates(
        addressData.latitude,
        addressData.longitude
      ) ||
      !form.date ||
      !form.time
    ) {
      setBookingCostPreview(null);
      setIsCalculatingBookingCost(false);

      if (
        checkoutItems.length > 0 &&
        addressData &&
        !isValidCoordinates(
          addressData.latitude,
          addressData.longitude
        )
      ) {
        setBookingCostError(
          "Titik lokasi belum ditentukan. Ubah alamat lalu pilih titik pada peta atau gunakan GPS."
        );
      } else {
        setBookingCostError("");
      }

      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsCalculatingBookingCost(true);
      setBookingCostError("");

      try {
        const layananIds = checkoutItems
          .map((item) =>
            Number(getServiceId(item.service || {}))
          )
          .filter((id) => Number.isInteger(id) && id > 0);

        const requestData = {
          layanan_ids: layananIds,
          latitude_kunjungan: Number(addressData.latitude),
          longitude_kunjungan: Number(addressData.longitude),
          tanggal_kunjungan: form.date,
          jam_kunjungan: form.time,
          durasi_layanan: durasiLayananMap,
        };

        const response =
          await getKalkulasiBiayaBooking(requestData);

        const result = response?.data ?? response;

        if (
          response?.success === false ||
          !result?.rincian_biaya
        ) {
          throw new Error(
            response?.message ||
              "Response kalkulasi biaya tidak valid."
          );
        }

        const needsTransport =
          Array.isArray(result.layanan) &&
          result.layanan.some(
            (item) => item.is_transport === true
          );

        const availableNakes = Number(
          result.transport?.nakes_tersedia ?? 0
        );

        if (needsTransport && availableNakes <= 0) {
          throw new Error(
            result.transport?.peringatan ||
              "Belum tersedia tenaga kesehatan untuk wilayah kunjungan ini."
          );
        }

        if (!cancelled) {
          setBookingCostPreview({
            request: requestData,
            result,
          });

          setBookingCostError("");
        }
      } catch (error) {
        console.error("Gagal preview biaya booking:", error);

        if (!cancelled) {
          setBookingCostPreview(null);

          setBookingCostError(
            error?.response?.data?.message ||
              error?.message ||
              "Gagal menghitung biaya booking."
          );
        }
      } finally {
        if (!cancelled) {
          setIsCalculatingBookingCost(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    checkoutItems,
    durasiLayananMap,
    addressData?.latitude,
    addressData?.longitude,
    form.date,
    form.time,
  ]);

  const previewDetails =
    bookingCostPreview?.result?.rincian_biaya ?? null;

  const previewServices =
    bookingCostPreview?.result?.layanan ?? [];

  const previewPromoDiscount = previewServices.reduce(
    (sum, item) =>
      sum + (Number(item.diskon_promo) || 0),
    0
  );

  const previewSlAfterDiscount =
    Number(previewDetails?.total_sl) || 0;

  const previewSlBeforeDiscount =
    previewSlAfterDiscount + previewPromoDiscount;

  const estimatedBookingTotal =
    Number(previewDetails?.total_biaya);

  /* =========================================================
     LOAD POINT BALANCE
  ========================================================= */

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const res = await getPointBalance();

        if (res?.success) {
          setPointBalance(res.data.points_balance || 0);

          setMaxPointDiscountPercent(
            res.data.max_point_discount_percent || 50
          );
        }
      } catch (err) {
        console.error("Gagal memuat saldo poin:", err);
      }
    };

    loadPoints();
  }, []);

  /* =========================================================
     LOAD ADDRESS
     Koordinat kosong tetap null. Jangan memakai titik default Jakarta
     karena dapat membuat jarak transport dihitung dari lokasi salah.
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadAddress = async () => {
      setIsLoadingAddress(true);

      try {
        const profile = await fetchAndStoreProfile();

        if (!isMounted) return;

        const pasien = profile?.pasien;

        if (pasien?.alamat_utama) {
          const latitude = isValidCoordinates(
            pasien.latitude,
            pasien.longitude
          )
            ? Number(pasien.latitude)
            : null;

          const longitude = isValidCoordinates(
            pasien.latitude,
            pasien.longitude
          )
            ? Number(pasien.longitude)
            : null;

          setAddressData({
            label: "Alamat Utama",
            receiver: pasien?.nama_lengkap || "Pasien",
            phone: "-",
            address: pasien.alamat_utama,
            latitude,
            longitude,
          });

          setTempAddress(pasien.alamat_utama);

          if (!isValidCoordinates(latitude, longitude)) {
            setIsEditingAddress(true);
            setBookingCostError(
              "Koordinat alamat belum tersedia. Tentukan titik lokasi melalui peta atau GPS sebelum membuat booking."
            );
          }

          return;
        }

        const savedAddress = getCookie("profile_alamat");
        const savedName = getCookie("profile_nama");

        if (savedAddress) {
          setAddressData({
            label: "Alamat Utama",
            receiver: savedName || "Pasien",
            phone: "-",
            address: savedAddress,
            latitude: null,
            longitude: null,
          });

          setTempAddress(savedAddress);
          setIsEditingAddress(true);
          setBookingCostError(
            "Koordinat alamat belum tersedia. Tentukan titik lokasi melalui peta atau GPS sebelum membuat booking."
          );
          return;
        }

        setAddressData(null);
        setErrorMessage(
          "Alamat profil belum tersedia. Isi alamat di profil terlebih dahulu."
        );
      } catch (error) {
        console.error("Gagal memuat alamat profil:", error);

        const savedAddress = getCookie("profile_alamat");
        const savedName = getCookie("profile_nama");

        if (savedAddress) {
          setAddressData({
            label: "Alamat Utama",
            receiver: savedName || "Pasien",
            phone: "-",
            address: savedAddress,
            latitude: null,
            longitude: null,
          });

          setTempAddress(savedAddress);
          setIsEditingAddress(true);
          setBookingCostError(
            "Koordinat alamat belum tersedia. Tentukan titik lokasi melalui peta atau GPS sebelum membuat booking."
          );
        } else {
          setAddressData(null);
          setErrorMessage(
            "Gagal memuat alamat profil. Silakan coba lagi."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAddress(false);
        }
      }
    };

    loadAddress();

    return () => {
      isMounted = false;

      if (mapDebounceTimer.current) {
        clearTimeout(mapDebounceTimer.current);
      }
    };
  }, []);

  /* =========================================================
     HANDLE MAP
  ========================================================= */

  const handleMapChange = (lat, lng) => {
    setAddressData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    if (mapDebounceTimer.current) {
      clearTimeout(mapDebounceTimer.current);
    }

    setIsFetchingAddress(true);

    mapDebounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );

        if (response.ok) {
          const data = await response.json();

          if (data?.display_name) {
            setTempAddress(data.display_name);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil alamat:", error);
      } finally {
        setIsFetchingAddress(false);
      }
    }, 500);
  };

  /* =========================================================
     HANDLE CURRENT LOCATION (GPS)
  ========================================================= */

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    setIsFetchingAddress(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setAddressData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );

          if (response.ok) {
            const data = await response.json();

            if (data?.display_name) {
              setTempAddress(data.display_name);
            }
          }
        } catch (error) {
          console.error(
            "Gagal mengambil alamat dari lokasi saat ini:",
            error
          );
        } finally {
          setIsFetchingAddress(false);
        }
      },
      (error) => {
        console.error("Gagal mendeteksi lokasi:", error);

        alert(
          "Gagal mendeteksi lokasi saat ini. Pastikan izin GPS diaktifkan."
        );

        setIsFetchingAddress(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* =========================================================
     TOTAL PRICE
  ========================================================= */

  const getCheckoutItemPrice = (item) => {
    const service = item.service || {};

    const basePrice =
      Number(
        service.harga ||
          service.price ||
          item.harga ||
          item.price ||
          item.total_harga ||
          item.amount
      ) || 0;

    if (service.tipe_layanan !== "durasi") {
      return basePrice;
    }

    const baseDuration = getBaseDurationMinutes(
      service.durasi_menit || service.durasi || 60
    );

    const selectedDuration = normalizeDurationMinutes(
      durationInputs[getServiceId(service)],
      baseDuration
    );

    return basePrice * (selectedDuration / baseDuration);
  };

  const totalDurationMinutes = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
      const service = item.service || {};

      if (service.tipe_layanan !== "durasi") {
        return acc;
      }

      const serviceId = getServiceId(service);

      const baseDuration = getBaseDurationMinutes(
        service.durasi_menit || service.durasi || 60
      );

      const selectedDuration = normalizeDurationMinutes(
        durationInputs[serviceId],
        baseDuration
      );

      const qty = item.qty || item.jumlah || 1;

      return acc + selectedDuration * qty;
    }, 0);
  }, [checkoutItems, durationInputs]);

  const priceBreakdown = useMemo(() => {
    const totalSebelumDiskon = checkoutItems.reduce((acc, item) => {
      const price = getCheckoutItemPrice(item);
      const qty = item.qty || item.jumlah || 1;

      return acc + price * qty;
    }, 0);

    let diskonNominal = 0;

    if (promoDetails) {
      const nilai = Number(promoDetails.nilai_diskon) || 0;

      if (promoDetails.tipe_diskon === "persen") {
        diskonNominal = (totalSebelumDiskon * nilai) / 100;
      } else if (promoDetails.tipe_diskon === "nominal") {
        diskonNominal = nilai;
      }
    }

    const totalSetelahDiskon = Math.max(
      0,
      totalSebelumDiskon - diskonNominal
    );

    return {
      sl_sebelum_diskon: totalSebelumDiskon,
      diskon_promo: diskonNominal,
      sl: totalSetelahDiskon,
      total_sl_sebelum_diskon: totalSebelumDiskon,
      total_sl: totalSetelahDiskon,
    };
  }, [checkoutItems, durationInputs, promoDetails]);

  const totalPrice = priceBreakdown.total_sl;

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    if (field === "date" || field === "time") {
      setIsScheduleManuallyChanged(true);
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  const hasValidCoordinates = isValidCoordinates(
    addressData?.latitude,
    addressData?.longitude
  );

  const isFormValid =
    Boolean(addressData?.address?.trim()) &&
    hasValidCoordinates &&
    checkoutItems.length > 0 &&
    form.date.trim() !== "" &&
    form.time.trim() !== "";

  /* =========================================================
     SUBMIT BOOKING
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting || isCalculatingBookingCost) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const rawIds = checkoutItems
        .map((item) => Number(getServiceId(item.service || {})))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (rawIds.length === 0) {
        throw new Error("Layanan yang dipilih tidak valid.");
      }

      const previewRequest = {
        layanan_ids: rawIds,
        latitude_kunjungan: Number(addressData.latitude),
        longitude_kunjungan: Number(addressData.longitude),
        tanggal_kunjungan: form.date,
        jam_kunjungan: form.time,
        durasi_layanan: durasiLayananMap,
      };

      // Hitung ulang sebelum membuat booking.
      const previewResponse =
        await getKalkulasiBiayaBooking(previewRequest);

      const previewResult =
        previewResponse?.data ?? previewResponse;

      if (
        previewResponse?.success === false ||
        !previewResult?.rincian_biaya
      ) {
        throw new Error(
          previewResponse?.message ||
            "Kalkulasi estimasi biaya gagal."
        );
      }

      const needsTransport =
        Array.isArray(previewResult.layanan) &&
        previewResult.layanan.some(
          (item) => item.is_transport === true
        );

      const availableNakes = Number(
        previewResult.transport?.nakes_tersedia ?? 0
      );

      if (needsTransport && availableNakes <= 0) {
        throw new Error(
          previewResult.transport?.peringatan ||
            "Belum tersedia tenaga kesehatan di wilayah kunjungan."
        );
      }

      const response = await createBooking({
        layanan_ids: rawIds,
        durasi_layanan: durasiLayananMap,
        tanggal_kunjungan: form.date,
        jam_kunjungan: form.time,
        alamat_kunjungan: addressData.address,
        latitude_kunjungan: Number(addressData.latitude),
        longitude_kunjungan: Number(addressData.longitude),
        catatan: form.notes,
        use_points: usePoints,
        points_to_use: usePoints ? pointBalance : 0,
      });

      if (response?.success === false) {
        throw new Error(
          response?.message || "Gagal membuat booking."
        );
      }

      const payload =
        response?.data?.data ?? response?.data ?? {};

      const bookingId =
        payload?.booking?.id_booking ||
        payload?.id_booking ||
        payload?.id;

      const bookingCode =
        payload?.booking_code ||
        payload?.booking?.booking_code ||
        "";

      if (!bookingId) {
        throw new Error(
          "ID Booking tidak ditemukan dari respons server."
        );
      }

      // Simpan preview berdasarkan ID booking.
      // Preview hanya untuk tampilan; tagihan resmi dari backend.
      saveBookingCostPreview(
        bookingId,
        previewRequest,
        previewResult
      );

      localStorage.setItem(
        "last_booking",
        JSON.stringify({
          booking_id: bookingId,
          booking_code: bookingCode,
        })
      );

      localStorage.removeItem(CHECKOUT_STORAGE_KEY);

      const params = new URLSearchParams({
        booking_id: String(bookingId),
      });

      if (bookingCode) {
        params.set("booking_code", bookingCode);
      }

      router.push(
        `/pembayaran/pilih-metode?${params.toString()}`
      );
    } catch (error) {
      console.error("Booking error:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Gagal membuat booking. Silakan coba lagi."
      );

      setIsSubmitting(false);
    }
  };

  /* =========================================================
     LOADING AUTH
  ========================================================= */

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-semibold text-lg animate-pulse">
          Memeriksa autentikasi...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 pb-20">
      <div className="mx-auto max-w-2xl space-y-4">

        {/* HEADER */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Layanan
          </h1>
        </div>

        {/* ERROR */}
        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* =====================================================
              LAYANAN
          ====================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="p-5">

              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">

                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-gray-700" />

                  <h2 className="text-sm font-semibold text-gray-900">
                    Layanan yang dipilih ({checkoutItems.length})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/keranjang")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Ubah
                </button>

              </div>

              <div className="divide-y divide-gray-100">

                {checkoutItems.map((item, idx) => {
                  const s = item.service || {};

                  const title =
                    s.nama_layanan ||
                    s.nama ||
                    s.title ||
                    "Layanan";

                  const price = getCheckoutItemPrice(item);
                  const servicePreview = previewServices.find(
                    (preview) =>
                      String(preview.id_layanan) ===
                      String(getServiceId(s))
                  );

                  const serviceDiscount =
                    Number(servicePreview?.diskon_promo) || 0;
                  const serviceFinalPrice = Number(servicePreview?.sl);
                  const hasServicePromo =
                    serviceDiscount > 0 &&
                    Number.isFinite(serviceFinalPrice);
                  const serviceOriginalPrice = hasServicePromo
                    ? serviceFinalPrice + serviceDiscount
                    : price;

                  const isDurationBased =
                    s.tipe_layanan === "durasi";

                  const baseDuration = getBaseDurationMinutes(
                    s.durasi_menit || s.durasi || 60
                  );

                  const selectedDuration = normalizeDurationMinutes(
                    durationInputs[getServiceId(s)],
                    baseDuration
                  );

                  const img = resolveImageUrl(
                    s.foto_layanan ||
                      s.gambar ||
                      s.foto ||
                      s.image ||
                      s.foto_layanan_url ||
                      s.gambar_url
                  );

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >

                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={img}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {title}
                        </p>

                        {hasServicePromo ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-gray-400 line-through">
                              {item.qty || 1}x {formatCurrency(serviceOriginalPrice)}
                            </p>
                            <p className="text-sm font-semibold text-emerald-700">
                              {item.qty || 1}x {formatCurrency(serviceFinalPrice)}
                            </p>
                            <p className="text-xs font-medium text-emerald-600">
                              Hemat {formatCurrency(serviceDiscount)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {item.qty || 1}x {formatCurrency(price)}
                          </p>
                        )}

                        {isDurationBased && (
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>Durasi</span>

                              <button
                                type="button"
                                aria-label="Kurangi durasi"
                                disabled={selectedDuration <= baseDuration}
                                onClick={() =>
                                  setDurationInputs((current) => ({
                                    ...current,
                                    [getServiceId(s)]: Math.max(
                                      baseDuration,
                                      selectedDuration - baseDuration
                                    ),
                                  }))
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                −
                              </button>

                              <input
                                type="number"
                                value={selectedDuration}
                                readOnly
                                aria-label="Durasi dalam menit"
                                className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center text-xs text-gray-900 outline-none"
                              />

                              <button
                                type="button"
                                aria-label="Tambah durasi"
                                disabled={selectedDuration >= 1440}
                                onClick={() =>
                                  setDurationInputs((current) => ({
                                    ...current,
                                    [getServiceId(s)]: Math.min(
                                      1440,
                                      selectedDuration + baseDuration
                                    ),
                                  }))
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                +
                              </button>

                              <span>menit</span>
                            </div>

                            <p className="text-[10px] text-gray-500">
                              Total: {formatDurationText(selectedDuration)}
                            </p>
                          </div>
                        )}

                      </div>

                      <div className="shrink-0 text-right">
                        {hasServicePromo ? (
                          <>
                            <p className="text-xs text-gray-400 line-through">
                              {formatCurrency(serviceOriginalPrice * (item.qty || 1))}
                            </p>
                            <p className="text-sm font-bold text-emerald-700">
                              {formatCurrency(serviceFinalPrice * (item.qty || 1))}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(price * (item.qty || 1))}
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* TOTAL */}

              <div className="mt-4 space-y-3 border-t border-gray-200 pt-3">

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Total Durasi
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {formatDurationText(totalDurationMinutes)}
                  </span>
                </div>

                {previewPromoDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">
                        Harga sebelum promo
                      </span>

                      <span className="text-sm text-gray-700">
                        {formatCurrency(previewSlBeforeDiscount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-emerald-700">
                        Total Diskon Promo
                      </span>

                      <span className="text-sm font-semibold text-emerald-700">
                        -{formatCurrency(previewPromoDiscount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Estimasi Total Booking
                  </span>

                  <span className="text-base font-bold text-blue-600">
                    {isCalculatingBookingCost
                      ? "Menghitung..."
                      : Number.isFinite(estimatedBookingTotal)
                      ? formatCurrency(estimatedBookingTotal)
                      : "—"}
                  </span>
                </div>

                {bookingCostError && (
                  <p className="text-xs text-red-600">
                    {bookingCostError}
                  </p>
                )}

                {!bookingCostError && previewDetails?.catatan && (
                  <p className="text-xs leading-relaxed text-gray-500">
                    {previewDetails.catatan}
                  </p>
                )}

              </div>

            </div>
          </div>

          {/* =====================================================
              CARD CHECKBOX POIN
          ====================================================== */}

          {pointBalance >= 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-white p-4 shadow-xs transition-all hover:shadow-sm">
              <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3.5">
                  <div className="shrink-0">
                    <svg
                      className="h-7 w-7 text-amber-500 fill-amber-400 drop-shadow-xs"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        Punya {pointBalance.toLocaleString("id-ID")} Poin
                        Tersedia
                      </span>

                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        Hemat
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Gunakan untuk memotong total tagihan booking kamu.
                    </p>
                  </div>
                </div>

                <label className="relative flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    disabled={pointBalance === 0}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="peer h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                  />

                  <span className="ml-2 text-xs font-semibold text-gray-700 peer-disabled:text-gray-400">
                    Pakai Poin
                  </span>
                </label>

              </div>
            </div>
          )}

          {/* =====================================================
              ALAMAT
          ====================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="p-5">

              <div className="flex items-center justify-between mb-3">

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-700" />

                  <h2 className="text-sm font-semibold text-gray-900">
                    Alamat Kunjungan
                  </h2>
                </div>

                {!isLoadingAddress &&
                  addressData &&
                  !isEditingAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempAddress(addressData.address);
                        setIsEditingAddress(true);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Ubah
                    </button>
                  )}

              </div>

              {isLoadingAddress ? (
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                </div>
              ) : addressData ? (
                isEditingAddress ? (
                  <div className="space-y-3">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                      <div className="text-xs text-gray-500">
                        Geser pin pada peta di bawah ini untuk mengubah titik
                        lokasi kunjungan. Alamat akan diperbarui otomatis.
                      </div>

                      <button
                        type="button"
                        onClick={handleCurrentLocation}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 shrink-0"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Lokasi Saat Ini
                      </button>
                    </div>

                    <div className="relative">
                      <MapPicker
                        lat={
                          isValidCoordinates(
                            addressData.latitude,
                            addressData.longitude
                          )
                            ? Number(addressData.latitude)
                            : -6.2088
                        }
                        lng={
                          isValidCoordinates(
                            addressData.latitude,
                            addressData.longitude
                          )
                            ? Number(addressData.longitude)
                            : 106.8456
                        }
                        onChange={handleMapChange}
                      />

                      {isFetchingAddress && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                          <span className="text-xs font-medium text-gray-600 animate-pulse">
                            Mengambil alamat baru...
                          </span>
                        </div>
                      )}
                    </div>

                    <textarea
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                      rows={3}
                      placeholder="Masukkan alamat kunjungan lengkap"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        Batal
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAddressData((prev) => ({
                            ...prev,
                            address: tempAddress,
                          }));

                          setIsEditingAddress(false);
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />

                      <span className="text-sm font-medium text-gray-900">
                        {addressData.receiver}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-700">
                      {addressData.address}
                    </p>

                    {!hasValidCoordinates && (
                      <p className="text-xs text-amber-700">
                        Titik lokasi belum tersedia. Pilih Ubah untuk menentukan lokasi melalui peta atau GPS.
                      </p>
                    )}
                  </div>
                )
              ) : null}

            </div>
          </div>

          {/* =====================================================
              TANGGAL
          ====================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Pilih Tanggal Kedatangan
              </h2>

              <input
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                min={getLocalDateTime().date}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* =====================================================
              JAM
          ====================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Pilih Jam Kedatangan
              </h2>

              <input
                type="time"
                value={form.time}
                onChange={handleChange("time")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* =====================================================
              CATATAN
          ====================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <PenSquare className="h-5 w-5 text-gray-700" />

                <h2 className="text-sm font-semibold text-gray-900">
                  Catatan
                </h2>
              </div>

              <textarea
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="Tambahkan instruksi khusus atau kondisi pasien"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* =====================================================
              SUBMIT
          ====================================================== */}

          <button
            type="submit"
            disabled={
              !isFormValid ||
              isSubmitting ||
              isCalculatingBookingCost ||
              !bookingCostPreview ||
              !!bookingCostError
            }
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2.647-2.647z"
                  />
                </svg>

                Memproses Booking...
              </span>
            ) : (
              isCalculatingBookingCost
                ? "Menghitung Biaya..."
                : bookingCostPreview
                ? `Pilih Metode Pembayaran (${formatCurrency(estimatedBookingTotal)})`
                : "Menunggu Kalkulasi Biaya..."
            )}
          </button>

        </form>
      </div>
    </main>
  );
}