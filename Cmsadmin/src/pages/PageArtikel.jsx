import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllArtikel, deleteArtikel, KATEGORI_ARTIKEL_OPTIONS } from '../data/artikelData';
import Pagination from '../components/Pagination';

function formatDate(raw) {
  if (!raw) return '-';
  const d = new Date(raw);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PageArtikel() {
  const [artikel, setArtikel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // State Pagination (cukup 1 pasang saja)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  function loadData() {
    setLoading(true);
    setErrorMsg('');
    getAllArtikel(kategoriFilter)
      .then(setArtikel)
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoriFilter]);

  // Reset ke halaman 1 saat pencarian dilakukan
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Filter berdasarkan search
  const filtered = artikel.filter((item) =>
    item.judul_artikel?.toLowerCase().includes(search.toLowerCase())
  );

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArtikel = filtered.slice(startIndex, startIndex + itemsPerPage);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArtikel(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Artikel</h1>
          <p className="page-subtitle">Kelola artikel &amp; tips kesehatan SmartHomeCare</p>
        </div>
        <Link to="/artikel/tambah" className="btn-primary">
          + Tambah Artikel
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Cari judul artikel..."
          value={search}
          onChange={handleSearchChange}
          className="form-input max-w-full sm:max-w-[300px]"
        />
        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          className="form-input max-w-full sm:max-w-[220px]"
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_ARTIKEL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="card p-10 text-center text-sm text-slate-500">Memuat data...</div>
        ) : paginatedArtikel.length === 0 ? (
          <div className="card p-10 text-center text-sm text-slate-500">
            Tidak ada artikel ditemukan.
          </div>
        ) : (
          paginatedArtikel.map((item, idx) => (
            <div
              key={item.id}
              className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5"
            >
              {/* Nomor urut */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {startIndex + idx + 1}
              </div>

              {item.gambar_artikel ? (
                <img
                  src={item.gambar_artikel}
                  alt={item.judul_artikel}
                  className="h-44 w-full flex-shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
                />
              ) : (
                <div className="flex h-44 w-full flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 sm:h-28 sm:w-40">
                  Tanpa gambar
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="badge badge-aktif mb-2 inline-block">
                  {item.kategori_artikel}
                </span>
                <h3 className="text-base font-bold text-slate-900">{item.judul_artikel}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
                  {stripHtml(item.isi_artikel)}
                </p>
                {/* Tanggal diperbarui */}
                <p className="mt-2 text-xs text-slate-400">
                  Diperbarui: <span className="font-medium text-slate-500">{formatDate(item.updated_at)}</span>
                </p>
              </div>

              <div className="flex flex-shrink-0 flex-col gap-2">
                <Link
                  to={`/artikel/${item.id}/edit`}
                  className="btn-outline btn-sm"
                >
                  Edit
                </Link>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => setDeleteTarget(item)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Komponen Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-card bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2.5 text-lg font-bold">Hapus Artikel?</h3>
            <p className="mb-5 text-sm text-slate-500">
              Yakin ingin menghapus <strong>{deleteTarget.judul_artikel}</strong>? Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                className="btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button className="btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}