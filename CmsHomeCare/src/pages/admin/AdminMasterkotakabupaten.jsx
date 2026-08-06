import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllKotaKabupaten,
  createKotaKabupaten,
  updateKotaKabupaten,
  deleteKotaKabupaten,
  getAllWilayahLayanan,
} from '../../data/wilayahLayananData';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';

export default function MasterKotaKabupaten() {
  const [listKabupaten, setListKabupaten] = useState([]);
  const [listProvinsi, setListProvinsi] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter, Search, & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status'); // 'Semua Status', 'Aktif', 'Tidak Aktif'
  const [sortBy, setSortBy] = useState('Urutkan: Nama (A - Z)'); // Sesuai pilihan provinsi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Modal (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id_provinsi: '',
    nama_kota: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resKabupaten, resProvinsi] = await Promise.all([
        getAllKotaKabupaten().catch(() => []),
        getAllWilayahLayanan().catch(() => []),
      ]);

      setListKabupaten(resKabupaten || []);
      setListProvinsi(resProvinsi || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sorting Logic
  const filteredData = useMemo(() => {
    return listKabupaten
      .filter((item) => {
        const matchesSearch =
          item.nama_kota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.provinsi?.nama_provinsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.id_kota || item.id || '').includes(searchTerm);

        const isActive = item.is_active ?? item.status ?? true;
        const matchesStatus =
          statusFilter === 'Semua Status' ||
          (statusFilter === 'Aktif' && isActive) ||
          (statusFilter === 'Tidak Aktif' && !isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'Urutkan: Nama (A - Z)') {
          return (a.nama_kota || '').localeCompare(b.nama_kota || '');
        } else if (sortBy === 'Urutkan: Nama (Z - A)') {
          return (b.nama_kota || '').localeCompare(a.nama_kota || '');
        } else if (sortBy === 'Urutkan: ID (Kecil - Besar)') {
          return (Number(a.id_kota || a.id || 0) - Number(b.id_kota || b.id || 0));
        } else if (sortBy === 'Urutkan: ID (Besar - Kecil)') {
          return (Number(b.id_kota || b.id || 0) - Number(a.id_kota || a.id || 0));
        }
        return 0;
      });
  }, [listKabupaten, searchTerm, statusFilter, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Handler Open Modal
  const handleOpenCreateModal = () => {
    setEditItem(null);
    setFormData({ id_provinsi: '', nama_kota: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setFormData({
      id_provinsi: item.id_provinsi || '',
      nama_kota: item.nama_kota || '',
    });
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_provinsi: Number(formData.id_provinsi),
        nama_kota: formData.nama_kota,
      };

      if (editItem) {
        await updateKotaKabupaten(editItem.id_kota || editItem.id, payload);
      } else {
        await createKotaKabupaten(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data');
    }
  };

  // Delete Handler
  const handleDelete = async (idKota) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kota/kabupaten ini?')) {
      try {
        await deleteKotaKabupaten(idKota);
        fetchData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus data');
      }
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Kota / Kabupaten</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data wilayah kota / kabupaten dan status aktif/nonaktifnya.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Kota / Kabupaten</span>
        </button>
      </div>

      {/* Filter Bar - Disamakan dengan Provinsi */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari kabupaten..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Urutkan: Nama (A - Z)">Urutkan: Nama (A - Z)</option>
            <option value="Urutkan: Nama (Z - A)">Urutkan: Nama (Z - A)</option>
            <option value="Urutkan: ID (Kecil - Besar)">Urutkan: ID (Kecil - Besar)</option>
            <option value="Urutkan: ID (Besar - Kecil)">Urutkan: ID (Besar - Kecil)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-4 px-6 w-16 text-center">NO</th>
                  <th className="py-4 px-6">NAMA KOTA / KABUPATEN</th>
                  <th className="py-4 px-6">PROVINSI</th>
                  <th className="py-4 px-6">ID / KODE</th>
                  <th className="py-4 px-6 text-center">STATUS</th>
                  <th className="py-4 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      Tidak ada data kota / kabupaten ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const isAktif = item.is_active ?? item.status ?? true;
                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    const idKota = item.id_kota || item.id || '-';

                    return (
                      <tr key={item.id_kota || item.id || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-500 text-center">{rowIndex}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800 uppercase">
                          {item.nama_kota}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-600">
                          {item.provinsi?.nama_provinsi || '-'}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-600">{idKota}</td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              isAktif
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}
                          >
                            {isAktif ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit"
                              className="p-2 bg-white border border-slate-200 shadow-sm rounded-md text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_kota || item.id)}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100 bg-white text-xs text-slate-500">
          <div>
            Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              ← Sebelumnya
            </button>

            {/* Logika Ringkas Pagination */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editItem ? 'Edit Kota / Kabupaten' : 'Tambah Kota / Kabupaten'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pilih Provinsi
                </label>
                <select
                  required
                  value={formData.id_provinsi}
                  onChange={(e) => setFormData({ ...formData, id_provinsi: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {listProvinsi.map((prov) => (
                    <option key={prov.id_provinsi || prov.id} value={prov.id_provinsi || prov.id}>
                      {prov.nama_provinsi || prov.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kota / Kabupaten
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_kota}
                  onChange={(e) => setFormData({ ...formData, nama_kota: e.target.value })}
                  placeholder="Masukkan Nama Kota/Kabupaten"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
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