import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaEnvelope, 
  FaWhatsapp, 
  FaTrash, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaFilter, 
  FaEye, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaReply,
  FaClock
} from 'react-icons/fa';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';

const INITIAL_MESSAGES = [
  {
    id: 1,
    nama: "Budi Pratama",
    whatsapp: "081234567890",
    email: "budi.pratama@gmail.com",
    subjek: "Pertanyaan Tarif Perawat Lansia 24 Jam",
    pesan: "Halo admin SmartHomeCare, saya ingin menanyakan rincian tarif pendampingan perawat lansia untuk wilayah Jakarta Selatan selama 1 bulan. Apakah ada potongan khusus promo?",
    tanggal: "2026-08-27T08:30:00Z",
    is_read: false
  },
  {
    id: 2,
    nama: "Dr. Lina Wati",
    whatsapp: "081987654321",
    email: "lina.wati@yahoo.com",
    subjek: "Pertanyaan Kemitraan Dokter / Nakes",
    pesan: "Selamat pagi, saya ingin menanyakan prosedur pendaftaran sebagai mitra fisioterapis di SmartHomeCare. Terima kasih.",
    tanggal: "2026-08-26T14:20:00Z",
    is_read: true
  },
  {
    id: 3,
    nama: "Ratna Sari",
    whatsapp: "085712345678",
    email: "ratna.sari@gmail.com",
    subjek: "Pemesanan Paket Ibu & Bayi Baru Lahir",
    pesan: "Apakah paket perawatan tali pusar dan senam nifas bisa dipesan untuk daerah Depok minggu depan?",
    tanggal: "2026-08-25T11:45:00Z",
    is_read: true
  }
];

export default function PageHubungiKami() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Modal Detail State
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/contact`, { headers: getAuthHeaders() });
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.data) && body.data.length > 0) {
        setMessages(body.data);
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    } catch (err) {
      console.warn('Gagal memuat pesan kontak dari API, menggunakan data default:', err);
      setMessages(INITIAL_MESSAGES);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => !m.is_read).length;
    const read = messages.filter(m => m.is_read).length;
    return { total, unread, read };
  }, [messages]);

  // Filtered list
  const filtered = useMemo(() => {
    return messages.filter(m => {
      const matchesSearch =
        !search ||
        (m.nama && m.nama.toLowerCase().includes(search.toLowerCase())) ||
        (m.subjek && m.subjek.toLowerCase().includes(search.toLowerCase())) ||
        (m.pesan && m.pesan.toLowerCase().includes(search.toLowerCase())) ||
        (m.whatsapp && m.whatsapp.includes(search));

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'unread' && !m.is_read) ||
        (statusFilter === 'read' && m.is_read);

      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  // Mark Read / Unread
  const handleToggleRead = async (id, currentReadState) => {
    const nextRead = !currentReadState;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: nextRead } : m));

    if (selectedMsg && selectedMsg.id === id) {
      setSelectedMsg(prev => ({ ...prev, is_read: nextRead }));
    }

    try {
      await fetch(`${URL}/contact/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_read: nextRead })
      });
    } catch (err) {
      console.warn('API update read status failed:', err);
    }
  };

  const handleOpenDetail = (msgItem) => {
    setSelectedMsg(msgItem);
    if (!msgItem.is_read) {
      handleToggleRead(msgItem.id, false);
    }
  };

  // Delete message
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
      showToast('success', 'Pesan berhasil dihapus');
      if (selectedMsg && selectedMsg.id === deleteTarget.id) {
        setSelectedMsg(null);
      }
      try {
        await fetch(`${URL}/contact/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.warn('API delete contact message failed:', err);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('error', 'Gagal menghapus pesan');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <FaExclamationTriangle className="text-rose-500 text-lg shrink-0" /> : <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaEnvelope className="text-primary" /> Pesan Masuk (Hubungi Kami)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kotak masuk formulir kontak, pertanyaan calon pasien, serta permohonan informasi
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaEnvelope />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pesan</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            <FaClock />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Belum Dibaca</p>
            <p className="text-2xl font-bold text-rose-600">{stats.unread}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sudah Dibaca</p>
            <p className="text-2xl font-bold text-slate-900">{stats.read}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari pengirim, subjek, nomor WA, atau isi pesan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-10 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <FaFilter /> Status:
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input text-xs w-36"
            >
              <option value="">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12">No</th>
                <th className="py-3.5 px-4 w-36">Tanggal</th>
                <th className="py-3.5 px-4">Pengirim</th>
                <th className="py-3.5 px-4">WhatsApp / Email</th>
                <th className="py-3.5 px-4">Subjek &amp; Pesan</th>
                <th className="py-3.5 px-4 w-28">Status</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Memuat pesan masuk...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Tidak ada pesan masuk ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-slate-50/60 transition ${!item.is_read ? "bg-sky-50/30 font-semibold text-slate-900" : ""}`}>
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{formatDate(item.tanggal)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                        <FaUser />
                      </div>
                      {item.nama}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-1 text-emerald-700 font-medium">
                        <FaWhatsapp /> {item.whatsapp || '-'}
                      </div>
                      <div className="text-slate-400 truncate max-w-[140px]">
                        {item.email || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-800 text-xs truncate">{item.subjek || 'Tanpa Subjek'}</p>
                      <p className="text-slate-500 text-[11px] truncate">{item.pesan}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.is_read
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.is_read ? 'Sudah Dibaca' : 'Belum Dibaca'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Baca Detail Pesan"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Pesan"
                        >
                          <FaTrash />
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
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaEnvelope className="text-primary" /> Detail Pesan Kontak
              </h3>
              <button onClick={() => setSelectedMsg(null)} className="text-slate-400 hover:text-slate-600">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedMsg.nama}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(selectedMsg.tanggal)}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedMsg.is_read ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {selectedMsg.is_read ? 'Sudah Dibaca' : 'Belum Dibaca'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <FaWhatsapp /> {selectedMsg.whatsapp || '-'}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <FaEnvelope /> {selectedMsg.email || '-'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjek</label>
                <p className="font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {selectedMsg.subjek || 'Tanpa Subjek'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Isi Pesan Lengkap</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed text-slate-700 font-normal whitespace-pre-line text-xs sm:text-sm max-h-56 overflow-y-auto">
                  {selectedMsg.pesan}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggleRead(selectedMsg.id, selectedMsg.is_read)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Tandai sebagai {selectedMsg.is_read ? 'Belum Dibaca' : 'Sudah Dibaca'}
              </button>

              <div className="flex items-center gap-2">
                {selectedMsg.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedMsg.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${selectedMsg.nama}, terima kasih telah menghubungi SmartHomeCare...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <FaReply /> Balas via WA
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMsg(null)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hapus Pesan Masuk?</h3>
            <p className="text-xs text-slate-500">
              Yakin ingin menghapus pesan dari <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-outline text-xs px-4 py-2">
                Batal
              </button>
              <button onClick={handleDelete} className="btn-danger text-xs px-4 py-2">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
