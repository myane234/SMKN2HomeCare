import React, { useEffect, useState, useMemo } from "react";
import { 
  FaStar, 
  FaRegStar, 
  FaTrashAlt, 
  FaEdit, 
  FaPlus, 
  FaSearch, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUser, 
  FaQuoteLeft,
  FaImage,
  FaHeading,
  FaRegComments,
  FaEye,
  FaTimes,
  FaSave,
  FaFilter,
  FaSyncAlt
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../utils/apiClient";
import Pagination from "../components/pagination";
import { getAllLayanan } from "../data/layananData";

const STORAGE_KEY_ULASAN = "cms_ulasan_data_v2";
const STORAGE_KEY_HEADER = "cms_ulasan_header_v2";

const INITIAL_ULASAN = [
  {
    id: 1,
    nama_pengulas: "Budi Santoso",
    profesi_peran: "Keluarga Pasien",
    foto: null,
    foto_url: null,
    rating: 5,
    komentar: "Pelayanan perawat sangat ramah dan profesional. Perawat datang tepat waktu dan telaten merawat ibu saya.",
    layanan_id: 2,
    is_published: true,
    urutan: 1,
    created_at: "2026-09-03T14:00:00.000000Z",
    updated_at: "2026-09-03T14:00:00.000000Z",
    layanan: {
      id_master_layanan: 2,
      nama_layanan: "Fisioterapi Rumah"
    }
  },
  {
    id: 2,
    nama_pengulas: "Siti Rahma",
    profesi_peran: "Pasien Lansia",
    foto: null,
    foto_url: null,
    rating: 5,
    komentar: "Pelayanan sangat memuaskan, perawat datang tepat waktu dan sangat teliti dalam memeriksa tensi serta obat.",
    layanan_id: 1,
    is_published: false,
    urutan: 2,
    created_at: "2026-09-03T14:05:00.000000Z",
    updated_at: "2026-09-03T14:05:00.000000Z",
    layanan: {
      id_master_layanan: 1,
      nama_layanan: "Perawat Medis Lansia"
    }
  },
  {
    id: 3,
    nama_pengulas: "Dewi Lestari",
    profesi_peran: "Ibu Pasca Melahirkan",
    foto: null,
    foto_url: null,
    rating: 4,
    komentar: "Bidan sangat sabar membimbing proses menyusui dan merawat tali pusat bayi. Sangat recommended!",
    layanan_id: 3,
    is_published: true,
    urutan: 3,
    created_at: "2026-09-02T09:30:00.000000Z",
    updated_at: "2026-09-02T09:30:00.000000Z",
    layanan: {
      id_master_layanan: 3,
      nama_layanan: "Perawatan Ibu & Bayi"
    }
  }
];

const INITIAL_HEADER = {
  ulasan_heading: "Apa Kata Mereka tentang Kami",
  ulasan_subheading: "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami."
};

export default function PageUlasan() {
  const [activeTab, setActiveTab] = useState("ulasan"); // "ulasan" | "header"
  const [ulasanList, setUlasanList] = useState([]);
  const [layananOptions, setLayananOptions] = useState([]);
  const [headerContent, setHeaderContent] = useState(INITIAL_HEADER);
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "published" | "draft"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [selectedUlasan, setSelectedUlasan] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    nama_pengulas: "",
    profesi_peran: "",
    rating: 5,
    komentar: "",
    layanan_id: "",
    is_published: true,
    urutan: 1,
    foto: null,
    foto_preview: "",
    remove_foto: false
  });

  // Load Layanan options
  useEffect(() => {
    async function fetchLayanan() {
      try {
        const data = await getAllLayanan();
        if (Array.isArray(data) && data.length > 0) {
          setLayananOptions(data);
        }
      } catch (err) {
        console.warn("Gagal memuat daftar layanan untuk ulasan:", err);
      }
    }
    fetchLayanan();
  }, []);

  // Load Data Ulasan
  const loadUlasanData = async () => {
    setLoading(true);
    let loadedFromApi = false;

    // Coba ambil dari API backend /api/admin/ulasan
    try {
      const res = await api.get("/api/admin/ulasan?per_page=all");
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setUlasanList(list);
        localStorage.setItem(STORAGE_KEY_ULASAN, JSON.stringify(list));
        loadedFromApi = true;
      }
    } catch (err) {
      console.warn("API /api/admin/ulasan belum tersedia atau offline, menggunakan local fallback:", err);
    }

    // Jika API belum ada, gunakan localStorage atau INITIAL_ULASAN
    if (!loadedFromApi) {
      const saved = localStorage.getItem(STORAGE_KEY_ULASAN);
      if (saved) {
        try {
          setUlasanList(JSON.parse(saved));
        } catch {
          setUlasanList(INITIAL_ULASAN);
        }
      } else {
        setUlasanList(INITIAL_ULASAN);
        localStorage.setItem(STORAGE_KEY_ULASAN, JSON.stringify(INITIAL_ULASAN));
      }
    }

    // Load Header Content
    try {
      const headerRes = await api.get("/api/resource/content/ulasan");
      if (headerRes?.ulasan_heading) {
        setHeaderContent({
          ulasan_heading: headerRes.ulasan_heading,
          ulasan_subheading: headerRes.ulasan_subheading || ""
        });
      } else {
        const savedHeader = localStorage.getItem(STORAGE_KEY_HEADER);
        if (savedHeader) setHeaderContent(JSON.parse(savedHeader));
      }
    } catch {
      const savedHeader = localStorage.getItem(STORAGE_KEY_HEADER);
      if (savedHeader) {
        try {
          setHeaderContent(JSON.parse(savedHeader));
        } catch {}
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUlasanData();
  }, []);

  // Update local storage sync
  const updateLocalList = (newList) => {
    setUlasanList(newList);
    localStorage.setItem(STORAGE_KEY_ULASAN, JSON.stringify(newList));
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRating, filterStatus]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = ulasanList.length;
    const published = ulasanList.filter((u) => Boolean(u.is_published)).length;
    const draft = total - published;
    const avgRating = total > 0 
      ? (ulasanList.reduce((acc, curr) => acc + Number(curr.rating || 5), 0) / total).toFixed(1)
      : "5.0";
    const fiveStar = ulasanList.filter((u) => Number(u.rating) === 5).length;
    return { total, published, draft, avgRating, fiveStar };
  }, [ulasanList]);

  // Filtered List
  const filteredUlasan = useMemo(() => {
    return ulasanList.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        (item.nama_pengulas || "").toLowerCase().includes(q) ||
        (item.profesi_peran || "").toLowerCase().includes(q) ||
        (item.komentar || "").toLowerCase().includes(q) ||
        (item.layanan?.nama_layanan || "").toLowerCase().includes(q);

      const matchRating =
        filterRating === "all" || String(item.rating) === String(filterRating);

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && Boolean(item.is_published)) ||
        (filterStatus === "draft" && !Boolean(item.is_published));

      return matchSearch && matchRating && matchStatus;
    });
  }, [ulasanList, search, filterRating, filterStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredUlasan.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUlasan.slice(start, start + itemsPerPage);
  }, [filteredUlasan, currentPage, itemsPerPage]);

  // Handle Quick Toggle Publish
  const handleTogglePublish = async (item) => {
    const newStatus = !item.is_published;
    const actionText = newStatus ? "mempublikasikan" : "menyembunyikan";

    const result = await Swal.fire({
      title: `Ubah Status Publikasi?`,
      text: `Apakah Anda ingin ${actionText} ulasan dari "${item.nama_pengulas}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1f9d5a",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Ubah",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/api/admin/ulasan/${item.id}/toggle-publish`);
    } catch (err) {
      console.warn("API toggle publish offline, update lokal tetap berjalan:", err);
    }

    const updated = ulasanList.map((u) =>
      u.id === item.id ? { ...u, is_published: newStatus, updated_at: new Date().toISOString() } : u
    );
    updateLocalList(updated);

    if (detailModalItem && detailModalItem.id === item.id) {
      setDetailModalItem((prev) => ({ ...prev, is_published: newStatus }));
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: newStatus ? "Ulasan berhasil dipublikasikan!" : "Ulasan disembunyikan (draft)",
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Open Form Modal (Create or Edit)
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedUlasan(null);
    setFormData({
      id: null,
      nama_pengulas: "",
      profesi_peran: "Pasien",
      rating: 5,
      komentar: "",
      layanan_id: layananOptions[0]?.id_layanan || "",
      is_published: true,
      urutan: ulasanList.length + 1,
      foto: null,
      foto_preview: "",
      remove_foto: false
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setSelectedUlasan(item);
    setFormData({
      id: item.id,
      nama_pengulas: item.nama_pengulas || "",
      profesi_peran: item.profesi_peran || "",
      rating: Number(item.rating) || 5,
      komentar: item.komentar || "",
      layanan_id: item.layanan_id || item.layanan?.id_master_layanan || "",
      is_published: Boolean(item.is_published),
      urutan: item.urutan || 1,
      foto: null,
      foto_preview: item.foto_url || item.foto || "",
      remove_foto: false
    });
    setShowFormModal(true);
  };

  // Handle Photo File Change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        Swal.fire("Format Salah", "Pilih file gambar yang valid (JPG, PNG, WEBP)", "warning");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        foto: file,
        foto_preview: window.URL.createObjectURL(file),
        remove_foto: false
      }));
    }
  };

  // Handle Save Form (Create & Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.nama_pengulas.trim() || !formData.komentar.trim()) {
      Swal.fire("Data Kurang Lengkap", "Nama pengulas dan ulasan komentar wajib diisi!", "warning");
      return;
    }

    setSubmitting(true);

    const selectedLayananObj = layananOptions.find(
      (l) => String(l.id_layanan) === String(formData.layanan_id)
    );

    const layananData = selectedLayananObj
      ? {
          id_master_layanan: selectedLayananObj.id_layanan,
          nama_layanan: selectedLayananObj.nama_layanan || selectedLayananObj.nama
        }
      : formData.layanan_id
      ? { id_master_layanan: formData.layanan_id, nama_layanan: "Layanan Home Care" }
      : null;

    // Prepare FormData for API
    const postPayload = new FormData();
    postPayload.append("nama_pengulas", formData.nama_pengulas);
    postPayload.append("profesi_peran", formData.profesi_peran || "");
    postPayload.append("rating", formData.rating);
    postPayload.append("komentar", formData.komentar);
    if (formData.layanan_id) postPayload.append("layanan_id", formData.layanan_id);
    postPayload.append("is_published", formData.is_published ? "true" : "false");
    postPayload.append("urutan", formData.urutan || 1);
    if (formData.foto) {
      postPayload.append("foto", formData.foto);
    }
    if (formData.remove_foto) {
      postPayload.append("remove_foto", "true");
    }

    try {
      if (modalMode === "create") {
        let apiResult = null;
        try {
          apiResult = await api.post("/api/admin/ulasan", postPayload);
        } catch (apiErr) {
          console.warn("Gagal simpan ke API, menggunakan penyimpanan lokal:", apiErr);
        }

        const newId = apiResult?.data?.id || Date.now();
        const createdItem = {
          id: newId,
          nama_pengulas: formData.nama_pengulas,
          profesi_peran: formData.profesi_peran || "Pasien",
          foto: formData.foto ? formData.foto.name : null,
          foto_url: formData.foto_preview || null,
          rating: Number(formData.rating),
          komentar: formData.komentar,
          layanan_id: formData.layanan_id ? Number(formData.layanan_id) : null,
          is_published: Boolean(formData.is_published),
          urutan: Number(formData.urutan) || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          layanan: layananData
        };

        const updated = [createdItem, ...ulasanList];
        updateLocalList(updated);

        Swal.fire({
          icon: "success",
          title: "Ulasan Berhasil Ditambahkan",
          text: "Ulasan baru telah tersimpan dalam sistem.",
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        // Edit Mode
        try {
          await api.post(`/api/admin/ulasan/${formData.id}`, postPayload);
        } catch (apiErr) {
          console.warn("Gagal update ke API, menggunakan penyimpanan lokal:", apiErr);
        }

        const updated = ulasanList.map((u) => {
          if (u.id === formData.id) {
            return {
              ...u,
              nama_pengulas: formData.nama_pengulas,
              profesi_peran: formData.profesi_peran,
              rating: Number(formData.rating),
              komentar: formData.komentar,
              layanan_id: formData.layanan_id ? Number(formData.layanan_id) : null,
              is_published: Boolean(formData.is_published),
              urutan: Number(formData.urutan) || u.urutan,
              foto_url: formData.remove_foto ? null : (formData.foto_preview || u.foto_url),
              updated_at: new Date().toISOString(),
              layanan: layananData || u.layanan
            };
          }
          return u;
        });

        updateLocalList(updated);

        Swal.fire({
          icon: "success",
          title: "Ulasan Berhasil Diperbarui",
          timer: 1800,
          showConfirmButton: false
        });
      }

      setShowFormModal(false);
    } catch (err) {
      Swal.fire("Gagal", err.message || "Terjadi kesalahan saat menyimpan ulasan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Ulasan
  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Ulasan Ini?",
      text: `Ulasan dari "${item.nama_pengulas}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e5484d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/ulasan/${item.id}`);
    } catch (err) {
      console.warn("API delete ulasan offline, update lokal tetap berjalan:", err);
    }

    const updated = ulasanList.filter((u) => u.id !== item.id);
    updateLocalList(updated);

    if (detailModalItem && detailModalItem.id === item.id) {
      setDetailModalItem(null);
    }

    Swal.fire({
      icon: "success",
      title: "Terhapus",
      text: "Ulasan berhasil dihapus.",
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Save Header Content
  const handleSaveHeader = async (e) => {
    e.preventDefault();
    setSavingHeader(true);
    try {
      await api.post("/api/resource/content/ulasan/header", headerContent);
    } catch (err) {
      console.warn("API header offline, disimpan di localStorage:", err);
    }

    localStorage.setItem(STORAGE_KEY_HEADER, JSON.stringify(headerContent));

    Swal.fire({
      icon: "success",
      title: "Header Berhasil Disimpan",
      text: "Judul dan deskripsi section ulasan pada portal web berhasil diperbarui.",
      timer: 2000,
      showConfirmButton: false
    });
    setSavingHeader(false);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FaStar className="text-xl" />
            </span>
            Kelola Ulasan Pasien
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Moderasi, publikasikan, dan kelola testimoni kepuasan pasien SmartHomeCare
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUlasanData}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <FaSyncAlt className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <FaPlus /> Tambah Ulasan Manual
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ulasan")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "ulasan"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaRegComments /> Daftar Ulasan Pasien ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("header")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "header"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaHeading /> Pengaturan Header Portal Web
        </button>
      </div>

      {activeTab === "ulasan" ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Ulasan</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FaRegComments />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</p>
              <span className="text-[11px] text-slate-400">Seluruh testimoni masuk</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Rata-rata Rating</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-500">
                  <FaStar />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-slate-800">{stats.avgRating}</p>
                <span className="text-xs font-semibold text-amber-500">/ 5.0</span>
              </div>
              <span className="text-[11px] text-slate-400">{stats.fiveStar} ulasan bintang 5</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tayang di Web</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FaCheckCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.published}</p>
              <span className="text-[11px] text-slate-400">Aktif & dipublikasikan</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending / Draft</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-500">
                  <FaTimesCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-700 mt-2">{stats.draft}</p>
              <span className="text-[11px] text-slate-400">Menunggu moderasi admin</span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Cari pengulas, komentar, atau layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FaFilter className="text-[11px]" />
                <span className="hidden sm:inline">Filter:</span>
              </div>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="published">Tayang (Aktif)</option>
                <option value="draft">Pending (Nonaktif)</option>
              </select>

              {/* Filter Rating */}
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Rating</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
                <option value="3">⭐⭐⭐ (3 Bintang)</option>
                <option value="2">⭐⭐ (2 Bintang)</option>
                <option value="1">⭐ (1 Bintang)</option>
              </select>

              {(search || filterRating !== "all" || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterRating("all");
                    setFilterStatus("all");
                  }}
                  className="text-xs text-rose-600 hover:underline px-1 font-medium cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-12">No</th>
                    <th className="p-4">Pengulas &amp; Peran</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4 max-w-xs">Komentar Pasien</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4 text-center">Status Publikasi</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        Memuat data ulasan...
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        Tidak ada ulasan yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const isPublished = Boolean(item.is_published);
                      const ratingNum = Number(item.rating) || 5;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 text-slate-400 font-medium">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {item.foto_url ? (
                                <img
                                  src={item.foto_url}
                                  alt={item.nama_pengulas}
                                  className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  {item.nama_pengulas ? item.nama_pengulas.charAt(0).toUpperCase() : <FaUser />}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800">{item.nama_pengulas}</p>
                                <span className="text-[11px] text-slate-400">
                                  {item.profesi_peran || "Pasien"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium max-w-[160px] truncate">
                              {item.layanan?.nama_layanan || item.layanan_nama || "Layanan Umum"}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  key={star}
                                  className={`text-[12px] ${
                                    star <= ratingNum ? "text-amber-400" : "text-slate-200"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-slate-700 font-bold">{ratingNum}.0</span>
                            </div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <p className="line-clamp-2 text-slate-600 italic">
                              "{item.komentar}"
                            </p>
                          </td>

                          <td className="p-4 text-slate-400 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(item)}
                              title={isPublished ? "Klik untuk nonaktifkan ulasan" : "Klik untuk tayangkan ulasan"}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                                isPublished
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {isPublished ? <FaCheckCircle /> : <FaTimesCircle />}
                              {isPublished ? "Tayang" : "Pending"}
                            </button>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setDetailModalItem(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                title="Lihat Detail Ulasan"
                              >
                                <FaEye size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                title="Edit Ulasan"
                              >
                                <FaEdit size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Ulasan"
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
        /* Tab 2: Header Section Web */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-2xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaHeading className="text-emerald-600" /> Header Section Ulasan di Portal Web
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur judul utama dan deskripsi pengantar pada bagian testimoni ulasan di halaman portal pengunjung.
            </p>
          </div>

          <form onSubmit={handleSaveHeader} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Utama Section (ulasan_heading) *
              </label>
              <input
                type="text"
                required
                value={headerContent.ulasan_heading}
                onChange={(e) =>
                  setHeaderContent({ ...headerContent, ulasan_heading: e.target.value })
                }
                placeholder="Contoh: Apa Kata Mereka tentang Kami"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Sub-judul (ulasan_subheading)
              </label>
              <textarea
                rows={3}
                value={headerContent.ulasan_subheading}
                onChange={(e) =>
                  setHeaderContent({ ...headerContent, ulasan_subheading: e.target.value })
                }
                placeholder="Tuliskan sub-judul penjelasan..."
                className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Preview Tampilan di Portal:
              </span>
              <h3 className="text-base font-bold text-slate-900">{headerContent.ulasan_heading}</h3>
              <p className="text-xs text-slate-600">{headerContent.ulasan_subheading}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingHeader}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <FaSave /> {savingHeader ? "Menyimpan..." : "Simpan Header Section"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT ULASAN */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FaStar className="text-amber-400" />
                {modalMode === "create" ? "Tambah Ulasan Manual (Admin)" : "Edit Data Ulasan"}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengulas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.nama_pengulas}
                    onChange={(e) => setFormData({ ...formData, nama_pengulas: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profesi / Peran Pasien
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pasien Mandiri, Keluarga Pasien"
                    value={formData.profesi_peran}
                    onChange={(e) => setFormData({ ...formData, profesi_peran: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Layanan Terkait
                  </label>
                  <select
                    value={formData.layanan_id}
                    onChange={(e) => setFormData({ ...formData, layanan_id: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Layanan Umum / Home Care --</option>
                    {layananOptions.map((l) => (
                      <option key={l.id_layanan} value={l.id_layanan}>
                        {l.nama_layanan || l.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rating Kepuasan (1-5) *
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="cursor-pointer focus:outline-none transition transform hover:scale-110"
                      >
                        {star <= formData.rating ? (
                          <FaStar className="text-amber-400 text-lg" />
                        ) : (
                          <FaRegStar className="text-slate-300 text-lg hover:text-amber-300" />
                        )}
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-700">
                      {formData.rating} dari 5 Bintang
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Komentar / Isi Testimoni *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan isi ulasan kepuasan pelayanan..."
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urutan Prioritas Tampil
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Publikasikan Sekarang (Tayang di Web)
                    </span>
                  </label>
                </div>
              </div>

              {/* Foto Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Pengulas (Opsional)
                </label>
                <div className="flex items-center gap-4">
                  {formData.foto_preview && !formData.remove_foto ? (
                    <div className="relative">
                      <img
                        src={formData.foto_preview}
                        alt="Preview"
                        className="h-14 w-14 rounded-full object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            foto: null,
                            foto_preview: "",
                            remove_foto: true
                          })
                        }
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 text-[10px] cursor-pointer"
                        title="Hapus Foto"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-14 w-28 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                      <FaImage className="text-slate-400 text-sm" />
                      <span className="text-[10px] text-slate-500 mt-0.5">Pilih Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <span className="text-[11px] text-slate-400">
                    Format: JPG, PNG, WEBP. Maks 2MB.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : modalMode === "create" ? "Simpan Ulasan" : "Update Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL ULASAN */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FaEye className="text-emerald-600" /> Detail Ulasan Pasien
              </h3>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                {detailModalItem.foto_url ? (
                  <img
                    src={detailModalItem.foto_url}
                    alt={detailModalItem.nama_pengulas}
                    className="h-14 w-14 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                    {detailModalItem.nama_pengulas?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{detailModalItem.nama_pengulas}</h4>
                  <p className="text-xs text-slate-500">{detailModalItem.profesi_peran || "Pasien"}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    {detailModalItem.layanan?.nama_layanan || "Layanan Home Care"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Rating:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={`text-xs ${
                          s <= detailModalItem.rating ? "text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="font-bold text-slate-700 ml-1">
                      {detailModalItem.rating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Status Tampil:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                      detailModalItem.is_published
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {detailModalItem.is_published ? "Tayang di Web" : "Pending Moderasi"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal:</span>
                  <span className="font-medium text-slate-700">
                    {formatDate(detailModalItem.created_at)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Isi Ulasan / Testimoni:
                </span>
                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/60 text-slate-700 text-xs leading-relaxed italic relative">
                  <FaQuoteLeft className="text-emerald-200 absolute top-2 right-2 text-xl pointer-events-none" />
                  "{detailModalItem.komentar}"
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleTogglePublish(detailModalItem);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  detailModalItem.is_published
                    ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {detailModalItem.is_published ? "Sembunyikan dari Web" : "Publikasikan Sekarang"}
              </button>

              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
