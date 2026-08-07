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
  FiShuffle,
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

  // Check if user has both roles
  const hasMultipleRoles = profile?.roles?.length >= 2;
  const isNakes = profile?.roles?.includes('nakes') || profile?.roles?.includes('Nakes');
  const isPasien = profile?.roles?.includes('pasien') || profile?.roles?.includes('Pasien');

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
    
    // Navigate to appropriate dashboard
    if (newRole === 'nakes') {
      router.push('/nakes/dashboard');
    } else {
      router.push('/profile');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // 1. Panggil API logout ke backend
      await logoutUser();
      
    
      localStorage.removeItem('token'); 
      // sessionStorage.clear(); // Jika pakai session storage
      
      // 3. Arahkan ke halaman login dan refresh state
      router.push('/login');
      router.router?.refresh?.(); // Opsional untuk Next.js
    } catch (error) {
      console.error("Logout gagal:", error);
      
      // Opsional: Jika misal server error tapi ingin dipaksa logout lokal:
      // localStorage.removeItem('token');
      // router.push('/login');
      
      alert("Gagal logout, silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Menu items (tetap Profil Pasien, karena nakes punya dashboard sendiri)
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
          
          {/* SEKTOR AVATAR (KIRI) & INFO USER (KANAN) */}
          <div className="pt-5 pb-5 px-5 flex items-center gap-4">
            
            {/* Avatar dengan Icon Edit Pensil */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-100 shadow-sm bg-blue-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden">
                {userInitial}
              </div>

              {/* Icon Edit (Pensil) */}
              <Link 
                href="/profile/edit"
                className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white shadow transition active:scale-95"
              >
                <FiEdit2 size={11} />
              </Link>
            </div>

            {/* Detail Info: Nama (Atas) -> Role (Bawah) */}
            <div className="flex flex-col flex-1">
              <h1 className="text-base font-bold text-gray-900 leading-tight mt-0.5">
                {userName}
              </h1>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {roleLabel}
              </p>
            </div>

          </div>

          {/* 🔹 SWITCH ROLE BUTTON (hanya muncul jika user punya multiple roles) */}
          {hasMultipleRoles && (
            <div className="px-5 pb-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ganti Akun</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {activeRole === 'nakes' ? 'Beralih ke Pasien' : 'Beralih ke Tenaga Medis'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <span className="text-xs font-medium text-gray-500">
                      {activeRole === 'nakes' ? '👨‍⚕️' : '👤'}
                    </span> */}
                    <button
                      onClick={() => handleSwitchRole(activeRole === 'nakes' ? 'pasien' : 'nakes')}
                      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ backgroundColor: activeRole === 'nakes' ? '#3B82F6' : '#10B981' }}
                      aria-label="Switch role"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          activeRole === 'nakes' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

        {/* 🔹 3. TOMBOL LOGOUT */}
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