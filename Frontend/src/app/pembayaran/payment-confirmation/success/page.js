"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "../PaymentConfirmationCard";
import api from "@/services/api"; // Sesuaikan path import file api kamu

function SuccessPaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const orderId = searchParams.get("order_id");

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        // Mengambil data transaksi real-time dari backend Faruq
        const response = await api.post('/api/booking/charge', {
  id_booking: bookingParam,       // Harus id_booking
  payment_type: metodeParam       // Harus payment_type
});

        const resData = response.data.data || response.data;

        // Memetakan murni dari respons server tanpa nilai fallback dummy
        setPaymentData({
          orderId: resData.order_id || orderId,
          serviceName: resData.nama_layanan || resData.service_name,
          paymentMethod: resData.metode_pembayaran || resData.payment_method,
          virtualAccount: resData.virtual_account || resData.va || null,
          paymentTime: resData.waktu_pembayaran || resData.created_at,
          accountOwner: resData.account_owner,
          price: Number(resData.total_harga || resData.price),
          charge: Number(resData.charge || 0),
          fees: Number(resData.admin_fee || resData.fees || 0),
        });
      } catch (err) {
        console.error("Gagal memuat data transaksi sukses dari API:", err);
        setError("Gagal memuat detail transaksi dari server.");
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
  }, [bookingId, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <p className="text-red-500 font-medium mb-2">{error || "Data tidak ditemukan."}</p>
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