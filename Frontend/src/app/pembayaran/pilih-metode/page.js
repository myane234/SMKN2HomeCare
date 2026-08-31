'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiAlertCircle
} from 'react-icons/fi';

const METODE_PEMBAYARAN = [
  {
    id: 'qris',
    nama: 'QRIS',
    keterangan: 'Scan QR pakai GoPay, OVO, ShopeePay, BCA, dll',
    logo: '/images/payment/qris.png',
  },
  {
    id: 'gopay',
    nama: 'GoPay',
    keterangan: 'Pembayaran instan via aplikasi GoPay',
    logo: '/images/payment/gopay.png',
  },
  {
    id: 'dana',
    nama: 'DANA',
    keterangan: 'Pembayaran instan via aplikasi DANA',
    logo: '/images/payment/dana.png',
  },
  {
    id: 'shopeepay',
    nama: 'ShopeePay',
    keterangan: 'Pembayaran instan via aplikasi ShopeePay',
    logo: '/images/payment/shopeepay.png',
  },
  {
    id: 'bri_va',
    nama: 'BRI Virtual Account',
    keterangan: 'Transfer via m-BRI atau ATM BRI',
    logo: '/images/payment/bri.png',
  },
  {
    id: 'bca_va',
    nama: 'BCA Virtual Account',
    keterangan: 'Transfer via m-BCA atau ATM BCA',
    logo: '/images/payment/bca.png',
  },
];

function PilihMetodePembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedMetode, setSelectedMetode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bookingId = searchParams.get('booking_id') || '45';
  const totalAmount = searchParams.get('total') || '150000';

  const handlePilihMetode = (metodeId) => {
    setSelectedMetode(metodeId);
    setError('');
  };

  const handleLanjutkanPembayaran = () => {
    if (!selectedMetode) {
      setError('Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Langsung arahkan ke halaman paymentQR dengan membawa parameter yang dibutuhkan
      router.push(
        `/pembayaran/paymentQR?metode=${selectedMetode}&booking_id=${bookingId}&total=${totalAmount}`
      );
    } catch (err) {
      setError('Gagal memproses pembayaran. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = parseInt(value);
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

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
              Pilih Metode Pembayaran
            </h1>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* ================= BAGIAN KIRI ================= */}
          <div className="w-full lg:flex-1">
            
            {/* Card Total Pembayaran (Khusus MOBILE) */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl px-6 py-10 mb-8 shadow-md text-white flex flex-col justify-center lg:hidden">
              <p className="text-xs sm:text-sm text-sky-50 font-medium tracking-wide">
                Total Pembayaran
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            {/* List Pilihan Metode Pembayaran */}
            <div className="space-y-3 mb-8 lg:mb-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Pilih Pembayaran
              </p>
              
              {METODE_PEMBAYARAN.map((metode) => {
                const isSelected = selectedMetode === metode.id;

                return (
                  <button
                    key={metode.id}
                    type="button"
                    onClick={() => handlePilihMetode(metode.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-10 relative flex-shrink-0 flex items-center justify-center">
                        <img
                          src={metode.logo}
                          alt={metode.nama || metode.id}
                          className="max-w-full max-h-full object-contain object-center"
                        />
                      </div>

                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-snug">
                          {metode.nama}
                        </p>
                        {metode.keterangan && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {metode.keterangan}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500 shadow-sm'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= BAGIAN KANAN ================= */}
          <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-28">
            
            {/* Card Total Pembayaran (Khusus DESKTOP) */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl px-6 py-10 mb-6 shadow-md text-white hidden lg:flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-sky-50 font-medium tracking-wide">
                Total Pembayaran
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            {/* Info Error */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Tombol Bayar */}
            <button
              type="button"
              onClick={handleLanjutkanPembayaran}
              disabled={isLoading || !selectedMetode}
              className={`w-full py-4 px-4 text-sm sm:text-base font-bold text-white rounded-xl transition flex items-center justify-center gap-2 ${
                isLoading || !selectedMetode
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/20 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Memproses...
                </>
              ) : (
                'Bayar'
              )}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default function PilihMetodePembayaranPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
          <p className="mt-4 text-gray-600">Memuat metode pembayaran...</p>
        </div>
      </div>
    }>
      <PilihMetodePembayaranContent />
    </Suspense>
  );
}