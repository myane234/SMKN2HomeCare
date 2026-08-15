import React, { useState, useEffect, useRef } from 'react';
import {
  getAllKelurahan,
  createKelurahan,
  updateKelurahan,
  deleteKelurahan,
  getAllKecamatan,
} from '../../data/wilayahLayananData';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaChevronDown,
} from 'react-icons/fa';

export default function AdminMasterKelurahan() {
  const [kelurahanList, setKelurahanList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
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

  // Form Input State - SAMA PERSIS KAYAK KECAMATAN
  const [formData, setFormData] = useState({
    id_kelurahan: '',
    id_kecamatan: '',
    nama_kelurahan: '',
  });

  // State khusus untuk Combobox Kecamatan Searchable
  const [kecamatanSearch, setKecamatanSearch] = useState('');
  const [isKecamatanOpen, setIsKecamatanOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown combobox saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsKecamatanOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data otomatis saat halaman, kata kunci pencarian, atau sorting berubah
  useEffect(() => {
    fetchData(currentPage, searchTerm, sortBy);
  }, [currentPage, searchTerm, sortBy]);

 useEffect(() => {
  const fetchKecamatan = async () => {
    try {
      const response = await getAllKecamatan(1, '');
      const listData = response?.data || [];
      setKecamatanList(Array.isArray(listData) ? listData : []);
    } catch (err) {
      console.error('Gagal memuat data kecamatan:', err);
      setKecamatanList([]);
    }
  };
  fetchKecamatan();
}, []);



  const fetchData = async (page = 1, search = '', sort = 'nama_asc') => {
    setLoading(true);
    try {
      const response = await getAllKelurahan(page, search, itemsPerPage);

      let listData = response?.data || response || [];

      // Sorting data (berdasarkan Nama atau ID)
      if (Array.isArray(listData)) {
        listData.sort((a, b) => {
          if (sort === 'nama_asc') {
            return String(a.nama_kelurahan || '').localeCompare(String(b.nama_kelurahan || ''));
          }
          if (sort === 'nama_desc') {
            return String(b.nama_kelurahan || '').localeCompare(String(a.nama_kelurahan || ''));
          }
          if (sort === 'id_asc') {
            return String(a.id_kelurahan || '').localeCompare(String(b.id_kelurahan || ''));
          }
          if (sort === 'id_desc') {
            return String(b.id_kelurahan || '').localeCompare(String(a.id_kelurahan || ''));
          }
          return 0;
        });
      }

      setKelurahanList(Array.isArray(listData) ? listData : []);

      if (response?.meta) {
        setCurrentPage(response.meta.current_page);
        setLastPage(response.meta.last_page);
        setTotalData(response.meta.total);
      }
    } catch (err) {
      console.error('Gagal memuat data kelurahan:', err);
      setKelurahanList([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk menampilkan nama kecamatan
  const getNamaKecamatan = (item) => {
    if (item.kecamatan?.nama_kecamatan) return item.kecamatan.nama_kecamatan;
    if (item.nama_kecamatan) return item.nama_kecamatan;

    const foundKecamatan = kecamatanList.find(
      (kec) => String(kec.id_kecamatan || kec.id) === String(item.id_kecamatan)
    );
    return foundKecamatan ? foundKecamatan.nama_kecamatan : item.id_kecamatan || '-';
  };

  // Helper untuk menampilkan nama kota/kabupaten
  const getNamaKota = (item) => {
    if (item.kecamatan?.nama_regency) return item.kecamatan.nama_regency;
    if (item.kecamatan?.kota_kabupaten?.nama_kota) return item.kecamatan.kota_kabupaten.nama_kota;

    const foundKecamatan = kecamatanList.find(
      (kec) => String(kec.id_kecamatan || kec.id) === String(item.id_kecamatan)
    );
    if (foundKecamatan) {
      return foundKecamatan.nama_kota || foundKecamatan.nama_regency || foundKecamatan.regency_id || '-';
    }
    return '-';
  };

  // Handler Modal
  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormData({
      id_kelurahan: '',
      id_kecamatan: '',
      nama_kelurahan: '',
    });
    setKecamatanSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
  setIsEdit(true);
  setCurrentId(item.id_kelurahan);
  setFormData({
    id_kelurahan: item.id_kelurahan || '',
    id_kecamatan: item.id_kecamatan || '',
    nama_kelurahan: item.nama_kelurahan || '',
  });

  // Set pencarian ke nama kecamatan yang ada pada item
  setKecamatanSearch(item.kecamatan?.nama_kecamatan || '');
  setIsModalOpen(true);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_kecamatan: formData.id_kecamatan,
        nama_kelurahan: formData.nama_kelurahan,
      };

      if (isEdit) {
        await updateKelurahan(currentId, payload);
      } else {
        await createKelurahan(payload);
      }
      setIsModalOpen(false);
      fetchData(currentPage, searchTerm, sortBy);
    } catch (err) {
      alert(`Error: ${err.message || 'Gagal menyimpan data'}`);
    }
  };

  const handleDelete = async (idKelurahan) => {
    if (window.confirm('Apakah kamu yakin ingin menghapus data kelurahan ini?')) {
      try {
        await deleteKelurahan(idKelurahan);
        fetchData(currentPage, searchTerm, sortBy);
      } catch (err) {
        alert(`Error: ${err.message || 'Gagal menghapus data'}`);
      }
    }
  };

  // Filter daftar kecamatan sesuai ketikan pada combobox
  const filteredKecamatanList = kecamatanList.filter((kec) => {
    const nama = kec.nama_kecamatan || '';
    return nama.toLowerCase().includes(kecamatanSearch.toLowerCase());
  });


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Master Kelurahan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total seluruh data: <span className="font-semibold text-slate-700">{totalData}</span> Kelurahan
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Kelurahan</span>
        </button>
      </div>

      {/* Filter Bar (Search & Sort Sesuai Referensi) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kelurahan, kecamatan, atau kota..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* Sort Dropdown dengan Style Persis Gambar */}
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
            <table className="w-full text-left text-sm border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-16 text-center">NO</th>
                  <th className="py-4 px-4 sm:px-6">NAMA KELURAHAN</th>
                  <th className="py-4 px-4 sm:px-6">KECAMATAN</th>
                  <th className="py-4 px-4 sm:px-6">KOTA / KABUPATEN</th>
                  <th className="py-4 px-4 sm:px-6">KODE KELURAHAN</th>
                  <th className="py-4 px-4 sm:px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {kelurahanList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      Tidak ada data kelurahan ditemukan.
                    </td>
                  </tr>
                ) : (
                  kelurahanList.map((item, index) => {
                    const rowIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={item.id_kelurahan || index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-500 text-center">{rowIndex}</td>
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 uppercase">
                          {item.nama_kelurahan}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-600 uppercase">
                          {getNamaKecamatan(item)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-medium text-slate-600 uppercase">
                          {getNamaKota(item)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-xs text-slate-500">
                          {item.id_kelurahan}
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
                              onClick={() => handleDelete(item.id_kelurahan)}
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
            <span className="font-semibold text-slate-700">{lastPage}</span> (Total {totalData} Data)
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              ← Sebelumnya
            </button>

            <span className="px-3 py-1.5 font-medium text-slate-700">
              {currentPage} / {lastPage}
            </span>

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

      {/* Modal Form - SAMA PERSIS KAYAK KECAMATAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 my-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {isEdit ? 'Edit Kelurahan' : 'Tambah Kelurahan Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ID KELURAHAN - DISABLE saat EDIT */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ID Kelurahan
                </label>
                <input
                  type="text"
                  required
                  value={formData.id_kelurahan}
                  onChange={(e) => setFormData({ ...formData, id_kelurahan: e.target.value })}
                  disabled={isEdit}
                  placeholder="Contoh: 3201010"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* NAMA KELURAHAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kelurahan
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_kelurahan}
                  onChange={(e) => setFormData({ ...formData, nama_kelurahan: e.target.value })}
                  placeholder="Masukkan Nama Kelurahan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm uppercase"
                />
              </div>

              {/* Combobox Kecamatan */}
<div className="relative" ref={dropdownRef}>
  <label className="block text-xs font-semibold text-slate-600 mb-1">
    Pilih Kecamatan
  </label>
  <div className="relative w-full">
    <input
      type="text"
      placeholder="Ketik atau pilih kecamatan..."
      value={kecamatanSearch}
      onFocus={() => {
        setIsKecamatanOpen(true);
        console.log('🔽 Dropdown opened');
      }}
      onClick={() => {
        setIsKecamatanOpen(true);
        console.log('🖱️ Input clicked');
      }}
      onChange={(e) => {
        setKecamatanSearch(e.target.value);
        setIsKecamatanOpen(true);
        if (!e.target.value) {
          setFormData({ ...formData, id_kecamatan: '' });
        }
      }}
      className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
    />
    <FaChevronDown
      className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-transform pointer-events-none ${
        isKecamatanOpen ? 'rotate-180' : ''
      }`}
      onClick={() => setIsKecamatanOpen(!isKecamatanOpen)}
    />
  </div>

  {/* Dropdown - PASTIKAN INI MUNCUL */}
  {isKecamatanOpen && (
    <div className="absolute z-[9999] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
      {kecamatanList.length === 0 ? (
        <div className="px-3 py-2.5 text-xs text-slate-400 text-center">
          ⚠️ Tidak ada data kecamatan
        </div>
      ) : filteredKecamatanList.length === 0 ? (
        <div className="px-3 py-2.5 text-xs text-slate-400 text-center">
          🔍 Kecamatan tidak ditemukan
        </div>
      ) : (
        filteredKecamatanList.map((kec) => {
          const id = kec.id_kecamatan || kec.id;
          const nama = kec.nama_kecamatan || '';
          const kota = kec.nama_kota || kec.nama_regency || '';
          return (
            <div
              key={id}
              onClick={() => {
                setFormData({ ...formData, id_kecamatan: id });
                setKecamatanSearch(nama);
                setIsKecamatanOpen(false);
                console.log('✅ Dipilih:', nama, 'ID:', id);
              }}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
            >
              {nama} {kota ? `(${kota})` : ''}
            </div>
          );
        })
      )}
    </div>
  )}

  {/* Hidden input untuk validasi */}
  <input
    type="text"
    required
    value={formData.id_kecamatan}
    onChange={() => {}}
    className="opacity-0 absolute -bottom-2 h-0 w-0 pointer-events-none"
  />
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