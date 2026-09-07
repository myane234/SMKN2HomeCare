'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiAlertCircle
} from 'react-icons/fi';
import { pembayaranService } from '@/services/pembayaranService';

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
  seabank: '/images/payment/seabank.png',
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

  useEffect(() => {
    // 1. Ambil LANGSUNG dari query parameter URL via useSearchParams()
    const urlTotal = searchParams.get('total') || searchParams.get('total_harga') || searchParams.get('harga') || searchParams.get('amount') || searchParams.get('price');
    const urlBookingId = searchParams.get('booking_id') || searchParams.get('id') || searchParams.get('bookingId');

    let bId = urlBookingId || '';
    let tAmount = urlTotal || '';

    // 2. Hanya jika parameter query URL kosong, gunakan fallback dari storage/state
    if (!tAmount && typeof window !== 'undefined') {
      try {
        const savedBooking = localStorage.getItem('last_booking') || localStorage.getItem('pending_order');
        if (savedBooking) {
          const parsed = JSON.parse(savedBooking);
          if (!bId) bId = parsed.booking_id || parsed.id || '';
          tAmount = parsed.total || parsed.jumlah_total || parsed.price || '';
        }
      } catch (err) {}
    }

    setBookingId(String(bId || ''));
    setTotalAmount(String(tAmount || '1225000'));
  }, [searchParams]);

  // Fetch data metode pembayaran dari API CMS & Filter berdasarkan Kategori
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

        // Filter berdasarkan kategori_id / kategori_nama dari query URL
        const kategoriIdParam = searchParams.get('kategori_id');
        const kategoriNamaParam = searchParams.get('kategori_nama') || searchParams.get('kategori');

        let filtered = allMethods;
        if (kategoriIdParam || kategoriNamaParam) {
          filtered = allMethods.filter((item) => {
            const matchId = kategoriIdParam && String(item.id_kategori_pembayaran) === String(kategoriIdParam);
            
            const categoryNameInItem = (
              item.nama_kategori || 
              item.kategori?.nama_kategori || 
              item.kategori?.nama || 
              ''
            ).toLowerCase();

            const matchNama = kategoriNamaParam && categoryNameInItem.includes(kategoriNamaParam.toLowerCase());
            
            return matchId || matchNama;
          });

          // Fallback ke seluruh list jika filter mengembalikan 0 hasil
          if (filtered.length === 0) {
            filtered = allMethods;
          }
        }

        setMetodeList(filtered);
      } catch (err) {
        console.error('Gagal mengambil metode pembayaran:', err);
        setMetodeList(DEFAULT_METODE_FALLBACK);
      } finally {
        setIsFetching(false);
      }
    };

    fetchMetode();
  }, [searchParams]);

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
      // Langsung arahkan ke halaman paymentQR dengan membawa parameter yang dibutuhkan
      router.push(
        `/pembayaran/paymentQR?metode=${paymentType}&booking_id=${bookingId}&total=${totalAmount}`
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
              
              {isFetching ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
                  <p className="mt-3 text-sm text-slate-500">Memuat metode pembayaran...</p>
                </div>
              ) : metodeList.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                  Metode pembayaran tidak tersedia untuk kategori ini.
                </div>
              ) : (
                metodeList.map((metode) => {
                  const mId = metode.id_metode ?? metode.id ?? metode.payment_type;
                  const itemKey = String(mId);
                  const isSelected = selectedMethodId !== null && selectedMethodId !== undefined && String(selectedMethodId) === String(mId);

                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => handlePilihMetode(metode)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-10 relative flex-shrink-0 flex items-center justify-center">
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
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
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
                    </button>
                  );
                })
              )}
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
              disabled={isLoading || isFetching || !selectedMetode}
              className={`w-full py-4 px-4 text-sm sm:text-base font-bold text-white rounded-xl transition flex items-center justify-center gap-2 ${
                isLoading || isFetching || !selectedMetode
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