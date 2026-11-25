"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiAlertCircle, FiImage } from "react-icons/fi";

import { pembayaranService } from "@/services/pembayaranService";

import {
  getBiayaTambahanBooking,
  getBookingCostPreview,
  getKalkulasiBiayaBooking,
} from "@/services/bookingService";

import api from "@/services/api";

/* =========================================================
   HELPER LOGO
========================================================= */

const resolvePaymentLogoUrl = (logo) => {
  const value = String(logo ?? "").trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const path = value.startsWith("/")
    ? value
    : `/storage/${value.replace(/^storage\/+/, "")}`;

  const apiBaseUrl = api?.defaults?.baseURL;

  if (apiBaseUrl && /^https?:\/\//i.test(apiBaseUrl)) {
    try {
      return new URL(path, apiBaseUrl).toString();
    } catch {
      return path;
    }
  }

  return path;
};

/* =========================================================
   LOGO METODE PEMBAYARAN
========================================================= */

function PaymentMethodLogo({ logo, alt }) {
  const src = resolvePaymentLogoUrl(logo);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white p-1">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <FiImage
          className="h-5 w-5 text-slate-300"
          aria-label="Logo belum tersedia"
        />
      )}
    </div>
  );
}

/* =========================================================
   MAIN CONTENT
========================================================= */

function PilihMetodePembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* =========================================================
     STATE METODE PEMBAYARAN
  ========================================================= */

  const [selectedMetode, setSelectedMetode] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  const [metodeList, setMetodeList] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  /* =========================================================
     STATE KALKULASI
  ========================================================= */

  const [calculationDetails, setCalculationDetails] = useState(null);
  const [calculationError, setCalculationError] = useState("");
  const [calculatedMethodId, setCalculatedMethodId] = useState(null);

  /* =========================================================
     STATE AKSES
  ========================================================= */

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);

  const [error, setError] = useState("");
  const [methodError, setMethodError] = useState("");

  /* =========================================================
     BOOKING
  ========================================================= */

  const [bookingId, setBookingId] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [totalAmount, setTotalAmount] = useState("0");

  const [openCategories, setOpenCategories] = useState({});

  const [pointBalance, setPointBalance] = useState(0);

  const paymentType = searchParams.get("type") || "booking";
  const isBhp = paymentType === "bhp";

  /* =========================================================
     CHECK ACCESS & GET BOOKING
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        setIsCheckingAccess(true);
        setError("");

        const profileRes = await api.get("/api/profile/me");

        const userData =
          profileRes?.data?.data ?? profileRes?.data ?? {};

        const availablePoints = Number(
          userData.points ??
            userData.point ??
            userData.saldo_poin ??
            0
        );

        setPointBalance(
          Number.isFinite(availablePoints) ? availablePoints : 0
        );

        const urlBookingId =
          searchParams.get("booking_id") ||
          searchParams.get("id_booking") ||
          searchParams.get("id") ||
          searchParams.get("bookingId") ||
          "";

        const urlBookingCode =
          searchParams.get("booking_code") ||
          searchParams.get("kode_booking") ||
          "";

        if (!urlBookingId) {
          router.replace("/booking/aktif");
          return;
        }

        let serverAmount = 0;
        let serverCode = urlBookingCode;

        /* =====================================================
           BHP TAMBAHAN
        ====================================================== */

        if (isBhp) {
          const ref = urlBookingCode || urlBookingId;

          const response = await getBiayaTambahanBooking(ref);

          const root =
            response?.data?.data ??
            response?.data ??
            response ??
            {};

          serverAmount = Number(
            root?.nominal ??
              root?.amount ??
              root?.total ??
              root?.nominal_tambahan ??
              root?.biaya_tambahan_pasien?.nominal ??
              0
          );

          serverCode =
            serverCode ||
            root?.booking_code ||
            root?.kode_booking ||
            "";

          const status = String(
            root?.status_transaksi ??
              root?.status_pembayaran ??
              root?.status ??
              root?.biaya_tambahan_pasien?.status_transaksi ??
              ""
          ).toLowerCase();

          if (
            serverAmount <= 0 ||
            status.includes("lunas") ||
            status.includes("paid") ||
            status.includes("settlement")
          ) {
            router.replace(
              `/booking/aktif?id=${encodeURIComponent(urlBookingId)}`
            );
            return;
          }
        } else {
          /* =====================================================
             BOOKING NORMAL
          ====================================================== */

          const response = await api.get(
            `/api/booking/${encodeURIComponent(urlBookingId)}/payment-details`
          );

          const root =
            response?.data?.data ?? response?.data ?? {};

          serverAmount = Number(
            root?.jumlah_total ??
              root?.total ??
              root?.gross_amount ??
              root?.amount ??
              0
          );

          serverCode =
            serverCode ||
            root?.booking_code ||
            root?.kode_booking ||
            "";

          const bookingStatus = String(
            root?.status_transaksi ??
              root?.status_pembayaran ??
              ""
          ).toLowerCase();

          if (
            bookingStatus.includes("lunas") ||
            bookingStatus.includes("paid") ||
            bookingStatus.includes("settlement") ||
            bookingStatus.includes("success")
          ) {
            router.replace(
              `/booking/aktif?id=${encodeURIComponent(urlBookingId)}`
            );
            return;
          }

          if (!serverAmount || serverAmount <= 0) {
            router.replace(
              `/booking/aktif?id=${encodeURIComponent(urlBookingId)}`
            );
            return;
          }
        }

        if (cancelled) return;

        setBookingId(String(urlBookingId));
        setBookingCode(String(serverCode || ""));
        setTotalAmount(String(serverAmount));

        setAccessAllowed(true);
      } catch (error) {
        console.error("Akses pembayaran ditolak:", error);

        if (!cancelled) {
          if (error?.response?.status === 401) {
            router.replace("/login");
          } else {
            setError(
              error?.response?.data?.message ||
                error?.message ||
                "Gagal memeriksa akses pembayaran."
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsCheckingAccess(false);
        }
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, isBhp]);

  /* =========================================================
     GET METODE PEMBAYARAN
  ========================================================= */

  useEffect(() => {
    if (!accessAllowed) return;

    let cancelled = false;

    const fetchMetode = async () => {
      try {
        setIsFetching(true);
        setMethodError("");

        const response = await pembayaranService.getMetode();

        const candidates = [
          response?.data?.data,
          response?.data,
          response?.methods,
          response,
        ];

        const rawData = candidates.find(Array.isArray);

        if (!rawData) {
          throw new Error(
            "Format response metode pembayaran tidak sesuai."
          );
        }

        const activeMethods = rawData.filter(
          (method) =>
            method &&
            method.is_active !== false &&
            method.is_active !== 0 &&
            method.is_active !== "0"
        );

        if (cancelled) return;

        setMetodeList(activeMethods);

        if (activeMethods.length === 0) {
          setMethodError(
            "Belum ada metode pembayaran aktif yang tersedia."
          );
        }
      } catch (error) {
        console.error("Gagal mengambil metode pembayaran:", error);

        if (!cancelled) {
          setMetodeList([]);

          setMethodError(
            error?.response?.data?.message ||
              "Metode pembayaran gagal dimuat. Periksa koneksi API lalu muat ulang halaman."
          );
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchMetode();

    return () => {
      cancelled = true;
    };
  }, [accessAllowed]);

  /* =========================================================
     KALKULASI HARGA BERDASARKAN METODE

     - Ambil rincian transaksi dan estimasi transport bersamaan.
     - ST transaksi menjadi prioritas.
     - Jika ST transaksi masih nol, gunakan estimasi transport terbaru.
     - Preview hanya untuk tampilan; charge backend tetap sumber tagihan resmi.
  ========================================================= */

  useEffect(() => {
    if (!bookingId || !selectedMethodId || isBhp) return;

    let cancelled = false;

    const isTruthy = (value) =>
      value === true || value === 1 || value === "1" || value === "true";

    const calculatePrice = async () => {
      setIsCalculating(true);
      setCalculationDetails(null);
      setCalculatedMethodId(null);
      setCalculationError("");
      setError("");

      try {
        const cachedPreview = getBookingCostPreview(bookingId);
        const costRequest = cachedPreview?.request ?? null;

        // Kedua request dijalankan bersamaan agar proses lebih efisien.
        const [priceResult, transportResult] = await Promise.allSettled([
          pembayaranService.kalkulasiHarga({
            id_booking: Number(bookingId),
            id_metode: Number(selectedMethodId),
          }),
          costRequest
            ? getKalkulasiBiayaBooking(costRequest)
            : Promise.resolve(null),
        ]);

        // Kalkulasi harga transaksi adalah request wajib.
        if (priceResult.status === "rejected") {
          throw priceResult.reason;
        }

        const priceResponse = priceResult.value;
        const priceBody = priceResponse?.data ?? priceResponse ?? {};
        const priceData = priceBody?.data ?? priceBody;

        if (priceBody?.success === false || !priceData?.rincian_biaya) {
          throw new Error(
            priceBody?.message || "Kalkulasi harga gagal."
          );
        }

        const serverDetails = priceData.rincian_biaya;
        const parsedServerSt = Number(serverDetails.st);

        if (!Number.isFinite(parsedServerSt) || parsedServerSt < 0) {
          throw new Error("Nilai ST transaksi tidak valid.");
        }

        const serverSt = parsedServerSt;

        // Parse estimasi transport terbaru jika request berhasil.
        let transportData = null;

        if (transportResult.status === "fulfilled" && transportResult.value) {
          const transportResponse = transportResult.value;
          const transportBody =
            transportResponse?.data ?? transportResponse ?? {};
          const parsedTransportData =
            transportBody?.data ?? transportBody;

          if (
            transportBody?.success !== false &&
            parsedTransportData?.rincian_biaya
          ) {
            transportData = parsedTransportData;
          }
        }

        // Bila ST belum tersimpan, preview terbaru wajib tersedia.
        if (serverSt <= 0 && !transportData?.rincian_biaya) {
          if (!costRequest) {
            throw new Error(
              "Data layanan dan koordinat booking tidak ditemukan. Silakan ulangi booking dari halaman layanan terbaru."
            );
          }

          const transportError =
            transportResult.status === "rejected"
              ? transportResult.reason
              : null;

          throw new Error(
            transportError?.response?.data?.message ||
              transportError?.message ||
              "Gagal menghitung estimasi biaya transport. Periksa koordinat lokasi dan ketersediaan nakes."
          );
        }

        const serviceRows = Array.isArray(transportData?.layanan)
          ? transportData.layanan
          : [];

        const requiresTransport = serviceRows.some((item) =>
          isTruthy(item?.is_transport)
        );

        const rawAvailableNakes = transportData?.transport?.nakes_tersedia;
        const hasNakesAvailability =
          rawAvailableNakes !== null && rawAvailableNakes !== undefined;
        const availableNakes = Number(rawAvailableNakes);

        if (
          serverSt <= 0 &&
          requiresTransport &&
          hasNakesAvailability &&
          Number.isFinite(availableNakes) &&
          availableNakes <= 0
        ) {
          throw new Error(
            transportData?.transport?.peringatan ||
              "Belum tersedia nakes untuk lokasi dan kategori layanan ini."
          );
        }

        const parsedPreviewSt = Number(
          transportData?.rincian_biaya?.st ?? 0
        );

        if (!Number.isFinite(parsedPreviewSt) || parsedPreviewSt < 0) {
          throw new Error("Nilai estimasi ST dari server tidak valid.");
        }

        // Jangan menimpa ST transaksi yang sudah ditetapkan backend.
        const finalSt = serverSt > 0 ? serverSt : parsedPreviewSt;

        if (requiresTransport && finalSt <= 0) {
          throw new Error(
            transportData?.transport?.peringatan ||
              "Biaya transport belum berhasil dihitung. Periksa alamat dan ketersediaan nakes."
          );
        }

        const sl = Number(serverDetails.sl) || 0;
        const sb = Number(serverDetails.sb) || 0;
        const ba = Number(serverDetails.ba) || 0;
        const ppn = Number(serverDetails.ppn) || 0;
        const totalDasar = sl + sb + finalSt + ba + ppn;

        const methodData =
          priceData.metode_pembayaran || selectedMetode || {};

        const rawNilaiPotongan = methodData.nilai_potongan;
        const nilaiPotongan =
          rawNilaiPotongan === null ||
          rawNilaiPotongan === undefined ||
          rawNilaiPotongan === ""
            ? 0
            : Math.max(0, Number(rawNilaiPotongan) || 0);

        const tipePotongan = String(
          methodData.tipe_potongan || "nominal"
        ).toLowerCase();

        const rawFee =
          tipePotongan === "persen"
            ? totalDasar * (Math.min(100, nilaiPotongan) / 100)
            : nilaiPotongan;

        const biayaMetode = Math.round(rawFee);
        const totalAkhir = Math.round(totalDasar + rawFee);

        if (!Number.isFinite(totalAkhir) || totalAkhir <= 0) {
          throw new Error("Total pembayaran tidak valid.");
        }

        const keteranganBiayaMetode =
          tipePotongan === "persen"
            ? `${nilaiPotongan}% dari total dasar`
            : nilaiPotongan > 0
            ? `Biaya tetap Rp ${nilaiPotongan.toLocaleString("id-ID")}`
            : "Gratis (tidak ada biaya tambahan)";

        const finalResult = {
          ...priceData,
          rincian_biaya: {
            ...serverDetails,
            sl,
            sb,
            st: finalSt,
            ba,
            ppn,
            total_dasar: totalDasar,
            biaya_metode_pembayaran: biayaMetode,
            keterangan_biaya_metode: keteranganBiayaMetode,
          },
          total_akhir: totalAkhir,
          total_akhir_format: `Rp ${totalAkhir.toLocaleString("id-ID")}`,
          preview_transport: transportData?.transport ?? null,
        };

        if (cancelled) return;

        setCalculationDetails(finalResult);
        setCalculatedMethodId(String(selectedMethodId));
        setTotalAmount(String(totalAkhir));
      } catch (error) {
        console.error("Gagal menghitung biaya pembayaran:", error);

        if (!cancelled) {
          setCalculationDetails(null);
          setCalculatedMethodId(null);
          setCalculationError(
            error?.response?.data?.message ||
              error?.message ||
              "Gagal menghitung biaya pembayaran."
          );
        }
      } finally {
        if (!cancelled) {
          setIsCalculating(false);
        }
      }
    };

    calculatePrice();

    return () => {
      cancelled = true;
    };
  }, [bookingId, selectedMethodId, isBhp]);

  /* =========================================================
     GROUP METODE PEMBAYARAN
  ========================================================= */

  const groupByCategory = (list) =>
    list.reduce((acc, item) => {
      const categoryName =
        item.nama_kategori ||
        item.kategori?.nama_kategori ||
        item.kategori?.nama ||
        "Lainnya";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }

      acc[categoryName].push(item);

      return acc;
    }, {});

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  /* =========================================================
     PILIH METODE
  ========================================================= */

  const handlePilihMetode = (metode) => {
    const methodId =
      metode.id_metode ??
      metode.id ??
      metode.payment_type;

    if (!methodId) {
      setError("ID metode pembayaran tidak valid.");
      return;
    }

    setSelectedMetode(metode);
    setSelectedMethodId(Number(methodId));

    // Bersihkan hasil kalkulasi metode sebelumnya.
    setCalculationDetails(null);
    setCalculatedMethodId(null);
    setCalculationError("");
    setError("");
  };

  /* =========================================================
     LANJUTKAN PEMBAYARAN
  ========================================================= */

  const handleLanjutkanPembayaran = () => {
    if (!accessAllowed) {
      setError("Akses pembayaran tidak valid.");
      return;
    }

    if (!selectedMetode) {
      setError("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    if (!selectedMetode.payment_type) {
      setError("Kode metode pembayaran tidak tersedia dari API.");
      return;
    }

    if (!bookingId) {
      setError("Booking ID tidak ditemukan.");
      return;
    }

    if (isCalculating) {
      setError("Tunggu sampai kalkulasi harga selesai.");
      return;
    }

    if (
      !isBhp &&
      (
        !calculationDetails ||
        calculatedMethodId !== String(selectedMethodId)
      )
    ) {
      setError(
        calculationError || "Kalkulasi harga belum berhasil."
      );
      return;
    }

    const finalAmount = isBhp
      ? Number(totalAmount)
      : Number(calculationDetails?.total_akhir);

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      setError("Tagihan pembayaran tidak valid.");
      return;
    }

    setIsLoading(true);

    const params = new URLSearchParams({
      metode: selectedMetode.payment_type,
      booking_id: bookingId,
      total: String(finalAmount),
    });

    if (bookingCode) {
      params.set("booking_code", bookingCode);
    }

    if (isBhp) {
      params.set("type", "bhp");
    }

    router.push(
      `/pembayaran/payment?${params.toString()}`
    );
  };

  /* =========================================================
     FORMAT RUPIAH
  ========================================================= */

  const formatCurrency = (value) => {
    const num = Number(value);

    if (!Number.isFinite(num)) {
      return "Rp 0";
    }

    return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
  };

  const getPotonganText = (metode) => {
    if (metode.keterangan) {
      return metode.keterangan;
    }

    const nilai = Number(metode.nilai_potongan);

    if (!Number.isFinite(nilai) || nilai <= 0) {
      return "";
    }

    return metode.tipe_potongan === "persen"
      ? `Admin: ${nilai}%`
      : `Admin: Rp ${nilai.toLocaleString("id-ID")}`;
  };

  const groupedMetode = groupByCategory(metodeList);

  /* =========================================================
     LOADING
  ========================================================= */

  if (isCheckingAccess || !accessAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-sky-600" />

          <p className="mt-4 text-sm text-slate-500">
            Memeriksa akses pembayaran...
          </p>

          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800">

      {/* HEADER */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full p-2 transition hover:bg-slate-100"
            >
              <FiArrowLeft className="h-5 w-5 text-slate-600" />
            </button>

            <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
              Pilih Metode Pembayaran
            </h1>

          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div className="flex flex-col-reverse items-start justify-between gap-8 lg:flex-row">

          {/* =====================================================
              LEFT: METODE PEMBAYARAN
          ====================================================== */}

          <div className="w-full lg:flex-1">

            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pilih Pembayaran
              </p>
            </div>

            {isFetching ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Memuat metode pembayaran...
                </p>
              </div>
            ) : methodError ? (
              <div
                role="alert"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm"
              >
                <FiAlertCircle className="mx-auto mb-3 h-6 w-6 text-slate-400" />

                {methodError}
              </div>
            ) : (
              <div className="space-y-4">

                {Object.entries(groupedMetode).map(
                  ([categoryName, items]) => {
                    const isOpen = !!openCategories[categoryName];

                    return (
                      <div
                        key={categoryName}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >

                        <button
                          type="button"
                          onClick={() => toggleCategory(categoryName)}
                          className="flex w-full items-center justify-between bg-white px-5 py-4 text-left transition hover:bg-slate-50"
                        >
                          <span className="text-base font-bold text-slate-800">
                            {categoryName}
                          </span>

                          <div
                            className={`transform text-slate-400 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/40">

                            {items.map((metode) => {
                              const methodId =
                                metode.id_metode ??
                                metode.id ??
                                metode.payment_type;

                              const isSelected =
                                selectedMethodId !== null &&
                                String(selectedMethodId) ===
                                  String(methodId);

                              return (
                                <button
                                  type="button"
                                  key={String(methodId)}
                                  onClick={() =>
                                    handlePilihMetode(metode)
                                  }
                                  className={`flex w-full items-center justify-between p-4 text-left transition ${
                                    isSelected
                                      ? "bg-sky-50/80"
                                      : "bg-white hover:bg-slate-100/60"
                                  }`}
                                >

                                  <div className="flex min-w-0 items-center gap-4 pr-2">

                                    <PaymentMethodLogo
                                      logo={metode.logo}
                                      alt={
                                        metode.nama_metode ||
                                        metode.nama ||
                                        "Metode Pembayaran"
                                      }
                                    />

                                    <div className="min-w-0">
                                      <p className="text-sm font-bold leading-snug text-slate-800">
                                        {metode.nama_metode ||
                                          metode.nama}
                                      </p>

                                      {getPotonganText(metode) && (
                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                          {getPotonganText(metode)}
                                        </p>
                                      )}
                                    </div>

                                  </div>

                                  <div className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border">
                                    {isSelected && (
                                      <div className="h-2 w-2 rounded-full bg-sky-500" />
                                    )}
                                  </div>

                                </button>
                              );
                            })}

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* =====================================================
              RIGHT: RINCIAN BIAYA
          ====================================================== */}

          <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[400px]">

            <div className="rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 p-6 text-white shadow-md sm:p-8">

              <p className="text-xs font-medium tracking-wide text-sky-50 sm:text-sm">
                {isBhp ? "Total BHP Tambahan" : "Total Pembayaran"}
              </p>

              {/* TOTAL */}
              <p className="mb-2 mt-1 text-2xl font-bold sm:text-3xl">
                {isBhp
                  ? formatCurrency(totalAmount)
                  : isCalculating
                  ? "Menghitung..."
                  : calculationDetails?.total_akhir_format ||
                    "Pilih metode"}
              </p>

              {isBhp && (
                <p className="border-t border-white/20 pt-3 text-xs text-sky-50">
                  Tagihan BHP tambahan berdasarkan data server.
                </p>
              )}

              {/* ERROR KALKULASI */}
              {!isBhp &&
                calculationError &&
                !isCalculating && (
                  <div className="mb-4 rounded-xl border border-red-200/40 bg-red-500/20 p-3 text-xs text-white">
                    {calculationError}
                  </div>
                )}

              {/* RINCIAN BIAYA */}
              {!isBhp &&
                calculationDetails?.rincian_biaya && (
                  <div className="mb-6 space-y-1.5 border-t border-white/20 pt-4 text-xs text-sky-50 sm:text-sm">

                    <div className="flex justify-between gap-3">
                      <span>Subtotal Layanan (SL):</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.sl
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Subtotal Alat / Bahan (SB):</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.sb
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Biaya Transport (ST):</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.st
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Biaya Aplikasi (BA):</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.ba
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>PPN:</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.ppn
                        )}
                      </span>
                    </div>

                    <div className="my-1 border-t border-white/10" />

                    <div className="flex justify-between gap-3 font-semibold text-white">
                      <span>Total dasar:</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.total_dasar
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 pt-1 text-base font-bold text-white">
                      <span>Biaya Metode Pembayaran:</span>
                      <span>
                        {formatCurrency(
                          calculationDetails.rincian_biaya.biaya_metode_pembayaran
                        )}
                      </span>
                    </div>

                    {calculationDetails.rincian_biaya.keterangan_biaya_metode && (
                      <p className="pt-1 text-[11px] text-sky-100">
                        {calculationDetails.rincian_biaya.keterangan_biaya_metode}
                      </p>
                    )}

                  </div>
                )}

              {/* GENERAL ERROR */}
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200/40 bg-red-500/20 p-3 text-xs text-white">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* BAYAR */}
              <button
                type="button"
                onClick={handleLanjutkanPembayaran}
                disabled={
                  isLoading ||
                  isFetching ||
                  isCalculating ||
                  !!methodError ||
                  !!calculationError ||
                  !selectedMetode ||
                  (
                    !isBhp &&
                    (
                      !calculationDetails ||
                      calculatedMethodId !== String(selectedMethodId)
                    )
                  )
                }
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition sm:text-base ${
                  isLoading ||
                  isFetching ||
                  isCalculating ||
                  !!methodError ||
                  !!calculationError ||
                  !selectedMetode ||
                  (
                    !isBhp &&
                    (
                      !calculationDetails ||
                      calculatedMethodId !== String(selectedMethodId)
                    )
                  )
                    ? "cursor-not-allowed border border-white/20 bg-white/30 text-white/70"
                    : "bg-sky-600 shadow-lg hover:bg-sky-700 active:scale-[0.99]"
                }`}
              >
                {isLoading || isCalculating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Bayar"
                )}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

export default function PilihMetodePembayaranPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-sky-600" />
        </div>
      }
    >
      <PilihMetodePembayaranContent />
    </Suspense>
  );
}