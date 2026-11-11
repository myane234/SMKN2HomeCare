import React, { useState, useEffect } from 'react';
import { 
  FaFileExcel, FaDownload, FaCalendarAlt, FaFilter, 
  FaSyncAlt, FaMoneyBillWave, FaCalendarCheck, FaUserMd, 
  FaChartPie, FaSearch, FaExclamationTriangle
} from 'react-icons/fa';
import Pagination from '../components/pagination';
import { 
  getLaporanTransaksi, 
  getLaporanBooking, 
  getLaporanNakes 
} from '../data/laporanData';

export default function PageLaporan() {
  const [activeTab, setActiveTab] = useState('transaksi'); // 'transaksi' | 'booking' | 'nakes'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  // Data States
  const [laporanData, setLaporanData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const fetchLaporan = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'transaksi') {
        const params = {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status_transaksi: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
          per_page: perPage,
        };
        const res = await getLaporanTransaksi(params);
        setSummaryData(res?.summary || null);
        const dataArr = res?.data?.data || res?.data || [];
        setLaporanData(Array.isArray(dataArr) ? dataArr : []);
        setTotalItems(res?.data?.total || (Array.isArray(dataArr) ? dataArr.length : 0));
      } else if (activeTab === 'booking') {
        const params = {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status_booking: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
          per_page: perPage,
        };
        const res = await getLaporanBooking(params);
        setSummaryData(res?.summary || null);
        const dataArr = res?.data?.data || res?.data || [];
        setLaporanData(Array.isArray(dataArr) ? dataArr : []);
        setTotalItems(res?.data?.total || (Array.isArray(dataArr) ? dataArr.length : 0));
      } else if (activeTab === 'nakes') {
        const params = {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          search: searchQuery.trim() || undefined,
          page: currentPage,
          per_page: perPage,
        };
        const res = await getLaporanNakes(params);
        setSummaryData(res?.summary || null);
        const dataArr = res?.data?.data || res?.data || [];
        setLaporanData(Array.isArray(dataArr) ? dataArr : []);
        setTotalItems(res?.data?.total || (Array.isArray(dataArr) ? dataArr.length : 0));
      }
    } catch (err) {
      console.error('Gagal mengambil data laporan:', err);
      setErrorMsg(err.message || 'Gagal memuat data laporan dari server.');
      setLaporanData([]);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [activeTab, currentPage, perPage, statusFilter, startDate, endDate]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLaporan();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (!laporanData || laporanData.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Indonesian Excel
    const dateTag = new Date().toISOString().slice(0, 10);
    let filename = `laporan_${activeTab}_${dateTag}.csv`;

    if (activeTab === 'transaksi') {
      const headers = ['ID Transaksi', 'ID Booking', 'Kode Booking', 'Pasien', 'Layanan', 'Nakes', 'Total Biaya', 'Hak Nakes', 'Profit HC', 'Metode Bayar', 'Status', 'Waktu Bayar'];
      csvContent += headers.join(';') + '\r\n';
      laporanData.forEach((row) => {
        const item = [
          row.id_transaksi || '',
          row.id_booking || '',
          `"${(row.booking?.booking_code || '').replace(/"/g, '""')}"`,
          `"${(row.booking?.pasien?.nama_lengkap || '').replace(/"/g, '""')}"`,
          `"${(row.booking?.layanan?.nama_layanan || '').replace(/"/g, '""')}"`,
          `"${(row.booking?.tenaga_medis?.nama_lengkap || '').replace(/"/g, '""')}"`,
          row.jumlah_total || 0,
          row.hak_nakes || 0,
          row.profit_hc || 0,
          `"${(row.metode_pembayaran || '').replace(/"/g, '""')}"`,
          `"${(row.status_transaksi || '').replace(/"/g, '""')}"`,
          row.waktu_bayar ? new Date(row.waktu_bayar).toLocaleString('id-ID') : '',
        ];
        csvContent += item.join(';') + '\r\n';
      });
    } else if (activeTab === 'booking') {
      const headers = ['ID Booking', 'Kode Booking', 'No Rekam Medis', 'Pasien', 'Layanan', 'Tgl Kunjungan', 'Jam', 'Status Booking'];
      csvContent += headers.join(';') + '\r\n';
      laporanData.forEach((row) => {
        const item = [
          row.id_booking || '',
          `"${(row.booking_code || '').replace(/"/g, '""')}"`,
          `"${(row.medical_record_number || '').replace(/"/g, '""')}"`,
          `"${(row.pasien?.nama_lengkap || '').replace(/"/g, '""')}"`,
          `"${(row.layanan?.nama_layanan || '').replace(/"/g, '""')}"`,
          row.tanggal_kunjungan || '',
          row.jam_kunjungan || '',
          `"${(row.status_booking || '').replace(/"/g, '""')}"`,
        ];
        csvContent += item.join(';') + '\r\n';
      });
    } else if (activeTab === 'nakes') {
      const headers = ['ID Nakes', 'Nama Tenaga Medis', 'Profesi', 'No STR', 'Status', 'Total Booking', 'Selesai', 'Batal', 'Hak Nakes', 'Rating'];
      csvContent += headers.join(';') + '\r\n';
      laporanData.forEach((row) => {
        const item = [
          row.id_tenaga_medis || '',
          `"${(row.nama_lengkap || '').replace(/"/g, '""')}"`,
          `"${(row.profesi || '').replace(/"/g, '""')}"`,
          `"${(row.nomor_str || '').replace(/"/g, '""')}"`,
          `"${(row.status_nakes || '').replace(/"/g, '""')}"`,
          row.total_booking || 0,
          row.total_selesai || 0,
          row.total_dibatalkan || 0,
          row.total_hak_nakes || 0,
          row.rating || 0,
        ];
        csvContent += item.join(';') + '\r\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaFileExcel className="text-primary" /> Laporan & Export Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi transaksi keuangan, pemesanan, dan performa tenaga medis dengan unduh data
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={loading || laporanData.length === 0}
            className="btn-primary text-xs sm:text-sm px-4 py-2 flex items-center gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload /> Unduh Excel / CSV
          </button>
          <button
            onClick={fetchLaporan}
            disabled={loading}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 shadow-2xs"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => handleTabChange('transaksi')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'transaksi' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaMoneyBillWave /> Laporan Transaksi Keuangan
        </button>
        <button
          onClick={() => handleTabChange('booking')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'booking' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaCalendarCheck /> Laporan Rekap Booking
        </button>
        <button
          onClick={() => handleTabChange('nakes')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'nakes' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaUserMd /> Laporan Kinerja Tenaga Medis
        </button>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'transaksi' && (
            <>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Transaksi</span>
                <p className="text-2xl font-bold text-slate-900">{summaryData.total_transaksi || 0}</p>
                <span className="text-[11px] text-slate-400">Semua transaksi periode ini</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Pendapatan</span>
                <p className="text-2xl font-bold text-emerald-600">{formatRupiah(summaryData.total_pendapatan)}</p>
                <span className="text-[11px] text-slate-400">Total akumulasi bruto</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Hak Tenaga Medis</span>
                <p className="text-2xl font-bold text-blue-600">{formatRupiah(summaryData.total_hak_nakes)}</p>
                <span className="text-[11px] text-slate-400">Porsi bagi hasil nakes</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Profit Platform</span>
                <p className="text-2xl font-bold text-purple-600">{formatRupiah(summaryData.total_profit_hc)}</p>
                <span className="text-[11px] text-slate-400">Laba bersih Home Care</span>
              </div>
            </>
          )}

          {activeTab === 'booking' && (
            <>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Booking</span>
                <p className="text-2xl font-bold text-slate-900">{summaryData.total_booking || 0}</p>
                <span className="text-[11px] text-slate-400">Pesanan layanan masuk</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Selesai Dikerjakan</span>
                <p className="text-2xl font-bold text-emerald-600">{summaryData.total_selesai || 0}</p>
                <span className="text-[11px] text-slate-400">Layanan sukses</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Dalam Proses</span>
                <p className="text-2xl font-bold text-blue-600">{summaryData.total_proses || 0}</p>
                <span className="text-[11px] text-slate-400">Perjalanan & tindakan</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Dibatalkan</span>
                <p className="text-2xl font-bold text-red-500">{summaryData.total_dibatalkan || 0}</p>
                <span className="text-[11px] text-slate-400">Booking batal</span>
              </div>
            </>
          )}

          {activeTab === 'nakes' && (
            <>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Tenaga Medis</span>
                <p className="text-2xl font-bold text-slate-900">{summaryData.total_nakes || 0}</p>
                <span className="text-[11px] text-slate-400">Nakes terdaftar di sistem</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Order Selesai</span>
                <p className="text-2xl font-bold text-emerald-600">{summaryData.total_order_selesai || 0}</p>
                <span className="text-[11px] text-slate-400">Akumulasi kunjungan tuntas</span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Akumulasi Pembagian Hak Nakes</span>
                <p className="text-2xl font-bold text-blue-600">{formatRupiah(summaryData.total_akumulasi_hak_nakes)}</p>
                <span className="text-[11px] text-slate-400">Total pendapatan yang disalurkan kepada nakes</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input text-xs sm:text-sm"
            />
          </div>

          {activeTab === 'transaksi' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status Transaksi</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input text-xs sm:text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Pending">Pending</option>
                <option value="Gagal">Gagal</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          )}

          {activeTab === 'booking' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status Booking</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input text-xs sm:text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="Selesai">Selesai</option>
                <option value="DiPerjalanan">Di Perjalanan</option>
                <option value="Tindakan">Tindakan</option>
                <option value="Pending">Pending</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          )}

          {activeTab === 'nakes' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Cari Nakes / STR</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama / No STR..."
                  className="form-input pl-9 text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="btn-primary text-xs sm:text-sm px-4 py-2 flex items-center gap-1.5 w-full justify-center"
            >
              <FaFilter /> Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <FaExclamationTriangle className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            Total Data: <strong>{totalItems}</strong> baris laporan
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tampilkan:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {activeTab === 'transaksi' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Kode Booking</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Tenaga Medis</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4 text-right">Hak Nakes</th>
                  <th className="py-3 px-4 text-right">Profit HC</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FaSyncAlt className="animate-spin text-2xl mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-slate-600">Memuat laporan transaksi...</p>
                    </td>
                  </tr>
                ) : laporanData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FaFileExcel size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Belum ada data transaksi pada rentang ini</p>
                    </td>
                  </tr>
                ) : (
                  laporanData.map((row) => (
                    <tr key={row.id_transaksi || row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {row.booking?.booking_code || `#${row.id_transaksi}`}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {row.booking?.pasien?.nama_lengkap || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.booking?.layanan?.nama_layanan || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.booking?.tenaga_medis?.nama_lengkap || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(row.jumlah_total)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                        {formatRupiah(row.hak_nakes)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                        {formatRupiah(row.profit_hc)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          String(row.status_transaksi).toLowerCase() === 'lunas'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status_transaksi || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'booking' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Kode Booking</th>
                  <th className="py-3 px-4">No. Rekam Medis</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Tgl Kunjungan</th>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FaSyncAlt className="animate-spin text-2xl mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-slate-600">Memuat laporan booking...</p>
                    </td>
                  </tr>
                ) : laporanData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FaCalendarCheck size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Belum ada data booking pada rentang ini</p>
                    </td>
                  </tr>
                ) : (
                  laporanData.map((row) => (
                    <tr key={row.id_booking || row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {row.booking_code || `#${row.id_booking}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {row.medical_record_number || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {row.pasien?.nama_lengkap || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.layanan?.nama_layanan || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(row.tanggal_kunjungan)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {row.jam_kunjungan || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {row.status_booking || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'nakes' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Nama Nakes</th>
                  <th className="py-3 px-4">Profesi</th>
                  <th className="py-3 px-4">No. STR</th>
                  <th className="py-3 px-4 text-center">Total Order</th>
                  <th className="py-3 px-4 text-center">Selesai</th>
                  <th className="py-3 px-4 text-center">Batal</th>
                  <th className="py-3 px-4 text-right">Akumulasi Hak</th>
                  <th className="py-3 px-4 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FaSyncAlt className="animate-spin text-2xl mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-slate-600">Memuat laporan nakes...</p>
                    </td>
                  </tr>
                ) : laporanData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FaUserMd size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Belum ada data kinerja nakes</p>
                    </td>
                  </tr>
                ) : (
                  laporanData.map((row) => (
                    <tr key={row.id_tenaga_medis || row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {row.nama_lengkap || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.profesi || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {row.nomor_str || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {row.total_booking || 0}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                        {row.total_selesai || 0}
                      </td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold">
                        {row.total_dibatalkan || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-bold">
                        {formatRupiah(row.total_hak_nakes)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-500">
                        ★ {row.rating || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </div>
  );
}
