'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiAlertCircle
} from 'react-icons/fi';
import { pembayaranService } from '@/services/pembayaranService';
import api from '@/services/api';

const FALLBACK_LOGOS = {
  qris: '/images/payment/qris.png',
  gopay: '/images/payment/gopay.png',
  dana: '/images/payment/dana.png',
  shopeepay: '/images/payment/shopeepay.png',
  bri: '/images/payment/bri.png',
  bri_va: '/images/payment/bri.png',
  bca: '/images/payment/bca.png',
  bca_va: '/images/payment/bca.png',
  bni: '/images/payment/bni.png',
  bni_va: '/images/payment/bni.png',
  seabanks: '/images/payment/seabank.png',
};

const DEFAULT_METODE_FALLBACK = [
  {
    id_metode: 'qris',
    payment_type: 'qris',
    nama_metode: 'QRIS',
    nama_kategori: 'QRIS',
    id_kategori_pembayaran: 1,
    tipe_potongan: 'nominal',
    nilai_potongan: 0,
    keterangan: 'Scan QR pakai GoPay, OVO, ShopeePay, BCA, dll',
    logo: null,
  },
  {
    id_metode: 'gopay',
    payment_type: 'gopay',
    nama_metode: 'GoPay',
    nama_kategori: 'E-Wallet',
    id_kategori_pembayaran: 2,
    tipe_potongan: 'persen',
    nilai_potongan: 2,
    keterangan: 'Pembayaran instan via aplikasi GoPay',
    logo: null,
  },
  {
    id_metode: 'dana',
    payment_type: 'dana',
    nama_metode: 'DANA',
    nama_kategori: 'E-Wallet',
    id_kategori_pembayaran: 2,
    tipe_potongan: 'persen',
    nilai_potongan: 1,
    keterangan: 'Pembayaran instan via aplikasi DANA',
    logo: null,
  },
  {
    id_metode: 'shopeepay',
    payment_type: 'shopeepay',
    nama_metode: 'ShopeePay',
    nama_kategori: 'E-Wallet',
    id_kategori_pembayaran: 2,
    tipe_potongan: 'persen',
    nilai_potongan: 4,
    keterangan: 'Pembayaran instan via aplikasi ShopeePay',
    logo: null,
  },
  {
    id_metode: 'bri_va',
    payment_type: 'bri_va',
    nama_metode: 'BRI Virtual Account',
    nama_kategori: 'Bank Transfer',
    id_kategori_pembayaran: 3,
    tipe_potongan: 'nominal',
    nilai_potongan: 4000,
    keterangan: 'Transfer via m-BRI atau ATM BRI',
    logo: null,
  },
  {
    id_metode: 'bca_va',
    payment_type: 'bca_va',
    nama_metode: 'BCA Virtual Account',
    nama_kategori: 'Bank Transfer',
    id_kategori_pembayaran: 3,
    tipe_potongan: 'nominal',
    nilai_potongan: 4000,
    keterangan: 'Transfer via m-BCA atau ATM BCA',
    logo: null,
  },
];

function PilihMetodePembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedMetode, setSelectedMetode] = useState(null);
  const [metodeList, setMetodeList] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [bookingId, setBookingId] = useState('');
  const [totalAmount, setTotalAmount] = useState('0');

  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    const urlTotal = searchParams.get('total') || searchParams.get('jumlah_total') || searchParams.get('total_harga') || searchParams.get('harga') || searchParams.get('amount') || searchParams.get('price');
    const urlBookingId = searchParams.get('booking_id') || searchParams.get('id_booking') || searchParams.get('id') || searchParams.get('bookingId');

    const bId = urlBookingId || '';
    setBookingId(String(bId));

    if (urlTotal && Number(urlTotal) > 0) {
      setTotalAmount(String(urlTotal));
    }

    if (bId) {
      const fetchBookingDetails = async () => {
        try {
          const res = await api.get(`/api/booking/${bId}/payment-details`);
          const resData = res.data?.data || res.data;
          const apiJumlahTotal = resData?.jumlah_total || resData?.total || resData?.gross_amount || resData?.rincian_biaya?.jumlah_total;
          if (apiJumlahTotal && Number(apiJumlahTotal) > 0) {
            setTotalAmount(String(apiJumlahTotal));
          }
        } catch (err) {
          console.error('Gagal mengambil rincian booking dari API:', err);
        }
      };

      fetchBookingDetails();
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMetode = async () => {
      try {
        setIsFetching(true);
        setError('');

        const resMetode = await pembayaranService.getMetode();
        const rawData = resMetode?.data || resMetode;
        
        let allMethods = Array.isArray(rawData) ? rawData : DEFAULT_METODE_FALLBACK;
        allMethods = allMethods.filter((m) => m.is_active !== false);

        if (allMethods.length === 0) {
          allMethods = DEFAULT_METODE_FALLBACK;
        }

        setMetodeList(allMethods);
        setOpenCategories({});
      } catch (err) {
        console.error('Gagal mengambil metode pembayaran:', err);
        setMetodeList(DEFAULT_METODE_FALLBACK);
        setOpenCategories({});
      } finally {
        setIsFetching(false);
      }
    };

    fetchMetode();
  }, []);

  const groupByCategory = (list) => {
    return list.reduce((acc, item) => {
      const catName = item.nama_kategori || item.kategori?.nama_kategori || item.kategori?.nama || 'Lainnya';
      if (!acc[catName]) {
        acc[catName] = [];
      }
      acc[catName].push(item);
      return acc;
    }, {});
  };

  const toggleCategory = (catName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const [selectedMethodId, setSelectedMethodId] = useState(null);

  const handlePilihMetode = (metodeObj) => {
    const mId = metodeObj.id_metode ?? metodeObj.id ?? metodeObj.payment_type;
    setSelectedMetode(metodeObj);
    setSelectedMethodId(mId);
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
      const paymentType = selectedMetode.payment_type || selectedMetode.id_metode || selectedMetode.id || 'qris';
      router.push(
        `/pembayaran/payment?metode=${paymentType}&booking_id=${bookingId}&total=${totalAmount}`
      );
    } catch (err) {
      console.error('Gagal melakukan navigasi pembayaran:', err);
      setError('Gagal memproses pembayaran. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const getLogoUrl = (metode) => {
    if (metode.logo) {
      if (metode.logo.startsWith('http://') || metode.logo.startsWith('https://') || metode.logo.startsWith('/')) {
        return metode.logo;
      }
      return `/storage/${metode.logo}`;
    }

    const key = (metode.payment_type || metode.nama_metode || metode.id || '').toLowerCase();
    for (const [k, url] of Object.entries(FALLBACK_LOGOS)) {
      if (key.includes(k)) return url;
    }
    return '/images/payment/qris.png';
  };

  const getPotonganText = (metode) => {
    if (metode.keterangan) return metode.keterangan;

    const nilai = Number(metode.nilai_potongan);
    if (!nilai || nilai <= 0) return 'Pembayaran instan & praktis';

    if (metode.tipe_potongan === 'persen') {
      return `Biaya / Potongan: ${nilai}%`;
    }
    return `Biaya / Potongan: Rp ${nilai.toLocaleString('id-ID')}`;
  };

  const groupedMetode = groupByCategory(metodeList);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Header Full Width */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <FiArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              Pilih Metode Pembayaran
            </h1>
          </div>
        </div>
      </div>

      {/* Container Utama melebarkan tampilan Desktop (max-w-7xl) & Membalik Urutan di Mobile */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col-reverse lg:flex-row gap-8 items-start justify-between">
          
          {/* ================= AKAN DI BAWAH PADA MOBILE | DI KIRI PADA DESKTOP ================= */}
          <div className="w-full lg:flex-1">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pilih Pembayaran
              </p>
            </div>

            {isFetching ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
                <p className="mt-3 text-sm text-slate-500">Memuat metode pembayaran...</p>
              </div>
            ) : Object.keys(groupedMetode).length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                Metode pembayaran tidak tersedia.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedMetode).map(([categoryName, items]) => {
                  const isOpen = !!openCategories[categoryName];

                  return (
                    <div 
                      key={categoryName}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryName)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition text-left select-none"
                      >
                        <span className="font-bold text-slate-800 text-base">
                          {categoryName}
                        </span>

                        <div className={`transform transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/40">
                          {items.map((metode) => {
                            const mId = metode.id_metode ?? metode.id ?? metode.payment_type;
                            const itemKey = String(mId);
                            const isSelected = selectedMethodId !== null && selectedMethodId !== undefined && String(selectedMethodId) === String(mId);

                            return (
                              <div
                                key={itemKey}
                                onClick={() => handlePilihMetode(metode)}
                                className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-sky-50/80'
                                    : 'hover:bg-slate-100/60 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-4 min-w-0 pr-2">
                                  <div className="w-14 h-10 relative flex-shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-100">
                                    <img
                                      src={getLogoUrl(metode)}
                                      alt={metode.nama_metode || metode.nama || 'Metode Pembayaran'}
                                      className="max-w-full max-h-full object-contain object-center"
                                    />
                                  </div>

                                  <div className="text-left min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-snug">
                                      {metode.nama_metode || metode.nama}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                      {getPotonganText(metode)}
                                    </p>
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= AKAN DI ATAS PADA MOBILE | DI KANAN PADA DESKTOP ================= */}
          <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-24">
            
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl p-6 sm:p-8 shadow-md text-white">
              <p className="text-xs sm:text-sm text-sky-50 font-medium tracking-wide">
                Total Pembayaran
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 mb-6">
                {formatCurrency(totalAmount)}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-200/40 rounded-xl text-white text-xs flex items-start gap-2 backdrop-blur-xs">
                  <FiAlertCircle className="w-4 h-4 text-red-100 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLanjutkanPembayaran}
                disabled={isLoading || isFetching || !selectedMetode}
                className={`w-full py-3.5 px-4 text-sm sm:text-base font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isLoading || isFetching || !selectedMetode
                    ? 'bg-white/30 text-white/70 cursor-not-allowed border border-white/20'
                    : 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-900/30 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Bayar'
                )}
              </button>
            </div>

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