import React, { useEffect, useState, useMemo } from "react";
import { 
  FaEnvelope, 
  FaEnvelopeOpen, 
  FaTrashAlt, 
  FaSearch, 
  FaCheck, 
  FaCheckCircle, 
  FaClock, 
  FaPhoneAlt, 
  FaUser, 
  FaReply, 
  FaWhatsapp, 
  FaExternalLinkAlt, 
  FaEye, 
  FaTimes, 
  FaSave, 
  FaFilter, 
  FaCogs, 
  FaSyncAlt, 
  FaPlus, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaInfoCircle,
  FaImage
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../utils/apiClient";
import Pagination from "../components/pagination";

const STORAGE_KEY_PESAN = "cms_hubungi_pesan_v2";
const STORAGE_KEY_SETTINGS = "cms_hubungi_settings_v2";

const INITIAL_PESAN = [
  {
    id: 1,
    nama: "Andi Wijaya",
    email: "andi.wijaya@gmail.com",
    no_hp: "081299998888",
    subjek: "Tanya Layanan Fisioterapi Pasca Stroke",
    pesan: "Apakah layanan fisioterapi bisa untuk pasien pasca stroke di daerah Jakarta Barat? Berapa kisaran biaya per kunjungan atau per paket bulanannya?",
    status: "belum_dibaca", // "belum_dibaca" | "sudah_dibaca" | "dibalas"
    catatan_admin: null,
    created_at: "2026-09-03T14:10:00.000000Z",
    updated_at: "2026-09-03T14:10:00.000000Z"
  },
  {
    id: 2,
    nama: "Rina Wijaya",
    email: "rina.w@yahoo.com",
    no_hp: "085712345678",
    subjek: "Jadwal Kunjungan Perawat Lansia",
    pesan: "Halo admin SmartHomeCare, apakah perawat lansia bisa bertugas untuk shift malam (12 jam) di daerah Tangerang Selatan?",
    status: "sudah_dibaca",
    catatan_admin: "Sudah dicek ketersediaan nakes perawat shift malam area Tangsel.",
    created_at: "2026-09-02T10:30:00.000000Z",
    updated_at: "2026-09-02T11:15:00.000000Z"
  },
  {
    id: 3,
    nama: "Hendra Kurniawan",
    email: "hendra.kurniawan@gmail.com",
    no_hp: "081345678901",
    subjek: "Kerjasama Layanan Homecare Klinik",
    pesan: "Kami dari Klinik Pratama Sehat ingin mendiskusikan peluang kemitraan rujukan pasien homecare. Mohon info PIC kemitraan.",
    status: "dibalas",
    catatan_admin: "Sudah dihubungi via WhatsApp oleh CS Rina pada 02/09 14:20 dan diarahkan ke bagian kemitraan.",
    created_at: "2026-09-01T16:45:00.000000Z",
    updated_at: "2026-09-02T09:00:00.000000Z"
  }
];

const INITIAL_SETTINGS = {
  hubungi_banner: "",
  hubungi_banner_text: "Hubungi Layanan Home Care",
  hubungi_heading: "Ada Pertanyaan? Kami Siap Membantu Anda",
  hubungi_description: "Silakan tinggalkan pesan atau hubungi tim customer service kami untuk informasi lebih lanjut mengenai layanan Home Care.",
  hubungi_phone: "021-12345678",
  hubungi_email: "info@homecare.com",
  hubungi_whatsapp: "6281234567890",
  hubungi_address: "Jl. Kesehatan No. 123, Jakarta Selatan",
  hubungi_maps_link: "https://maps.google.com/?q=-6.200000,106.816666",
  hubungi_jam_operasional: "Senin - Minggu: 08:00 - 20:00 WIB"
};

export default function PageHubungiKami() {
  const [activeTab, setActiveTab] = useState("inbox"); // "inbox" | "settings"
  const [pesanList, setPesanList] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "belum_dibaca" | "sudah_dibaca" | "dibalas"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedPesan, setSelectedPesan] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [catatanText, setCatatanText] = useState("");
  const [statusSelect, setStatusSelect] = useState("sudah_dibaca");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Form Tambah Pesan Manual
  const [newForm, setNewForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    subjek: "",
    pesan: "",
    status: "belum_dibaca"
  });

  // Settings Banner File
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  // Load Pesan & Settings
  const loadData = async () => {
    setLoading(true);
    let loadedPesanFromApi = false;

    // 1. Fetch Pesan from API /api/admin/hubungi-kami/pesan
    try {
      const res = await api.get("/api/admin/hubungi-kami/pesan?per_page=all");
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setPesanList(list);
        localStorage.setItem(STORAGE_KEY_PESAN, JSON.stringify(list));
        loadedPesanFromApi = true;
      }
    } catch (err) {
      console.warn("API pesan masuk offline, menggunakan fallback lokal:", err);
    }

    if (!loadedPesanFromApi) {
      const savedPesan = localStorage.getItem(STORAGE_KEY_PESAN);
      if (savedPesan) {
        try {
          setPesanList(JSON.parse(savedPesan));
        } catch {
          setPesanList(INITIAL_PESAN);
        }
      } else {
        setPesanList(INITIAL_PESAN);
        localStorage.setItem(STORAGE_KEY_PESAN, JSON.stringify(INITIAL_PESAN));
      }
    }

    // 2. Fetch Settings from API /api/admin/hubungi-kami/settings
    try {
      const resSettings = await api.get("/api/admin/hubungi-kami/settings");
      if (resSettings?.data) {
        setSettings(resSettings.data);
        if (resSettings.data.hubungi_banner) {
          setBannerPreview(resSettings.data.hubungi_banner);
        }
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(resSettings.data));
      } else {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    } catch {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch {}
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update local list helper
  const updateLocalPesanList = (newList) => {
    setPesanList(newList);
    localStorage.setItem(STORAGE_KEY_PESAN, JSON.stringify(newList));
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = pesanList.length;
    const belumDibaca = pesanList.filter((p) => p.status === "belum_dibaca").length;
    const sudahDibaca = pesanList.filter((p) => p.status === "sudah_dibaca").length;
    const dibalas = pesanList.filter((p) => p.status === "dibalas").length;
    return { total, belumDibaca, sudahDibaca, dibalas };
  }, [pesanList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return pesanList.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        (item.nama || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q) ||
        (item.no_hp || "").toLowerCase().includes(q) ||
        (item.subjek || "").toLowerCase().includes(q) ||
        (item.pesan || "").toLowerCase().includes(q);

      const matchStatus =
        filterStatus === "all" || item.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [pesanList, search, filterStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  // Buka Detail Pesan (Otomatis ubah status menjadi sudah_dibaca jika sebelumnya belum_dibaca)
  const handleOpenDetail = async (item) => {
    setSelectedPesan(item);
    setCatatanText(item.catatan_admin || "");
    setStatusSelect(item.status || "sudah_dibaca");

    if (item.status === "belum_dibaca") {
      try {
        await api.get(`/api/admin/hubungi-kami/pesan/${item.id}`);
      } catch (err) {
        console.warn("API mark read offline, update lokal tetap berjalan:", err);
      }

      const updated = pesanList.map((p) =>
        p.id === item.id ? { ...p, status: "sudah_dibaca", updated_at: new Date().toISOString() } : p
      );
      updateLocalPesanList(updated);
      setSelectedPesan((prev) => (prev ? { ...prev, status: "sudah_dibaca" } : null));
      setStatusSelect("sudah_dibaca");
    }
  };

  // Update Status & Catatan Pesan (PUT /api/admin/hubungi-kami/pesan/{id})
  const handleSaveCatatanStatus = async (e) => {
    e.preventDefault();
    if (!selectedPesan) return;

    setUpdatingStatus(true);
    const payload = {
      status: statusSelect,
      catatan_admin: catatanText.trim() ? catatanText.trim() : null
    };

    try {
      await api.put(`/api/admin/hubungi-kami/pesan/${selectedPesan.id}`, payload);
    } catch (err) {
      console.warn("API update pesan offline, update lokal tetap berjalan:", err);
    }

    const updated = pesanList.map((p) =>
      p.id === selectedPesan.id
        ? {
            ...p,
            status: statusSelect,
            catatan_admin: payload.catatan_admin,
            updated_at: new Date().toISOString()
          }
        : p
    );
    updateLocalPesanList(updated);
    setSelectedPesan((prev) => ({
      ...prev,
      status: statusSelect,
      catatan_admin: payload.catatan_admin
    }));

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Status & catatan pesan berhasil diperbarui",
      showConfirmButton: false,
      timer: 1800
    });

    setUpdatingStatus(false);
  };

  // Quick Action Balas via WhatsApp
  const handleReplyWhatsApp = (item) => {
    if (!item.no_hp) {
      Swal.fire("Nomor Tidak Tersedia", "Pengirim ini tidak mencantumkan nomor telepon / WhatsApp.", "info");
      return;
    }
    const cleanPhone = item.no_hp.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
    const defaultText = encodeURIComponent(
      `Halo Bapak/Ibu ${item.nama}, terima kasih telah menghubungi SmartHomeCare. Menindaklanjuti pesan Anda mengenai "${item.subjek || "Layanan Home Care"}", kami siap membantu...`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${defaultText}`, "_blank");
  };

  // Quick Action Balas via Email
  const handleReplyEmail = (item) => {
    if (!item.email) {
      Swal.fire("Email Tidak Tersedia", "Pengirim ini tidak mencantumkan alamat email.", "info");
      return;
    }
    const subject = encodeURIComponent(`Re: ${item.subjek || "Pesan dari SmartHomeCare"}`);
    const body = encodeURIComponent(
      `Halo Bapak/Ibu ${item.nama},\n\nTerima kasih telah menghubungi SmartHomeCare.\n\nMenindaklanjuti pesan Anda:\n"${item.pesan}"\n\n`
    );
    window.location.href = `mailto:${item.email}?subject=${subject}&body=${body}`;
  };

  // Hapus Pesan (DELETE /api/admin/hubungi-kami/pesan/{id})
  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Pesan Masuk?",
      text: `Pesan dari "${item.nama}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e5484d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/hubungi-kami/pesan/${item.id}`);
    } catch (err) {
      console.warn("API delete pesan offline, update lokal tetap berjalan:", err);
    }

    const updated = pesanList.filter((p) => p.id !== item.id);
    updateLocalPesanList(updated);

    if (selectedPesan && selectedPesan.id === item.id) {
      setSelectedPesan(null);
    }

    Swal.fire({
      icon: "success",
      title: "Pesan Terhapus",
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Tambah Pesan Manual oleh Admin
  const handleAddManualPesan = (e) => {
    e.preventDefault();
    if (!newForm.nama.trim() || !newForm.pesan.trim()) {
      Swal.fire("Data Kurang", "Nama dan isi pesan wajib diisi.", "warning");
      return;
    }

    const newItem = {
      id: Date.now(),
      nama: newForm.nama,
      email: newForm.email || "-",
      no_hp: newForm.no_hp || "-",
      subjek: newForm.subjek || "Pertanyaan via Telepon / Offline",
      pesan: newForm.pesan,
      status: newForm.status || "belum_dibaca",
      catatan_admin: "Dicatat manual oleh admin CMS.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newItem, ...pesanList];
    updateLocalPesanList(updated);

    setShowAddModal(false);
    setNewForm({
      nama: "",
      email: "",
      no_hp: "",
      subjek: "",
      pesan: "",
      status: "belum_dibaca"
    });

    Swal.fire({
      icon: "success",
      title: "Pesan Berhasil Dicatat",
      timer: 1800,
      showConfirmButton: false
    });
  };

  // Handle Banner Image File Change
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(window.URL.createObjectURL(file));
    }
  };

  // Update Settings (POST /api/admin/hubungi-kami/settings)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    const fd = new FormData();
    fd.append("hubungi_banner_text", settings.hubungi_banner_text || "");
    fd.append("hubungi_heading", settings.hubungi_heading || "");
    fd.append("hubungi_description", settings.hubungi_description || "");
    fd.append("hubungi_phone", settings.hubungi_phone || "");
    fd.append("hubungi_email", settings.hubungi_email || "");
    fd.append("hubungi_whatsapp", settings.hubungi_whatsapp || "");
    fd.append("hubungi_address", settings.hubungi_address || "");
    fd.append("hubungi_maps_link", settings.hubungi_maps_link || "");
    fd.append("hubungi_jam_operasional", settings.hubungi_jam_operasional || "");
    if (bannerFile) {
      fd.append("hubungi_banner", bannerFile);
    }

    try {
      await api.post("/api/admin/hubungi-kami/settings", fd);
    } catch (err) {
      console.warn("API settings offline, disimpan ke localStorage:", err);
    }

    const newSettingsObj = {
      ...settings,
      hubungi_banner: bannerPreview || settings.hubungi_banner
    };
    setSettings(newSettingsObj);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettingsObj));

    Swal.fire({
      icon: "success",
      title: "Pengaturan Kontak Berhasil Disimpan",
      text: "Informasi kontak, jam operasional, dan lokasi pada portal web telah diperbarui.",
      timer: 2000,
      showConfirmButton: false
    });

    setSavingSettings(false);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case "belum_dibaca":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <FaClock size={10} /> Baru (Belum Dibaca)
          </span>
        );
      case "sudah_dibaca":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <FaEnvelopeOpen size={10} /> Sudah Dibaca
          </span>
        );
      case "dibalas":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FaCheck size={10} /> Sudah Dibalas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <FaEnvelope className="text-xl" />
            </span>
            Hubungi Kami &amp; Pesan Masuk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pertanyaan, konsultasi, serta permohonan informasi dari pengunjung portal web SmartHomeCare
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <FaSyncAlt className={loading ? "animate-spin text-sky-600" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <FaPlus /> Catat Pesan Manual
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "inbox"
              ? "border-sky-600 text-sky-700 bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaEnvelope /> Kotak Masuk Pesan ({stats.total})
          {stats.belumDibaca > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
              {stats.belumDibaca} Baru
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "settings"
              ? "border-sky-600 text-sky-700 bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaCogs /> Pengaturan Kontak &amp; Halaman Web
        </button>
      </div>

      {activeTab === "inbox" ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Pesan</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FaEnvelope />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</p>
              <span className="text-[11px] text-slate-400">Seluruh pesan dari portal web</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Belum Dibaca</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <FaClock />
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">{stats.belumDibaca}</p>
              <span className="text-[11px] text-slate-400">Perlu tindak lanjut segera</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sudah Dibaca</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <FaEnvelopeOpen />
                </span>
              </div>
              <p className="text-2xl font-bold text-sky-600 mt-2">{stats.sudahDibaca}</p>
              <span className="text-[11px] text-slate-400">Telah ditinjau admin</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sudah Dibalas</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FaCheckCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.dibalas}</p>
              <span className="text-[11px] text-slate-400">Telah dihubungi via WA/Email</span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Cari pengirim, kontak, subjek, isi pesan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FaFilter className="text-[11px]" />
                <span className="hidden sm:inline">Status:</span>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">Semua Status</option>
                <option value="belum_dibaca">Belum Dibaca (Baru)</option>
                <option value="sudah_dibaca">Sudah Dibaca</option>
                <option value="dibalas">Sudah Dibalas</option>
              </select>

              {(search || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("all");
                  }}
                  className="text-xs text-rose-600 hover:underline px-1 font-medium cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Inbox */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-12">No</th>
                    <th className="p-4">Pengirim</th>
                    <th className="p-4">Kontak (Email / No. HP)</th>
                    <th className="p-4 max-w-sm">Subjek &amp; Pesan</th>
                    <th className="p-4">Waktu Kirim</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        Memuat pesan masuk...
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        Tidak ada pesan yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const isUnread = item.status === "belum_dibaca";

                      return (
                        <tr
                          key={item.id || idx}
                          onClick={() => handleOpenDetail(item)}
                          className={`transition cursor-pointer ${
                            isUnread
                              ? "bg-amber-50/40 font-semibold hover:bg-amber-50/70"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="p-4 text-slate-400 font-medium">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isUnread
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {item.nama ? item.nama.charAt(0).toUpperCase() : <FaUser />}
                              </div>
                              <div>
                                <p className="text-slate-800 font-bold">{item.nama}</p>
                                {item.catatan_admin && (
                                  <span className="text-[10px] text-emerald-600 font-normal">
                                    ✓ Ada Catatan
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-600">
                            <p className="font-normal">{item.email}</p>
                            {item.no_hp && (
                              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <FaPhoneAlt className="text-[9px]" /> {item.no_hp}
                              </p>
                            )}
                          </td>

                          <td className="p-4 max-w-sm">
                            <p className="text-slate-800 font-bold truncate">
                              {item.subjek || "Tanpa Subjek"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {item.pesan}
                            </p>
                          </td>

                          <td className="p-4 text-slate-400 whitespace-nowrap font-normal">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="p-4 text-center">
                            {renderStatusBadge(item.status)}
                          </td>

                          <td
                            className="p-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {item.no_hp && (
                                <button
                                  onClick={() => handleReplyWhatsApp(item)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                  title="Balas via WhatsApp"
                                >
                                  <FaWhatsapp size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDetail(item)}
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                                title="Buka Detail Pesan"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Pesan"
                              >
                                <FaTrashAlt size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Pengaturan Kontak & Halaman Web */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaCogs className="text-sky-600" /> Informasi Kontak &amp; Halaman Hubungi Kami
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Data ini ditampilkan pada halaman "Hubungi Kami", footer, serta kanal bantuan resmi bagi pasien di portal web.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Banner Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Header Banner Halaman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teks Judul Banner (hubungi_banner_text)
                  </label>
                  <input
                    type="text"
                    value={settings.hubungi_banner_text || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, hubungi_banner_text: e.target.value })
                    }
                    placeholder="Contoh: Hubungi Layanan Home Care"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Upload Banner Image (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 text-xs text-slate-600 transition">
                      <FaImage /> Pilih Gambar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                    {bannerPreview && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        ✓ Gambar Terpilih
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Heading Pengantar (hubungi_heading) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.hubungi_heading || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_heading: e.target.value })}
                  placeholder="Contoh: Ada Pertanyaan? Kami Siap Membantu Anda"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deskripsi Pengantar (hubungi_description)
                </label>
                <textarea
                  rows={2}
                  value={settings.hubungi_description || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hubungi_description: e.target.value })
                  }
                  placeholder="Tuliskan petunjuk bagi pengunjung website..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Kontak Resmi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor Telepon Kantor (hubungi_phone)
                </label>
                <input
                  type="text"
                  value={settings.hubungi_phone || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_phone: e.target.value })}
                  placeholder="021-12345678"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  WhatsApp Hotline (hubungi_whatsapp) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.hubungi_whatsapp || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_whatsapp: e.target.value })}
                  placeholder="6281234567890"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Resmi (hubungi_email) *
                </label>
                <input
                  type="email"
                  required
                  value={settings.hubungi_email || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_email: e.target.value })}
                  placeholder="info@homecare.com"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Alamat & Jam Operasional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Jam Operasional Layanan (hubungi_jam_operasional)
                </label>
                <input
                  type="text"
                  value={settings.hubungi_jam_operasional || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hubungi_jam_operasional: e.target.value })
                  }
                  placeholder="Senin - Minggu: 08:00 - 20:00 WIB"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Link Google Maps (hubungi_maps_link)
                </label>
                <input
                  type="url"
                  value={settings.hubungi_maps_link || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_maps_link: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Alamat Lengkap Kantor (hubungi_address)
              </label>
              <textarea
                rows={2}
                value={settings.hubungi_address || ""}
                onChange={(e) => setSettings({ ...settings, hubungi_address: e.target.value })}
                placeholder="Jl. Kesehatan Medis No. 123, Jakarta Selatan"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <FaSave /> {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Kontak"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DETAIL PESAN & CATATAN ADMIN */}
      {selectedPesan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FaEnvelope className="text-sky-600" /> Detail Pesan Masuk
              </h3>
              <button
                onClick={() => setSelectedPesan(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Info Pengirim */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Pengirim:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedPesan.nama}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Kirim:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {formatDate(selectedPesan.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Alamat Email:</span>
                  <p className="font-medium text-slate-700">{selectedPesan.email}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">No. WhatsApp / HP:</span>
                  <p className="font-medium text-slate-700">{selectedPesan.no_hp || "-"}</p>
                </div>
              </div>
            </div>

            {/* Subjek & Isi Pesan */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-semibold text-slate-500">Subjek:</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedPesan.subjek || "(Tanpa Subjek)"}
                </h4>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500">Isi Pesan:</span>
                <div className="mt-1 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedPesan.pesan}
                </div>
              </div>
            </div>

            {/* Form Respon / Catatan Admin & Ubah Status */}
            <form onSubmit={handleSaveCatatanStatus} className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FaReply className="text-sky-600" /> Respon &amp; Catatan Admin
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Tindak Lanjut:
                  </label>
                  <select
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="belum_dibaca">Belum Dibaca</option>
                    <option value="sudah_dibaca">Sudah Dibaca</option>
                    <option value="dibalas">Sudah Dibalas</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? "Menyimpan..." : "Update Status & Catatan"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Catatan Internal Admin (catatan_admin):
                </label>
                <textarea
                  rows={2}
                  value={catatanText}
                  onChange={(e) => setCatatanText(e.target.value)}
                  placeholder="Contoh: Sudah dihubungi via WhatsApp oleh CS Rina pada 03/09 14:20..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedPesan.no_hp && (
                  <button
                    type="button"
                    onClick={() => handleReplyWhatsApp(selectedPesan)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <FaWhatsapp /> Balas via WA
                  </button>
                )}
                {selectedPesan.email && (
                  <button
                    type="button"
                    onClick={() => handleReplyEmail(selectedPesan)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <FaEnvelope /> Balas Email
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedPesan(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATAT PESAN MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FaPlus className="text-sky-600" /> Catat Pesan / Kontak Masuk Manual
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddManualPesan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengirim *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penanya"
                    value={newForm.nama}
                    onChange={(e) => setNewForm({ ...newForm, nama: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="081234..."
                    value={newForm.no_hp}
                    onChange={(e) => setNewForm({ ...newForm, no_hp: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Awal
                  </label>
                  <select
                    value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="belum_dibaca">Belum Dibaca</option>
                    <option value="sudah_dibaca">Sudah Dibaca</option>
                    <option value="dibalas">Sudah Dibalas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subjek Pertanyaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Konsultasi Layanan Perawat Stroke"
                  value={newForm.subjek}
                  onChange={(e) => setNewForm({ ...newForm, subjek: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pesan / Pertanyaan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan isi pesan atau poin konsultasi..."
                  value={newForm.pesan}
                  onChange={(e) => setNewForm({ ...newForm, pesan: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
