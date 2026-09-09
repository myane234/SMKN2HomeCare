'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Download, 
  ArrowLeft, 
  HelpCircle, 
  CreditCard, 
  Printer, 
  X, 
  ShieldCheck, 
  RefreshCw,
  Share2
} from "lucide-react";
import { showToast } from "@/components/Toast";
import api from "@/services/api";

export default function PaymentConfirmationCard({ 
  status = "success", 
  data = {} 
}) {
  const searchParams = useSearchParams();
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const confirmPaymentOnBackend = async () => {
      const bId = searchParams.get("booking_id");
      let oId = searchParams.get("order_id");
      
      if (!oId || oId.startsWith('INV')) {
        try {
          const savedBooking = localStorage.getItem('last_booking') || localStorage.getItem('pending_order');
          if (savedBooking) {
            const parsed = JSON.parse(savedBooking);
            if (parsed.order_id) oId = parsed.order_id;
          }
        } catch (e) {
          console.error("Gagal parse localStorage order_id:", e);
        }
      }

      if (bId && oId) {
        try {
          await api.post('/transaksi/confirm', {
            id_booking: Number(bId),
            order_id: oId
          });
        } catch (err) {
          console.error("Gagal sinkronisasi status konfirmasi pembayaran:", err);
        }
      }
    };

    confirmPaymentOnBackend();
  }, [searchParams]);

  const isSuccess = status === "success";

  const urlTotal = Number(searchParams.get("total") || 0);
  const initialUrlOrderId = searchParams.get("order_id");
  const urlOrderId = initialUrlOrderId || (searchParams.get("booking_id") ? `BOOKING-${searchParams.get("booking_id")}` : "-");
  const urlMetode = searchParams.get("metode") || "QRIS / Transfer";

  const resolvedPrice = (data.price && Number(data.price) > 0) 
    ? Number(data.price) 
    : urlTotal;

  // Mendapatkan nama-nama layanan dari data API jika ada
  let serviceNameDisplay = data.serviceName || "Layanan Kesehatan Home Care";
  if (Array.isArray(data?.layanan) && data.layanan.length > 0) {
    serviceNameDisplay = data.layanan.map(item => item.nama_layanan || item.nama).filter(Boolean).join(", ");
  }

  const orderData = {
    orderId: data.booking_code || data.kode_booking || data.orderId || data.order_id || urlOrderId,
    serviceName: serviceNameDisplay,
    paymentMethod: data.paymentMethod || urlMetode.toUpperCase(),
    virtualAccount: data.virtualAccount || null,
     paymentTime: data.paymentTime || new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    accountOwner: data.accountOwner || "",
    price: resolvedPrice,
    charge: Number(data.charge || 0),
    fees: Number(data.fees || 0),
  };

  const totalPrice = orderData.price + orderData.charge + orderData.fees;
  const adminFee = orderData.charge + orderData.fees;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val).replace(/\s/g, ' ');
  };

  const handleCopyOrder = () => {
    if (!orderData.orderId || orderData.orderId === "-") return;
    navigator.clipboard.writeText(orderData.orderId);
    setCopiedOrder(true);
    showToast("Nomor pesanan berhasil disalin", "success");
    setTimeout(() => setCopiedOrder(false), 2500);
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
    <div className="relative min-h-[calc(100vh-5rem)] w-full bg-[#6c9bf3] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      
      {/* Container Utama Kartu Putih dengan Border Radius Lengkung */}
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 sm:p-8 relative flex flex-col my-6">
        
    {/* Tombol Tutup (X) di Kiri & Garis di Tengah */}
<div className="flex items-center justify-between pb-4">
  <Link 
    href="/" 
    className="text-slate-400 hover:text-slate-600 transition-all"
    title="Keluar"
  >
    <X className="w-5 h-5" />
  </Link>
  
  <div className="w-12 h-1 bg-slate-200 rounded-full" />
  
  {/* Penyeimbang kosong di kanan */}
  <div className="w-5" />
</div>

        {/* Icon Centang Sukses */}
        <div className="text-center flex flex-col items-center mt-2">
          {isSuccess ? (
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-[#00B14F] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>
          ) : (
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Clock className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isSuccess ? "Pembayaran Berhasil" : "Menunggu Konfirmasi"}
          </h1>
        </div>


        {/* Bagian Detail Transaksi */}
        <div className="mt-6 space-y-3 text-xs">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            DETAIL TRANSAKSI
          </h2>

          
            

          {/* Bagian Detail Pembayaran */}
        <div className="space-y-3 text-xs">
          

     

          <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-500 font-medium">No.Transaksi</span>
            <div className="flex items-center gap-1 font-bold text-slate-900">
              <span>{orderData.orderId}</span>
              {orderData.orderId !== "-" && (
                <button 
                  onClick={handleCopyOrder}
                  className="text-blue-600 hover:text-blue-700 transition ml-0.5"
                  title="Salin No.Transaksi"
                >
                  {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-500 font-medium">Waktu</span>
            <span className="font-semibold text-slate-900 text-right">
              {orderData.paymentTime}
            </span>
          </div>
        </div>


             <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-500 font-medium">Metode</span>
            <span className="font-bold text-slate-900 uppercase">
              {orderData.paymentMethod}
            </span>
          </div>
             
        

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Status</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-md">
            {isSuccess ? "Lunas" : "Pending"}
          </span>
        </div>

        <div className="mt-6 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RINCIAN LAYANAN</span>
        </div>
        <div className="flex justify-between items-start gap-4">
          <p className="text-xs font-bold text-slate-800 leading-relaxed max-w-[200px]">
            {orderData.serviceName}
          </p>
        </div>
      </div>
        

        {/* Garis Putus-putus Pemisah */}
        <div className="my-5 border-t border-dashed border-slate-200 relative">
          <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[#6c9bf3]" />
          <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[#6c9bf3]" />
        </div>
         <div className="flex items-center justify-between py-0.5">
          <span className="text-xs font-extrabold text-slate-900">Total Pembayaran</span>
          <span className="text-base font-black text-blue-600 shrink-0">
            {formatRupiah(totalPrice)}
          </span>
        </div>

        

          

         
        </div>

        

        {/* Tombol Aksi Bawah */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Struk Resmi</span>
          </button>

          <Link
            href="/"
            className="w-full text-slate-600 hover:text-slate-900 font-semibold py-2.5 flex items-center justify-center gap-1.5 text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

      </div>

      {/* Modal Unduh / Cetak Struk */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
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

            <div className="mt-5 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 font-sans">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h3 className="text-lg font-black tracking-tight text-slate-900">SMART HOME CARE</h3>
                <p className="text-xs text-slate-500">Layanan Kesehatan Professional Langsung ke Rumah</p>
              </div>

              <div className="py-4 border-b border-dashed border-slate-300 space-y-1.5 text-xs text-slate-600">
  <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
    DETAIL TRANSAKSI
  </h2>
  
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
                  <span>Status</span>
                  <span className={`font-bold uppercase ${isSuccess ? "text-emerald-600" : "text-amber-600"}`}>
                    {isSuccess ? "LUNAS " : "PENDING"}
                  </span>
                </div>
              </div>

              <div className="py-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Rincian Layanan</p>
               {Array.isArray(data?.layanan) && data.layanan.length > 0 ? (
                data.layanan.map((item, idx) => (
                  <div key={idx} className="text-slate-700">
                    <span>{item.nama_layanan || item.nama}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-700">
                  <span>{orderData.serviceName}</span>
                </div>
              )}

                <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-900">Total Pembayaran</span>
                  <span className="font-black text-blue-700 text-base">{formatRupiah(totalPrice)}</span>
                </div>
              </div>
            </div>

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