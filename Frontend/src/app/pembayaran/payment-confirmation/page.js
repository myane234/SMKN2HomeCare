"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "./PaymentConfirmationCard";

function PaymentConfirmationMainContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = rawStatus === "pending" ? "pending" : "success";

  const orderId = searchParams.get("order_id") || searchParams.get("orderId") || "";
  const [dynamicData, setDynamicData] = useState({
    orderId: orderId,
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
    // Jika parameter URL tidak membawa nilai price, ambil data dari localStorage berdasarkan orderId atau booking terakhir
    const hasPriceInUrl = searchParams.get("price");
    if (!hasPriceInUrl) {
      try {
        // Cek penyimpanan lokal yang biasa dipakai untuk menyimpan data booking/transaksi aktif
        const savedBooking = localStorage.getItem("last_booking") || localStorage.getItem("pending_order") || localStorage.getItem("cart_checkout");
        if (savedBooking) {
          const parsed = JSON.parse(savedBooking);
          setDynamicData((prev) => ({
            ...prev,
            price: Number(parsed.price || parsed.total || parsed.amount || prev.price),
            serviceName: prev.serviceName || parsed.serviceName || parsed.title || parsed.service || "",
            orderId: prev.orderId || parsed.orderId || parsed.id || ""
          }));
        }
      } catch (err) {
        console.error("Gagal memuat data booking dari storage:", err);
      }
    }
  }, [searchParams]);

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