import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePromo, getAllPromo } from '../data/PromoEndpoint';
import { getImageUrl } from '../data/imageHelper.js';
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

const ITEMS_PER_PAGE = 3;

export default function PagePromo() {
  const [promo, setPromo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  function loadData() {
    setLoading(true);
    getAllPromo()
      .then((data) => {
        setPromo(data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Logika Filter
  const filtered = promo.filter((item) => {
    const query = search.toLowerCase();
    const nama = String(item.nama_paket ?? '').toLowerCase();
    const layanan = String(
      Array.isArray(item.layanans)
        ? item.layanans.map((l) => l.nama_layanan ?? l.nama ?? '').join(' ')
        : ''
    ).toLowerCase();
    return nama.includes(query) || layanan.includes(query);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Logika Hapus
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromo(deleteTarget.id ?? deleteTarget.id_promo);
      loadData();
      setDeleteTarget(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Promo</h1>
          <p className="page-subtitle">Kelola semua paket promo HomeCare di sini</p>
        </div>
        <Link to="/promo/tambah" className="btn-primary">
          + Tambah Promo
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama paket atau layanan..."
          value={search}
          onChange={handleSearchChange}
          className="form-input max-w-full sm:max-w-[340px]"
        />
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">Tidak ada promo ditemukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Gambar</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nama Paket</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Diskon</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Diperbarui</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, idx) => {
                  const promoId = item.id_promo ?? item.id;
                  const layananLabel = Array.isArray(item.layanans)
                    ? item.layanans.map((l) => l.nama_layanan ?? l.nama ?? l.id).join(', ')
                    : '-';

                  return (
                    <tr key={promoId} className="hover:bg-slate-50">
                      {/* Nomor */}
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-slate-400 font-medium">
                        {startIndex + idx + 1}
                      </td>
                      {/* Kolom Gambar */}
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {item.gambar_promo ? (
                          <img
                            src={getImageUrl(item.gambar_promo)}
                            alt={item.nama_paket}
                            className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-medium">{item.nama_paket ?? '-'}</td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">{item.diskon_persen ?? item.potongan_harga ?? '-'}%</td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">{layananLabel}</td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.status_promo === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.status_promo ?? '-'}
                        </span>
                      </td>
                      {/* Kolom Diperbarui */}
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex justify-end gap-2">
                          <Link to={`/promo/${promoId}/edit`} className="btn-outline btn-sm">Edit</Link>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Bar Info */}
        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
              <span className="font-semibold">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{' '}
              dari <span className="font-medium">{filtered.length}</span> data
            </p>
          </div>
        )}
      </div>

      {/* Pagination Component */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modal Delete */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-card bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2.5 text-lg font-bold">Hapus Promo?</h3>
            <p className="mb-5 text-sm text-slate-500">
              Yakin ingin menghapus <strong>{deleteTarget.nama_paket ?? '-'}</strong>? Tindakan ini tidak dapat dibatalkan.
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