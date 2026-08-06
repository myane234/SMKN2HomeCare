"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  FileText, 
  Download, 
  ArrowLeft, 
  HelpCircle, 
  CreditCard, 
  Printer, 
  X, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { showToast } from "@/components/Toast";

export default function PaymentConfirmationCard({ 
  status = "success", 
  data = {} 
}) {
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data defaults (bisa di-override lewat props/URL params)
  const isSuccess = status === "success";

  const orderData = {
    orderId: data.orderId || data.order_id || "HKC-20260803-94821",
    serviceName: data.serviceName || data.service || "Perawatan Medis Home Care Specialist",
    paymentMethod: data.paymentMethod || data.payment_type || "BCA Virtual Account",
    virtualAccount: data.virtualAccount || "880129384712049",
    paymentTime: data.paymentTime || "3 Agustus 2026, 09:47 WIB",
    accountOwner: data.accountOwner || "a.n. PT CSK Home Care Medika",
    bankName: data.bankName || "Bank Central Asia (BCA)",
    // Receipt breakdown
    price: Number(data.price) || 1200000,
    charge: Number(data.charge) || 25000,
    fees: Number(data.fees) || 24000,
    patientName: data.patientName || "Pasien CSK Home Care",
  };

  const totalPrice = orderData.price + orderData.charge + orderData.fees;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderData.orderId);
    setCopiedOrder(true);
    showToast("Nomor pesanan berhasil disalin", "success");
    setTimeout(() => setCopiedOrder(false), 2500);
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(orderData.virtualAccount);
    setCopiedRekening(true);
    showToast("Nomor rekening/VA berhasil disalin", "success");
    setTimeout(() => setCopiedRekening(false), 2500);
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Status pembayaran telah diperbarui", "info");
    }, 1200);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full bg-slate-50/70 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
      {/* Decorative Ambient Background Elements */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-purple-200/30 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-emerald-200/30 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Main Confirmation Card */}
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/60 p-6 sm:p-9 relative animate-scale-up">
        
        {/* Close / Navigation Icon */}
        <Link 
          href="/" 
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
          title="Kembali ke Beranda"
        >
          <X className="w-5 h-5" />
        </Link>

        {/* Top Status Icon & Header */}
        <div className="text-center flex flex-col items-center">
          {isSuccess ? (
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping duration-1000 scale-125" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
              </div>
            </div>
          ) : (
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-pulse duration-1000 scale-125" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-11 h-11 stroke-[2.5]" />
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isSuccess ? "Payment Successful" : "Payment Pending"}
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            {isSuccess ? "Pembayaran Berhasil" : "Menunggu Konfirmasi"}
          </p>

          {/* Announcement Box - Professional yet friendly */}
          <div className={`mt-4 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border text-sm leading-relaxed max-w-md ${
            isSuccess 
              ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-900" 
              : "bg-amber-50/90 border-amber-200/80 text-amber-900"
          }`}>
            {isSuccess ? (
              <p className="font-medium">
                <span className="font-bold">Terima kasih!</span> Pembayaran Anda telah berhasil diproses. Nakes profesional kami akan segera memverifikasi jadwal dan menuju ke lokasi Anda.
              </p>
            ) : (
              <p className="font-medium">
                <span className="font-bold">Pembayaran Anda sedang diproses!</span> Mohon kesabaran sejenak ya, sistem kami sedang memverifikasi transaksi Anda secara otomatis.
              </p>
            )}
          </div>

          {/* Total Amount Display */}
          <div className="mt-5 w-full bg-slate-50 border border-slate-200/70 rounded-2xl py-4 px-6 text-center">
            <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">Total Tagihan</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight block mt-0.5">
              {formatRupiah(totalPrice)}
            </span>
          </div>
        </div>

        {/* Primary Information List */}
        <div className="mt-7 space-y-3.5 border-t border-slate-100 pt-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Informasi Transaksi
          </h2>

          {/* Nomer Pesanan */}
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-500 font-medium">Nomer Pesanan</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <span>{orderData.orderId}</span>
              <button 
                onClick={handleCopyOrder}
                className="text-blue-600 hover:text-blue-700 transition ml-1"
                title="Salin Nomer Pesanan"
              >
                {copiedOrder ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Pesanan */}
          <div className="flex items-start justify-between py-1 text-sm gap-4">
            <span className="text-slate-500 font-medium shrink-0">Pesanan</span>
            <span className="font-semibold text-slate-900 text-right">
              {orderData.serviceName}
            </span>
          </div>

          {/* Metode Pembayaran */}
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-500 font-medium">Metode Pembayaran</span>
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>{orderData.paymentMethod}</span>
            </div>
          </div>

          {/* Waktu Pembayaran */}
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-500 font-medium">Waktu Pembayaran</span>
            <span className="font-semibold text-slate-900">
              {orderData.paymentTime}
            </span>
          </div>

          {/* Nama Pemilik No Rekening */}
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-500 font-medium">Nama Pemilik No Rekening</span>
            <span className="font-semibold text-slate-900">
              {orderData.accountOwner}
            </span>
          </div>

          {!isSuccess && (
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-500 font-medium">No. Virtual Account</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                <span>{orderData.virtualAccount}</span>
                <button 
                  onClick={handleCopyRekening}
                  className="text-amber-700 hover:text-amber-900 transition ml-1"
                  title="Salin Nomor VA"
                >
                  {copiedRekening ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Virtual Receipt (Struk) Breakdown Section */}
        <div className="mt-7 bg-slate-900 text-slate-100 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Virtual Receipt (Struk Pembayaran)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              OFFICIAL RECEIPT
            </span>
          </div>

          {/* Receipt Items */}
          <div className="mt-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Pesanan (1x {orderData.serviceName})</span>
              <span className="font-medium text-slate-100">{formatRupiah(orderData.price)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Harga Layanan</span>
              <span className="font-medium text-slate-100">{formatRupiah(orderData.price)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Charge (Biaya Operasional)</span>
              <span className="font-medium text-slate-100">{formatRupiah(orderData.charge)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Fees (Biaya Layanan & Penanganan)</span>
              <span className="font-medium text-slate-100">{formatRupiah(orderData.fees)}</span>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-700 flex justify-between items-center text-sm">
              <span className="font-bold text-white">Total Harga</span>
              <span className="font-black text-emerald-400 text-base">{formatRupiah(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {/* Primary Action Button: Get Receipt */}
          <button
            onClick={() => setShowReceiptModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99]"
          >
            <Download className="w-5 h-5" />
            <span>Unduh Struk Pembayaran (Get Receipt)</span>
          </button>

          {!isSuccess ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                <span>Cek Status</span>
              </button>

              <Link
                href="/booking"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition text-center"
              >
                <span>Lihat Pesanan</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Beranda</span>
              </Link>

              <Link
                href="/booking"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <span>Detail Booking</span>
              </Link>
            </div>
          )}

          {/* Customer Support Helper Link */}
          <div className="pt-2 text-center">
            <a 
              href="https://wa.me/6281234567890?text=Halo%20CSK%20Home%20Care,%20saya%20butuh%20bantuan%20terkait%20pembayaran" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Butuh bantuan pembayaran? Hubungi Customer Care</span>
            </a>
          </div>
        </div>

      </div>

      {/* Modal Printable Virtual Receipt */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Bukti Pembayaran Sah</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-xs font-semibold"
                  title="Cetak Receipt"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="mt-5 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 font-sans">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h3 className="text-lg font-black tracking-tight text-slate-900">CSK HOME CARE MEDIKA</h3>
                <p className="text-xs text-slate-500">Layanan Kesehatan Professional Langsung ke Rumah</p>
                <p className="text-[11px] text-slate-400 mt-0.5">www.cskhomecare.com | CS: 0812-3456-7890</p>
              </div>

              <div className="py-4 border-b border-dashed border-slate-300 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>No. Transaksi</span>
                  <span className="font-bold text-slate-900">{orderData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu</span>
                  <span className="font-medium text-slate-900">{orderData.paymentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Pembayaran</span>
                  <span className="font-medium text-slate-900">{orderData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pemilik Rekening</span>
                  <span className="font-medium text-slate-900">{orderData.accountOwner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={`font-bold uppercase ${isSuccess ? "text-emerald-600" : "text-amber-600"}`}>
                    {isSuccess ? "LUNAS / SUCCESS" : "PENDING"}
                  </span>
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="py-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Rincian Item</p>
                <div className="flex justify-between text-slate-700">
                  <span>{orderData.serviceName}</span>
                  <span>{formatRupiah(orderData.price)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Charge (Biaya Operasional)</span>
                  <span>{formatRupiah(orderData.charge)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Fees (Biaya Penanganan)</span>
                  <span>{formatRupiah(orderData.fees)}</span>
                </div>

                <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-900">Total Pembayaran</span>
                  <span className="font-black text-blue-700 text-base">{formatRupiah(totalPrice)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
                <p>Simpan struk ini sebagai bukti pembayaran sah dari CSK Home Care.</p>
                <p className="mt-0.5 font-semibold text-slate-500">Terima kasih atas kepercayaan Anda.</p>
              </div>
            </div>

            {/* Modal Bottom Action */}
            <div className="mt-5 text-center">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-2xl text-sm transition"
              >
                Tutup Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
