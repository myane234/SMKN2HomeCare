'use client';

import React, { useState, useEffect } from 'react';
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

  // 🔹 State Kontrol Multi-Step (1-4)
  const [step, setStep] = useState(1);

  // 🔹 State Form Data - Step 1 (Data Diri & Domisili)
  const [formData, setFormData] = useState({
    nik: '',
    nama_lengkap: '',
    nama_panggilan: '',
    jenis_kelamin: '',
    tempat_lahir: '', // 🔹 DITAMBAHKAN: wajib diisi oleh API (tempat_lahir)
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

  // 🔹 State Form Data - Step 2 (Dokumen Identitas)
  const [dokumenIdentitas, setDokumenIdentitas] = useState({
    pas_foto: null,
    ktp: null,
    skck: null,
    cv: null,
    npwp: null,
  });

  // 🔹 DITAMBAHKAN: Nomor NPWP (teks) - API membutuhkan no_npwp sebagai teks, terpisah dari file NPWP
  const [noNpwp, setNoNpwp] = useState('');

  // 🔹 State Form Data - Step 3 (Informasi Pendidikan)
  const [pendidikan, setPendidikan] = useState({
    nama_universitas: '',
    program_studi: '',
    tahun_lulus: '',
    no_str: '',
    no_sip: '', // 🔹 DITAMBAHKAN: wajib diisi oleh API (no_sip) sebagai teks
    ijazah: null,
    str: null,
    sip: null,
  });

  // State Autocomplete Universitas (Step 3)
  const [isUniversitasOpen, setIsUniversitasOpen] = useState(false);

  const filteredUniversitas = pendidikan.nama_universitas
    ? DAFTAR_UNIVERSITAS.filter((nama) =>
        nama.toLowerCase().includes(pendidikan.nama_universitas.toLowerCase())
      ).slice(0, 20)
    : [];

  // 🔹 State Form Data - Step 4 (Pengalaman Kerja & Seminar)
  const [pengalamanKerja, setPengalamanKerja] = useState([
    {
      id: 1,
      nama_tempat: '',
      jabatan: '',
      lama_bekerja: '',
      keterampilan: '',
      dokumen_pendukung: null,
      surat_pengalaman: null,
    }
  ]);

  const [seminars, setSeminars] = useState([
    {
      id: 1,
      nama: '',
      penyelenggara: '',
      tahun: '',
      sertifikat: null,
      pernyataan: '',
    }
  ]);

  // 🔹 State Pernyataan
  const [isAgreed, setIsAgreed] = useState(false);

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
        // Hanya ambil wilayah yang aktif
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

          // Match provinsi jika tersedia
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
        console.error("Error getting location:", error.code, error.message);
        setIsLocationDenied(true);
        setLatitude(null);
        setLongitude(null);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Akses lokasi ditolak. Harap izinkan akses lokasi/GPS di browser Anda.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Sinyal GPS tidak tersedia. Pastikan fitur Lokasi/GPS di HP/Komputer Anda sudah aktif.');
            break;
          case error.TIMEOUT:
            setLocationError('Waktu permintaan lokasi habis. Silakan coba klik "Gunakan Lokasi Saat Ini" lagi.');
            break;
          default:
            setLocationError('Gagal mendeteksi lokasi. Pastikan GPS Anda sudah aktif.');
            break;
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if ((name === 'nik' || name === 'nomor_hp') && value && !/^\d+$/.test(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleDokumenIdentitasChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Pas Foto - hanya PNG/JPG max 2MB
    if (field === 'pas_foto') {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const validExtensions = ['png', 'jpg', 'jpeg'];
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setErrorMessage('Pas foto hanya boleh dalam format PNG atau JPG.');
        e.target.value = '';
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran pas foto maksimal 2MB.');
        e.target.value = '';
        return;
      }
    }

    // Validasi untuk dokumen lain (KTP, SKCK, CV, NPWP) - hanya PDF, PNG, JPG, JPEG
    if (field !== 'pas_foto') {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
        e.target.value = '';
        return;
      }
    }

    setDokumenIdentitas((prev) => ({
      ...prev,
      [field]: file,
    }));
    setErrorMessage('');
  };

  const handlePendidikanChange = (e) => {
    const { name, value } = e.target;
    setPendidikan((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePendidikanFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi untuk dokumen pendidikan (Ijazah, STR, SIP) - hanya PDF, PNG, JPG, JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      e.target.value = '';
      return;
    }

    setPendidikan((prev) => ({
      ...prev,
      [field]: file,
    }));
    setErrorMessage('');
  };

  const handlePengalamanChange = (id, field, value) => {
    setPengalamanKerja((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handlePengalamanFileChange = (id, field, file) => {
    if (!file) return;

    // Validasi untuk dokumen pengalaman kerja - hanya PDF, PNG, JPG, JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      return;
    }

    setPengalamanKerja((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: file } : item
      )
    );
    setErrorMessage('');
  };

  const addPengalaman = () => {
    const newId = Math.max(...pengalamanKerja.map((p) => p.id), 0) + 1;
    setPengalamanKerja((prev) => [
      ...prev,
      {
        id: newId,
        nama_tempat: '',
        jabatan: '',
        lama_bekerja: '',
        keterampilan: '',
        dokumen_pendukung: null,
        surat_pengalaman: null,
      }
    ]);
  };

  const removePengalaman = (id) => {
    if (pengalamanKerja.length > 1) {
      setPengalamanKerja((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSeminarChange = (id, field, value) => {
    setSeminars((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSeminarFileChange = (id, file) => {
    if (!file) return;

    // Validasi untuk sertifikat seminar - hanya PDF, PNG, JPG, JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('File hanya boleh dalam format PDF, PNG, JPG, atau JPEG.');
      return;
    }

    setSeminars((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, sertifikat: file } : item
      )
    );
    setErrorMessage('');
  };

  const addSeminar = () => {
    const newId = Math.max(...seminars.map((s) => s.id), 0) + 1;
    setSeminars((prev) => [
      ...prev,
      {
        id: newId,
        nama: '',
        penyelenggara: '',
        tahun: '',
        sertifikat: null,
        pernyataan: '',
      }
    ]);
  };

  const removeSeminar = (id) => {
    if (seminars.length > 1) {
      setSeminars((prev) => prev.filter((item) => item.id !== id));
    }
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
      setErrorMessage('Lokasi GPS Anda belum terdeteksi/aktif. Harap izinkan akses lokasi pada browser.');
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

  const handleNextStep2 = (e) => {
    e.preventDefault();

    if (!dokumenIdentitas.pas_foto) {
      setErrorMessage('Harap unggah Pas Foto.');
      return;
    }

    if (!dokumenIdentitas.ktp) {
      setErrorMessage('Harap unggah KTP.');
      return;
    }

    if (!dokumenIdentitas.skck) {
      setErrorMessage('Harap unggah SKCK.');
      return;
    }

    if (!dokumenIdentitas.cv) {
      setErrorMessage('Harap unggah Curriculum Vitae (CV).');
      return;
    }

    setErrorMessage('');
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();

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

    setErrorMessage('');
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAgreed) {
      setErrorMessage('Harap centang pernyataan bahwa seluruh data dan dokumen yang diunggah adalah benar.');
      return;
    }

    for (const pengalaman of pengalamanKerja) {
      if (!pengalaman.nama_tempat.trim()) {
        setErrorMessage('Harap isi Nama Tempat Kerja untuk semua pengalaman kerja.');
        return;
      }
      if (!pengalaman.jabatan.trim()) {
        setErrorMessage('Harap isi Jabatan untuk semua pengalaman kerja.');
        return;
      }
      if (!pengalaman.lama_bekerja.trim()) {
        setErrorMessage('Harap isi Lama Bekerja untuk semua pengalaman kerja.');
        return;
      }
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const dataToSend = new FormData();

      // ============================================================
      // 🔹 FIELD TEKS — nama key disesuaikan agar SAMA PERSIS dengan
      //    yang diharapkan endpoint /api/nakes/register (lihat contoh curl)
      // ============================================================
      dataToSend.append('nik', formData.nik);
      dataToSend.append('nama_lengkap', formData.nama_lengkap);
      dataToSend.append('nama_panggilan', formData.nama_panggilan); // tambahan, aman dikirim meski di luar contoh curl
      dataToSend.append('jenis_kelamin', formData.jenis_kelamin);
      dataToSend.append('tempat_lahir', formData.tempat_lahir); // 🔹 sebelumnya tidak dikirim sama sekali
      dataToSend.append('tanggal_lahir', formData.tanggal_lahir);
      dataToSend.append('agama', formData.agama); // tambahan, aman dikirim meski di luar contoh curl
      dataToSend.append('email', formData.email); // tambahan, aman dikirim meski di luar contoh curl
      dataToSend.append('no_telp', formData.nomor_hp); // 🔹 sebelumnya: 'nomor_hp'
      dataToSend.append('alamat_lengkap', formData.alamat_lengkap);
      dataToSend.append('latitude', latitude);
      dataToSend.append('longitude', longitude);
      dataToSend.append('jenis_tenaga_medis', selectedLayanan.join(', '));
      dataToSend.append('id_wilayah_layanan', idWilayahLayanan);
      dataToSend.append('is_agreed', isAgreed); // tambahan, aman dikirim meski di luar contoh curl

      // ============================================================
      // 🔹 DOKUMEN IDENTITAS
      // ============================================================
      dataToSend.append('foto_profile', dokumenIdentitas.pas_foto);
      dataToSend.append('ktp', dokumenIdentitas.ktp); // tidak ada di contoh curl, tetap dikirim (aman diabaikan backend jika tidak dikenali)
      dataToSend.append('file_skck', dokumenIdentitas.skck); // 🔹 sebelumnya: 'skck'
      dataToSend.append('file_cv', dokumenIdentitas.cv); // 🔹 sebelumnya: 'cv'
      dataToSend.append('no_npwp', noNpwp); // 🔹 field teks baru sesuai API
      if (dokumenIdentitas.npwp) {
        dataToSend.append('npwp', dokumenIdentitas.npwp); // file NPWP opsional, tetap dikirim terpisah dari no_npwp (teks)
      }

      // ============================================================
      // 🔹 PENDIDIKAN & LEGALITAS
      // ============================================================
      dataToSend.append('lulusan', pendidikan.nama_universitas); // 🔹 sebelumnya: 'nama_universitas'
      dataToSend.append('program_studi', pendidikan.program_studi); // tambahan, aman dikirim meski di luar contoh curl
      dataToSend.append('tahun_lulus', pendidikan.tahun_lulus); // tambahan, aman dikirim meski di luar contoh curl
      dataToSend.append('no_str', pendidikan.no_str);
      dataToSend.append('no_sip', pendidikan.no_sip); // 🔹 field teks baru sesuai API
      dataToSend.append('ijazah', pendidikan.ijazah);
      dataToSend.append('file_str', pendidikan.str); // 🔹 sebelumnya: 'str'
      if (pendidikan.sip) {
        dataToSend.append('file_sip', pendidikan.sip); // 🔹 sebelumnya: 'sip'
      }

      // ============================================================
      // 🔹 PENGALAMAN KERJA (tetap dikirim sebagai JSON + file per index,
      //    sesuai struktur form saat ini — tidak diubah fungsinya)
      // ============================================================
      dataToSend.append('pengalaman_kerja', JSON.stringify(
        pengalamanKerja.map(({ id, dokumen_pendukung, surat_pengalaman, ...rest }) => rest)
      ));

      pengalamanKerja.forEach((pengalaman, index) => {
        if (pengalaman.dokumen_pendukung) {
          dataToSend.append(`dokumen_pendukung_${index}`, pengalaman.dokumen_pendukung);
        }
        if (pengalaman.surat_pengalaman) {
          dataToSend.append(`surat_pengalaman_${index}`, pengalaman.surat_pengalaman);
        }
      });

      // ============================================================
      // 🔹 SEMINAR/PELATIHAN
      //    Endpoint contoh curl hanya punya SATU field 'sertifikat'.
      //    Sertifikat seminar pertama dikirim sebagai 'sertifikat' agar
      //    cocok dengan API; sisanya tetap dikirim per-index seperti semula
      //    (jaga-jaga jika backend memang mendukung banyak file).
      // ============================================================
      dataToSend.append('seminars', JSON.stringify(
        seminars.map(({ id, sertifikat, ...rest }) => rest)
      ));

      seminars.forEach((seminar, index) => {
        if (seminar.sertifikat) {
          if (index === 0) {
            dataToSend.append('sertifikat', seminar.sertifikat); // 🔹 sesuai API
          }
          dataToSend.append(`sertifikat_seminar_${index}`, seminar.sertifikat); // tetap dikirim, jaga kompatibilitas lama
        }
      });

      const res = await api.post('/api/nakes/register', dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Pendaftaran mitra berhasil dikirim. Menunggu verifikasi admin.');
      } else {
        setErrorMessage(res.data?.message || 'Gagal mengirim pendaftaran. Periksa kembali data Anda.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan koneksi ke server API.';
      setErrorMessage(msg);
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
                Langkah {step} dari 4
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {successMessage 
              ? 'Permohonan pendaftaran Anda telah tercatat' 
              : step === 1 
                ? 'Isi data pribadi, lokasi domisili, area kerja, dan kategori layanan' 
                : step === 2
                ? 'Unggah dokumen identitas yang diperlukan'
                : step === 3
                ? 'Isi informasi pendidikan dan unggah dokumen legalitas'
                : 'Lengkapi pengalaman kerja dan data seminar/pelatihan'}
          </p>

          {!successMessage && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
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
            <p className="text-xs text-emerald-600">
              Tim admin akan meninjau berkas pendaftaran Anda. Status permohonan akan diperbarui secara berkala.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        )}

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex justify-between items-center">
            <div>
              <p className="font-bold">Pemberitahuan</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button 
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2"
            >
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    NIK  <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nik"
                    required
                    maxLength={16}
                    placeholder="16 Digit Nomor NIK"
                    value={formData.nik}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap  <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    required
                    placeholder="Contoh: Ns. Budi Santoso, S.Kep"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nama Panggilan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_panggilan"
                      required
                      placeholder="Contoh: Budi"
                      value={formData.nama_panggilan}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="jenis_kelamin"
                      required
                      value={formData.jenis_kelamin}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                    >
                      <option value="">Pilih...</option>
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* 🔹 DITAMBAHKAN: Tempat Lahir (wajib sesuai API) */}


{/* Grid Tempat & Tanggal Lahir */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
<div>
  <label className="block text-xs font-bold text-gray-700 mb-1">
    Tempat Lahir <span className="text-rose-500">*</span>
  </label>
  <select
    name="tempat_lahir"
    required
    value={formData.tempat_lahir}
    onChange={handleChange}
    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium text-gray-700"
  >
    <option value="">-- Pilih Tempat Lahir --</option>
    {listProvinsi && listProvinsi.length > 0 ? (
      listProvinsi.map((wilayah) => {
        const id = wilayah.id_provinsi || wilayah.id_wilayah_layanan || wilayah.id || Math.random();
        const nama = wilayah.nama_provinsi || wilayah.nama_wilayah || wilayah.nama || "Wilayah";

        return (
          <option key={id} value={nama}>
            {nama}
          </option>
        );
      })
    ) : (
      <option value="" disabled>Memuat data wilayah...</option>
    )}
  </select>
</div>

  <div>
    <label className="block text-xs font-bold text-gray-700 mb-1">
      Tanggal Lahir <span className="text-rose-500">*</span>
    </label>
    <input
      type="date"
      name="tanggal_lahir"
      required
      value={formData.tanggal_lahir}
      onChange={handleChange}
      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
    />
  </div>
</div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Agama <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="agama"
                    required
                    value={formData.agama}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    <option value="">Pilih Agama...</option>
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Active <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="budi@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      No.HP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nomor_hp"
                      required
                      placeholder="08123456789"
                      value={formData.nomor_hp}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <hr className="my-4 border-gray-100" />

                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Alamat Domisili</h2>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Alamat Lengkap Domisili <span className="text-rose-500">*</span>
                    </label>
                    {isFetchingAddress && (
                      <span className="text-[11px] text-sky-600 font-semibold animate-pulse">
                        📍 Mendapatkan alamat...
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    name="alamat_lengkap"
                    required
                    placeholder="Contoh: Jl. Mawar No. 12, RT 02/RW 05, Kel. Suka Maju, Kec. Cilandak"
                    value={formData.alamat_lengkap}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                  />
                  <p className="text-[11px] text-sky-600/80 mt-1">
                    💡 Alamat dan wilayah akan otomatis terisi saat memilih atau menggeser titik lokasi pada peta.
                  </p>
                </div>

                <hr className="my-4 border-gray-100" />

                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Area Kerja</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Area Kerja / Wilayah Provinsi Operasional <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={idWilayahLayanan}
                    onChange={(e) => setIdWilayahLayanan(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    <option value="">-- Pilih Wilayah Operasional --</option>
                    {listProvinsi.map((wilayah) => (
                      <option 
                        key={wilayah.id_provinsi} 
                        value={wilayah.id_provinsi}
                      >
                        {wilayah.nama_provinsi}
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="my-4 border-gray-100" />

                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Titik GPS (Peta)</h2>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Titik Lokasi Domisili (Peta) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      <FiMapPin className="w-3.5 h-3.5" /> Gunakan Lokasi Saat Ini
                    </button>
                  </div>

                  {isLocationDenied && (
                    <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                      <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Lokasi GPS Tidak Terdeteksi!</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed">
                          {locationError || 'Akses lokasi mati atau ditolak. Silakan aktifkan GPS HP/Komputer Anda dan izinkan lokasi pada browser.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] rounded-md transition"
                        >
                          Coba Lagi / Aktifkan Lokasi
                        </button>
                      </div>
                    </div>
                  )}

                  <MapPicker
                    lat={latitude || -6.2088}
                    lng={longitude || 106.8456}
                    onChange={(newLat, newLng) => {
                      setLatitude(newLat);
                      setLongitude(newLng);
                      setIsLocationDenied(false);
                      fetchAddressAndWilayah(newLat, newLng);
                    }}
                  />

                  <p className="text-[11px] text-gray-500 mt-1.5">
                    📍 Lat: <span className="font-mono font-medium">{latitude ?? 'Belum terdeteksi'}</span> | Long: <span className="font-mono font-medium">{longitude ?? 'Belum terdeteksi'}</span>
                  </p>
                </div>

                <hr className="my-4 border-gray-100" />

                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Layanan Medis</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Pilih Kategori Layanan (Jenis Tenaga Medis) <span className="text-rose-500">*</span>
                  </label>

                  <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-xs">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {selectedLayanan.length > 0
                          ? `${selectedLayanan.length} layanan dipilih`
                          : 'Pilih kategori layanan...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLayananOpen(!isLayananOpen)}
                        className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        {isLayananOpen ? 'Tutup' : 'Buka'}
                      </button>
                    </div>

                    {isLayananOpen && (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-3">
                        <input
                          type="text"
                          placeholder="Cari layanan..."
                          value={searchLayanan}
                          onChange={(e) => setSearchLayanan(e.target.value)}
                          className="w-full pl-3 pr-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none focus:border-sky-500"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {filteredLayanan.length > 0 ? (
                            filteredLayanan.map((item, index) => {
                              const labelName = item.nama_kategori || item.nama_layanan || item.label || (typeof item === 'string' ? item : `Layanan ${index + 1}`);
                              const itemId = item.id_kategori || item.id || index;
                              const isChecked = selectedLayanan.includes(labelName);

                              return (
                                <div
                                  key={itemId}
                                  onClick={() => toggleSelectLayanan(labelName)}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs sm:text-sm cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 font-medium'
                                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 pointer-events-none"
                                  />
                                  <span>{labelName}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-4 text-xs text-gray-400">
                              Layanan tidak ditemukan
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedLayanan.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedLayanan.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => toggleSelectLayanan(label)}
                              className="hover:text-emerald-950"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                >
                  Selanjutnya <FiArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: DOKUMEN IDENTITAS */}
            {step === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-5">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Dokumen Identitas</h2>
                </div>

                {/* Pas Foto */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Pas Foto <span className="text-rose-500">*</span>
                    <span className="text-gray-400 text-[10px] font-normal ml-1">(PNG, JPG, JPEG, maks 2MB)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      required
                      onChange={(e) => handleDokumenIdentitasChange(e, 'pas_foto')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {dokumenIdentitas.pas_foto ? dokumenIdentitas.pas_foto.name : 'Klik untuk unggah Pas Foto'}
                      </span>
                      {dokumenIdentitas.pas_foto && (
                        <span className="text-[10px] text-gray-400">
                          {(dokumenIdentitas.pas_foto.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KTP - PDF, PNG, JPG, JPEG */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    KTP <span className="text-rose-500">*</span>
                    <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      required
                      onChange={(e) => handleDokumenIdentitasChange(e, 'ktp')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {dokumenIdentitas.ktp ? dokumenIdentitas.ktp.name : 'Klik untuk unggah KTP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SKCK - PDF, PNG, JPG, JPEG */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    SKCK <span className="text-rose-500">*</span>
                    <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      required
                      onChange={(e) => handleDokumenIdentitasChange(e, 'skck')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {dokumenIdentitas.skck ? dokumenIdentitas.skck.name : 'Klik untuk unggah SKCK'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CV - PDF, PNG, JPG, JPEG */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    CV <span className="text-rose-500">*</span>
                    <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      required
                      onChange={(e) => handleDokumenIdentitasChange(e, 'cv')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {dokumenIdentitas.cv ? dokumenIdentitas.cv.name : 'Klik untuk unggah CV'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🔹 DITAMBAHKAN: Nomor NPWP (teks) sesuai API */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomor NPWP (Opsional)
                  </label>
                  <input
                    type="text"
                    name="no_npwp"
                    placeholder="Masukkan Nomor NPWP"
                    value={noNpwp}
                    onChange={(e) => setNoNpwp(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* NPWP - PDF, PNG, JPG, JPEG (Opsional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    File NPWP (Opsional)
                    <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => handleDokumenIdentitasChange(e, 'npwp')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FiUpload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {dokumenIdentitas.npwp ? dokumenIdentitas.npwp.name : 'Klik untuk unggah NPWP (Opsional)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <FiArrowLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    Selanjutnya <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: INFORMASI PENDIDIKAN */}
            {step === 3 && (
              <form onSubmit={handleNextStep3} className="space-y-5">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Informasi Pendidikan</h2>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Universitas/Institusi <span className="text-rose-500">*</span>
                  </label>

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

                  {isUniversitasOpen && filteredUniversitas.length > 0 && (
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
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Program Studi <span className="text-rose-500">*</span>
                  </label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tahun Lulus <span className="text-rose-500">*</span>
                  </label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomor STR <span className="text-rose-500">*</span>
                  </label>
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

                {/* 🔹 DITAMBAHKAN: Nomor SIP (teks) sesuai API */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomor SIP (Jika Profesi Memerlukan)
                  </label>
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
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Dokumen Pendidikan & Legalitas</h3>
                  
                  {/* Ijazah - PDF, PNG, JPG, JPEG */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Ijazah <span className="text-rose-500">*</span>
                      <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        required
                        onChange={(e) => handlePendidikanFileChange(e, 'ijazah')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span className="text-xs text-gray-600 font-medium">
                          {pendidikan.ijazah ? pendidikan.ijazah.name : 'Klik untuk unggah Ijazah'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STR - PDF, PNG, JPG, JPEG */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      STR <span className="text-rose-500">*</span>
                      <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        required
                        onChange={(e) => handlePendidikanFileChange(e, 'str')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span className="text-xs text-gray-600 font-medium">
                          {pendidikan.str ? pendidikan.str.name : 'Klik untuk unggah STR'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SIP - PDF, PNG, JPG, JPEG (Opsional) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      File SIP (Jika Profesi Memerlukan)
                      <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(e) => handlePendidikanFileChange(e, 'sip')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FiUpload className="w-6 h-6 text-sky-500" />
                        <span className="text-xs text-gray-600 font-medium">
                          {pendidikan.sip ? pendidikan.sip.name : 'Klik untuk unggah SIP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <FiArrowLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    Selanjutnya <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: PENGALAMAN KERJA & SEMINAR */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Pengalaman Kerja</h2>
                </div>

                {pengalamanKerja.map((pengalaman, index) => (
                  <div key={pengalaman.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-600">Pengalaman #{index + 1}</span>
                      {pengalamanKerja.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePengalaman(pengalaman.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nama Tempat Kerja <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: RSUP Dr. Cipto Mangunkusumo"
                        value={pengalaman.nama_tempat}
                        onChange={(e) => handlePengalamanChange(pengalaman.id, 'nama_tempat', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Jabatan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Perawat Pelaksana"
                        value={pengalaman.jabatan}
                        onChange={(e) => handlePengalamanChange(pengalaman.id, 'jabatan', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Lama Bekerja <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 3 Tahun atau Jan 2020 - Des 2023"
                        value={pengalaman.lama_bekerja}
                        onChange={(e) => handlePengalamanChange(pengalaman.id, 'lama_bekerja', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Keterampilan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Perawatan Luka, Pemasangan Infus"
                        value={pengalaman.keterampilan}
                        onChange={(e) => handlePengalamanChange(pengalaman.id, 'keterampilan', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    {/* Dokumen Pendukung - PDF, PNG, JPG, JPEG */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Dokumen Pendukung
                        <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePengalamanFileChange(pengalaman.id, 'dokumen_pendukung', e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FiUpload className="w-6 h-6 text-sky-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            {pengalaman.dokumen_pendukung ? pengalaman.dokumen_pendukung.name : 'Klik untuk unggah Dokumen Pendukung'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Surat Pengalaman Kerja - PDF, PNG, JPG, JPEG */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Surat Pengalaman Kerja
                        <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePengalamanFileChange(pengalaman.id, 'surat_pengalaman', e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FiUpload className="w-6 h-6 text-sky-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            {pengalaman.surat_pengalaman ? pengalaman.surat_pengalaman.name : 'Klik untuk unggah Surat Pengalaman Kerja'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPengalaman}
                  className="w-full py-2.5 border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-xl text-sky-600 hover:text-sky-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-4 h-4" /> Tambah Pengalaman Kerja
                </button>

                <hr className="my-4 border-gray-100" />

                <div className="mb-3">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider">Seminar & Pelatihan</h2>
                </div>

                {seminars.map((seminar, index) => (
                  <div key={seminar.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-600">Seminar #{index + 1}</span>
                      {seminars.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSeminar(seminar.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nama Seminar/Pelatihan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Pelatihan Basic Life Support"
                        value={seminar.nama}
                        onChange={(e) => handleSeminarChange(seminar.id, 'nama', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Penyelenggara <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PPNI"
                        value={seminar.penyelenggara}
                        onChange={(e) => handleSeminarChange(seminar.id, 'penyelenggara', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tahun Pelatihan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="2000"
                        max="2099"
                        placeholder="Contoh: 2023"
                        value={seminar.tahun}
                        onChange={(e) => handleSeminarChange(seminar.id, 'tahun', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    {/* Sertifikat Pelatihan - PDF, PNG, JPG, JPEG */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Sertifikat Pelatihan
                        <span className="text-gray-400 text-[10px] font-normal ml-1">(PDF, PNG, JPG, JPEG)</span>
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleSeminarFileChange(seminar.id, e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FiUpload className="w-6 h-6 text-sky-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            {seminar.sertifikat ? seminar.sertifikat.name : 'Klik untuk unggah Sertifikat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Pernyataan
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Tambahkan pernyataan atau deskripsi tambahan..."
                        value={seminar.pernyataan}
                        onChange={(e) => handleSeminarChange(seminar.id, 'pernyataan', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSeminar}
                  className="w-full py-2.5 border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-xl text-sky-600 hover:text-sky-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-4 h-4" /> Tambah Seminar/Pelatihan
                </button>

                <hr className="my-4 border-gray-100" />

                {/* PERNYATAAN */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="agreement" className="text-xs sm:text-sm text-gray-700 font-medium">
                      Saya menyatakan bahwa seluruh data dan dokumen yang saya unggah adalah benar.
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <FiArrowLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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