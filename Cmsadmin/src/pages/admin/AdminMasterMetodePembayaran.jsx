import { useState, useEffect, useMemo } from 'react';
import {
  getMetodePembayaran,
  createMetodePembayaran,
  updateMetodePembayaran,
  deleteMetodePembayaran,
} from '../../data/masterMetodePembayaranData.js';
import MetodePembayaranForm from '../../components/MetodePembayaranForm.jsx';

export default function AdminMasterMetodePembayaran() {
  const [metodeList, setMetodeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMetode, setSelectedMetode] = useState(null);

  // State untuk filter & pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  useEffect(() => {
    fetchMetode();
  }, []);

  async function fetchMetode() {
    setLoading(true);
    try {
      const data = await getMetodePembayaran();
      setMetodeList(data);
    } catch (err) {
      console.error('Gagal mengambil metode pembayaran:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelectedMetode(null);
    setShowForm(true);
  }

  function handleOpenEdit(item) {
    setSelectedMetode(item);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedMetode(null);
  }

  async function handleSubmitForm(formData) {
    setSubmitting(true);
    try {
      if (selectedMetode) {
        await updateMetodePembayaran(selectedMetode.id, formData);
      } else {
        await createMetodePembayaran(formData);
      }
      handleCloseForm();
      fetchMetode();
    } catch (err) {
      console.error('Gagal menyimpan metode pembayaran:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apakah kamu yakin ingin menghapus metode pembayaran ini?')) return;

    try {
      await deleteMetodePembayaran(id);
      fetchMetode();
    } catch (err) {
      console.error('Gagal menghapus metode pembayaran:', err);
      alert('Gagal menghapus data.');
    }
  }

  // Filter data berdasarkan pencarian teks dan status
  const filteredMetode = useMemo(() => {
    return metodeList.filter((item) => {
      const namaMetode = item.nama_metode || '';
      const namaKategori = item.nama_kategori || '';
      
      const matchesSearch =
        namaMetode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        namaKategori.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && item.is_active) ||
        (statusFilter === 'nonaktif' && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [metodeList, searchQuery, statusFilter]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Metode Pembayaran</h1>
          <p className="text-sm text-slate-500">Kelola pilihan channel pembayaran transaksi.</p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Tambah Metode
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6">
          <MetodePembayaranForm
            initialData={selectedMetode}
            mode={selectedMetode ? 'edit' : 'create'}
            onSubmit={handleSubmitForm}
            submitting={submitting}
            onCancel={handleCloseForm}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Baris Filter & Pencarian */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari nama metode atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Tabel Data */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Memuat data...</div>
            ) : filteredMetode.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Tidak ada metode pembayaran yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Nama Metode</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Potongan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMetode.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-3">
                            {item.logo && (
                              <img src={item.logo} alt="" className="h-6 w-6 object-contain" />
                            )}
                            <span>{item.nama_metode}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{item.nama_kategori || '-'}</td>
                        <td className="p-4 font-medium text-slate-700">
                          {item.tipe_potongan === 'persen'
                            ? `${Number(item.nilai_potongan || 0)}%`
                            : `Rp ${Number(item.nilai_potongan || 0).toLocaleString('id-ID')}`}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.is_active
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}