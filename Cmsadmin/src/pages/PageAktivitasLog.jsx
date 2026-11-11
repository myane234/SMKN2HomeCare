import React, { useState, useEffect } from 'react';
import { 
  FaHistory, FaSearch, FaTrash, FaEye, FaSyncAlt, 
  FaFilter, FaCalendarAlt, FaTimes, FaUserShield, FaExclamationTriangle 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import Pagination from '../components/pagination';
import { 
  getActivityLogs, 
  deleteActivityLog, 
  clearOldActivityLogs 
} from '../data/activityLogData';

export default function PageAktivitasLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Detail
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Modal Bersihkan Log
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearDays, setClearDays] = useState(30);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        search: search.trim() || undefined,
        user_type: userType !== 'all' ? userType : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        per_page: perPage,
      };

      const res = await getActivityLogs(params);
      const dataWrapper = res?.data;

      if (Array.isArray(dataWrapper)) {
        setLogs(dataWrapper);
        setTotalItems(dataWrapper.length);
      } else if (Array.isArray(dataWrapper?.data)) {
        setLogs(dataWrapper.data);
        setTotalItems(dataWrapper.total ?? dataWrapper.data.length);
      } else {
        setLogs([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Gagal mengambil data log:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar log aktivitas.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, perPage, userType, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilter = () => {
    setSearch('');
    setUserType('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDelete = async (idLog) => {
    const confirm = await Swal.fire({
      title: 'Hapus Log Ini?',
      text: 'Catatan aktivitas ini akan dihapus secara permanen dari server.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteActivityLog(idLog);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Log aktivitas berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchLogs();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || 'Gagal menghapus log aktivitas.',
      });
    }
  };

  const handleClearLogs = async () => {
    const confirm = await Swal.fire({
      title: `Bersihkan Log Lebih Tua dari ${clearDays} Hari?`,
      text: 'Semua catatan log lama sebelum rentang waktu ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Bersihkan',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    setClearing(true);
    try {
      const res = await clearOldActivityLogs(clearDays);
      setShowClearModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Pembersihan Selesai',
        text: res.message || `Log aktivitas lebih tua dari ${clearDays} hari berhasil dibersihkan.`,
      });
      fetchLogs();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || 'Gagal membersihkan log aktivitas lama.',
      });
    } finally {
      setClearing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getBadgeUserType = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'pasien':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tenaga medis':
      case 'nakes':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'system':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaHistory className="text-primary" /> Log Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catatan riwayat audit dan aktivitas pengguna di dalam sistem
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-2 shadow-2xs"
          >
            <FaTrash /> Bersihkan Log Lama
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 shadow-2xs"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Pencarian</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="User / Aksi / Deskripsi..."
                className="form-input pl-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipe Pengguna</label>
            <select
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input text-xs sm:text-sm"
            >
              <option value="all">Semua Tipe User</option>
              <option value="Admin">Admin</option>
              <option value="Pasien">Pasien</option>
              <option value="Tenaga Medis">Tenaga Medis</option>
              <option value="System">System</option>
            </select>
          </div>

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

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Reset Filter
            </button>
            <button
              type="submit"
              className="btn-primary text-xs sm:text-sm px-4 py-1.5 flex items-center gap-1.5"
            >
              <FaFilter /> Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            Total Log: <strong>{totalItems}</strong> catatan
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

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <FaExclamationTriangle className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FaSyncAlt className="animate-spin text-2xl mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-slate-600">Memuat data log aktivitas...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FaHistory size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Tidak ada data log aktivitas ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter tanggal Anda.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id_log || log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {log.user_name || `User #${log.user_id}`}
                        </span>
                        <span className={`inline-block w-max text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getBadgeUserType(log.user_type)}`}>
                          {log.user_type || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={log.description}>
                      {log.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Detail Log"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id_log || log.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Log"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Modal Detail Log */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaHistory className="text-primary" /> Detail Aktivitas Log #{selectedLog.id_log || selectedLog.id}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Waktu:</span>
                <span className="col-span-2 text-slate-800 font-mono font-semibold">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">User:</span>
                <span className="col-span-2 text-slate-800 font-semibold">
                  {selectedLog.user_name || '-'} (ID: {selectedLog.user_id || '-'})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tipe User:</span>
                <div className="col-span-2">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getBadgeUserType(selectedLog.user_type)}`}>
                    {selectedLog.user_type || 'System'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Aksi:</span>
                <span className="col-span-2 text-slate-800 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded w-max">
                  {selectedLog.action}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">IP Address:</span>
                <span className="col-span-2 text-slate-800 font-mono">
                  {selectedLog.ip_address || '-'}
                </span>
              </div>

              <div className="py-1">
                <span className="text-slate-500 font-medium block mb-1">Deskripsi Aktivitas:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedLog.description || '-'}
                </p>
              </div>

              {selectedLog.user_agent && (
                <div className="py-1">
                  <span className="text-slate-500 font-medium block mb-1">User Agent / Browser:</span>
                  <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg break-all border border-slate-100">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bersihkan Log Lama */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaTrash className="text-amber-600" /> Bersihkan Log Lama
              </h3>
              <button
                onClick={() => setShowClearModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Pilih batas usia catatan log yang ingin dihapus. Semua log aktivitas yang tercatat lebih lama dari jumlah hari yang ditentukan akan dihapus secara permanen.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Hapus log lebih tua dari:</label>
              <select
                value={clearDays}
                onChange={(e) => setClearDays(Number(e.target.value))}
                className="form-input text-xs sm:text-sm"
              >
                <option value={7}>7 Hari</option>
                <option value={14}>14 Hari</option>
                <option value={30}>30 Hari (1 Bulan)</option>
                <option value={60}>60 Hari (2 Bulan)</option>
                <option value={90}>90 Hari (3 Bulan)</option>
                <option value={180}>180 Hari (6 Bulan)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm rounded-xl transition flex items-center gap-2"
              >
                {clearing ? <FaSyncAlt className="animate-spin" /> : <FaTrash />}
                <span>{clearing ? 'Membersihkan...' : 'Bersihkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
