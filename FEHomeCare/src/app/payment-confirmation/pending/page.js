"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "../PaymentConfirmationCard";

function PendingPaymentContent() {
  const searchParams = useSearchParams();

  const data = {
    orderId: searchParams.get("order_id") || searchParams.get("orderId") || "HKC-20260803-94821",
    serviceName: searchParams.get("service") || "Perawatan Medis Home Care Specialist",
    paymentMethod: searchParams.get("payment_type") || searchParams.get("method") || "BCA Virtual Account",
    virtualAccount: searchParams.get("va") || "880129384712049",
    paymentTime: searchParams.get("time") || "3 Agustus 2026, 09:47 WIB",
    accountOwner: searchParams.get("owner") || "a.n. PT CSK Home Care Medika",
    price: searchParams.get("price") ? Number(searchParams.get("price")) : 1200000,
    charge: searchParams.get("charge") ? Number(searchParams.get("charge")) : 25000,
    fees: searchParams.get("fees") ? Number(searchParams.get("fees")) : 24000,
  };

  return <PaymentConfirmationCard status="pending" data={data} />;
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
      </div>
    }>
      <PendingPaymentContent />
    </Suspense>
  );
}
