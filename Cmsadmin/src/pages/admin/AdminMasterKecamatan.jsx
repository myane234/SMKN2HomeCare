import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAllKecamatan, 
  createKecamatan, 
  updateKecamatan, 
  deleteKecamatan,
  getAllKotaKabupaten 
} from '../../data/wilayahLayananData';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';

export default function AdminMasterKecamatan() {
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter, Search, & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Urutkan: Nama (A - Z)');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Modal (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form Input State Sesuai API cURL
  const [formData, setFormData] = useState({
    id_kecamatan: '',
    regency_id: '',
    nama_kecamatan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataKecamatan, dataKota] = await Promise.all([
        getAllKecamatan().catch(() => []),
        getAllKotaKabupaten().catch(() => []),
      ]);

      setKecamatanList(Array.isArray(dataKecamatan) ? dataKecamatan : []);
      setKotaList(Array.isArray(dataKota) ? dataKota : []);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sorting Logic
  const filteredData = useMemo(() => {
    return kecamatanList
      .filter((item) => {
        const matchesSearch =
          item.nama_kecamatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.id_kecamatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.regency_id || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'Urutkan: Nama (A - Z)') {
          return (a.nama_kecamatan || '').localeCompare(b.nama_kecamatan || '');
        } else if (sortBy === 'Urutkan: Nama (Z - A)') {
          return (b.nama_kecamatan || '').localeCompare(a.nama_kecamatan || '');
        } else if (sortBy === 'Urutkan: ID (A - Z)') {
          return (a.id_kecamatan || '').localeCompare(b.id_kecamatan || '');
        } else if (sortBy === 'Urutkan: ID (Z - A)') {
          return (b.id_kecamatan || '').localeCompare(a.id_kecamatan || '');
        }
        return 0;
      });
  }, [kecamatanList, searchTerm, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Handler Open Modal
  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormData({ id_kecamatan: '', regency_id: '', nama_kecamatan: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEdit(true);
    setCurrentId(item.id_kecamatan);
    setFormData({
      id_kecamatan: item.id_kecamatan || '',
      regency_id: item.regency_id || '',
      nama_kecamatan: item.nama_kecamatan || ''
    });
    setIsModalOpen(true);
  };

  // Submit Handler Sesuai cURL POST & PUT
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateKecamatan(currentId, {
          regency_id: formData.regency_id,
          nama_kecamatan: formData.nama_kecamatan
        });
      } else {
        await createKecamatan(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message || 'Gagal menyimpan data'}`);
    }
  };

  // Delete Handler
  const handleDelete = async (idKecamatan) => {
    if (window.confirm('Apakah kamu yakin ingin menghapus data kecamatan ini?')) {
      try {
        await deleteKecamatan(idKecamatan);
        fetchData();
      } catch (err) {
        alert(`Error: ${err.message || 'Gagal menghapus data'}`);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Master Kecamatan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data wilayah kecamatan beserta relasi ID kabupatennya.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Kecamatan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari kecamatan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* Sorting */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Urutkan: Nama (A - Z)">Urutkan: Nama (A - Z)</option>
            <option value="Urutkan: Nama (Z - A)">Urutkan: Nama (Z - A)</option>
            <option value="Urutkan: ID (A - Z)">Urutkan: ID (A - Z)</option>
            <option value="Urutkan: ID (Z - A)">Urutkan: ID (Z - A)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-16 text-center">NO</th>
                  <th className="py-4 px-4 sm:px-6">NAMA KECAMATAN</th>
                  <th className="py-4 px-4 sm:px-6">ID KECAMATAN</th>
                  <th className="py-4 px-4 sm:px-6">REGENCY ID</th>
                  <th className="py-4 px-4 sm:px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      Tidak ada data kecamatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;

                    return (
                      <tr key={item.id_kecamatan || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-500 text-center">{rowIndex}</td>
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 uppercase">
                          {item.nama_kecamatan}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-600">{item.id_kecamatan}</td>
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-600">{item.regency_id}</td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit"
                              className="p-2 bg-white border border-slate-200 shadow-sm rounded-md text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_kecamatan)}
                              title="Hapus"
                              className="p-2 bg-white border border-slate-200 shadow-sm rounded-md text-rose-500 hover:text-white hover:bg-rose-500 transition-colors"
                            >
                              <FaTrashAlt className="text-sm" />
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

        {/* Footer / Pagination Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 border-t border-slate-100 bg-white text-xs text-slate-500">
          <div className="text-center sm:text-left">
            Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              ← Sebelumnya
            </button>

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
                    className={`w-8 h-8 rounded-md font-medium transition-colors shadow-sm ${
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

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 my-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {isEdit ? 'Edit Kecamatan' : 'Tambah Kecamatan Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ID Kecamatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.id_kecamatan}
                  onChange={(e) => setFormData({ ...formData, id_kecamatan: e.target.value })}
                  disabled={isEdit}
                  placeholder="Contoh: 3201010"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kecamatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_kecamatan}
                  onChange={(e) => setFormData({ ...formData, nama_kecamatan: e.target.value })}
                  placeholder="Masukkan Nama Kecamatan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pilih Kabupaten / Kota (Regency ID)
                </label>
                <select
                  required
                  value={formData.regency_id}
                  onChange={(e) => setFormData({ ...formData, regency_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="">-- Pilih Kabupaten / Kota --</option>
                  {kotaList.map((kota) => (
                    <option key={kota.id_kota || kota.id} value={kota.id_kota || kota.id}>
                      {kota.nama_kota || kota.nama} (ID: {kota.id_kota || kota.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors text-center"
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