'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  FiUpload,
  FiArrowRight, 
  FiArrowLeft,
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiPlus,
  FiTrash2,
  FiSearch
} from 'react-icons/fi';
import api from '@/services/api';
import { DAFTAR_UNIVERSITAS } from '@/services/dataUniversitas';
import { getProfileMe } from '@/services/profileService';
import { registerNakes, getWilayahLayanan, getKategoriLayanan } from '@/services/nakesService';

// Dynamic import MapPicker
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-60 w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
      Memuat Map...
    </div>
  )
});

export default function RegisterNakesPage() {
  const router = useRouter();

  // 🔹 State Kontrol Multi-Step
  const [step, setStep] = useState(1);

  // 🔹 State Form Data - Step 1
  const [formData, setFormData] = useState({
    nik: '',
    nama_lengkap: '',
    nama_panggilan: '',
    jenis_kelamin: '',
    tempat_lahir: '', 
    tanggal_lahir: '',
    agama: '',
    email: '',
    nomor_hp: '',
    alamat_lengkap: '',
  });

  // State Geolocation/Peta
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  
  // State Search Box Alamat Peta
  const [searchAddressInput, setSearchAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // State Layanan & Area Kerja
  const [listKategori, setListKategori] = useState([]);
  const [isLayananOpen, setIsLayananOpen] = useState(true);
  const [searchLayanan, setSearchLayanan] = useState('');
  const [selectedLayanan, setSelectedLayanan] = useState([]);
  const [idWilayahLayanan, setIdWilayahLayanan] = useState('');
  const [listProvinsi, setListProvinsi] = useState([]);

  // Ref untuk menghindari stale closure listProvinsi
  const listProvinsiRef = useRef([]);
  useEffect(() => {
    listProvinsiRef.current = listProvinsi;
  }, [listProvinsi]);

  // 🔹 State Form Data - Step 2
  const [pendidikan, setPendidikan] = useState({
    nama_universitas: '',
    program_studi: '',
    tahun_lulus: '',
  });

  const [legalitas, setLegalitas] = useState({
    no_str: '',
    no_sip: '',
    str: null,
    sip: null,
  });

  // 🔹 State Form Data - Step 3
  const [dokumen, setDokumen] = useState({
    ijazah: null,
    cv: null,
    ktp: null,
    skck: null,
  });

  // 🔹 State Pengalaman Kerja - Opsional
  const [pengalamanKerja, setPengalamanKerja] = useState({
    tempat_kerja: '',
    lama_bekerja: '',
  });

  // 🔹 State Dokumen Tambahan - Opsional
  const [dokumenTambahan, setDokumenTambahan] = useState([]);

  // State Autocomplete Universitas
  const [isUniversitasOpen, setIsUniversitasOpen] = useState(false);
  const [apiUniversitas, setApiUniversitas] = useState([]);
  const [isSearchingUniv, setIsSearchingUniv] = useState(false);

  // 🔹 State Pernyataan
  const [isAgreed, setIsAgreed] = useState(false);

  // Refs untuk restore File Object
  const ijazahRef = useRef(null);
  const strRef = useRef(null);
  const sipRef = useRef(null);
  const cvRef = useRef(null);
  const ktpRef = useRef(null);
  const skckRef = useRef(null);
  const dokumenTambahanRefs = useRef([]);

  // State UI
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Debounced API fetch for universities
  useEffect(() => {
    const query = pendidikan.nama_universitas;
    if (!query || query.trim().length < 2) {
      setApiUniversitas([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingUniv(true);
      try {
        const names = await getUniversitas(query);
        setApiUniversitas(names || []);
      } catch (err) {
        console.error('Gagal mengambil data universitas:', err);
      } finally {
        setIsSearchingUniv(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [pendidikan.nama_universitas]);

  const filteredUniversitas = (() => {
    const query = (pendidikan.nama_universitas || '').toLowerCase().trim();
    if (!query) return [];

    const localFiltered = DAFTAR_UNIVERSITAS.filter((nama) =>
      nama.toLowerCase().includes(query)
    );

    const combined = [...localFiltered, ...apiUniversitas];
    
    const seen = new Set();
    const unique = [];
    for (const item of combined) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    
    return unique.slice(0, 20);
  })();

  // 🔹 Restore files on step change
  useEffect(() => {
    if (step === 2) {
      const restoreFile = (file, ref) => {
        if (file && ref.current) {
          try {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            ref.current.files = dataTransfer.files;
          } catch (e) {
            console.error('DataTransfer not supported or failed to assign file:', e);
          }
        }
      };
      const timer = setTimeout(() => {
        restoreFile(dokumen.ijazah, ijazahRef);
        restoreFile(legalitas.str, strRef);
        restoreFile(legalitas.sip, sipRef);
        restoreFile(dokumen.cv, cvRef);
        restoreFile(dokumen.ktp, ktpRef);
        restoreFile(dokumen.skck, skckRef);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, dokumen.ijazah, legalitas.str, legalitas.sip, dokumen.cv, dokumen.ktp, dokumen.skck]);

  // Helper pembersih string nama provinsi
  const cleanText = (str) => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/provinsi\s+/g, '')
      .replace(/prov\.\s*/g, '')
      .replace(/daerah khusus ibukota\s+/g, '')
      .replace(/daerah istimewa\s+/g, '')
      .replace(/dki\s+/g, '')
      .replace(/d\.i\.\s*/g, '')
      .replace(/di\s+/g, '')
      .replace(/[\.\,\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper Auto-resolve Provinsi
  const resolveProvince = (addressObj, displayName) => {
    const provinces = listProvinsiRef.current.length > 0 ? listProvinsiRef.current : listProvinsi;
    if (!provinces || provinces.length === 0) return;

    const rawState = addressObj?.state || addressObj?.province || addressObj?.region || '';
    const rawDisplay = displayName || '';

    const cleanState = cleanText(rawState);
    const cleanDisplay = cleanText(rawDisplay);

    const matched = provinces.find((w) => {
      const provName = w.nama_provinsi || '';
      const cleanProv = cleanText(provName);

      if (!cleanProv) return false;

      if (cleanState && (cleanState.includes(cleanProv) || cleanProv.includes(cleanState))) {
        return true;
      }

      if (rawState && (rawState.toLowerCase().includes(provName.toLowerCase()) || provName.toLowerCase().includes(rawState.toLowerCase()))) {
        return true;
      }

      if (cleanDisplay && cleanDisplay.includes(cleanProv)) {
        return true;
      }

      return false;
    });

    if (matched) {
      setIdWilayahLayanan(matched.id_provinsi);
    }
  };

  // Re-run resolveProvince saat listProvinsi selesai dimuat
  useEffect(() => {
    if (listProvinsi.length > 0 && formData.alamat_lengkap) {
      resolveProvince(null, formData.alamat_lengkap);
    }
  }, [listProvinsi]);

  // Debounce API Search Alamat
  useEffect(() => {
    if (!searchAddressInput || searchAddressInput.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchAddressInput
          )}&countrycodes=id&limit=5&addressdetails=1&accept-language=id`
        );
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data || []);
        }
      } catch (err) {
        console.error('Gagal mencari alamat:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchAddressInput]);

  const handleSelectAddressSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    setLatitude(lat);
    setLongitude(lng);
    setIsLocationDenied(false);
    setLocationError('');

    const addressText = item.display_name || '';
    setFormData((prev) => ({
      ...prev,
      alamat_lengkap: addressText,
    }));

    resolveProvince(item.address, addressText);

    setAddressSuggestions([]);
    setSearchAddressInput('');
  };

  // Reverse Geocoding
  const fetchAddressAndWilayah = async (lat, lng) => {
    if (!lat || !lng) return;
    setIsFetchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setFormData((prev) => ({
            ...prev,
            alamat_lengkap: data.display_name,
          }));

          resolveProvince(data.address, data.display_name);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil alamat dari GPS:', err);
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // Initial Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const wilayahRes = await getWilayahLayanan();
        const wilayahData = wilayahRes?.data || [];
        setListProvinsi(wilayahData.filter((w) => w.is_active));

        const kategoriRes = await getKategoriLayanan();
        const kategoriData = kategoriRes?.data || [];
        setListKategori(kategoriData);

        const profileRes = await getProfileMe();
        if (profileRes?.success && profileRes?.data?.user?.email) {
          setFormData((prev) => ({
            ...prev,
            email: profileRes.data.user.email,
          }));
        }

        handleGetCurrentLocation();
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      }
    };

    fetchData();
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setIsLocationDenied(true);
      setLocationError('Browser Anda tidak mendukung fitur deteksi lokasi/GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocationDenied(false);
        setLocationError('');
        fetchAddressAndWilayah(lat, lng);
      },
      (error) => {
        setIsLocationDenied(true);
        setLatitude(null);
        setLongitude(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectLayanan = (label) => {
    setSelectedLayanan((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // PERBAIKAN: typeof bukan type of
  const filteredLayanan = listKategori.filter((item) => {
    const namaKategori = item.nama_kategori || item.nama_layanan || item.label || (typeof item === 'string' ? item : '');
    return String(namaKategori).toLowerCase().includes(searchLayanan.toLowerCase());
  });

  const handlePendidikanChange = (e) => {
    const { name, value } = e.target;
    setPendidikan((prev) => ({ ...prev, [name]: value }));
  };

  const handleLegalitasChange = (e) => {
    const { name, value } = e.target;
    setLegalitas((prev) => ({ ...prev, [name]: value }));
  };

  const handlePengalamanKerjaChange = (e) => {
    const { name, value } = e.target;
    setPengalamanKerja((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field, stateType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      e.target.value = '';
      return;
    }

    if (stateType === 'legalitas') {
      setLegalitas((prev) => ({ ...prev, [field]: file }));
    } else if (stateType === 'dokumen') {
      setDokumen((prev) => ({ ...prev, [field]: file }));
    }
    setErrorMessage('');
  };

  // Handler untuk Dokumen Tambahan
  const handleTambahDokumenTambahan = () => {
    const newId = Date.now();
    setDokumenTambahan((prev) => [...prev, { id: newId, file: null }]);
    
    setTimeout(() => {
      if (dokumenTambahanRefs.current[newId]) {
        dokumenTambahanRefs.current[newId].focus();
      }
    }, 100);
  };

  const handleHapusDokumenTambahan = (id) => {
    setDokumenTambahan((prev) => prev.filter((item) => item.id !== id));
    delete dokumenTambahanRefs.current[id];
  };

  const handleDokumenTambahanChange = (id, file) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      return;
    }

    setDokumenTambahan((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, file: file } : item
      )
    );
    setErrorMessage('');
  };

  const handleGantiDokumenTambahan = (id, e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDokumenTambahanChange(id, file);
    }
  };

  // Validations
  const validateStep1 = () => {
    if (formData.nik.length !== 16) {
      setErrorMessage('Nomor NIK harus terdiri dari 16 digit angka.');
      return false;
    }
    if (!formData.tempat_lahir.trim()) {
      setErrorMessage('Harap isi Tempat Lahir.');
      return false;
    }
    if (!formData.alamat_lengkap.trim()) {
      setErrorMessage('Harap isi Alamat Lengkap Domisili.');
      return false;
    }
    if (!idWilayahLayanan) {
      setErrorMessage('Harap pilih area kerja / wilayah provinsi operasional Anda.');
      return false;
    }
    if (isLocationDenied || latitude === null || longitude === null) {
      setErrorMessage('Lokasi GPS Anda belum terdeteksi/aktif.');
      return false;
    }
    if (selectedLayanan.length === 0) {
      setErrorMessage('Harap pilih minimal satu kategori layanan medis.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!pendidikan.nama_universitas.trim()) {
      setErrorMessage('Harap isi Nama Universitas/Institusi.');
      return false;
    }
    if (!pendidikan.program_studi.trim()) {
      setErrorMessage('Harap isi Program Studi.');
      return false;
    }
    if (!pendidikan.tahun_lulus) {
      setErrorMessage('Harap isi Tahun Lulus.');
      return false;
    }
    if (!legalitas.no_str.trim()) {
      setErrorMessage('Harap isi Nomor STR.');
      return false;
    }
    if (!legalitas.str) {
      setErrorMessage('Harap unggah STR.');
      return false;
    }
    if (!dokumen.ijazah) {
      setErrorMessage('Harap unggah Ijazah.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!dokumen.cv) {
      setErrorMessage('Harap unggah Curriculum Vitae (CV).');
      return false;
    }
    if (!dokumen.ktp) {
      setErrorMessage('Harap unggah KTP.');
      return false;
    }
    if (!dokumen.skck) {
      setErrorMessage('Harap unggah SKCK.');
      return false;
    }
    if (!isAgreed) {
      setErrorMessage('Harap centang pernyataan bahwa seluruh data dan dokumen yang diunggah adalah benar.');
      return false;
    }
    return true;
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setErrorMessage('');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      setErrorMessage('');
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 🔹 SUBMIT - Menggunakan registerNakes service
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const dataToSend = new FormData();

      // ============================================================
      // 🔹 FIELD TEKS
      // ============================================================
      dataToSend.append('nik', formData.nik);
      dataToSend.append('nama_lengkap', formData.nama_lengkap);
      dataToSend.append('nama_panggilan', formData.nama_panggilan);
      dataToSend.append('jenis_kelamin', formData.jenis_kelamin);
      dataToSend.append('tempat_lahir', formData.tempat_lahir);
      dataToSend.append('tanggal_lahir', formData.tanggal_lahir);
      dataToSend.append('agama', formData.agama);
      dataToSend.append('no_telp', formData.nomor_hp);
      dataToSend.append('email', formData.email);
      dataToSend.append('alamat_lengkap', formData.alamat_lengkap);
      dataToSend.append('id_wilayah_layanan', idWilayahLayanan);
      dataToSend.append('jenis_tenaga_medis', selectedLayanan.join(', '));
      
      // 🔹 PENDIDIKAN
      dataToSend.append('universitas', pendidikan.nama_universitas);
      dataToSend.append('program_studi', pendidikan.program_studi);
      dataToSend.append('tahun_lulus', pendidikan.tahun_lulus);
      
      // 🔹 LEGALITAS
      dataToSend.append('no_str', legalitas.no_str);
      if (legalitas.no_sip) {
        dataToSend.append('no_sip', legalitas.no_sip);
      }
      
      // 🔹 PENGALAMAN KERJA (Opsional)
      if (pengalamanKerja.tempat_kerja) {
        dataToSend.append('tempat_kerja', pengalamanKerja.tempat_kerja);
      }
      if (pengalamanKerja.lama_bekerja) {
        dataToSend.append('lama_bekerja', pengalamanKerja.lama_bekerja);
      }
      
      // 🔹 GPS
      dataToSend.append('latitude', latitude);
      dataToSend.append('longitude', longitude);
      
      // 🔹 PERNYATAAN
      dataToSend.append('is_agreed', isAgreed);

      // ============================================================
      // 🔹 FILE UPLOADS
      // ============================================================
      dataToSend.append('file_cv', dokumen.cv);
      dataToSend.append('file_ktp', dokumen.ktp);
      dataToSend.append('file_skck', dokumen.skck);
      dataToSend.append('ijazah', dokumen.ijazah);
      dataToSend.append('file_str', legalitas.str);
      if (legalitas.sip) {
        dataToSend.append('file_sip', legalitas.sip);
      }

      // ============================================================
      // 🔹 DOKUMEN TAMBAHAN (Opsional)
      // ============================================================
      const dokumenTambahanFiles = dokumenTambahan
        .filter((item) => item.file !== null)
        .map((item) => item.file);
      
      if (dokumenTambahanFiles.length > 0) {
        dokumenTambahanFiles.forEach((file) => {
          dataToSend.append('dokumen_tambahan[]', file);
        });
      }

      // ============================================================
      // 🔹 KIRIM KE API MENGGUNAKAN SERVICE
      // ============================================================
      const response = await registerNakes(dataToSend);

      if (response?.success) {
        setSuccessMessage(response.message || 'Pendaftaran mitra berhasil dikirim.');
      } else {
        setErrorMessage(response?.message || 'Gagal mengirim pendaftaran.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage(
        error.response?.data?.message || 'Terjadi kesalahan koneksi ke server API.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepLabel = () => {
    switch(step) {
      case 1: return 'Isi data pribadi, lokasi domisili, area kerja, dan kategori layanan';
      case 2: return 'Lengkapi kualifikasi pendidikan dan legalitas profesi';
      case 3: return 'Unggah dokumen pendukung dan kirim pendaftaran';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10">
        
        {/* Header Form & Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-sky-600">
              Pendaftaran Mitra Nakes
            </h1>
            {!successMessage && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                Langkah {step} dari 3
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {successMessage 
              ? 'Permohonan pendaftaran Anda telah tercatat' 
              : getStepLabel()}
          </p>

          {!successMessage && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Notifikasi Berhasil */}
        {successMessage && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">Pendaftaran Berhasil</h3>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex justify-between items-center">
            <div>
              <p className="font-bold">Pemberitahuan</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 font-bold ml-2">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {!successMessage && (
          <>
            {/* STEP 1: DATA DIRI, DOMISILI, AREA KERJA & KATEGORI LAYANAN */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-4">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Informasi Pribadi</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">NIK <span className="text-rose-500">*</span></label>
                  <input type="text" name="nik" required maxLength={16} value={formData.nik} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input type="text" name="nama_lengkap" required value={formData.nama_lengkap} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Panggilan <span className="text-rose-500">*</span></label>
                    <input type="text" name="nama_panggilan" required value={formData.nama_panggilan} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
                    <select name="jenis_kelamin" required value={formData.jenis_kelamin} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                      <option value="">Pilih...</option>
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tempat Lahir <span className="text-rose-500">*</span></label>
                    <select name="tempat_lahir" required value={formData.tempat_lahir} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium text-gray-700">
                      <option value="">-- Pilih Tempat Lahir --</option>
                      {listProvinsi && listProvinsi.length > 0 ? (
                        listProvinsi.map((wilayah) => (
                          <option key={wilayah.id_provinsi} value={wilayah.nama_provinsi}>{wilayah.nama_provinsi}</option>
                        ))
                      ) : (
                        <option value="" disabled>Memuat data wilayah...</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir <span className="text-rose-500">*</span></label>
                    <input type="date" name="tanggal_lahir" required value={formData.tanggal_lahir} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Agama <span className="text-rose-500">*</span></label>
                  <select name="agama" required value={formData.agama} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                    <option value="">Pilih...</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      value={formData.email} 
                      disabled
                      readOnly
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">No. HP / WhatsApp <span className="text-rose-500">*</span></label>
                    <input type="text" name="nomor_hp" required value={formData.nomor_hp} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                </div>

                <hr className="my-4 border-gray-100" />

                {/* ALAMAT DOMISILI */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Alamat</h2>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lengkap <span className="text-rose-500">*</span></label>
                  <textarea
                    name="alamat_lengkap"
                    required
                    rows={3}
                    value={formData.alamat_lengkap}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap domisili saat ini..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                  />
                </div>

                <hr className="my-4 border-gray-100" />

                {/* TITIK GPS */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Titik GPS</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">Tentukan koordinat lokasi pelayanan Anda</span>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-xs font-bold transition border border-sky-200 shrink-0"
                    >
                      <FiMapPin className="w-3.5 h-3.5" /> Gunakan Lokasi Saat Ini
                    </button>
                  </div>

                  {/* SEARCH BAR UNTUK CARI ALAMAT */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cari Lokasi di Peta
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={searchAddressInput}
                        onChange={(e) => setSearchAddressInput(e.target.value)}
                        placeholder="Ketik nama jalan, gedung, atau kota..."
                        className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                      {isSearchingAddress && (
                        <span className="absolute right-3 text-xs text-sky-500 animate-pulse font-semibold">
                          Mencari...
                        </span>
                      )}
                    </div>

                    {/* Dropdown Hasil Pencarian Alamat */}
                    {addressSuggestions.length > 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {addressSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-sky-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2 text-gray-700 transition"
                            onClick={() => handleSelectAddressSuggestion(item)}
                          >
                            <FiMapPin className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{item.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* MAP DISPLAY */}
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <MapPicker
                      lat={latitude}
                      lng={longitude}
                      onChange={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                        setIsLocationDenied(false);
                        setLocationError('');
                        fetchAddressAndWilayah(lat, lng);
                      }}
                    />
                    {isFetchingAddress && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl z-10 backdrop-blur-xs">
                        <span className="text-xs font-semibold text-sky-700 animate-pulse">Memperbarui alamat & wilayah...</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block">Latitude</span>
                      <span className="font-mono text-gray-700 font-semibold">{latitude !== null ? latitude.toFixed(6) : '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Longitude</span>
                      <span className="font-mono text-gray-700 font-semibold">{longitude !== null ? longitude.toFixed(6) : '-'}</span>
                    </div>
                  </div>
                </div>

                <hr className="my-4 border-gray-100" />

                {/* AREA KERJA */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Area Kerja</h2>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Wilayah Operasional <span className="text-rose-500">*</span></label>
                  <select
                    name="id_wilayah_layanan"
                    required
                    value={idWilayahLayanan}
                    onChange={(e) => setIdWilayahLayanan(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium text-gray-700"
                  >
                    <option value="">-- Pilih Wilayah Operasional --</option>
                    {listProvinsi && listProvinsi.length > 0 ? (
                      listProvinsi.map((wilayah) => (
                        <option key={wilayah.id_provinsi} value={wilayah.id_provinsi}>
                          {wilayah.nama_provinsi}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Memuat data wilayah...</option>
                    )}
                  </select>
                </div>

                <hr className="my-4 border-gray-100" />
                
                {/* LAYANAN MEDIS */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Layanan Medis</h2>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pilih Kategori Layanan / Jenis Tenaga Medis <span className="text-rose-500">*</span></label>
                  <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-xs">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{selectedLayanan.length > 0 ? `${selectedLayanan.length} dipilih` : 'Pilih layanan...'}</span>
                      <button type="button" onClick={() => setIsLayananOpen(!isLayananOpen)} className="text-xs text-sky-600 font-semibold">{isLayananOpen ? 'Tutup' : 'Buka'}</button>
                    </div>
                    {isLayananOpen && (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari layanan..."
                            value={searchLayanan}
                            onChange={(e) => setSearchLayanan(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                          />
                        </div>
                        {filteredLayanan.map((item, index) => {
                          const label = item.nama_kategori || item.nama_layanan || item.label || 'Layanan';
                          return (
                            <div key={index} onClick={() => toggleSelectLayanan(label)} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer ${selectedLayanan.includes(label) ? 'bg-sky-50 border-sky-500 text-sky-900' : 'border-gray-200'}`}>
                              <input type="checkbox" checked={selectedLayanan.includes(label)} readOnly className="pointer-events-none" />
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full mt-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2">
                  Selanjutnya <FiArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: KUALIFIKASI - PENDIDIKAN & LEGALITAS */}
            {step === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-5">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Pendidikan</h2>
                </div>
                
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Universitas <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="nama_universitas"
                    required
                    autoComplete="off"
                    value={pendidikan.nama_universitas}
                    onChange={(e) => {
                      handlePendidikanChange(e);
                      setIsUniversitasOpen(true);
                    }}
                    onFocus={() => setIsUniversitasOpen(true)}
                    onBlur={() => setTimeout(() => setIsUniversitasOpen(false), 150)}
                    placeholder="Cari universitas..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />

                  {isUniversitasOpen && (filteredUniversitas.length > 0 || isSearchingUniv) && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUniversitas.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-sky-50"
                          onMouseDown={() => {
                            setPendidikan((prev) => ({ ...prev, nama_universitas: item }));
                            setIsUniversitasOpen(false);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                      {isSearchingUniv && (
                        <div className="px-4 py-2 text-xs text-gray-400 italic border-t border-gray-50">
                          Mencari institusi lain...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Program Studi <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="program_studi"
                    required
                    placeholder="Contoh: Ilmu Keperawatan"
                    value={pendidikan.program_studi}
                    onChange={handlePendidikanChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tahun Lulus <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    name="tahun_lulus"
                    required
                    min="1990"
                    max="2099"
                    placeholder="Contoh: 2020"
                    value={pendidikan.tahun_lulus}
                    onChange={handlePendidikanChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">Legalitas Profesi</h3>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor STR <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      name="no_str"
                      required
                      placeholder="Masukkan Nomor STR Aktif"
                      value={legalitas.no_str}
                      onChange={handleLegalitasChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload STR <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={strRef} accept=".png,.jpg,.jpeg,.pdf" required={!legalitas.str} onChange={(e) => handleFileChange(e, 'str', 'legalitas')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{legalitas.str ? legalitas.str.name : 'Klik untuk unggah STR'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor SIP <span className="text-gray-400 font-normal">(Opsional)</span></label>
                    <input
                      type="text"
                      name="no_sip"
                      placeholder="Masukkan Nomor SIP"
                      value={legalitas.no_sip}
                      onChange={handleLegalitasChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload SIP <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG - Opsional)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={sipRef} accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => handleFileChange(e, 'sip', 'legalitas')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{legalitas.sip ? legalitas.sip.name : 'Klik untuk unggah SIP (Opsional)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">Pendidikan Pendukung</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload Ijazah <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={ijazahRef} accept=".png,.jpg,.jpeg,.pdf" required={!dokumen.ijazah} onChange={(e) => handleFileChange(e, 'ijazah', 'dokumen')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{dokumen.ijazah ? dokumen.ijazah.name : 'Klik untuk unggah Ijazah'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5">
                    <FiArrowLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button type="submit" className="w-2/3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2">
                    Selanjutnya <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: DOKUMEN PENDUKUNG & PERNYATAAN */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Dokumen Pendukung</h2>
                </div>

                {/* Upload CV */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload CV <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                    <input type="file" ref={cvRef} accept=".png,.jpg,.jpeg,.pdf" required={!dokumen.cv} onChange={(e) => handleFileChange(e, 'cv', 'dokumen')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span>{dokumen.cv ? dokumen.cv.name : 'Klik untuk unggah CV'}</span>
                    </div>
                  </div>
                </div>

                {/* Upload KTP */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload KTP <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                    <input type="file" ref={ktpRef} accept=".png,.jpg,.jpeg,.pdf" required={!dokumen.ktp} onChange={(e) => handleFileChange(e, 'ktp', 'dokumen')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span>{dokumen.ktp ? dokumen.ktp.name : 'Klik untuk unggah KTP'}</span>
                    </div>
                  </div>
                </div>

                {/* Upload SKCK */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload SKCK <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                    <input type="file" ref={skckRef} accept=".png,.jpg,.jpeg,.pdf" required={!dokumen.skck} onChange={(e) => handleFileChange(e, 'skck', 'dokumen')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span>{dokumen.skck ? dokumen.skck.name : 'Klik untuk unggah SKCK'}</span>
                    </div>
                  </div>
                </div>

                {/* Pengalaman Kerja - Opsional */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">Pengalaman Kerja <span className="text-gray-400 font-normal">(Opsional)</span></h3>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Instansi / Tempat Kerja</label>
                    <input
                      type="text"
                      name="tempat_kerja"
                      placeholder="Contoh: RSUD Pasar Rebo"
                      value={pengalamanKerja.tempat_kerja}
                      onChange={handlePengalamanKerjaChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lama Bekerja</label>
                    <input
                      type="text"
                      name="lama_bekerja"
                      placeholder="Contoh: 2 Tahun"
                      value={pengalamanKerja.lama_bekerja}
                      onChange={handlePengalamanKerjaChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* Dokumen Tambahan - Opsional */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Dokumen Tambahan <span className="text-gray-400 font-normal">(Opsional)</span></h3>
                    <button
                      type="button"
                      onClick={handleTambahDokumenTambahan}
                      className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-xs font-bold transition border border-sky-200"
                    >
                      <FiPlus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>

                  {dokumenTambahan.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      Belum ada dokumen tambahan. Klik tombol <span className="font-semibold text-sky-500">+ Tambah</span> untuk menambahkan.
                    </div>
                  )}

                  {dokumenTambahan.map((item, index) => (
                    <div key={item.id} className="mb-3 relative group">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-gray-600">Dokumen #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleHapusDokumenTambahan(item.id)}
                          className="text-rose-500 hover:text-rose-700 transition"
                          aria-label="Hapus dokumen"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                        <input
                          type="file"
                          ref={(el) => {
                            if (el) dokumenTambahanRefs.current[item.id] = el;
                          }}
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(e) => handleGantiDokumenTambahan(item.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                          <FiUpload className="w-6 h-6 text-sky-500" />
                          <span>{item.file ? item.file.name : 'Klik untuk unggah dokumen tambahan'}</span>
                          <span className="text-gray-400 text-[10px]">PDF, PNG, JPG, JPEG</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pernyataan */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">Pernyataan</h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="agreement" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="w-5 h-5 mt-0.5 text-sky-600 rounded border-gray-300" />
                      <label htmlFor="agreement" className="text-xs sm:text-sm text-gray-700 font-medium">Saya menyatakan bahwa seluruh data dan dokumen yang saya unggah adalah benar.</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setStep(2)} className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5">
                    <FiArrowLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button type="submit" disabled={loading} className="w-2/3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition">
                    {loading ? 'Memproses...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}