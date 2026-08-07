import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllLayanan, deleteLayanan } from '../data/layananData';
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

const ITEMS_PER_PAGE = 5;

export default function PageLayanan() {
  const [layanan, setLayanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  function loadData() {
    setLoading(true);
    getAllLayanan()
      .then((data) => {
        setLayanan(data || []);
      })
      .catch((err) => console.error('Error fetching data:', err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Logika Filter yang Aman dari Nilai Null/Undefined
  const filtered = layanan.filter((item) => {
    const nama = String(item.nama ?? '').toLowerCase();
    const kategori = String(item.kategori ?? '').toLowerCase();
    const query = search.toLowerCase();
    return nama.includes(query) || kategori.includes(query);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLayanan(deleteTarget.id);
      loadData();
      setDeleteTarget(null);
    } catch (error) {
      alert(error.message || 'Gagal menghapus data');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Layanan</h1>
          <p className="page-subtitle">Kelola semua layanan HomeCare di sini</p>
        </div>
        <Link to="/layanan/tambah" className="btn-primary">
          + Tambah Layanan
        </Link>
      </div>

      {/* Input Pencarian */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau kategori layanan..."
          value={search}
          onChange={handleSearchChange}
          className="form-input max-w-full sm:max-w-[340px]"
        />
      </div>

      {/* Tabel Data */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">Tidak ada layanan ditemukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Gambar</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nama Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Kategori</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Harga</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tipe Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Durasi</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Transport</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Diperbarui</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-slate-400 font-medium">
                      {startIndex + idx + 1}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      {item.gambar ? (
                        <img
                          src={item.gambar}
                          alt={item.nama}
                          className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">{item.nama ?? '-'}</td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">{item.kategori ?? '-'}</td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm capitalize">
                      {item.tipe_layanan || 'Tindakan'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      {item.tipe_layanan === 'durasi' ? `${item.durasi} menit` : '-'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      {item.transport ? 'Ya' : 'Tidak'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      <div className="flex justify-end gap-2">
                        <Link to={`/layanan/${item.id}/edit`} className="btn-outline btn-sm">
                          Edit
                        </Link>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Jumlah Data di Bawah Kartu */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
              <span className="font-semibold">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{' '}
              dari <span className="font-semibold">{filtered.length}</span> data
            </p>
          </div>
        )}
      </div>

      {/* Komponen Pagination Navigasi Halaman */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

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
            <h3 className="mb-2.5 text-lg font-bold">Hapus Layanan?</h3>
            <p className="mb-5 text-sm text-slate-500">
              Yakin ingin menghapus <strong>{deleteTarget.nama}</strong>? Tindakan ini
              tidak dapat dibatalkan.
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