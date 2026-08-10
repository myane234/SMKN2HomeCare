// app/pembayaran/paymentQR/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiClock, 
  FiCopy, 
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiShield,
  FiInfo
} from 'react-icons/fi';
import { QrCode } from 'lucide-react';
import Image from 'next/image';

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);
  const [bookingId, setBookingId] = useState('');
  const [metode, setMetode] = useState('');
  const [expiredAt, setExpiredAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  useEffect(() => {
    const metodeParam = searchParams.get('metode') || 'gopay';
    const bookingParam = searchParams.get('booking_id') || 'BR-20260803001';
    const totalParam = parseInt(searchParams.get('total')) || 150000;
    
    setMetode(metodeParam);
    setBookingId(bookingParam);
    setAmount(totalParam);
    setExpiredAt(new Date(Date.now() + 15 * 60 * 1000));
    
    const id = `INV-${bookingParam.split('-')[1] || '20260803'}-${Date.now().toString().slice(-6)}`;
    setOrderId(id);
  }, [searchParams]);

  useEffect(() => {
    if (!expiredAt) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiredAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiredAt]);

  const methods = {
    qris: {
      name: 'QRIS',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isQr: true,
      logo: '/images/payment/qris.png',
    },
    gopay: {
      name: 'GoPay',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      isQr: true,
      logo: '/images/payment/gopay.png',
    },
    dana: {
      name: 'DANA',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isQr: true,
      logo: '/images/payment/dana.png',
    },
    shopeepay: {
      name: 'ShopeePay',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      isQr: true,
      logo: '/images/payment/shopeepay.png',
    },
    bca_va: {
      name: 'BCA Virtual Account',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isQr: false,
      logo: '/images/payment/bca.png',
      virtualAccount: '1234567890123456',
    },
    bri_va: {
      name: 'BRI Virtual Account',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      isQr: false,
      logo: '/images/payment/bri.png',
      virtualAccount: '9876543210987654',
    }
  };

  const method = methods[metode] || methods.gopay;

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyVA = async () => {
    try {
      await navigator.clipboard.writeText(method.virtualAccount);
      setCopiedVA(true);
      setTimeout(() => setCopiedVA(false), 2000);
    } catch (err) {
      console.error('Gagal copy:', err);
    }
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch (err) {
      console.error('Gagal copy:', err);
    }
  };

  const handleBack = () => {
    router.push(`/pembayaran/pilih-metode?booking_id=${bookingId}&total=${amount}`);
  };

  if (!orderId || !expiredAt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail pembayaran...</p>
        </div>
      </div>
    );
  }

  // ==================== DESKTOP VERSION ====================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <FiArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              Detail Pembayaran
            </h1>
          </div>
        </div>
      </div>

      {/* Wrapper Konten Desktop (Hidden di Mobile) */}
      <div className="hidden md:block max-w-5xl mx-auto px-12 py-8 pt-12">
        {/* 2 Kolom Desktop */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Kolom Kiri (2/3) - QR Payment */}
          <div className="col-span-2 space-y-6">
            {/* QR Payment Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">QR Payment</h2>
              
              

              {/* QR Code / Virtual Account Desktop */}
              {method.isQr ? (
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <QrCode className="w-36 h-36 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-400 mt-1">QR Code</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                    <FiCreditCard className="w-4 h-4" />
                    Scan QR Code untuk membayar
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
                      {method.virtualAccount}
                    </code>
                    <button
                      onClick={handleCopyVA}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        copiedVA 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {copiedVA ? (
                        <>
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Disalin</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-4 h-4" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Order ID & Total */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <button
                    onClick={handleCopyOrderId}
                    className="group flex items-center gap-1.5 font-mono text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    <span>{orderId}</span>
                    {copiedOrderId ? (
                      <FiCheckCircle className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <FiCopy className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Pembayaran</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatRupiah(amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan (1/3) - Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status Pembayaran</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-medium text-blue-600">Menunggu Pembayaran</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Metode Pembayaran</span>
                  <span className="text-sm font-medium text-gray-800">{method.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Expired</span>
                  <span className="text-sm font-mono font-medium text-red-500">
                    {formatCountdown(timeLeft)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <FiInfo className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  Pembayaran akan diverifikasi otomatis setelah berhasil.
                </p>
              </div>
            </div>

            {/* Warning Message Desktop */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Jangan tutup halaman ini sebelum pembayaran selesai
              </p>
            </div>

            {isExpired && (
              <button
                onClick={handleBack}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
              >
                ⚠️ Pembayaran Kedaluwarsa - Kembali
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ==================== MOBILE VERSION ==================== */}
      <div className="md:hidden min-h-screen bg-gray-50 px-4 py-4">
        {/* Status + Countdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-600">Menunggu Pembayaran</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <FiClock className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-medium text-red-500">
                {formatCountdown(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* QR Payment Card Mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">QR Payment</h2>
          
          {/* Metode Mobile */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-xl p-1.5">
              <Image
                src={method.logo}
                alt={method.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">Metode Pembayaran</p>
              <p className="font-bold text-gray-800">{method.name}</p>
            </div>
          </div>

          {/* QR Code / Virtual Account Mobile */}
          {method.isQr ? (
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <QrCode className="w-32 h-32 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">QR Code</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Scan QR Code untuk melakukan pembayaran
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Nomor Virtual Account</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-mono font-bold text-blue-700 tracking-wider truncate">
                  {method.virtualAccount}
                </code>
                <button
                  onClick={handleCopyVA}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all border-0 outline-none ring-0 focus:ring-0 focus:outline-none bg-transparent whitespace-nowrap flex-shrink-0 ${
                    copiedVA 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {copiedVA ? (
                    <>
                      <FiCheckCircle className="w-3 h-3" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Order ID & Total Mobile */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <button
                onClick={handleCopyOrderId}
                className="group flex items-center gap-1.5 font-mono text-gray-800 text-xs hover:text-blue-600 transition-colors"
              >
                <span>{orderId}</span>
                {copiedOrderId ? (
                  <FiCheckCircle className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Pembayaran</span>
              <span className="text-lg font-bold text-gray-900">
                {formatRupiah(amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Verifikasi Mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 flex items-start gap-2">
            <FiInfo className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            Pembayaran akan diverifikasi secara otomatis setelah berhasil.
          </p>
        </div>

        {/* Warning Message Mobile */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            Jangan tutup halaman ini sebelum pembayaran selesai
          </p>
        </div>

        {/* Back Button Mobile */}
        {isExpired && (
          <button
            onClick={handleBack}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
          >
            ⚠️ Pembayaran Kedaluwarsa - Kembali
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentQRPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat detail pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentQRContent />
    </Suspense>
  );
}