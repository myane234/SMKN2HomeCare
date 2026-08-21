import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { getAllPendidikan, createPendidikan, updatePendidikan, deletePendidikan } from '../../data/masterPendidikanData';

export default function AdminMasterPendidikan() {
  const [pendidikanList, setPendidikanList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form State (Hanya nama_pendidikan sesuai endpoint API)
  const [formData, setFormData] = useState({
    nama_pendidikan: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Helper untuk mengambil ID dari berbagai kemungkinan nama kolom backend
  const getItemId = (item) => {
    if (!item) return null;
    return item.pendidikan_id_pendidikan || item.id || item.id_pendidikan || Object.values(item)[0];
  };

  const loadData = async () => {
    try {
      const data = await getAllPendidikan();
      // Urutkan berdasarkan ID dari terkecil ke terbesar
      const sortedById = data.sort((a, b) => {
        const idA = getItemId(a) || 0;
        const idB = getItemId(b) || 0;
        return idA - idB;
      });
      setPendidikanList(sortedById);
    } catch (error) {
      console.error('Gagal memuat data pendidikan:', error);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ nama_pendidikan: '' });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    const id = getItemId(item);
    setSelectedId(id);
    setFormData({
      nama_pendidikan: item.nama_pendidikan || '',
    });
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updatePendidikan(selectedId, formData);
      } else {
        await createPendidikan(formData);
      }
      loadData();
      setIsOpenModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm('Yakin ingin menghapus data pendidikan ini?')) {
      try {
        await deletePendidikan(id);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const filteredData = pendidikanList.filter((item) =>
    item.nama_pendidikan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header & Tombol Tambah */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Pendidikan</h1>
          <p className="text-sm text-slate-500">Kelola data tingkat pendidikan untuk profil mitra/pengguna.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <FaPlus /> Tambah Pendidikan
        </button>
      </div>

      {/* Kotak Pencarian */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <FaSearch className="text-slate-400" />
        <input
          type="text"
          placeholder="Cari jenjang pendidikan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full outline-none text-sm text-slate-700"
        />
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-16 text-center">No</th>
              <th className="p-4">Jenjang Pendidikan</th>
              <th className="p-4 w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">Tidak ada data pendidikan.</td>
              </tr>
            ) : (
              filteredData.map((item, index) => {
                const itemId = getItemId(item);

                return (
                  <tr key={itemId || index} className="hover:bg-slate-50/50">
                    <td className="p-4 text-center font-medium text-slate-500">{index + 1}</td>
                    <td className="p-4 font-semibold text-slate-800">{item.nama_pendidikan}</td>
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
      </div>

      {/* Modal Form Tambah / Edit */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {isEditMode ? 'Edit Jenjang Pendidikan' : 'Tambah Jenjang Pendidikan'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Jenjang Pendidikan</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Contoh: Strata 1 (S1)"
                  value={formData.nama_pendidikan}
                  onChange={(e) => setFormData({ ...formData, nama_pendidikan: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500"
                />
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