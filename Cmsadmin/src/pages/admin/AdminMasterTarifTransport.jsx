import { useState, useEffect } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaPlus, FaTruck,
  FaArrowLeft, FaSave
} from 'react-icons/fa';
import Pagination from '../../components/pagination';
import {
  getAllTarifTransport,
  createTarifTransport,
  updateTarifTransport,
  deleteTarifTransport,
  getTarifId
} from '../../data/masterTarifTransportData';
import { getAllKotaKabupaten } from '../../data/wilayahLayananData';
import Swal from 'sweetalert2';

export default function AdminMasterTarifTransport() {
  const [viewMode, setViewMode] = useState('list');
  const [tarifList, setTarifList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItem, setSelectedItem] = useState(null);
  const [formKota, setFormKota] = useState('');
  const [formTarifAwal, setFormTarifAwal] = useState('');
  const [formTarifPerKm, setFormTarifPerKm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tarifRes, kotaRes] = await Promise.all([
        getAllTarifTransport(),
        getAllKotaKabupaten()
      ]);

      const listTarif = Array.isArray(tarifRes) ? tarifRes : (tarifRes?.data || []);
      const listKota = Array.isArray(kotaRes) ? kotaRes : (kotaRes?.data || []);

      setTarifList(listTarif);
      setKotaList(listKota);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data tarif transport');
      setTarifList([]);
      setKotaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDisplayNumber = (val) => {
    if (!val && val !== 0) return '';
    const clean = val.toString().replace(/[^0-9]/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('id-ID');
  };

  const parseFormattedNumber = (val) => {
    if (!val) return 0;
    const clean = val.toString().replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
  };

  const handleOpenAddForm = () => {
    setSelectedItem(null);
    setFormKota('');
    setFormTarifAwal('');
    setFormTarifPerKm('');
    setViewMode('add');
  };

  const handleOpenEditForm = (item) => {
    // PERBAIKAN: pakai fungsi terpusat getTarifId, bukan chain manual
    const id = getTarifId(item);

    if (id === null) {
      Swal.fire('Error', 'ID tidak ditemukan di data. Cek console untuk detail struktur data.', 'error');
      console.error('ITEM TANPA ID:', item);
      return;
    }

    setSelectedItem(item);
    setFormKota(item.id_kota?.toString() || '');
    // Gunakan parseInt untuk mengabaikan desimal (.00) dari backend sebelum jadi string
    setFormTarifAwal(item.tarif_awal ? parseInt(item.tarif_awal, 10).toString() : '');
    setFormTarifPerKm(item.tarif_per_kilometer ? parseInt(item.tarif_per_kilometer, 10).toString() : '');
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
    setErrorMsg('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formKota) {
      Swal.fire('Error', 'Silakan pilih kota/kabupaten', 'error');
      setIsSubmitting(false);
      return;
    }

    const tarifAwalNum = parseFormattedNumber(formTarifAwal);
    const tarifPerKmNum = parseFormattedNumber(formTarifPerKm);

    if (tarifAwalNum < 0) {
      Swal.fire('Error', 'Tarif awal harus diisi dengan angka valid', 'error');
      setIsSubmitting(false);
      return;
    }

    if (tarifPerKmNum < 0) {
      Swal.fire('Error', 'Tarif per kilometer harus diisi dengan angka valid', 'error');
      setIsSubmitting(false);
      return;
    }

    // PERBAIKAN: pakai getTarifId, bukan chain manual
    const currentMasterId = getTarifId(selectedItem);

    const isDuplicate = tarifList.some(item => {
      const itemKotaId = item.id_kota;
      const itemMasterId = getTarifId(item);

      return (
        Number(itemKotaId) === Number(formKota) &&
        (viewMode === 'add' || (viewMode === 'edit' && itemMasterId !== currentMasterId))
      );
    });

    if (isDuplicate) {
      Swal.fire('Error', 'Tarif untuk kota ini sudah ada dalam sistem', 'error');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      id_kota: Number(formKota),
      tarif_awal: tarifAwalNum,
      tarif_per_kilometer: tarifPerKmNum
    };

    try {
      if (viewMode === 'edit' && currentMasterId !== null) {
        await updateTarifTransport(currentMasterId, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data tarif transport berhasil diperbarui!' });
      } else {
        await createTarifTransport(payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data tarif transport berhasil ditambahkan!' });
      }
      setViewMode('list');
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan saat menyimpan data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item) => {
    // PERBAIKAN: pakai getTarifId, bukan chain manual
    const targetId = getTarifId(item);

    if (targetId === null) {
      Swal.fire('Error', 'ID Tarif Transport tidak valid. Cek console untuk detail struktur data.', 'error');
      console.error('ITEM TANPA ID (delete):', item);
      return;
    }

    const kota = kotaList.find(k => Number(k.id_kota) === Number(item.id_kota));
    const namaKota = kota?.nama_kota || item.nama_kota || item.kota?.nama_kota || `ID Kota: ${item.id_kota}`;

    Swal.fire({
      title: 'Hapus Tarif Transport?',
      text: `Apakah Anda yakin ingin menghapus tarif untuk "${namaKota}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTarifTransport(targetId);
          Swal.fire('Terhapus!', 'Data tarif transport berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal menghapus data tarif transport.', 'error');
        }
      }
    });
  };

  const filteredData = tarifList.filter((item) => {
    const kota = kotaList.find(k => Number(k.id_kota) === Number(item.id_kota));
    const kotaName = kota?.nama_kota || item.nama_kota || item.kota?.nama_kota || '';
    return kotaName.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // FORM VIEW
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="p-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={handleBackToList}
            className="hover:text-slate-800 transition-colors cursor-pointer"
          >
            Master Tarif Transport
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-slate-800 capitalize">
            {viewMode === 'add' ? 'Create' : 'Edit'}
          </span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {viewMode === 'add' ? 'Tambah Tarif Transport' : 'Edit Tarif Transport'}
          </h1>
          <p className="text-sm text-slate-500">
            {viewMode === 'add' ? 'Atur tarif transport berdasarkan kota/kabupaten.' : 'Perbarui tarif transport untuk kota/kabupaten yang dipilih.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kota/Kabupaten <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                  value={formKota}
                  onChange={(e) => setFormKota(e.target.value)}
                  required
                  disabled={viewMode === 'edit'}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map((kota) => (
                    <option key={kota.id_kota} value={kota.id_kota}>{kota.nama_kota}</option>
                  ))}
                </select>
                {viewMode === 'edit' && (
                  <p className="text-xs text-slate-400 mt-1.5">* Kota tidak dapat diubah pada mode edit.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tarif Awal (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                    value={formatDisplayNumber(formTarifAwal)}
                    onChange={(e) => setFormTarifAwal(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tarif per Kilometer (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                    value={formatDisplayNumber(formTarifPerKm)}
                    onChange={(e) => setFormTarifPerKm(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {formKota && formTarifAwal && formTarifPerKm && (
              <div className="rounded-lg bg-green-50/80 p-4 border border-green-100">
                <h4 className="text-sm font-medium text-green-800 mb-2">Preview Perhitungan</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p>Kota: <span className="font-medium">{kotaList.find(k => Number(k.id_kota) === Number(formKota))?.nama_kota || '-'}</span></p>
                  <p>Tarif Awal: {formatRupiah(parseFormattedNumber(formTarifAwal))}</p>
                  <p>Tarif per KM: {formatRupiah(parseFormattedNumber(formTarifPerKm))}</p>
                  <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                    Contoh simulasi jarak 5 km: {formatRupiah(parseFormattedNumber(formTarifAwal) + (parseFormattedNumber(formTarifPerKm) * 5))}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm shadow-green-600/20 flex items-center gap-2 transition-all disabled:opacity-60"
              >
                <FaSave className="text-xs" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tarif Transport'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Tarif Transport</h1>
          <p className="text-sm text-slate-500">Kelola tarif transportasi berdasarkan kota/kabupaten.</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Tarif Transport</span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
            <FaSearch className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kota/kabupaten..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-400">Memuat data tarif transport...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5 w-12 text-center">No</th>
                  <th className="px-4 py-3.5 text-left min-w-[200px]">Kota/Kabupaten</th>
                  <th className="px-4 py-3.5 text-right">Tarif Awal</th>
                  <th className="px-4 py-3.5 text-right">Tarif / KM</th>
                  <th className="px-4 py-3.5 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-400">
                      Tidak ada data tarif transport yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const rowNumber = startIndex + index + 1;
                    const kota = kotaList.find(k => Number(k.id_kota) === Number(item.id_kota));
                    const kotaName = kota?.nama_kota || item.nama_kota || item.kota?.nama_kota || `ID Kota: ${item.id_kota}`;
                    const targetId = getTarifId(item);

                    return (
                      <tr key={targetId ?? index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center font-medium text-slate-400">{rowNumber}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-slate-900">{kotaName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-800">{formatRupiah(item.tarif_awal)}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-800">{formatRupiah(item.tarif_per_kilometer)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-1.5 text-red-600 bg-red-50 border border-red-200/60 rounded hover:bg-red-100 transition-colors"
                              title="Hapus"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}