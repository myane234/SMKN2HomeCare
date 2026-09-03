"use client";

import { useState, useEffect, useCallback } from 'react';
import { getTransaksiPasien } from '@/services/transaksiService';
import { FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function TransaksiPage() {
  console.log("-> KOMPONEN TRANSAKSI PAGE BERHASIL DIRENDER!");

  const [transaksiList, setTransaksiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [sortBy, setSortBy] = useState('tanggal_kunjungan');
  const [sortOrder, setSortOrder] = useState('desc');

  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransaksi = useCallback(async () => {
    console.log("-> Memulai fetch data transaksi ke backend...");
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (filterStatus) params.status_booking = filterStatus;
      if (filterTanggal) params.tanggal_dari = filterTanggal;

      const response = await getTransaksiPasien(params);
      console.log("-> Response mentah dari API transaksi:", response);

      let rawData = response.data || response;
      if (rawData && typeof rawData === 'object' && 'data' in rawData) {
        rawData = rawData.data;
      }

      setTransaksiList(Array.isArray(rawData) ? rawData : []);

      if (response.meta && response.meta.last_page) {
        setTotalPages(response.meta.last_page);
      } else if (response.last_page) {
        setTotalPages(response.last_page);
      }
    } catch (err) {
      console.error("-> Error saat fetch transaksi:", err);
      setError('Gagal memuat data transaksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, sortBy, sortOrder, filterStatus, filterTanggal]);

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  const handleFilterChange = () => {
    setPage(1);
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Riwayat Transaksi</h1>

        {/* Bagian Filter & Sorting */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); handleFilterChange(); }}
            >
              <option value="">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Diproses">Diproses </option>
              <option value="DiPerjalanan">Di Perjalanan</option>
              <option value="Tindakan">Tindakan</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Tanggal Mulai</label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={filterTanggal}
              onChange={(e) => { setFilterTanggal(e.target.value); handleFilterChange(); }}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Urutkan</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order);
                handleFilterChange();
              }}
            >
              <option value="tanggal_kunjungan-desc">Tanggal Kunjungan (Terbaru)</option>
              <option value="tanggal_kunjungan-asc">Tanggal Kunjungan (Terlama)</option>
              <option value="created_at-desc">Waktu Pemesanan (Terbaru)</option>
            </select>
          </div>
        </div>

        {/* Bagian List Data */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat transaksi...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">{error}</div>
        ) : transaksiList.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">Tidak ada data transaksi ditemukan.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold">Kode Booking</th>
                    <th className="p-4 font-semibold">Layanan</th>
                    <th className="p-4 font-semibold">Tanggal Kunjungan</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiList.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-mono">{item.booking_code || item.id_booking || '-'}</td>
                      <td className="p-4">{item.nama_layanan || 'Layanan Home Care'}</td>
                      <td className="p-4">{item.tanggal_kunjungan || '-'}</td>
                     <td className="p-4 font-medium text-gray-900">
                        {formatRupiah(
                            item.transaksi?.jumlah_total || 
                            item.transaksi?.total || 
                            item.jumlah_total || 
                            item.harga || 
                            item.layanan?.harga || 
                            item.total_harga
                        )}
                        </td>

                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                          ${item.status_booking === 'Selesai' ? 'bg-green-100 text-green-700' : 
                            item.status_booking === 'Diproses' ? 'bg-blue-100 text-blue-700' : 
                            item.status_booking === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                            item.status_booking === 'Dibatalkan' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'}`}>
                          {item.status_booking || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && transaksiList.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <FiChevronLeft />
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}