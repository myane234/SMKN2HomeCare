'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  FiUpload,
  FiArrowRight, 
  FiArrowLeft,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import api from '@/services/api';
import { DAFTAR_UNIVERSITAS } from '@/services/dataUniversitas';

// Dynamic import MapPicker untuk menghindari SSR error dari Leaflet
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

  // 🔹 State Kontrol Multi-Step (1-2)
  const [step, setStep] = useState(1);

  // 🔹 State Form Data - Step 1 (Data Diri & Domisili)
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

  // State Geolocation/Peta (Step 1)
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // State Layanan & Area Kerja (Step 1)
  const [listKategori, setListKategori] = useState([]);
  const [isLayananOpen, setIsLayananOpen] = useState(true);
  const [searchLayanan, setSearchLayanan] = useState('');
  const [selectedLayanan, setSelectedLayanan] = useState([]);
  const [idWilayahLayanan, setIdWilayahLayanan] = useState('');
  const [listProvinsi, setListProvinsi] = useState([]);

  // 🔹 State Form Data - Step 2 (Kualifikasi & Dokumen Utama)
  const [pendidikan, setPendidikan] = useState({
    nama_universitas: '',
    program_studi: '',
    tahun_lulus: '',
    no_str: '',
    no_sip: '', 
    ijazah: null,
    str: null,
    sip: null,
    cv: null,
  });

  // State Autocomplete Universitas (Step 2)
  const [isUniversitasOpen, setIsUniversitasOpen] = useState(false);
  const [apiUniversitas, setApiUniversitas] = useState([]);
  const [isSearchingUniv, setIsSearchingUniv] = useState(false);

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
        const res = await fetch(
          `http://universities.hipolabs.com/search?country=Indonesia&name=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          const names = data.map((item) => item.name);
          setApiUniversitas(names);
        }
      } catch (err) {
        console.error('Gagal mengambil data universitas dari API:', err);
      } finally {
        setIsSearchingUniv(false);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(delayDebounce);
  }, [pendidikan.nama_universitas]);

  const filteredUniversitas = (() => {
    const query = (pendidikan.nama_universitas || '').toLowerCase().trim();
    if (!query) return [];

    // Filter local list
    const localFiltered = DAFTAR_UNIVERSITAS.filter((nama) =>
      nama.toLowerCase().includes(query)
    );

    // Combine local and API results
    const combined = [...localFiltered, ...apiUniversitas];
    
    // Case-insensitive deduplication
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

  // 🔹 State Pernyataan
  const [isAgreed, setIsAgreed] = useState(false);

  // Refs for File Inputs to restore File object upon step switching
  const ijazahRef = useRef(null);
  const strRef = useRef(null);
  const sipRef = useRef(null);
  const cvRef = useRef(null);

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
      // Short timeout to let the Step 2 DOM mount completely
      const timer = setTimeout(() => {
        restoreFile(pendidikan.ijazah, ijazahRef);
        restoreFile(pendidikan.str, strRef);
        restoreFile(pendidikan.sip, sipRef);
        restoreFile(pendidikan.cv, cvRef);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, pendidikan.ijazah, pendidikan.str, pendidikan.sip, pendidikan.cv]);

  // State UI
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🔹 Fetch Data (Kategori & Wilayah) + Geolocation
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const res = await api.get('/api/layanan?ambil_kategori=true');
        const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setListKategori(data);
      } catch (err) {
        console.error("Gagal mengambil kategori layanan: ", err);
      }
    };

    const fetchWilayah = async () => {
      try {
        const res = await api.get('/api/wilayah-layanan');
        const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setListProvinsi(data.filter((w) => w.is_active));
      } catch (err) {
        console.error("Gagal mengambil wilayah layanan: ", err);
      }
    };

    fetchKategori();
    fetchWilayah();
    handleGetCurrentLocation();
  }, []);

  const fetchAddressAndWilayah = async (lat, lng) => {
    if (!lat || !lng) return;
    setIsFetchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setFormData((prev) => ({
            ...prev,
            alamat_lengkap: data.display_name,
          }));

          if (data.address && listProvinsi.length > 0) {
            const stateStr = (
              data.address.state || 
              data.address.province || 
              data.address.region || 
              data.display_name || ''
            ).toLowerCase();

            const matched = listProvinsi.find((w) => {
              const provName = (w.nama_provinsi || '').toLowerCase();
              if (!provName) return false;
              const cleanProv = provName.replace(/provinsi\s+/g, '').replace(/dki\s+/g, '').trim();
              const cleanState = stateStr.replace(/provinsi\s+/g, '').replace(/daerah khusus ibukota\s+/g, '').trim();
              return stateStr.includes(provName) || (cleanProv && cleanState.includes(cleanProv));
            });

            if (matched) {
              setIdWilayahLayanan(matched.id_provinsi);
            }
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil alamat dari GPS:', err);
    } finally {
      setIsFetchingAddress(false);
    }
  };

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectLayanan = (label) => {
    setSelectedLayanan((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const filteredLayanan = listKategori.filter((item) => {
    const namaKategori = item.nama_kategori || item.nama_layanan || item.label || (typeof item === 'string' ? item : '');
    return String(namaKategori).toLowerCase().includes(searchLayanan.toLowerCase());
  });

  const handlePendidikanChange = (e) => {
    const { name, value } = e.target;
    setPendidikan((prev) => ({ ...prev, [name]: value }));
  };

  const handlePendidikanFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi untuk dokumen (Ijazah, STR, SIP, CV) - hanya PDF, PNG, JPG, JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      e.target.value = '';
      return;
    }

    setPendidikan((prev) => ({ ...prev, [field]: file }));
    setErrorMessage('');
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();

    if (formData.nik.length !== 16) {
      setErrorMessage('Nomor NIK harus terdiri dari 16 digit angka.');
      return;
    }
    if (!formData.tempat_lahir.trim()) {
      setErrorMessage('Harap isi Tempat Lahir.');
      return;
    }
    if (!formData.alamat_lengkap.trim()) {
      setErrorMessage('Harap isi Alamat Lengkap Domisili.');
      return;
    }
    if (!idWilayahLayanan) {
      setErrorMessage('Harap pilih area kerja / wilayah provinsi operasional Anda.');
      return;
    }
    if (isLocationDenied || latitude === null || longitude === null) {
      setErrorMessage('Lokasi GPS Anda belum terdeteksi/aktif.');
      return;
    }
    if (selectedLayanan.length === 0) {
      setErrorMessage('Harap pilih minimal satu kategori layanan medis.');
      return;
    }

    setErrorMessage('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAgreed) {
      setErrorMessage('Harap centang pernyataan bahwa seluruh data dan dokumen yang diunggah adalah benar.');
      return;
    }

    if (!pendidikan.nama_universitas.trim()) {
      setErrorMessage('Harap isi Nama Universitas/Institusi.');
      return;
    }
    if (!pendidikan.program_studi.trim()) {
      setErrorMessage('Harap isi Program Studi.');
      return;
    }
    if (!pendidikan.tahun_lulus) {
      setErrorMessage('Harap isi Tahun Lulus.');
      return;
    }
    if (!pendidikan.no_str.trim()) {
      setErrorMessage('Harap isi Nomor STR.');
      return;
    }
    if (!pendidikan.ijazah) {
      setErrorMessage('Harap unggah Ijazah.');
      return;
    }
    if (!pendidikan.str) {
      setErrorMessage('Harap unggah STR.');
      return;
    }
    if (!pendidikan.cv) {
      setErrorMessage('Harap unggah Curriculum Vitae (CV).');
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
      dataToSend.append('email', formData.email); 
      dataToSend.append('no_telp', formData.nomor_hp); 
      dataToSend.append('alamat_lengkap', formData.alamat_lengkap);
      dataToSend.append('latitude', latitude);
      dataToSend.append('longitude', longitude);
      dataToSend.append('jenis_tenaga_medis', selectedLayanan.join(', '));
      dataToSend.append('id_wilayah_layanan', idWilayahLayanan);
      dataToSend.append('is_agreed', isAgreed); 

      // ============================================================
      // 🔹 PENDIDIKAN & LEGALITAS
      // ============================================================
      dataToSend.append('lulusan', pendidikan.nama_universitas); 
      dataToSend.append('program_studi', pendidikan.program_studi); 
      dataToSend.append('tahun_lulus', pendidikan.tahun_lulus); 
      dataToSend.append('no_str', pendidikan.no_str);
      if (pendidikan.no_sip) {
        dataToSend.append('no_sip', pendidikan.no_sip);
      }
      dataToSend.append('ijazah', pendidikan.ijazah);
      dataToSend.append('file_str', pendidikan.str); 
      if (pendidikan.sip) {
        dataToSend.append('file_sip', pendidikan.sip); 
      }
      dataToSend.append('file_cv', pendidikan.cv);

      const res = await api.post('/api/nakes/register', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Pendaftaran mitra berhasil dikirim.');
      } else {
        setErrorMessage(res.data?.message || 'Gagal mengirim pendaftaran.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Terjadi kesalahan koneksi ke server API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        
        {/* Header Form & Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-sky-600">
              Pendaftaran Mitra Nakes
            </h1>
            {!successMessage && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                Langkah {step} dari 2
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {successMessage 
              ? 'Permohonan pendaftaran Anda telah tercatat' 
              : step === 1 
                ? 'Isi data pribadi, lokasi domisili, area kerja, dan kategori layanan' 
                : 'Lengkapi kualifikasi pendidikan dan unggah dokumen utama'}
          </p>

          {!successMessage && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
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

                {/* Grid Tempat & Tanggal Lahir */}
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
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">No. HP / WhatsApp <span className="text-rose-500">*</span></label>
                    <input type="text" name="nomor_hp" required value={formData.nomor_hp} onChange={handleChange} className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                </div>

                <hr className="my-4 border-gray-100" />

                {/* 2. ALAMAT DOMISILI */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">2. Alamat Domisili</h2>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lengkap Domisili <span className="text-rose-500">*</span></label>
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

                {/* 3. AREA KERJA */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">3. Area Kerja</h2>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Area Kerja / Wilayah Provinsi Operasional <span className="text-rose-500">*</span></label>
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

                {/* 4. TITIK GPS (PETA) */}
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">4. Titik GPS (Peta)</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">Tentukan koordinat lokasi pelayanan Anda</span>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-xs font-bold transition border border-sky-200"
                    >
                      <FiMapPin className="w-3.5 h-3.5" /> Gunakan Lokasi Saat Ini
                    </button>
                  </div>
                  
                  <div className="relative">
                    <MapPicker
                      lat={latitude}
                      lng={longitude}
                      onChange={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                        fetchAddressAndWilayah(lat, lng);
                      }}
                    />
                    {isFetchingAddress && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl z-10">
                        <span className="text-xs font-semibold text-gray-700 animate-pulse">Memperbarui alamat...</span>
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
                <div className="mb-3"><h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">5. Layanan Medis</h2></div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pilih Kategori Layanan / Jenis Tenaga Medis <span className="text-rose-500">*</span></label>
                  <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-xs">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{selectedLayanan.length > 0 ? `${selectedLayanan.length} dipilih` : 'Pilih layanan...'}</span>
                      <button type="button" onClick={() => setIsLayananOpen(!isLayananOpen)} className="text-xs text-sky-600 font-semibold">{isLayananOpen ? 'Tutup' : 'Buka'}</button>
                    </div>
                    {isLayananOpen && (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
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

            {/* STEP 2: KUALIFIKASI & DOKUMEN UTAMA */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mb-3"><h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Informasi Pendidikan</h2></div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Universitas / Institusi <span className="text-rose-500">*</span></label>
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

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor STR <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="no_str"
                    required
                    placeholder="Masukkan Nomor STR Aktif"
                    value={pendidikan.no_str}
                    onChange={handlePendidikanChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor SIP (Optional)</label>
                  <input
                    type="text"
                    name="no_sip"
                    placeholder="Masukkan Nomor SIP"
                    value={pendidikan.no_sip}
                    onChange={handlePendidikanChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Unggah Dokumen Utama</h3>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">File Ijazah <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={ijazahRef} accept=".png,.jpg,.jpeg,.pdf" required={!pendidikan.ijazah} onChange={(e) => handlePendidikanFileChange(e, 'ijazah')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{pendidikan.ijazah ? pendidikan.ijazah.name : 'Klik untuk unggah Ijazah'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">File STR <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={strRef} accept=".png,.jpg,.jpeg,.pdf" required={!pendidikan.str} onChange={(e) => handlePendidikanFileChange(e, 'str')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{pendidikan.str ? pendidikan.str.name : 'Klik untuk unggah STR'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">File SIP <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG - Optional)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={sipRef} accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => handlePendidikanFileChange(e, 'sip')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{pendidikan.sip ? pendidikan.sip.name : 'Klik untuk unggah SIP (Optional)'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">File CV <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(PDF, PNG, JPG, JPEG)</span></label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50">
                      <input type="file" ref={cvRef} accept=".png,.jpg,.jpeg,.pdf" required={!pendidikan.cv} onChange={(e) => handlePendidikanFileChange(e, 'cv')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span>{pendidikan.cv ? pendidikan.cv.name : 'Klik untuk unggah CV'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="agreement" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="w-5 h-5 mt-0.5 text-sky-600 rounded border-gray-300" />
                    <label htmlFor="agreement" className="text-xs sm:text-sm text-gray-700 font-medium">Saya menyatakan bahwa seluruh data dan dokumen yang saya unggah adalah benar.</label>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5">
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