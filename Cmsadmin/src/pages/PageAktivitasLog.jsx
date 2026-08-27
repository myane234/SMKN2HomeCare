import React from 'react';
import { FaHistory, FaSearch, FaInfoCircle } from 'react-icons/fa';

export default function PageAktivitasLog() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaHistory className="text-primary" /> Log Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Catatan riwayat aktivitas pengguna dan administrator dalam sistem</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari aktivitas log..."
              className="form-input pl-10 text-sm"
              disabled
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">Total Log: <strong>0 Log</strong></span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">User / Admin</th>
                <th className="py-3 px-4">Aktivitas</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <FaHistory size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Belum ada data log aktivitas</p>
                  <p className="text-xs text-slate-400">Menunggu integrasi API endpoint log aktivitas.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
