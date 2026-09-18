'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDetailRiwayatKunjungan } from '@/services/nakesService';

function DetailRiwayatContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('ID Kunjungan tidak valid.');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDetailRiwayatKunjungan(id);
        setDetail(res?.data || res);
      } catch (err) {
        setError('Gagal memuat detail riwayat kunjungan.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const formatStatusText = (status) => {
    if (status === 'DiPerjalanan') return 'Di Perjalanan';
    return status || 'Selesai';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-500/10 text-emerald-100 border-emerald-400/30';
      case 'Tindakan':
        return 'bg-purple-500/10 text-purple-100 border-purple-400/30';
      case 'DiPerjalanan':
        return 'bg-blue-500/10 text-blue-100 border-blue-400/30';
      default:
        return 'bg-slate-500/10 text-slate-100 border-slate-400/30';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center space-y-3">
        <p className="text-red-500 font-medium text-xs sm:text-sm">{error || 'Data kunjungan tidak ditemukan.'}</p>
      </div>
    );
  }

  const booking = detail?.booking || {};
  const pasien = booking?.pasien || {};
  const layananItems = booking?.layanan_items || [];
  const statusKunjungan = detail?.status_kunjungan || booking?.status_booking;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Header Biru Full-Width di Mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pt-6 pb-8 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-2xl sm:max-w-7xl sm:mx-auto sm:mt-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">
              Rincian Transaksi
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">Detail Kunjungan Medis</h1>
            <p className="text-xs sm:text-sm text-blue-100 font-mono mt-0.5">
              Kode Booking: {booking?.booking_code || '-'}
            </p>
          </div>
          <div>
            <span
              className={`inline-block px-3.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${getStatusBadgeStyle(
                statusKunjungan
              )}`}
            >
              {formatStatusText(statusKunjungan)}
            </span>
          </div>
        </div>

        {/* Ornaments Background */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Konten Utama Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* Kolom Kiri: Informasi Pasien */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Informasi Pasien
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Nama Pasien</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {pasien?.nama_lengkap || 'Nama Pasien Tidak Ditemukan'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Alamat Kunjungan</p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                  {booking?.alamat_kunjungan || pasien?.alamat_utama || 'Alamat tidak dicantumkan'}
                </p>
              </div>

              {booking?.tanggal_kunjungan && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-400">Waktu Kunjungan</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{booking.tanggal_kunjungan} ({booking.jam_kunjungan})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Daftar Layanan & BHP */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Daftar Layanan & Alat Medis (BHP)
            </h2>

            {layananItems.length > 0 ? (
              <div className="space-y-3">
                {layananItems.map((item, idx) => (
                  <div
                    key={item.id_layanan || idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.nama_layanan}</h3>
                        {item.deskripsi && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2.5 py-0.5 rounded shrink-0 uppercase tracking-wider">
                        {item.kategori?.nama_kategori || 'Medis'}
                      </span>
                    </div>

                    {/* Section BHP */}
                    {Array.isArray(item.bhp) && item.bhp.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/80">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Bahan Habis Pakai (BHP) / Peralatan:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.bhp.map((b) => (
                            <span
                              key={b.id_bhp}
                              className="text-xs bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium shadow-2xs"
                            >
                              {b.nama_bhp} <strong className="text-blue-600">({b.qty_default}x)</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Tidak ada rincian layanan.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DetailRiwayatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 text-xs">Memuat detail...</div>}>
      <DetailRiwayatContent />
    </Suspense>
  );
}