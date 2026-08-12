import { useState, useEffect, useMemo } from 'react';
import {
  getKategoriPembayaran,
  createKategoriPembayaran,
  updateKategoriPembayaran,
  deleteKategoriPembayaran,
} from '../../data/masterKategoriPembayaranData.js';
import KategoriPembayaranForm from '../../components/KategoriPembayaranForm.jsx';

export default function AdminMasterKategoriPembayaran() {
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState(null);

  // State untuk filter & pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Jumlah item per halaman

  useEffect(() => {
    fetchKategori();
  }, []);

  // Reset ke halaman 1 setiap kali query pencarian atau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  async function fetchKategori() {
    setLoading(true);
    try {
      const data = await getKategoriPembayaran();
      setKategoriList(data);
    } catch (err) {
      console.error('Gagal mengambil kategori pembayaran:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelectedKategori(null);
    setShowForm(true);
  }

  function handleOpenEdit(item) {
    setSelectedKategori(item);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedKategori(null);
  }

  async function handleSubmitForm(formData) {
    setSubmitting(true);
    try {
      if (selectedKategori) {
        await updateKategoriPembayaran(selectedKategori.id, formData);
      } else {
        await createKategoriPembayaran(formData);
      }
      handleCloseForm();
      fetchKategori();
    } catch (err) {
      console.error('Gagal menyimpan kategori pembayaran:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apakah kamu yakin ingin menghapus kategori pembayaran ini?')) return;

    try {
      await deleteKategoriPembayaran(id);
      fetchKategori();
    } catch (err) {
      console.error('Gagal menghapus kategori pembayaran:', err);
      alert('Gagal menghapus data.');
    }
  }

  // Filter data berdasarkan pencarian dan status
  const filteredKategori = useMemo(() => {
    return kategoriList.filter((item) => {
      const matchesSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && item.is_active) ||
        (statusFilter === 'nonaktif' && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [kategoriList, searchQuery, statusFilter]);

  // Logika Pagination
  const totalPages = Math.ceil(filteredKategori.length / itemsPerPage) || 1;
  
  const paginatedKategori = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKategori.slice(start, start + itemsPerPage);
  }, [filteredKategori, currentPage]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Kategori Pembayaran</h1>
          <p className="text-sm text-slate-500">
            Kelola kelompok/kategori jenis transaksi pembayaran.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Tambah Kategori
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6">
          <KategoriPembayaranForm
            initialData={selectedKategori}
            mode={selectedKategori ? 'edit' : 'create'}
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
                placeholder="Cari nama kategori pembayaran..."
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
            ) : filteredKategori.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Tidak ada kategori pembayaran yang ditemukan.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="p-4 w-12">No</th>
                        <th className="p-4">Nama Kategori</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedKategori.map((item, index) => {
                        // Menghitung nomor urut secara dinamis
                        const nomorUrut = (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-medium text-slate-500">{nomorUrut}</td>
                            <td className="p-4 font-semibold text-slate-800">{item.nama}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bagian Bawah: Informasi Halaman & Tombol Navigasi Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
                  <div className="text-sm text-slate-500">
                    Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari{' '}
                    <span className="font-semibold text-slate-700">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}