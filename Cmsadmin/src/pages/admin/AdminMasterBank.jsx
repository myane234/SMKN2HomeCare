import { useState, useEffect, useMemo } from 'react';
import {
  getAllBanks,
  createBank,
  updateBank,
  toggleStatusBank,
  deleteBank,
} from '../../data/masterBankData.js';

export default function AdminMasterBank() {
  const [bankList, setBankList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  // Form Field States
  const [namaBank, setNamaBank] = useState('');
  const [kodeBank, setKodeBank] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [gambarFile, setGambarFile] = useState(null);

  // State untuk filter & pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDataBank();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  async function fetchDataBank() {
    setLoading(true);
    try {
      const data = await getAllBanks();
      setBankList(data);
    } catch (err) {
      console.error('Gagal mengambil data bank:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelectedBank(null);
    setNamaBank('');
    setKodeBank('');
    setIsActive(true);
    setGambarFile(null);
    setShowForm(true);
  }

  function handleOpenEdit(item) {
    setSelectedBank(item);
    setNamaBank(item.nama_bank);
    setKodeBank(item.kode_bank);
    setIsActive(item.is_active);
    setGambarFile(null);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedBank(null);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('nama_bank', namaBank);
    formData.append('kode_bank', kodeBank);
    formData.append('is_active', isActive ? '1' : '0');
    if (gambarFile) {
      formData.append('gambar', gambarFile);
    }

    try {
      if (selectedBank) {
        await updateBank(selectedBank.id, formData);
      } else {
        await createBank(formData);
      }
      handleCloseForm();
      fetchDataBank();
    } catch (err) {
      console.error('Gagal menyimpan data bank:', err);
      alert('Terjadi kesalahan saat menyimpan data bank.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id) {
    try {
      await toggleStatusBank(id);
      fetchDataBank();
    } catch (err) {
      console.error('Gagal mengubah status bank:', err);
      alert('Gagal mengubah status.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apakah kamu yakin ingin menghapus bank ini?')) return;

    try {
      await deleteBank(id);
      fetchDataBank();
    } catch (err) {
      console.error('Gagal menghapus bank:', err);
      alert('Gagal menghapus data.');
    }
  }

  // Helper untuk merapikan URL gambar agar otomatis mengarah ke backend Laravel
  function getImgUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Sesuaikan port backend Laravel Anda jika menggunakan port tertentu (misal: http://localhost:8000)
    // Jika backend lokal Anda berjalan di http://localhost (tanpa port), gunakan http://localhost saja.
    return `http://localhost:8000${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Filter data berdasarkan pencarian dan status
  const filteredBank = useMemo(() => {
    return bankList.filter((item) => {
      const matchesSearch = 
        item.nama_bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.kode_bank && item.kode_bank.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && item.is_active) ||
        (statusFilter === 'nonaktif' && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [bankList, searchQuery, statusFilter]);

  // Logika Pagination
  const totalPages = Math.ceil(filteredBank.length / itemsPerPage) || 1;
  
  const paginatedBank = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBank.slice(start, start + itemsPerPage);
  }, [filteredBank, currentPage]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Bank</h1>
          <p className="text-sm text-slate-500">
            Kelola data master bank untuk keperluan pencairan dana (payout) mitra.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Tambah Bank
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            {selectedBank ? 'Edit Data Bank' : 'Tambah Bank Baru'}
          </h2>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Nama Bank</label>
              <input
                type="text"
                required
                placeholder="Contoh: Bank Mandiri"
                value={namaBank}
                onChange={(e) => setNamaBank(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Kode Bank</label>
              <input
                type="text"
                placeholder="Contoh: 008"
                value={kodeBank}
                onChange={(e) => setKodeBank(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Logo Bank (Opsional)</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={(e) => setGambarFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Format: jpeg, png, jpg, webp, svg. Max: 1MB.</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveBank"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isActiveBank" className="text-sm font-medium text-slate-700">Status Aktif</label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
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
                placeholder="Cari nama bank atau kode bank..."
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
            ) : filteredBank.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Tidak ada data bank yang ditemukan.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="p-4 w-12">No</th>
                        <th className="p-4">Logo</th>
                        <th className="p-4">Kode Bank</th>
                        <th className="p-4">Nama Bank</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedBank.map((item, index) => {
                            const nomorUrut = (currentPage - 1) * itemsPerPage + index + 1;
                            return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-medium text-slate-500">{nomorUrut}</td>
                                <td className="p-4">
                                {item.gambar ? (
                                    <img 
                                    src={getImgUrl(item.gambar)} 
                                    alt={item.nama_bank} 
                                    className="h-8 w-12 object-contain rounded border border-slate-100 bg-white p-0.5" 
                                    />
                                ) : (
                                    <div className="h-8 w-12 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold">N/A</div>
                                )}
                                </td>
                                <td className="p-4 font-mono text-slate-600">{item.kode_bank || '-'}</td>
                                <td className="p-4 font-semibold text-slate-800">{item.nama_bank}</td>
                                <td className="p-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                }`}>
                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                                </td>
                                <td className="p-4 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                    {/* Toggle Switch */}
                                    <button
                                    onClick={() => handleToggle(item.id)}
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

                                    {/* Tombol Edit (Ikon Pensil) - Padding diubah ke p-1.5 */}
                                    <button
                                    onClick={() => handleOpenEdit(item)}
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                                    title="Edit"
                                    >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    </button>
                                    
                                    {/* Tombol Hapus (Ikon Tong Sampah Merah) - Padding diubah ke p-1.5 */}
                                    <button
                                    onClick={() => handleDelete(item.id)}
                                    className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                                    title="Hapus"
                                    >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    </button>
                                </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody> 
                  </table>
                </div>

                {/* Pagination */}
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
                      Sebelumnya
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
                      Selanjutnya 
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