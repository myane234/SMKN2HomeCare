import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, FaEye, FaRegFileAlt, FaSyncAlt, 
  FaFire, FaStar, FaExclamationTriangle 
} from 'react-icons/fa';
import { getDashboardStats } from '../data/dashboardStatsData';
import { getAllArtikel } from '../data/artikelData';

export default function PageStatistikArtikel() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState(null);
  const [allArticles, setAllArticles] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [dashData, articlesData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAllArtikel().catch(() => []),
      ]);

      setStats(dashData || null);
      setAllArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (err) {
      console.error('Gagal memuat data statistik artikel:', err);
      setErrorMsg(err.message || 'Gagal memuat data statistik artikel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalArticles = stats?.ringkasan?.total_artikel ?? allArticles.length ?? 0;
  const totalViews = stats?.ringkasan?.total_views_artikel ?? 
    allArticles.reduce((acc, curr) => acc + (Number(curr.views || curr.jumlah_view || 0)), 0);

  const avgViews = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0;
  const topArtikels = stats?.top_artikels_by_views || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaChartLine className="text-primary" /> Statistik View Artikel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Laporan dan analisis statistik pembaca serta jumlah pembacaan artikel kesehatan
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 shadow-2xs w-max"
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <FaExclamationTriangle className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tayangan Artikel</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FaEye className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${Number(totalViews).toLocaleString('id-ID')} Views`}
          </p>
          <p className="text-xs text-slate-400">Akumulasi pembaca seluruh artikel</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Artikel Terpopuler</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <FaFire className="text-lg" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate" title={topArtikels[0]?.judul_artikel}>
            {loading ? '...' : (topArtikels[0]?.judul_artikel || allArticles[0]?.judul_artikel || '-')}
          </p>
          <p className="text-xs text-amber-600 font-semibold">
            {loading ? '' : (topArtikels[0]?.views ? `${Number(topArtikels[0].views).toLocaleString('id-ID')} Views` : 'Paling banyak dibaca')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata View / Artikel</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FaChartLine className="text-lg" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `${Number(avgViews).toLocaleString('id-ID')} Views`}
          </p>
          <p className="text-xs text-slate-400">Dari total {totalArticles} artikel tayang</p>
        </div>
      </div>

      {/* Top Articles Section */}
      {topArtikels.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FaFire className="text-amber-500" /> Artikel Paling Banyak Dibaca (Top Views)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topArtikels.map((item, idx) => (
              <div key={item.id_artikel || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">{item.judul_artikel}</h4>
                    <span className="text-[11px] text-slate-500">{item.kategori?.nama_kategori || item.kategori_artikel || 'Kesehatan'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 whitespace-nowrap shadow-2xs">
                  {Number(item.views || 0).toLocaleString('id-ID')} Views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FaRegFileAlt className="text-primary" /> Daftar Tayangan per Artikel
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Judul Artikel</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Penulis / Admin</th>
                <th className="py-3 px-4 text-right">Jumlah View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <FaSyncAlt className="animate-spin text-2xl mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-slate-600">Memuat data artikel...</p>
                  </td>
                </tr>
              ) : allArticles.length === 0 && topArtikels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <FaRegFileAlt size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Belum ada data artikel</p>
                  </td>
                </tr>
              ) : (
                (allArticles.length > 0 ? allArticles : topArtikels).map((art) => (
                  <tr key={art.id || art.id_artikel} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {art.judul_artikel || art.judul || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                        {art.kategori_artikel || art.kategori?.nama_kategori || art.kategori || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {art.penulis || art.admin?.nama || 'Admin HomeCare'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                      {Number(art.views || art.jumlah_view || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
