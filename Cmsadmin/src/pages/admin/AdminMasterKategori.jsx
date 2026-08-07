import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaLayerGroup, FaNewspaper } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import Swal from 'sweetalert2';
import {
  getAllKategoriLayanan,
  createKategoriLayanan,
  updateKategoriLayanan,
  deleteKategoriLayanan,
  getAllKategoriArtikel,
  createKategoriArtikel,
  updateKategoriArtikel,
  deleteKategoriArtikel,
} from '../../data/kategoriData';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-komponen: Tabel Kategori (dipakai oleh kedua tab)
// ─────────────────────────────────────────────────────────────────────────────
function KategoriTable({
  title,
  subtitle,
  icon: Icon,
  iconBgClass,
  iconTextClass,
  data,
  loading,
  errorMsg,
  search,
  onSearchChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  idKey,
  labelKey,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = data.filter((item) =>
    (item[labelKey] ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(Math.ceil(filtered.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button onClick={onAddClick} className="btn-primary flex items-center justify-center gap-2">
          <FaPlus />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          <FaSearch />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Cari ${title.toLowerCase()}...`}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : (
            <table className="w-full min-w-120 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 text-center w-14">#</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nama Kategori</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data kategori yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, index) => (
                    <tr key={item[idKey]} className="hover:bg-slate-50 transition-colors">
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center text-slate-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconBgClass} ${iconTextClass}`}>
                            <Icon className="text-base" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item[labelKey]}</div>
                            {/* <div className="text-xs text-slate-400">ID: #{item[idKey]}</div> */}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditClick(item)}
                            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Kategori"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => onDeleteClick(item)}
                            className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            title="Hapus Kategori"
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
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminMasterKategori() {
  // Tab: 'layanan' | 'artikel'
  const [activeTab, setActiveTab] = useState('layanan');

  // ── Kategori Layanan State ─────────────────────────────────────────────────
  const [layananList, setLayananList] = useState([]);
  const [layananLoading, setLayananLoading] = useState(true);
  const [layananError, setLayananError] = useState('');
  const [layananSearch, setLayananSearch] = useState('');

  // ── Kategori Artikel State ─────────────────────────────────────────────────
  const [artikelList, setArtikelList] = useState([]);
  const [artikelLoading, setArtikelLoading] = useState(true);
  const [artikelError, setArtikelError] = useState('');
  const [artikelSearch, setArtikelSearch] = useState('');

  // ── Modal State ────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('layanan'); // 'layanan' | 'artikel'
  const [selectedItem, setSelectedItem] = useState(null); // null = Tambah, object = Edit
  const [formNama, setFormNama] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLayanan = () => {
    setLayananLoading(true);
    getAllKategoriLayanan()
      .then((data) => { setLayananList(data); setLayananError(''); })
      .catch((err) => setLayananError(err.message || 'Gagal memuat kategori layanan'))
      .finally(() => setLayananLoading(false));
  };

  const fetchArtikel = () => {
    setArtikelLoading(true);
    getAllKategoriArtikel()
      .then((data) => { setArtikelList(data); setArtikelError(''); })
      .catch((err) => setArtikelError(err.message || 'Gagal memuat kategori artikel'))
      .finally(() => setArtikelLoading(false));
  };

  useEffect(() => {
    fetchLayanan();
    fetchArtikel();
  }, []);

  // ── Modal Handlers ─────────────────────────────────────────────────────────
  const openAddModal = (mode) => {
    setModalMode(mode);
    setSelectedItem(null);
    setFormNama('');
    setIsModalOpen(true);
  };

  const openEditModal = (mode, item) => {
    setModalMode(mode);
    setSelectedItem(item);
    const labelKey = mode === 'layanan' ? 'nama_kategori' : 'nama_kategori';
    setFormNama(item[labelKey] || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormNama('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { nama_kategori: formNama };
    const isLayanan = modalMode === 'layanan';
    const idKey = isLayanan ? 'id_kategori_layanan' : 'id_kategori_artikel';

    try {
      if (selectedItem) {
        if (isLayanan) {
          await updateKategoriLayanan(selectedItem[idKey], payload);
        } else {
          await updateKategoriArtikel(selectedItem[idKey], payload);
        }
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori berhasil diperbarui!' });
      } else {
        if (isLayanan) {
          await createKategoriLayanan(payload);
        } else {
          await createKategoriArtikel(payload);
        }
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori baru berhasil ditambahkan!' });
      }
      closeModal();
      if (isLayanan) fetchLayanan(); else fetchArtikel();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan saat menyimpan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (mode, item) => {
    const isLayanan = mode === 'layanan';
    const idKey = isLayanan ? 'id_kategori_layanan' : 'id_kategori_artikel';

    Swal.fire({
      title: 'Hapus Kategori?',
      text: `Anda yakin ingin menghapus "${item.nama_kategori}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (isLayanan) {
            await deleteKategoriLayanan(item[idKey]);
          } else {
            await deleteKategoriArtikel(item[idKey]);
          }
          Swal.fire('Terhapus!', 'Kategori berhasil dihapus.', 'success');
          if (isLayanan) fetchLayanan(); else fetchArtikel();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal menghapus kategori.', 'error');
        }
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="page-title">Master Kategori</h1>
        <p className="page-subtitle">Kelola kategori layanan dan kategori artikel HomeCare.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('layanan')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
            activeTab === 'layanan'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FaLayerGroup className="text-xs" />
          Kategori Layanan
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'layanan' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
            {layananList.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('artikel')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
            activeTab === 'artikel'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FaNewspaper className="text-xs" />
          Kategori Artikel
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'artikel' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
            {artikelList.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'layanan' && (
        <KategoriTable
          title="Kategori Layanan"
          subtitle="Kelola master kategori layanan homecare (Perawatan Luka, Fisioterapi, dll.)"
          icon={FaLayerGroup}
          iconBgClass="bg-indigo-50 border-indigo-200"
          iconTextClass="text-indigo-600"
          data={layananList}
          loading={layananLoading}
          errorMsg={layananError}
          search={layananSearch}
          onSearchChange={setLayananSearch}
          onAddClick={() => openAddModal('layanan')}
          onEditClick={(item) => openEditModal('layanan', item)}
          onDeleteClick={(item) => handleDelete('layanan', item)}
          idKey="id_kategori_layanan"
          labelKey="nama_kategori"
        />
      )}

      {activeTab === 'artikel' && (
        <KategoriTable
          title="Kategori Artikel"
          subtitle="Kelola master kategori artikel & konten informatif."
          icon={FaNewspaper}
          iconBgClass="bg-emerald-50 border-emerald-200"
          iconTextClass="text-emerald-600"
          data={artikelList}
          loading={artikelLoading}
          errorMsg={artikelError}
          search={artikelSearch}
          onSearchChange={setArtikelSearch}
          onAddClick={() => openAddModal('artikel')}
          onEditClick={(item) => openEditModal('artikel', item)}
          onDeleteClick={(item) => handleDelete('artikel', item)}
          idKey="id_kategori_artikel"
          labelKey="nama_kategori"
        />
      )}

      {/* ── Modal Form (Tambah / Edit) ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  modalMode === 'layanan'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {modalMode === 'layanan' ? <FaLayerGroup /> : <FaNewspaper />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedItem ? 'Edit' : 'Tambah'} Kategori{' '}
                  {modalMode === 'layanan' ? 'Layanan' : 'Artikel'}
                </h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg font-semibold leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="mb-5">
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    modalMode === 'layanan'
                      ? 'Contoh: Perawatan Luka'
                      : 'Contoh: Info Medis'
                  }
                  className="form-input"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeModal} className="btn-outline btn-sm">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors ${
                    modalMode === 'layanan'
                      ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  }`}
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : selectedItem
                    ? 'Simpan Perubahan'
                    : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
