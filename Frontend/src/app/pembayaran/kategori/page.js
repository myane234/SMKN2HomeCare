'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { pembayaranService } from '@/services/pembayaranService';

function KategoriPembayaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
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

  useEffect(() => {
    const fetchKategori = async () => {
      try {
        setIsFetching(true);
        setError('');

        const resKategori = await pembayaranService.getKategori();
        
        // Handle format response array / object
        if (resKategori?.success || Array.isArray(resKategori?.data) || Array.isArray(resKategori)) {
          const rawData = resKategori.data || resKategori;
          const activeCategories = Array.isArray(rawData) 
            ? rawData.filter((cat) => cat.is_active !== false) 
            : [];
          setCategories(activeCategories);
        } else {
          setError('Gagal memuat kategori pembayaran.');
        }
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan koneksi saat mengambil kategori pembayaran.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchKategori();
  }, []);

  const handleSelectKategori = (cat) => {
    const categoryId = typeof cat === 'object' ? (cat.id_kategori_pembayaran || cat.id || '') : cat;
    const categoryNama = typeof cat === 'object' ? (cat.nama_kategori || cat.nama || '') : '';
    // Navigasi ke halaman pilih-metode membawa id_kategori, nama_kategori, booking_id, dan total
    router.push(
      `/pembayaran/pilih-metode?kategori_id=${categoryId}&kategori_nama=${encodeURIComponent(categoryNama)}&booking_id=${bookingId}&total=${totalAmount}`
    );
  };

  const formatCurrency = (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) return 'Rp 0';
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
              Pilih Kategori Pembayaran
            </h1>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* ================= BAGIAN KIRI ================= */}
          <div className="w-full lg:flex-1">
            
            {/* Card Total Pembayaran (Mobile) */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl px-6 py-8 mb-6 shadow-md text-white flex flex-col justify-center lg:hidden">
              <p className="text-xs sm:text-sm text-sky-50 font-medium tracking-wide">
                Total Pembayaran
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Pilih Kategori Pembayaran
            </p>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {isFetching ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
                <p className="mt-3 text-sm text-slate-500">Memuat kategori pembayaran...</p>
              </div>
            ) : (
              /* List Card Kategori */
              <div className="space-y-4">
                {categories.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                    Kategori pembayaran tidak tersedia.
                  </div>
                ) : (
                  categories.map((cat) => (
                    <button
                      key={cat.id_kategori_pembayaran || cat.id}
                      type="button"
                      onClick={() => handleSelectKategori(cat)}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 transition-all duration-200 text-left group active:scale-[0.99]"
                    >
                      <div className="pr-4">
                        <p className="text-base font-bold text-slate-900">
                          {cat.nama_kategori || cat.nama}
                        </p>
                        {cat.deskripsi && (
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                            {cat.deskripsi}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-slate-700 group-hover:translate-x-1 transition-transform">
                        <FiChevronRight className="w-6 h-6 stroke-[2.5]" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

          </div>

          {/* ================= BAGIAN KANAN ================= */}
          <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-28">
            
            {/* Card Total Pembayaran (Desktop) */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl px-6 py-8 shadow-md text-white hidden lg:flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-sky-50 font-medium tracking-wide">
                Total Pembayaran
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default function KategoriPembayaranPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
          <p className="mt-4 text-gray-600">Memuat kategori pembayaran...</p>
        </div>
      </div>
    }>
      <KategoriPembayaranContent />
    </Suspense>
  );
}