'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiUser, 
  FiFileText, 
  FiHelpCircle, 
  FiFile, 
  FiLogOut, 
  FiChevronRight, 
  FiSettings,
  FiArrowLeft,
  FiEdit2,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBriefcase,
  FiAward
} from 'react-icons/fi';
import { logoutUser } from '../../services/Auth.js';
import { getProfileFromCookies } from '@/services/profileService';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState('pasien');

  useEffect(() => {
    const profileData = getProfileFromCookies();
    if (profileData) {
      setProfile(profileData);

      // Read active role from cookie or default to first role
      const savedRole = document.cookie
        .split('; ')
        .find(row => row.startsWith('active_role='))
        ?.split('=')[1];

      if (savedRole && profileData.roles?.includes(savedRole)) {
        setActiveRole(savedRole);
      } else if (profileData.roles?.length > 0) {
        setActiveRole(profileData.roles[0]);
      }
    }
  }, []);

  // Check if user has multiple roles
  const hasMultipleRoles = profile?.roles?.length >= 2;

  // Get user display name
  const userName = profile?.pasien?.nama_lengkap || 
                   profile?.tenaga_medis?.nama_lengkap || 
                   'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Get current role label
  const roleLabel = activeRole === 'nakes' ? 'Tenaga Medis' : 'Pasien';

  const handleSwitchRole = (newRole) => {
    setActiveRole(newRole);
    document.cookie = `active_role=${newRole}; path=/; max-age=604800; SameSite=Lax`;

    if (newRole === 'nakes') {
      router.push('/nakes/dashboard');
    } else {
      router.push('/profile');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem('token'); 
      router.push('/login');
      router.refresh?.();
    } catch (error) {
      console.error("Logout gagal:", error);
      alert("Gagal logout, silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { 
      label: 'Profil Pasien', 
      icon: <FiUser size={20} />, 
      href: '/profile/edit' 
    },
    { label: 'Riwayat', icon: <FiFileText size={20} />, href: '/transactions' },
    { label: 'Bantuan', icon: <FiHelpCircle size={20} />, href: '/help' },
    { label: 'TOS Web', icon: <FiFile size={20} />, href: '/tos' },
    { label: 'Pengaturan', icon: <FiSettings size={20} />, href: '/settings' },
  ];

  // 🔹 LOGIKA DYNAMIC CARD NAKES BASED ON TENAGA_MEDIS STATUS
  const renderNakesPortalCard = () => {
    const tenagaMedis = profile?.tenaga_medis;

    // KONDISI 1: Belum Pernah Daftar (tenaga_medis === null)
    if (!tenagaMedis) {
      return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="p-3 bg-white/10 rounded-2xl shrink-0 backdrop-blur-sm">
              <FiBriefcase size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base leading-snug">Gabung Jadi Mitra Nakes</h3>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Melayani pasien homecare dan dapatkan penghasilan tambahan bersama SmartHomeCare.
              </p>
            </div>
          </div>
          <Link
            href="/gabung-mitra"
            className="mt-4 w-full bg-white text-blue-600 font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition active:scale-[0.98]"
          >
            <span>Daftar Sekarang</span>
            <FiChevronRight size={18} />
          </Link>
        </div>
      );
    }

    const status = tenagaMedis.status?.toLowerCase();

    // KONDISI 2: Status Pending (Menunggu Verifikasi Admin)
    if (status === 'pending') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0 mt-0.5">
              <FiClock size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Sedang Diverifikasi
              </span>
              <h3 className="font-bold text-sm text-gray-900">Pendaftaran Mitra Nakes</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Berkas Anda sedang dalam proses pemeriksaan oleh tim admin kami.
              </p>
            </div>
          </div>
          <Link
            href="/nakes/status"
            className="mt-4 w-full bg-amber-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition active:scale-[0.98]"
          >
            <span>Cek Detail Status</span>
            <FiChevronRight size={18} />
          </Link>
        </div>
      );
    }

    // KONDISI 3: Status Pelatihan (Lolos Berkas, Wajib Pelatihan)
    if (status === 'pelatihan') {
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
              <FiAward size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Tahap Pelatihan
              </span>
              <h3 className="font-bold text-sm text-gray-900">Selamat! Berkas Anda Lolos</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Silakan ikuti instruksi pelatihan sebelum akun Nakes Anda diaktifkan resmi.
              </p>
            </div>
          </div>
          <Link
            href="/nakes/status"
            className="mt-4 w-full bg-indigo-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition active:scale-[0.98]"
          >
            <span>Lihat Info Pelatihan</span>
            <FiChevronRight size={18} />
          </Link>
        </div>
      );
    }

    // KONDISI 4: Status Rejected (Ditolak)
    if (status === 'rejected') {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0 mt-0.5">
              <FiAlertCircle size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Perlu Perbaikan
              </span>
              <h3 className="font-bold text-sm text-gray-900">Pendaftaran Belum Disetujui</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {tenagaMedis.admin_notes || 'Ada dokumen yang perlu Anda perbaiki.'}
              </p>
            </div>
          </div>
          <Link
            href="/nakes/status"
            className="mt-4 w-full bg-rose-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition active:scale-[0.98]"
          >
            <span>Perbaiki Berkas</span>
            <FiChevronRight size={18} />
          </Link>
        </div>
      );
    }

    // KONDISI 5: Status Approved (Sudah Aktif / Jadi Nakes)
    if (status === 'approved') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0 mt-0.5">
              <FiCheckCircle size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Mitra Resmi
              </span>
              <h3 className="font-bold text-sm text-gray-900">Akun Tenaga Medis Aktif</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Anda sudah terverifikasi. Klik tombol di bawah untuk masuk ke dashboard Nakes.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSwitchRole('nakes')}
            className="mt-4 w-full bg-emerald-600 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition active:scale-[0.98]"
          >
            <span>Masuk Dashboard Nakes</span>
            <FiChevronRight size={18} />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased pb-24">

      {/* 🔹 1. BANNER BIRU ATAS */}
      <div className="bg-blue-600 h-36 w-full pt-6 px-5 text-white">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <FiArrowLeft size={22} />
          </button>

          <h1 className="font-semibold text-xl md:text-2xl">
            Profil Saya
          </h1>
        </div>
      </div>

      {/* 🔹 2. KONTEN UTAMA */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">

        {/* KARTU PROFIL + MENU */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4">

          {/* AVATAR & USER INFO */}
          <div className="pt-5 pb-5 px-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-100 shadow-sm bg-blue-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden">
                {userInitial}
              </div>

              <Link 
                href="/profile/edit"
                className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white shadow transition active:scale-95"
              >
                <FiEdit2 size={11} />
              </Link>
            </div>

            <div className="flex flex-col flex-1">
              <h1 className="text-base font-bold text-gray-900 leading-tight mt-0.5">
                {userName}
              </h1>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* LIST MENU */}
          <div className="divide-y divide-gray-100 border-t border-gray-100 rounded-b-3xl overflow-hidden">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition duration-150 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                </div>
                <FiChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>

        </div>

        {/* 🔹 3. CARD PORTAL NAKES DINAMIS (PEMBERITAHUAN & CTA) */}
        {renderNakesPortalCard()}

        {/* 🔹 4. TOMBOL LOGOUT */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full bg-white rounded-3xl border border-red-100 p-4 shadow-sm flex items-center justify-between hover:bg-red-50/60 transition active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
              <FiLogOut size={20} />
            </div>
            <span className="text-sm font-semibold text-red-600">
              {isLoading ? "Logging out..." : "Logout"}
            </span>
          </div>
          <FiChevronRight size={18} className="text-red-300" />
        </button>

      </div>
    </div>
  );
}