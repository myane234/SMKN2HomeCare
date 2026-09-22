import React, { useState, useEffect, useCallback } from 'react';
import { FaDownload, FaSyncAlt, FaExclamationTriangle, FaCalendarCheck, FaFilter } from 'react-icons/fa';
import Pagination from '../components/pagination';
import { getLaporanBooking, exportLaporanBooking } from '../data/laporanData';

export default function PageLaporanBooking() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // State Filter Aktif yang dipakai API
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    bulan: '',
    tahun: '',
    statusFilter: 'all',
    searchQuery: '',
  });

  // State Input Form
  const [formInput, setFormInput] = useState({
    startDate: '',
    endDate: '',
    bulan: '',
    tahun: '',
    statusFilter: 'all',
    searchQuery: '',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [laporanData, setLaporanData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        tanggal_dari: filters.startDate || undefined,
        tanggal_sampai: filters.endDate || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        bulan: filters.bulan || undefined,
        tahun: filters.tahun || undefined,
        status_booking: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
        search: filters.searchQuery.trim() || undefined,
        page: currentPage,
        per_page: perPage,
      };

      const res = await getLaporanBooking(params);
      setSummaryData(res?.summary || null);
      const dataArr = res?.data?.data || res?.data || [];
      setLaporanData(Array.isArray(dataArr) ? dataArr : []);
      setTotalItems(res?.data?.total || (Array.isArray(dataArr) ? dataArr.length : 0));
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data rekap booking.');
      setLaporanData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters({ ...formInput });
  };

  const handleResetFilter = () => {
    const emptyState = {
      startDate: '',
      endDate: '',
      bulan: '',
      tahun: '',
      statusFilter: 'all',
      searchQuery: '',
    };
    setFormInput(emptyState);
    setFilters(emptyState);
    setCurrentPage(1);
  };

  const renderNamaLayanan = (item) => {
    if (item.layanan_items && Array.isArray(item.layanan_items) && item.layanan_items.length > 0) {
      return item.layanan_items.map((l) => l.nama_layanan).join(', ');
    }
    return item.layanan?.nama_layanan || '-';
  };

  const handleExport = async (format = 'csv') => {
    try {
      setExporting(true);
      const params = {
        tanggal_dari: filters.startDate || undefined,
        tanggal_sampai: filters.endDate || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        bulan: filters.bulan || undefined,
        tahun: filters.tahun || undefined,
        status_booking: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
        search: filters.searchQuery.trim() || undefined,
        per_page: 'all',
      };

      const blob = await exportLaporanBooking(params, format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_booking_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal export:", err);
      alert(`Gagal mengunduh file: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaCalendarCheck className="text-primary" /> Laporan Rekap Booking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Rekapitulasi pemesanan layanan HomeCare secara menyeluruh</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} disabled={loading || exporting} className="btn-primary text-xs sm:text-sm px-3 py-2 flex items-center gap-1.5">
            <FaDownload /> {exporting ? 'Mengunduh...' : 'Unduh CSV'}
          </button>
          <button onClick={() => handleExport('xlsx')} disabled={loading || exporting} className="px-3 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-xs">
            <FaDownload /> {exporting ? 'Mengunduh...' : 'Unduh Excel'}
          </button>
          <button onClick={fetchData} disabled={loading} className="px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Booking</span>
          <p className="text-3xl font-extrabold text-slate-900">{summaryData?.total_booking || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai Dikerjakan</span>
          <p className="text-3xl font-extrabold text-emerald-600">{summaryData?.total_selesai || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dalam Proses</span>
          <p className="text-3xl font-extrabold text-blue-600">{summaryData?.total_proses || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dibatalkan</span>
          <p className="text-3xl font-extrabold text-red-500">{summaryData?.total_dibatalkan || 0}</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Dari - Sampai</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={formInput.startDate} onChange={(e) => setFormInput({ ...formInput, startDate: e.target.value })} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl" />
              <input type="date" value={formInput.endDate} onChange={(e) => setFormInput({ ...formInput, endDate: e.target.value })} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Bulan & Tahun</label>
            <div className="grid grid-cols-2 gap-2">
              <select value={formInput.bulan} onChange={(e) => setFormInput({ ...formInput, bulan: e.target.value })} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="">Semua Bulan</option>
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((b, idx) => (
                  <option key={idx + 1} value={idx + 1}>{b}</option>
                ))}
              </select>
              <input type="number" placeholder="Tahun (cth: 2026)" value={formInput.tahun} onChange={(e) => setFormInput({ ...formInput, tahun: e.target.value })} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Status Booking</label>
            <select value={formInput.statusFilter} onChange={(e) => setFormInput({ ...formInput, statusFilter: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="all">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Tindakan">Tindakan</option>
              <option value="DiPerjalanan">Di Perjalanan</option>
              <option value="Dibatalkan">Dibatalkan</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Pencarian Umum</label>
            <input type="text" value={formInput.searchQuery} onChange={(e) => setFormInput({ ...formInput, searchQuery: e.target.value })} placeholder="Cari berdasarkan kode booking, pasien, nakes, atau layanan..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>
          
          <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={handleResetFilter} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
              Reset Filter
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow-xs">
              <FaFilter /> Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2"><FaExclamationTriangle />{errorMsg}</div>}

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <span>Total Data: <strong className="text-slate-800">{totalItems}</strong> baris laporan</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Kode Booking</th>
                <th className="p-3.5">No. Rekam Medis</th>
                <th className="p-3.5">Pasien</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Tenaga Medis</th>
                <th className="p-3.5 min-w-[200px]">Alamat Kunjungan</th>
                <th className="p-3.5">Tgl Kunjungan</th>
                <th className="p-3.5">Jam Kunjungan</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-8 text-slate-400">Memuat data...</td></tr>
              ) : laporanData.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-slate-400">Tidak ada data rekap booking.</td></tr>
              ) : (
                laporanData.map((item, idx) => (
                  <tr key={item.id_booking || idx} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{item.booking_code || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-600">{item.medical_record_number || '-'}</td>
                    <td className="p-3.5 font-medium text-slate-800">{item.pasien?.nama_lengkap || '-'}</td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {renderNamaLayanan(item)}
                    </td>
                    <td className="p-3.5 font-medium text-emerald-700">
                      {item.tenaga_medis?.nama_lengkap || '-'}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs whitespace-normal leading-relaxed">
                      {item.alamat_kunjungan || item.alamat || '-'}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{item.tanggal_kunjungan || '-'}</td>
                    <td className="p-3.5 font-semibold text-slate-700 whitespace-nowrap">{item.jam_kunjungan || item.jam || '-'}</td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.status_booking}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bagian Bawah: Dropdown Tampilkan & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tampilkan:</span>
            <select 
              value={perPage} 
              onChange={(e) => { 
                setPerPage(e.target.value); 
                setCurrentPage(1); 
              }} 
              className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-700"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Semua</option>
            </select>
            <span>baris per halaman</span>
          </div>

          <div>
            {totalPages > 1 && perPage !== 'all' && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}