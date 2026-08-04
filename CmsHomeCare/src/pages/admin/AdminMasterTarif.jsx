import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaFileInvoiceDollar, FaArrowLeft, FaSave, FaConciergeBell } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllTarif, createTarifData, updateTarifData, deleteTarifData } from '../../data/masterTarifData';
import { getAllLayanan } from '../../data/layananData';
import Swal from 'sweetalert2';

export default function DataMasterTarif() {
  // Mode Tampilan: 'list' (Tabel) | 'add' (Full Page Form Tambah) | 'edit' (Full Page Form Edit)
  const [viewMode, setViewMode] = useState('list');

  const [tarifList, setTarifList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter State (Hanya dipasang di Mode List)
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Item untuk Edit
  const [selectedTarif, setSelectedTarif] = useState(null);

  // Form State (Dipergunakan untuk Tambah & Edit)
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState('tindakan');
  const [formBiayaAdmin, setFormBiayaAdmin] = useState('0');
  const [formPPN, setFormPPN] = useState('11');
  const [formFeeNakesPersen, setFormFeeNakesPersen] = useState('0');
  const [formFeeNakesNominal, setFormFeeNakesNominal] = useState('0');
  const [formTransport, setFormTransport] = useState('0');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Layanan State
  const [allLayanan, setAllLayanan] = useState([]);
  const [selectedLayananIds, setSelectedLayananIds] = useState([]);

  const fetchData = () => {
    getAllTarif()
      .then((data) => {
        setTarifList(data);
        setErrorMsg('');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data master tarif');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      fetchData();
      getAllLayanan().then(setAllLayanan).catch(console.error);
    });
  }, []);

  const toggleLayanan = (id) => {
    if (selectedLayananIds.includes(id)) {
      setSelectedLayananIds(selectedLayananIds.filter((item) => item !== id));
    } else {
      setSelectedLayananIds([...selectedLayananIds, id]);
    }
  };

  // Buka Halaman Form Tambah
  const handleOpenAddForm = () => {
    setSelectedTarif(null);
    setFormNama('');
    setFormKategori('tindakan');
    setFormBiayaAdmin('0');
    setFormPPN('11');
    setFormFeeNakesPersen('0');
    setFormFeeNakesNominal('0');
    setFormTransport('0');
    setFormActive(true);
    setSelectedLayananIds([]);
    setViewMode('add');
  };

  // Buka Halaman Form Edit
  const handleOpenEditForm = (item) => {
    setSelectedTarif(item);
    setFormNama(item.nama_template || '');
    setFormKategori(item.kategori_tarif || 'tindakan');
    setFormBiayaAdmin(item.biaya_admin ?? 0);
    setFormPPN(item.persentase_ppn ?? 0);
    setFormFeeNakesPersen(item.fee_nakes_persen ?? 0);
    setFormFeeNakesNominal(item.fee_nakes_nominal ?? 0);
    setFormTransport(item.tarif_transport_per_km ?? 0);
    setFormActive(Boolean(item.is_active));
    
    if (item.layanans) {
      setSelectedLayananIds(item.layanans.map(l => l.id_layanan));
    } else {
      setSelectedLayananIds([]);
    }

    setViewMode('edit');
  };

  // Kembali ke Tabel
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTarif(null);
  };

  // Handle Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nama_template: formNama,
      kategori_tarif: formKategori,
      biaya_admin: parseFloat(formBiayaAdmin) || 0,
      persentase_ppn: parseFloat(formPPN) || 0,
      fee_nakes_persen: parseFloat(formFeeNakesPersen) || 0,
      fee_nakes_nominal: parseFloat(formFeeNakesNominal) || 0,
      tarif_transport_per_km: parseFloat(formTransport) || 0,
      is_active: formActive ? 1 : 0,
      layanans: selectedLayananIds,
    };

    try {
      if (viewMode === 'edit' && selectedTarif) {
        await updateTarifData(selectedTarif.id_master_tarif, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Template master tarif diperbarui!' });
      } else {
        await createTarifData(payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Template master tarif baru ditambahkan!' });
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
    Swal.fire({
      title: 'Hapus Master Tarif?',
      text: `Anda yakin ingin menghapus template "${item.nama_template}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTarifData(item.id_master_tarif);
          Swal.fire('Terhapus!', 'Template tarif berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Gagal menghapus template tarif.', 'error');
        }
      }
    });
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredTarif = tarifList.filter((item) => {
    const matchesSearch = item.nama_template?.toLowerCase().includes(search.toLowerCase());
    const matchesKategori = filterKategori === '' || item.kategori_tarif === filterKategori;

    let matchesStatus = true;
    if (filterStatus !== '') {
      const isActive = item.is_active ? '1' : '0';
      matchesStatus = isActive === filterStatus;
    }

    return matchesSearch && matchesKategori && matchesStatus;
  });

  const totalPages = Math.max(Math.ceil(filteredTarif.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredTarif.slice(startIndex, startIndex + itemsPerPage);

  // ==========================================
  // TAMPILAN FULL PAGE FORM (TAMBAH / EDIT)
  // ==========================================
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        {/* Header & Back Button */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2"
            >
              <FaArrowLeft />
              <span>Kembali ke Master Tarif</span>
            </button>
            <h1 className="page-title">
              {viewMode === 'add' ? 'Tambah Template Master Tarif' : 'Edit Template Master Tarif'}
            </h1>
            <p className="page-subtitle">
              {viewMode === 'add'
                ? 'Buat skema perhitungan tarif baru untuk tindakan medis atau layanan.'
                : 'Perbarui rincian skema tarif dan persentase fee nakes.'}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Nama Template */}
              <div>
                <label className="form-label">
                  Nama Template Tarif <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tarif Tindakan Medis Standar"
                  className="form-input"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                />
              </div>

              {/* Kategori & Biaya Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Kategori Tarif <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="form-input"
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                  >
                    <option value="tindakan">Berdasarkan Tindakan</option>
                    <option value="waktu">Berdasarkan Waktu</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Biaya Admin (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-input"
                    value={formBiayaAdmin}
                    onChange={(e) => setFormBiayaAdmin(e.target.value)}
                  />
                </div>
              </div>

              {/* PPN & Transport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    PPN (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="form-input"
                    value={formPPN}
                    onChange={(e) => setFormPPN(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">
                    Tarif Transport per KM (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-input"
                    value={formTransport}
                    onChange={(e) => setFormTransport(e.target.value)}
                  />
                </div>
              </div>

              {/* Section Fee Nakes */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Pengaturan Fee Tenaga Medis (Nakes)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Fee Nakes (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Contoh: 70"
                      className="form-input bg-white"
                      value={formFeeNakesPersen}
                      onChange={(e) => setFormFeeNakesPersen(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Fee Nakes Nominal (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Contoh: 50000"
                      className="form-input bg-white"
                      value={formFeeNakesNominal}
                      onChange={(e) => setFormFeeNakesNominal(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  * Isi salah satu atau keduanya sesuai skema bagi hasil dengan nakes.
                </p>
              </div>

              {/* Informational Card: Layanan Terkait (Terutama di Mode Edit) */}
              {viewMode === 'edit' && selectedTarif && (
                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                    <FaConciergeBell />
                    <span>Layanan Menggunakan Template Ini ({selectedTarif.layanans?.length || 0})</span>
                  </div>

                  {selectedTarif.layanans && selectedTarif.layanans.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedTarif.layanans.map((lay) => (
                        <span
                          key={lay.id_layanan}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 border border-teal-200 shadow-xs"
                        >
                          <span>{lay.nama_layanan}</span>
                          <span className="text-[10px] text-teal-500 font-normal">(Rp {lay.harga?.toLocaleString('id-ID')})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Belum ada layanan yang ditautkan ke template tarif ini. Anda dapat memilih template ini dari menu manajemen Layanan.
                    </p>
                  )}
                </div>
              )}

              {/* Piliha Layanan */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Pilih Layanan Terkait</h3>
                {allLayanan.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allLayanan.map((lay) => (
                      <label key={lay.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-slate-50 p-2 rounded border border-transparent hover:border-slate-200 transition-all">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          checked={selectedLayananIds.includes(lay.id)}
                          onChange={() => toggleLayanan(lay.id)}
                        />
                        <span className="text-slate-700 flex-1 truncate">{lay.nama}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Tidak ada data layanan tersedia.</p>
                )}
              </div>

              {/* Status Checkbox */}
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="tarif-status-checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <label htmlFor="tarif-status-checkbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Template Aktif (Bisa digunakan untuk Layanan)
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={handleBackToList} className="btn-outline">
                Batal
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                <FaSave />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Template Tarif'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN TABLE & LIST DATA (MODE DEFAULT)
  // ==========================================
  return (
    <div>
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Master Tarif</h1>
          <p className="page-subtitle">Atur template skema tarif tindakan, pembagian fee nakes, biaya admin, dan transport.</p>
        </div>
        <button onClick={handleOpenAddForm} className="btn-primary flex items-center justify-center gap-2">
          <FaPlus />
          <span>Tambah Template Tarif</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-5 flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama template tarif..."
              className="w-full bg-transparent outline-none"
            />
          </div>

          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterKategori}
            onChange={(e) => {
              setFilterKategori(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Kategori</option>
            <option value="tindakan">Berdasarkan Tindakan</option>
            <option value="waktu">Berdasarkan Waktu</option>
          </select>

          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {/* Table Section */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data master tarif...</p>
          ) : (
            <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nama Template & Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Kategori</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Biaya Admin</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">PPN (%)</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Fee Nakes</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Transport / KM</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada template tarif yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id_master_tarif} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 mt-0.5">
                            <FaFileInvoiceDollar className="text-base" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.nama_template}</div>
                            <div className="text-xs text-slate-400">ID: #{item.id_master_tarif}</div>

                            {/* Render Daftar Layanan Terhubung */}
                            {item.layanans && item.layanans.length > 0 ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.layanans.map((lay) => (
                                  <span
                                    key={lay.id_layanan}
                                    className="inline-block rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 border border-teal-200"
                                  >
                                    {lay.nama_layanan}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic mt-0.5 block">
                                Belum ada layanan terhubung
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${item.kategori_tarif === 'tindakan'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                            }`}
                        >
                          {item.kategori_tarif}
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-medium text-slate-800">
                        {formatRupiah(item.biaya_admin)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center font-semibold text-slate-700">
                        {item.persentase_ppn}%
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="text-slate-800 font-medium">
                          {item.fee_nakes_persen ? `${item.fee_nakes_persen}%` : '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.fee_nakes_nominal ? formatRupiah(item.fee_nakes_nominal) : 'Nominal: -'}
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-right font-medium text-slate-800">
                        {formatRupiah(item.tarif_transport_per_km)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        {item.is_active ? (
                          <span className="badge badge-aktif">Aktif</span>
                        ) : (
                          <span className="badge badge-nonaktif">Nonaktif</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Template"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            title="Hapus Template"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredTarif.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}