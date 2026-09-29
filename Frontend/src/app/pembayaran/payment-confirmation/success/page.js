"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "../PaymentConfirmationCard";
import api from "@/services/api";
import { getBiayaTambahanBooking, confirmPayment } from "@/services/bookingService";

function SuccessPaymentContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("booking_id") || "";
  const bookingCode = searchParams.get("booking_code") || "";
  const orderId = searchParams.get("order_id") || "";
  const paymentType = searchParams.get("type") || "booking";
  const metodeParam = searchParams.get("metode") || "";
  const rawTotal = Number(searchParams.get("total")) || 0;

  const isBiayaTambahan = paymentType === "bhp";
  const totalParam = rawTotal === 10000 ? 0 : rawTotal;

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBookingCode = async () => {
    if (bookingCode) return bookingCode;

    const detailResponse = await api.get(`/api/booking/${bookingId}/payment-details`);
    const detailData = detailResponse?.data?.data ?? detailResponse?.data ?? {};

    const resolvedCode =
      detailData?.booking_code ||
      detailData?.kode_booking ||
      "";

    if (!resolvedCode) {
      throw new Error("Booking code tidak ditemukan.");
    }

    return resolvedCode;
  };

  const loadBiayaTambahan = async () => {
    const resolvedBookingCode = await getBookingCode();

    const response = await getBiayaTambahanBooking(resolvedBookingCode);
    const root = response?.data?.data ?? response?.data ?? response ?? {};

    const finalPrice = Number(root?.nominal ?? 0);

    const status =
      root?.status_transaksi ||
      "Belum Bayar";

    const paymentMethod =
      root?.metode_pembayaran ||
      root?.payment_method ||
      metodeParam ||
      "";

    const additionalOrderId =
      root?.order_id ||
      root?.kode_booking_tambahan ||
      orderId ||
      "";

    const paymentTime =
      root?.waktu_bayar ||
      root?.waktu_pembayaran ||
      root?.paid_at ||
      "";

    const normalizedStatus = String(status).toLowerCase();

    const isPaid =
      normalizedStatus.includes("lunas") ||
      normalizedStatus.includes("paid") ||
      normalizedStatus.includes("settlement") ||
      normalizedStatus.includes("success");

    return {
      isBiayaTambahan: true,
      isPaid,
      bookingCode: resolvedBookingCode,
      orderId: additionalOrderId,
      serviceName: "Biaya Tambahan",
      paymentMethod,
      virtualAccount: root?.va_number || root?.virtual_account || null,
      paymentTime,
      accountOwner: "",
      price: finalPrice || totalParam,
      charge: 0,
      fees: 0,
      layanan: [],
      rincianBiaya: null,
      status,
      biayaTambahan: root,
    };
  };

  useEffect(() => {
    let interval;
    let mounted = true;

    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!bookingId) {
          throw new Error("ID booking tidak ditemukan pada URL.");
        }

        // =====================================================
        // FLOW BIAYA TAMBAHAN
        // =====================================================
        if (isBiayaTambahan) {
          // Ambil data Biaya Tambahan terlebih dahulu
          let biayaData = await loadBiayaTambahan();

          if (!mounted) return;

          // ===================================================
          // CONFIRM TRANSAKSI BIAYA TAMBAHAN
          // ===================================================
          if (biayaData.orderId) {
            try {
              await confirmPayment({
                id_booking: Number(bookingId),
                order_id: biayaData.orderId,
              });

              // Setelah confirm, ambil ulang status dari API
              biayaData = await loadBiayaTambahan();
            } catch (confirmError) {
              console.error("Gagal confirm Biaya Tambahan:", confirmError);
            }
          }

          if (!mounted) return;

          setPaymentData(biayaData);
          setLoading(false);
          return;
        }

        // =====================================================
        // FLOW BOOKING BIASA
        // =====================================================
        let validOrderId = orderId;

        if (!validOrderId || validOrderId.startsWith("INV")) {
          try {
            const savedBooking =
              localStorage.getItem("last_booking") ||
              localStorage.getItem("pending_order");

            if (savedBooking) {
              const parsed = JSON.parse(savedBooking);

              if (parsed.order_id) {
                validOrderId = parsed.order_id;
              }
            }
          } catch (e) {
            console.error("Gagal parse localStorage order_id:", e);
          }
        }

        const response = await api.get(`/api/booking/${bookingId}/payment-details`);
        const resData = response.data?.data || response.data || {};

        const dbPrice = Number(
          resData.jumlah_total ||
          resData.total_harga ||
          resData.price ||
          resData.total ||
          0
        );

        const finalPrice = dbPrice > 0 ? dbPrice : totalParam;

        let displayServiceName =
          resData.nama_layanan ||
          resData.service_name ||
          "";

        if (!displayServiceName && Array.isArray(resData.layanan) && resData.layanan.length > 0) {
          displayServiceName = resData.layanan
            .map((l) => l.nama_layanan || l.nama)
            .filter(Boolean)
            .join(", ");
        }

        if (!mounted) return;

        setPaymentData({
          isBiayaTambahan: false,
          isPaid: true,
          orderId:
            resData.booking_code ||
            resData.kode_booking ||
            resData.order_id ||
            validOrderId ||
            `BOOKING-${bookingId}`,
          serviceName:
            displayServiceName ||
            "Layanan Kesehatan Home Care",
          paymentMethod:
            resData.metode_pembayaran ||
            resData.payment_method ||
            metodeParam ||
            "QRIS / Transfer",
          virtualAccount:
            resData.virtual_account ||
            resData.va ||
            null,
          paymentTime:
            resData.waktu_pembayaran ||
            resData.created_at ||
            "",
          accountOwner:
            resData.account_owner ||
            "",
          price: finalPrice,
          charge: 0,
          fees: 0,
          layanan:
            resData.layanan || [],
          rincianBiaya:
            resData.rincian_biaya || null,
          status:
            resData.status_transaksi ||
            "Lunas",
        });
      } catch (err) {
        console.error("Gagal memuat data transaksi sukses:", err);

        if (!mounted) return;

        setError(
          err?.message ||
          "Gagal memuat data pembayaran."
        );

        setPaymentData({
          isBiayaTambahan,
          isPaid: false,
          orderId:
            orderId ||
            `BOOKING-${bookingId}`,
          serviceName: isBiayaTambahan
            ? "Biaya Tambahan"
            : "Layanan Kesehatan Home Care",
          paymentMethod:
            metodeParam ||
            "QRIS / Transfer",
          virtualAccount: null,
          paymentTime: "",
          accountOwner: "",
          price: totalParam,
          charge: 0,
          fees: 0,
          layanan: [],
          rincianBiaya: null,
          status: isBiayaTambahan
            ? "Belum Bayar"
            : "Lunas",
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTransactionData();

    return () => {
      mounted = false;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    bookingId,
    bookingCode,
    orderId,
    paymentType,
    metodeParam,
    totalParam,
    isBiayaTambahan,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <p className="text-red-500 font-medium mb-2">
          {error || "Data pembayaran tidak ditemukan."}
        </p>

        <a href="/" className="text-sm text-emerald-600 underline">
          Kembali ke Beranda
        </a>
      </div>
    );
  }

  return (
    <PaymentConfirmationCard
      status={paymentData.isPaid ? "success" : "pending"}
      data={paymentData}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    }>
      <SuccessPaymentContent />
    </Suspense>
  );
}