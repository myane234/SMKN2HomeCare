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
  FaRegStar,
  FaSlidersH,
  FaClock,
  FaTags,
  FaTimes,
  FaUndo,
  FaRegCommentDots,
  FaCheck,
  FaMobileAlt
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../utils/apiClient";
import Pagination from "../components/pagination";
import { getAllLayanan } from "../data/layananData";

export default function PageUlasan() {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'header' | 'mini_ulasan'
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

  // Konfigurasi Pop-up Mini Ulasan State
  const [miniUlasanSettings, setMiniUlasanSettings] = useState({
    judul: "Rate your experience",
    subjudul: "Bantu kami meningkatkan kualitas layanan dengan memberikan rating dan ulasan singkat.",
    rating_labels: {
      "1": "Sangat Buruk",
      "2": "Kurang Baik",
      "3": "Cukup Baik",
      "4": "Memuaskan",
      "5": "Sangat Puas"
    },
    quick_tags: [
      "Pelayanan Ramah",
      "Tepat Waktu",
      "Sangat Profesional",
      "Penjelasan Jelas",
      "Higienis & Rapi",
      "Teliti & Sabar"
    ],
    placeholder_komentar: "Ceritakan pengalaman Anda selama pelayanan nakes kami (wajib diisi)...",
    label_tombol_kirim: "Submit your feedback",
    label_tombol_batal: "Nanti Saja",
    pesan_sukses_judul: "Thank you",
    pesan_sukses_subjudul: "The feedback helps us improve, appreciate the time you took to send us the feedback!",
    label_tombol_selesai: "Done"
  });
  const [savingMiniUlasan, setSavingMiniUlasan] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // State untuk Live Interactive Preview di CMS
  const [previewTab, setPreviewTab] = useState("form"); // "form" | "success"
  const [previewRating, setPreviewRating] = useState(5);
  const [previewSelectedTags, setPreviewSelectedTags] = useState(["Pelayanan Ramah", "Sangat Profesional"]);
  const [previewComment, setPreviewComment] = useState("");

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
      // Ambil daftar ulasan dari API Admin
      let list = [];
      try {
        const res = await api.get("/api/admin/ulasan?per_page=all");
        let rawList = [];
        if (Array.isArray(res)) rawList = res;
        else if (Array.isArray(res?.data)) rawList = res.data;
        else if (Array.isArray(res?.data?.data)) rawList = res.data.data;
        else if (Array.isArray(res?.data?.data?.data)) rawList = res.data.data.data;

        list = rawList.map((item) => {
          let cleanKomentar = item.komentar || "";
          let layananName =
            item.layanan?.nama_layanan ||
            (typeof item.layanan === "string" ? item.layanan : null);
          let nakesName = item.nakes_nama || null;
          let quickTags = Array.isArray(item.quick_tags) ? item.quick_tags : [];

          const matchMeta = cleanKomentar.match(/^\[(.*?)\]\s*(.*)$/s);
          if (matchMeta) {
            cleanKomentar = matchMeta[2];
            const parts = matchMeta[1].split('|').map((s) => s.trim());
            for (const part of parts) {
              if (part.startsWith('Layanan:')) {
                if (!layananName) layananName = part.replace('Layanan:', '').trim();
              } else if (part.startsWith('Nakes:')) {
                if (!nakesName) nakesName = part.replace('Nakes:', '').trim();
              } else if (part.startsWith('Tags:')) {
                if (quickTags.length === 0) {
                  quickTags = part.replace('Tags:', '').split(',').map((s) => s.trim()).filter(Boolean);
                }
              }
            }
          }

          return {
            ...item,
            id: item.id || item.id_ulasan,
            nama_pengulas: item.nama_pengulas || item.nama_pasien || "Pasien",
            profesi_peran: item.profesi_peran || "Pasien",
            rating: Number(item.rating) || 5,
            komentar: cleanKomentar,
            quick_tags: quickTags,
            layanan: layananName || null,
            nakes_nama: nakesName || null,
            is_published: Boolean(item.is_published),
            created_at: item.created_at || new Date().toISOString()
          };
        });
      } catch (errAdmin) {
        console.warn("Gagal memuat ulasan via /api/admin/ulasan:", errAdmin?.message);
      }

      // Selalu periksa dan sinkronkan dengan ulasan publik di backend agar semua ulasan tampil di CMS
      try {
        const resPublic = await api.get("/api/resource/content/ulasan?per_page=100");
        const publicItems =
          (Array.isArray(resPublic?.data?.data) && resPublic.data.data) ||
          (Array.isArray(resPublic?.data) && resPublic.data) ||
          (Array.isArray(resPublic) && resPublic) ||
          [];

        if (publicItems.length > 0) {
          const existingIds = new Set(list.map((u) => String(u.id ?? u.id_ulasan)));
          const merged = [...list];
          for (const item of publicItems) {
            const key = String(item.id ?? item.id_ulasan);
            if (!existingIds.has(key)) {
              let cleanKomentar = item.komentar || "";
              let layananName =
                item.layanan?.nama_layanan ||
                (typeof item.layanan === "string" ? item.layanan : null);
              let nakesName = item.nakes_nama || null;
              let quickTags = Array.isArray(item.quick_tags) ? item.quick_tags : [];

              const matchMeta = cleanKomentar.match(/^\[(.*?)\]\s*(.*)$/s);
              if (matchMeta) {
                cleanKomentar = matchMeta[2];
                const parts = matchMeta[1].split('|').map((s) => s.trim());
                for (const part of parts) {
                  if (part.startsWith('Layanan:')) {
                    if (!layananName) layananName = part.replace('Layanan:', '').trim();
                  } else if (part.startsWith('Nakes:')) {
                    if (!nakesName) nakesName = part.replace('Nakes:', '').trim();
                  } else if (part.startsWith('Tags:')) {
                    if (quickTags.length === 0) {
                      quickTags = part.replace('Tags:', '').split(',').map((s) => s.trim()).filter(Boolean);
                    }
                  }
                }
              }

              merged.push({
                id: item.id || item.id_ulasan,
                nama_pengulas: item.nama_pengulas || item.nama_pasien || "Pasien",
                profesi_peran: item.profesi_peran || "Pasien",
                rating: Number(item.rating) || 5,
                komentar: cleanKomentar,
                quick_tags: quickTags,
                layanan_id:
                  item.layanan_id ||
                  (item.layanan && typeof item.layanan === "object"
                    ? item.layanan.id_master_layanan
                    : null),
                layanan: layananName || null,
                nakes_nama: nakesName || null,
                is_published: item.is_published !== undefined ? Boolean(item.is_published) : true,
                urutan: item.urutan ?? 0,
                foto_url: item.foto_url || null,
                created_at: item.created_at || new Date().toISOString()
              });
              existingIds.add(key);
            }
          }
          list = merged;
        }
      } catch (errPublic) {
        console.warn("Gagal memuat ulasan publik fallback:", errPublic?.message);
      }

      // Urutkan ulasan terbaru di paling atas
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setUlasanList(Array.isArray(list) ? list : []);

      // Ambil data header portal dari API
      try {
        const resHeader = await api.get("/api/resource/content/ulasan");
        const heading = resHeader?.ulasan_heading || resHeader?.data?.ulasan_heading;
        const subheading = resHeader?.ulasan_subheading || resHeader?.data?.ulasan_subheading;
        if (heading) {
          setHeaderSettings({
            ulasan_heading: heading,
            ulasan_subheading: subheading || ""
          });
        }
      } catch {}

      // Ambil daftar layanan untuk dropdown
      try {
        const layanans = await getAllLayanan();
        setLayananOptions(Array.isArray(layanans) ? layanans : []);
      } catch {}

      // Ambil konfigurasi pop-up mini ulasan
      try {
        const resMini = await api.get("/api/resource/content/mini-ulasan");
        const miniData = resMini?.data || resMini;
        if (miniData && typeof miniData === "object") {
          setMiniUlasanSettings((prev) => ({
            ...prev,
            judul: miniData.title || miniData.judul || prev.judul,
            subjudul: miniData.subtitle || miniData.subjudul || prev.subjudul,
            placeholder_komentar: miniData.comment_placeholder || miniData.placeholder_komentar || prev.placeholder_komentar,
            label_tombol_kirim: miniData.submit_button_text || miniData.label_tombol_kirim || prev.label_tombol_kirim,
            label_tombol_batal: miniData.skip_button_text || miniData.label_tombol_batal || prev.label_tombol_batal,
            pesan_sukses_judul: miniData.success_title || miniData.pesan_sukses_judul || prev.pesan_sukses_judul,
            pesan_sukses_subjudul: miniData.success_message || miniData.pesan_sukses_subjudul || prev.pesan_sukses_subjudul,
            rating_labels: { ...prev.rating_labels, ...(miniData.rating_labels || {}) },
            quick_tags: Array.isArray(miniData.quick_tags) && miniData.quick_tags.length > 0 ? miniData.quick_tags : prev.quick_tags
          }));
        }
      } catch (errMini) {
        console.warn("Gagal memuat konfigurasi mini ulasan:", errMini?.message);
      }
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
      let newStatus = !item.is_published;
      try {
        const res = await api.patch(`/api/admin/ulasan/${item.id}/toggle-publish`);
        if (res?.data?.is_published !== undefined) {
          newStatus = res.data.is_published;
        } else if (res?.data?.data?.is_published !== undefined) {
          newStatus = res.data.data.is_published;
        }
      } catch (errApi) {
        console.warn("API toggle-publish warning, updating local state:", errApi?.message);
      }

      setUlasanList((prev) =>
        prev.map((u) => (String(u.id) === String(item.id) ? { ...u, is_published: newStatus } : u))
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
      const selectedLayanan = layananOptions.find(
        (l) => String(l.id_layanan || l.id) === String(formData.layanan_id)
      );
      const layananName = selectedLayanan ? (selectedLayanan.nama_layanan || selectedLayanan.nama) : null;

      let komentarText = formData.komentar.trim();
      if (layananName && !komentarText.startsWith("[")) {
        komentarText = `[Layanan: ${layananName}] ${komentarText}`;
      }

      const payload = {
        nama_pengulas: formData.nama_pengulas,
        profesi_peran: formData.profesi_peran || "Pasien",
        rating: Number(formData.rating),
        komentar: komentarText,
        is_published: formData.is_published
      };

      let created = null;
      try {
        const res = await api.post("/api/admin/ulasan", payload);
        created = res?.data?.data || res?.data;
      } catch (errAdminPost) {
        const resPub = await api.post("/api/resource/content/ulasan", payload);
        created = resPub?.data?.data || resPub?.data;
      }

      const formattedCreated = {
        ...(created || payload),
        id: created?.id || Date.now(),
        layanan: layananName || null,
        komentar: formData.komentar.trim(),
        quick_tags: [],
        rating: Number(formData.rating),
        is_published: Boolean(formData.is_published),
        created_at: created?.created_at || new Date().toISOString()
      };

      setUlasanList((prev) => [formattedCreated, ...prev]);
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
      layanan_id: item.layanan_id || item.layanan?.id_master_layanan || "",
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
      const selectedLayanan = layananOptions.find(
        (l) => String(l.id_layanan || l.id) === String(formData.layanan_id)
      );
      const layananName = selectedLayanan ? (selectedLayanan.nama_layanan || selectedLayanan.nama) : null;

      let komentarText = formData.komentar.trim();
      const metaParts = [];
      if (layananName) metaParts.push(`Layanan: ${layananName}`);
      if (selectedItem.nakes_nama) metaParts.push(`Nakes: ${selectedItem.nakes_nama}`);
      if (Array.isArray(selectedItem.quick_tags) && selectedItem.quick_tags.length > 0) {
        metaParts.push(`Tags: ${selectedItem.quick_tags.join(", ")}`);
      }
      if (metaParts.length > 0 && !komentarText.startsWith("[")) {
        komentarText = `[${metaParts.join(" | ")}] ${komentarText}`;
      }

      const payload = {
        nama_pengulas: formData.nama_pengulas,
        profesi_peran: formData.profesi_peran || "Pasien",
        rating: Number(formData.rating),
        komentar: komentarText,
        is_published: formData.is_published
      };

      try {
        await api.post(`/api/admin/ulasan/${selectedItem.id}`, payload);
      } catch (errUp) {
        console.warn("Update ulasan API warning:", errUp?.message);
      }

      setUlasanList((prev) =>
        prev.map((u) =>
          u.id === selectedItem.id
            ? {
                ...u,
                ...payload,
                komentar: formData.komentar.trim(),
                layanan: layananName || u.layanan
              }
            : u
        )
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

  const DEFAULT_MINI_ULASAN = {
    judul: "Rate your experience",
    subjudul: "Bantu kami meningkatkan kualitas layanan dengan memberikan rating dan ulasan singkat.",
    rating_labels: {
      "1": "Sangat Buruk",
      "2": "Kurang Baik",
      "3": "Cukup Baik",
      "4": "Memuaskan",
      "5": "Sangat Puas"
    },
    quick_tags: [
      "Pelayanan Ramah",
      "Tepat Waktu",
      "Sangat Profesional",
      "Penjelasan Jelas",
      "Higienis & Rapi",
      "Teliti & Sabar"
    ],
    placeholder_komentar: "Ceritakan pengalaman Anda selama pelayanan nakes kami (wajib diisi)...",
    label_tombol_kirim: "Submit your feedback",
    label_tombol_batal: "Nanti Saja",
    pesan_sukses_judul: "Thank you",
    pesan_sukses_subjudul: "The feedback helps us improve, appreciate the time you took to send us the feedback!",
    label_tombol_selesai: "Done"
  };

  // Simpan Konfigurasi Mini Ulasan
  const handleSaveMiniUlasan = async (e) => {
    if (e) e.preventDefault();
    setSavingMiniUlasan(true);
    try {
      const payload = {
        ...miniUlasanSettings,
        title: miniUlasanSettings.judul,
        subtitle: miniUlasanSettings.subjudul,
        comment_placeholder: miniUlasanSettings.placeholder_komentar,
        submit_button_text: miniUlasanSettings.label_tombol_kirim,
        skip_button_text: miniUlasanSettings.label_tombol_batal,
        success_title: miniUlasanSettings.pesan_sukses_judul,
        success_message: miniUlasanSettings.pesan_sukses_subjudul
      };
      await api.post("/api/resource/content/mini-ulasan", payload);
      Swal.fire({
        icon: "success",
        title: "Berhasil Disimpan!",
        text: "Konfigurasi tampilan pop-up mini ulasan berhasil diperbarui di server.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal menyimpan konfigurasi mini ulasan", "error");
    } finally {
      setSavingMiniUlasan(false);
    }
  };

  const handleAddQuickTag = (tagToAdd) => {
    const trimmed = (tagToAdd || newTagInput).trim();
    if (!trimmed) return;
    if (miniUlasanSettings.quick_tags.includes(trimmed)) {
      Swal.fire("Peringatan", `Tag "${trimmed}" sudah ada!`, "warning");
      return;
    }
    setMiniUlasanSettings((prev) => ({
      ...prev,
      quick_tags: [...prev.quick_tags, trimmed]
    }));
    setNewTagInput("");
  };

  const handleRemoveQuickTag = (tagToRemove) => {
    setMiniUlasanSettings((prev) => ({
      ...prev,
      quick_tags: prev.quick_tags.filter((t) => t !== tagToRemove)
    }));
  };

  const handleResetMiniUlasanDefault = async () => {
    const confirm = await Swal.fire({
      title: "Reset ke Pengaturan Default?",
      text: "Seluruh teks dan opsi akan dikembalikan ke teks bawaan sistem.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Kembalikan Default",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981"
    });
    if (confirm.isConfirmed) {
      setMiniUlasanSettings(DEFAULT_MINI_ULASAN);
      try {
        await api.post("/api/resource/content/mini-ulasan", DEFAULT_MINI_ULASAN);
        Swal.fire({
          icon: "success",
          title: "Pengaturan Direset!",
          text: "Konfigurasi pop-up mini ulasan kembali ke teks default.",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire("Gagal", err.message || "Gagal mereset", "error");
      }
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const datePart = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);

      const timePart = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);

      return `${datePart} • ${timePart} WIB`;
    } catch {
      return isoString;
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
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "list"
              ? "border-primary text-primary-dark bg-primary-light/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaStar /> Daftar Ulasan Pasien ({totalUlasan})
        </button>
        <button
          onClick={() => setActiveTab("header")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "header"
              ? "border-primary text-primary-dark bg-primary-light/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaHeading /> Pengaturan Header Portal Web
        </button>
        <button
          onClick={() => setActiveTab("mini_ulasan")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "mini_ulasan"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/60"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaSlidersH /> Konfigurasi Pop-up Mini Ulasan
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
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
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
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-medium">
                              <FaClock className="text-[9px] text-slate-400 shrink-0" />
                              <span>{formatDateTime(item.created_at)}</span>
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
                            {item.nakes_nama && (
                              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                                Nakes: {item.nakes_nama}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs">
                            <p className="truncate" title={item.komentar}>
                              {item.komentar}
                            </p>
                            {Array.isArray(item.quick_tags) && item.quick_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.quick_tags.map((t, idxTag) => (
                                  <span
                                    key={idxTag}
                                    className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200"
                                  >
                                    ✓ {t}
                                  </span>
                                ))}
                              </div>
                            )}
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs w-full space-y-6">
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

      {/* Tab Konfigurasi Pop-up Mini Ulasan */}
      {activeTab === "mini_ulasan" && (
        <div className="space-y-6">
          {/* Header Sub-section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FaSlidersH />
                </span>
                Konfigurasi Pop-up Mini Ulasan Pasca Pelayanan
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Atur seluruh teks modal, label rating 1-5 bintang, chip opsi kepuasan cepat, placeholder teks ulasan, serta tampilan pesan terima kasih secara dinamis melalui API <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">/api/resource/content/mini-ulasan</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetMiniUlasanDefault}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <FaUndo /> Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveMiniUlasan}
                disabled={savingMiniUlasan}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FaSave /> {savingMiniUlasan ? "Menyimpan..." : "Simpan Konfigurasi"}
              </button>
            </div>
          </div>

          {/* Grid Layout: Left Form CRUD, Right Live Interactive Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form Settings (7 cols) */}
            <form onSubmit={handleSaveMiniUlasan} className="lg:col-span-7 space-y-5">
              {/* Card 1: Judul & Subjudul */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  1. Teks Judul & Sub-judul Modal
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Pop-up (Heading) *
                    </label>
                    <input
                      type="text"
                      required
                      value={miniUlasanSettings.judul}
                      onChange={(e) =>
                        setMiniUlasanSettings({ ...miniUlasanSettings, judul: e.target.value })
                      }
                      placeholder="Contoh: Rate your experience"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sub-judul / Deskripsi Pendukung
                    </label>
                    <textarea
                      rows={2}
                      value={miniUlasanSettings.subjudul}
                      onChange={(e) =>
                        setMiniUlasanSettings({ ...miniUlasanSettings, subjudul: e.target.value })
                      }
                      placeholder="Bantu kami meningkatkan kualitas layanan..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Label Rating Bintang 1-5 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    2. Label Rating Bintang (1 - 5 Bintang)
                  </h3>
                  <span className="text-[11px] text-slate-400">Gunakan bintang dengan label dinamis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`p-3 rounded-xl border ${
                        star === 5 ? "sm:col-span-2 bg-amber-50/40 border-amber-200/80" : "bg-slate-50/50 border-slate-200/70"
                      }`}
                    >
                      <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: star }).map((_, i) => (
                            <FaStar key={i} />
                          ))}
                        </span>
                        <span className="text-slate-600 font-bold">Bintang {star}</span>
                      </label>
                      <input
                        type="text"
                        value={miniUlasanSettings.rating_labels?.[String(star)] || ""}
                        onChange={(e) =>
                          setMiniUlasanSettings({
                            ...miniUlasanSettings,
                            rating_labels: {
                              ...miniUlasanSettings.rating_labels,
                              [String(star)]: e.target.value
                            }
                          })
                        }
                        placeholder={`Label untuk bintang ${star}`}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Chip Pilihan Tag Kepuasan Cepat */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    3. Chip Pilihan Tag Kepuasan Cepat
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {miniUlasanSettings.quick_tags?.length || 0} tag aktif
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Tag ini ditampilkan sebagai chip tombol klik cepat agar pasien dapat memilih poin kepuasan dengan satu sentuhan.
                </p>

                {/* Tag Badges List */}
                <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  {miniUlasanSettings.quick_tags?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Belum ada tag kepuasan. Tambahkan di bawah.</span>
                  ) : (
                    miniUlasanSettings.quick_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-full text-xs font-semibold shadow-2xs group hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuickTag(tag)}
                          title="Hapus Tag Ini"
                          className="text-slate-400 group-hover:text-rose-600 hover:scale-110 transition cursor-pointer"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddQuickTag();
                      }
                    }}
                    placeholder="Ketik tag kepuasan baru lalu tekan Enter / Tambah..."
                    className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddQuickTag()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <FaPlus /> Tambah
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500">Saran Cepat:</span>
                  {[
                    "Perawat Sabar",
                    "Komunikatif",
                    "Tindakan Cepat",
                    "Peralatan Lengkap",
                    "Sangat Berpengalaman",
                    "Informatif"
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddQuickTag(sug)}
                      disabled={miniUlasanSettings.quick_tags?.includes(sug)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 4: Placeholder & Tombol */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  4. Form Komentar (Tidak Optional) & Tombol
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Placeholder Input Komentar
                    </label>
                    <input
                      type="text"
                      value={miniUlasanSettings.placeholder_komentar}
                      onChange={(e) =>
                        setMiniUlasanSettings({
                          ...miniUlasanSettings,
                          placeholder_komentar: e.target.value
                        })
                      }
                      placeholder="Placeholder teks komentar..."
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      ✓ Ulasan diatur <strong className="font-bold underline">Wajib Diisi (Tidak Optional)</strong> pada form pasien.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Tombol Kirim *
                      </label>
                      <input
                        type="text"
                        required
                        value={miniUlasanSettings.label_tombol_kirim}
                        onChange={(e) =>
                          setMiniUlasanSettings({
                            ...miniUlasanSettings,
                            label_tombol_kirim: e.target.value
                          })
                        }
                        placeholder="Submit your feedback"
                        className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Tombol Batal / Nanti
                      </label>
                      <input
                        type="text"
                        value={miniUlasanSettings.label_tombol_batal}
                        onChange={(e) =>
                          setMiniUlasanSettings({
                            ...miniUlasanSettings,
                            label_tombol_batal: e.target.value
                          })
                        }
                        placeholder="Nanti Saja"
                        className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Tampilan Pesan Sukses (Thank You Card) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  5. Tampilan Pesan Terima Kasih (Layar Sukses)
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Pesan Sukses *
                      </label>
                      <input
                        type="text"
                        required
                        value={miniUlasanSettings.pesan_sukses_judul}
                        onChange={(e) =>
                          setMiniUlasanSettings({
                            ...miniUlasanSettings,
                            pesan_sukses_judul: e.target.value
                          })
                        }
                        placeholder="Contoh: Thank you"
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Tombol Selesai *
                      </label>
                      <input
                        type="text"
                        required
                        value={miniUlasanSettings.label_tombol_selesai}
                        onChange={(e) =>
                          setMiniUlasanSettings({
                            ...miniUlasanSettings,
                            label_tombol_selesai: e.target.value
                          })
                        }
                        placeholder="Contoh: Done"
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi Ucapan Terima Kasih
                    </label>
                    <textarea
                      rows={2}
                      value={miniUlasanSettings.pesan_sukses_subjudul}
                      onChange={(e) =>
                        setMiniUlasanSettings({
                          ...miniUlasanSettings,
                          pesan_sukses_subjudul: e.target.value
                        })
                      }
                      placeholder="The feedback helps us improve, appreciate the time you took to send us the feedback!"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingMiniUlasan}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FaSave /> {savingMiniUlasan ? "Menyimpan Konfigurasi..." : "Simpan Seluruh Pengaturan"}
                </button>
                <button
                  type="button"
                  onClick={handleResetMiniUlasanDefault}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal / Reset
                </button>
              </div>
            </form>

            {/* Right Live Interactive Preview (5 cols) */}
            <div className="lg:col-span-5 sticky top-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FaEye className="text-emerald-600" /> Live Interactive Preview
                </h3>
                <div className="inline-flex p-0.5 bg-slate-200/70 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("form")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      previewTab === "form"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Form Modal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("success")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      previewTab === "success"
                        ? "bg-white text-slate-800 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Layar Sukses
                  </button>
                </div>
              </div>

              {/* Visual Mockup Container matching user's reference image */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#d4f6e8] via-[#e8faf2] to-[#d6f7eb] border border-emerald-100 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[460px]">
                {/* Decorative background leaf/circle effect */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-300/20 rounded-full blur-2xl pointer-events-none" />

                {previewTab === "form" ? (
                  /* Form Review Card */
                  <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100/80 space-y-4 transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          {miniUlasanSettings.judul || "Rate your experience"}
                        </h4>
                        {miniUlasanSettings.subjudul && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {miniUlasanSettings.subjudul}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer"
                        title="Tutup"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </div>

                    {/* Interactive 5 Stars */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-center gap-2 py-2 bg-slate-50/70 rounded-2xl border border-slate-100">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isActive = star <= previewRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setPreviewRating(star)}
                              className="p-1 hover:scale-125 transition-transform cursor-pointer"
                              title={`Pilih ${star} Bintang`}
                            >
                              <FaStar
                                className={`text-2xl transition-colors ${
                                  isActive ? "text-amber-400 drop-shadow-xs" : "text-slate-200"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {/* Dynamic Label for current star rating */}
                      <p className="text-center text-xs font-bold text-amber-600">
                        {previewRating} Bintang — {miniUlasanSettings.rating_labels?.[String(previewRating)] || "Puas"}
                      </p>
                    </div>

                    {/* Quick Tags Chips */}
                    {miniUlasanSettings.quick_tags?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Pilihan Cepat
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {miniUlasanSettings.quick_tags.map((tag, idx) => {
                            const isSelected = previewSelectedTags.includes(tag);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setPreviewSelectedTags(previewSelectedTags.filter((t) => t !== tag));
                                  } else {
                                    setPreviewSelectedTags([...previewSelectedTags, tag]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition border cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                {isSelected ? "✓ " : ""}{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Textarea ulasan (Wajib Diisi) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Ulasan Pengalaman <span className="text-rose-500">* (Wajib diisi)</span>
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={previewComment}
                        onChange={(e) => setPreviewComment(e.target.value)}
                        placeholder={miniUlasanSettings.placeholder_komentar}
                        className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white placeholder:text-slate-400"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewTab("success")}
                      className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-98 transition cursor-pointer"
                    >
                      {miniUlasanSettings.label_tombol_kirim || "Submit your feedback"}
                    </button>
                  </div>
                ) : (
                  /* Thank You Card */
                  <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100/80 text-center space-y-4 transition-all">
                    {/* Green chat bubble icon from image */}
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                      <FaRegCommentDots />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-slate-900">
                        {miniUlasanSettings.pesan_sukses_judul || "Thank you"}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        {miniUlasanSettings.pesan_sukses_subjudul ||
                          "The feedback helps us improve, appreciate the time you took to send us the feedback!"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewTab("form")}
                      className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-98 transition cursor-pointer"
                    >
                      {miniUlasanSettings.label_tombol_selesai || "Done"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Ulasan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl my-auto max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl my-auto max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl my-auto max-h-[90vh] overflow-y-auto">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
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
                <div className="sm:text-right">
                  <span className="text-slate-400 block font-medium">Tanggal Dibuat</span>
                  <span className="text-slate-600 font-medium">
                    {selectedItem.created_at
                      ? new Date(selectedItem.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "-"}
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
