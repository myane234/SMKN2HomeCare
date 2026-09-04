import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock,
  FaEye,
  FaTrash,
  FaEdit,
  FaReply,
  FaSearch,
  FaSyncAlt,
  FaSave,
  FaPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaImage,
  FaCogs,
  FaCommentDots
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../utils/apiClient";
import Pagination from "../components/pagination";

export default function PageHubungiKami() {
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' | 'settings'
  const [pesanList, setPesanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Settings State
  const [settings, setSettings] = useState({
    hubungi_banner: "",
    hubungi_banner_text: "Hubungi Layanan Home Care",
    hubungi_heading: "Ada Pertanyaan? Kami Siap Membantu Anda",
    hubungi_description:
      "Silakan tinggalkan pesan atau hubungi tim customer service kami untuk informasi lebih lanjut mengenai layanan Home Care.",
    hubungi_phone: "021-12345678",
    hubungi_email: "info@homecare.com",
    hubungi_whatsapp: "6281234567890",
    hubungi_address: "Jl. Kesehatan No. 123, Jakarta Selatan",
    hubungi_maps_link: "https://maps.google.com/?q=-6.200000,106.816666",
    hubungi_jam_operasional: "Senin - Minggu: 08:00 - 20:00 WIB"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals State
  const [selectedPesan, setSelectedPesan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Response Form in Detail Modal
  const [responseStatus, setResponseStatus] = useState("dibalas");
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);

  // Manual Add Message Form State
  const [newPesan, setNewPesan] = useState({
    nama: "",
    email: "",
    no_hp: "",
    subjek: "",
    pesan: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil daftar pesan masuk
      const resPesan = await api.get("/api/admin/hubungi-kami/pesan?per_page=all");
      const list = resPesan?.data?.data || resPesan?.data || [];
      setPesanList(Array.isArray(list) ? list : []);
      setUnreadCount(resPesan?.unread_count ?? (Array.isArray(list) ? list.filter((p) => p.status === "belum_dibaca").length : 0));

      // Ambil pengaturan kontak dari API
      try {
        const resSettings = await api.get("/api/admin/hubungi-kami/settings");
        if (resSettings?.data) {
          setSettings((prev) => ({ ...prev, ...resSettings.data }));
        }
      } catch {}
    } catch (err) {
      console.error("Gagal memuat data hubungi kami:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Data
  const filteredList = pesanList.filter((item) => {
    const q = search.toLowerCase();
    const nama = (item.nama || "").toLowerCase();
    const email = (item.email || "").toLowerCase();
    const subjek = (item.subjek || "").toLowerCase();
    const pesan = (item.pesan || "").toLowerCase();
    const noHp = (item.no_hp || "").toLowerCase();

    const matchesSearch =
      !q || nama.includes(q) || email.includes(q) || subjek.includes(q) || pesan.includes(q) || noHp.includes(q);

    const matchesStatus =
      statusFilter === "all" || String(item.status).toLowerCase() === String(statusFilter).toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const totalPesan = pesanList.length;
  const belumDibacaCount = pesanList.filter((p) => p.status === "belum_dibaca").length;
  const sudahDibacaCount = pesanList.filter((p) => p.status === "sudah_dibaca").length;
  const dibalasCount = pesanList.filter((p) => p.status === "dibalas").length;

  // Open Message Detail (Auto mark as read)
  const handleOpenDetail = async (item) => {
    setSelectedPesan(item);
    setResponseStatus(item.status === "belum_dibaca" ? "sudah_dibaca" : item.status || "sudah_dibaca");
    setCatatanAdmin(item.catatan_admin || "");
    setShowDetailModal(true);

    // Tandai sudah dibaca di server & state jika statusnya masih belum dibaca
    if (item.status === "belum_dibaca") {
      try {
        await api.get(`/api/admin/hubungi-kami/pesan/${item.id}`);
        setPesanList((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "sudah_dibaca" } : p))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn("Gagal auto-mark read:", err);
      }
    }
  };

  // Submit Update Status & Admin Notes
  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!selectedPesan) return;
    setSavingResponse(true);

    try {
      const payload = {
        status: responseStatus,
        catatan_admin: catatanAdmin
      };

      await api.put(`/api/admin/hubungi-kami/pesan/${selectedPesan.id}`, payload);

      setPesanList((prev) =>
        prev.map((p) =>
          p.id === selectedPesan.id
            ? { ...p, status: responseStatus, catatan_admin: catatanAdmin }
            : p
        )
      );

      setShowDetailModal(false);

      Swal.fire({
        icon: "success",
        title: "Tanggapan Tersimpan",
        text: "Status pesan dan catatan admin berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal menyimpan tanggapan", "error");
    } finally {
      setSavingResponse(false);
    }
  };

  // Delete Message
  const handleDeletePesan = async (item) => {
    const confirm = await Swal.fire({
      title: "Hapus Pesan?",
      text: `Pesan dari "${item.nama}" akan dihapus permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/api/admin/hubungi-kami/pesan/${item.id}`);
        setPesanList((prev) => prev.filter((p) => p.id !== item.id));
        if (item.status === "belum_dibaca") {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Pesan berhasil dihapus dari kotak masuk.",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire("Gagal", err.message || "Gagal menghapus pesan", "error");
      }
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.post("/api/admin/hubungi-kami/settings", settings);

      Swal.fire({
        icon: "success",
        title: "Pengaturan Disimpan!",
        text: "Informasi kontak resmi berhasil diperbarui dan disinkronkan ke portal web.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal memperbarui pengaturan", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Create Manual Message
  const handleCreateManualPesan = async (e) => {
    e.preventDefault();
    if (!newPesan.nama || !newPesan.email || !newPesan.pesan) {
      Swal.fire("Peringatan", "Nama, email, dan pesan wajib diisi!", "warning");
      return;
    }

    try {
      const res = await api.post("/api/resource/content/hubungi-kami/kirim-pesan", newPesan);
      const created = res?.data || { ...newPesan, id: Date.now(), status: "belum_dibaca" };

      setPesanList((prev) => [created, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setShowAddModal(false);
      setNewPesan({ nama: "", email: "", no_hp: "", subjek: "", pesan: "" });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Pesan manual berhasil dicatat ke kotak masuk.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Gagal", err.message || "Gagal mencatat pesan", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "belum_dibaca":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <FaExclamationCircle className="text-amber-500" /> Belum Dibaca
          </span>
        );
      case "sudah_dibaca":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            <FaEye className="text-slate-400" /> Sudah Dibaca
          </span>
        );
      case "dibalas":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FaCheckCircle className="text-emerald-500" /> Sudah Dibalas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            {status || "Masuk"}
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
            Hubungi Kami &amp; Kotak Masuk Pesan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pertanyaan, pesan konsultasi dari pengunjung web, serta pengaturan kanal kontak resmi
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
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
              ? "border-primary text-primary-dark bg-primary-light/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FaEnvelope /> Kotak Masuk Pesan ({totalPesan})
          {belumDibacaCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
              {belumDibacaCount} Baru
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-primary-dark bg-primary-light/40"
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
              <p className="text-2xl font-bold text-slate-800 mt-2">{totalPesan}</p>
              <span className="text-[11px] text-slate-400">Total pertanyaan masuk</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Belum Dibaca</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-500">
                  <FaExclamationCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-500 mt-2">{belumDibacaCount}</p>
              <span className="text-[11px] text-slate-400">Memerlukan perhatian</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sudah Dibaca</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <FaEye />
                </span>
              </div>
              <p className="text-2xl font-bold text-sky-600 mt-2">{sudahDibacaCount}</p>
              <span className="text-[11px] text-slate-400">Telah dibuka oleh admin</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sudah Dibalas</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FaCheckCircle />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{dibalasCount}</p>
              <span className="text-[11px] text-slate-400">Telah ditindaklanjuti</span>
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
                  placeholder="Cari pengirim, subjek, pesan..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="belum_dibaca">Belum Dibaca ({belumDibacaCount})</option>
                  <option value="sudah_dibaca">Sudah Dibaca</option>
                  <option value="dibalas">Sudah Dibalas</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Pengirim</th>
                    <th className="py-3 px-4">Subjek</th>
                    <th className="py-3 px-4 max-w-xs">Isi Pesan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <FaSyncAlt className="animate-spin text-xl mx-auto mb-2 text-primary" />
                        Memuat pesan masuk...
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Tidak ada pesan masuk.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const rowNumber = startIndex + idx + 1;
                      const isUnread = item.status === "belum_dibaca";

                      return (
                        <tr
                          key={item.id}
                          className={`transition ${isUnread ? "bg-amber-50/40 font-medium" : "hover:bg-slate-50/70"}`}
                        >
                          <td className="py-3 px-4 text-center text-slate-400">{rowNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.nama}</div>
                            <div className="text-[11px] text-slate-400">{item.email}</div>
                            {item.no_hp && (
                              <div className="text-[10px] text-emerald-600 font-medium">
                                WA: {item.no_hp}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{item.subjek || "-"}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.pesan}>
                            {item.pesan}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {item.created_at ? item.created_at.split("T")[0] : "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenDetail(item)}
                                title="Buka Detail Pesan"
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                              >
                                <FaEye />
                              </button>

                              {item.no_hp && (
                                <a
                                  href={`https://wa.me/${item.no_hp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                    `Halo ${item.nama}, terima kasih telah menghubungi SmartHomeCare mengenai "${item.subjek}". Kami siap membantu Anda.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Balas via WhatsApp"
                                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                >
                                  <FaWhatsapp />
                                </a>
                              )}

                              <button
                                onClick={() => handleDeletePesan(item)}
                                title="Hapus Pesan"
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
        /* Tab 2: Pengaturan Kontak & Halaman Web */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FaCogs className="text-primary" /> Informasi Kontak &amp; Halaman Hubungi Kami
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Data ini ditampilkan pada halaman "Hubungi Kami", footer, serta kanal bantuan resmi bagi pasien di portal web.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Header Banner Halaman */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Header Banner Halaman
              </h3>

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
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white"
                />
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
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white"
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
                  placeholder="Tuliskan petunjuk atau sambutan hangat kepada calon pasien..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Kontak Resmi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor Telepon Kantor
                </label>
                <input
                  type="text"
                  value={settings.hubungi_phone || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_phone: e.target.value })}
                  placeholder="021-12345678"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
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
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={settings.hubungi_email || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_email: e.target.value })}
                  placeholder="info@homecare.com"
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Alamat & Maps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alamat Kantor Fisik
                </label>
                <textarea
                  rows={2}
                  value={settings.hubungi_address || ""}
                  onChange={(e) => setSettings({ ...settings, hubungi_address: e.target.value })}
                  placeholder="Jl. Kesehatan No. 123, Jakarta Selatan"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Jam Layanan / Operasional
                </label>
                <textarea
                  rows={2}
                  value={settings.hubungi_jam_operasional || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hubungi_jam_operasional: e.target.value })
                  }
                  placeholder="Senin - Minggu: 08:00 - 20:00 WIB"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tautan Google Maps (hubungi_maps_link)
              </label>
              <input
                type="url"
                value={settings.hubungi_maps_link || ""}
                onChange={(e) => setSettings({ ...settings, hubungi_maps_link: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FaSave /> {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Kontak"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Detail Pesan Masuk & Respon Admin */}
      {showDetailModal && selectedPesan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FaEye className="text-primary" /> Rincian Pesan Masuk #{selectedPesan.id}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Nama Pengirim</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedPesan.nama}</span>
                  <span className="text-slate-500 block">{selectedPesan.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor WhatsApp / HP</span>
                  <span className="font-semibold text-slate-700">{selectedPesan.no_hp || "-"}</span>
                  {selectedPesan.no_hp && (
                    <a
                      href={`https://wa.me/${selectedPesan.no_hp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Halo ${selectedPesan.nama}, kami dari SmartHomeCare menindaklanjuti pesan Anda.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      <FaWhatsapp /> Chat Pengirim via WA
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Subjek Pertanyaan</span>
                <span className="font-bold text-slate-800 text-sm">{selectedPesan.subjek || "-"}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Isi Pesan Lengkap</span>
                <div className="mt-1 p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedPesan.pesan}
                </div>
              </div>

              {/* Form Respon & Tindak Lanjut Admin */}
              <form onSubmit={handleSaveResponse} className="pt-2 border-t border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <FaCommentDots className="text-primary" /> Respon &amp; Catatan Admin
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Update Status Pesan</label>
                    <select
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none bg-white cursor-pointer"
                    >
                      <option value="sudah_dibaca">Sudah Dibaca</option>
                      <option value="dibalas">Sudah Dibalas</option>
                      <option value="belum_dibaca">Belum Dibaca</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Pesan</label>
                    <input
                      type="text"
                      disabled
                      value={selectedPesan.created_at ? selectedPesan.created_at.split("T")[0] : "-"}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tindak Lanjut (Admin Notes)</label>
                  <textarea
                    rows={2}
                    value={catatanAdmin}
                    onChange={(e) => setCatatanAdmin(e.target.value)}
                    placeholder="Contoh: Sudah dihubungi oleh CS Rina via WA pada 04/09 14:00"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={savingResponse}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                  >
                    {savingResponse ? "Menyimpan..." : "Simpan Tindak Lanjut"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Pesan Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FaPlus className="text-primary" /> Catat Pesan / Pertanyaan Manual
            </h2>

            <form onSubmit={handleCreateManualPesan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pasien / Pengirim *</label>
                <input
                  type="text"
                  required
                  value={newPesan.nama}
                  onChange={(e) => setNewPesan({ ...newPesan, nama: e.target.value })}
                  placeholder="Contoh: Ibu Rina Melati"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newPesan.email}
                    onChange={(e) => setNewPesan({ ...newPesan, email: e.target.value })}
                    placeholder="rina@gmail.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={newPesan.no_hp}
                    onChange={(e) => setNewPesan({ ...newPesan, no_hp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subjek Pertanyaan</label>
                <input
                  type="text"
                  value={newPesan.subjek}
                  onChange={(e) => setNewPesan({ ...newPesan, subjek: e.target.value })}
                  placeholder="Contoh: Tanya Biaya Perawatan Lansia"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Isi Pesan / Catatan *</label>
                <textarea
                  required
                  rows={3}
                  value={newPesan.pesan}
                  onChange={(e) => setNewPesan({ ...newPesan, pesan: e.target.value })}
                  placeholder="Tuliskan pesan pertanyaan yang diajukan..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                />
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
                  Simpan Pesan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
