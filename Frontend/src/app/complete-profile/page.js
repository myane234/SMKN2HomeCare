"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiSearch, FiCamera, FiX, FiUpload, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import api from "@/services/api";

// Import CSS Leaflet agar peta tampil dengan benar
import "leaflet/dist/leaflet.css";

const API_CHECK_URL = "/api/pasien/complete-profile";
const API_UPDATE_URL = "/api/pasien";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [missingFields, setMissingFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State untuk Dropdown Menu Foto Profil & Modal Lihat Foto
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const menuRef = useRef(null);

  // State & Ref untuk Modal Kamera / Selfie
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // State & Ref untuk Peta Leaflet & Pencarian
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const mapContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkMissingFields();
  }, []);

  // Tutup dropdown menu saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const fullAddress = data.display_name;
        setSearchQuery(fullAddress);
        setFormData((prev) => ({
          ...prev,
          alamat_utama: fullAddress,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
      }
    } catch (error) {
      console.error("Gagal mengambil alamat otomatis", error);
    }
  };

  useEffect(() => {
    if (!loading && (missingFields.includes("latitude") || missingFields.includes("longitude") || missingFields.includes("alamat_utama"))) {
      import("leaflet").then((L) => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (mapContainerRef.current && !mapRef.current) {
          const defaultLat = -6.438157;
          const defaultLng = 106.801077;

          const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);
          mapRef.current = map;

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
          markerRef.current = marker;

          fetchAddressFromCoords(defaultLat, defaultLng);

          marker.on("dragend", function () {
            const pos = marker.getLatLng();
            fetchAddressFromCoords(pos.lat, pos.lng);
          });

          map.on("click", function (e) {
            marker.setLatLng(e.latlng);
            fetchAddressFromCoords(e.latlng.lat, e.latlng.lng);
          });
        }
      });
    }
  }, [loading, missingFields]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectLocation = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
    }
    
    setSearchQuery(item.display_name);
    setFormData((prev) => ({
      ...prev,
      alamat_utama: item.display_name,
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6),
    }));
    setSuggestions([]);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
          }
          fetchAddressFromCoords(lat, lng);
        },
        () => alert("Gagal mengambil lokasi saat ini.")
      );
    } else {
      alert("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  const handleAuthError = (message = "Silakan login kembali.") => {
    setErrorMsg(message);
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const initializeFormData = (fields) => {
    setFormData((prev) => {
      const updated = { ...prev };
      fields.forEach((field) => {
        if (updated[field] === undefined) {
          updated[field] = "";
        }
      });
      return updated;
    });
  };

  const checkMissingFields = async () => {
    setErrorMsg("");
    try {
      const res = await api.post(API_CHECK_URL, {});
      const data = res.data;

      if (data?.success) {
        window.location.href = "/";
        return;
      }

      if (data?.errors && typeof data.errors === "object") {
        const fields = Object.keys(data.errors);
        setMissingFields(fields);
        initializeFormData(fields);
        return;
      }

      setErrorMsg(data.message || "Gagal memuat profil.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 422 && data?.errors) {
          const fields = Object.keys(data.errors);
          setMissingFields(fields);
          initializeFormData(fields);
          return;
        }

        if (status === 401 || status === 403) {
          handleAuthError("Sesi habis. Silakan login ulang.");
          return;
        }

        setErrorMsg(data?.message || "Terjadi kesalahan saat memeriksa profil.");
      } else {
        setErrorMsg("Terjadi kesalahan saat memeriksa profil.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("Ukuran file foto maksimal 2 MB.");
        return;
      }

      setShowPhotoMenu(false);
      setErrorMsg("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      setFormData((current) => ({
        ...current,
        avatar: file,
      }));
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setFormData((current) => ({
      ...current,
      avatar: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowPhotoMenu(false);
  };

  const startCamera = async () => {
    setShowPhotoMenu(false);
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64String = canvas.toDataURL("image/jpeg", 0.9);
      setAvatarPreview(base64String);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          
          if (file.size > 2 * 1024 * 1024) {
            setErrorMsg("Hasil foto kamera terlalu besar (maksimal 2MB).");
            return;
          }

          setFormData((current) => ({
            ...current,
            avatar: file,
          }));
        }
      }, "image/jpeg", 0.9);

      stopCamera();
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMsg("");
  setSuccessMsg("");

  if (missingFields.includes("password") && (formData.password || "").length < 6) {
    setErrorMsg("Password harus minimal 6 karakter.");
    return;
  }

  setSubmitting(true);

  try {
    // Buat payload objek biasa sesuai format cURL PUT lu
    const payload = { ...formData };

    // Jika avatar berupa File/Blob (hasil upload lokal/kamera), 
    // pastikan backend lu support base64 atau ubah logika ini jika backend butuh string URL.
    // Jika avatarPreview sudah berupa base64 (string), kita bisa kirim payload.avatar = avatarPreview
    if (avatarPreview && (payload.avatar instanceof File || payload.avatar instanceof Blob)) {
      payload.avatar = avatarPreview; // Mengirim string base64 preview ke backend
    }

    // Kirim menggunakan api.put dengan JSON (sesuai endpoint backend /api/pasien)
    await api.put(API_UPDATE_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    setSuccessMsg("Profil berhasil dilengkapi! Mengalihkan halaman...");
    
    setTimeout(() => {
      window.location.href = "/"; // atau ke halaman profil
    }, 1000);

  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 422) {
        const firstError = data?.errors 
          ? Object.values(data.errors)[0][0] 
          : data?.message;
        setErrorMsg(firstError || "Validasi gagal. Periksa kembali data Anda.");
        return;
      }

      setErrorMsg(data?.message || "Gagal melengkapi profil.");
    } else {
      setErrorMsg("Terjadi kesalahan saat menyimpan profil.");
    }
  } finally {
    setSubmitting(false);
  }
};
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-lg font-semibold text-gray-800 animate-pulse">Memeriksa kelengkapan profil...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100 my-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Lengkapi Profil</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Harap lengkapi data yang masih kosong untuk melanjutkan.</p>
        </div>
        
        {errorMsg && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-5 rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-600">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="flex flex-col items-start mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Foto Profil</label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="relative" ref={menuRef}>
              <div 
                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                className="flex items-center gap-4 cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full ring-4 ring-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm transition group-hover:opacity-90 border border-gray-200">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <FiCamera size={24} />
                        <span className="text-[9px] mt-1 font-medium">Foto</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white transition transform group-hover:scale-105">
                    <FiCamera size={12} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                    {avatarPreview ? "Ubah Foto Profil" : "Tambah Foto Profil"}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    {avatarPreview ? "Foto terpilih" : "Klik untuk opsi foto (Kamera/Galeri)"}
                  </span>
                </div>
              </div>

              {showPhotoMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 animate-fadeIn">
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoMenu(false);
                        setIsViewModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition font-medium"
                    >
                      <FiEye size={16} className="text-gray-500" />
                      Lihat foto
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    <FiCamera size={16} className="text-gray-500" />
                    Ambil foto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    <FiUpload size={16} className="text-gray-500" />
                    Unggah foto
                  </button>

                  {avatarPreview && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition font-medium"
                      >
                        <FiTrash2 size={16} className="text-red-500" />
                        Hapus foto
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {missingFields.includes("nik") && (
            <div className="text-left">
              <label className="mb-1 block text-sm font-medium text-gray-700">NIK (16 Digit)</label>
              <input
                type="text"
                name="nik"
                value={formData.nik || ""}
                onChange={handleChange}
                placeholder="Masukkan NIK KTP Anda"
                maxLength={16}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base text-left"
              />
            </div>
          )}

          <div className="text-left">
            <label className="mb-1 block text-sm font-medium text-gray-700">No.HP<span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="no_hp"
              value={formData.no_hp || ""}
              onChange={handleChange}
              placeholder="Contoh: 08xxxxxx"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base text-left"
            />
          </div>

          {missingFields.includes("password") && (
            <div className="text-left">
              <label className="mb-1 block text-sm font-medium text-gray-700">Buat Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>
          )}

          {missingFields.includes("jenis_kelamin") && (
            <div className="text-left">
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Kelamin</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin || ""}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-sm sm:text-base text-left"
              >
                <option value="" disabled>Pilih Jenis Kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          )}

          {missingFields.includes("golongan_darah") && (
            <div className="text-left">
              <label className="mb-1 block text-sm font-medium text-gray-700">Golongan Darah</label>
              <select
                name="golongan_darah"
                value={formData.golongan_darah || ""}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-sm sm:text-base text-left"
              >
                <option value="" disabled>Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="Tidak Tahu">Tidak Tahu</option>
              </select>
            </div>
          )}

          {missingFields.includes("alamat_utama") && (
            <div className="pt-2 text-left">
              <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Lengkap <span className="text-red-500">*</span></label>
              <textarea
                name="alamat_utama"
                value={formData.alamat_utama || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Masukkan alamat lengkap..."
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none text-gray-800 text-sm text-left"
              />
            </div>
          )}

          {(missingFields.includes("latitude") || missingFields.includes("longitude") || missingFields.includes("alamat_utama")) && (
            <div className="pt-2 text-left">
              <h3 className="text-xs font-bold text-blue-600 tracking-wider mb-2">TITIK GPS</h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="text-xs text-gray-600">Tentukan koordinat lokasi pelayanan Anda</span>
                
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  className="bg-gray-50 text-blue-700 border border-blue-200 px-4 py-2 sm:py-1.5 rounded-full text-xs font-medium hover:bg-blue-50 transition flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 text-blue-600 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Gunakan Lokasi Saat Ini
                </button>
              </div>

              <div className="mb-3 text-left">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cari Lokasi di Peta</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <FiSearch size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama jalan, gedung, atau kota..."
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-600 text-left"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto z-50 text-left">
                      {suggestions.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectLocation(item)}
                          className="p-2.5 text-xs hover:bg-gray-100 cursor-pointer border-b last:border-none text-gray-700"
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div ref={mapContainerRef} className="w-full h-56 sm:h-64 rounded-xl border border-gray-300 z-0 mb-3"></div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-left">
                <div>
                  <span className="text-[11px] text-gray-500 block">Latitude</span>
                  <strong className="text-xs text-gray-800 font-mono break-all">{formData.latitude || "-"}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Longitude</span>
                  <strong className="text-xs text-gray-800 font-mono break-all">{formData.longitude || "-"}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 mt-6 shadow-md text-sm sm:text-base"
          >
            {submitting ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>

      {isViewModalOpen && avatarPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-sm w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/40 p-2 rounded-full transition"
            >
              <FiX size={20} />
            </button>
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-black">
              <img src={avatarPreview} alt="Full Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col items-center relative">
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition"
            >
              <FiX size={18} />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-3">Ambil Foto Selfie</h3>

            <div className="w-full h-72 bg-black rounded-xl overflow-hidden relative flex items-center justify-center mb-4 border border-gray-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-1.5"
              >
                <FiCamera size={16} />
                Jepret Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}