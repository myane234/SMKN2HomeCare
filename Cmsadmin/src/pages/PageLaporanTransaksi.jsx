import React, { useState, useEffect } from 'react';
import { FaDownload, FaSyncAlt, FaExclamationTriangle, FaMoneyBillWave, FaFilter } from 'react-icons/fa';
import Pagination from '../components/pagination';
// 1. Impor exportLaporanTransaksi
import { getLaporanTransaksi, exportLaporanTransaksi } from '../data/laporanData';

export default function PageLaporanTransaksi() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusPembayaran, setStatusPembayaran] = useState('all');
  const [metodePembayaran, setMetodePembayaran] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [laporanData, setLaporanData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        tanggal_dari: startDate || undefined,
        tanggal_sampai: endDate || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status_transaksi: statusFilter !== 'all' ? statusFilter : undefined,
        status_pembayaran: statusPembayaran !== 'all' ? statusPembayaran : undefined,
        metode_pembayaran: metodePembayaran || undefined,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        per_page: perPage,
      };

      const res = await getLaporanTransaksi(params);
      setSummaryData(res?.summary || null);
      const dataArr = res?.data?.data || res?.data || [];
      setLaporanData(Array.isArray(dataArr) ? dataArr : []);
      setTotalItems(res?.data?.total || (Array.isArray(dataArr) ? dataArr.length : 0));
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data laporan transaksi.');
      setLaporanData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, perPage]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setStatusPembayaran('all');
    setMetodePembayaran('');
    setSearchQuery('');
    setCurrentPage(1);
    setTimeout(fetchData, 50);
  };

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  // 2. Fungsi Export Menggunakan API Backend
  const handleExport = async (format = 'csv') => {
    try {
      setExporting(true);
      const params = {
        tanggal_dari: startDate || undefined,
        tanggal_sampai: endDate || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status_transaksi: statusFilter !== 'all' ? statusFilter : undefined,
        status_pembayaran: statusPembayaran !== 'all' ? statusPembayaran : undefined,
        metode_pembayaran: metodePembayaran || undefined,
        search: searchQuery.trim() || undefined,
      };

      const blob = await exportLaporanTransaksi(params, format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_transaksi_${new Date().toISOString().slice(0, 10)}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengunduh laporan transaksi: ' + err.message);
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
            <FaMoneyBillWave className="text-primary" /> Laporan Transaksi Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Rekapitulasi transaksi keuangan, pemesanan, dan performa tenaga medis secara menyeluruh</p>
        </div>
        {/* 3. Tombol Unduh Format CSV & Excel */}
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
      {/* ... (Sisa JSX Tabel & Filter tetap sama seperti file asal) */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</span>
          <p className="text-3xl font-extrabold text-slate-900">{summaryData?.total_transaksi || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan</span>
          <p className="text-3xl font-extrabold text-emerald-600">{formatRupiah(summaryData?.total_pendapatan)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hak Tenaga Medis</span>
          <p className="text-3xl font-extrabold text-blue-600">{formatRupiah(summaryData?.total_hak_nakes)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profit Platform</span>
          <p className="text-3xl font-extrabold text-purple-600">{formatRupiah(summaryData?.total_profit_hc)}</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Selesai</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Status Transaksi</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="all">Semua Status Transaksi</option>
              <option value="Lunas">Lunas</option>
              <option value="Pending">Pending</option>
              <option value="Belum Bayar">Belum Bayar</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Status Pembayaran</label>
            <select value={statusPembayaran} onChange={(e) => setStatusPembayaran(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
              <option value="all">Semua Pembayaran</option>
              <option value="berhasil">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="gagal">Gagal</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Pencarian</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Kode, Pasien, Nakes, Layanan..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-end gap-2 pt-2">
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

      {/* Tabel Data & Info Baris */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Total Data: <strong className="text-slate-800">{totalItems}</strong> baris laporan</span>
          <div className="flex items-center gap-2">
            <span>Tampilkan:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-semibold">
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Kode Booking</th>
                <th className="p-3.5">Pasien</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Tenaga Medis</th>
                <th className="p-3.5 text-right">Total Transaksi</th>
                <th className="p-3.5 text-right">Hak Nakes</th>
                <th className="p-3.5 text-right">Profit HC</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400">Memuat data...</td></tr>
              ) : laporanData.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400">Tidak ada data transaksi.</td></tr>
              ) : (
                laporanData.map((item, idx) => (
                  <tr key={item.id_transaksi || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{item.booking?.booking_code || '-'}</td>
                    <td className="p-3.5 font-medium text-slate-800">{item.booking?.pasien?.nama_lengkap || '-'}</td>
                    <td className="p-3.5 text-slate-600">{item.booking?.layanan?.nama_layanan || '-'}</td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {item.tenaga_medis?.nama_lengkap || 
                       item.booking?.tenaga_medis?.nama_lengkap || 
                       item.booking?.nakes?.nama_lengkap || 
                       '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{formatRupiah(item.jumlah_total)}</td>
                    <td className="p-3.5 text-right font-medium text-blue-600">{formatRupiah(item.hak_nakes)}</td>
                    <td className="p-3.5 text-right font-medium text-purple-600">{formatRupiah(item.profit_hc)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.status_transaksi === 'Lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status_transaksi}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </div>
    </div>
  );
}