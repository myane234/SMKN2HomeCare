import React from 'react';
import { FaFileExcel, FaDownload, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';

export default function PageLaporan() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaFileExcel className="text-primary" /> Laporan & Export Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Ekspor dan unduh laporan transaksi, pemesanan, nakes, serta data umum sistem</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-800 text-sm flex items-start gap-3">
        <FaInfoCircle className="text-sky-600 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Halaman Laporan Siap API</p>
          <p className="text-xs text-sky-700 mt-0.5">Form penarikan dan ekspor data laporan dalam format Excel / PDF telah disiapkan untuk dihubungkan ke backend.</p>
        </div>
      </div>

      {/* Filter and Download Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaDownload className="text-primary" /> Ekspor Laporan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="form-label">Jenis Laporan</label>
            <select className="form-input" disabled>
              <option>Laporan Transaksi Booking</option>
              <option>Laporan Kemitraan Nakes</option>
              <option>Laporan Pendaftaran Pasien</option>
              <option>Laporan Ringkasan Pendapatan</option>
            </select>
          </div>

          <div>
            <label className="form-label">Tanggal Mulai</label>
            <div className="relative">
              <input type="date" className="form-input" disabled />
            </div>
          </div>

          <div>
            <label className="form-label">Tanggal Selesai</label>
            <div className="relative">
              <input type="date" className="form-input" disabled />
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 opacity-80 cursor-not-allowed"
            disabled
          >
            <FaDownload /> Unduh Excel (.xlsx) (Menunggu API)
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-slate-100 text-slate-500 font-semibold text-sm rounded-xl cursor-not-allowed"
            disabled
          >
            Unduh PDF (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
}
