"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiCopy, FiCheckCircle, FiCreditCard, FiAlertCircle } from "react-icons/fi";
import api from "@/services/api";
import { getBiayaTambahanBooking, chargeBiayaTambahan } from "@/services/bookingService";

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawMetodeParam = searchParams.get("metode") || "";
  const metodeParam = rawMetodeParam === "bank_transfer" ? rawMetodeParam : rawMetodeParam.replace(/_(va|transfer)$/, "");
  const bookingParam = searchParams.get("booking_id") || "";
  const bookingCodeParam = searchParams.get("booking_code") || "";
  const paymentType = searchParams.get("type") || "booking";
  const isBiayaTambahan = paymentType === "bhp";
  const urlTotalParam = parseInt(searchParams.get("total") || searchParams.get("price") || "0", 10);

  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(urlTotalParam);
  const [bookingId, setBookingId] = useState(bookingParam);
  const [metode, setMetode] = useState(metodeParam);
  const [paymentData, setPaymentData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState("");
  const [statusText, setStatusText] = useState("Menunggu Pembayaran");
  const [fixedQrUrl, setFixedQrUrl] = useState("");
  const [expiredAt, setExpiredAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [virtualAccountNumber, setVirtualAccountNumber] = useState("");
  const requestRef = useRef("");

  useEffect(() => {
    const requestKey = `${bookingParam}:${bookingCodeParam}:${metodeParam}:${urlTotalParam}:${paymentType}`;

    if (requestRef.current === requestKey) return;
    requestRef.current = requestKey;

    const fetchPaymentInfo = async () => {
      try {
        setIsLoadingApi(true);
        setApiError("");

        await api.get("/api/profile/me");

        if (!bookingParam) {
          throw new Error("Parameter booking_id tidak ditemukan.");
        }

        let finalAmount = urlTotalParam;

        if (isBiayaTambahan) {
          const biayaRef = bookingCodeParam || bookingParam;
          const feeResponse = await getBiayaTambahanBooking(biayaRef);
          const root = feeResponse?.data?.data ?? feeResponse?.data ?? feeResponse ?? {};

          finalAmount = Number(
            root?.nominal ??
            root?.amount ??
            root?.total ??
            root?.nominal_tambahan ??
            root?.biaya_tambahan_pasien?.nominal ??
            0
          );

          const currentStatus = String(
            root?.status_transaksi ??
            root?.status_pembayaran ??
            root?.status ??
            root?.biaya_tambahan_pasien?.status_transaksi ??
            ""
          ).toLowerCase();

          if (!finalAmount || finalAmount <= 0) {
            throw new Error("Biaya tambahan tidak ditemukan.");
          }

          if (currentStatus.includes("lunas") || currentStatus.includes("paid") || currentStatus.includes("settlement")) {
            router.replace(`/booking/aktif?id=${encodeURIComponent(bookingParam)}`);
            return;
          }
        }

        if (!isBiayaTambahan && (!finalAmount || finalAmount <= 0)) {
          throw new Error("Jumlah total pembayaran tidak ditemukan.");
        }

        setAmount(finalAmount);

        const bankList = ["bca", "bri", "bni", "seabank"];
        const isBankTransfer = bankList.includes(metodeParam);
        const backendPaymentType = isBankTransfer ? "bank_transfer" : metodeParam;

        let response;

        if (isBiayaTambahan) {
          const callbackUrl = `${window.location.origin}/pembayaran/payment-confirmation/success?booking_id=${encodeURIComponent(bookingParam)}&booking_code=${encodeURIComponent(bookingCodeParam)}&type=bhp&metode=${encodeURIComponent(metodeParam)}`;

          response = await chargeBiayaTambahan({
            id_booking: bookingParam,
            payment_type: backendPaymentType,
            callback_url: callbackUrl,
          });
        } else {
          const payload = {
            id_booking: bookingParam,
            payment_type: backendPaymentType,
            total: finalAmount,
            amount: finalAmount,
            gross_amount: finalAmount,
          };

          if (isBankTransfer) {
            payload.bank_transfer = { bank: metodeParam };
          }

          if (metodeParam === "gopay") {
            payload.gopay = {
              enable_callback: true,
              callback_url: `${window.location.origin}/pembayaran/payment-confirmation/success?booking_id=${encodeURIComponent(bookingParam)}`,
            };
          }

          if (metodeParam === "shopeepay") {
            payload.shopeepay = {
              callback_url: `${window.location.origin}/pembayaran/payment-confirmation/success?booking_id=${encodeURIComponent(bookingParam)}`,
            };
          }

          if (metodeParam === "dana") {
            payload.dana = {};
          }

          const res = await api.post("/api/booking/charge", payload);
          response = res.data;
        }

        const responseBody = response?.data ?? response ?? {};
        const resData = responseBody?.data ?? responseBody;

        const vaNumber =
          resData?.va_numbers?.[0]?.va_number ||
          responseBody?.va_numbers?.[0]?.va_number ||
          resData?.payment_details?.virtual_account?.va_number ||
          resData?.va_number ||
          resData?.virtual_number ||
          "";

        setPaymentData(resData);
        setVirtualAccountNumber(String(vaNumber));

        if (finalAmount > 0) {
          setAmount(finalAmount);
        } else {
          const responseAmount = Number(
            resData?.jumlah_total ||
            resData?.gross_amount ||
            resData?.total ||
            resData?.amount ||
            0
          );

          if (responseAmount > 0) {
            setAmount(responseAmount);
          }
        }

        const redirectUrl =
          resData?.actions?.find((action) => action?.name === "deeplink-redirect")?.url ||
          resData?.actions?.[0]?.url ||
          resData?.qr_url ||
          resData?.payment_details?.qris?.qr_url ||
          resData?.qris_url ||
          resData?.url ||
          "";

        if (redirectUrl) {
          setFixedQrUrl(redirectUrl);
        }

        if (isBiayaTambahan) {
          const generatedOrderId =
            resData?.order_id ||
            resData?.transaction_id ||
            responseBody?.order_id ||
            responseBody?.transaction_id ||
            bookingCodeParam ||
            bookingParam;

          setOrderId(String(generatedOrderId));
          setStatusText(resData?.status_transaksi || responseBody?.status_transaksi || "Menunggu Pembayaran");
        } else {
          try {
            const detailRes = await api.get(`/api/booking/${bookingParam}/payment-details`);
            const detailData = detailRes.data?.data || detailRes.data;

            setOrderId(detailData?.booking_code || resData?.order_id || bookingCodeParam || bookingParam);

            if (detailData?.status_transaksi) {
              setStatusText(detailData.status_transaksi);
            }

            if (detailData?.metode_pembayaran) {
              setMetode(detailData.metode_pembayaran.toLowerCase());
            }
          } catch (detailError) {
            console.error("Gagal mengambil detail booking:", detailError);
            setOrderId(resData?.order_id || bookingCodeParam || bookingParam);
          }
        }

        setBookingId(bookingParam);

        const expiry = resData?.expiry_time || resData?.expired_at;
        setExpiredAt(expiry ? new Date(expiry) : new Date(Date.now() + 5 * 60 * 1000));
      } catch (err) {
        console.error("Gagal memproses pembayaran:", err);
        setApiError(err?.response?.data?.message || err?.message || "Gagal memproses pembayaran.");
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchPaymentInfo();
  }, [bookingParam, bookingCodeParam, metodeParam, urlTotalParam, paymentType, router, isBiayaTambahan]);

  useEffect(() => {
    if (!expiredAt) return;

    const calculateTimeLeft = () => {
      const diff = Math.max(0, Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000));

      setTimeLeft(diff);

      if (diff === 0) {
        setIsExpired(true);
        setStatusText("Waktu Pembayaran Habis");
      }
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiredAt]);

  useEffect(() => {
    if (!bookingId || isExpired) return;

    const checkPaymentStatus = async () => {
      try {
        if (isBiayaTambahan) {
          const ref = bookingCodeParam || bookingId;
          const res = await getBiayaTambahanBooking(ref);
          const root = res?.data?.data ?? res?.data ?? res ?? {};

          const status = String(
            root?.status_transaksi ??
            root?.status_pembayaran ??
            root?.status ??
            root?.biaya_tambahan_pasien?.status_transaksi ??
            "Belum Bayar"
          );

          setStatusText(status);

          const lower = status.toLowerCase();

          if (lower.includes("lunas") || lower.includes("paid") || lower.includes("settlement") || lower.includes("success")) {
            router.replace(`/pembayaran/payment-confirmation/success?booking_id=${encodeURIComponent(bookingId)}&booking_code=${encodeURIComponent(bookingCodeParam)}&type=bhp&metode=${encodeURIComponent(metodeParam)}`);
          }

          return;
        }

        const res = await api.get(`/api/booking/${bookingId}/payment-details`);
        const body = res.data?.data || res.data;
        const status = body?.status_transaksi || "Menunggu Pembayaran";

        setStatusText(status);

        const lower = status.toLowerCase();

        if (lower.includes("sudah bayar") || lower.includes("success") || lower.includes("paid") || lower.includes("settlement") || lower.includes("lunas")) {
          router.push(`/pembayaran/payment-confirmation/success?booking_id=${encodeURIComponent(bookingId)}&order_id=${encodeURIComponent(orderId)}&total=${encodeURIComponent(amount)}`);
        }
      } catch (err) {
        console.error("Gagal mengecek status pembayaran:", err);
      }
    };

    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [bookingId, bookingCodeParam, orderId, router, amount, isExpired, isBiayaTambahan, metodeParam]);

  const methods = {
    qris: { name: "QRIS", type: "qr" },
    gopay: { name: "GoPay", type: "qr" },
    shopeepay: { name: "ShopeePay", type: "redirect" },
    dana: { name: "Dana", type: "redirect" },
    bank_transfer: { name: "Bank Transfer", type: "va" },
    bca: { name: "BCA Virtual Account", type: "va" },
    bri: { name: "BRI Virtual Account", type: "va" },
    bni: { name: "BNI Virtual Account", type: "va" },
    seabank: { name: "SeaBank Virtual Account", type: "va" },
  };

  const method = methods[metode] || { name: metode ? metode.toUpperCase() : "Pembayaran", type: "qr" };

  const qrString = paymentData?.qr_string || paymentData?.uri || paymentData?.actions?.[0]?.qr_string || "";
  const qrImageUrl = fixedQrUrl && method.type === "qr" ? fixedQrUrl : qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}` : "";

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatCountdown = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const handleCopyVA = async () => {
    if (!virtualAccountNumber || isExpired) return;

    try {
      await navigator.clipboard.writeText(virtualAccountNumber);
      setCopiedVA(true);
      setTimeout(() => setCopiedVA(false), 2000);
    } catch {}
  };

  const handleCopyOrderId = async () => {
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch {}
  };

  const handleBack = () => {
    const codeParam = bookingCodeParam ? `&booking_code=${encodeURIComponent(bookingCodeParam)}` : "";
    const typeParam = isBiayaTambahan ? "&type=bhp" : "";

    router.push(`/pembayaran/pilih-metode?booking_id=${encodeURIComponent(bookingId)}${codeParam}&total=${encodeURIComponent(amount)}${typeParam}`);
  };

  if (isLoadingApi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail pembayaran dari server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition">
              <FiArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Detail Pembayaran</h1>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{apiError}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative overflow-hidden">
              {isExpired && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <FiAlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Waktu Pembayaran Telah Habis</h3>
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-800 mb-6">{method.name} Payment</h2>

              {method.type === "qr" && !virtualAccountNumber ? (
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 p-2 shadow-inner">
                    {qrImageUrl ? <img src={qrImageUrl} alt="QR Code Pembayaran" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400 text-center">QR Code belum tersedia</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-2"><FiCreditCard className="w-4 h-4" />Scan QR Code untuk membayar</p>
                </div>
              ) : method.type === "redirect" && !virtualAccountNumber ? (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FiCreditCard className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Lanjutkan Pembayaran via {method.name}</h3>
                  <p className="text-sm text-gray-600 max-w-sm mb-6">Klik tombol di bawah untuk membuka aplikasi {method.name} secara otomatis di perangkatmu.</p>
                  {fixedQrUrl ? (
                    <button type="button" onClick={() => { window.location.href = fixedQrUrl; }} className="w-full max-w-xs py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-md transition">
                      Buka {method.name} &amp; Bayar
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Link pembayaran sedang dimuat...</span>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>

                  <div className="flex items-center justify-between gap-4">
                    <code className="text-xl md:text-2xl font-mono font-bold text-blue-700 tracking-wider">{virtualAccountNumber || "Nomor VA tidak tersedia"}</code>

                    {virtualAccountNumber && (
                      <button type="button" onClick={handleCopyVA} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {copiedVA ? <><FiCheckCircle className="w-4 h-4" /><span>Disalin</span></> : <><FiCopy className="w-4 h-4" /><span>Salin</span></>}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <button type="button" onClick={handleCopyOrderId} className="group flex items-center gap-1.5 font-mono text-gray-800">
                    <span>{orderId || "-"}</span>
                    {orderId && (copiedOrderId ? <FiCheckCircle className="w-3.5 h-3.5 text-green-600" /> : <FiCopy className="w-3.5 h-3.5 text-gray-400" />)}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{isBiayaTambahan ? "Total Biaya Tambahan" : "Total Pembayaran"}</span>
                  <span className="text-xl font-bold text-gray-900">{formatRupiah(amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status Pembayaran</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${isExpired ? "text-red-500" : "text-blue-600"}`}>{statusText}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Metode</span>
                  <span className="text-sm font-medium text-gray-800">{method.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Expired</span>
                  <span className="text-sm font-mono font-medium text-red-500">{formatCountdown(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentQRPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentQRContent />
    </Suspense>
  );
}