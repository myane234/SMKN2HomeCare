import React, { useState, useEffect, useRef } from 'react';
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
  FaChevronDown,
} from 'react-icons/fa';

export default function AdminMasterKecamatan() {
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const itemsPerPage = 50;

  // State Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nama_asc');

  // State Modal (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form Input State (ID Kecamatan dihilangkan dari input user)
  const [formData, setFormData] = useState({
    regency_id: '',
    nama_kecamatan: ''
  });

  // State khusus untuk Combobox Kabupaten/Kota Searchable
  const [kotaSearch, setKotaSearch] = useState('');
  const [isKotaOpen, setIsKotaOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown combobox saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsKotaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger saat halaman atau sort berubah
  useEffect(() => {
    fetchData(currentPage, sortBy);
  }, [currentPage, sortBy]);

  // Load master kota/kabupaten untuk pilihan dropdown modal
  useEffect(() => {
    const fetchKota = async () => {
      try {
        const dataKota = await getAllKotaKabupaten().catch(() => []);
        setKotaList(Array.isArray(dataKota) ? dataKota : []);
      } catch (err) {
        console.error('Gagal memuat data kota:', err);
      }
    };
    fetchKota();
  }, []);

  const fetchData = async (page = 1, sort = 'nama_asc') => {
    setLoading(true);
    try {
      const response = await getAllKecamatan(page);
      
      let listData = response?.data || response;
      
      // Sorting data
      if (Array.isArray(listData)) {
        listData.sort((a, b) => {
          if (sort === 'nama_asc') {
            return String(a.nama_kecamatan || '').localeCompare(String(b.nama_kecamatan || ''));
          }
          if (sort === 'nama_desc') {
            return String(b.nama_kecamatan || '').localeCompare(String(a.nama_kecamatan || ''));
          }
          if (sort === 'id_asc') {
            return String(a.id_kecamatan || '').localeCompare(String(b.id_kecamatan || ''));
          }
          if (sort === 'id_desc') {
            return String(b.id_kecamatan || '').localeCompare(String(a.id_kecamatan || ''));
          }
          return 0;
        });
      }

      setKecamatanList(Array.isArray(listData) ? listData : []);

      const meta = response?.meta || response;
      if (meta) {
        if (meta.current_page) setCurrentPage(meta.current_page);
        if (meta.last_page) setLastPage(meta.last_page);
        if (meta.total !== undefined) setTotalData(meta.total);
      }
    } catch (err) {
      console.error('Gagal memuat data kecamatan:', err);
      setKecamatanList([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk menampilkan nama kabupaten / regency
  const getNamaRegency = (item) => {
    if (item.nama_regency) return item.nama_regency;
    if (item.kota_kabupaten?.nama_kota) return item.kota_kabupaten.nama_kota;
    
    const foundKota = kotaList.find(
      (kota) => String(kota.id_kota || kota.id) === String(item.regency_id)
    );
    return foundKota ? (foundKota.nama_kota || foundKota.nama) : item.regency_id;
  };

  // Filter pencarian secara real-time
  const filteredKecamatanList = kecamatanList.filter((item) => {
    const namaKec = (item.nama_kecamatan || '').toLowerCase();
    const namaKab = getNamaRegency(item).toLowerCase();
    const keyword = searchTerm.toLowerCase();

    return namaKec.includes(keyword) || namaKab.includes(keyword);
  });

  // Handler Modal
  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormData({ regency_id: '', nama_kecamatan: '' });
    setKotaSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEdit(true);
    setCurrentId(item.id_kecamatan);
    setFormData({
      regency_id: item.regency_id || '',
      nama_kecamatan: item.nama_kecamatan || ''
    });

    const foundKota = kotaList.find(
      (kota) => String(kota.id_kota || kota.id) === String(item.regency_id)
    );
    setKotaSearch(foundKota ? (foundKota.nama_kota || foundKota.nama) : '');
    setIsModalOpen(true);
  };

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
      fetchData(currentPage, sortBy);
    } catch (err) {
      alert(`Error: ${err.message || 'Gagal menyimpan data'}`);
    }
  };

  const handleDelete = async (idKecamatan) => {
    if (window.confirm('Apakah kamu yakin ingin menghapus data kecamatan ini?')) {
      try {
        await deleteKecamatan(idKecamatan);
        fetchData(currentPage, sortBy);
      } catch (err) {
        alert(`Error: ${err.message || 'Gagal menghapus data'}`);
      }
    }
  };

  const filteredKotaList = kotaList.filter((kota) => {
    const nama = kota.nama_kota || kota.nama || '';
    return nama.toLowerCase().includes(kotaSearch.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Master Kecamatan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total seluruh data: <span className="font-semibold text-slate-700">{totalData}</span> Kecamatan
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

      {/* Filter Bar (Search & Sort) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kecamatan atau kabupaten..."
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
            className="w-full md:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
          >
            <option value="nama_asc">Urutkan: Nama (A - Z)</option>
            <option value="nama_desc">Urutkan: Nama (Z - A)</option>
            <option value="id_asc">Urutkan: ID (Kecil - Besar)</option>
            <option value="id_desc">Urutkan: ID (Besar - Kecil)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data dari server...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-16 text-center">NO</th>
                  <th className="py-4 px-4 sm:px-6">NAMA KECAMATAN</th>
                  <th className="py-4 px-4 sm:px-6">KOTA / KABUPATEN</th>
                  <th className="py-4 px-4 sm:px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredKecamatanList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      Tidak ada data kecamatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredKecamatanList.map((item, index) => {
                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    const namaKabupaten = getNamaRegency(item);

                    return (
                      <tr key={item.id_kecamatan || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-500 text-center">{rowIndex}</td>
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 uppercase">
                          {item.nama_kecamatan}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-600 uppercase">
                          {namaKabupaten}
                        </td>
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
          <div>
            Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
            <span className="font-semibold text-slate-700">{lastPage}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              ← Sebelumnya
            </button>

            {[...Array(lastPage)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === lastPage ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 border rounded-md font-medium transition-colors shadow-sm ${
                      currentPage === pageNum
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === currentPage - 2 ||
                pageNum === currentPage + 2
              ) {
                return <span key={pageNum} className="px-1 text-slate-400">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage === lastPage}
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

              {/* Custom Combobox Searchable untuk Kabupaten / Kota */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pilih Kabupaten / Kota
                </label>
                
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Ketik atau pilih kabupaten/kota..."
                    value={kotaSearch}
                    onFocus={() => setIsKotaOpen(true)}
                    onChange={(e) => {
                      setKotaSearch(e.target.value);
                      setIsKotaOpen(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, regency_id: '' });
                      }
                    }}
                    className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                  <FaChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-transform pointer-events-none ${isKotaOpen ? 'rotate-180' : ''}`} />
                </div>

                {isKotaOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
                    {filteredKotaList.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-slate-400 text-center">
                        Kabupaten/Kota tidak ditemukan
                      </div>
                    ) : (
                      filteredKotaList.map((kota) => {
                        const id = kota.id_kota || kota.id;
                        const nama = kota.nama_kota || kota.nama;
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              setFormData({ ...formData, regency_id: id });
                              setKotaSearch(nama);
                              setIsKotaOpen(false);
                            }}
                            className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors uppercase"
                          >
                            {nama}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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