import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaToggleOn, FaToggleOff, FaPlus, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Pagination from '../../components/pagination';
import {
  getAllWilayahLayanan,
  createWilayahLayanan,
  updateWilayahLayanan,
  deleteWilayahLayanan,
  toggleWilayahLayananStatus,
} from '../../data/wilayahLayananData';

export default function AdminMasterProvinsi() {
  const [provinsiList, setProvinsiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('nama_asc'); // 👈 State untuk sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formNama, setFormNama] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  const fetchData = () => {
    setLoading(true);
    getAllWilayahLayanan()
      .then((data) => {
        setProvinsiList(Array.isArray(data) ? data : []);
        setErrorMsg('');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data provinsi');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 💡 Filter & Sorting Logic
  const filteredData = useMemo(() => {
    let list = provinsiList.filter((item) => {
      const nama = item.nama_provinsi || item.nama_wilayah || item.nama || '';
      const kode = item.kode_provinsi || item.kode_wilayah || item.kode || item.id_provinsi || '';
      const searchText = `${nama} ${kode}`.toLowerCase();
      
      const matchesSearch = searchText.includes(search.toLowerCase());
      const statusValue = item.is_active === 1 || item.is_active === true ? '1' : '0';
      const matchesStatus = filterStatus === '' || statusValue === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // 🔄 Sorting Berdasarkan Pilihan
    return list.sort((a, b) => {
      const namaA = (a.nama_provinsi || a.nama_wilayah || a.nama || '').toLowerCase();
      const namaB = (b.nama_provinsi || b.nama_wilayah || b.nama || '').toLowerCase();
      const idA = Number(a.id_provinsi || a.id_wilayah_layanan || a.id || 0);
      const idB = Number(b.id_provinsi || b.id_wilayah_layanan || b.id || 0);

      if (sortBy === 'nama_asc') return namaA.localeCompare(namaB);
      if (sortBy === 'nama_desc') return namaB.localeCompare(namaA);
      if (sortBy === 'id_asc') return idA - idB;
      if (sortBy === 'id_desc') return idB - idA;
      return 0;
    });
  }, [provinsiList, search, filterStatus, sortBy]);

  const totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormNama('');
    setFormKode('');
    setFormActive(true);
  };

  const handleOpenAdd = () => {
    setSelectedItem(null);
    resetForm();
    setViewMode('add');
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormNama(item.nama_provinsi || item.nama_wilayah || item.nama || '');
    setFormKode(item.kode_provinsi || item.kode_wilayah || item.kode || '');
    setFormActive(item.is_active === 1 || item.is_active === true);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nama_provinsi: formNama,
      nama_wilayah: formNama,
      kode_wilayah: formKode,
      is_active: formActive ? 1 : 0,
    };

    try {
      const idTarget = selectedItem?.id_provinsi || selectedItem?.id_wilayah_layanan || selectedItem?.id;

      if (viewMode === 'edit' && selectedItem) {
        await updateWilayahLayanan(idTarget, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data provinsi berhasil diperbarui.' });
      } else {
        await createWilayahLayanan(payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data provinsi berhasil ditambahkan.' });
      }
      handleBackToList();
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan saat menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    const namaProv = item.nama_provinsi || item.nama_wilayah || item.nama;
    const idTarget = item.id_provinsi || item.id_wilayah_layanan || item.id;

    Swal.fire({
      title: 'Hapus Provinsi?',
      text: `Anda yakin ingin menghapus ${namaProv}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteWilayahLayanan(idTarget);
          Swal.fire('Terhapus!', 'Data provinsi berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal menghapus data provinsi.', 'error');
        }
      }
    });
  };

  const handleToggleStatus = (item) => {
    const isActive = item.is_active === 1 || item.is_active === true;
    const targetText = isActive ? 'menonaktifkan' : 'mengaktifkan';
    const namaProv = item.nama_provinsi || item.nama_wilayah || item.nama;
    const idTarget = item.id_provinsi || item.id_wilayah_layanan || item.id;

    Swal.fire({
      title: 'Ubah Status Provinsi?',
      text: `Apakah Anda yakin ingin ${targetText} provinsi ${namaProv}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await toggleWilayahLayananStatus(idTarget);
          Swal.fire('Berhasil!', 'Status provinsi berhasil diperbarui.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal mengubah status provinsi.', 'error');
        }
      }
    });
  };

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="mx-auto max-w-3xl pb-10">
        <button type="button" onClick={handleBackToList} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <FaArrowLeft /> Kembali ke Master Provinsi
        </button>
        <h1 className="page-title">{viewMode === 'add' ? 'Tambah Provinsi' : 'Edit Provinsi'}</h1>
        <p className="page-subtitle">Kelola nama provinsi, kode, dan status aktif/nonaktif.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div>
            <label className="form-label">Nama Provinsi</label>
            <input required value={formNama} onChange={(e) => setFormNama(e.target.value)} className="form-input" placeholder="Contoh: Jawa Barat" />
          </div>
          <div>
            <label className="form-label">Kode / ID Provinsi</label>
            <input value={formKode} onChange={(e) => setFormKode(e.target.value)} className="form-input" placeholder="Contoh: JB atau Kode ID (Opsional)" />
          </div>
          <div className="flex items-center gap-2">
            <input id="provinsi-active" type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
            <label htmlFor="provinsi-active" className="text-sm text-slate-700">Aktif</label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={handleBackToList} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Master Provinsi</h1>
          <p className="page-subtitle">Kelola data wilayah provinsi dan status aktif/nonaktifnya.</p>
        </div>
        <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <FaPlus /> Tambah Provinsi
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-card md:flex-row md:items-center">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          <FaSearch />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari provinsi..." className="w-full bg-transparent outline-none" />
        </div>

        {/* Filter Status */}
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none">
          <option value="">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>

        {/* 💡 Filter Sorting */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none">
          <option value="nama_asc">Urutkan: Nama (A - Z)</option>
          <option value="nama_desc">Urutkan: Nama (Z - A)</option>
          <option value="id_asc">Urutkan: ID (Kecil - Besar)</option>
          <option value="id_desc">Urutkan: ID (Besar - Kecil)</option>
        </select>
      </div>

      {errorMsg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}

      {loading ? (
        <div className="rounded-card border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Memuat data...</div>
      ) : (
        <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                {/* 💡 Header No */}
                <th className="w-12 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Provinsi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID / Kode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada data provinsi.</td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const isActive = item.is_active === 1 || item.is_active === true;
                  const keyId = item.id_provinsi || item.id_wilayah_layanan || item.id;
                  const namaProv = item.nama_provinsi || item.nama_wilayah || item.nama || '-';
                  const kodeProv = item.kode_provinsi || item.kode_wilayah || item.kode || item.id_provinsi || '-';
                  
                  // 💡 Hitung nomor urut
                  const nomorUrut = startIndex + index + 1;

                  return (
                    <tr key={keyId} className="border-t border-slate-200 hover:bg-slate-50">
                      {/* 💡 Kolom Nomor */}
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-500">{nomorUrut}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{namaProv}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{kodeProv}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleToggleStatus(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title={isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                            {isActive ? <FaToggleOn className="text-emerald-600" /> : <FaToggleOff className="text-slate-400" />}
                          </button>
                          <button onClick={() => handleOpenEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="Edit">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(item)} className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50" title="Hapus">
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
        </div>
      )}

      <div className="mt-5">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}