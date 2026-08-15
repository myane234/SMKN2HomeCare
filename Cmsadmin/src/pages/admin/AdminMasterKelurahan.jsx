import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllKelurahan,
  createKelurahan,
  updateKelurahan,
  deleteKelurahan,
  getAllKecamatan, // 1. Import function to fetch kecamatan
} from '../../data/wilayahLayananData';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaMapMarkerAlt,
} from 'react-icons/fa';

export default function AdminMasterKelurahan() {
  const [listKelurahan, setListKelurahan] = useState([]);
  const [listKecamatan, setListKecamatan] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Urutkan: Nama (A - Z)');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Modal (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id_kelurahan: '',
    id_kecamatan: '',
    nama_kelurahan: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Fetch both Kelurahan and Kecamatan in parallel
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resKelurahan, resKecamatan] = await Promise.all([
        getAllKelurahan().catch((err) => {
          console.error('Gagal mengambil kelurahan:', err);
          return [];
        }),
        getAllKecamatan().catch((err) => {
          console.error('Gagal mengambil kecamatan:', err);
          return [];
        }),
      ]);

      setListKelurahan(resKelurahan || []);
      setListKecamatan(resKecamatan || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mencari nama kecamatan
  const getNamaKecamatan = (idKec, item) => {
    if (item?.kecamatan?.nama_kecamatan) return item.kecamatan.nama_kecamatan;
    if (item?.nama_kecamatan) return item.nama_kecamatan;

    const found = listKecamatan.find(
      (k) => String(k.id_kecamatan || k.id) === String(idKec)
    );
    if (found) return found.nama_kecamatan || found.nama;

    return idKec ? `Kecamatan (${idKec})` : '-';
  };

  // Filter & Sorting Logic
  const filteredData = useMemo(() => {
    return listKelurahan
      .filter((item) => {
        const namaKel = item.nama_kelurahan || item.nama || '';
        const idKel = String(item.id_kelurahan || item.id || '');
        const idKec = String(item.id_kecamatan || '');
        const namaKec = getNamaKecamatan(idKec, item);

        return (
          namaKel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          namaKec.toLowerCase().includes(searchTerm.toLowerCase()) ||
          idKel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          idKec.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => {
        const nameA = a.nama_kelurahan || a.nama || '';
        const nameB = b.nama_kelurahan || b.nama || '';
        const idA = String(a.id_kelurahan || a.id || '');
        const idB = String(b.id_kelurahan || b.id || '');

        if (sortBy === 'Urutkan: Nama (A - Z)') {
          return nameA.localeCompare(nameB);
        } else if (sortBy === 'Urutkan: Nama (Z - A)') {
          return nameB.localeCompare(nameA);
        } else if (sortBy === 'Urutkan: ID (Kecil - Besar)') {
          return idA.localeCompare(idB, undefined, { numeric: true });
        } else if (sortBy === 'Urutkan: ID (Besar - Kecil)') {
          return idB.localeCompare(idA, undefined, { numeric: true });
        }
        return 0;
      });
  }, [listKelurahan, listKecamatan, searchTerm, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Modal Handler
  const handleOpenCreateModal = () => {
    setEditItem(null);
    setFormData({
      id_kelurahan: '',
      id_kecamatan: '',
      nama_kelurahan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setFormData({
      id_kelurahan: item.id_kelurahan || item.id || '',
      id_kecamatan: item.id_kecamatan || '',
      nama_kelurahan: item.nama_kelurahan || item.nama || '',
    });
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const payload = {
          id_kecamatan: formData.id_kecamatan,
          nama_kelurahan: formData.nama_kelurahan,
        };
        const targetId = editItem.id_kelurahan || editItem.id;
        await updateKelurahan(targetId, payload);
      } else {
        const payload = {
          id_kelurahan: formData.id_kelurahan,
          id_kecamatan: formData.id_kecamatan,
          nama_kelurahan: formData.nama_kelurahan,
        };
        await createKelurahan(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data');
    }
  };

  // Delete Handler
  const handleDelete = async (idKelurahan) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kelurahan ini?')) {
      try {
        await deleteKelurahan(idKelurahan);
        fetchData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus data');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Master Kelurahan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data kelurahan berdasarkan kecamatan.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm w-full sm:w-auto cursor-pointer"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Kelurahan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari kelurahan atau kecamatan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        <div className="w-full md:w-auto shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Urutkan: Nama (A - Z)">Urutkan: Nama (A - Z)</option>
            <option value="Urutkan: Nama (Z - A)">Urutkan: Nama (Z - A)</option>
            <option value="Urutkan: ID (Kecil - Besar)">Urutkan: ID (Kecil - Besar)</option>
            <option value="Urutkan: ID (Besar - Kecil)">Urutkan: ID (Besar - Kecil)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data...</div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Tidak ada data kelurahan ditemukan.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <th className="py-4 px-6 w-16 text-center">NO</th>
                    <th className="py-4 px-6">NAMA KELURAHAN</th>
                    <th className="py-4 px-6">KECAMATAN</th>
                    <th className="py-4 px-6">KODE / ID KELURAHAN</th>
                    <th className="py-4 px-6 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedData.map((item, index) => {
                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    const idKel = item.id_kelurahan || item.id || '-';
                    const idKec = item.id_kecamatan || '';
                    const namaKec = getNamaKecamatan(idKec, item);

                    return (
                      <tr key={idKel || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-500 text-center">{rowIndex}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800 uppercase">
                          {item.nama_kelurahan || item.nama || '-'}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-600">{namaKec}</td>
                        <td className="py-4 px-6 font-medium text-slate-600">{idKel}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit"
                              className="p-2 bg-white border border-slate-200 shadow-sm rounded-md text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(idKel)}
                              title="Hapus"
                              className="p-2 bg-white border border-slate-200 shadow-sm rounded-md text-rose-500 hover:text-white hover:bg-rose-500 transition-colors cursor-pointer"
                            >
                              <FaTrashAlt className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedData.map((item, index) => {
                const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;
                const idKel = item.id_kelurahan || item.id || '-';
                const idKec = item.id_kecamatan || '';
                const namaKec = getNamaKecamatan(idKec, item);

                return (
                  <div key={idKel || index} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {rowIndex}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base uppercase">
                          {item.nama_kelurahan || item.nama || '-'}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-slate-600 hover:text-emerald-600 rounded-md bg-slate-50 border border-slate-200 active:scale-95 transition-transform"
                          title="Edit"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(idKel)}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-md bg-rose-50 border border-rose-100 active:scale-95 transition-transform"
                          title="Hapus"
                        >
                          <FaTrashAlt className="text-xs" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mt-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <FaMapMarkerAlt className="text-emerald-600 shrink-0" />
                        <span>Kecamatan: {namaKec}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-slate-400">
                        <span>Kode / ID Kelurahan:</span>
                        <span className="font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {idKel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer / Pagination Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 border-t border-slate-100 bg-white text-xs text-slate-500">
          <div className="text-center sm:text-left">
            Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-xs cursor-pointer"
            >
              Sebelumnya
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {(() => {
                const pages = [];
                const delta = 1;

                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= currentPage - delta && i <= currentPage + delta)
                  ) {
                    pages.push(i);
                  } else if (
                    (i === currentPage - delta - 1 && i > 1) ||
                    (i === currentPage + delta + 1 && i < totalPages)
                  ) {
                    pages.push('...');
                  }
                }

                const filteredPages = pages.filter(
                  (item, index) => pages.indexOf(item) === index
                );

                return filteredPages.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-medium select-none">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-md font-medium transition-colors shadow-xs cursor-pointer ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-xs cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">
              {editItem ? 'Edit Kelurahan' : 'Tambah Kelurahan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kode / ID Kelurahan */}
              {!editItem && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kode / ID Kelurahan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id_kelurahan}
                    onChange={(e) => setFormData({ ...formData, id_kelurahan: e.target.value })}
                    placeholder="Contoh: 1217090016"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              )}

              {/* 3. Dropdown Select for Kecamatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kecamatan
                </label>
                <select
                  required
                  value={formData.id_kecamatan}
                  onChange={(e) => setFormData({ ...formData, id_kecamatan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {listKecamatan.map((kec) => {
                    const id = kec.id_kecamatan || kec.id;
                    const nama = kec.nama_kecamatan || kec.nama;
                    return (
                      <option key={id} value={id}>
                        {nama} ({id})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Nama Kelurahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kelurahan
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={formData.nama_kelurahan}
                  onChange={(e) => setFormData({ ...formData, nama_kelurahan: e.target.value })}
                  placeholder="Masukkan Nama Kelurahan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}