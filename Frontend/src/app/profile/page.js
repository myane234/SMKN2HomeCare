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
  FiAward
} from 'react-icons/fi';
import { logoutUser } from '../../services/Auth.js';
import { getProfileFromCookies, fetchAndStoreProfile } from '@/services/profileService';

const getFullAvatarUrl = (rawAvatar) => {
  if (!rawAvatar) return null;
  if (typeof rawAvatar === 'object') return window.URL.createObjectURL(rawAvatar);
  if (rawAvatar.startsWith('blob:') || rawAvatar.startsWith('data:image/')) return rawAvatar;
  
  const backendUrl = 'https://citra.faaruq.com';

  // Jika dari database terlanjur tersimpan dengan localhost:3000, ubah ke domain backend asli
  if (rawAvatar.includes('localhost:3000')) {
    return rawAvatar.replace(/https?:\/\/localhost:3000/, backendUrl);
  }

  if (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://')) {
    if (rawAvatar.includes('googleusercontent.com')) return null;
    return rawAvatar;
  }
  
  const cleanPath = rawAvatar.trim().startsWith('/') ? rawAvatar.trim().slice(1) : rawAvatar.trim();
  if (cleanPath.startsWith('storage/')) {
    return `${backendUrl}/${cleanPath}`;
  }
  
  return `${backendUrl}/storage/${cleanPath}`;
};

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState('pasien');

  useEffect(() => {
    const profileData = getProfileFromCookies();
    if (profileData) {
      setProfile(profileData);

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

    const refreshProfile = async () => {
      const freshProfile = await fetchAndStoreProfile();
      if (freshProfile) {
        setProfile(freshProfile);

        const savedRole = document.cookie
          .split('; ')
          .find(row => row.startsWith('active_role='))
          ?.split('=')[1];

        if (savedRole && freshProfile.roles?.includes(savedRole)) {
          setActiveRole(savedRole);
        } else if (freshProfile.roles?.length > 0) {
          setActiveRole(freshProfile.roles[0]);
        }
      }
    };
    refreshProfile();
  }, []);

  const userName = profile?.pasien?.nama_lengkap || 
                   profile?.tenaga_medis?.nama_lengkap || 
                   'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const roleLabel = activeRole === 'nakes' ? 'Tenaga Medis' : 'Pasien';

  const rawAvatarPath = profile?.pasien?.avatar || profile?.pasien?.foto || profile?.pasien?.foto_profil || profile?.avatar || profile?.user?.avatar;
  const avatarUrl = getFullAvatarUrl(rawAvatarPath);

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
    { label: 'Riwayat', icon: <FiFileText size={20} />, href: '/transaksi' },
    { label: 'Bantuan', icon: <FiHelpCircle size={20} />, href: '/help' },
    { label: 'TOS Web', icon: <FiFile size={20} />, href: '/tos' },
    { label: 'Pengaturan', icon: <FiSettings size={20} />, href: '/settings' },
  ];

  const renderNakesPortalCard = () => {
    const tenagaMedis = profile?.tenaga_medis;

    if (!tenagaMedis) {
      return null;
    }

    const status = tenagaMedis.status?.toLowerCase();

    if (status === 'pending') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm mt-12 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0 mt-0.5">
              <FiClock size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Menunggu Verifikasi
              </span>
              <h3 className="font-bold text-sm text-gray-900">Registrasi Selesai & Menunggu Berkas</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Pendaftaran Anda telah berhasil dikirim. Berkas administrasi Anda sedang dalam proses pemeriksaan oleh tim admin kami.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'pelatihan') {
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 shadow-sm mt-12 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
              <FiAward size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                Jadwal Pelatihan
              </span>
              <h3 className="font-bold text-sm text-gray-900">Menunggu Jadwal Pelatihan</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Selamat, berkas Anda dinyatakan lolos! Saat ini Anda dalam antrean menunggu pembagian jadwal pelatihan dari tim kami sebelum akun diaktifkan resmi.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-sm mt-12 mb-4">
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
                {tenagaMedis.admin_notes || 'Ada berkas yang tidak sesuai dengan ketentuan. Silakan daftar kembali dengan berkas yang benar.'}
              </p>
            </div>
          </div>
          <Link
            href="/gabung-mitra/nakes"
            className="mt-4 w-full bg-rose-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition active:scale-[0.98]"
          >
            <span>Daftar Ulang & Perbaiki Berkas</span>
            <FiChevronRight size={18} />
          </Link>
        </div>
      );
    }

    if (status === 'approved') {
      if (!tenagaMedis.is_data_complete) {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 shadow-sm mt-12 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0 mt-0.5">
                <FiCheckCircle size={22} />
              </div>
              <div className="flex-1">
                <span className="inline-block px-2.5 py-0.5 bg-blue-200 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                  Disetujui — Satu Langkah Lagi
                </span>
                <h3 className="font-bold text-sm text-gray-900">Lengkapi Data untuk Aktivasi Penuh</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Akun Anda telah disetujui oleh admin. Silakan lengkapi pas foto, data NPWP, rekening bank, dan pakta integritas untuk mengaktifkan akses dashboard.
                </p>
              </div>
            </div>
            <Link
              href="/nakes/complete-data"
              className="mt-4 w-full bg-blue-600 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-[0.98]"
            >
              <span>Lengkapi Data Sekarang</span>
              <FiChevronRight size={18} />
            </Link>
          </div>
        );
      }

      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm mt-12 mb-4">
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
                Akun Anda sudah di-approve oleh admin. Silakan masuk ke dashboard untuk mengelola layanan Anda.
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

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        {renderNakesPortalCard()}

        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm mb-4 ${!profile?.tenaga_medis ? 'mt-12' : ''}`}>
          <div className="pt-5 pb-5 px-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <div 
                className="w-16 h-16 rounded-full border-2 border-gray-100 shadow-sm text-white font-bold text-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: !avatarUrl
                    ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' 
                    : 'transparent' 
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
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