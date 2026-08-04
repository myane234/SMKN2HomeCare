import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaBoxOpen } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllBarang, createBarangData, updateBarangData, deleteBarangData } from '../../data/barangData';
import Swal from 'sweetalert2';

export default function DataBarang() {
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterStok, setFilterStok] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null); // null = Tambah, object = Edit

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formHarga, setFormHarga] = useState('');
  const [formStok, setFormStok] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = () => {
    getAllBarang()
      .then((data) => {
        setBarangList(data);
        setErrorMsg('');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data barang');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      fetchData();
    });
  }, []);

  const handleAddClick = () => {
    setSelectedBarang(null);
    setFormNama('');
    setFormHarga('');
    setFormStok('');
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedBarang(item);
    setFormNama(item.nama_barang || '');
    setFormHarga(item.harga_satuan || '');
    setFormStok(item.stok ?? '');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBarang(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nama_barang: formNama,
      harga_satuan: parseFloat(formHarga),
      stok: parseInt(formStok, 10),
    };

    try {
      if (selectedBarang) {
        await updateBarangData(selectedBarang.id_bhp, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data barang diperbarui!' });
      } else {
        await createBarangData(payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang baru ditambahkan!' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan saat menyimpan data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item) => {
    Swal.fire({
      title: 'Hapus Barang?',
      text: `Anda yakin ingin menghapus "${item.nama_barang}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteBarangData(item.id_bhp);
          Swal.fire('Terhapus!', 'Barang berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal menghapus barang.', 'error');
        }
      }
    });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  const filteredBarang = barangList.filter((item) => {
    const matchesSearch = item.nama_barang?.toLowerCase().includes(search.toLowerCase());

    let matchesStok = true;
    if (filterStok === 'ada') matchesStok = item.stok > 0;
    if (filterStok === 'habis') matchesStok = item.stok <= 0;

    return matchesSearch && matchesStok;
  });

  const totalPages = Math.max(Math.ceil(filteredBarang.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredBarang.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Master Data Barang (BHP)</h1>
          <p className="page-subtitle">Kelola inventaris Bahan Habis Pakai (BHP) dan penyesuaian stok medis.</p>
        </div>
        <button onClick={handleAddClick} className="btn-primary flex items-center justify-center gap-2">
          <FaPlus />
          <span>Tambah Barang</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-5 flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama barang..."
              className="w-full bg-transparent outline-none"
            />
          </div>

          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterStok}
            onChange={(e) => {
              setFilterStok(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Status Stok</option>
            <option value="ada">Stok Tersedia (&gt; 0)</option>
            <option value="habis">Stok Habis (0)</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {/* Table Section */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data barang...</p>
          ) : (
            <table className="w-full min-w-180 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nama Barang</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Harga Satuan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Jumlah Stok</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data barang yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id_bhp} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <FaBoxOpen className="text-base" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.nama_barang}</div>
                            <div className="text-xs text-slate-400">ID: #{item.id_bhp}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-medium text-slate-800">
                        {formatRupiah(item.harga_satuan)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center font-semibold text-slate-700">
                        {item.stok}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        {item.stok > 0 ? (
                          <span className="badge badge-aktif">Tersedia</span>
                        ) : (
                          <span className="badge badge-nonaktif">Habis</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Edit */}
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Barang"
                          >
                            <FaEdit />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            title="Hapus Barang"
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

        {!loading && filteredBarang.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Modal Form (Tambah / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform scale-100 transition-transform">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedBarang ? 'Edit Barang (BHP)' : 'Tambah Barang (BHP) Baru'}
              </h3>
              <button onClick={handleModalClose} className="text-slate-400 hover:text-slate-600 font-semibold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="form-label">Nama Barang / BHP</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Handschoen Steril L"
                    className="form-input"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 15000"
                    className="form-input"
                    value={formHarga}
                    onChange={(e) => setFormHarga(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Jumlah Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 100"
                    className="form-input"
                    value={formStok}
                    onChange={(e) => setFormStok(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={handleModalClose} className="btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary btn-sm">
                  {isSubmitting ? 'Menyimpan...' : selectedBarang ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}