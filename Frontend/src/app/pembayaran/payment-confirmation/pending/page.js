"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaymentConfirmationCard from "../PaymentConfirmationCard";

function PendingPaymentContent() {
  const searchParams = useSearchParams();

  const metodeParam = searchParams.get("metode") || searchParams.get("payment_type") || "";
  
  const formatMethodName = (m) => {
    if (!m) return "";
    const lower = m.toLowerCase();
    if (lower.includes("bca")) return "BCA Virtual Account";
    if (lower.includes("bri")) return "BRI Virtual Account";
    if (lower.includes("qris")) return "QRIS";
    return m.toUpperCase();
  };

  const orderIdParam = searchParams.get("order_id") || searchParams.get("orderId") || "";

  const data = {
    orderId: orderIdParam,
    serviceName: searchParams.get("service") || searchParams.get("serviceName") || "",
    paymentMethod: formatMethodName(metodeParam),
    virtualAccount: searchParams.get("va") || searchParams.get("virtual_account") || "",
    paymentTime: searchParams.get("time") || searchParams.get("paymentTime") || "",
    accountOwner: searchParams.get("owner") || searchParams.get("accountOwner") || "",
    price: searchParams.get("price") ? Number(searchParams.get("price")) : 0,
    charge: searchParams.get("charge") ? Number(searchParams.get("charge")) : 0,
    fees: searchParams.get("fees") ? Number(searchParams.get("fees")) : 0,
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