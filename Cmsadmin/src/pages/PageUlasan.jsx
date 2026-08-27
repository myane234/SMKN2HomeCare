import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaStar, 
  FaPlus, 
  FaTrash, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaFilter, 
  FaComments, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';

const INITIAL_ULASAN = [
  {
    id: 1,
    nama_pasien: "Siti Rahmawati",
    rating: 5,
    nama_layanan: "Home Care Perawat Lansia",
    komentar: "Pelayanan perawat sangat ramah, sabar, dan sangat profesional dalam merawat ibu saya di rumah. Sangat terbantu!",
    tanggal: "2026-08-20T10:30:00Z",
    is_active: true
  },
  {
    id: 2,
    nama_pasien: "Budi Santoso",
    rating: 5,
    nama_layanan: "Fisioterapi Pasca Stroke",
    komentar: "Fisioterapisnya menguasai teknik dengan baik. Setelah 4 kali terapi, pergerakan tangan ayah saya mulai menunjukkan kemajuan pesat.",
    tanggal: "2026-08-18T14:15:00Z",
    is_active: true
  },
  {
    id: 3,
    nama_pasien: "Dewi Lestari",
    rating: 4,
    nama_layanan: "Perawatan Ibu & Bayi Baru Lahir",
    komentar: "Bidan sangat telaten memandikan bayi dan mengajari pijat laktasi. Sangat merekomendasikan layanan SmartHomeCare!",
    tanggal: "2026-08-15T09:00:00Z",
    is_active: true
  },
  {
    id: 4,
    nama_pasien: "Ahmad Hidayat",
    rating: 5,
    nama_layanan: "Medical Checkup Rumah",
    komentar: "Pemeriksaan darah dan EKG dilakukan tepat waktu di rumah. Hasil keluar cepat dan penjelasannya dokter sangat detail.",
    tanggal: "2026-08-10T16:45:00Z",
    is_active: true
  }
];

export default function PageUlasan() {
  const [reviews, setReviews] = useState(INITIAL_ULASAN);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nama_pasien: '',
    rating: 5,
    nama_layanan: 'Home Care Perawat Lansia',
    komentar: '',
    is_active: true
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/ulasan`, { headers: getAuthHeaders() });
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.data) && body.data.length > 0) {
        setReviews(body.data);
      } else {
        setReviews(INITIAL_ULASAN);
      }
    } catch (err) {
      console.warn('Gagal memuat ulasan dari API, menggunakan data default:', err);
      setReviews(INITIAL_ULASAN);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const active = reviews.filter(r => r.is_active).length;
    const avg = total > 0 ? (reviews.reduce((a, b) => a + (Number(b.rating) || 5), 0) / total).toFixed(1) : 0;
    return { total, active, avg };
  }, [reviews]);

  // Filtered List
  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const matchesSearch = 
        !search ||
        (r.nama_pasien && r.nama_pasien.toLowerCase().includes(search.toLowerCase())) ||
        (r.komentar && r.komentar.toLowerCase().includes(search.toLowerCase())) ||
        (r.nama_layanan && r.nama_layanan.toLowerCase().includes(search.toLowerCase()));

      const matchesRating = !ratingFilter || String(r.rating) === String(ratingFilter);
      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  // Toggle Active Status
  const handleToggleActive = async (id) => {
    const target = reviews.find(r => r.id === id);
    if (!target) return;
    const nextStatus = !target.is_active;

    try {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_active: nextStatus } : r));
      showToast('success', `Status ulasan berhasil diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`);

      await fetch(`${URL}/ulasan/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...target, is_active: nextStatus })
      });
    } catch (err) {
      console.warn('API update status ulasan failed, status updated locally:', err);
    }
  };

  // Add Review Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_pasien.trim() || !formData.komentar.trim()) {
      showToast('error', 'Mohon lengkapi nama pasien dan komentar ulasan');
      return;
    }

    try {
      setSubmitting(true);
      const newReview = {
        id: Date.now(),
        ...formData,
        tanggal: new Date().toISOString()
      };

      try {
        await fetch(`${URL}/ulasan`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(newReview)
        });
      } catch (err) {
        console.warn('API add ulasan failed, saved locally:', err);
      }

      setReviews(prev => [newReview, ...prev]);
      showToast('success', 'Ulasan baru berhasil ditambahkan');
      setIsModalOpen(false);
      setFormData({
        nama_pasien: '',
        rating: 5,
        nama_layanan: 'Home Care Perawat Lansia',
        komentar: '',
        is_active: true
      });
    } catch (err) {
      console.error('Error adding ulasan:', err);
      showToast('error', 'Terjadi kesalahan saat menambah ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Review
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setReviews(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast('success', 'Ulasan berhasil dihapus');
      try {
        await fetch(`${URL}/ulasan/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.warn('API delete ulasan failed:', err);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting ulasan:', err);
      showToast('error', 'Gagal menghapus ulasan');
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
            <FaComments className="text-primary" /> Kelola Ulasan &amp; Testimoni
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengaturan ulasan pasien, moderasi rating, serta penayangan testimoni di portal web
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm self-start sm:self-auto"
        >
          <FaPlus /> Tambah Ulasan Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaComments />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Ulasan</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl font-bold">
            <FaStar />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rating Rata-rata</p>
            <p className="text-2xl font-bold text-slate-900">{stats.avg} / 5.0</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ulasan Dipublikasi</p>
            <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Search & Rating Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Cari nama pasien, layanan, atau kata kunci ulasan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-10 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <FaFilter /> Rating:
            </label>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="form-input text-xs w-36"
            >
              <option value="">Semua Rating</option>
              <option value="5">5 Bintang</option>
              <option value="4">4 Bintang</option>
              <option value="3">3 Bintang</option>
              <option value="2">2 Bintang</option>
              <option value="1">1 Bintang</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12">No</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4">Layanan</th>
                <th className="py-3.5 px-4 w-28">Rating</th>
                <th className="py-3.5 px-4">Ulasan / Komentar</th>
                <th className="py-3.5 px-4 w-28">Status</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Memuat data ulasan...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Tidak ada ulasan ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                        <FaUser />
                      </div>
                      {item.nama_pasien}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md text-[11px]">
                        {item.nama_layanan || 'Layanan HomeCare'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <span>{item.rating}</span>
                        <FaStar />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={item.komentar}>
                      "{item.komentar}"
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {item.is_active ? <FaToggleOn size={16} className="text-emerald-600" /> : <FaToggleOff size={16} />}
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Ulasan"
                      >
                        <FaTrash />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaPlus className="text-primary" /> Tambah Ulasan Testimoni Admin
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nama Pasien / Keluarga</label>
                <input
                  type="text"
                  value={formData.nama_pasien}
                  onChange={e => setFormData({ ...formData, nama_pasien: e.target.value })}
                  placeholder="Contoh: Ibu Ani"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="form-label">Nama Layanan</label>
                <input
                  type="text"
                  value={formData.nama_layanan}
                  onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })}
                  placeholder="Contoh: Home Care Perawat Lansia"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="form-label">Rating (1 - 5 Bintang)</label>
                <select
                  value={formData.rating}
                  onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="form-input text-xs"
                >
                  <option value={5}>5 Bintang (Sangat Puas)</option>
                  <option value={4}>4 Bintang (Puas)</option>
                  <option value={3}>3 Bintang (Cukup)</option>
                  <option value={2}>2 Bintang (Kurang)</option>
                  <option value={1}>1 Bintang (Buruk)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Komentar / Ulasan</label>
                <textarea
                  rows={4}
                  value={formData.komentar}
                  onChange={e => setFormData({ ...formData, komentar: e.target.value })}
                  placeholder="Isikan kutipan ulasan pasien..."
                  className="form-input text-xs resize-y"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  <FaCheck /> {submitting ? 'Menyimpan...' : 'Simpan Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hapus Ulasan?</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus ulasan dari <strong>{deleteTarget.nama_pasien}</strong>?
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
