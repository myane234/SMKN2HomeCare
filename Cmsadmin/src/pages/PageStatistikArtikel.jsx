import React from 'react';
import { FaChartLine, FaEye, FaRegFileAlt, FaInfoCircle } from 'react-icons/fa';

export default function PageStatistikArtikel() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaChartLine className="text-primary" /> Statistik View Artikel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Laporan dan analisis statistik pembaca serta jumlah pembacaan artikel kesehatan</p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tayangan Artikel</span>
            <FaEye className="text-primary text-lg" />
          </div>
          <p className="text-2xl font-bold text-slate-900">0 Views</p>
          <p className="text-xs text-slate-400">Menunggu data real-time API</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Artikel Terpopuler</span>
            <FaRegFileAlt className="text-primary text-lg" />
          </div>
          <p className="text-lg font-bold text-slate-900 truncate">-</p>
          <p className="text-xs text-slate-400">Belum ada statistik tayangan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Rata-rata View / Artikel</span>
            <FaChartLine className="text-primary text-lg" />
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-400">Total akumulasi pembaca</p>
        </div>
      </div>

      {/* Table Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaRegFileAlt className="text-primary" /> Detail Tayangan per Artikel
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Judul Artikel</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Penulis</th>
                <th className="py-3 px-4 text-right">Jumlah View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <FaChartLine size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Belum ada data statistik tayangan artikel</p>
                  <p className="text-xs text-slate-400">Menunggu integrasi API endpoint statistik artikel.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
