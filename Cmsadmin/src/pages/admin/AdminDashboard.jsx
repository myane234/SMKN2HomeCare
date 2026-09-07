import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSession } from '../../utils/auth';
import { getAllActiveNakes } from '../../data/nakesData';
import { getAllNakesRequests } from '../../data/nakesRequestData';
import { getDashboardStats } from '../../data/dashboardStatsData';
import { 
  FaUserMd, FaUserCheck, FaClock, FaSyncAlt, 
  FaMoneyBillWave, FaCalendarCheck, FaUsers, FaStethoscope 
} from 'react-icons/fa';

export default function AdminDashboard() {
  const session = getSession();
  
  const [activeNakes, setActiveNakes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = () => {
    setLoading(true);
    setErrorMsg('');

    Promise.all([
      getAllActiveNakes().catch(() => []),
      getAllNakesRequests().catch(() => []),
      getDashboardStats().catch(() => null),
    ])
      .then(([activeData, requestData, statsData]) => {
        setActiveNakes(activeData || []);
        setRequests(requestData || []);
        setStats(statsData || null);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setErrorMsg(err.message || 'Gagal memuat data dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalActiveNakes = stats?.ringkasan?.total_nakes_aktif ?? activeNakes.length;
  const pendingCount = stats?.ringkasan?.total_nakes_pending ?? (Array.isArray(requests) ? requests : []).filter((item) => {
    const s = String(item?.status || 'pending').toLowerCase();
    return s === 'pending';
  }).length;

  const totalPasien = stats?.ringkasan?.total_pasien ?? '-';
  const bookingBulanIni = stats?.ringkasan?.booking_bulan_ini ?? '-';
  const pendapatanBulanIni = stats?.ringkasan?.pendapatan_bulan_ini !== undefined && stats?.ringkasan?.pendapatan_bulan_ini !== null ? 
    `Rp ${Number(stats.ringkasan.pendapatan_bulan_ini).toLocaleString('id-ID')}` : '-';

  const summaryCards = [
    { label: 'Total Pasien', value: totalPasien, icon: <FaUsers />, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Total Nakes Aktif', value: totalActiveNakes, icon: <FaUserCheck />, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { label: 'Verifikasi Nakes Pending', value: pendingCount, icon: <FaClock />, bg: 'bg-amber-100', color: 'text-amber-600' },
    { label: 'Booking Bulan Ini', value: bookingBulanIni, icon: <FaCalendarCheck />, bg: 'bg-purple-100', color: 'text-purple-600' },
    { label: 'Pendapatan Bulan Ini', value: pendapatanBulanIni, icon: <FaMoneyBillWave />, bg: 'bg-teal-100', color: 'text-teal-600' },
  ];

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  const topLayanan = stats?.top_layanan_populer || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-subtitle">Ringkasan operasional, transaksi, dan data tenaga medis SmartHomeCare.</p>
          <p className="mt-1 text-xs text-slate-400">
            Login sebagai: <strong>{session?.name || 'Administrator'}</strong>
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 shadow-2xs w-max"
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div className="card flex items-center gap-3.5 p-4 sm:p-5" key={card.label}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bg} ${card.color} text-xl`}>
              {card.icon}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : card.value}</div>
              <div className="text-[12px] text-slate-500 font-medium">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel Nakes Aktif Terbaru (2 Cols) */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Nakes Resmi / Aktif Terbaru</h2>
              <p className="text-xs text-slate-500">Tenaga kesehatan yang akunnya telah diverifikasi dan aktif</p>
            </div>
            <Link to="/nakes" className="btn-outline text-xs">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : activeNakes.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Belum ada tenaga medis yang aktif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-125 border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-left">Nama</th>
                    <th className="py-3 px-4 text-left">Jenis Nakes</th>
                    <th className="py-3 px-4 text-left">No. STR</th>
                    <th className="py-3 px-4 text-left">Tanggal Aktif</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeNakes.slice(0, 5).map((item, idx) => {
                    const nama = item.nama_lengkap ?? item.nama ?? item.user?.name ?? '-';
                    const jenis = item.jenis_tenaga_medis ?? item.jenis ?? '-';
                    const noStr = item.no_str ?? '-';
                    const tanggal = formatDate(item.created_at);

                    return (
                      <tr key={item.id_tenaga_medis ?? item.id ?? idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {nama}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="badge badge-aktif">{jenis}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {noStr}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {tanggal}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Layanan Populer (1 Col) */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaStethoscope className="text-primary" /> Layanan Populer
            </h2>
            <p className="text-xs text-slate-500">Paling sering dipesan pasien</p>
          </div>

          <div className="p-5 space-y-4">
            {loading ? (
              <p className="text-center text-xs text-slate-400 py-6">Memuat layanan populer...</p>
            ) : topLayanan.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Belum ada statistik layanan</p>
            ) : (
              topLayanan.map((layanan, idx) => (
                <div key={layanan.id_layanan || idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate" title={layanan.nama_layanan}>
                      {layanan.nama_layanan}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Rp {Number(layanan.harga_layanan || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 shrink-0 shadow-2xs">
                    {layanan.bookings_count || 0} order
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
