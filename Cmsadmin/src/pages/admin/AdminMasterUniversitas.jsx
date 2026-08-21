import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { 
  getAllUniversitas, 
  createUniversitas, 
  updateUniversitas, 
  deleteUniversitas 
} from '../../data/masterUniversitasData.js';

export default function AdminMasterUniversitas() {
  console.log("Komponen AdminMasterUniversitas BERHASIL DIMUAT!");
  const [universitasList, setUniversitasList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    nama_universitas: '',
    is_active: true,
  });

  // Ambil data dari API backend saat komponen dimuat
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log("loadData dipanggil!");
    try {
      const data = await getAllUniversitas();
      console.log("DEBUG API RESPON:", data); // <-- Cek hasil ini di tab Console browser!
      setUniversitasList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Gagal mengambil data universitas:', error);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ nama_universitas: '', is_active: true });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    const id = item.universita_id_universitas || item.id;
    setSelectedId(id);
    setFormData({ 
      nama_universitas: item.nama_universitas, 
      is_active: item.is_active 
    });
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateUniversitas(selectedId, formData);
      } else {
        await createUniversitas(formData);
      }
      setIsOpenModal(false);
      loadData();
    } catch (error) {
      console.error('Gagal menyimpan data universitas:', error);
      alert(error.message);
    }
  };

  const handleToggle = async (item) => {
    try {
      const id = item.universita_id_universitas || item.id;
      const updatedStatus = !item.is_active;
      
      await updateUniversitas(id, {
        nama_universitas: item.nama_universitas,
        is_active: updatedStatus
      });
      loadData();
    } catch (error) {
      console.error('Gagal mengubah status:', error);
    }
  };

  const handleDelete = async (idItem) => {
    if (window.confirm('Yakin ingin menghapus data universitas ini?')) {
      try {
        await deleteUniversitas(idItem);
        loadData();
      } catch (error) {
        console.error('Gagal menghapus data:', error);
      }
    }
  };

  // 1. Filter data berdasarkan pencarian
  const filteredData = universitasList.filter((item) =>
    item.nama_universitas?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Hitung data untuk pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      {/* Header & Tombol Tambah */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Universitas</h1>
          <p className="text-sm text-slate-500">
            Total seluruh data: <span className="font-semibold text-slate-700">{universitasList.length}</span> Universitas
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <FaPlus /> Tambah Universitas
        </button>
      </div>

      {/* Kotak Pencarian */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <FaSearch className="text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama universitas..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full outline-none text-sm text-slate-700"
        />
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-16 text-center">No</th>
              <th className="p-4">Nama Universitas</th>
              <th className="p-4 w-32">Status</th>
              <th className="p-4 w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">Tidak ada data universitas ditemukan.</td>
              </tr>
            ) : (
              currentItems.map((item, index) => {
                const uniqueId = item.universita_id_universitas || item.id;
                return (
                  <tr key={uniqueId} className="hover:bg-slate-50/50">
                    <td className="p-4 text-center font-medium text-slate-500">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{item.nama_universitas}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => handleToggle(item)}
                          type="button"
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title="Ubah Status"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              item.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                          title="Edit"
                        >
                          <FaEdit className="text-sm" />
                        </button>

                        <button
                          onClick={() => handleDelete(uniqueId)}
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                          title="Hapus"
                        >
                          <FaTrash className="text-sm" />
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

      {/* Footer / Pagination Section */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="text-sm text-gray-500">
          Halaman <span className="font-semibold text-gray-700">{currentPage}</span> dari <span className="font-semibold text-gray-700">{totalPages || 1}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            &larr; Sebelumnya
          </button>
          
          <span className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md">
            {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              currentPage === totalPages || totalPages === 0
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Selanjutnya &rarr;
          </button>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {isEditMode ? 'Edit Universitas' : 'Tambah Universitas'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nama Universitas</label>
                <input
                  type="text"
                  maxLength={255}
                  required
                  placeholder="Contoh: Universitas Indonesia"
                  value={formData.nama_universitas}
                  onChange={(e) => setFormData({ ...formData, nama_universitas: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status_aktif_univ"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="status_aktif_univ" className="text-sm font-medium text-slate-700">Status Aktif</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
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