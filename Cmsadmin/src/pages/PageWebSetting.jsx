import React from 'react';
import { FaCogs, FaImage, FaSave, FaInfoCircle } from 'react-icons/fa';

export default function PageWebSetting() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaCogs className="text-primary" /> Web Setting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan logo web dan icon favicon aplikasi SmartHomeCare</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-800 text-sm flex items-start gap-3">
        <FaInfoCircle className="text-sky-600 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Halaman Siap Dihubungkan ke API</p>
          <p className="text-xs text-sky-700 mt-0.5">Placeholder halaman pengaturan web telah disiapkan. Form di bawah ini siap untuk diintegrasikan dengan endpoint backend.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaImage className="text-primary" /> Pengaturan Logo & Favicon
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Web */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <label className="text-sm font-semibold text-slate-800 block">Logo Web Utama</label>
            <p className="text-xs text-slate-500">Format: PNG, SVG, WEBP (Latar transparan disarankan)</p>
            <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
              <FaImage size={32} />
              <span className="text-xs mt-2">Belum ada logo diunggah</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark cursor-pointer"
            />
          </div>

          {/* Favicon Web */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <label className="text-sm font-semibold text-slate-800 block">Icon Web (Favicon)</label>
            <p className="text-xs text-slate-500">Format: ICO, PNG (Ukuran disarankan: 32x32px)</p>
            <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
              <FaImage size={32} />
              <span className="text-xs mt-2">Belum ada favicon diunggah</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 opacity-80 cursor-not-allowed"
            disabled
          >
            <FaSave /> Simpan Setting Web (Menunggu API)
          </button>
        </div>
      </div>
    </div>
  );
}
