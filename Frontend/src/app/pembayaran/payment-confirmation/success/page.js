"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "../PaymentConfirmationCard";
import api from "@/services/api";

function SuccessPaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const orderId = searchParams.get("order_id");
  const rawTotal = Number(searchParams.get("total")) || 0;
  
  // Jika URL membawa angka 10000 yang salah, abaikan dan anggap 0 supaya sistem mengambil dari database/storage
  const totalParam = rawTotal === 10000 ? 0 : rawTotal;

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        
        // 1. Ambil order_id asli dari localStorage jika orderId dari URL berupa INV
        let validOrderId = orderId;

        // Panggil endpoint confirm ke backend jika ada bookingId & orderId
        if (bookingId && validOrderId) {
          try {
            await api.post('/transaksi/confirm', {
              id_booking: Number(bookingId),
              order_id: validOrderId
            });
          } catch (e) {
            console.error("Gagal sinkronisasi konfirmasi transaksi:", e);
          }
        }

        // 2. Lanjut ambil detail pembayaran dari API
        const response = await api.get(`/api/booking/${bookingId}/payment-details`);
        const resData = response.data.data || response.data;

        // Ambil harga asli murni dari API
        const dbPrice = Number(resData.jumlah_total || resData.total_harga || resData.price || resData.total || 0);
        const finalPrice = dbPrice > 0 ? dbPrice : (totalParam > 0 ? totalParam : 0);

        // Ambil nama layanan dari daftar layanan jika berupa array
        let displayServiceName = resData.nama_layanan || resData.service_name || "";
        if (!displayServiceName && Array.isArray(resData.layanan) && resData.layanan.length > 0) {
          displayServiceName = resData.layanan.map(l => l.nama_layanan).join(', ');
        }

        setPaymentData({
          orderId: resData.booking_code || resData.kode_booking || resData.order_id || validOrderId,
          serviceName: displayServiceName || "Layanan Kesehatan Home Care",
          paymentMethod: resData.metode_pembayaran || resData.payment_method || searchParams.get("metode") || "QRIS / Transfer",
          virtualAccount: resData.virtual_account || resData.va || null,
          paymentTime: resData.waktu_pembayaran || resData.created_at || "",
          accountOwner: resData.account_owner || "",
          price: finalPrice,
          charge: 0,
          fees: 0,
          layanan: resData.layanan || [],
          rincianBiaya: resData.rincian_biaya || null,
        });
      } catch (err) {
        console.error("Gagal memuat data transaksi sukses dari API:", err);
        setPaymentData({
          orderId: orderId || (bookingId ? `BOOKING-${bookingId}` : "-"),
          serviceName: searchParams.get("service") || "Layanan Kesehatan Home Care",
          paymentMethod: searchParams.get("metode") || "QRIS / Transfer",
          virtualAccount: null,
          paymentTime: "",
          accountOwner: "",
          price: totalParam,
          charge: 0,
          fees: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (bookingId || orderId) {
      fetchTransactionData();
    } else {
      setLoading(false);
      setError("ID Transaksi tidak ditemukan pada URL.");
    }
  }, [bookingId, orderId, searchParams, totalParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <p className="text-red-500 font-medium mb-2">{error}</p>
        <a href="/" className="text-sm text-emerald-600 underline">Kembali ke Beranda</a>
      </div>
    );
  }

  return <PaymentConfirmationCard status="success" data={paymentData} />;
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