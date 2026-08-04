import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSession } from '../../utils/auth';
import { getAllActiveNakes } from '../../data/nakesData';
import { getAllNakesRequests } from '../../data/nakesRequestData';
import { FaUserMd, FaUserCheck, FaClock, FaSyncAlt } from 'react-icons/fa';

export default function AdminDashboard() {
  const session = getSession();
  
  const [activeNakes, setActiveNakes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setErrorMsg('');

    // 🟢 Tarik data Nakes Aktif dan Request Registrasi secara paralel
    Promise.all([getAllActiveNakes(), getAllNakesRequests()])
      .then(([activeData, requestData]) => {
        setActiveNakes(activeData || []);
        setRequests(requestData || []);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setErrorMsg(err.message || 'Gagal memuat data dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 🔹 Hitung Statistik Akurat
  const totalActiveNakes = activeNakes.length;
  
  const pendingCount = requests.filter((item) => {
    const s = String(item.status || 'pending').toLowerCase();
    return s === 'pending';
  }).length;

  const pelatihanCount = requests.filter((item) => {
    const s = String(item.status || '').toLowerCase();
    return s === 'pelatihan';
  }).length;

  const summaryCards = [
    { label: 'Total Nakes Aktif', value: totalActiveNakes, icon: <FaUserCheck />, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { label: 'Menunggu Verifikasi', value: pendingCount, icon: <FaClock />, bg: 'bg-amber-100', color: 'text-amber-600' },
    { label: 'Sedang Pelatihan', value: pelatihanCount, icon: <FaSyncAlt />, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Total Permohonan', value: requests.length, icon: <FaUserMd />, bg: 'bg-slate-100', color: 'text-slate-600' },
  ];

  // Helper Format Tanggal Indonesia
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Dashboard Admin</h1>
        <p className="page-subtitle">Ringkasan data tenaga medis dan permohonan registrasi SmartHomeCare.</p>
        <p className="mt-2 text-sm text-slate-500">
          Selamat datang kembali, {session?.name || 'Admin'} 👋
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div className="card flex items-center gap-3.5 p-5" key={card.label}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.bg} text-xl ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold">{loading ? '...' : card.value}</div>
              <div className="text-[13px] text-slate-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Nakes Aktif Terbaru */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Nakes Resmi / Aktif Terbaru</h2>
            <p className="text-xs text-slate-500">Tenaga kesehatan yang sudah lolos pelatihan dan akunnya aktif</p>
          </div>
          <Link to="/admin/nakes" className="btn-outline">
            Lihat Semua
          </Link>
        </div>

        {errorMsg && (
          <div className="m-4 rounded-lg bg-red-50 p-3.5 text-xs text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
        ) : activeNakes.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">Belum ada tenaga medis yang aktif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nama
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Jenis Nakes
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    No. STR
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tanggal Aktif
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeNakes.slice(0, 5).map((item, idx) => {
                  const nama = item.nama_lengkap ?? item.nama ?? item.user?.name ?? '-';
                  const jenis = item.jenis_tenaga_medis ?? item.jenis ?? '-';
                  const noStr = item.no_str ?? '-';
                  const tanggal = formatDate(item.created_at);

                  return (
                    <tr key={item.id_tenaga_medis ?? item.id ?? idx} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
                        {nama}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <span className="badge badge-aktif">{jenis}</span>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
                        {noStr}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
                        {tanggal}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Akun Aktif
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
    </div>
  );
}