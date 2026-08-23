import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { getAllAgama, createAgama, updateAgama, deleteAgama } from '../../data/masterAgamaData';

export default function AdminMasterAgama() {
  const [agamaList, setAgamaList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State (Hanya nama_agama sesuai API backend)
  const [formData, setFormData] = useState({
    nama_agama: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Helper untuk mengambil ID dari berbagai kemungkinan nama kolom backend
  const getItemId = (item) => {
    if (!item) return null;
    return item.agama_id_agama || item.id || item.id_agama || Object.values(item)[0];
  };

  const loadData = async () => {
    try {
      const data = await getAllAgama();
      // Urutkan berdasarkan ID dari terkecil ke terbesar supaya urutan sesuai saat dibuat
      const sortedById = data.sort((a, b) => {
        const idA = getItemId(a) || 0;
        const idB = getItemId(b) || 0;
        return idA - idB;
      });
      setAgamaList(sortedById);
    } catch (error) {
      console.error('Gagal memuat data agama:', error);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ nama_agama: '' });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    const id = getItemId(item);
    setSelectedId(id);
    setFormData({
      nama_agama: item.nama_agama || '',
    });
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateAgama(selectedId, formData);
      } else {
        await createAgama(formData);
      }
      loadData();
      setIsOpenModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm('Yakin ingin menghapus data agama ini?')) {
      try {
        await deleteAgama(id);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // Filter berdasarkan pencarian
  const filteredData = agamaList.filter((item) =>
    item.nama_agama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset ke halaman 1 jika user mengetik di pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Logika Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Agama</h1>
          <p className="text-sm text-slate-500">Kelola data pilihan agama dari database backend.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <FaPlus /> Tambah Agama
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <FaSearch className="text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama agama..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full outline-none text-sm text-slate-700"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-16 text-center">No</th>
              <th className="p-4">Nama Agama</th>
              <th className="p-4 w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">Tidak ada data agama.</td>
              </tr>
            ) : (
              currentData.map((item, index) => {
                const itemId = getItemId(item);
                const absoluteIndex = indexOfFirstItem + index + 1;

                return (
                  <tr key={itemId || index} className="hover:bg-slate-50/50">
                    <td className="p-4 text-center font-medium text-slate-500">{absoluteIndex}</td>
                    <td className="p-4 font-semibold text-slate-800">{item.nama_agama}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(item)} 
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                          title="Edit"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button 
                          onClick={() => handleDelete(itemId)} 
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

        {/* Footer Pagination ala Master Bank */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 gap-4">
          <div className="text-sm text-slate-500">
            Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{isEditMode ? 'Edit Agama' : 'Tambah Agama'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nama Agama</label>
                <input
                  type="text" 
                  required 
                  maxLength={100}
                  placeholder="Contoh: Islam"
                  value={formData.nama_agama}
                  onChange={(e) => setFormData({ ...formData, nama_agama: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}