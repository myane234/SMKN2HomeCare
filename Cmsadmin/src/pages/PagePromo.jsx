
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePromo, getAllPromo } from '../data/PromoEndpoint';
import { getImageUrl } from '../data/imageHelper.js';
import Pagination from '../components/pagination';

const ITEMS_PER_PAGE = 5;

// Mengambil tanggal tanpa menggeser timezone.
function getDateOnly(value) {
  if (!value) return null;

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : null;
}

function getJakartaToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value) {
  const dateString = getDateOnly(value);

  if (!dateString) return '-';

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Mengambil nama layanan dari relasi tunggal API.
function getLayananName(item) {
  return item?.layanan?.nama_layanan || '-';
}

// Menentukan status promo.
function getPromoStatus(item) {
  const statusPromo = String(item.status_promo ?? '')
    .trim()
    .toLowerCase();

  const statusAktual = String(item.status_aktual ?? '')
    .trim()
    .toLowerCase();

  // Status manual dari admin tetap menjadi prioritas.
  if (statusPromo && statusPromo !== 'aktif') {
    return item.status_promo;
  }

  // Gunakan status aktual dari backend jika tersedia.
  if (statusAktual) {
    const statusMap = {
      aktif: 'Aktif',
      kedaluwarsa: 'Kedaluwarsa',
      'belum dimulai': 'Belum Dimulai',
      'tidak aktif': 'Tidak Aktif',
    };

    return statusMap[statusAktual] || item.status_aktual;
  }

  // Fallback perhitungan tanggal jika status_aktual tidak tersedia.
  const today = getJakartaToday();
  const tanggalMulai = getDateOnly(item.tanggal_mulai);
  const tanggalBerakhir = getDateOnly(item.tanggal_berakhir);

  if (tanggalMulai && today < tanggalMulai) {
    return 'Belum Dimulai';
  }

  if (tanggalBerakhir && today > tanggalBerakhir) {
    return 'Kedaluwarsa';
  }

  return statusPromo === 'aktif' ? 'Aktif' : 'Tidak Aktif';
}

function getStatusStyle(status) {
  switch (status) {
    case 'Aktif':
      return 'bg-green-100 text-green-700';

    case 'Kedaluwarsa':
      return 'bg-red-100 text-red-700';

    case 'Belum Dimulai':
      return 'bg-amber-100 text-amber-700';

    default:
      return 'bg-slate-100 text-slate-600';
  }
}

// Urutan status: Aktif -> Belum Dimulai -> Kedaluwarsa -> Tidak Aktif.
function getStatusPriority(item) {
  const status = getPromoStatus(item);

  const priorities = {
    Aktif: 1,
    'Belum Dimulai': 2,
    Kedaluwarsa: 3,
    'Tidak Aktif': 4,
  };

  return priorities[status] ?? 5;
}

// Dalam kelompok status yang sama, promo lama tetap di atas.
function sortPromos(data) {
  return [...data].sort((a, b) => {
    const statusDifference =
      getStatusPriority(a) - getStatusPriority(b);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    const validA = Number.isFinite(dateA);
    const validB = Number.isFinite(dateB);

    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;

    return dateA - dateB;
  });
}

function formatDiscount(item) {
  const value = Number(item.nilai_diskon);

  if (!Number.isFinite(value)) return '-';

  if (String(item.tipe_diskon).toLowerCase() === 'persen') {
    return `${value.toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    })}%`;
  }

  return `Rp ${value.toLocaleString('id-ID')}`;
}

function getPromoId(item) {
  return item.id_promo ?? item.id;
}

function extractPromoArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;

  return [];
}

export default function PagePromo() {
  const [promo, setPromo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    setLoading(true);
    setLoadError('');

    try {
      const response = await getAllPromo();
      const data = extractPromoArray(response);

      setPromo(sortPromos(data));
    } catch (error) {
      console.error('Gagal mengambil data promo:', error);
      setPromo([]);
      setLoadError('Gagal memuat data promo. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pencarian berdasarkan deskripsi dan nama layanan.
  const filtered = promo.filter((item) => {
    const query = search.trim().toLowerCase();

    const deskripsi = String(item.deskripsi ?? '').toLowerCase();
    const namaLayanan = getLayananName(item).toLowerCase();

    return (
      deskripsi.includes(query) ||
      namaLayanan.includes(query)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginated = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deletePromo(getPromoId(deleteTarget));

      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      console.error('Gagal menghapus promo:', error);
      alert(error.message || 'Gagal menghapus promo.');
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
          <p className="page-subtitle">
            Kelola semua promo HomeCare di sini
          </p>
        </div>

        <Link to="/promo/tambah" className="btn-primary">
          + Tambah Promo
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari deskripsi atau layanan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input max-w-full sm:max-w-[340px]"
        />
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Memuat data...
          </p>
        ) : loadError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>

            <button
              type="button"
              onClick={loadData}
              className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Tidak ada promo ditemukan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    No
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Gambar
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deskripsi Promo
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Diskon
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Layanan
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Diperbarui
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((item, idx) => {
                  const promoId = getPromoId(item);
                  const layananLabel = getLayananName(item);
                  const status = getPromoStatus(item);
                  const diskonLabel = formatDiscount(item);

                  const imagePath =
                    item.gambar_promo_url || item.gambar_promo;

                  const imageUrl = imagePath
                    ? getImageUrl(imagePath)
                    : '';

                  return (
                    <tr
                      key={promoId}
                      className="hover:bg-slate-50"
                    >
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-medium text-slate-400">
                        {startIndex + idx + 1}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={layananLabel}
                            className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                            No img
                          </div>
                        )}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-medium">
                        {item.deskripsi ?? '-'}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-semibold text-sky-600">
                        {diskonLabel}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {layananLabel}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${getStatusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap border-b border-slate-200 px-4 py-3.5 text-sm text-slate-500">
                        {formatDate(item.updated_at)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/promo/${promoId}/edit`}
                            className="btn-outline btn-sm"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
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
        {!loading && !loadError && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <p className="text-sm text-slate-500">
              Menampilkan{' '}
              <span className="font-medium">{startIndex + 1}</span>
              {' sampai '}
              <span className="font-semibold">
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filtered.length
                )}
              </span>
              {' dari '}
              <span className="font-medium">{filtered.length}</span>
              {' data'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !loadError && filtered.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
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
            <h3 className="mb-2.5 text-lg font-bold">
              Hapus Promo?
            </h3>

            <p className="mb-5 text-sm text-slate-500">
              Yakin ingin menghapus promo untuk layanan{' '}
              <strong>
                {getLayananName(deleteTarget)}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
