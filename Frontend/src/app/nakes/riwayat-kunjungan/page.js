'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getRiwayatKunjungan } from '@/services/nakesService';

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Di Perjalanan', value: 'DiPerjalanan' },
  { label: 'Tindakan', value: 'Tindakan' },
  { label: 'Selesai', value: 'Selesai' },
];

export default function RiwayatKunjunganPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRiwayatKunjungan({
        status: selectedStatus,
        per_page: 20,
      });

      const dataArray = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.data?.data || [];

      setRiwayat(dataArray);
    } catch (err) {
      setError('Gagal memuat daftar riwayat kunjungan.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchRiwayat();
  }, [fetchRiwayat]);

  const formatStatusText = (status) => {
    if (status === 'DiPerjalanan') return 'Di Perjalanan';
    return status || 'Selesai';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Tindakan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DiPerjalanan':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Header Biru Full-Width (Nempel ke pinggir layar mobile, rounded di desktop) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pt-6 pb-8 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-2xl sm:max-w-7xl sm:mx-auto sm:mt-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto space-y-1">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">
            Portal Tenaga Medis
          </span>
          <h1 className="text-xl sm:text-2xl font-bold">Riwayat Kunjungan</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Pantau seluruh aktivitas tindakan dan status kunjungan medis pasien Anda secara realtime.
          </p>
        </div>
        
        {/* Ornamen Latar Belakang Subtle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Konten Utama */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        
        {/* Filter Status Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Responsive Grid List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-slate-200/70 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-xs sm:text-sm">
            {error}
          </div>
        ) : riwayat.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Belum ada riwayat kunjungan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {riwayat.map((item, index) => {
              const booking = item?.booking || {};
              const pasien = booking?.pasien || {};
              const layananItems = booking?.layanan_items || [];
              const rawStatus = item?.status_kunjungan || booking?.status_booking;
              const itemId = item?.id_riwayat_kunjungan || booking?.id_booking;

              const serviceNames = layananItems.length > 0
                ? layananItems.map((l) => l.nama_layanan).join(', ')
                : 'Layanan Medis';

              return (
                <div
                  key={itemId || index}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium text-slate-400 truncate">
                        {booking?.booking_code || '-'}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadgeStyle(
                          rawStatus
                        )}`}
                      >
                        {formatStatusText(rawStatus)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-1">
                        {pasien?.nama_lengkap || 'Nama Pasien Tidak Ditemukan'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {serviceNames}
                      </p>
                    </div>

                    {booking?.tanggal_kunjungan && (
                      <div className="text-xs text-slate-400 flex items-center gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{booking.tanggal_kunjungan}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{booking.jam_kunjungan}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/nakes/riwayat-kunjungan/detail?id=${itemId}`}
                    className="w-full block text-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
                  >
                    Detail Kunjungan
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}