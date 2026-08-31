import React, { useEffect, useState } from "react";
import { 
  FiMail, 
  FiTrash2, 
  FiSearch, 
  FiEye, 
  FiCheck, 
  FiClock, 
  FiPhone,
  FiUser
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import api from "../utils/apiClient";

const DUMMY_HUBUNGI_CMS = [
  {
    id_hubungi_kami: 1,
    nama: "Ahmad Fauzi",
    email: "ahmad@gmail.com",
    no_hp: "08123456789",
    subjek: "Tanya Biaya Perawat Lansia 24 Jam",
    pesan: "Halo admin, berapa estimasi biaya untuk perawatan lansia pasca stroke selama 1 bulan penuh di area Jakarta Selatan?",
    is_read: 0,
    created_at: "2026-08-25 10:15"
  },
  {
    id_hubungi_kami: 2,
    nama: "Rina Wijaya",
    email: "rina.w@yahoo.com",
    no_hp: "08571234567",
    subjek: "Jadwal Kunjungan Fisioterapi",
    pesan: "Apakah terapis fisioterapi bisa datang di hari Minggu pagi untuk daerah BSD?",
    is_read: 1,
    created_at: "2026-08-24 14:30"
  }
];

export default function PageHubungiKami() {
  const [pesanList, setPesanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPesan, setSelectedPesan] = useState(null);

  const loadPesan = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/hubungi-kami");
      const items = res.data?.data || res.data || [];
      setPesanList(Array.isArray(items) && items.length > 0 ? items : DUMMY_HUBUNGI_CMS);
    } catch (err) {
      console.warn("Gagal memuat API hubungi kami CMS, menggunakan dummy fallback:", err);
      setPesanList(DUMMY_HUBUNGI_CMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPesan();
  }, []);

  const handleOpenDetail = (item) => {
    setSelectedPesan(item);
    if (item.is_read !== 1) {
      setPesanList((prev) =>
        prev.map((p) => (p.id_hubungi_kami === item.id_hubungi_kami ? { ...p, is_read: 1 } : p))
      );
      api.put(`/api/hubungi-kami/${item.id_hubungi_kami}/read`).catch(() => {});
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pesan ini?")) return;
    try {
      await api.delete(`/api/hubungi-kami/${id}`);
    } catch {
      // Local fallback
    }
    setPesanList((prev) => prev.filter((p) => p.id_hubungi_kami !== id));
    if (selectedPesan?.id_hubungi_kami === id) {
      setSelectedPesan(null);
    }
  };

  const filteredList = pesanList.filter((item) => {
    return (
      item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjek?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pesan?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiMail className="text-sky-600" /> Inbox Pesan Masuk (Hubungi Kami)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar pesan, pertanyaan, dan permohonan informasi dari pengunjung website.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari pengirim, email, subjek, atau kata kunci pesan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Table Pesan */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Pengirim</th>
                <th className="p-4">Kontak</th>
                <th className="p-4">Subjek Pesan</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat inbox pesan...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada pesan masuk.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id_hubungi_kami}
                    className={`hover:bg-slate-50 transition cursor-pointer ${
                      item.is_read === 0 ? "bg-sky-50/40 font-semibold" : ""
                    }`}
                    onClick={() => handleOpenDetail(item)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          <FiUser />
                        </div>
                        <span className="text-slate-800 font-bold">{item.nama}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      <p>{item.email}</p>
                      {item.no_hp && <p className="text-[10px] text-slate-400">{item.no_hp}</p>}
                    </td>

                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-1 text-slate-800">{item.subjek || "Tanpa Subjek"}</p>
                      <p className="line-clamp-1 text-[11px] text-slate-500 font-normal">{item.pesan}</p>
                    </td>

                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {item.created_at}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.is_read === 1
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.is_read === 1 ? <FiCheck /> : <FiClock />}
                        {item.is_read === 1 ? "Dibaca" : "Baru"}
                      </span>
                    </td>

                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                          title="Lihat Detail"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_hubungi_kami)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Pesan"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Pesan */}
      {selectedPesan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Detail Pesan Masuk</h3>
              <button onClick={() => setSelectedPesan(null)} className="text-slate-400 hover:text-slate-600 text-base font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1 border border-slate-100">
                <p><strong className="text-slate-700">Nama Pengirim:</strong> {selectedPesan.nama}</p>
                <p><strong className="text-slate-700">Email:</strong> {selectedPesan.email}</p>
                {selectedPesan.no_hp && <p><strong className="text-slate-700">No. HP/WA:</strong> {selectedPesan.no_hp}</p>}
                <p><strong className="text-slate-700">Waktu Kirim:</strong> {selectedPesan.created_at}</p>
              </div>

              <div>
                <strong className="block text-slate-700 mb-1">Subjek:</strong>
                <p className="font-semibold text-slate-900">{selectedPesan.subjek || "-"}</p>
              </div>

              <div>
                <strong className="block text-slate-700 mb-1">Isi Pesan:</strong>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selectedPesan.pesan}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedPesan.no_hp ? (
                <a
                  href={`https://wa.me/${selectedPesan.no_hp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  <FaWhatsapp size={14} /> Balas via WA
                </a>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedPesan(null)}
                className="px-4 py-2 rounded-xl text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
