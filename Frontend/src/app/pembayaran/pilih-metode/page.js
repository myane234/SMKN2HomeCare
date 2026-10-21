"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiAlertCircle, FiImage } from "react-icons/fi";
import { pembayaranService } from "@/services/pembayaranService";
import { getBiayaTambahanBooking } from "@/services/bookingService";
import api from "@/services/api";

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

function PilihMetodePembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedMetode, setSelectedMetode] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [metodeList, setMetodeList] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [error, setError] = useState("");
  const [methodError, setMethodError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [totalAmount, setTotalAmount] = useState("0");
  const [openCategories, setOpenCategories] = useState({});
  const [pointBalance, setPointBalance] = useState(0);

  const paymentType = searchParams.get("type") || "booking";
  const isBhp = paymentType === "bhp";

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
        router.replace("/login");
      } finally {
        if (!cancelled) setIsCheckingAccess(false);
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, isBhp]);

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
            "Metode pembayaran gagal dimuat. Periksa koneksi API lalu muat ulang halaman."
          );
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    fetchMetode();

    return () => {
      cancelled = true;
    };
  }, [accessAllowed]);

  // --- TAMBAHKAN EFFECT KALKULASI HARGA INI ---
  useEffect(() => {
    let cancelled = false;

    const fetchKalkulasiHarga = async () => {
      if (!bookingId || !selectedMethodId || isBhp) return;

      try {
        setIsCalculating(true);
        const response = await api.post("/api/booking/kalkulasi-harga", {
          id_booking: Number(bookingId),
          id_metode: Number(selectedMethodId),
        });

        const rootData = response?.data?.data ?? response?.data ?? {};

        if (!cancelled) {
          setCalculationDetails(rootData);
          if (rootData.total_akhir) {
            setTotalAmount(String(rootData.total_akhir));
          }
        }
      } catch (err) {
        console.error("Gagal melakukan kalkulasi harga:", err);
      } finally {
        if (!cancelled) setIsCalculating(false);
      }
    };

    fetchKalkulasiHarga();

    return () => {
      cancelled = true;
    };
  }, [bookingId, selectedMethodId, isBhp]);

  const groupByCategory = (list) =>
    list.reduce((acc, item) => {
      const categoryName =
        item.nama_kategori ||
        item.kategori?.nama_kategori ||
        item.kategori?.nama ||
        "Lainnya";

      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(item);

      return acc;
    }, {});

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handlePilihMetode = (metode) => {
    const methodId =
      metode.id_metode ?? metode.id ?? metode.payment_type;

    setSelectedMetode(metode);
    setSelectedMethodId(methodId);
    setError("");
  };

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
      setError(
        "Kode metode pembayaran tidak tersedia dari API."
      );
      return;
    }

    if (!bookingId) {
      setError("Booking ID tidak ditemukan.");
      return;
    }

    if (!Number(totalAmount) || Number(totalAmount) <= 0) {
      setError("Tagihan pembayaran tidak tersedia.");
      return;
    }

    setIsLoading(true);

    const paymentMethod = selectedMetode.payment_type;
    const typeParam = isBhp ? "&type=bhp" : "";
    const codeParam = bookingCode
      ? `&booking_code=${encodeURIComponent(bookingCode)}`
      : "";

    const pointParam =
      pointBalance > 0
        ? `&use_points=true&points_to_use=${encodeURIComponent(pointBalance)}`
        : "&use_points=false";

    router.push(
      `/pembayaran/payment?metode=${encodeURIComponent(paymentMethod)}&booking_id=${encodeURIComponent(bookingId)}${codeParam}&total=${encodeURIComponent(totalAmount)}${typeParam}${pointParam}`
    );
  };

  const formatCurrency = (value) => {
    const num = Number(value);

    if (!Number.isFinite(num) || num <= 0) return "Rp 0";

    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  const getPotonganText = (metode) => {
    if (metode.keterangan) return metode.keterangan;

    const nilai = Number(metode.nilai_potongan);

    if (!Number.isFinite(nilai) || nilai <= 0) return "";

    return metode.tipe_potongan === "persen"
      ? `Admin: ${nilai}%`
      : `Admin: Rp ${nilai.toLocaleString("id-ID")}`;
  };

  const groupedMetode = groupByCategory(metodeList);

  if (isCheckingAccess || !accessAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-sky-600" />
          <p className="mt-4 text-sm text-slate-500">
            Memeriksa akses pembayaran...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800">
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

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col-reverse items-start justify-between gap-8 lg:flex-row">
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

          <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[400px]">
            <div className="rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 p-6 text-white shadow-md sm:p-8">
              <p className="text-xs font-medium tracking-wide text-sky-50 sm:text-sm">
                {isBhp ? "Total BHP Tambahan" : "Total Pembayaran"}
              </p>

             {/* Angka Total Pembayaran */}
  <p className="mb-2 mt-1 text-2xl font-bold sm:text-3xl">
    {calculationDetails?.total_akhir_format || formatCurrency(totalAmount)}
  </p>

  {/* --- RINCIAN BIAYA LENGKAP DARIPADA RESPONSE API --- */}
  {calculationDetails?.rincian_biaya && (
    <div className="mb-6 space-y-1.5 border-t border-white/20 pt-4 text-xs sm:text-sm text-sky-50">
      {/* 1. Subtotal Layanan (sl) */}
      {Number(calculationDetails.rincian_biaya.sl) > 0 && (
        <div className="flex justify-between">
          <span>Subtotal Layanan:</span>
          <span>{formatCurrency(calculationDetails.rincian_biaya.sl)}</span>
        </div>
      )}

      {/* 2. Subtotal Bahan / Alat (sb) */}
      {Number(calculationDetails.rincian_biaya.sb) > 0 && (
        <div className="flex justify-between">
          <span>Subtotal Alat / Bahan:</span>
          <span>{formatCurrency(calculationDetails.rincian_biaya.sb)}</span>
        </div>
      )}

      {/* 3. Subtotal Transport (st) */}
      {Number(calculationDetails.rincian_biaya.st) > 0 && (
        <div className="flex justify-between">
          <span>Biaya Transport:</span>
          <span>{formatCurrency(calculationDetails.rincian_biaya.st)}</span>
        </div>
      )}

      {/* 4. Biaya Aplikasi / Admin System (ba) */}
      {Number(calculationDetails.rincian_biaya.ba) > 0 && (
        <div className="flex justify-between">
          <span>Biaya Aplikasi:</span>
          <span>{formatCurrency(calculationDetails.rincian_biaya.ba)}</span>
        </div>
      )}

      {/* 5. PPN (ppn) */}
      {Number(calculationDetails.rincian_biaya.ppn) > 0 && (
        <div className="flex justify-between">
          <span>PPN:</span>
          <span>{formatCurrency(calculationDetails.rincian_biaya.ppn)}</span>
        </div>
      )}

      {/* Garis Pemisah untuk Total Dasar */}
      <div className="my-1 border-t border-white/10" />

      {/* 6. Total Dasar */}
      <div className="flex justify-between font-medium text-white">
        <span>Total dasar:</span>
        <span>{formatCurrency(calculationDetails.rincian_biaya.total_dasar)}</span>
      </div>

 {/* 7. Biaya Metode Pembayaran (Font diperbesar jadi lebih besar) */}
      {calculationDetails.rincian_biaya.biaya_metode_pembayaran !== undefined && (
        <div className="flex justify-between text-base font-bold text-white">
          <span className="truncate pr-2">
            Biaya Metode Pembayaran:
          </span>
          <span>
            {calculationDetails.rincian_biaya.biaya_metode_pembayaran === 0
              ? "Rp 0"
              : formatCurrency(calculationDetails.rincian_biaya.biaya_metode_pembayaran)}
          </span>
        </div>
      )}
    </div>
  )}

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200/40 bg-red-500/20 p-3 text-xs text-white">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

             <button
                type="button"
                onClick={handleLanjutkanPembayaran}
                disabled={
                  isLoading ||
                  isFetching ||
                  isCalculating ||
                  !!methodError ||
                  !selectedMetode
                }
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition sm:text-base ${
                  isLoading ||
                  isFetching ||
                  isCalculating ||
                  !!methodError ||
                  !selectedMetode
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
              {/* ========================================================= */}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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