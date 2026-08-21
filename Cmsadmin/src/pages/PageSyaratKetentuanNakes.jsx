import React from 'react';
import { FaUserMd, FaSave, FaInfoCircle } from 'react-icons/fa';

export default function PageSyaratKetentuanNakes() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUserMd className="text-primary" /> Syarat & Ketentuan Nakes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan dokumen legalitas dan aturan kemitraan bagi tenaga kesehatan</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-800 text-sm flex items-start gap-3">
        <FaInfoCircle className="text-sky-600 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Halaman Syarat & Ketentuan Nakes Siap API</p>
          <p className="text-xs text-sky-700 mt-0.5">Form di bawah telah disiapkan untuk pengisian dan pembaruan dokumen perjanjian kemitraan nakes via API.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaUserMd className="text-primary" /> Dokumen Perjanjian Kemitraan Nakes
        </h2>

        <div className="space-y-4">
          <div>
            <label className="form-label">Judul Dokumen Perjanjian</label>
            <input
              type="text"
              placeholder="Contoh: Syarat dan Ketentuan Kemitraan Tenaga Kesehatan SmartHomeCare"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Isi Dokumen Perjanjian (Teks Lengkap)</label>
            <textarea
              rows={12}
              placeholder="Tuliskan syarat kualifikasi STR/SIP, etika pelayanan, pembagian hasil, dan klausul kerja sama kemitraan..."
              className="form-input resize-y"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 opacity-80 cursor-not-allowed"
            disabled
          >
            <FaSave /> Simpan Syarat & Ketentuan Nakes (Menunggu API)
          </button>
        </div>
      </div>
    </div>
  );
}
