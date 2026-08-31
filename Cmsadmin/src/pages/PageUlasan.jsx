import React, { useEffect, useState } from "react";
import { 
  FiStar, 
  FiTrash2, 
  FiPlus, 
  FiSearch, 
  FiCheckCircle, 
  FiXCircle, 
  FiMessageSquare,
  FiUser
} from "react-icons/fi";
import api from "../utils/apiClient";

const DUMMY_ULASAN_CMS = [
  {
    id_ulasan: 1,
    nama_pasien: "Siti Rahmawati",
    rating: 5,
    layanan: "Perawat Lansia",
    komentar: "Pelayanan sangat ramah dan profesional. Perawat datang tepat waktu dan telaten merawat ibu saya.",
    is_active: 1,
    created_at: "2026-08-15"
  },
  {
    id_ulasan: 2,
    nama_pasien: "Budi Santoso",
    rating: 5,
    layanan: "Fisioterapi",
    komentar: "Sangat membantu pemulihan pasca operasi. Terapis sabar dan memberikan panduan latihan harian.",
    is_active: 1,
    created_at: "2026-08-18"
  },
  {
    id_ulasan: 3,
    nama_pasien: "Dewi Lestari",
    rating: 4,
    layanan: "Perawatan Ibu & Bayi",
    komentar: "Pijat laktasi dan perawatan bayi sangat memuaskan. Recomended banget!",
    is_active: 1,
    created_at: "2026-08-20"
  }
];

export default function PageUlasan() {
  const [ulasanList, setUlasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nama_pasien: "",
    rating: 5,
    layanan: "",
    komentar: "",
    is_active: 1
  });

  const loadUlasan = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/ulasan");
      const items = res.data?.data || res.data || [];
      setUlasanList(Array.isArray(items) && items.length > 0 ? items : DUMMY_ULASAN_CMS);
    } catch (err) {
      console.warn("Gagal memuat API ulasan CMS, menggunakan dummy fallback:", err);
      setUlasanList(DUMMY_ULASAN_CMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUlasan();
  }, []);

  const handleToggleStatus = async (item) => {
    const newStatus = item.is_active === 1 ? 0 : 1;
    try {
      await api.put(`/api/ulasan/${item.id_ulasan}`, { ...item, is_active: newStatus });
    } catch {
      // Local fallback toggle
    }
    setUlasanList((prev) =>
      prev.map((u) => (u.id_ulasan === item.id_ulasan ? { ...u, is_active: newStatus } : u))
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) return;
    try {
      await api.delete(`/api/ulasan/${id}`);
    } catch {
      // Local fallback delete
    }
    setUlasanList((prev) => prev.filter((u) => u.id_ulasan !== id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/ulasan", formData);
    } catch {
      // Local fallback create
    }
    setUlasanList((prev) => [
      {
        id_ulasan: Date.now(),
        ...formData,
        created_at: new Date().toISOString().split("T")[0]
      },
      ...prev
    ]);
    setIsModalOpen(false);
    setFormData({ nama_pasien: "", rating: 5, layanan: "", komentar: "", is_active: 1 });
  };

  const filteredList = ulasanList.filter((item) => {
    const matchSearch =
      item.nama_pasien?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.komentar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.layanan?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRating = filterRating === "all" || String(item.rating) === filterRating;
    return matchSearch && matchRating;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiMessageSquare className="text-sky-600" /> Kelola Ulasan Pasien
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Moderasi dan publikasikan testimoni serta rating pasien SmartHomeCare.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <FiPlus /> Tambah Ulasan Manual
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari pasien, layanan, atau kata kunci ulasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Filter Rating:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none"
          >
            <option value="all">Semua Rating</option>
            <option value="5">5 Bintang</option>
            <option value="4">4 Bintang</option>
            <option value="3">3 Bintang</option>
            <option value="2">2 Bintang</option>
            <option value="1">1 Bintang</option>
          </select>
        </div>
      </div>

      {/* Table Ulasan */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Pasien &amp; Layanan</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Ulasan / Komentar</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat data ulasan...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada ulasan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id_ulasan} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          <FiUser />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.nama_pasien}</p>
                          <span className="text-[10px] text-slate-400">{item.layanan || "Layanan Homecare"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={12}
                            className={star <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-600">{item.komentar}</p>
                    </td>

                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {item.created_at}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          item.is_active === 1
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {item.is_active === 1 ? <FiCheckCircle /> : <FiXCircle />}
                        {item.is_active === 1 ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id_ulasan)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Ulasan"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Ulasan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Ulasan Manual</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-base font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pasien</label>
                <input
                  type="text"
                  required
                  value={formData.nama_pasien}
                  onChange={(e) => setFormData({ ...formData, nama_pasien: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Layanan</label>
                <input
                  type="text"
                  value={formData.layanan}
                  onChange={(e) => setFormData({ ...formData, layanan: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                >
                  <option value={5}>5 Bintang</option>
                  <option value={4}>4 Bintang</option>
                  <option value={3}>3 Bintang</option>
                  <option value={2}>2 Bintang</option>
                  <option value={1}>1 Bintang</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Komentar</label>
                <textarea
                  rows={3}
                  required
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700"
                >
                  Simpan Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
