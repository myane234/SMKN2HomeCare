import React from 'react';
import { FaUserCircle, FaSave, FaLock, FaImage, FaInfoCircle } from 'react-icons/fa';

export default function PageProfileAdmin() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUserCircle className="text-primary" /> Profile Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan foto profil, data diri, deskripsi, serta perubahan email & kata sandi akun admin</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-800 text-sm flex items-start gap-3">
        <FaInfoCircle className="text-sky-600 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Halaman Profil Admin Siap API</p>
          <p className="text-xs text-sky-700 mt-0.5">Form di bawah telah disiapkan untuk pembaruan profil admin dan ubah kata sandi via backend API.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-8">
        {/* Profile Info */}
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <FaUserCircle className="text-primary" /> Data Diri & Foto Profil
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
              <FaUserCircle size={64} />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <label className="text-xs font-semibold text-slate-700 block">Foto Profil Admin</label>
              <input
                type="file"
                accept="image/*"
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Format: JPG, PNG, WEBP (Maksimal 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Nama Lengkap</label>
              <input type="text" placeholder="Administrator" className="form-input" />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input type="email" placeholder="admin@smarthomecare.id" className="form-input" />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Deskripsi / Bio Admin</label>
              <textarea
                rows={3}
                placeholder="Tuliskan deskripsi singkat mengenai tugas dan peran admin..."
                className="form-input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="space-y-6 pt-4 border-t border-slate-200/80">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <FaLock className="text-primary" /> Ubah Password
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Password Saat Ini</label>
              <input type="password" placeholder="••••••••" className="form-input" />
            </div>

            <div>
              <label className="form-label">Password Baru</label>
              <input type="password" placeholder="••••••••" className="form-input" />
            </div>

            <div>
              <label className="form-label">Konfirmasi Password Baru</label>
              <input type="password" placeholder="••••••••" className="form-input" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 opacity-80 cursor-not-allowed"
            disabled
          >
            <FaSave /> Simpan Perubahan Profil (Menunggu API)
          </button>
        </div>
      </div>
    </div>
  );
}
