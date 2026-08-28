"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

import { createBooking, confirmPayment } from "@/services/bookingService";
import { fetchAndStoreProfile } from "@/services/profileService";
import { resolveImageUrl } from "@/services/resolveImage";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Home,
  PenSquare,
  ShoppingBag,
} from "lucide-react";

const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
  "Mid-client-wAKHrOkP75pcO3UM";

const MIDTRANS_SCRIPT_SRC =
  "https://app.sandbox.midtrans.com/snap/snap.js";

const CHECKOUT_STORAGE_KEY = "smarthomecare_checkout";

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

export default function BookingPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [form, setForm] = useState({
    date: "",
    time: "",
    notes: "",
  });

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [addressData, setAddressData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // true = user sudah memilih tanggal/jam sendiri
  const [isScheduleManuallyChanged, setIsScheduleManuallyChanged] =
    useState(false);

  const mapDebounceTimer = useRef(null);

  // =========================================================
  // AUTH CHECK
  // =========================================================
  useEffect(() => {
    const isLoggedIn = document.cookie.includes("is_logged_in=true");

    if (!isLoggedIn) {
      router.push("/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // =========================================================
  // UPDATE TANGGAL & JAM SEKARANG
  // =========================================================
  useEffect(() => {
    const updateCurrentDateTime = () => {
      // Kalau user sudah memilih jadwal manual,
      // jangan lagi mengikuti jam sekarang.
      if (isScheduleManuallyChanged) {
        return;
      }

      const { date, time } = getLocalDateTime();

      setForm((prev) => {
        // Kalau nilainya masih sama, tidak perlu update state
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

    // Jalankan langsung saat halaman dibuka
    updateCurrentDateTime();

    // Cek setiap detik agar pergantian menit langsung terbaca
    const interval = setInterval(updateCurrentDateTime, 1000);

    return () => clearInterval(interval);
  }, [isScheduleManuallyChanged]);

  // =========================================================
  // LOAD DATA CHECKOUT
  // =========================================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed) && parsed.length > 0) {
        setCheckoutItems(parsed);
      } else {
        router.push("/keranjang");
      }
    } catch (error) {
      console.error("Gagal membaca item checkout:", error);
      router.push("/keranjang");
    }
  }, [router]);

  // =========================================================
  // LOAD ALAMAT PROFIL
  // =========================================================
  useEffect(() => {
    const loadAddress = async () => {
      setIsLoadingAddress(true);

      try {
        const profile = await fetchAndStoreProfile();
        const pasien = profile?.pasien;
        const alamat = pasien?.alamat_utama;

        if (alamat) {
          setAddressData({
            label: "Alamat Utama",
            receiver: pasien?.nama_lengkap || "Pasien",
            phone: "-",
            address: alamat,
            latitude: pasien?.latitude
              ? parseFloat(pasien.latitude)
              : -6.2088,
            longitude: pasien?.longitude
              ? parseFloat(pasien.longitude)
              : 106.8456,
          });

          setTempAddress(alamat);
        } else {
          setAddressData(null);

          setErrorMessage(
            "Alamat profil belum tersedia. Isi alamat di profil terlebih dahulu."
          );
        }
      } catch (error) {
        console.error("Gagal memuat alamat profil:", error);

        setAddressData(null);

        setErrorMessage(
          "Gagal memuat alamat profil. Silakan coba lagi."
        );
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadAddress();
  }, []);

  // =========================================================
  // HANDLE MAP
  // =========================================================
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

  // =========================================================
  // TOTAL HARGA
  // =========================================================
  const totalPrice = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
      const price =
        Number(item.service?.harga || item.service?.price) || 0;

      const qty = item.qty || 1;

      return acc + price * qty;
    }, 0);
  }, [checkoutItems]);

  // =========================================================
  // MIDTRANS
  // =========================================================
  const loadMidtransScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(
          new Error("Midtrans hanya dapat dijalankan di browser.")
        );
        return;
      }

      if (window.snap) {
        resolve(window);
        return;
      }

      const script = document.createElement("script");

      script.src = MIDTRANS_SCRIPT_SRC;
      script.setAttribute(
        "data-client-key",
        MIDTRANS_CLIENT_KEY
      );
      script.async = true;

      script.onload = () => resolve(window);

      script.onerror = () =>
        reject(
          new Error("Gagal memuat Midtrans Snap script.")
        );

      document.body.appendChild(script);
    });
  };

  // =========================================================
  // HANDLE INPUT
  // =========================================================
  const handleChange = (field) => (event) => {
    const value = event.target.value;

    // Begitu user mengubah tanggal atau jam,
    // anggap user sudah memilih jadwal manual.
    if (field === "date" || field === "time") {
      setIsScheduleManuallyChanged(true);
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // VALIDASI FORM
  // =========================================================
  const isFormValid =
    Boolean(addressData) &&
    checkoutItems.length > 0 &&
    form.date.trim() !== "" &&
    form.time.trim() !== "";

  // =========================================================
  // SUBMIT BOOKING
  // =========================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Format id_layanan:
      // Array jika lebih dari 1
      // Angka jika hanya 1
      const rawIds = checkoutItems
        .map((item) => Number(getServiceId(item.service)))
        .filter((id) => !Number.isNaN(id));

      const idLayananPayload =
        rawIds.length > 1 ? rawIds : rawIds[0];

      const response = await createBooking({
        id_layanan: idLayananPayload,
        tanggal_kunjungan: form.date,
        jam_kunjungan: form.time,
        alamat_kunjungan: addressData.address,
        latitude_kunjungan:
          addressData.latitude || -6.2088,
        longitude_kunjungan:
          addressData.longitude || 106.8456,
        catatan: form.notes,
      });

      const payload =
        response?.data?.data ??
        response?.data ??
        {};

      const snapToken = payload?.snap_token;
      const redirectUrl = payload?.redirect_url;
      const orderId = payload?.order_id;
      const bookingId =
        payload?.booking?.id_booking;

      if (!orderId || !bookingId) {
        throw new Error(
          "Booking tidak tersimpan dengan benar di server."
        );
      }

      // Hapus checkout setelah booking berhasil
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      if (!snapToken) {
        throw new Error(
          "Tidak menerima token pembayaran dari server."
        );
      }

      await loadMidtransScript();

      window.snap?.pay(snapToken, {
        onSuccess: async () => {
          try {
            await confirmPayment({
              id_booking: bookingId,
              order_id: orderId,
            });

            alert(
              "Pembayaran berhasil. Booking tersimpan."
            );

            router.push("/profile");
          } catch (confirmError) {
            console.error(confirmError);

            alert(
              "Pembayaran berhasil, tetapi konfirmasi gagal. Silakan cek riwayat booking."
            );
          }
        },

        onPending: () => {
          alert(
            "Pembayaran tertunda. Silakan selesaikan pembayaran di halaman Midtrans."
          );
        },

        onError: (err) => {
          console.error("Midtrans error:", err);

          setErrorMessage(
            "Pembayaran gagal. Silakan coba lagi."
          );

          setIsSubmitting(false);
        },

        onClose: () => {
          setErrorMessage(
            "Pembayaran dibatalkan. Silakan coba lagi jika ingin menyelesaikan booking."
          );

          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Gagal membuat booking atau memproses pembayaran."
      );

      setIsSubmitting(false);
    }
  };

  // =========================================================
  // AUTH LOADING
  // =========================================================
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-semibold text-lg animate-pulse">
          Memeriksa autentikasi...
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 pb-20">
      <div className="mx-auto max-w-2xl space-y-4">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Layanan
          </h1>
        </div>

        {/* Error */}
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
                    Layanan yang dipilih ({
                      checkoutItems.length
                    })
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/keranjang")
                  }
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

                  const price =
                    Number(
                      s.harga || s.price
                    ) || 0;

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

                        <p className="text-xs text-gray-500">
                          {item.qty}x{" "}
                          {formatCurrency(price)}
                        </p>

                      </div>

                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(
                          price * (item.qty || 1)
                        )}
                      </p>

                    </div>
                  );
                })}

              </div>

              {/* Total */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">

                <span className="text-sm font-medium text-gray-600">
                  Total Biaya Layanan
                </span>

                <span className="text-base font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </span>

              </div>

            </div>
          </div>

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
                        setTempAddress(
                          addressData.address
                        );

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

                    <div className="text-xs text-gray-500 mb-1">
                      Geser pin pada peta di bawah ini
                      untuk mengubah titik lokasi
                      kunjungan, alamat akan
                      diperbarui otomatis.
                    </div>

                    <div className="relative">

                      <MapPicker
                        lat={addressData.latitude}
                        lng={addressData.longitude}
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
                      onChange={(e) =>
                        setTempAddress(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                      rows={3}
                      placeholder="Masukkan alamat kunjungan lengkap"
                    />

                    <div className="flex gap-2 justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          setIsEditingAddress(false)
                        }
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
              !isFormValid || isSubmitting
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>

                Memproses Pembayaran...

              </span>
            ) : (
              `Lanjut Pembayaran (${formatCurrency(
                totalPrice
              )})`
            )}
          </button>

        </form>
      </div>
    </main>
  );
}