'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  FiArrowLeft, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin,
  FiDroplet,
  FiShield,
  FiCheckCircle,
  FiNavigation,
  FiCrosshair,
  FiLoader,
  FiSearch
} from 'react-icons/fi';
import { getProfileFromCookies, updatePasienProfile } from '@/services/profileService';

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const GOLONGAN_DARAH = ['A', 'B', 'AB', 'O'];
const JENIS_KELAMIN = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [message, setMessage] = useState(null);

  // State untuk pencarian lokasi
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [form, setForm] = useState({
    nama_lengkap: '',
    no_hp: '',
    nik: '',
    golongan_darah: '',
    jenis_kelamin: '',
    alamat_utama: '',
    latitude: -6.2088,
    longitude: 106.8456,
  });

  // Ref untuk mengontrol timer Debounce API
  const mapDebounceTimer = useRef(null);
  const searchDebounceTimer = useRef(null);

  useEffect(() => {
    const profileData = getProfileFromCookies();
    
    if (!profileData?.pasien) {
      setIsLoading(false);
      return;
    }

    setProfile(profileData);
    setForm({
      nama_lengkap: profileData.pasien.nama_lengkap || '',
      no_hp: profileData.pasien.no_hp || '',
      nik: profileData.pasien.nik || '',
      golongan_darah: profileData.pasien.golongan_darah || '',
      jenis_kelamin: profileData.pasien.jenis_kelamin || '',
      alamat_utama: profileData.pasien.alamat_utama || '',
      latitude: profileData.pasien.latitude || -6.2088,
      longitude: profileData.pasien.longitude || 106.8456,
    });
    setIsLoading(false);
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 1. FITUR MAP -> TEXTBOX (GESER PIN Dapatkan Alamat)
  const handleMapChange = (lat, lng) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));

    if (!isEditing) return;

    if (mapDebounceTimer.current) {
      clearTimeout(mapDebounceTimer.current);
    }

    setIsFetchingAddress(true);

    // Ambil alamat otomatis setelah user selesai menggeser pin (delay 500ms)
    mapDebounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            setForm(prev => ({ ...prev, alamat_utama: data.display_name }));
          }
        }
      } catch (error) {
        console.error('Gagal mengambil alamat:', error);
      } finally {
        setIsFetchingAddress(false);
      }
    }, 500);
  };

  // 🔹 2. FITUR PENCARIAN ALAMAT -> MAP (Cari Alamat Geser Pin)
  const handleSearchAddressChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    setIsSearching(true);
    setShowSearchResults(true);

    searchDebounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(value)}&limit=5&countrycodes=id`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
        }
      } catch (error) {
        console.error('Gagal mencari lokasi:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Pilihi salah satu hasil pencarian
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      alamat_utama: result.display_name,
    }));

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // 🔹 3. AMBIL LOKASI DARI GPS PERANGKAT
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser Anda');
      return;
    }

    setIsFetchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleMapChange(latitude, longitude);
      },
      (error) => {
        console.error('Gagal mengambil posisi GPS:', error);
        setIsFetchingAddress(false);
        alert('Gagal mengambil lokasi GPS Anda. Pastikan izin lokasi aktif.');
      }
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      if (profile?.pasien) {
        setForm({
          nama_lengkap: profile.pasien.nama_lengkap || '',
          no_hp: profile.pasien.no_hp || '',
          nik: profile.pasien.nik || '',
          golongan_darah: profile.pasien.golongan_darah || '',
          jenis_kelamin: profile.pasien.jenis_kelamin || '',
          alamat_utama: profile.pasien.alamat_utama || '',
          latitude: profile.pasien.latitude || -6.2088,
          longitude: profile.pasien.longitude || 106.8456,
        });
      }
      setMessage(null);
      setSearchQuery('');
      setShowSearchResults(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    if (!form.nama_lengkap.trim()) {
      setMessage({ type: 'error', text: 'Nama lengkap harus diisi' });
      setIsSaving(false);
      return;
    }

    const payload = {
      nama_lengkap: form.nama_lengkap,
      no_hp: form.no_hp || null,
      nik: form.nik,
      golongan_darah: form.golongan_darah || null,
      jenis_kelamin: form.jenis_kelamin || null,
      alamat_utama: form.alamat_utama || null,
      latitude: form.latitude,  
      longitude: form.longitude,
    };

    const result = await updatePasienProfile(payload);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setIsEditing(false);
      
      const updatedProfile = getProfileFromCookies();
      if (updatedProfile?.pasien) {
        setProfile(updatedProfile);
        setForm({
          nama_lengkap: updatedProfile.pasien.nama_lengkap || '',
          no_hp: updatedProfile.pasien.no_hp || '',
          nik: updatedProfile.pasien.nik || '',
          golongan_darah: updatedProfile.pasien.golongan_darah || '',
          jenis_kelamin: updatedProfile.pasien.jenis_kelamin || '',
          alamat_utama: updatedProfile.pasien.alamat_utama || '',
          latitude: updatedProfile.pasien.latitude || -6.2088,
          longitude: updatedProfile.pasien.longitude || 106.8456,
        });
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsSaving(false);
  };

  const fieldClasses = (isEditMode, isReadOnly = false) => {
    const base = 'w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none';
    if (isReadOnly || !isEditMode) {
      return `${base} bg-gray-50 border-gray-200 text-gray-600 cursor-default`;
    }
    return `${base} bg-white border-blue-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans antialiased flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased pb-24">
      {/* 🔹 BANNER ATAS */}
      <div className="bg-blue-600 h-36 w-full pt-6 px-5 text-white">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link 
            href="/profile" 
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <FiArrowLeft size={22} />
          </Link>
          <h1 className="font-semibold text-xl md:text-2xl">
            Edit Profil
          </h1>
        </div>
      </div>

      {/* 🔹 KONTEN */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        {/* MESSAGE NOTIFICATION */}
        {message && (
          <div className={`mb-4 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.type === 'success' ? (
              <FiCheckCircle size={18} className="shrink-0" />
            ) : (
              <FiX size={18} className="shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* KARTU DATA DIRI */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
          {/* HEADER KARTU */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FiUser size={20} />
              </div>
              <h2 className="font-bold text-gray-800">Data Diri</h2>
            </div>
            <button
              onClick={isEditing ? handleSave : toggleEdit}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${
                isEditing 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
              }`}
            >
              {isEditing ? (
                <>{isSaving ? 'Menyimpan...' : 'Simpan'} <FiSave size={16} /></>
              ) : (
                <>Edit <FiEdit2 size={16} /></>
              )}
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiMail size={14} className="inline mr-1" /> Email
              </label>
              <div className={fieldClasses(false, true)}>
                {profile?.user?.email || '-'}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiUser size={14} className="inline mr-1" /> Nama Lengkap
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.nama_lengkap}
                  onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                  className={fieldClasses(true)}
                  placeholder="Masukkan nama lengkap"
                />
              ) : (
                <div className={fieldClasses(false)}>
                  {form.nama_lengkap || '-'}
                </div>
              )}
            </div>

            {/* No HP */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiPhone size={14} className="inline mr-1" /> No. Handphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={form.no_hp}
                  onChange={(e) => handleChange('no_hp', e.target.value)}
                  className={fieldClasses(true)}
                  placeholder="Masukkan nomor handphone"
                />
              ) : (
                <div className={fieldClasses(false)}>
                  {form.no_hp || '-'}
                </div>
              )}
            </div>

            {/* NIK (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiShield size={14} className="inline mr-1" /> NIK
              </label>
              <div className={fieldClasses(false, true)}>
                {form.nik || '-'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">NIK tidak dapat diubah</p>
            </div>

            {/* Golongan Darah */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiDroplet size={14} className="inline mr-1" /> Golongan Darah
              </label>
              {isEditing ? (
                <select
                  value={form.golongan_darah}
                  onChange={(e) => handleChange('golongan_darah', e.target.value)}
                  className={fieldClasses(true)}
                >
                  <option value="">Pilih golongan darah</option>
                  {GOLONGAN_DARAH.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ) : (
                <div className={fieldClasses(false)}>
                  {form.golongan_darah || '-'}
                </div>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Jenis Kelamin
              </label>
              {isEditing ? (
                <div className="flex gap-3">
                  {JENIS_KELAMIN.map((jk) => (
                    <button
                      key={jk.value}
                      type="button"
                      onClick={() => handleChange('jenis_kelamin', jk.value)}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition ${
                        form.jenis_kelamin === jk.value
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {jk.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={fieldClasses(false)}>
                  {form.jenis_kelamin === 'L' ? 'Laki-laki' : form.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                </div>
              )}
            </div>

            {/* 🔍 KONTROL PENCARIAN ALAMAT (TAMPIL DALAM MODE EDIT) */}
            {isEditing && (
              <div className="relative z-30">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <FiSearch size={14} className="inline mr-1" /> Cari Alamat / Tempat
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchAddressChange}
                    placeholder="Ketik jalan, gedung, atau kelurahan..."
                    className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 pl-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FiSearch size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  {isSearching && (
                    <FiLoader size={18} className="absolute right-3 top-3.5 text-blue-600 animate-spin" />
                  )}
                </div>

                {/* Dropdown Hasil Pencarian */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                    {searchResults.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition"
                      >
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.display_name.split(',')[0]}</p>
                        <p className="text-[11px] text-gray-500 truncate">{item.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alamat Utama */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <FiMapPin size={14} className="inline mr-1" /> Alamat Utama
                </label>
                {isFetchingAddress && (
                  <span className="text-xs text-blue-600 flex items-center gap-1 animate-pulse font-medium">
                    <FiLoader className="animate-spin" size={12} /> Mengambil nama alamat...
                  </span>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={form.alamat_utama}
                  onChange={(e) => handleChange('alamat_utama', e.target.value)}
                  className={`${fieldClasses(true)} min-h-[90px] resize-y`}
                  placeholder="Ketik alamat lengkap atau pilih lokasi di peta"
                  rows={3}
                />
              ) : (
                <div className={`${fieldClasses(false)} min-h-[60px] whitespace-pre-line`}>
                  {form.alamat_utama || '-'}
                </div>
              )}
            </div>

            {/* Map Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <FiNavigation size={14} className="inline mr-1" /> Lokasi di Peta
                </label>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg transition active:scale-95"
                  >
                    <FiCrosshair size={13} /> Gunakan Lokasi Saya
                  </button>
                )}
              </div>

              {isEditing && (
                <p className="text-[10px] text-gray-400 mb-2">
                  Geser pin peta untuk memperbarui titik koordinat dan alamat secara otomatis.
                </p>
              )}

              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={handleMapChange}
                draggable={isEditing}
              />
              <div className="mt-2 flex gap-3 text-xs text-gray-500 font-mono">
                <span>Lat: {form.latitude?.toFixed?.(6) ?? '-'}</span>
                <span>Lng: {form.longitude?.toFixed?.(6) ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          {isEditing && (
            <div className="px-5 pb-5 pt-2 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={toggleEdit}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isFetchingAddress}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    'Menyimpan...'
                  ) : (
                    <>Simpan <FiSave size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}