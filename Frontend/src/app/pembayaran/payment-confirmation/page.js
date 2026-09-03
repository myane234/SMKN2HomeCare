"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "./PaymentConfirmationCard";
import api from "@/services/api";

function PaymentConfirmationMainContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = rawStatus === "pending" ? "pending" : "success";

  const urlOrderId = searchParams.get("order_id") || searchParams.get("orderId") || "";
  const bookingId = searchParams.get("booking_id");

  const [dynamicData, setDynamicData] = useState({
    orderId: urlOrderId,
    serviceName: searchParams.get("service") || searchParams.get("serviceName") || "",
    paymentMethod: searchParams.get("payment_type") || searchParams.get("method") || "",
    virtualAccount: searchParams.get("va") || searchParams.get("virtualAccount") || null,
    paymentTime: searchParams.get("time") || searchParams.get("paymentTime") || "",
    accountOwner: searchParams.get("owner") || searchParams.get("accountOwner") || "",
    price: searchParams.get("price") ? Number(searchParams.get("price")) : 0,
    charge: searchParams.get("charge") ? Number(searchParams.get("charge")) : 0,
    fees: searchParams.get("fees") ? Number(searchParams.get("fees")) : 0,
  });

  useEffect(() => {
    const confirmPaymentOnBackend = async () => {
      // Ambil dan pastikan order_id valid (ambil dari localStorage jika URL bernilai INV/kosong)
      let validOrderId = urlOrderId;
      
      try {
        const savedBooking = localStorage.getItem("last_booking") || localStorage.getItem("pending_order") || localStorage.getItem("cart_checkout");
        if (savedBooking) {
          const parsed = JSON.parse(savedBooking);
          const storageOrderId = parsed.order_id || parsed.orderId;
          
          if (!validOrderId || validOrderId.startsWith('INV')) {
            if (storageOrderId) validOrderId = storageOrderId;
          }

          setDynamicData((prev) => ({
            ...prev,
            price: prev.price > 0 ? prev.price : Number(parsed.price || parsed.total || parsed.amount || 0),
            serviceName: prev.serviceName || parsed.serviceName || parsed.title || parsed.service || "",
            orderId: validOrderId || prev.orderId
          }));
        }
      } catch (err) {
        console.error("Gagal memuat data booking dari storage:", err);
      }

      // Kirim konfirmasi ke backend dengan order_id yang valid
      if (bookingId && validOrderId) {
        try {
          await api.post('/transaksi/confirm', {
            id_booking: Number(bookingId),
            order_id: validOrderId
          });
        } catch (err) {
          console.error("Gagal sinkronisasi status konfirmasi pembayaran:", err);
        }
      }
    };

    confirmPaymentOnBackend();
  }, [searchParams, bookingId, urlOrderId]);

  return <PaymentConfirmationCard status={status} data={dynamicData} />;
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    }>
      <PaymentConfirmationMainContent /> 
    </Suspense>
  );
}