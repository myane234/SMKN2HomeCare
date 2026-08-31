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
        
        const response = await api.get(`/api/booking/${bookingId}/payment-details`);
        const resData = response.data.data || response.data;

        // Ambil harga asli dari database backend, abaikan parameter 10000 di URL
        const dbPrice = Number(resData.total_harga || resData.price || resData.total || 0);
        const finalPrice = dbPrice > 0 ? dbPrice : (totalParam > 0 ? totalParam : 20000);

        setPaymentData({
          orderId: resData.order_id || orderId,
          serviceName: resData.nama_layanan || resData.service_name || "",
          paymentMethod: resData.metode_pembayaran || resData.payment_method || "",
          virtualAccount: resData.virtual_account || resData.va || null,
          paymentTime: resData.waktu_pembayaran || resData.created_at || "",
          accountOwner: resData.account_owner || "",
          price: finalPrice,
          charge: 0,
          fees: 0,
        });
      } catch (err) {
        console.error("Gagal memuat data transaksi sukses dari API:", err);
        
        let fallbackPrice = totalParam > 0 ? totalParam : 20000;
        if (typeof window !== 'undefined') {
          try {
            const savedBooking = localStorage.getItem('last_booking') || localStorage.getItem('pending_order');
            if (savedBooking) {
              const parsed = JSON.parse(savedBooking);
              const storageTotal = Number(parsed.total || parsed.price || parsed.amount);
              if (storageTotal > 0 && storageTotal !== 10000) fallbackPrice = storageTotal;
            }
          } catch (e) {
            console.error(e);
          }
        }

        setPaymentData({
          orderId: orderId || "",
          serviceName: searchParams.get("service") || "",
          paymentMethod: searchParams.get("metode") || "",
          virtualAccount: null,
          paymentTime: "",
          accountOwner: "",
          price: fallbackPrice,
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