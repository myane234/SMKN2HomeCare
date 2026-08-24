'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import axios from 'axios';
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
  FiSearch,
  FiCamera,
  FiEye,
  FiUpload,
  FiTrash2,
  FiCheck
} from 'react-icons/fi';
import { getProfileFromCookies, fetchAndStoreProfile } from '@/services/profileService';
import api from '@/services/api';
import { URL} from '../../../'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const GOLONGAN_DARAH = ['A', 'B', 'AB', 'O'];
const JENIS_KELAMIN = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

const getFullAvatarUrl = (rawAvatar) => {
  if (!rawAvatar) return null;

  if (typeof rawAvatar === 'object') {
    return window.URL.createObjectURL(rawAvatar);
  }

  if (rawAvatar.startsWith('blob:')) {
    return rawAvatar;
  }
  
  if (rawAvatar.startsWith('data:image/') || rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://')) {
    if (rawAvatar.includes('googleusercontent.com')) return null;
    
    let secureUrl = rawAvatar;
    if (secureUrl.includes('localhost:8000') || secureUrl.includes('127.0.0.1:8000')) {
      secureUrl = secureUrl.replace(/^https:\/\//, 'http://');
    }
    return secureUrl;
  }
  
  const cleanPath = rawAvatar.startsWith('/') ? rawAvatar.slice(1) : rawAvatar;
  const finalPath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  
  return `${URL}/${finalPath}`;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [message, setMessage] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);

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

  const mapDebounceTimer = useRef(null);
  const searchDebounceTimer = useRef(null);
  const fileInputRef = useRef(null);
  const photoMenuRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    const profileData = getProfileFromCookies();
    
    if (!profileData?.pasien) {
      setIsLoading(false);
      return;
    }

    let rawAvatar = profileData.pasien.avatar;
    if (rawAvatar && rawAvatar.includes('googleusercontent.com')) {
      rawAvatar = null;
    }

    setProfile(profileData);
    setForm({
      nama_lengkap: profileData.pasien.nama_lengkap || '',
      no_hp: profileData.pasien.no_hp || '',
      nik: profileData.pasien.nik || '',
      golongan_darah: profileData.pasien.golongan_darah || '',
      jenis_kelamin: profileData.pasien.jenis_kelamin || '',
      alamat_utama: profileData.pasien.alamat_utama || '',
      latitude: profileData.pasien.latitude ? parseFloat(profileData.pasien.latitude) : -6.2088,
      longitude: profileData.pasien.longitude ? parseFloat(profileData.pasien.longitude) : 106.8456,
    });

    setAvatarPreview(getFullAvatarUrl(rawAvatar));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file foto maksimal 2 MB.' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(window.URL.createObjectURL(file));
      setIsAvatarDeleted(false);
      setShowPhotoMenu(false);
    }
  };

  const handleDeletePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsAvatarDeleted(true);
    setShowPhotoMenu(false);
  };

  const handleOpenCameraController = async () => {
    setShowPhotoMenu(false);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      alert('Tidak dapat mengakses kamera perangkat. Pastikan izin kamera diaktifkan.');
      setShowCameraModal(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Hasil foto kamera terlalu besar (maksimal 2MB).' });
            return;
          }
          setAvatarFile(file);
          setAvatarPreview(window.URL.createObjectURL(file));
          setIsAvatarDeleted(false);
        }
      }, 'image/jpeg', 0.9);

      handleCloseCameraModal();
    }
  };

  const handleCloseCameraModal = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleMapChange = (lat, lng) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));

    if (!isEditing) return;

    if (mapDebounceTimer.current) {
      clearTimeout(mapDebounceTimer.current);
    }

    setIsFetchingAddress(true);

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
        let rawAvatar = profile.pasien.avatar;
        if (rawAvatar && rawAvatar.includes('googleusercontent.com')) rawAvatar = null;

        setForm({
          nama_lengkap: profile.pasien.nama_lengkap || '',
          no_hp: profile.pasien.no_hp || '',
          nik: profile.pasien.nik || '',
          golongan_darah: profile.pasien.golongan_darah || '',
          jenis_kelamin: profile.pasien.jenis_kelamin || '',
          alamat_utama: profile.pasien.alamat_utama || '',
          latitude: profile.pasien.latitude ? parseFloat(profile.pasien.latitude) : -6.2088,
          longitude: profile.pasien.longitude ? parseFloat(profile.pasien.longitude) : 106.8456,
        });

        setAvatarPreview(getFullAvatarUrl(rawAvatar));
      }
      setAvatarFile(null);
      setIsAvatarDeleted(false);
      setMessage(null);
      setSearchQuery('');
      setShowSearchResults(false);
      setShowPhotoMenu(false);
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

    try {
      const formData = new FormData();
      formData.append('nama_lengkap', form.nama_lengkap);
      formData.append('nik', form.nik || '');
      formData.append('golongan_darah', form.golongan_darah || '');
      formData.append('no_hp', form.no_hp || '');
      formData.append('jenis_kelamin', form.jenis_kelamin || '');
      formData.append('alamat_utama', form.alamat_utama || '');
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (isAvatarDeleted) {
        formData.append('avatar', 'remove');
      }

      formData.append('_method', 'PUT');

      await api.post('/api/pasien', formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
      });

      await fetchAndStoreProfile();

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setIsEditing(false);
      setAvatarFile(null);
      setIsAvatarDeleted(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 422) {
          const firstError = data?.errors 
            ? Object.values(data.errors)[0][0] 
            : data?.message;
          setMessage({ type: 'error', text: firstError || "Validasi gagal. Periksa kembali data Anda." });
          setIsSaving(false);
          return;
        }

        setMessage({ type: 'error', text: data?.message || `Gagal memperbarui profil (Status: ${status})` });
      } else {
        setMessage({ type: 'error', text: "Terjadi kesalahan saat menyimpan profil." });
      }
    } finally {
      setIsSaving(false);
    }
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

  const userInitial = form.nama_lengkap ? form.nama_lengkap.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased pb-24">
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

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
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

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
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
            <div className="pb-3 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Foto Profil
              </label>
              
              <div className="flex items-center gap-4 relative" ref={photoMenuRef}>
                <div className="relative shrink-0">
                 <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-blue-600 text-white font-bold text-2xl shadow-sm">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full border-2 border-white shadow transition active:scale-95"
                      title="Ubah Foto Profil"
                    >
                      <FiCamera size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col justify-center">
                  {isEditing ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                        className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-2 border border-blue-200 shadow-sm"
                      >
                        <FiCamera size={14} /> Ubah Foto Profil
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1.5">Klik untuk lihat, ambil, unggah, atau hapus foto</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">{form.nama_lengkap || 'Pengguna'}</p>
                      {avatarPreview ? (
                        <button
                          type="button"
                          onClick={() => setShowViewModal(true)}
                          className="text-xs text-blue-600 hover:underline mt-0.5 flex items-center gap-1 font-medium"
                        >
                          <FiEye size={13} /> Lihat Foto Penuh
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Belum ada foto profil.</p>
                      )}
                    </div>
                  )}
                </div>

                {showPhotoMenu && isEditing && (
                  <div className="absolute left-0 top-24 w-56 bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowViewModal(true);
                          setShowPhotoMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-3 hover:bg-gray-800 transition text-gray-200"
                      >
                        <FiEye size={16} className="text-blue-400" /> Lihat foto
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenCameraController}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-3 hover:bg-gray-800 transition text-gray-200"
                    >
                      <FiCamera size={16} className="text-blue-400" /> Ambil foto
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowPhotoMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-3 hover:bg-gray-800 transition text-gray-200"
                    >
                      <FiUpload size={16} className="text-blue-400" /> Unggah foto
                    </button>

                    {avatarPreview && (
                      <>
                        <div className="my-1 border-t border-gray-700"></div>
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-3 hover:bg-red-950/40 transition text-red-400"
                        >
                          <FiTrash2 size={16} /> Hapus foto
                        </button>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiMail size={14} className="inline mr-1" /> Email
              </label>
              <div className={fieldClasses(false, true)}>
                {profile?.user?.email || '-'}
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <FiShield size={14} className="inline mr-1" /> NIK
              </label>
              <div className={fieldClasses(false, true)}>
                {form.nik || '-'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">NIK tidak dapat diubah</p>
            </div>

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

      {showViewModal && avatarPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Foto Profil Penuh</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-gray-900">
              <img 
                src={avatarPreview} 
                alt="Full Avatar" 
                className="max-h-[70vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FiCamera className="text-blue-400" /> Ambil Foto Kamera
              </h3>
              <button 
                onClick={handleCloseCameraModal}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 transition"
              >
                <FiX size={18} />
              </button>
            </div>
            
            <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>

            <div className="p-5 flex items-center justify-center gap-4 bg-gray-900">
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="px-5 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition flex items-center gap-2 shadow-lg"
              >
                <FiCheck size={16} /> Jepret Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}