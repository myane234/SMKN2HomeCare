import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHeading,
  FaSave,
  FaFilter,
  FaRegStar
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../utils/apiClient";
import Pagination from "../components/pagination";
import { getAllLayanan } from "../data/layananData";

export default function PageUlasan() {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'header'
  const [ulasanList, setUlasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layananOptions, setLayananOptions] = useState([]);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Header Settings State
  const [headerSettings, setHeaderSettings] = useState({
    ulasan_heading: "Apa Kata Mereka tentang Kami",
    ulasan_subheading: "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami."
  });
  const [savingHeader, setSavingHeader] = useState(false);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_pengulas: "",
    profesi_peran: "",
    rating: 5,
    komentar: "",
    layanan_id: "",
    is_published: true,
    urutan: 1,
    foto: null
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil daftar ulasan dari API
      const res = await api.get("/api/admin/ulasan?per_page=all");
      const list = res?.data?.data || res?.data || [];
      setUlasanList(Array.isArray(list) ? list : []);

      // Ambil data header portal dari API
      try {
        const resHeader = await api.get("/api/resource/content/ulasan");
        if (resHeader?.ulasan_heading) {
          setHeaderSettings({
            ulasan_heading: resHeader.ulasan_heading,
            ulasan_subheading: resHeader.ulasan_subheading || ""
          });
        }
      } catch {}

      // Ambil daftar layanan untuk dropdown
      try {
        const layanans = await getAllLayanan();
        setLayananOptions(Array.isArray(layanans) ? layanans : []);
      } catch {}
    } catch (err) {
      console.error("Gagal memuat data ulasan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Data
  const filteredList = ulasanList.filter((item) => {
    const q = search.toLowerCase();
    const nama = (item.nama_pengulas || "").toLowerCase();
    const profesi = (item.profesi_peran || "").toLowerCase();
    const komentar = (item.komentar || "").toLowerCase();
    const matchesSearch = !q || nama.includes(q) || profesi.includes(q) || komentar.includes(q);

    const matchesRating = ratingFilter === "all" || Number(item.rating) === Number(ratingFilter);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && item.is_published) ||
      (statusFilter === "pending" && !item.is_published);

    return matchesSearch && matchesRating && matchesStatus;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const totalUlasan = ulasanList.length;
  const publishedCount = ulasanList.filter((u) => u.is_published).length;
  const pendingCount = totalUlasan - publishedCount;
  const averageRating =
    totalUlasan > 0
      ? (ulasanList.reduce((sum, u) => sum + (Number(u.rating) || 0), 0) / totalUlasan).toFixed(1)
      : "0.0";

  // Toggle Publish Status
  const handleTogglePublish = async (item) => {
    try {
      const res = await api.patch(`/api/admin/ulasan/${item.id}/toggle-publish`);
      const newStatus = res?.data?.is_published ?? !item.is_published;

      setUlasanList((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, is_published: newStatus } : u))
      );

      Swal.fire({
        icon: "success",
        title: newStatus ? "Ulasan Ditayangkan" : "Ulasan Disembunyikan",
        text: newStatus
          ? "Ulasan sekarang tayang di portal web."
          : "Ulasan disimpan sebagai draft / pending.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengubah Status",
        text: err.message || "Terjadi kesalahan saat mengubah status tayang."
      });
    }
  };

  // Submit Add Ulasan
  const handleCreateUlasan = async (e) => {
    e.preventDefault();
    if (!formData.nama_pengulas.trim() || !formData.komentar.trim()) {
      Swal.fire("Peringatan", "Nama pengulas dan komentar wajib diisi!", "warning");
      return;
    }

    try {
      const payload = {
        ...formData,
        rating: Number(formData.rating)
      };

      const res = await api.post("/api/admin/ulasan", payload);
      const created = res?.data || payload;

      setUlasanList((prev) => [created, ...prev]);
      setShowAddModal(false);
      resetForm();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Ulasan berhasil ditambahkan oleh admin.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal menambahkan ulasan", "error");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nama_pengulas: item.nama_pengulas || "",
      profesi_peran: item.profesi_peran || "",
      rating: Number(item.rating) || 5,
      komentar: item.komentar || "",
      layanan_id: item.layanan_id || "",
      is_published: Boolean(item.is_published),
      urutan: item.urutan || 1,
      foto: null
    });
    setShowEditModal(true);
  };

  // Submit Edit Ulasan
  const handleUpdateUlasan = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const payload = {
        ...formData,
        rating: Number(formData.rating)
      };

      const res = await api.post(`/api/admin/ulasan/${selectedItem.id}`, payload);
      const updated = res?.data || { ...selectedItem, ...payload };

      setUlasanList((prev) =>
        prev.map((u) => (u.id === selectedItem.id ? { ...u, ...updated } : u))
      );
      setShowEditModal(false);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data ulasan berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal memperbarui ulasan", "error");
    }
  };

  // Delete Ulasan
  const handleDeleteUlasan = async (item) => {
    const confirm = await Swal.fire({
      title: "Hapus Ulasan?",
      text: `Ulasan dari "${item.nama_pengulas}" akan dihapus permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/api/admin/ulasan/${item.id}`);
        setUlasanList((prev) => prev.filter((u) => u.id !== item.id));

        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Ulasan berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire("Gagal", err.message || "Gagal menghapus ulasan", "error");
      }
    }
  };

  // Save Header Settings
  const handleSaveHeader = async (e) => {
    e.preventDefault();
    setSavingHeader(true);
    try {
      await api.post("/api/resource/content/ulasan/header", headerSettings);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Header section ulasan di portal web berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal memperbarui header ulasan", "error");
    } finally {
      setSavingHeader(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_pengulas: "",
      profesi_peran: "",
      rating: 5,
      komentar: "",
      layanan_id: "",
      is_published: true,
      urutan: 1,
      foto: null
    });
    setSelectedItem(null);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`text-xs ${i <= rating ? "text-amber-400" : "text-slate-200"}`}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-500">
              <FaStar className="text-xl" />
            </span>
            Kelola Ulasan Pasien & Testimoni
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola ulasan dari pasien, moderasi tayangan di web, serta atur header section testimoni
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <FaSyncAlt className={loading ? "animate-spin text-amber-500" : ""} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <FaPlus /> Tambah Ulasan Manual
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "list"
              ? "border-primary text-primary-dark bg-primary-light/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaStar /> Daftar Ulasan Pasien ({totalUlasan})
        </button>
        <button
          onClick={() => setActiveTab("header")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "header"
              ? "border-primary text-primary-dark bg-primary-light/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaHeading /> Pengaturan Header Portal Web
        </button>
      </div>

      {activeTab === "list" ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Ulasan</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FaStar />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{totalUlasan}</p>
              <span className="text-[11px] text-slate-400">Akumulasi ulasan sistem</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Rata-Rata Rating</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-500">
                  <FaStar />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <p className="text-2xl font-bold text-amber-500">{averageRating}</p>
                <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
              </div>
              <span className="text-[11px] text-slate-400">Kepuasan pelanggan</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tayang di Web</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FaCheckCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{publishedCount}</p>
              <span className="text-[11px] text-slate-400">Terbuka untuk publik</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Moderasi</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-500">
                  <FaTimesCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-rose-500 mt-2">{pendingCount}</p>
              <span className="text-[11px] text-slate-400">Menunggu persetujuan</span>
            </div>
          </div>

          {/* Filters & Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari nama, profesi, komentar..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={ratingFilter}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Bintang</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                  <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
                  <option value="3">⭐⭐⭐ (3 Bintang)</option>
                  <option value="2">⭐⭐ (2 Bintang)</option>
                  <option value="1">⭐ (1 Bintang)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="published">Tayang di Web</option>
                  <option value="pending">Pending Moderasi</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Pengulas</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Layanan</th>
                    <th className="py-3 px-4 max-w-xs">Komentar</th>
                    <th className="py-3 px-4">Status Tayang</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <FaSyncAlt className="animate-spin text-xl mx-auto mb-2 text-primary" />
                        Memuat daftar ulasan...
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Tidak ada data ulasan yang cocok.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const rowNumber = startIndex + idx + 1;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-center font-medium text-slate-400">
                            {rowNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.nama_pengulas}</div>
                            <div className="text-[11px] text-slate-400">
                              {item.profesi_peran || "Pasien"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {renderStars(Number(item.rating))}
                              <span className="font-bold text-slate-700">{item.rating}.0</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-medium text-[11px]">
                              {item.layanan?.nama_layanan || item.layanan || "Layanan Umum"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.komentar}>
                            {item.komentar}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleTogglePublish(item)}
                              title="Klik untuk mengubah status tayang"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                item.is_published
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              }`}
                            >
                              {item.is_published ? (
                                <>
                                  <FaCheckCircle className="text-emerald-600" /> Tayang
                                </>
                              ) : (
                                <>
                                  <FaTimesCircle className="text-amber-600" /> Pending
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowDetailModal(true);
                                }}
                                title="Lihat Detail"
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Ulasan"
                                className="p-2 rounded-lg text-primary hover:bg-primary-light/40 transition cursor-pointer"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteUlasan(item)}
                                title="Hapus Ulasan"
                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <FaTrash />
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
        /* Tab 2: Pengaturan Header Portal Web */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaHeading className="text-primary" /> Pengaturan Header Section Ulasan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Teks ini ditampilkan pada bagian atas halaman ulasan serta section ulasan beranda portal web.
            </p>
          </div>

          <form onSubmit={handleSaveHeader} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Judul Utama (ulasan_heading) *
              </label>
              <input
                type="text"
                required
                value={headerSettings.ulasan_heading}
                onChange={(e) =>
                  setHeaderSettings({ ...headerSettings, ulasan_heading: e.target.value })
                }
                placeholder="Contoh: Apa Kata Mereka tentang Kami"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sub-judul / Deskripsi Singkat (ulasan_subheading)
              </label>
              <textarea
                rows={3}
                value={headerSettings.ulasan_subheading}
                onChange={(e) =>
                  setHeaderSettings({ ...headerSettings, ulasan_subheading: e.target.value })
                }
                placeholder="Contoh: Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan kami."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingHeader}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FaSave /> {savingHeader ? "Menyimpan..." : "Simpan Header Ulasan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah Ulasan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FaPlus className="text-primary" /> Tambah Ulasan Pasien Manual
            </h2>

            <form onSubmit={handleCreateUlasan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pengulas *</label>
                <input
                  type="text"
                  required
                  value={formData.nama_pengulas}
                  onChange={(e) => setFormData({ ...formData, nama_pengulas: e.target.value })}
                  placeholder="Contoh: Ny. Ratna Sari"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profesi / Peran</label>
                  <input
                    type="text"
                    value={formData.profesi_peran}
                    onChange={(e) => setFormData({ ...formData, profesi_peran: e.target.value })}
                    placeholder="Contoh: Keluarga Pasien"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating Bintang (1 - 5) *</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                    <option value={2}>⭐⭐ (2 Bintang)</option>
                    <option value={1}>⭐ (1 Bintang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Terkait</label>
                <select
                  value={formData.layanan_id}
                  onChange={(e) => setFormData({ ...formData, layanan_id: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Layanan (Opsional) --</option>
                  {layananOptions.map((l) => (
                    <option key={l.id_layanan || l.id} value={l.id_layanan || l.id}>
                      {l.nama_layanan || l.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Komentar / Testimoni *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  placeholder="Tuliskan ulasan pasien..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_pub"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_pub" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Langsung publikasikan ke portal web
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                >
                  Simpan Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Ulasan */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FaEdit className="text-primary" /> Edit Ulasan Pasien #{selectedItem.id}
            </h2>

            <form onSubmit={handleUpdateUlasan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pengulas *</label>
                <input
                  type="text"
                  required
                  value={formData.nama_pengulas}
                  onChange={(e) => setFormData({ ...formData, nama_pengulas: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profesi / Peran</label>
                  <input
                    type="text"
                    value={formData.profesi_peran}
                    onChange={(e) => setFormData({ ...formData, profesi_peran: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating Bintang *</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                    <option value={2}>⭐⭐ (2 Bintang)</option>
                    <option value={1}>⭐ (1 Bintang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Komentar / Testimoni *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_pub_edit"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_pub_edit" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Tayangkan ulasan ini di portal web
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                >
                  Perbarui Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Ulasan */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FaEye className="text-primary" /> Rincian Ulasan Pasien
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nama Pengulas</span>
                <span className="font-bold text-slate-800 text-sm">{selectedItem.nama_pengulas}</span>
                <span className="text-slate-500 block">{selectedItem.profesi_peran || "Pasien"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Rating:</span>
                {renderStars(Number(selectedItem.rating))}
                <span className="font-bold text-amber-500">({selectedItem.rating}.0 / 5)</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Layanan</span>
                <span className="font-semibold text-sky-700">
                  {selectedItem.layanan?.nama_layanan || selectedItem.layanan || "Layanan Homecare"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Isi Komentar</span>
                <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 italic">
                  "{selectedItem.komentar}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-slate-400 block font-medium">Status Tayang</span>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedItem.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedItem.is_published ? "Tayang di Web" : "Pending Moderasi"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Tanggal Dibuat</span>
                  <span className="text-slate-600">
                    {selectedItem.created_at ? selectedItem.created_at.split("T")[0] : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
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
