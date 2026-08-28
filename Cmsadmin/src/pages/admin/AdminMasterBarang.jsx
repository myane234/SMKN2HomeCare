import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaBoxOpen, FaSlidersH } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllBarang, createBarangData, updateBarangData, deleteBarangData, updateGlobalBhpMargin } from '../../data/barangData';
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
  const [formTipe, setFormTipe] = useState('satuan');
  const [formMarginTipe, setFormMarginTipe] = useState('persen');
  const [formMarginNilai, setFormMarginNilai] = useState('');
  const [isMarginOpen, setIsMarginOpen] = useState(false);
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
    setFormTipe('satuan');
    setFormMarginTipe('persen');
    setFormMarginNilai('');
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedBarang(item);
    setFormNama(item.nama_bhp || '');
    setFormHarga(item.harga_modal || '');
    setFormTipe(item.tipe_bhp || 'satuan');
    setFormMarginTipe(item.tipe_margin || 'persen');
    setFormMarginNilai(item.nilai_margin ?? '');
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
      nama_bhp: formNama,
      tipe_bhp: formTipe,
      harga_modal: parseFloat(formHarga),
      tipe_margin: formMarginTipe,
      nilai_margin: parseFloat(formMarginNilai) || 0,
      is_active: true,
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

  const handleGlobalMargin = async (event) => {
    event.preventDefault();
    try {
      const updated = await updateGlobalBhpMargin({
        tipe_margin: formMarginTipe,
        nilai_margin: parseFloat(formMarginNilai) || 0,
      });
      setBarangList(updated);
      setIsMarginOpen(false);
      Swal.fire({ icon: 'success', title: 'Margin diperbarui', text: 'Margin semua barang dan harga jual berhasil dihitung ulang.', timer: 1600, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Margin global gagal diperbarui.' });
    }
  };

  const handleDeleteClick = (item) => {
    Swal.fire({
      title: 'Hapus Barang?',
      text: `Anda yakin ingin menghapus "${item.nama_bhp}"? Tindakan ini tidak dapat dibatalkan.`,
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
    const matchesSearch = item.nama_bhp?.toLowerCase().includes(search.toLowerCase());

    let matchesStok = true;
    if (filterStok === 'ada') matchesStok = item.is_active;
    if (filterStok === 'habis') matchesStok = !item.is_active;

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
          <p className="page-subtitle">Kelola barang BHP, harga jual, dan margin yang dipakai layanan.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={() => setIsMarginOpen(true)} className="btn-outline flex items-center justify-center gap-2">
          <FaSlidersH />
          <span>Margin Global</span>
        </button>
        <button onClick={handleAddClick} className="btn-primary flex items-center justify-center gap-2">
          <FaPlus />
          <span>Tambah Barang</span>
        </button>
        </div>
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
            <option value="">Semua Status</option>
            <option value="ada">Aktif</option>
            <option value="habis">Nonaktif</option>
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
                  <th className="border-b border-slate-200 px-4 py-3 text-center w-12">No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nama BHP</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Harga Modal</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Margin</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Harga Jual</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data barang yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const nomorUrut = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={item.id_bhp} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center font-medium text-slate-500">
                          {nomorUrut}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <FaBoxOpen className="text-base" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{item.nama_bhp}</div>
                              <div className="text-xs text-slate-400">ID: #{item.id_bhp}</div>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-medium text-slate-800">
                          {formatRupiah(item.harga_modal)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-semibold text-slate-700">
                          {item.tipe_margin === 'persen' ? `${item.nilai_margin}%` : formatRupiah(item.nilai_margin)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-semibold text-emerald-700">
                          {formatRupiah(item.harga_jual)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                          {item.is_active ? (
                            <span className="badge badge-aktif">Aktif</span>
                          ) : (
                            <span className="badge badge-nonaktif">Nonaktif</span>
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
                    );
                  })
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
                  <label className="form-label">Tipe BHP</label>
                  <select className="form-input" value={formTipe} onChange={(e) => setFormTipe(e.target.value)}><option value="satuan">Satuan</option><option value="paket">Paket</option></select>
                </div>

                <div>
                  <label className="form-label">Harga Modal (Rp)</label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">Tipe Margin</label><select className="form-input" value={formMarginTipe} onChange={(e) => setFormMarginTipe(e.target.value)}><option value="persen">Persen (%)</option><option value="nominal">Nominal (Rp)</option></select></div>
                  <div><label className="form-label">Nilai Margin</label><input type="number" required min="0" step="0.01" className="form-input" value={formMarginNilai} onChange={(e) => setFormMarginNilai(e.target.value)} /></div>
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

      {isMarginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleGlobalMargin} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-slate-900">Margin Global</h3>
            <p className="mb-5 text-sm text-slate-500">Terapkan nilai margin yang sama ke semua barang BHP.</p>
            <div className="grid grid-cols-2 gap-3"><div><label className="form-label">Tipe Margin</label><select className="form-input" value={formMarginTipe} onChange={(e) => setFormMarginTipe(e.target.value)}><option value="persen">Persen (%)</option><option value="nominal">Nominal (Rp)</option></select></div><div><label className="form-label">Nilai</label><input type="number" required min="0" step="0.01" className="form-input" value={formMarginNilai} onChange={(e) => setFormMarginNilai(e.target.value)} /></div></div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setIsMarginOpen(false)} className="btn-outline btn-sm">Batal</button><button type="submit" className="btn-primary btn-sm">Terapkan ke Semua</button></div>
          </form>
        </div>
      )}
    </div>
  );
}